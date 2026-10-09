// Génération et édition d'images via l'API OpenAI, derrière des garde-fous bloquants (guard.ts) et un registre (ledger.ts).
// Aucune clé dans le code : l'authentification est ajoutée par le proxy (Network Secret).
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DEFAULT_MODEL, DEFAULT_QUALITY, DEFAULT_SIZE, loadPricing, paths, sessionId } from './config.ts';
import { computeUsd, parseSize } from './cost.ts';
import { GuardError, preflight, taskKey, type Decision } from './guard.ts';
import { appendEvent, calls, readLedger, withLock } from './ledger.ts';
import { inspectPng, technicalIssues } from './png.ts';
import { codeHash, fileHash } from './proof.ts';

export { GuardError } from './guard.ts';

const DEFAULT_LEDGER = join(dirname(fileURLToPath(import.meta.url)), 'ledger', 'ledger.jsonl');

/** Champs de décision : obligatoires, vérifiés avant tout appel payant. */
export interface DecisionFields {
  /** Bénéfice concret pour le jeu (≥ 15 car.). */
  purpose: string;
  /** Où l'image sera utilisée. */
  target: string;
  /** Assets existants examinés et pourquoi une transformation par code ne suffit pas (≥ 15 car.). */
  reuseChecked: string;
  /** Requis si la qualité n'est pas "low". */
  qualityReason?: string;
  /** Requis après 2 échecs comparables. */
  newApproach?: string;
  /** Justification pour passer outre les heuristiques (redondance, transformation par code). Jamais pour les plafonds. */
  overrideReason?: string;
  /** Regroupe les tentatives d'un même besoin (défaut : dérivé de purpose). */
  task?: string;
  overwrite?: boolean;
  /** Code lu sur la planche de contact de `image:inventory` : preuve que les assets existants ont été regardés. */
  inventoryCode?: string;
}

export interface ImageOptions extends DecisionFields {
  prompt: string;
  model?: string;
  quality?: string;
  size?: string;
  /** Nom du fichier de sortie, sans dossier. Avec n > 1 : suffixe -1, -2... */
  output?: string;
  /** 1 à 5. */
  n?: number;
}

export interface EditOptions extends ImageOptions {
  inputs: string[];
  mask?: string;
}

export interface ImageResult {
  files: string[];
  usage?: unknown;
  estUsd: number;
  /** Calculé depuis les tokens renvoyés (null si usage absent). Ce n'est pas la facture. */
  computedUsd: number | null;
  /** Problèmes techniques détectés automatiquement : à traiter avant de valider (image:review). */
  issues: string[];
  warnings: string[];
}

const safeName = (name: string | undefined, fallback: string) => {
  const base = basename(name?.trim() || fallback).replace(/[^\w.-]/g, '-');
  return extname(base).toLowerCase() === '.png' ? base : `${base}.png`;
};

function detailLog(entry: Record<string, unknown>): void {
  const file = paths().detailLog;
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, JSON.stringify({ date: new Date().toISOString(), ...entry }) + '\n');
}

class ApiError extends Error {
  status?: number;
  /** Vrai si la requête n'a certainement pas atteint le serveur (DNS introuvable, connexion refusée) : rien n'a pu être facturé. */
  neverSent = false;
}

const NEVER_SENT = new Set(['ENOTFOUND', 'ECONNREFUSED', 'EAI_AGAIN']);

