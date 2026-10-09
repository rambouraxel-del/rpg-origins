// Tests des garde-fous avec un faux serveur OpenAI local : AUCUN appel payant.
import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { deflateSync } from 'node:zlib';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GuardError, generateImage, editImage, reviewImage, type ImageOptions } from '../openai-images.ts';
import { calls, readLedger, summarize } from '../ledger.ts';

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
  process.env.IMAGE_API_BASE = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
after(() => server.close());

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'img-test-'));
  process.env.IMAGE_LEDGER_FILE = join(dir, 'ledger.jsonl');
  writeFileSync(process.env.IMAGE_LEDGER_FILE, JSON.stringify({ ev: 'init', ts: new Date().toISOString(), month: new Date().toISOString().slice(0, 7), session: 's', recovered: false }) + '\n');
  process.env.IMAGE_DETAIL_LOG = join(dir, 'detail.jsonl');
  process.env.IMAGE_OUTPUT_DIR = join(dir, 'out');
  process.env.IMAGE_SESSION_ID = 'session-A';
  delete process.env.IMAGE_MONTHLY_BUDGET_USD;
  delete process.env.IMAGE_SESSION_LIMIT;
  hits = 0; behavior = 'ok';
});

let seq = 0;
const opts = (o: Partial<ImageOptions> = {}): ImageOptions => ({
  prompt: `zorb${seq}a zorb${seq}b zorb${seq}c zorb${seq}d zorb${seq}e`,
  purpose: `Décor numéro ${seq++} pour une zone du jeu`, target: 'public/assets/areas/x.png',
  reuseChecked: 'Assets examinés : aucun adapté ; pas une simple transformation', output: `img-${seq}.png`, ...o,
});
const blocked = async (p: Promise<unknown>, code: string) => {
  await assert.rejects(p, (e: unknown) => e instanceof GuardError && e.code === code, `attendu GuardError ${code}`);
};
const state = () => summarize(readLedger('session-A'), 'session-A');

test('plus de 5 images par appel : bloqué, API non appelée', async () => {
  await blocked(generateImage(opts({ n: 6 })), 'MAX_PER_CALL');
  assert.equal(hits, 0);
});

test('décision obligatoire : bénéfice, cible, réutilisation', async () => {
  await blocked(generateImage(opts({ purpose: 'test' })), 'NO_PURPOSE');
  await blocked(generateImage(opts({ target: '' })), 'NO_TARGET');
  await blocked(generateImage(opts({ reuseChecked: '' })), 'NO_REUSE_CHECK');
  assert.equal(hits, 0);
});

test('transformation par code détectée ; contournable avec justification', async () => {
  await blocked(generateImage(opts({ prompt: 'redimensionner et faire un miroir de la forêt' })), 'CODE_TRANSFORM');
  assert.equal(hits, 0);
  await generateImage(opts({ prompt: 'redimensionner la forêt', overrideReason: 'Le contenu doit être redessiné, pas seulement redimensionné' }));
  assert.equal(hits, 1);
});

test('qualité supérieure à low exige une justification', async () => {
  await blocked(generateImage(opts({ quality: 'medium' })), 'QUALITY_JUSTIFICATION');
  await generateImage(opts({ quality: 'medium', qualityReason: 'Deux échecs en low : détails illisibles' }));
  assert.equal(hits, 1);
});

test('génération réussie : fichier PNG, registre réserve+règlement, coût calculé depuis les tokens', async () => {
  const r = await generateImage(opts({ output: 'ok.png' }));
  assert.ok(existsSync(r.files[0]));
  assert.deepEqual(r.issues, []);
  assert.ok(r.estUsd > (r.computedUsd ?? 0), "l'estimation prudente dépasse le calcul réel");
  assert.ok(Math.abs((r.computedUsd ?? 0) - (59 * 5 + 120 * 40) / 1e6) < 1e-9);
  const c = calls(readLedger('session-A')).at(-1)!;
  assert.equal(c.state, 'settled');
  assert.equal(c.obsUsd, r.computedUsd);
  assert.ok(readFileSync(process.env.IMAGE_DETAIL_LOG!, 'utf8').includes('"prompt"'));
});

test('revue obligatoire avant de regénérer la même tâche', async () => {
  const first = await generateImage(opts({ task: 'foret', output: 'a.png' }));
  await blocked(generateImage(opts({ task: 'foret', prompt: 'tout autre sujet: ruines anciennes sous la lune' })), 'REVIEW_PENDING');
  await reviewImage(first.files[0], 'ok');
  await generateImage(opts({ task: 'foret', prompt: 'tout autre sujet: ruines anciennes sous la lune', output: 'b.png' }));
  assert.equal(hits, 2);
});

test('prompt redondant avec un résultat accepté : bloqué', async () => {
  const p = 'clairiere magique lumineuse champignons fougeres ruisseau cristallin';
  const first = await generateImage(opts({ prompt: p, output: 'a.png' }));
  await reviewImage(first.files[0], 'ok');
  await blocked(generateImage(opts({ prompt: p + ' encore', task: 'autre' })), 'REDUNDANT');
  assert.equal(hits, 1);
});

