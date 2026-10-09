// Preuves d'examen visuel. Un code aléatoire est dessiné DANS une image : on ne peut le lire qu'en regardant cette image.
//  - inventaire : planche de contact des assets existants (à regarder avant de générer) ;
//  - inspection : aperçu d'une image générée (à regarder avant de rendre un verdict).
// Le code n'est jamais affiché par la CLI ; le registre n'en garde que l'empreinte.
import { createHash, randomInt } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { paths, sessionId } from './config.ts';
import { appendEvent, calls, readLedger, withLock } from './ledger.ts';
import { blit, decodeRaster, drawDigits, encodePng, fillRect, fit, newRaster, type Raster } from './png.ts';
import { words } from './text.ts';

export const codeHash = (code: string, id: string) => createHash('sha256').update(`${code.trim()}:${id}`).digest('hex');
export const fileHash = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
const newCode = () => String(randomInt(1000, 10000));

export interface Asset {
  path: string;
  generated: boolean;
  size: number;
}

const IMAGE_EXT = /\.(png|webp|gif|jpe?g)$/i;

export function listAssets(): Asset[] {
  const { assetsRoot, outputDir } = paths();
  const generatedRoot = resolve(outputDir);
  const out: Asset[] = [];
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir).sort()) {
      const p = join(dir, f);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (IMAGE_EXT.test(f)) out.push({ path: p, generated: resolve(p).startsWith(generatedRoot + '/') || resolve(p) === generatedRoot, size: st.size });
    }
  };
  walk(assetsRoot);
  return out;
}

/** Empreinte des assets du jeu (hors images générées en essai) : un inventaire n'est valable que pour cet état. */
export function assetsHash(): string {
  const h = createHash('sha256');
  for (const a of listAssets().filter((x) => !x.generated)) h.update(`${relative('.', a.path)}:${a.size}\n`);
  return h.digest('hex');
}

function rankAssets(query: string, assets: Asset[]): Asset[] {
  const q = words(query);
  const score = (a: Asset) => [...words(a.path.replace(/[\\/.]/g, ' '))].filter((w) => q.has(w)).length;
  return [...assets].sort((a, b) => score(b) - score(a) || Number(a.generated) - Number(b.generated));
}

const COLS = 3, TILE_W = 320, TILE_H = 180, PAD = 8, HEADER = 64, MAX_TILES = 12;

export interface Inventory {
  id: string;
  /** Réservé aux tests : la CLI ne l'affiche jamais. */
  code: string;
  sheet: string;
  listed: Asset[];
  tiles: Asset[];
}

/** Crée la planche de contact des assets existants et enregistre l'inventaire (empreinte du code + état des assets). */
export async function createInventory(query = ''): Promise<Inventory> {
  const session = sessionId();
  const listed = rankAssets(query, listAssets());
  const tiles = listed.filter((a) => /\.png$/i.test(a.path)).slice(0, MAX_TILES);
  const rows = Math.max(1, Math.ceil(tiles.length / COLS));
  const sheet = newRaster(COLS * (TILE_W + PAD) + PAD, HEADER + rows * (TILE_H + PAD), [30, 30, 36]);
  const code = newCode();
  drawDigits(sheet, PAD, PAD, code, 6, [0, 0, 0], [255, 255, 255]);
  tiles.forEach((a, i) => {
    const x = PAD + (i % COLS) * (TILE_W + PAD), y = HEADER + Math.floor(i / COLS) * (TILE_H + PAD);
    fillRect(sheet, x, y, TILE_W, TILE_H, [70, 70, 78]);
    let img: Raster;
    try {
      img = fit(decodeRaster(readFileSync(a.path)), TILE_W, TILE_H);
    } catch {
      img = newRaster(40, 20, [120, 40, 40]); // illisible : tuile rouge
    }
    blit(sheet, img, x + Math.floor((TILE_W - img.width) / 2), y + Math.floor((TILE_H - img.height) / 2));
    drawDigits(sheet, x, y, String(i + 1), 3, [255, 255, 255], [0, 0, 0]);
  });
  const id = `inv-${Date.now().toString(36)}-${randomInt(1e6)}`;
  const file = join(paths().proofDir, `inventory-${id}.png`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, encodePng(sheet));
  await withLock(() => {
    readLedger(session);
    appendEvent({ ev: 'inventory', id, session, codeHash: codeHash(code, id), assetsHash: assetsHash(), tiles: tiles.map((a) => a.path), assetCount: listed.length });
  });
  return { id, code, sheet: file, listed, tiles };
}

export interface Inspection {
  id: string;
  code: string;
  preview: string;
}

/** Crée l'aperçu d'une image générée (code dessiné en en-tête) et enregistre l'inspection (empreinte du code + du fichier). */
export async function createInspection(file: string): Promise<Inspection> {
  const session = sessionId();
  if (!existsSync(file)) throw new Error(`Image introuvable : ${file}`);
  const events = readLedger(session);
  const call = calls(events).find((c) => ((c.settle?.files as string[] | undefined) ?? []).some((f) => f === file || basename(f) === basename(file)));
  if (!call) throw new Error(`Aucune génération enregistrée pour ${file} : rien à inspecter.`);
  const img = fit(decodeRaster(readFileSync(file)), 1024, 576);
  const out = newRaster(img.width, img.height + HEADER, [30, 30, 36]);
  const code = newCode();
  drawDigits(out, PAD, PAD, code, 6, [0, 0, 0], [255, 255, 255]);
  blit(out, img, 0, HEADER);
  const id = `ins-${Date.now().toString(36)}-${randomInt(1e6)}`;
  const preview = join(paths().proofDir, `inspect-${id}.png`);
  mkdirSync(dirname(preview), { recursive: true });
  writeFileSync(preview, encodePng(out));
  await withLock(() => {
    readLedger(session);
    appendEvent({ ev: 'inspect', id: call.id, inspectId: id, session, file, codeHash: codeHash(code, id), fileHash: fileHash(file) });
  });
  return { id, code, preview };
}
