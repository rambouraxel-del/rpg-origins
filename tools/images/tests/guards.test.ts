// Tests des garde-fous avec un faux serveur OpenAI local : AUCUN appel payant.
import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { deflateSync } from 'node:zlib';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import { GuardError, createInspection, createInventory, generateImage, editImage, reviewImage, type ImageOptions } from '../openai-images.ts';
import { calls, observedTokensPerMp, persistenceStatus, readLedger, summarize } from '../ledger.ts';
import { capped, loadConfig, loadPricing, sessionInfo } from '../config.ts';
import { computeUsd, estimateTokens, estimateUsd } from '../cost.ts';
import { decodeRaster } from '../png.ts';

function makePng(w: number, h: number, flat = false): Buffer {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = y * (w * 3 + 1) + 1 + x * 3;
    raw[o] = flat ? 128 : (x * 255) / w; raw[o + 1] = flat ? 128 : (y * 255) / h; raw[o + 2] = flat ? 128 : (x + y) & 255;
  }
  const chunk = (t: string, d: Buffer) => { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length, 0); b.write(t, 4, 'ascii'); d.copy(b, 8); return b; };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

let ORIG_API = '';
const ORIG_REMOTE = process.env.CLAUDE_CODE_REMOTE_SESSION_ID;
let server: Server, hits = 0, behavior: 'ok' | '400' | '500' | 'blank' = 'ok', dir = '';
const USAGE = { input_tokens: 59, input_tokens_details: { image_tokens: 0, text_tokens: 59 }, output_tokens: 120 };

before(async () => {
  server = createServer((req, res) => {
    req.resume();
    req.on('end', () => {
      hits++;
      if (behavior === '400') { res.writeHead(400); res.end(JSON.stringify({ error: { message: 'Invalid size' } })); return; }
      if (behavior === '500') { res.writeHead(500); res.end('boom'); return; }
      const b64 = makePng(1536, 864, behavior === 'blank').toString('base64');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: [b64, b64, b64, b64, b64].map((b) => ({ b64_json: b })), usage: USAGE }));
    });
  });
  await new Promise<void>((r) => server.listen(0, r));
  process.env.IMAGE_API_BASE = ORIG_API = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
after(() => server.close());

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'img-test-'));
  process.env.IMAGE_LEDGER_FILE = join(dir, 'ledger.jsonl');
  writeFileSync(process.env.IMAGE_LEDGER_FILE, JSON.stringify({ ev: 'init', ts: new Date().toISOString(), month: new Date().toISOString().slice(0, 7), session: 's', recovered: false }) + '\n');
  process.env.IMAGE_DETAIL_LOG = join(dir, 'detail.jsonl');
  process.env.IMAGE_OUTPUT_DIR = join(dir, 'out');
  process.env.IMAGE_SESSION_ID = 'session-A';
  if (ORIG_REMOTE === undefined) delete process.env.CLAUDE_CODE_REMOTE_SESSION_ID; else process.env.CLAUDE_CODE_REMOTE_SESSION_ID = ORIG_REMOTE;
  process.env.IMAGE_ASSETS_ROOT = join(dir, 'assets');
  process.env.IMAGE_PROOF_DIR = join(dir, 'proofs');
  process.env.IMAGE_STYLE_REF_DIR = join(dir, 'no-refs'); // les tests ne dépendent pas des vraies références
  mkdirSync(join(dir, 'assets', 'areas'), { recursive: true });
  writeFileSync(join(dir, 'assets', 'areas', 'forest.png'), makePng(96, 54));
  writeFileSync(join(dir, 'assets', 'areas', 'clearing.png'), makePng(96, 54, true));
  delete process.env.IMAGE_MONTHLY_BUDGET_USD;
  delete process.env.IMAGE_SESSION_LIMIT;
  process.env.IMAGE_API_BASE = ORIG_API;
  hits = 0; behavior = 'ok';
});

