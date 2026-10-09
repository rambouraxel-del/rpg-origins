// Audio procédural : démarrage après geste, ambiances, effets, volumes, aucune exception.
import { launch, ev, sleep } from './lib.mjs';
const { browser, page, logs } = await launch();
await sleep(600);
await ev(page, () => window.__hub.events.emit('title-choice', 'new'));
await sleep(2500);
await page.mouse.click(480, 300); await page.keyboard.press('e'); await sleep(500);
const r = await ev(page, async () => {
  const a = window.__audio; a.start();
  const out = { started: a.started };
  for (const loc of ['palace_garden', 'forest_arrival', 'stellar_dock', 'planet_heart', 'valley_outlook']) { a.forLocation(loc); await new Promise((r) => setTimeout(r, 700)); }
  a.combat(true); await new Promise((r) => setTimeout(r, 500)); a.combat(false);
  for (const fx of ['click', 'tick', 'interact', 'whoosh', 'strike', 'hit', 'hurt', 'dodge', 'power', 'chime', 'success', 'fail', 'heal', 'rumble']) a[fx]();
  window.__hub.options.music = 0; a.applyVolumes(); window.__hub.options.music = 0.6; a.applyVolumes();
  await new Promise((r) => setTimeout(r, 1200));
  return out;
});
console.log(JSON.stringify(r));
console.log(logs.filter((l) => !/GPU/.test(l)).join('\n') || 'aucune erreur console');
await browser.close();
process.exit(r.started && !logs.some((l) => /pageerror/.test(l)) ? 0 : 1);
