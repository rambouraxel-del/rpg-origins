// Contrôles bloquants AVANT tout appel payant. Chaque refus lève une GuardError (code stable, testable).
import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { estimateUsd, type CostInput } from './cost.ts';
import { UNKNOWN_SESSION, loadConfig, loadPricing } from './config.ts';
import { calls, failReason, observedTokensPerMp, summarize, verdictOf, type Call, type LedgerEvent } from './ledger.ts';
import { assetsHash, codeHash } from './proof.ts';
import { similarity, words } from './text.ts';

export class GuardError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export interface Decision {
  kind: 'generate' | 'edit';
  prompt: string;
  n: number;
  model: string;
  quality: string;
  size: string;
  inputImages: number;
  outputFile: string;
  purpose?: string;
  target?: string;
  reuseChecked?: string;
  qualityReason?: string;
  newApproach?: string;
  overrideReason?: string;
  task?: string;
  overwrite?: boolean;
  /** Code lu sur la planche de contact produite par `image:inventory` (preuve d'examen visuel des assets). */
  inventoryCode?: string;
}

const CODE_TRANSFORM = /\b(redimensionn\w*|resize\w*|rescal\w*|upscal\w*|downscal\w*|recadr\w*|crop\w*|miroir|mirror\w*|flip\w*|retourn\w*|rotat\w*|pivot\w*|teinte|recolor\w*|hue|luminosit\w*|brightness|contrast\w*)\b/i;
export const taskKey = (d: Pick<Decision, 'task' | 'purpose'>) =>
  (d.task || d.purpose || 'sans-tache').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

/** Assets déjà présents qui ressemblent à la demande (information affichée, non bloquante). */
export function existingCandidates(d: Decision, root = 'public/assets'): string[] {
  const want = words(`${d.purpose ?? ''} ${d.target ?? ''} ${d.prompt}`);
  const out: string[] = [];
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(png|webp|gif|jpg)$/i.test(f)) {
        const hit = [...words(basename(f).replace(/\.[^.]+$/, ''))].filter((w) => want.has(w));
        if (hit.length > 0) out.push(p);
      }
    }
  };
  walk(root);
  return out;
}

/** Preuve d'examen des assets : code lu sur la planche de contact, valable une fois, pour cette session et cet état des assets. */
function checkInventory(d: Decision, events: LedgerEvent[], session: string, maxAgeMin: number): string {
  if (!(d.inventoryCode ?? '').trim()) {
    throw new GuardError('NO_INVENTORY', "Avant de générer : `npm run image:inventory`, regardez la planche de contact produite, puis passez le code lu dessus avec --inventory-code.");
  }
  const used = new Set(events.filter((e) => e.ev === 'reserve').map((e) => e.inventoryId));
  const match = [...events].reverse().find((e) => e.ev === 'inventory' && e.session === session && !used.has(e.id) && e.codeHash === codeHash(d.inventoryCode!, String(e.id)));
  if (!match) throw new GuardError('INVENTORY_INVALID', "Code d'inventaire inconnu, déjà utilisé ou issu d'une autre session : refaites `npm run image:inventory` et lisez le code sur l'image.");
  if (Date.now() - Date.parse(match.ts) > maxAgeMin * 60_000) throw new GuardError('INVENTORY_EXPIRED', `Inventaire trop ancien (> ${maxAgeMin} min) : refaites \`npm run image:inventory\`.`);
  if (match.assetsHash !== assetsHash()) throw new GuardError('INVENTORY_STALE', "Les assets ont changé depuis l'inventaire : refaites `npm run image:inventory`.");
  return String(match.id);
}

export interface Preflight {
  estUsd: number;
  task: string;
  recovered: boolean;
  inventoryId: string;
  warnings: string[];
}

