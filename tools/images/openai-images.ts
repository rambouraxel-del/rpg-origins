// Module réutilisable : génération et édition d'images via l'API OpenAI.
// Aucune clé dans le code : l'authentification est ajoutée par le proxy (Network Secret).
import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';

const API = 'https://api.openai.com/v1/images';
export const OUTPUT_DIR = 'public/assets/generated';
export const LOG_FILE = 'logs/image-generations.jsonl';
export const MAX_IMAGES_PER_TASK = 5;

export const DEFAULTS = {
  model: 'gpt-image-2.5-flare',
  quality: 'low',
  size: '1536x864',
} as const;

export interface ImageOptions {
  prompt: string;
  model?: string;
  quality?: string;
  size?: string;
  /** Nom du fichier de sortie, sans dossier (ex. "forest-v2.png"). Avec n > 1 : suffixe -1, -2... */
  output?: string;
  /** Nombre d'images (1 à 5). */
  n?: number;
}

export interface EditOptions extends ImageOptions {
  /** Image(s) source à modifier (chemins). */
  inputs: string[];
  /** Masque PNG optionnel (zones transparentes = à modifier). */
  mask?: string;
}

export interface ImageResult {
  files: string[];
  usage?: unknown;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function safeName(name: string | undefined, fallback: string): string {
  const base = basename(name?.trim() || fallback).replace(/[^\w.-]/g, '-');
  return extname(base).toLowerCase() === '.png' ? base : `${base}.png`;
}

function checkCount(n: number | undefined): number {
  const count = n ?? 1;
  if (!Number.isInteger(count) || count < 1 || count > MAX_IMAGES_PER_TASK) {
    throw new Error(`n doit être un entier entre 1 et ${MAX_IMAGES_PER_TASK} (reçu : ${n}).`);
  }
  return count;
}

/** Écrit le PNG décodé, puis vérifie : fichier présent, non vide, signature PNG, dimensions lisibles. */
function savePng(b64: string, file: string): void {
  mkdirSync(dirname(file), { recursive: true });
  const buf = Buffer.from(b64, 'base64');
  writeFileSync(file, buf);
  if (!existsSync(file) || statSync(file).size === 0) throw new Error(`Fichier non créé : ${file}`);
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error(`Le résultat n'est pas un PNG valide : ${file}`);
}

function pngSize(file: string): string {
  const buf = readFileSync(file);
  return `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`;
}

function log(entry: Record<string, unknown>): void {
  mkdirSync(dirname(LOG_FILE), { recursive: true });
  appendFileSync(LOG_FILE, JSON.stringify({ date: new Date().toISOString(), ...entry }) + '\n');
}

async function callApi(kind: 'generations' | 'edits', init: RequestInit): Promise<any> {
  let res: Response;
  try {
    res = await fetch(`${API}/${kind}`, init);
  } catch (e) {
    const code = (e as { cause?: { code?: string } }).cause?.code;
    const hint = code === 'ENOTFOUND' ? ' (lancer via npm run, qui active NODE_USE_ENV_PROXY=1)' : '';
    throw new Error(`Connexion à l'API impossible : ${code ?? (e as Error).message}${hint}`);
  }
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Réponse API illisible (HTTP ${res.status}) : ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`Erreur API HTTP ${res.status} : ${json?.error?.message ?? text.slice(0, 300)}`);
  return json;
}

async function finish(kind: string, opts: Required<Pick<ImageOptions, 'model' | 'quality' | 'size'>> & ImageOptions, n: number, json: any, extra: Record<string, unknown>): Promise<ImageResult> {
  const items: { b64_json?: string }[] = json.data ?? [];
  if (items.length === 0 || items.some((d) => !d.b64_json)) throw new Error('La réponse ne contient pas d\'image en base64.');
  const name = safeName(opts.output, `${kind}-${Date.now()}.png`);
  const files = items.map((d, i) => {
    const file = join(OUTPUT_DIR, n === 1 ? name : name.replace(/\.png$/, `-${i + 1}.png`));
    savePng(d.b64_json!, file);
    return file;
  });
  log({ kind, model: opts.model, quality: opts.quality, size: opts.size, n, prompt: opts.prompt, files, dimensions: files.map(pngSize), usage: json.usage ?? null, ...extra });
  return { files, usage: json.usage };
}

export async function generateImage(options: ImageOptions): Promise<ImageResult> {
  const n = checkCount(options.n);
  const opts = { ...options, model: options.model ?? DEFAULTS.model, quality: options.quality ?? DEFAULTS.quality, size: options.size ?? DEFAULTS.size };
  try {
    const json = await callApi('generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: opts.model, prompt: opts.prompt, n, size: opts.size, quality: opts.quality }),
    });
    return await finish('generate', opts, n, json, {});
  } catch (e) {
    log({ kind: 'generate', status: 'error', model: opts.model, quality: opts.quality, size: opts.size, n, prompt: opts.prompt, error: (e as Error).message });
    throw e;
  }
}

export async function editImage(options: EditOptions): Promise<ImageResult> {
  const n = checkCount(options.n);
  if (options.inputs.length === 0) throw new Error('Au moins une image source est requise.');
  const opts = { ...options, model: options.model ?? DEFAULTS.model, quality: options.quality ?? DEFAULTS.quality, size: options.size ?? DEFAULTS.size };
  const blob = (path: string) => {
    const file = resolve(path);
    if (!existsSync(file)) throw new Error(`Image introuvable : ${path}`);
    return new Blob([readFileSync(file)], { type: 'image/png' });
  };
  try {
    const form = new FormData();
    form.set('model', opts.model);
    form.set('prompt', opts.prompt);
    form.set('n', String(n));
    form.set('size', opts.size);
    form.set('quality', opts.quality);
    for (const input of options.inputs) form.append('image[]', blob(input), basename(input));
    if (options.mask) form.set('mask', blob(options.mask), basename(options.mask));
    const json = await callApi('edits', { method: 'POST', body: form });
    return await finish('edit', opts, n, json, { inputs: options.inputs, mask: options.mask ?? null });
  } catch (e) {
    log({ kind: 'edit', status: 'error', model: opts.model, quality: opts.quality, size: opts.size, n, prompt: opts.prompt, inputs: options.inputs, error: (e as Error).message });
    throw e;
  }
}
