// Parcours automatisé du jeu complet (moteur et données réels). Ce n'est PAS un parcours manuel :
// les déplacements longs sont remplacés par des téléportations vers les zones d'objectif (leur accessibilité est vérifiée
// séparément par `npm run validate`) ; dialogues, choix, énigmes, combats, sorties et sauvegardes passent par le vrai moteur.
// Usage : node tools/e2e/autoplay.mjs <A|B> [spare|abandon] [--quests] [--shots=dir]
import { launch, ev, sleep } from './lib.mjs';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';

const route = process.argv[2] ?? 'A';
const mercy = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'spare';
const withQuests = process.argv.includes('--quests');
const shotsDir = (process.argv.find((a) => a.startsWith('--shots=')) ?? '').split('=')[1];
if (shotsDir) mkdirSync(shotsDir, { recursive: true });
const LIVE = process.env.E2E_LIVE ?? '/tmp/autoplay-live.log';
const TAG = process.env.E2E_TAG ?? `${route}${route === 'B' ? '-' + mercy : ''}`;
const t0 = Date.now();
const jump = (process.argv.find((a) => a.startsWith('--jump=')) ?? '').split('=')[1];
const { browser, page, logs } = await launch({ url: `${process.env.E2E_BASE ?? 'http://127.0.0.1:4173'}/?dev=1${jump ? '&jump=' + jump : ''}` });
page.setDefaultTimeout(8000);
await sleep(800);

// ---- fonctions côté page ----
await page.evaluate(() => {
  const H = window.__hub;
  const W = () => H.world;
  const ap = (window.__ap = {});
  ap.standNear = (r, preferInside = true) => {
    const w = W();
    let best = null, bd = 1e9;
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    for (let y = r.y - 70; y <= r.y + r.h + 70; y += 6) for (let x = r.x - 70; x <= r.x + r.w + 70; x += 6) {
      if (!w.canStand(x, y)) continue;
      const inside = x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
      const dx = Math.max(r.x - x, 0, x - (r.x + r.w)), dy = Math.max(r.y - y, 0, y - (r.y + r.h));
      let d = Math.hypot(dx, dy) * 3 + (preferInside && inside ? 0 : 5) + Math.hypot(x - cx, y - cy) * 0.02;
      if (d < bd) { bd = d; best = { x, y }; }
    }
    return best;
  };
  ap.pathTo = (from, to) => {
    const q = [[from]]; const seen = new Set([from]);
    while (q.length) {
      const p = q.shift(); const last = p[p.length - 1];
      if (last === to) return p;
      for (const e of H.locations.get(last).exits) if (!seen.has(e.to) && H.locations.has(e.to)) { seen.add(e.to); q.push([...p, e.to]); }
    }
    return null;
  };
  ap.goTo = (locId) => {
    const w = W(); if (w.transitioning) return 'wait';
    if (w.loc.id === locId) return 'here';
    const path = ap.pathTo(w.loc.id, locId);
    if (!path) return 'nopath:' + w.loc.id + '>' + locId;
    const ex = w.loc.exits.find((e) => e.to === path[1]);
    const p = ap.standNear(ex.rect);
    if (!p) return 'noexitspot:' + ex.id;
    w.player.setPos(p.x, p.y);
    return 'exit:' + ex.id;
  };
  ap.hot = () => W().allHotspots();
  ap.stepInfo = () => { const d = W().director; return { t: d.curStep?.t, scene: H.state.currentScene, idx: H.state.stepIndex, running: d.running, quest: d.questRunning, pending: d.pending, loc: W().loc?.id }; };
});