async function callApi(kind: 'generations' | 'edits', init: RequestInit): Promise<any> {
  let res: Response;
  try {
    res = await fetch(`${paths().apiBase}/${kind}`, init);
  } catch (e) {
    const cause = (e as { cause?: { code?: string; message?: string; errors?: { code?: string }[] } }).cause;
    const code = cause?.code ?? cause?.errors?.[0]?.code;
    const err = new ApiError(`Connexion à l'API impossible : ${code ?? (e as Error).message}${code === 'ENOTFOUND' ? ' (lancer via npm run : NODE_USE_ENV_PROXY=1)' : ''}`);
    err.neverSent = (code !== undefined && NEVER_SENT.has(code)) || cause?.message === 'bad port'; // refus de fetch avant toute connexion
    throw err;
  }
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    const err = new ApiError(`Réponse API illisible (HTTP ${res.status}) : ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  if (!res.ok) {
    const err = new ApiError(`Erreur API HTTP ${res.status} : ${json?.error?.message ?? text.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

async function run(kind: 'generate' | 'edit', o: ImageOptions & { inputs?: string[]; mask?: string }): Promise<ImageResult> {
  const session = sessionId();
  const model = o.model ?? DEFAULT_MODEL;
  const quality = o.quality ?? DEFAULT_QUALITY;
  const size = o.size ?? DEFAULT_SIZE;
  const n = o.n ?? 1;
  const name = safeName(o.output, `${kind}-${Date.now()}.png`);
  const outputDir = paths().outputDir;
  const fileFor = (i: number) => join(outputDir, n === 1 ? name : name.replace(/\.png$/, `-${i + 1}.png`));
  const decision: Decision = {
    kind, prompt: o.prompt, n, model, quality, size, inputImages: (o.inputs?.length ?? 0) + (o.mask ? 1 : 0),
    outputFile: fileFor(0), purpose: o.purpose, target: o.target, reuseChecked: o.reuseChecked,
    qualityReason: o.qualityReason, newApproach: o.newApproach, overrideReason: o.overrideReason, task: o.task, overwrite: o.overwrite, inventoryCode: o.inventoryCode,
  };
  parseSize(size);
  for (let i = 1; i < n; i++) {
    if (existsSync(fileFor(i)) && !o.overwrite) throw new GuardError('OUTPUT_EXISTS', `${fileFor(i)} existe déjà (--overwrite pour remplacer).`);
  }
  const forms: Blob[] = [];
  if (kind === 'edit') {
    if (!o.inputs?.length) throw new Error('Au moins une image source est requise.');
    for (const p of [...o.inputs, ...(o.mask ? [o.mask] : [])]) {
      if (!existsSync(resolve(p))) throw new Error(`Image introuvable : ${p}`);
      forms.push(new Blob([readFileSync(resolve(p))], { type: 'image/png' }));
    }
  }

  // Contrôle + réservation atomiques : l'appel ne part que si le registre l'autorise.
  const id = randomUUID();
  const pre = await withLock(() => {
    const events = readLedger(session);
    const p = preflight(decision, events, session);
    appendEvent({
      ev: 'reserve', id, session, kind, task: p.task, model, quality, size, n, estUsd: p.estUsd, purpose: o.purpose, target: o.target,
      reuseChecked: o.reuseChecked, inventoryId: p.inventoryId, newApproach: o.newApproach ?? null, overrideReason: o.overrideReason ?? null,
      prompt: o.prompt.slice(0, 400), output: fileFor(0),
    });
    return p;
  });

  // Checkpoint financier : la réservation doit être poussée avant l'envoi. Échec = aucun appel (réservation libérée).
  try {
    checkpointLedger(`Registre images : réservation ${id.slice(0, 8)} (${o.target ?? ''})`);
  } catch (e) {
    await withLock(() => {
      readLedger(session);
      appendEvent({ ev: 'release', id, session, reason: `checkpoint distant impossible : ${(e as Error).message}`.slice(0, 300) });
    });
    throw new GuardError('CHECKPOINT_FAILED', `Sauvegarde distante du registre impossible, aucun appel envoyé : ${(e as Error).message}`);
  }

  try {
    let json: any;
    if (kind === 'generate') {
      json = await callApi('generations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: o.prompt, n, size, quality }),
      });
    } else {
      const form = new FormData();
      form.set('model', model); form.set('prompt', o.prompt); form.set('n', String(n)); form.set('size', size); form.set('quality', quality);
      o.inputs!.forEach((p, i) => form.append('image[]', forms[i], basename(p)));
      if (o.mask) form.set('mask', forms[forms.length - 1], basename(o.mask));
      json = await callApi('edits', { method: 'POST', body: form });
    }
    const items: { b64_json?: string }[] = json.data ?? [];
    if (items.length === 0 || items.some((d) => !d.b64_json)) throw new Error("La réponse ne contient pas d'image en base64.");

    const { w, h } = parseSize(size);
    const expected = { width: w, height: h };
    const files: string[] = [];
    const issues: string[] = [];
    items.forEach((d, i) => {
      const file = fileFor(i);
      mkdirSync(dirname(file), { recursive: true });
      const buf = Buffer.from(d.b64_json!, 'base64');
      const info = inspectPng(buf); // lève si invalide
      writeFileSync(file, buf);
      if (!existsSync(file)) throw new Error(`Fichier non créé : ${file}`);
      files.push(file);
      for (const issue of technicalIssues(info, expected)) issues.push(`${basename(file)} : ${issue}`);
    });

    const computedUsd = computeUsd(loadPricing(), model, json.usage);
    await withLock(() => {
      readLedger(session);
      appendEvent({ ev: 'settle', id, session, status: 'ok', files, obsUsd: computedUsd, usage: json.usage ?? null, issues });
    });
    detailLog({ kind, id, session, model, quality, size, n, prompt: o.prompt, files, estUsd: pre.estUsd, computedUsd, usage: json.usage ?? null, issues });
    try { checkpointLedger(`Registre images : règlement ${id.slice(0, 8)}`); } catch { pre.warnings.push('Checkpoint distant du règlement non poussé : à pousser avant toute autre action.'); }
    return { files, usage: json.usage, estUsd: pre.estUsd, computedUsd, issues, warnings: pre.warnings };
  } catch (e) {
    const status = (e as ApiError).status;
    // 4xx ou requête jamais partie = rien de facturé. Autre erreur (5xx, coupure, réponse illisible) : on garde l'estimation (prudent).
    const notBilled = (status !== undefined && status >= 400 && status < 500) || (e as ApiError).neverSent === true;
    await withLock(() => {
      readLedger(session);
      if (notBilled) appendEvent({ ev: 'release', id, session, reason: (e as Error).message.slice(0, 300) });
      else appendEvent({ ev: 'unknown', id, session, reason: (e as Error).message.slice(0, 300) });
    });
    detailLog({ kind, id, session, status: 'error', model, quality, size, n, prompt: o.prompt, error: (e as Error).message });
    throw e;
  }
}

/**
 * Commit + push du registre (seulement pour le vrai registre du dépôt : les tests utilisent un registre temporaire).
 * Lève une erreur si la sauvegarde distante échoue.
 */
export function checkpointLedger(message: string): void {
  const ledger = paths().ledger;
  if (resolve(ledger) !== resolve(DEFAULT_LEDGER)) return;
  const git = (...a: string[]) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('add', ledger);
  try {
    git('-c', 'user.name=Claude', '-c', 'user.email=noreply@anthropic.com', 'commit', '-m', message, '--', ledger);
  } catch (e) {
    const out = String((e as { stdout?: string }).stdout ?? '') + String((e as Error).message);
    if (!/nothing (added )?to commit|no changes added/i.test(out)) throw e;
  }
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  for (const wait of [0, 2000, 4000]) {
    if (wait) execFileSync('sleep', [String(wait / 1000)]);
    try {
      git('push', '-u', 'origin', branch);
      return;
    } catch (e) {
      if (wait === 4000) throw e;
    }
  }
}

export const generateImage = (o: ImageOptions) => run('generate', o);
export const editImage = (o: EditOptions) => run('edit', o);

/**
 * Enregistre le verdict d'une image générée. Exige le code lu sur l'aperçu produit par `image:inspect`
 * (preuve technique que l'image a été regardée) et que le fichier n'ait pas changé depuis.
 */
export async function reviewImage(file: string, verdict: 'ok' | 'fail', reason = 'other', note = '', code = ''): Promise<void> {
  const session = sessionId();
  await withLock(() => {
    const events = readLedger(session);
    const call = calls(events).find((c) => ((c.settle?.files as string[] | undefined) ?? []).some((f) => f === file || basename(f) === basename(file)));
    if (!call) throw new Error(`Aucune génération enregistrée pour ${file}.`);
    if (verdict === 'fail' && !reason) throw new Error('--reason requis pour un échec.');
    const stored = ((call.settle?.files as string[]) ?? []).find((f) => f === file || basename(f) === basename(file))!;
    const inspection = [...call.inspections].reverse().find((i) => i.file === stored && i.session === session && i.codeHash === codeHash(code, String(i.inspectId)));
    if (!code.trim() || !inspection) {
      throw new GuardError('INSPECTION_REQUIRED', `Aucune inspection valide pour ${file} : \`npm run image:inspect -- --file ${file}\`, regardez l'aperçu, puis repassez le code lu avec --code.`);
    }
    if (inspection.fileHash !== fileHash(stored)) throw new GuardError('INSPECTION_STALE', `${file} a changé depuis son inspection : refaites image:inspect.`);
    appendEvent({ ev: 'review', id: call.id, session, file: stored, verdict, reason, note: note.slice(0, 300), inspectId: inspection.inspectId, task: taskKey({ task: call.task }) });
  });
}

export { createInspection, createInventory } from './proof.ts';
