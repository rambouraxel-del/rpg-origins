// Commandes : generate | edit | review | status  (via npm run image:*)
import { parseArgs } from 'node:util';
import { DEFAULT_MODEL, loadConfig, loadPricing, paths, sessionId } from './config.ts';
import { readLedger, summarize } from './ledger.ts';
import { GuardError, editImage, generateImage, reviewImage } from './openai-images.ts';

const mode = process.argv[2];
const { values } = parseArgs({
  args: process.argv.slice(3),
  options: {
    prompt: { type: 'string', short: 'p' }, input: { type: 'string', short: 'i', multiple: true }, mask: { type: 'string' },
    output: { type: 'string', short: 'o' }, model: { type: 'string', short: 'm' }, quality: { type: 'string', short: 'q' },
    size: { type: 'string', short: 's' }, n: { type: 'string' },
    purpose: { type: 'string' }, target: { type: 'string' }, 'reuse-checked': { type: 'string' }, 'quality-reason': { type: 'string' },
    'new-approach': { type: 'string' }, 'override-reason': { type: 'string' }, task: { type: 'string' }, overwrite: { type: 'boolean' },
    file: { type: 'string', short: 'f' }, verdict: { type: 'string' }, reason: { type: 'string' }, note: { type: 'string' },
  },
});

function usage(): never {
  console.error(`Usage :
  npm run image:status
  npm run image:generate -- --prompt "..." --purpose "..." --target "..." --reuse-checked "..." [--output x.png] [--quality low] [--size 1536x864] [--n 1]
  npm run image:edit     -- --input src.png --prompt "..." --purpose ... --target ... --reuse-checked ... [--mask m.png]
  npm run image:review   -- --file public/assets/generated/x.png --verdict ok|fail [--reason composition|style|artefact|contenu|autre] [--note "..."]
Options avancées : --task, --quality-reason, --new-approach, --override-reason, --overwrite. Modèle par défaut : ${DEFAULT_MODEL}.`);
  process.exit(2);
}

function status(): void {
  const cfg = loadConfig();
  const pricing = loadPricing();
  const s = summarize(readLedger(sessionId()), sessionId());
  const budget = s.recovered ? Math.min(cfg.monthlyBudgetUsd, cfg.recoveredLedger.monthlyBudgetUsd) : cfg.monthlyBudgetUsd;
  const usable = budget * (1 - cfg.safetyMargin);
  const maxSession = s.recovered ? Math.min(cfg.maxImagesPerSession, cfg.recoveredLedger.maxImagesPerSession) : cfg.maxImagesPerSession;
  console.log(`Session ${sessionId()} : ${s.sessionImages}/${maxSession} images, ${s.sessionCountedUsd.toFixed(4)} $ comptés`);
  console.log(`Mois ${s.month} : ${s.monthImages} images — estimé ${s.monthEstUsd.toFixed(4)} $ | calculé depuis les tokens ${s.monthObsUsd.toFixed(4)} $ | compté ${s.monthCountedUsd.toFixed(4)} $`);
  console.log(`Plafond utilisable : ${usable.toFixed(2)} $ (budget ${budget} $, marge ${cfg.safetyMargin * 100} %) — reste ${Math.max(0, usable - s.monthCountedUsd).toFixed(4)} $`);
  console.log(`Registre : ${paths().ledger}${s.recovered ? '  [RÉCUPÉRÉ : plafonds conservateurs]' : ''}`);
  console.log(`Tarifs : ${pricing.verified ? `vérifiés (${pricing.checkedOn})` : `NON VÉRIFIÉS (estimations x${pricing.unverifiedSafetyFactor})`}`);
  console.log('Rappel : estimations et calculs ne sont pas la facture OpenAI ; les dépenses hors de cet outil ne sont pas comptées.');
}

try {
  if (mode === 'status') {
    status();
  } else if (mode === 'review') {
    if (!values.file || (values.verdict !== 'ok' && values.verdict !== 'fail')) usage();
    await reviewImage(values.file!, values.verdict as 'ok' | 'fail', values.reason ?? (values.verdict === 'ok' ? 'ok' : ''), values.note);
    console.log(`Revue enregistrée : ${values.file} → ${values.verdict}`);
  } else if (mode === 'generate' || mode === 'edit') {
    if (!values.prompt || (mode === 'edit' && !values.input?.length)) usage();
    const common = {
      prompt: values.prompt!, model: values.model, quality: values.quality, size: values.size, output: values.output, n: values.n ? Number(values.n) : 1,
      purpose: values.purpose ?? '', target: values.target ?? '', reuseChecked: values['reuse-checked'] ?? '',
      qualityReason: values['quality-reason'], newApproach: values['new-approach'], overrideReason: values['override-reason'], task: values.task, overwrite: values.overwrite,
    };
    const r = mode === 'generate' ? await generateImage(common) : await editImage({ ...common, inputs: values.input!, mask: values.mask });
    console.log(`OK : ${r.files.join(', ')}`);
    console.log(`Coût : estimé ${r.estUsd.toFixed(4)} $ | calculé depuis les tokens ${r.computedUsd === null ? 'indisponible' : r.computedUsd.toFixed(4) + ' $'} (≠ facture)`);
    for (const w of r.warnings) console.log(`Avertissement : ${w}`);
    for (const i of r.issues) console.log(`PROBLÈME TECHNIQUE : ${i}`);
    console.log('Étape suivante : examiner l\'image puis npm run image:review -- --file <png> --verdict ok|fail');
  } else {
    usage();
  }
} catch (e) {
  const blocked = e instanceof GuardError;
  console.error(`${blocked ? `BLOQUÉ [${(e as GuardError).code}]` : 'ÉCHEC'} : ${(e as Error).message}`);
  process.exit(blocked ? 3 : 1); // aucune nouvelle tentative automatique
}
