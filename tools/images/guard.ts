// Contrôles bloquants AVANT tout appel payant. Chaque refus lève une GuardError (code stable, testable).
import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { estimateUsd, type CostInput } from './cost.ts';
import { loadConfig, loadPricing } from './config.ts';
import { calls, summarize, type Call, type LedgerEvent } from './ledger.ts';

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
}

const CODE_TRANSFORM = /\b(redimensionn\w*|resize\w*|rescal\w*|upscal\w*|downscal\w*|recadr\w*|crop\w*|miroir|mirror\w*|flip\w*|retourn\w*|rotat\w*|pivot\w*|teinte|recolor\w*|hue|luminosit\w*|brightness|contrast\w*)\b/i;
const STOP = new Set(['avec', 'dans', 'pour', 'sans', 'vers', 'cette', 'that', 'with', 'from', 'this', 'into', 'sont', 'plus', 'tres', 'very', 'game', 'jeu']);

export const words = (s: string): Set<string> =>
  new Set(s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP.has(w)));

export function similarity(a: string, b: string): number {
  const A = words(a), B = words(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

export const taskKey = (d: Pick<Decision, 'task' | 'purpose'>) =>
  (d.task || d.purpose || 'sans-tache').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const lastVerdict = (c: Call) => c.reviews.at(-1);

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

export interface Preflight {
  estUsd: number;
  task: string;
  recovered: boolean;
  warnings: string[];
}

/** Lève GuardError si l'appel doit être bloqué. Ne modifie rien. */
export function preflight(d: Decision, events: LedgerEvent[], session: string): Preflight {
  const cfg = loadConfig();
  const pricing = loadPricing();
  const warnings: string[] = [];
  const task = taskKey(d);

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

  // Historique : revue obligatoire, redondance, échecs comparables
  const all = calls(events).filter((c) => c.state !== 'released');
  const mine = all.filter((c) => c.reserve.task === task);
  const unreviewed = mine.find((c) => c.state === 'settled' && c.reviews.length === 0);
  if (unreviewed) {
    throw new GuardError('REVIEW_PENDING', `Le résultat précédent de la tâche "${task}" n'a pas été évalué (${(unreviewed.settle?.files as string[] | undefined)?.[0] ?? unreviewed.id}). Regardez l'image puis : npm run image:review -- --file <png> --verdict ok|fail --reason <catégorie>.`);
  }
  if (!override) {
    for (const c of all) {
      const verdict = lastVerdict(c)?.verdict;
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
  const failed = epoch.filter((c) => lastVerdict(c)?.verdict === 'fail');
  const byReason = new Map<string, number>();
  for (const c of failed) {
    const r = String(lastVerdict(c)?.reason ?? 'other');
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
  const maxSession = sum.recovered ? Math.min(cfg.maxImagesPerSession, cfg.recoveredLedger.maxImagesPerSession) : cfg.maxImagesPerSession;
  if (sum.sessionImages + d.n > maxSession) {
    throw new GuardError('SESSION_LIMIT', `Limite de session atteinte : ${sum.sessionImages} images déjà comptées + ${d.n} > ${maxSession}${sum.recovered ? ' (mode registre récupéré)' : ''}.`);
  }
  const estUsd = estimateUsd(pricing, { model: d.model, quality: d.quality, size: d.size, n: d.n, promptChars: d.prompt.length, inputImages: d.inputImages } satisfies CostInput);
  const budget = sum.recovered ? Math.min(cfg.monthlyBudgetUsd, cfg.recoveredLedger.monthlyBudgetUsd) : cfg.monthlyBudgetUsd;
  const usable = budget * (1 - cfg.safetyMargin);
  if (sum.monthCountedUsd + estUsd > usable) {
    throw new GuardError('BUDGET', `Budget bloquant : ${sum.monthCountedUsd.toFixed(4)} $ déjà comptés + ${estUsd.toFixed(4)} $ estimés > ${usable.toFixed(2)} $ utilisables (budget ${budget} $, marge ${cfg.safetyMargin * 100} %${sum.recovered ? ', registre récupéré' : ''}).`);
  }
  if (!pricing.verified) warnings.push(`Tarifs non vérifiés : estimation multipliée par ${pricing.unverifiedSafetyFactor}.`);
  if (sum.recovered) warnings.push('Registre recréé (environnement recréé ?) : plafonds conservateurs appliqués.');
  const candidates = existingCandidates(d);
  if (candidates.length) warnings.push(`Assets existants possiblement réutilisables : ${candidates.slice(0, 5).join(', ')}`);
  return { estUsd, task, recovered: sum.recovered, warnings };
}