/** Lève GuardError si l'appel doit être bloqué. Ne modifie rien. */
export function preflight(d: Decision, events: LedgerEvent[], session: string): Preflight {
  const cfg = loadConfig();
  const pricing = loadPricing();
  const warnings: string[] = [];
  const task = taskKey(d);
  const unknownSession = session === UNKNOWN_SESSION;

  // Limites techniques
  if (!Number.isInteger(d.n) || d.n < 1 || d.n > cfg.maxImagesPerCall) {
    throw new GuardError('MAX_PER_CALL', `n doit être un entier entre 1 et ${cfg.maxImagesPerCall} (reçu : ${d.n}).`);
  }
  if (!d.prompt.trim()) throw new GuardError('NO_PROMPT', 'Prompt vide.');

  // Décision : bénéfice réel, réutilisation, qualité minimale
  if ((d.purpose ?? '').trim().length < 15) {
    throw new GuardError('NO_PURPOSE', 'Indiquez --purpose (≥ 15 caractères) : quel bénéfice concret pour le jeu ? Pas de génération pour expérimenter.');
  }
  if (!(d.target ?? '').trim()) {
    throw new GuardError('NO_TARGET', 'Indiquez --target : où l\'image sera utilisée dans le jeu (zone, fichier, écran).');
  }
  if ((d.reuseChecked ?? '').trim().length < 15) {
    throw new GuardError('NO_REUSE_CHECK', 'Indiquez --reuse-checked (≥ 15 caractères) : assets existants examinés (voir `npm run image:status`) et pourquoi une transformation par code ne suffit pas.');
  }
  const override = (d.overrideReason ?? '').trim().length >= 15;
  if (CODE_TRANSFORM.test(`${d.prompt} ${d.purpose}`) && !override) {
    throw new GuardError('CODE_TRANSFORM', 'La demande ressemble à une transformation simple (redimensionner, recadrer, miroir, rotation, teinte…) : faites-la par code. Sinon justifiez avec --override-reason (≥ 15 caractères).');
  }
  if (d.quality !== 'low' && (d.qualityReason ?? '').trim().length < 15) {
    throw new GuardError('QUALITY_JUSTIFICATION', `La qualité la moins chère ("low") est la valeur par défaut ; "${d.quality}" exige --quality-reason (≥ 15 caractères), par ex. après échecs documentés en low.`);
  }
  if (existsSync(d.outputFile) && !d.overwrite) {
    throw new GuardError('OUTPUT_EXISTS', `${d.outputFile} existe déjà : choisissez un autre nom ou ajoutez --overwrite.`);
  }

  const inventoryId = checkInventory(d, events, session, cfg.inventoryMaxAgeMinutes);

  // Historique : revue obligatoire, redondance, échecs comparables
  const all = calls(events).filter((c) => c.state !== 'released');
  const mine = all.filter((c) => c.reserve.task === task);
  const unreviewed = mine.find((c) => c.state === 'settled' && verdictOf(c) === undefined);
  if (unreviewed) {
    throw new GuardError('REVIEW_PENDING', `Le résultat précédent de la tâche "${task}" n'a pas été évalué (${(unreviewed.settle?.files as string[] | undefined)?.[0] ?? unreviewed.id}). Regardez l'image puis : npm run image:review -- --file <png> --verdict ok|fail --reason <catégorie>.`);
  }
  if (!override) {
    for (const c of all) {
      const verdict = verdictOf(c);
      if (c.state === 'settled' && verdict !== 'fail' && similarity(d.prompt, String(c.reserve.prompt ?? '')) >= cfg.similarityThreshold) {
        throw new GuardError('REDUNDANT', `Prompt très proche d'une génération existante (${(c.settle?.files as string[] | undefined)?.[0] ?? c.id}) : réutilisez ou transformez ce résultat. Sinon --override-reason.`);
      }
    }
  }
  let epoch: Call[] = [];
  for (const c of mine) {
    if (c.reserve.newApproach) epoch = [];
    epoch.push(c);
  }
  const failed = epoch.filter((c) => verdictOf(c) === 'fail');
  const byReason = new Map<string, number>();
  for (const c of failed) {
    const r = failReason(c);
    byReason.set(r, (byReason.get(r) ?? 0) + 1);
  }
  const repeated = [...byReason.entries()].find(([, n]) => n >= cfg.maxComparableFailures);
  if (repeated) {
    const novel = (d.newApproach ?? '').trim().length >= 20 && failed.every((c) => similarity(d.prompt, String(c.reserve.prompt ?? '')) < 0.8);
    if (!novel) {
      throw new GuardError('REPEATED_FAILURE', `${repeated[1]} échecs comparables ("${repeated[0]}") sur la tâche "${task}". Revoyez l'approche : --new-approach "<ce qui change>" (≥ 20 caractères) et un prompt nettement différent, ou abandonnez / traitez par code.`);
    }
  }

  // Plafonds : session puis budget mensuel (avec marge)
  const sum = summarize(events, session);
  // Registre récupéré ou identifiant de session non fiable : plafond conservateur.
  const conservative = sum.recovered || unknownSession;
  const maxSession = conservative ? Math.min(cfg.maxImagesPerSession, cfg.recoveredLedger.maxImagesPerSession) : cfg.maxImagesPerSession;
  if (sum.sessionImages + d.n > maxSession) {
    throw new GuardError('SESSION_LIMIT', `Limite de session atteinte : ${sum.sessionImages} images déjà comptées + ${d.n} > ${maxSession}${sum.recovered ? ' (mode registre récupéré)' : ''}${unknownSession ? ' (identifiant de session non fiable : compteur partagé sur le mois)' : ''}.`);
  }
  const estUsd = estimateUsd(pricing, { model: d.model, quality: d.quality, size: d.size, n: d.n, promptChars: d.prompt.length, inputImages: d.inputImages } satisfies CostInput, observedTokensPerMp(events));
  const budget = sum.recovered ? Math.min(cfg.monthlyBudgetUsd, cfg.recoveredLedger.monthlyBudgetUsd) : cfg.monthlyBudgetUsd;
  const usable = budget * (1 - cfg.safetyMargin);
  if (sum.monthCountedUsd + estUsd > usable) {
    throw new GuardError('BUDGET', `Budget bloquant : ${sum.monthCountedUsd.toFixed(4)} $ déjà comptés + ${estUsd.toFixed(4)} $ estimés > ${usable.toFixed(2)} $ utilisables (budget ${budget} $, marge ${cfg.safetyMargin * 100} %${sum.recovered ? ', registre récupéré' : ''}).`);
  }
  if (!pricing.rates.verified) warnings.push(`Prix par token non vérifiés : estimation multipliée par ${pricing.rates.unverifiedRatesFactor}.`);
  if (unknownSession) warnings.push('Identifiant de session Claude Code Cloud introuvable : limites conservatrices (20 images, compteur partagé).');
  if (sum.recovered) warnings.push('Registre recréé (environnement recréé ?) : plafonds conservateurs appliqués.');
  const candidates = existingCandidates(d);
  if (candidates.length) warnings.push(`Assets existants possiblement réutilisables : ${candidates.slice(0, 5).join(', ')}`);
  return { estUsd, task, recovered: sum.recovered, inventoryId, warnings };
}
