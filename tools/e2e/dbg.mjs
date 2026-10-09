import { launch, ev, sleep } from './lib.mjs';
const { browser, page, logs } = await launch({ url: 'http://127.0.0.1:4173/?dev=1&jump=' + (process.argv[2] ?? 'C03S05') });
await sleep(6000);
console.log(JSON.stringify(await ev(page, () => { const H = window.__hub; return { world: !!H.world, ui: !!H.ui, loc: H.world?.loc?.id, st: H.state.location, pending: H.state.flags._pending, scenes: H.state.completedScenes.length, fade: window.__ui?.state()?.fade }; })));
console.log(logs.filter((l) => !/GPU stall/.test(l)).join('\n') || 'aucune erreur');
await page.screenshot({ path: '/tmp/dbg.png' });
await browser.close();
