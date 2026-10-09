// Captures de contrôle : les 27 lieux (avec compagnons et figurants à l'échelle réelle), les interfaces, trois tailles de fenêtre.
// Usage : node tools/e2e/shots.mjs <dossier_sortie>
import { launch, ev, sleep } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const out = process.argv[2] ?? '/tmp/shots';
mkdirSync(out, { recursive: true });
const { browser, page, logs } = await launch({ url: `${process.env.E2E_BASE ?? 'http://127.0.0.1:4173'}/?dev=1&jump=C09S05` });
await sleep(6000);
const LOCS = await ev(page, () => [...window.__hub.locations.keys()]);
const CAST = { palace_garden: ['mira', 'jardinier'], palace_hall: ['oren', 'adrien'], palace_portal: ['oren', 'civil'], forest_arrival: ['lume', 'oiseau'], forest_crossing: ['bete', 'soren'], root_shrine: ['eira'], lisiere_square: ['darel', 'lume', 'habitant'], lisiere_well: ['darel'], river_bank: ['meunier', 'pecheur'], river_relay: ['gardien', 'tessa'], water_shrine: ['tessa'], miral_gate: ['ysane', 'arven'], memory_garden: ['meline', 'eira'], memory_shrine: ['eira'], stellar_dock: ['ravel', 'stellaire'], stellar_command: ['vaelor', 'ilyra'], stellar_lab: ['ilyra', 'technicien'], chronal_chamber: ['technicien'], occupied_archive: ['soldat'], archive_core: ['oren'], valley_camp: ['refugiee', 'soldat'], valley_relay: [], valley_bridge: ['ravel', 'automate'], valley_outlook: [], core_approach: ['automate', 'sentinelle'], core_gate: ['vaelor'], planet_heart: ['eira', 'vaelor', 'pompage'] };
for (const id of LOCS) {
  await ev(page, async ([id, cast]) => {
    const H = window.__hub, w = H.world;
    w.director.abort(); H.ui.reset();
    H.state.party = ['nara', 'soren', 'tessa'];
    await w.loadLocation(id, 'default');
    const a = Object.values(w.loc.anchors).filter((_, i) => i < cast.length + 1);
    w.placeActors(cast.map((c, i) => ({ id: c, at: a[i + 1] ?? a[0] })).filter((x) => x.at));
    w.syncFollowers(true);
    H.ui.setHud(true); H.ui.objective(null);
  }, [id, CAST[id] ?? []]);
  await sleep(500);
  await page.screenshot({ path: `${out}/loc-${id}.png` });
}
// interfaces
const shot = async (name, fn, wait = 700) => { await ev(page, fn); await sleep(wait); await page.screenshot({ path: `${out}/ui-${name}.png` }); await ev(page, () => { const H = window.__hub; H.ui.menus.close(); H.ui.reset(); }); await sleep(300); };
await ev(page, async () => { const w = window.__hub.world; w.director.abort(); await w.loadLocation('lisiere_square', 'default'); window.__hub.state.party = ['nara', 'soren', 'tessa']; w.syncFollowers(true); window.__hub.ui.setHud(true); });
await shot('journal', () => window.__hub.ui.menus.toggle('journal'));
await shot('inventory', () => window.__hub.ui.menus.toggle('inventory'));
await shot('map', () => window.__hub.ui.menus.toggle('map'));
await shot('saves', () => window.__hub.ui.menus.toggle('saves'));
await shot('options', () => window.__hub.ui.menus.toggle('options'));
await shot('pause', () => window.__hub.ui.menus.toggle('pause'));
await shot('points', () => { window.__hub.state.hero.points = 8; window.__hub.ui.menus.toggle('inventory'); window.__hub.ui.menus.toggle('points'); });
await shot('dialogue', () => { window.__hub.ui.say([{ who: 'nara', text: 'Regarde ce qui tient encore. Le reste attendra, et nous aussi.' }]); });
await shot('choix', () => { window.__hub.ui.choose('Que répondez-vous ?', ['Je ne sais pas.', 'Je viens d\'un village lointain.', '(Garder le silence.)']); });
await shot('enigme', () => { window.__hub.ui.puzzle({ kind: 'valves', title: 'Un débit pour chaque rive', prompt: 'Répartissez le flux entre le puits, le moulin et le bassin éloigné.', basins: [{ id: 'a', label: 'Puits', min: 1, max: 2 }, { id: 'b', label: 'Moulin', min: 1, max: 2 }, { id: 'c', label: 'Bassin éloigné', min: 1, max: 3 }], supply: 5, hints: ['a', 'b', 'c'], fail: 'x', success: 'y' }); });
await shot('choix-final', () => { window.__hub.ui.finalChoice(); });
await ev(page, async () => { const w = window.__hub.world; w.director.abort(); await w.loadLocation('valley_bridge', 'default'); window.__hub.state.powers = ['listen', 'weave', 'pulse']; w.syncFollowers(true); window.__hub.ui.setHud(true); w.combat.run([{ type: 'automate', at: 'auto1' }, { type: 'sentinelle', at: 'auto2' }], { support: true, pauseAllowed: true }); });
await sleep(1500); await page.screenshot({ path: `${out}/ui-combat.png` });
await ev(page, () => window.__hub.world.combat.togglePause()); await sleep(600); await page.screenshot({ path: `${out}/ui-combat-pause.png` });
await ev(page, () => { const w = window.__hub.world; w.combat.abort(); window.__hub.ui.reset(); });
// tailles de fenêtre
for (const [w, h] of [[1280, 720], [1920, 1080], [1024, 768], [800, 450]]) {
  await page.setViewportSize({ width: w, height: h }); await sleep(600);
  await ev(page, async () => { const H = window.__hub, wd = H.world; wd.director.abort(); await wd.loadLocation('miral_gate', 'default'); wd.placeActors([{ id: 'ysane', at: 'ysane_spot' }]); wd.syncFollowers(true); H.ui.setHud(true); H.ui.say([{ who: 'ysane', text: 'Nous proposons de vous accueillir.' }]); });
  await sleep(900);
  await page.screenshot({ path: `${out}/size-${w}x${h}.png` });
  await ev(page, () => window.__hub.ui.reset());
}
console.log(logs.filter((l) => !/GPU stall/.test(l)).join('\n') || 'aucune erreur console');
await browser.close();
