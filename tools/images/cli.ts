// Commandes : generate | edit | review | status  (via npm run image:*)
import { parseArgs } from 'node:util';
import { DEFAULT_MODEL, loadConfig, loadPricing, paths, sessionInfo } from './config.ts';
import { persistenceStatus, readLedger, summarize } from './ledger.ts';
import { GuardError, createInspection, createInventory, editImage, generateImage, reviewImage } from './openai-images.ts';

const mode = process.argv[2];
const { values } = parseArgs({
  args: process.argv.slice(3),
  options: {
    prompt: { type: 'string', short: 'p' }, input: { type: 'string', short: 'i', multiple: true }, mask: { type: 'string' },
    output: { type: 'string', short: 'o' }, model: { type: 'string', short: 'm' }, quality: { type: 'string', short: 'q' },
    size: { type: 'string', short: 's' }, n: { type: 'string' },
    purpose: { type: 'string' }, target: { type: 'string' }, 'reuse-checked': { type: 'string' }, 'quality-reason': { type: 'string' },
    'new-approach': { type: 'string' }, 'override-reason': { type: 'string' }, task: { type: 'string' }, overwrite: { type: 'boolean' },
    file: { type: 'string', short: 'f' }, query: { type: 'string' }, 'inventory-code': { type: 'string' }, code: { type: 'string' }, verdict: { type: 'string' }, reason: { type: 'string' }, note: { type: 'string' },
  },
});

function usage(): never {
  console.error(`Usage :
  1. npm run image:inventory [-- --query "mots du besoin"]     → planche de contact des assets existants : LA REGARDER, lire le code
  2. npm run image:generate -- --prompt "..." --purpose "..." --target "..." --reuse-checked "..." --inventory-code <code lu> [--output x.png] [--quality low] [--size 1536x864] [--n 1]
     npm run image:edit     -- --input src.png --prompt "..." (mêmes options)  [--mask m.png]
  3. npm run image:inspect -- --file public/assets/generated/x.png        → aperçu : LE REGARDER, lire le code
  4. npm run image:review  -- --file public/assets/generated/x.png --verdict ok|fail --code <code lu> [--reason style|composition|artefact|contenu] [--note "..."]
  npm run image:status
Options avancées : --task, --quality-reason, --new-approach, --override-reason, --overwrite. Modèle par défaut : ${DEFAULT_MODEL}.`);
  process.exit(2);
}

function status(): void {
  const cfg = loadConfig();
  const pricing = loadPricing();
  const ses = sessionInfo();
  const s = summarize(readLedger(ses.id), ses.id);
  const conservative = s.recovered || !ses.reliable;
  const budgetEur = s.recovered ? Math.min(cfg.plannedBudgetEur, cfg.recoveredLedger.plannedBudgetEur) : cfg.plannedBudgetEur;
  const maxSession = conservative ? Math.min(cfg.maxImagesPerSession, cfg.recoveredLedger.maxImagesPerSession) : cfg.maxImagesPerSession;
  const committedEur = s.totalCountedUsd * cfg.eurPerUsdBound * cfg.feeFactor;
  console.log(`Session ${ses.id} (${ses.reliable ? 'identifiant fiable' : 'IDENTIFIANT NON FIABLE : compteur partagé et plafonds conservateurs'}, source : ${ses.source})`);
  console.log(`  ${s.sessionImages}/${maxSession} images, ${s.sessionCountedUsd.toFixed(4)} $ comptés`);
  console.log(`Cumul du jeu : ${committedEur.toFixed(4)} € engagés (réservations et dépenses, conversion bornée 1 $ = ${cfg.eurPerUsdBound} €, frais x${cfg.feeFactor}) sur ${budgetEur} € planifiés (plafond absolu ${cfg.hardCapEur} €, protection de 3 € comprise) — reste ${Math.max(0, budgetEur - committedEur).toFixed(4)} €`);
  console.log(`Mois ${s.month} : ${s.monthImages} images — estimé ${s.monthEstUsd.toFixed(4)} $ | calculé depuis les tokens ${s.monthObsUsd.toFixed(4)} $ | compté ${s.monthCountedUsd.toFixed(4)} $`);
  const pers = persistenceStatus();
  console.log(`Registre : ${paths().ledger}${s.recovered ? '  [RÉCUPÉRÉ : plafonds conservateurs]' : ''}`);
  console.log(`Persistance : ${pers.detail}`);
  console.log(`Prix par token : ${pricing.rates.verified ? `renseignés (${pricing.rates.tier}, ${pricing.rates.checkedOn})` : `NON VÉRIFIÉS (estimations x${pricing.rates.unverifiedRatesFactor})`} | nombre de tokens : estimation prudente x${pricing.tokenEstimates.safetyFactor}`);
  console.log('Rappel : estimations et calculs ne sont pas la facture OpenAI ; les dépenses hors de cet outil, ou d\'autres branches/sessions non fusionnées, ne sont pas comptées.');
}

