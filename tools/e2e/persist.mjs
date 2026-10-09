// Sauvegardes : écriture/lecture, export/import, fichier corrompu, migration, effets idempotents, reprise après rechargement.
import { launch, ev, sleep } from './lib.mjs';
const { browser, page, logs } = await launch();
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'OK  ' : 'ÉCHEC'} ${name}${detail ? ' — ' + detail : ''}`); };
await sleep(600);
await ev(page, () => window.__hub.events.emit('title-choice', 'new'));
await sleep(2500);
// avancer un peu pour avoir un état non trivial
await ev(page, () => { const H = window.__hub; window.__fx(H.state, [{ op: 'power', id: 'listen' }, { op: 'item', id: 'nara_thread' }, { op: 'trust', who: 'nara', delta: 2 }, { op: 'flag', key: 'origin_confession', value: 'partial' }]); });

// 1. écriture / lecture
const a = await ev(page, () => { const H = window.__hub, S = window.__save; S.writeSlot('slot1', H.state); const r = S.readSlot('slot1'); return { same: JSON.stringify({ ...r, savedAt: 0 }) === JSON.stringify({ ...H.state, savedAt: 0 }), info: S.slotInfo('slot1') }; });
check('écriture puis lecture identique', a.same, JSON.stringify(a.info));

// 2. export / import valide
const b = await ev(page, () => { const S = window.__save; const t = S.exportSlot('slot1'); S.importInto('slot2', t); return S.slotInfo('slot2'); });
check('export puis import dans un autre emplacement', !b.empty && !b.broken, JSON.stringify(b));

// 3. fichier corrompu : refusé, autres emplacements intacts
const c = await ev(page, () => {
  const S = window.__save; const before = S.exportSlot('slot1'); const t = S.exportSlot('slot1');
  const bad = t.replace('"chapter\\":', '"chapter\\":9'); // modifie le corps sans refaire la somme
  const out = {};
  for (const [label, txt] of [['altéré', bad], ['tronqué', t.slice(0, t.length - 40)], ['pas du json', 'bonjour'], ['autre jeu', JSON.stringify({ game: 'autre', body: '{}' })]]) {
    try { S.importInto('slot3', txt); out[label] = 'ACCEPTÉ'; } catch (e) { out[label] = e.message; }
  }
  return { out, slot1Same: S.exportSlot('slot1') === before, slot3: S.slotInfo('slot3').empty };
});
check('fichiers corrompus refusés avec message compréhensible', Object.values(c.out).every((m) => m !== 'ACCEPTÉ' && m.length > 15), JSON.stringify(c.out));
check("l'import raté ne modifie aucun emplacement", c.slot1Same && c.slot3, '');

// 4. migration : ancienne sauvegarde sans champs récents
const d = await ev(page, () => { const S = window.__save; const H = window.__hub; const old = { ...H.state }; delete old.seenLines; delete old.difficulty; delete old.once; old.saveVersion = 0; const m = S.migrate(old); return { lines: Array.isArray(m.seenLines), diff: m.difficulty, once: typeof m.once, chapter: m.chapter, v: m.saveVersion }; });
check('migration complète les champs manquants sans renvoyer au prologue', d.lines && d.diff === 'aventure' && d.once === 'object' && d.v === 1, JSON.stringify(d));

// 5. effets uniques
const e = await ev(page, () => { const H = window.__hub; const s = H.state; const m0 = s.money, n0 = s.items.length; window.__fx(s, [{ op: 'money', delta: 5 }, { op: 'item', id: 'ribbon' }], 'recompense-test'); window.__fx(s, [{ op: 'money', delta: 5 }, { op: 'item', id: 'ribbon' }], 'recompense-test'); window.__fx(s, [{ op: 'power', id: 'listen' }, { op: 'power', id: 'listen' }]); return { money: s.money - m0, items: s.items.length - n0, powers: s.powers.filter((p) => p === 'listen').length }; });
check('récompense unique malgré deux applications', e.money === 5 && e.items === 1 && e.powers === 1, JSON.stringify(e));

// 6. reprise après rechargement de la page via "Continuer"
await ev(page, () => { const H = window.__hub; window.__save.writeSlot('auto', H.state); H.state.flags._probe = 'avant'; window.__save.writeSlot('auto', H.state); });
await page.reload();
await page.waitForFunction(() => window.__hub && window.__game, null, { timeout: 15000 });
await sleep(1200);
await ev(page, () => window.__hub.events.emit('title-choice', 'continue'));
await sleep(3000);
const f = await ev(page, () => { const H = window.__hub; return { probe: H.state.flags._probe, power: H.state.powers.includes('listen'), loc: H.state.location.loc, trust: H.state.trust.nara, scene: H.state.currentScene, hud: !!H.world }; });
check('rechargement de la page puis Continuer restaure la partie', f.probe === 'avant' && f.power && f.hud, JSON.stringify(f));

// 7. changement de difficulté hors combat
const g = await ev(page, () => { const H = window.__hub; H.state.difficulty = 'histoire'; window.__save.writeSlot('slot3', H.state); return window.__save.readSlot('slot3').difficulty; });
check('difficulté enregistrée', g === 'histoire', g);

console.log(logs.filter((l) => !/GPU stall/.test(l)).join('\n') || 'aucune erreur console');
await browser.close();
const bad = results.filter((r) => !r.ok);
console.log(`\n${results.length - bad.length}/${results.length} contrôles réussis`);
process.exit(bad.length ? 1 : 0);
