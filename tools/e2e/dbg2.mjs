import { launch, ev, sleep } from './lib.mjs';
const { browser, page, logs } = await launch({ url: `${process.env.E2E_BASE ?? 'http://127.0.0.1:4173'}/?dev=1&jump=C03S05` });
await sleep(5000);
const r = await ev(page, async () => {
  const H = window.__hub; const w = H.world;
  const t = setTimeout(() => {}, 0);
  let res = 'start';
  const p = w.loadLocation('river_bank', 'default').then(() => 'ok', (e) => 'err ' + e.message);
  const timeout = new Promise((r) => setTimeout(() => r('timeout'), 4000));
  res = await Promise.race([p, timeout]);
  return { res, loc: w.loc?.id, tex: w.textures.exists('bg:river_bank'), loaderState: w.load.state, active: w.scene.isActive(), keys: w.scene.key, running: w.scene.isSleeping() };
});
console.log(JSON.stringify(r));
console.log(logs.filter((l) => !/GPU stall/.test(l)).join('\n') || 'aucune erreur');
await browser.close();