let seq = 0;
const opts = (o: Partial<ImageOptions> = {}): ImageOptions => ({
  prompt: `zorb${seq}a zorb${seq}b zorb${seq}c zorb${seq}d zorb${seq}e`,
  purpose: `Décor numéro ${seq++} pour une zone du jeu`, target: 'public/assets/areas/x.png',
  reuseChecked: 'Assets examinés : aucun adapté ; pas une simple transformation', output: `img-${seq}.png`, ...o,
});
/** Génération avec la preuve d'inventaire (planche de contact) exigée avant chaque appel. */
const G = async (o: Partial<ImageOptions> = {}) => generateImage({ ...opts(o), inventoryCode: (await createInventory(o.prompt ?? '')).code });
/** Inspection puis revue, comme le ferait l'agent après avoir regardé l'aperçu. */
const R = async (file: string, verdict: 'ok' | 'fail', reason = 'other') => reviewImage(file, verdict, reason, '', (await createInspection(file)).code);
const blocked = async (p: Promise<unknown>, code: string) => {
  await assert.rejects(p, (e: unknown) => e instanceof GuardError && e.code === code, `attendu GuardError ${code}`);
};
const state = () => summarize(readLedger('session-A'), 'session-A');

test('plus de 5 images par appel : bloqué, API non appelée', async () => {
  await blocked(G({ n: 6 }), 'MAX_PER_CALL');
  assert.equal(hits, 0);
});

test('décision obligatoire : bénéfice, cible, réutilisation', async () => {
  await blocked(G({ purpose: 'test' }), 'NO_PURPOSE');
  await blocked(G({ target: '' }), 'NO_TARGET');
  await blocked(G({ reuseChecked: '' }), 'NO_REUSE_CHECK');
  assert.equal(hits, 0);
});

test('transformation par code détectée ; contournable avec justification', async () => {
  await blocked(G({ prompt: 'redimensionner et faire un miroir de la forêt' }), 'CODE_TRANSFORM');
  assert.equal(hits, 0);
  await G({ prompt: 'redimensionner la forêt', overrideReason: 'Le contenu doit être redessiné, pas seulement redimensionné' });
  assert.equal(hits, 1);
});

test('qualité supérieure à low exige une justification', async () => {
  await blocked(G({ quality: 'medium' }), 'QUALITY_JUSTIFICATION');
  await G({ quality: 'medium', qualityReason: 'Deux échecs en low : détails illisibles' });
  assert.equal(hits, 1);
});

test('génération réussie : fichier PNG, registre réserve+règlement, coût calculé depuis les tokens', async () => {
  const r = await G({ output: 'ok.png' });
  assert.ok(existsSync(r.files[0]));
  assert.deepEqual(r.issues, []);
  assert.ok(r.estUsd > (r.computedUsd ?? 0), "l'estimation prudente dépasse le calcul réel");
  assert.ok(Math.abs((r.computedUsd ?? 0) - (59 * 5 + 120 * 30) / 1e6) < 1e-9);
  const c = calls(readLedger('session-A')).at(-1)!;
  assert.equal(c.state, 'settled');
  assert.equal(c.obsUsd, r.computedUsd);
  assert.ok(readFileSync(process.env.IMAGE_DETAIL_LOG!, 'utf8').includes('"prompt"'));
});

test('revue obligatoire avant de regénérer la même tâche', async () => {
  const first = await G({ task: 'foret', output: 'a.png' });
  await blocked(G({ task: 'foret', prompt: 'tout autre sujet: ruines anciennes sous la lune' }), 'REVIEW_PENDING');
  await R(first.files[0], 'ok');
  await G({ task: 'foret', prompt: 'tout autre sujet: ruines anciennes sous la lune', output: 'b.png' });
  assert.equal(hits, 2);
});

test('prompt redondant avec un résultat accepté : bloqué', async () => {
  const p = 'clairiere magique lumineuse champignons fougeres ruisseau cristallin';
  const first = await G({ prompt: p, output: 'a.png' });
  await R(first.files[0], 'ok');
  await blocked(G({ prompt: p + ' encore', task: 'autre' }), 'REDUNDANT');
  assert.equal(hits, 1);
});

