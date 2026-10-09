// Consolide les résultats des parcours automatisés (/tmp/autoplay-*.json) dans production/verified.json et production/evidence/.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
const files = readdirSync('/tmp').filter((f) => /^autoplay-.+\.json$/.test(f));
mkdirSync('production/evidence', { recursive: true });
const scenes = new Set(), quests = new Set();
const runs = [];
for (const f of files) {
  const j = JSON.parse(readFileSync('/tmp/' + f, 'utf8'));
  const r = j.result;
  if (!r) continue;
  const final = r.flags?.ending ?? null;
  runs.push({ tag: f.replace(/^autoplay-|\.json$/g, ''), route: j.route, mercy: j.mercy, scenes: r.completed.length, ending: final, secondes: Math.round(j.seconds), erreursConsole: j.errors.length, quetes: Object.entries(r.quests).filter(([, v]) => v === 'completed').length, quetesOuvertes: Object.entries(r.quests).filter(([, v]) => v === 'left_open').length, pouvoirs: r.powers.length, accords: r.accords.length, flags: { origin_confession: r.flags.origin_confession, ilyra_support: r.flags.ilyra_support, b_mercy: r.flags.b_mercy, b_archive_cache: r.flags.b_archive_cache, b_truth_told: r.flags.b_truth_told, elyan_status: r.flags.elyan_status, final_route: r.flags.final_route } });
  if (final) for (const s of r.completed) scenes.add(s);
  for (const [q, v] of Object.entries(r.quests)) if (v === 'completed') quests.add(q);
  copyFileSync('/tmp/' + f, 'production/evidence/' + f);
  for (const e of ['/tmp/epilogue-' + f.replace(/^autoplay-|\.json$/g, '') + '.txt']) if (existsSync(e)) copyFileSync(e, 'production/evidence/' + e.split('/').pop());
}
writeFileSync('production/verified.json', JSON.stringify({ generated: new Date().toISOString(), method: 'tools/e2e/autoplay.mjs (moteur et données réels ; téléportation vers les zones d\'objectif ; voir docs/LANCEMENT.md)', scenes: [...scenes].sort(), quests: [...quests].sort(), runs }, null, 1));
console.log(JSON.stringify(runs, null, 1));
console.log('scènes vérifiées :', scenes.size, '— quêtes :', quests.size);
