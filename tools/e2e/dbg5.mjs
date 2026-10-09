import { launch, ev, sleep } from './lib.mjs';
const { browser, page, logs } = await launch({ url: `${process.env.E2E_BASE ?? 'http://127.0.0.1:4173'}/?dev=1&jump=C09S01` });
await sleep(7000);
const dump = () => ev(page, () => { const w = window.__hub.world; return { player: [Math.round(w.player.x), Math.round(w.player.y)], handlers: [...w.talkHandlers.keys()], npcs: [...w.npcs.entries()].map(([k, a]) => [k, Math.round(a.x), Math.round(a.y)]), followers: [...w.followers.entries()].map(([k, a]) => [k, Math.round(a.x), Math.round(a.y)]), target: w.target && { kind: w.target.kind, id: w.target.id, dist: Math.round(w.target.dist), label: w.target.label }, locked: window.__hub.uiLock, step: w.director.curStep?.t, cin: w.cinematic, trans: w.transitioning, combat: w.combat.active }; });
console.log(JSON.stringify(await dump()));
for (let i = 0; i < 8; i++) { await page.keyboard.press('e'); await sleep(450); }
console.log('apres dialogue', JSON.stringify(await dump()));
await ev(page, () => { const w = window.__hub.world; const a = w.npcs.get('lume'); w.player.setPos(a.x + 10, a.y); });
await sleep(400);
console.log(JSON.stringify(await dump()));
await page.keyboard.press('e'); await sleep(500);
console.log(JSON.stringify(await dump()), JSON.stringify(await ev(page, () => window.__ui.state())));
console.log(logs.filter((l) => !/GPU/.test(l)).join('\n'));
await browser.close();