if (!jump) await page.evaluate(() => window.__hub.events.emit('title-choice', 'new'));
await sleep(jump ? 4500 : 2500);
let progressAt = Date.now(), progressSig = '';
const log = [];
const L = (m) => { const line = `[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`; log.push(line); appendFileSync(LIVE, line + '\n'); };
const done = new Set();
let lastScene = null, stuck = 0, lastSig = '', ticks = 0;
let questMode = false, quests = [];
const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? '').split('=')[1];
const choicePolicy = (labels, info) => {
  const has = (re) => labels.findIndex((l) => re.test(l));
  let i;
  if (arg('ilyra') === 'refused' && (i = has(/Refuser : Tessa préparera/)) >= 0) return i;
  if (arg('confession') === 'minimized' && (i = has(/Tenter de minimiser/)) >= 0) return i;
  if (arg('confession') === 'partial' && (i = has(/Me limiter à ma parenté/)) >= 0) return i;
  if (process.argv.includes('--romance') && (i = has(/proximité plus tendre/)) >= 0) return i;
  if (arg('truth') === 'silent' && (i = has(/Garder le silence\./)) >= 0) return i;
  if (arg('truth') === 'journey' && (i = has(/Ne parler que du voyage/)) >= 0) return i;
  if (arg('cache') === 'false' && (i = has(/sous contrôle royal/)) >= 0) return i;
  if ((i = has(/Revenir préparer le départ/)) >= 0 && withQuests && !questMode && !info.questsDone) return i;
  if ((i = has(/Entrer\./)) >= 0) return i;
  if ((i = has(/Exiger qu'ils vivent/)) >= 0 && mercy === 'spare') return i;
  if ((i = has(/Laisser Vaelor décider/)) >= 0 && mercy === 'abandon') return i;
  if ((i = has(/Exiger qu'ils vivent|Laisser Vaelor/)) >= 0) return i;
  if ((i = has(/Le garder jusqu/)) >= 0) return i;
  if ((i = has(/Lui dire toute la vérité/)) >= 0) return i;
  if ((i = has(/Tout dire immédiatement/)) >= 0) return i;
  return 0;
};

let questsDone = !withQuests;
let epilogue = null;
const MAX = 40000;
for (ticks = 0; ticks < MAX; ticks++) {
  const info = await page.evaluate(() => { const ui = window.__ui?.state(); return { ui, step: window.__ap.stepInfo(), st: { ch: window.__hub.state.chapter, locked: window.__hub.uiLock, flags: { ending: window.__hub.state.flags.ending, ended: window.__hub.state.flags._ended }, combat: !!window.__hub.world?.combat.active, puzzle: !!window.__hub.puzzleDef } }; });
  if (info.step.scene && info.step.scene !== lastScene) { lastScene = info.step.scene; done.add(info.step.scene); L(`scène ${info.step.scene} (ch ${info.st.ch}) @${info.step.loc}`); if (shotsDir && /S03$|S05$|^P01$|^A0|^B0/.test(info.step.scene)) await page.screenshot({ path: `${shotsDir}/${route}-${info.step.scene}.png` }).catch(() => {}); }
  if (info.st.flags.ended) { L('fin atteinte : épilogue/crédits'); }
  const btns = info.ui?.buttons ?? [];
  appendFileSync(LIVE.replace('.log', '-ticks.log'), `${ticks} ${info.step.scene}#${info.step.idx}:${info.step.t} lk=${info.st.locked} dlg=${info.ui?.dialogue} typ=${info.ui?.typing} btn=${btns.length} cmb=${info.st.combat} fade=${info.ui?.fade}\n`);
  const sig = JSON.stringify([info.step.scene, info.step.idx, info.step.t, info.st.locked, btns.length, info.ui?.dialogue, info.step.loc, info.ui?.typing]);
  stuck = sig === lastSig ? stuck + 1 : 0; lastSig = sig;
  const psig = `${info.step.scene}#${info.step.idx}@${info.step.loc}:${info.step.pending}:${info.st.ch}`;
  if (psig !== progressSig) { progressSig = psig; progressAt = Date.now(); }
  if (Date.now() - progressAt > (info.st.flags.ended ? 150000 : 45000)) stuck = 999;
  if (logs.length) { for (const m of logs.splice(0)) if (!/GPU stall/.test(m)) L('console ' + m); }
  if (stuck > (info.st.flags.ended ? 1200 : 200)) { L('BLOQUÉ : ' + JSON.stringify(info)); await page.screenshot({ path: '/tmp/autoplay-stuck.png' }); break; }
  if (info.ui?.fade > 0.6 && !info.ui.dialogue && !btns.length) { await sleep(120); continue; }

  // --- fin du jeu : épilogue / crédits / menu de fin ---
  if (info.st.flags.ended) {
    if (!epilogue) { epilogue = await page.evaluate(() => window.__epilogue()); L('épilogue : ' + epilogue.length + ' paragraphes'); writeFileSync(`/tmp/epilogue-${TAG}.txt`, epilogue.join('\n\n')); }
    if (btns.includes('Retour au titre')) { L('menu de fin affiché'); await page.evaluate(() => window.__ui.click('Retour au titre')); await sleep(1200); break; }
    await page.mouse.click(480, 270); await sleep(450); continue;
  }

  // --- interface ouverte ---
  if (info.st.puzzle) {
    const def = await page.evaluate(() => window.__hub.puzzleDef);
    const click = (m, n = 0) => page.evaluate(([a, b]) => window.__ui.click(a, b), [m, n]);
    if (def.kind === 'pick') { await click(def.options.find((o) => o.id === def.solution).label); await click('Valider'); }
    else if (def.kind === 'set') { for (const id of def.solution) await click(def.options.find((o) => o.id === id).label); await click('Valider'); }
    else if (def.kind === 'order') { for (const id of def.solution) await click(def.options.find((o) => o.id === id).label); }
    else if (def.kind === 'valves') {
      for (let bi = 0; bi < def.basins.length; bi++) for (let k = 0; k < def.basins[bi].min; k++) await click('+', bi);
      await click('Ouvrir les vannes');
    }
    L(`énigme « ${def.title} » résolue`);
    await sleep(1500); continue;
  }
  if (btns.some((b) => /^\d\.  /.test(b))) {
    const labels = btns.filter((b) => /^\d\.  /.test(b));
    const i = choicePolicy(labels.map((l) => l.replace(/^\d\.  /, '')), { questsDone });
    L(`choix : « ${labels[i].replace(/^\d\.  /, '')} »`);
    await page.evaluate((m) => window.__ui.click(m), labels[i]);
    await sleep(450); continue;
  }
  if (btns.includes('Rompre la Couronne') || btns.some((b) => /^Rompre la Couronne/.test(b))) {
    const want = route === 'A' ? /^Rompre la Couronne/ : /^Refermer la Couronne/;
    await page.evaluate((m) => window.__ui.click(m), '/' + want.source + '/');
    L('geste final : route ' + route);
    await sleep(500); continue;
  }
  if (btns.some((b) => /Accomplir ce geste/.test(b))) { await page.evaluate(() => window.__ui.click('Accomplir ce geste')); await sleep(400); continue; }
  if (btns.some((b) => /Recommencer la rencontre/.test(b))) { L('défaite : nouvelle tentative'); await page.evaluate(() => window.__ui.click('Recommencer la rencontre')); await sleep(400); continue; }
  if (btns.some((b) => /Se reposer : soigne/.test(b))) { await page.evaluate(() => window.__ui.click('Se reposer : soigne')); await sleep(300); await page.evaluate(() => window.__ui.click('Fermer')); await sleep(300); continue; }
  if (info.ui?.dialogue) { await page.keyboard.press('e'); await sleep(info.ui.typing ? 120 : 160); continue; }
  if (btns.length) { await page.evaluate(() => window.__ui.click('Fermer')); await sleep(200); continue; }

  // --- combat ---
  if (info.st.combat) { await page.evaluate(() => window.__hub.world.combat.autoStep(0.12)); await sleep(100); continue; }
  if (info.st.locked) { await sleep(120); continue; }

  // --- contrôle libre ---
  const act = await page.evaluate(({ questMode, questsDone }) => {
    const w = window.__hub.world, H = window.__hub, d = w.director, ap = window.__ap;
    if (w.transitioning || d.questRunning) return 'wait';
    const st = d.curStep;
    // scène en cours
    if (d.running && st) {
      const goto = (loc) => ap.goTo(loc);
      switch (st.t) {
        case 'reach': { const z = w.area(st.zone); const p = ap.standNear(z, true); if (!p) return 'noreachspot'; w.player.setPos(p.x, p.y); return 'reach'; }
        case 'inspect': {
          const need = st.targets.filter((t) => !H.state.seenHotspots[t]);
          const hs = ap.hot().find((h) => need.includes(h.id)); if (!hs) return 'noinspecttarget:' + need.join(',');
          const r = w.hotRect(hs); const p = ap.standNear(r, false); w.player.setPos(p.x, p.y); return 'press';
        }
        case 'talk': { const a = w.npcs.get(st.npc) ?? w.followers.get(st.npc); if (!a) return 'nonpc'; const p = ap.standNear({ x: a.x - 6, y: a.y - 6, w: 12, h: 12 }, false); w.player.setPos(p.x, p.y); return 'press'; }
        case 'guide': { const a = [...w.npcs.entries()].find(([k, v]) => k.startsWith('g_') && v.x === v.x && w.talkHandlers?.has?.(k)); if (!a) return 'wait'; const v = a[1]; const p = ap.standNear({ x: v.x - 6, y: v.y - 6, w: 12, h: 12 }, false); w.player.setPos(p.x, p.y); return 'press'; }
        case 'stealth': { const z = w.area(st.goal); const p = ap.standNear(z, true); w.player.setPos(p.x, p.y); return 'stealth'; }
        case 'rest': { const r = w.loc.rest; if (!r) return 'norest'; const p = ap.standNear(r, false); w.player.setPos(p.x, p.y); return 'press'; }
        default: return 'wait';
      }
    }
    // entre deux scènes : aller au lieu de la prochaine scène
    const pend = d.pending ? H.scenes.get(d.pending) : null;
    if (pend && !d.running) {
      const resume = ap.hot().find((h) => h.id.startsWith('resume:'));
      if (resume && (!questsDone && questMode)) return 'questmode';
      if (resume) { const r = w.hotRect(resume); const p = ap.standNear(r, false); w.player.setPos(p.x, p.y); return 'press'; }
      if (w.loc.id !== pend.loc) return ap.goTo(pend.loc);
      return 'waitscene';
    }
    return 'idle';
  }, { questMode, questsDone });
  if (act === 'press') { await sleep(180); await page.keyboard.press('e'); await sleep(280); }
  else if (act.startsWith('exit:')) await sleep(900);
  else if (act === 'questmode') { /* géré ci-dessous */ }
  else if (act.startsWith('no') || act.startsWith('nopath')) { L('ANOMALIE ' + act + ' ' + JSON.stringify(info.step)); stuck += 20; await sleep(200); }
  else await sleep(150);

  // --- quêtes (au seuil du chapitre 9) ---
  if (withQuests && !questsDone) {
    const need = await page.evaluate(() => { const H = window.__hub; return H.state.completedScenes.includes('C09S04') && !!H.world.director.pending && H.world.director.pending === 'C09S05' && !H.world.director.running; });
    if (need) {
      questMode = true;
      L('--- mode quêtes (12) ---');
      for (let round = 0; round < 40; round++) {
        const q = await page.evaluate(() => {
          const H = window.__hub, w = H.world, d = w.director;
          for (const qs of H.quests.values()) {
            const st = H.state.quests[qs.id]; if (st === 'completed') continue;
            if (st === 'unavailable') continue;
            const idx = d.questStage(qs.id); const stage = qs.stages[idx]; if (!stage) continue;
            return { id: qs.id, loc: stage.loc, st, idx };
          }
          return null;
        });
        if (!q) break;
        L(`quête ${q.id} étape ${q.idx} (${q.st})`);
        // aller au lieu
        for (let k = 0; k < 40; k++) { const r = await page.evaluate((loc) => window.__ap.goTo(loc), q.loc); if (r === 'here') break; if (r.startsWith('no')) { L('ANOMALIE quête ' + r); break; } await sleep(r === 'wait' ? 150 : 900); }
        await page.evaluate((qid) => {
          const w = window.__hub.world, qs = window.__hub.quests.get(qid), idx = w.director.questStage(qid);
          const h = w.allHotspots().find((x) => x.id === `quest:${qid}:${idx}`);
          if (!h) return 'nohot';
          const p = window.__ap.standNear(w.hotRect(h), false); w.player.setPos(p.x, p.y); return 'ok';
        }, q.id);
        await sleep(300); await page.keyboard.press('e'); await sleep(400);
        // jouer l'étape
        for (let k = 0; k < 600; k++) {
          const i2 = await page.evaluate(() => ({ ui: window.__ui.state(), qr: window.__hub.world.director.questRunning, puzzle: !!window.__hub.puzzleDef, combat: !!window.__hub.world.combat.active, locked: window.__hub.uiLock }));
          if (!i2.qr && !i2.ui.dialogue && !i2.ui.buttons.length && !i2.locked) break;
          if (i2.puzzle) { const def = await page.evaluate(() => window.__hub.puzzleDef); const click = (m, n = 0) => page.evaluate(([a, b]) => window.__ui.click(a, b), [m, n]); if (def.kind === 'pick') { await click(def.options.find((o) => o.id === def.solution).label); await click('Valider'); } else if (def.kind === 'set') { for (const id of def.solution) await click(def.options.find((o) => o.id === id).label); await click('Valider'); } await sleep(1500); continue; }
          if (i2.ui.buttons.some((b) => /^\d\.  /.test(b))) { await page.evaluate((m) => window.__ui.click(m), i2.ui.buttons.find((b) => /^\d\.  /.test(b))); await sleep(400); continue; }
          if (i2.ui.dialogue) { await page.keyboard.press('e'); await sleep(150); continue; }
          // inspect steps dans la quête
          const a = await page.evaluate(() => {
            const w = window.__hub.world, st = w.director.curStep, ap = window.__ap, H = window.__hub;
            if (!st) return 'wait';
            if (st.t === 'inspect') { const need = st.targets.filter((t) => !H.state.seenHotspots[t]); const hs = ap.hot().find((h) => need.includes(h.id)); if (!hs) return 'wait'; const p = ap.standNear(w.hotRect(hs), false); w.player.setPos(p.x, p.y); return 'press'; }
            if (st.t === 'talk') { const a = w.npcs.get(st.npc) ?? w.followers.get(st.npc); if (!a) return 'wait'; const p = ap.standNear({ x: a.x - 6, y: a.y - 6, w: 12, h: 12 }, false); w.player.setPos(p.x, p.y); return 'press'; }
            return 'wait';
          });
          if (a === 'press') { await sleep(150); await page.keyboard.press('e'); await sleep(250); } else await sleep(120);
        }
      }
      const qstat = await page.evaluate(() => window.__hub.state.quests);
      L('quêtes : ' + JSON.stringify(qstat));
      questsDone = true; questMode = false;
      // retour au seuil
      await page.evaluate(() => { const w = window.__hub.world; });
    }
  }
}

// ---- bilan ----
const result = await page.evaluate(() => { const H = window.__hub; return { completed: H.state.completedScenes, flags: H.state.flags, quests: H.state.quests, chapter: H.state.chapter, powers: H.state.powers, accords: H.state.accords, party: H.state.party, hero: H.state.hero }; }).catch(() => null);
const out = { route, mercy, epilogue, ticks, seconds: (Date.now() - t0) / 1000, result, errors: logs.filter((l) => !/GPU stall/.test(l)) };
writeFileSync(`/tmp/autoplay-${TAG}.json`, JSON.stringify(out, null, 1));
writeFileSync(`/tmp/autoplay-${TAG}.log`, log.join('\n'));
console.log(log.slice(-25).join('\n'));
console.log('scènes terminées :', result?.completed?.length, '/ 58 attendues pour une route');
console.log('erreurs console :', out.errors.length ? out.errors.slice(0, 8).join('\n') : 'aucune');
await browser.close();