try {
  if (mode === 'status') {
    status();
  } else if (mode === 'inventory') {
    const inv = await createInventory(values.query ?? '');
    if (inv.refCount > 0) console.log(`Vignettes 1 à ${inv.refCount} : références officielles du style n°9 (à comparer avec tout ce qui sera généré).`);
    console.log(`${inv.listed.length} asset(s) image dans le jeu :`);
    inv.listed.forEach((a) => console.log(`  ${a.generated ? '[essai généré] ' : ''}${a.path} (${a.size} octets)`));
    console.log(`\nPlanche de contact : ${inv.sheet}`);
    console.log('Ouvrez cette image (outil Read), examinez les assets, puis lisez le code à 4 chiffres en haut à gauche.');
    console.log('Il est exigé par `image:generate --inventory-code` ; il n\'est affiché nulle part ailleurs.');
  } else if (mode === 'inspect') {
    if (!values.file) usage();
    const ins = await createInspection(values.file!);
    console.log(`Aperçu : ${ins.preview}`);
    console.log('Ouvrez cette image (outil Read), jugez le résultat, puis lisez le code à 4 chiffres en haut à gauche pour `image:review --code`.');
  } else if (mode === 'review') {
    if (!values.file || (values.verdict !== 'ok' && values.verdict !== 'fail')) usage();
    await reviewImage(values.file!, values.verdict as 'ok' | 'fail', values.reason ?? (values.verdict === 'ok' ? 'ok' : ''), values.note, values.code ?? '');
    console.log(`Revue enregistrée : ${values.file} → ${values.verdict}`);
  } else if (mode === 'generate' || mode === 'edit') {
    if (!values.prompt || (mode === 'edit' && !values.input?.length)) usage();
    if ((values.n ? Number(values.n) : 1) > loadConfig().policyImagesPerCall) throw new GuardError('POLICY_ONE_PER_CALL', `Politique du projet : ${loadConfig().policyImagesPerCall} image par appel.`);
    const common = {
      prompt: values.prompt!, model: values.model, quality: values.quality, size: values.size, output: values.output, n: values.n ? Number(values.n) : 1,
      purpose: values.purpose ?? '', target: values.target ?? '', reuseChecked: values['reuse-checked'] ?? '',
      inventoryCode: values['inventory-code'], qualityReason: values['quality-reason'], newApproach: values['new-approach'], overrideReason: values['override-reason'], task: values.task, overwrite: values.overwrite,
    };
    const r = mode === 'generate' ? await generateImage(common) : await editImage({ ...common, inputs: values.input!, mask: values.mask });
    console.log(`OK : ${r.files.join(', ')}`);
    console.log(`Coût : estimé ${r.estUsd.toFixed(4)} $ | calculé depuis les tokens ${r.computedUsd === null ? 'indisponible' : r.computedUsd.toFixed(4) + ' $'} (≠ facture)`);
    for (const w of r.warnings) console.log(`Avertissement : ${w}`);
    for (const i of r.issues) console.log(`PROBLÈME TECHNIQUE : ${i}`);
    console.log('Étape suivante : `npm run image:inspect -- --file <png>`, regarder l\'aperçu, puis `image:review` avec le code lu.');
    const pers = persistenceStatus();
    if (pers.uncommitted) console.log(`Persistance : ${pers.detail}`);
  } else {
    usage();
  }
} catch (e) {
  const blocked = e instanceof GuardError;
  console.error(`${blocked ? `BLOQUÉ [${(e as GuardError).code}]` : 'ÉCHEC'} : ${(e as Error).message}`);
  process.exit(blocked ? 3 : 1); // aucune nouvelle tentative automatique
}