test('deux échecs comparables : nouvelle approche obligatoire', async () => {
  const t = { task: 'brume' };
  for (const [i, p] of ['aquarelle brumeuse lointaine montagnes', 'peinture montagnes lointaines brumeuses'].entries()) {
    const r = await generateImage(opts({ ...t, prompt: p, output: `f${i}.png` }));
    await reviewImage(r.files[0], 'fail', 'style');
  }
  await blocked(generateImage(opts({ ...t, prompt: 'dessin brumeux montagnes lointaines peint' })), 'REPEATED_FAILURE');
  await blocked(generateImage(opts({ ...t, prompt: 'portail antique runes dorees', newApproach: 'court' })), 'REPEATED_FAILURE');
  await generateImage(opts({ ...t, prompt: 'portail antique runes dorees', newApproach: 'Abandon du brouillard, cadrage serré sur un portail', output: 'g.png' }));
  assert.equal(hits, 3);
});

test('limite de session : bloque, et les sessions sont distinguées', async () => {
  process.env.IMAGE_SESSION_LIMIT = '3';
  await generateImage(opts({ n: 2, task: 't1' }));
  await blocked(generateImage(opts({ n: 2, task: 't2' })), 'SESSION_LIMIT');
  assert.equal(hits, 1);
  process.env.IMAGE_SESSION_ID = 'session-B';
  await generateImage(opts({ n: 2, task: 't3' }));
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
  await blocked(generateImage(opts()), 'SESSION_LIMIT');
});

test('budget mensuel : plafond, puis marge de sécurité de 20 %', async () => {
  process.env.IMAGE_MONTHLY_BUDGET_USD = '0.001';
  await blocked(generateImage(opts()), 'BUDGET');
  assert.equal(hits, 0);
  process.env.IMAGE_MONTHLY_BUDGET_USD = '1';
  const { estUsd } = await generateImage(opts({ task: 'mesure' }));
  // Le budget brut couvrirait la 2e estimation, mais pas une fois la marge retirée.
  const spent = state().monthCountedUsd;
  process.env.IMAGE_MONTHLY_BUDGET_USD = String((spent + estUsd) * 1.05);
  await blocked(generateImage(opts({ task: 'marge' })), 'BUDGET');
  assert.equal(hits, 1);
});

test('la dépense du mois précédent ne compte pas', async () => {
  writeFileSync(process.env.IMAGE_LEDGER_FILE!, readFileSync(process.env.IMAGE_LEDGER_FILE!, 'utf8') + [
    { ev: 'reserve', id: 'old', ts: '2020-01-01T00:00:00Z', month: '2020-01', session: 'x', task: 'old', n: 1, estUsd: 9.9 },
    { ev: 'settle', id: 'old', ts: '2020-01-01T00:00:00Z', month: '2020-01', session: 'x', obsUsd: 9.9 },
  ].map((e) => JSON.stringify(e)).join('\n') + '\n');
  await generateImage(opts());
  assert.equal(hits, 1);
});

test('erreur API 4xx : libérée (rien compté), pas de nouvelle tentative', async () => {
  behavior = '400';
  await assert.rejects(generateImage(opts({ n: 2 })), /HTTP 400/);
  assert.equal(hits, 1);
  assert.equal(state().sessionImages, 0);
  assert.equal(state().monthCountedUsd, 0);
});

test('erreur API 5xx : estimation conservée (peut avoir été facturé)', async () => {
  behavior = '500';
  await assert.rejects(generateImage(opts({ n: 2 })), /HTTP 500/);
  assert.equal(hits, 1);
  assert.equal(state().sessionImages, 2);
  assert.ok(state().monthCountedUsd > 0);
});

test('registre absent : recréé en mode récupéré, plafonds conservateurs (20 images, 1 $)', async () => {
  rmSync(process.env.IMAGE_LEDGER_FILE!);
  await generateImage(opts({ n: 5, task: 'a' }));
  assert.equal(state().recovered, true);
  process.env.IMAGE_SESSION_LIMIT = '100';
  for (const t of ['b', 'c', 'd']) await generateImage(opts({ n: 5, task: t }));
  await blocked(generateImage(opts({ n: 1, task: 'e' })), 'SESSION_LIMIT');
});

test('image vide détectée automatiquement', async () => {
  behavior = 'blank';
  const r = await generateImage(opts());
  assert.ok(r.issues.some((i) => i.includes('uniforme')));
});

test('processus concurrents : une seule réservation passe', async () => {
  process.env.IMAGE_SESSION_LIMIT = '1';
  const results = await Promise.allSettled([generateImage(opts({ task: 'p1' })), generateImage(opts({ task: 'p2' })), generateImage(opts({ task: 'p3' }))]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(hits, 1);
});

test('modèle sans tarif connu : refusé', async () => {
  await assert.rejects(generateImage(opts({ model: 'modele-inconnu' })), /sans tarif connu/);
  assert.equal(hits, 0);
});

test("édition : image source manquante refusée avant tout appel", async () => {
  await assert.rejects(editImage({ ...opts(), inputs: [join(dir, 'absent.png')] }), /introuvable/);
  assert.equal(hits, 0);
});

test('édition : passe par le même contrôle et le même registre', async () => {
  const src = join(dir, 'src.png');
  writeFileSync(src, makePng(64, 36));
  const r = await editImage({ ...opts({ output: 'edit.png' }), inputs: [src] });
  assert.ok(existsSync(r.files[0]));
  assert.equal(hits, 1);
  assert.equal(calls(readLedger('session-A')).at(-1)!.reserve.kind, 'edit');
});