test('deux échecs comparables : nouvelle approche obligatoire', async () => {
  const t = { task: 'brume' };
  for (const [i, p] of ['aquarelle brumeuse lointaine montagnes', 'peinture montagnes lointaines brumeuses'].entries()) {
    const r = await G({ ...t, prompt: p, output: `f${i}.png` });
    await R(r.files[0], 'fail', 'style');
  }
  await blocked(G({ ...t, prompt: 'dessin brumeux montagnes lointaines peint' }), 'REPEATED_FAILURE');
  await blocked(G({ ...t, prompt: 'portail antique runes dorees', newApproach: 'court' }), 'REPEATED_FAILURE');
  await G({ ...t, prompt: 'portail antique runes dorees', newApproach: 'Abandon du brouillard, cadrage serré sur un portail', output: 'g.png' });
  assert.equal(hits, 3);
});

test('limite de session : bloque, et les sessions sont distinguées', async () => {
  process.env.IMAGE_SESSION_LIMIT = '3';
  await G({ n: 2, task: 't1' });
  await blocked(G({ n: 2, task: 't2' }), 'SESSION_LIMIT');
  assert.equal(hits, 1);
  process.env.IMAGE_SESSION_ID = 'session-B';
  await G({ n: 2, task: 't3' });
  assert.equal(summarize(readLedger('session-B'), 'session-B').sessionImages, 2);
  assert.equal(summarize(readLedger('session-A'), 'session-A').sessionImages, 2);
});

test('plafond de 100 images par session par défaut', async () => {
  const lines = Array.from({ length: 20 }, (_, i) => [
    { ev: 'reserve', id: `r${i}`, ts: new Date().toISOString(), month: new Date().toISOString().slice(0, 7), session: 'session-A', task: `old${i}`, n: 5, estUsd: 0.0001 },
    { ev: 'settle', id: `r${i}`, ts: new Date().toISOString(), month: new Date().toISOString().slice(0, 7), session: 'session-A', obsUsd: 0.0001 },
  ].map((e) => JSON.stringify(e)).join('\n')).join('\n') + '\n';
  writeFileSync(process.env.IMAGE_LEDGER_FILE!, readFileSync(process.env.IMAGE_LEDGER_FILE!, 'utf8') + lines);
  assert.equal(state().sessionImages, 100);
  await blocked(G(), 'SESSION_LIMIT');
});

test('budget mensuel : plafond, puis marge de sécurité de 20 %', async () => {
  process.env.IMAGE_MONTHLY_BUDGET_USD = '0.001';
  await blocked(G(), 'BUDGET');
  assert.equal(hits, 0);
  process.env.IMAGE_MONTHLY_BUDGET_USD = '1';
  const { estUsd } = await G({ task: 'mesure' });
  // Le budget brut couvrirait la 2e estimation, mais pas une fois la marge retirée.
  const spent = state().monthCountedUsd;
  process.env.IMAGE_MONTHLY_BUDGET_USD = String((spent + estUsd) * 1.05);
  await blocked(G({ task: 'marge' }), 'BUDGET');
  assert.equal(hits, 1);
});

test('la dépense du mois précédent ne compte pas', async () => {
  writeFileSync(process.env.IMAGE_LEDGER_FILE!, readFileSync(process.env.IMAGE_LEDGER_FILE!, 'utf8') + [
    { ev: 'reserve', id: 'old', ts: '2020-01-01T00:00:00Z', month: '2020-01', session: 'x', task: 'old', n: 1, estUsd: 9.9 },
    { ev: 'settle', id: 'old', ts: '2020-01-01T00:00:00Z', month: '2020-01', session: 'x', obsUsd: 9.9 },
  ].map((e) => JSON.stringify(e)).join('\n') + '\n');
  await G();
  assert.equal(hits, 1);
});

test('erreur API 4xx : libérée (rien compté), pas de nouvelle tentative', async () => {
  behavior = '400';
  await assert.rejects(G({ n: 2 }), /HTTP 400/);
  assert.equal(hits, 1);
  assert.equal(state().sessionImages, 0);
  assert.equal(state().monthCountedUsd, 0);
});

test('erreur API 5xx : estimation conservée (peut avoir été facturé)', async () => {
  behavior = '500';
  await assert.rejects(G({ n: 2 }), /HTTP 500/);
  assert.equal(hits, 1);
  assert.equal(state().sessionImages, 2);
  assert.ok(state().monthCountedUsd > 0);
});

