import { launch, ev, sleep } from './lib.mjs';
const { browser, page, logs } = await launch({ url: `${process.env.E2E_BASE ?? 'http://127.0.0.1:4173'}/?dev=1&jump=C09S04` });
await sleep(7000);
const loc = process.argv[2] ?? 'river_bank', q = process.argv[3] ?? 'q05';
await ev(page, async ([loc]) => { const w = window.__hub.world; w.director.abort(); window.__hub.ui.reset(); await w.loadLocation(loc, 'default'); w.director.afterLocationLoad(); }, [loc]);
await sleep(800);
const r = await ev(page, ([q]) => {
  const w = window.__hub.world; const idx = w.director.questStage(q);
  const h = w.allHotspots().find((x) => x.id === `quest:${q}:${idx}`);
  if (!h) return { err: 'nohot', hs: w.allHotspots().map((x) => x.id) };
  const rect = w.hotRect(h);
  let p = null; for (let y = rect.y - 70; y <= rect.y + rect.h + 70 && !p; y += 6) for (let x = rect.x - 70; x <= rect.x + rect.w + 70 && !p; x += 6) { if (w.canStand(x, y)) { const dx = Math.max(rect.x - x, 0, x - (rect.x + rect.w)), dy = Math.max(rect.y - y, 0, y - (rect.y + rect.h)); if (Math.hypot(dx, dy) < 40) p = { x, y }; } }
  return { rect, p, canStand: p && w.canStand(p.x, p.y) };
}, [q]);
console.log(JSON.stringify(r));
if (r.p) { await ev(page, ([p]) => window.__hub.world.player.setPos(p.x, p.y), [r.p]); await sleep(500); console.log(JSON.stringify(await ev(page, () => { const w = window.__hub.world; return { target: w.target && { id: w.target.id, d: w.target.dist }, locked: window.__hub.uiLock, running: w.director.running, qr: w.director.questRunning, pos: [w.player.x, w.player.y] }; }))); }
console.log(logs.filter((l) => !/GPU/.test(l)).join('\n'));
await browser.close();
