// Utilitaires de test de bout en bout (Playwright + Chromium préinstallé). Aucun appel réseau externe, aucune API image.
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
import { existsSync, readdirSync } from 'node:fs';

function chromePath() {
  const base = '/opt/pw-browsers';
  for (const d of readdirSync(base)) {
    const p = `${base}/${d}/chrome-linux/chrome`;
    if (existsSync(p)) return p;
  }
  return undefined;
}

export async function launch({ width = 960, height = 540, url = 'http://127.0.0.1:5173/?dev=1' } = {}) {
  const browser = await chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width, height } });
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()}`));
  await page.goto(url);
  await page.waitForFunction(() => window.__hub && window.__game, null, { timeout: 15000 });
  return { browser, page, logs };
}

/** Évalue du code dans la page avec accès à window.__hub. */
export const ev = (page, fn, arg) => page.evaluate(fn, arg);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