test("connexion impossible (rien n'est parti) : libérée, rien compté", async () => {
  const dead = createServer();
  await new Promise<void>((r) => dead.listen(0, r));
  const port = (dead.address() as { port: number }).port;
  await new Promise((r) => dead.close(r)); // port fermé : connexion refusée
  process.env.IMAGE_API_BASE = `http://127.0.0.1:${port}`;
  await assert.rejects(G(), /Connexion à l'API impossible/);
  assert.equal(state().sessionImages, 0);
  assert.equal(state().monthCountedUsd, 0);
  process.env.IMAGE_API_BASE = ORIG_API;
});

test('registre absent : recréé en mode récupéré, plafonds conservateurs (20 images, 1 $)', async () => {
  rmSync(process.env.IMAGE_LEDGER_FILE!);
  await G({ n: 5, task: 'a' });
  assert.equal(state().recovered, true);
  process.env.IMAGE_SESSION_LIMIT = '100';
  for (const t of ['b', 'c', 'd']) await G({ n: 5, task: t });
  await blocked(G({ n: 1, task: 'e' }), 'SESSION_LIMIT');
});

test('image vide détectée automatiquement', async () => {
  behavior = 'blank';
  const r = await G();
  assert.ok(r.issues.some((i) => i.includes('uniforme')));
});

test('processus concurrents : une seule réservation passe', async () => {
  process.env.IMAGE_SESSION_LIMIT = '1';
  const results = await Promise.allSettled([G({ task: 'p1' }), G({ task: 'p2' }), G({ task: 'p3' })]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(hits, 1);
});

test('modèle sans tarif connu : refusé', async () => {
  await assert.rejects(G({ model: 'modele-inconnu' }), /sans tarif connu/);
  assert.equal(hits, 0);
});

test("édition : image source manquante refusée avant tout appel", async () => {
  await assert.rejects(editImage({ ...opts(), inputs: [join(dir, 'absent.png')] }), /introuvable/);
  assert.equal(hits, 0);
});

test('édition : passe par le même contrôle et le même registre', async () => {
  const src = join(dir, 'src.png');
  writeFileSync(src, makePng(64, 36));
  const r = await editImage({ ...opts({ output: 'edit.png' }), inputs: [src], inventoryCode: (await createInventory()).code });
  assert.ok(existsSync(r.files[0]));
  assert.equal(hits, 1);
  assert.equal(calls(readLedger('session-A')).at(-1)!.reserve.kind, 'edit');
});

// ---- Plafonds : l'environnement ne peut que réduire -----------------------------------------------

test("les variables d'environnement ne peuvent que réduire les plafonds", () => {
  for (const v of ['1000', 'abc', '-5', '', ' ']) assert.equal(capped(100, v), 100, `valeur "${v}" ignorée`);
  assert.equal(capped(100, undefined), 100);
  assert.equal(capped(100, '50'), 50);
  process.env.IMAGE_SESSION_LIMIT = '1000';
  process.env.IMAGE_MONTHLY_BUDGET_USD = '999';
  const c = loadConfig();
  assert.equal(c.maxImagesPerSession, 100);
  assert.equal(c.monthlyBudgetUsd, 10);
  assert.equal(c.maxImagesPerCall, 5);
  assert.equal(c.safetyMargin, 0.2);
  process.env.IMAGE_SESSION_LIMIT = '7';
  process.env.IMAGE_MONTHLY_BUDGET_USD = '3';
  assert.equal(loadConfig().maxImagesPerSession, 7);
  assert.equal(loadConfig().monthlyBudgetUsd, 3);
});

test('IMAGE_SESSION_LIMIT=1000 ne relève pas le plafond réel de 100 images', async () => {
  const month = new Date().toISOString().slice(0, 7);
  const lines = Array.from({ length: 20 }, (_, i) => [
    { ev: 'reserve', id: `r${i}`, ts: new Date().toISOString(), month, session: 'session-A', task: `old${i}`, n: 5, estUsd: 0.0001 },
    { ev: 'settle', id: `r${i}`, ts: new Date().toISOString(), month, session: 'session-A', obsUsd: 0.0001 },
  ].map((e) => JSON.stringify(e)).join('\n')).join('\n') + '\n';
  appendFileSync(process.env.IMAGE_LEDGER_FILE!, lines);
  process.env.IMAGE_SESSION_LIMIT = '1000';
  process.env.IMAGE_MONTHLY_BUDGET_USD = '999';
  await blocked(G(), 'SESSION_LIMIT');
});

// ---- Tarifs et estimation ---------------------------------------------------------------------------

test('tarifs Standard : 5 / 8 / 30 $ par million, et calcul après appel depuis les tokens réels', () => {
  const p = loadPricing();
  const m = p.models['gpt-image-2.5-flare'];
  assert.deepEqual([m.textInputPer1M, m.imageInputPer1M, m.imageOutputPer1M], [5, 8, 30]);
  assert.equal(p.rates.verified, true);
  assert.equal(p.rates.source, 'https://developers.openai.com/api/docs/guides/image-generation');
  const usage = { input_tokens: 100, input_tokens_details: { image_tokens: 40, text_tokens: 60 }, output_tokens: 200 };
  assert.ok(Math.abs(computeUsd(p, 'gpt-image-2.5-flare', usage)! - (60 * 5 + 40 * 8 + 200 * 30) / 1e6) < 1e-12);
  assert.equal(computeUsd(p, 'gpt-image-2.5-flare', undefined), null);
});

test("prix par token et nombre de tokens : deux incertitudes indépendantes", () => {
  const p = loadPricing();
  const c = { model: 'gpt-image-2.5-flare', quality: 'low', size: '1536x864', n: 1, promptChars: 300, inputImages: 0 };
  const base = estimateUsd(p, c);
  // prix non vérifiés : multiplicateur sur les prix, tokens inchangés
  const unverified = { ...p, rates: { ...p.rates, verified: false } };
  assert.ok(Math.abs(estimateUsd(unverified, c) - base * p.rates.unverifiedRatesFactor) < 1e-12);
  assert.deepEqual(estimateTokens(unverified, c), estimateTokens(p, c));
  // marge sur les tokens : change les tokens, pas les prix
  const riskier = { ...p, tokenEstimates: { ...p.tokenEstimates, safetyFactor: p.tokenEstimates.safetyFactor * 2 } };
  assert.ok(Math.abs(estimateUsd(riskier, c) - base * 2) < 1e-12);
  assert.ok(estimateTokens(riskier, c).output > estimateTokens(p, c).output);
  // observations : relèvent l'estimation, ne la baissent jamais
  assert.ok(estimateUsd(p, c, { low: 5000 }) > base);
  assert.equal(estimateUsd(p, c, { low: 1 }), base);
});

test('estimation toujours supérieure au coût calculé, et relevée par les tokens observés', async () => {
  const r = await G({ output: 'o.png' });
  assert.ok(r.estUsd > r.computedUsd!);
  const obs = observedTokensPerMp(readLedger('session-A'));
  assert.ok(Math.abs(obs.low - 120 / ((1536 * 864) / 1e6)) < 1e-6);
});

// ---- Identifiant de session ---------------------------------------------------------------------

test("identifiant de session fiable seulement s'il vient de Claude Code Cloud", () => {
  delete process.env.IMAGE_SESSION_ID;
  process.env.CLAUDE_CODE_REMOTE_SESSION_ID = 'cse_01GS3JDzMd4NsA1cGoUVdyMY';
  assert.deepEqual(sessionInfo(), { id: 'cse_01GS3JDzMd4NsA1cGoUVdyMY', reliable: true, source: 'CLAUDE_CODE_REMOTE_SESSION_ID' });
  process.env.CLAUDE_CODE_REMOTE_SESSION_ID = 'n-importe-quoi';
  assert.equal(sessionInfo().reliable, false);
  delete process.env.CLAUDE_CODE_REMOTE_SESSION_ID;
  process.env.CLAUDE_CODE_SESSION_ID = 'c67e6e95-561e-5d19-b6fa-05a05c45c1b3'; // uuid de conversation : volontairement ignoré
  assert.deepEqual([sessionInfo().id, sessionInfo().reliable], ['unknown-session', false]);
  process.env.IMAGE_SESSION_ID = 'explicite';
  assert.deepEqual([sessionInfo().id, sessionInfo().reliable], ['explicite', true]);
});

test('sans identifiant fiable : compteur partagé et plafond conservateur de 20 images', async () => {
  delete process.env.IMAGE_SESSION_ID;
  delete process.env.CLAUDE_CODE_REMOTE_SESSION_ID;
  for (const t of ['a', 'b', 'c', 'd']) await G({ n: 5, task: t });
  await blocked(G({ n: 1, task: 'e' }), 'SESSION_LIMIT');
  assert.equal(summarize(readLedger('unknown-session'), 'unknown-session').sessionImages, 20);
  process.env.IMAGE_SESSION_ID = 'session-fiable';
  await G({ task: 'f' }); // une session identifiée garde son propre compteur
  assert.equal(summarize(readLedger('session-fiable'), 'session-fiable').sessionImages, 1);
});

// ---- Preuves d'examen : inventaire avant, inspection après -----------------------------------------

test("inventaire : preuve exigée, à usage unique, liée à la session et à l'état des assets", async () => {
  await blocked(generateImage(opts()), 'NO_INVENTORY');
  await blocked(generateImage({ ...opts(), inventoryCode: '0000' }), 'INVENTORY_INVALID');
  const inv = await createInventory('foret');
  assert.ok(existsSync(inv.sheet));
  assert.equal(inv.tiles.length, 2);
  const ev = readLedger('session-A').find((e) => e.ev === 'inventory')!;
  assert.ok(!('code' in ev) && !JSON.stringify(ev).includes(`"${inv.code}"`), "le registre ne contient que l'empreinte du code");
  await blocked(generateImage({ ...opts(), inventoryCode: String((Number(inv.code) % 9000) + 1000) }), 'INVENTORY_INVALID');
  process.env.IMAGE_SESSION_ID = 'session-B';
  await blocked(generateImage({ ...opts(), inventoryCode: inv.code }), 'INVENTORY_INVALID');
  process.env.IMAGE_SESSION_ID = 'session-A';
  assert.equal(hits, 0);
  const r = await generateImage({ ...opts({ output: 'p.png' }), inventoryCode: inv.code });
  await R(r.files[0], 'ok');
  await blocked(generateImage({ ...opts({ task: 'x' }), inventoryCode: inv.code }), 'INVENTORY_INVALID'); // usage unique
});

test('inventaire périmé si les assets changent ou après le délai', async () => {
  let inv = await createInventory();
  writeFileSync(join(dir, 'assets', 'areas', 'sanctuary.png'), makePng(96, 54));
  await blocked(generateImage({ ...opts(), inventoryCode: inv.code }), 'INVENTORY_STALE');
  inv = await createInventory();
  const f = process.env.IMAGE_LEDGER_FILE!;
  writeFileSync(f, readFileSync(f, 'utf8').split('\n').map((l) => (l && JSON.parse(l).id === inv.id ? JSON.stringify({ ...JSON.parse(l), ts: '2020-01-01T00:00:00.000Z' }) : l)).join('\n'));
  await blocked(generateImage({ ...opts(), inventoryCode: inv.code }), 'INVENTORY_EXPIRED');
  assert.equal(hits, 0);
});

test('les références de style n°9 sont toujours en tête de la planche d\'inventaire', async () => {
  const refDir = join(dir, 'refs');
  mkdirSync(refDir);
  writeFileSync(join(refDir, 'b-decor.png'), makePng(96, 54));
  writeFileSync(join(refDir, 'a-personnage.png'), makePng(96, 54));
  process.env.IMAGE_STYLE_REF_DIR = refDir;
  try {
    const inv = await createInventory('forest');
    assert.equal(inv.refCount, 2);
    assert.deepEqual(inv.tiles.slice(0, 2).map((t) => basename(t.path)), ['a-personnage.png', 'b-decor.png']);
    assert.equal(inv.tiles.length, 4); // 2 références + 2 assets
  } finally {
    process.env.IMAGE_STYLE_REF_DIR = join(dir, 'no-refs');
  }
});

test('la planche de contact est une vraie image avec le code dessiné dedans', async () => {
  const inv = await createInventory();
  const r = decodeRaster(readFileSync(inv.sheet));
  assert.ok(r.width >= 900 && r.height >= 200);
  const px = (x: number, y: number) => [...r.data.slice((y * r.width + x) * 4, (y * r.width + x) * 4 + 3)];
  assert.deepEqual(px(9, 9), [255, 255, 255]); // bandeau blanc du code
  assert.ok(Array.from({ length: 200 }, (_, i) => px(10 + i, 20)).some((c) => c[0] === 0), 'des pixels noirs (chiffres) dans le bandeau');
});

test("verdict impossible sans inspection visuelle (code de l'aperçu)", async () => {
  const r = await G({ output: 'v.png' });
  await blocked(reviewImage(r.files[0], 'ok', 'ok', '', ''), 'INSPECTION_REQUIRED');
  await blocked(reviewImage(r.files[0], 'ok', 'ok', '', 'abc'), 'INSPECTION_REQUIRED');
  const ins = await createInspection(r.files[0]);
  assert.ok(existsSync(ins.preview));
  await blocked(reviewImage(r.files[0], 'ok', 'ok', '', 'abc'), 'INSPECTION_REQUIRED');
  await reviewImage(r.files[0], 'ok', 'ok', '', ins.code);
  assert.equal(calls(readLedger('session-A')).at(-1)!.reviews.length, 1);
});

test("image modifiée après inspection : verdict refusé", async () => {
  const r = await G({ output: 'm.png' });
  const ins = await createInspection(r.files[0]);
  writeFileSync(r.files[0], makePng(1536, 864, true)); // contenu différent du faux serveur
  await blocked(reviewImage(r.files[0], 'ok', 'ok', '', ins.code), 'INSPECTION_STALE');
});

test('plusieurs images par appel : chacune doit être inspectée et évaluée', async () => {
  const r = await G({ n: 2, output: 'multi.png', task: 'multi' });
  await R(r.files[0], 'fail', 'style');
  await blocked(G({ task: 'multi', prompt: 'autre sujet ruines lune' }), 'REVIEW_PENDING');
  await R(r.files[1], 'ok');
  await G({ task: 'multi', prompt: 'autre sujet ruines lune', output: 'm2.png' });
  assert.equal(hits, 2);
});

// ---- Persistance du registre -------------------------------------------------------------------------

test('registre : durable seulement une fois commité ; branches parallèles fusionnées sans perte', () => {
  const repo = join(dir, 'repo');
  mkdirSync(join(repo, 'tools/images/ledger'), { recursive: true });
  const git = (...a: string[]) => execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  git('init', '-q', '-b', 'main');
  writeFileSync(join(repo, '.gitattributes'), readFileSync('.gitattributes', 'utf8')); // règle réelle du dépôt
  const ledger = join(repo, 'tools/images/ledger/ledger.jsonl');
  process.env.IMAGE_LEDGER_FILE = ledger;
  writeFileSync(ledger, '{"ev":"init","id":"i"}\n');
  assert.equal(persistenceStatus(repo).tracked, false);
  git('add', '-A'); git('commit', '-qm', 'init');
  assert.deepEqual([persistenceStatus(repo).tracked, persistenceStatus(repo).uncommitted], [true, false]);
  appendFileSync(ledger, '{"ev":"reserve","id":"x"}\n');
  assert.equal(persistenceStatus(repo).uncommitted, true);
  git('commit', '-qam', 'x');
  git('checkout', '-qb', 'b1'); appendFileSync(ledger, '{"ev":"reserve","id":"b1"}\n'); git('commit', '-qam', 'b1');
  git('checkout', '-q', 'main'); git('checkout', '-qb', 'b2'); appendFileSync(ledger, '{"ev":"reserve","id":"b2"}\n'); git('commit', '-qam', 'b2');
  git('merge', '-q', '--no-edit', 'b1'); // sans la règle merge=union, ce serait un conflit
  const ids = readFileSync(ledger, 'utf8').trim().split('\n').map((l) => JSON.parse(l).id);
  for (const id of ['x', 'b1', 'b2']) assert.ok(ids.includes(id), `${id} conservé après fusion`);
  appendFileSync(ledger, '{"ev":"reserve","id":"non-commite"}\n');
  const clone = join(dir, 'clone'); // = environnement recréé : seul ce qui est commité survit
  execFileSync('git', ['clone', '-q', repo, clone]);
  assert.ok(!readFileSync(join(clone, 'tools/images/ledger/ledger.jsonl'), 'utf8').includes('non-commite'));
});
