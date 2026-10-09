import { launch, ev, sleep } from './lib.mjs';
const { browser, page, logs } = await launch();
await sleep(800);
await ev(page, () => window.__hub.events.emit('title-choice', 'new'));
await sleep(2500);
const st = () => ev(page, () => { const h = window.__hub; const p = h.world.player; return { x: Math.round(p.x), y: Math.round(p.y), locked: h.uiLock, scene: h.state.currentScene, step: h.state.stepIndex }; });
// avancer les 2 lignes de dialogue
for (let i = 0; i < 4; i++) { await page.mouse.click(480, 450); await sleep(350); }
console.log('apres dialogue', await st());
// déplacement droite 1s
await page.keyboard.down('d'); await sleep(1000); await page.keyboard.up('d');
console.log('apres droite', await st());
// vers la zone interdite (haut)
await page.keyboard.down('z'); await sleep(2500); await page.keyboard.up('z');
console.log('apres haut (bloqué ?)', await st());
await page.screenshot({ path: '/tmp/shot-move.png' });
// parler à Nara : aller vers (480,330)
await ev(page, () => { const w = window.__hub.world; w.player.setPos(470, 345); });
await sleep(300);
await page.keyboard.press('e'); await sleep(400);
for (let i = 0; i < 3; i++) { await page.mouse.click(480, 450); await sleep(500); }
await page.screenshot({ path: '/tmp/shot-choice.png' });
await page.keyboard.press('1'); await sleep(600);
console.log('apres choix', await ev(page, () => window.__hub.state.flags.answer), await st());
// sortie est
await ev(page, () => { window.__hub.world.player.setPos(880, 322); });
await sleep(1500);
console.log('apres sortie', await ev(page, () => window.__hub.state.location), await st());
console.log(logs.filter((l) => !/GPU stall/.test(l)).join('\n') || 'aucune erreur');
await browser.close();
