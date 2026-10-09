import { launch, ev, sleep } from './lib.mjs';
const { browser, page } = await launch({ url: `${process.env.E2E_BASE ?? 'http://127.0.0.1:4173'}/?dev=1&jump=C02S01` });
await sleep(7000);
console.log(JSON.stringify(await ev(page, () => { const w = window.__hub.world; return { player: [w.player.x, w.player.y], followers: [...w.followers.entries()].map(([k, a]) => [k, a.x, a.y, a.sprite.visible, a.sprite.alpha, a.sprite.depth, a.sprite.texture.key, a.sprite.scale]), party: window.__hub.state.party, npcs: [...w.npcs.keys()] }; })));
await browser.close();
