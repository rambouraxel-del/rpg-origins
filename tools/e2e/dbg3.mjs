import { launch, ev, sleep } from './lib.mjs';
const { browser, page } = await launch({ url: `${process.env.E2E_BASE ?? 'http://127.0.0.1:4173'}/?dev=1&jump=` + (process.argv[2] ?? 'C02S01') });
await sleep(7000);
for (let i = 0; i < (Number(process.argv[3] ?? 2)); i++) { await page.keyboard.press('e'); await sleep(500); await page.keyboard.press('e'); await sleep(600); }
await sleep(1500);
await page.screenshot({ path: process.argv[4] ?? '/tmp/dbg3.png' });
await browser.close();
