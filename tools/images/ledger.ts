// Registre persistant (JSONL, ajout seul) des dépenses et compteurs, par session et par mois.
// Chaque appel = un événement "reserve" (estimation), puis "settle" (calcul réel) ou "release" (rien généré).
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { UNKNOWN_SESSION, paths } from './config.ts';
import { parseSize } from './cost.ts';

export interface LedgerEvent {
  ev: 'init' | 'reserve' | 'settle' | 'release' | 'unknown' | 'review' | 'inventory' | 'inspect';
  ts: string;
  month: string;
  session: string;
  id?: string;
  [k: string]: unknown;
}

export const monthOf = (d = new Date()) => d.toISOString().slice(0, 7);

/** Verrou par répertoire : sûr entre processus concurrents ; verrou périmé après 30 s. */
export async function withLock<T>(fn: () => T | Promise<T>): Promise<T> {
  const lock = paths().ledger + '.lock';
  mkdirSync(dirname(lock), { recursive: true });
  const start = Date.now();
  for (;;) {
    try {
      mkdirSync(lock);
      break;
    } catch {
      try {
        if (Date.now() - statSync(lock).mtimeMs > 30_000) rmSync(lock, { recursive: true, force: true });
      } catch {
        /* libéré entre-temps */
      }
      if (Date.now() - start > 10_000) throw new Error('Registre verrouillé par un autre processus (timeout 10 s).');
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  try {
    return await fn();
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}

/** Lit le registre. S'il est absent (environnement recréé, fichier supprimé), il est recréé en mode "récupéré" = plafonds conservateurs. */
export function readLedger(session: string): LedgerEvent[] {
  const file = paths().ledger;
  if (!existsSync(file)) {
    mkdirSync(dirname(file), { recursive: true });
    const init: LedgerEvent = { ev: 'init', ts: new Date().toISOString(), month: monthOf(), session, recovered: true };
    writeFileSync(file, JSON.stringify(init) + '\n');
  }
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as LedgerEvent);
}

export function appendEvent(e: Omit<LedgerEvent, 'ts' | 'month'> & { ts?: string; month?: string }): LedgerEvent {
  const full = { ts: new Date().toISOString(), month: monthOf(), ...e } as LedgerEvent;
  appendFileSync(paths().ledger, JSON.stringify(full) + '\n');
  return full;
}

export interface Call {
  id: string;
  session: string;
  month: string;
  task: string;
  n: number;
  estUsd: number;
  obsUsd: number | null;
  /** Montant retenu pour les plafonds : constaté si connu, sinon estimé (prudent). */
  countedUsd: number;
  state: 'reserved' | 'settled' | 'released' | 'unknown';
  reserve: LedgerEvent;
  settle?: LedgerEvent;
  reviews: LedgerEvent[];
  inspections: LedgerEvent[];
}

/** Reconstruit l'état de chaque appel à partir des événements. */
export function calls(events: LedgerEvent[]): Call[] {
  const byId = new Map<string, Call>();
  for (const e of events) {
    if (e.ev === 'reserve') {
      byId.set(e.id!, {
        id: e.id!, session: e.session, month: e.month, task: String(e.task ?? ''), n: Number(e.n), estUsd: Number(e.estUsd),
        obsUsd: null, countedUsd: Number(e.estUsd), state: 'reserved', reserve: e, reviews: [], inspections: [],
      });
      continue;
    }
    const c = e.id ? byId.get(e.id) : undefined;
    if (!c) continue;
    if (e.ev === 'settle') {
      c.state = 'settled';
      c.settle = e;
      c.obsUsd = typeof e.obsUsd === 'number' ? e.obsUsd : null;
      c.countedUsd = c.obsUsd ?? c.estUsd;
    } else if (e.ev === 'release') {
      c.state = 'released';
      c.countedUsd = 0;
    } else if (e.ev === 'unknown') {
      c.state = 'unknown'; // appel peut-être facturé : on garde l'estimation
    } else if (e.ev === 'review') {
      c.reviews.push(e);
    } else if (e.ev === 'inspect') {
      c.inspections.push(e);
    }
  }
  return [...byId.values()];
}

export interface Summary {
  month: string;
  recovered: boolean;
  monthEstUsd: number;
  monthObsUsd: number;
  monthCountedUsd: number;
  sessionImages: number;
  sessionCountedUsd: number;
  monthImages: number;
}

/** Verdict d'un appel : "ok" si au moins une image est acceptée, "fail" si toutes sont rejetées, undefined tant que des images ne sont pas évaluées. */
export function verdictOf(c: Call): 'ok' | 'fail' | undefined {
  const files = (c.settle?.files as string[] | undefined) ?? [];
  const latest = new Map<string, string>();
  for (const r of c.reviews) latest.set(String(r.file ?? ''), String(r.verdict));
  if (latest.has('')) return latest.get('') as 'ok' | 'fail'; // revues historiques sans fichier
  if ([...latest.values()].includes('ok')) return 'ok';
  if (files.length > 0 && files.every((f) => latest.get(f) === 'fail')) return 'fail';
  return undefined;
}

export const failReason = (c: Call) => String([...c.reviews].reverse().find((r) => r.verdict === 'fail')?.reason ?? 'other');

/** Maximum de tokens de sortie par mégapixel réellement observé, par qualité (sert à relever l'estimation). */
export function observedTokensPerMp(events: LedgerEvent[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of calls(events)) {
    const tokens = (c.settle?.usage as { output_tokens?: number } | null | undefined)?.output_tokens;
    if (c.state !== 'settled' || typeof tokens !== 'number') continue;
    try {
      const { w, h } = parseSize(String(c.reserve.size));
      const perMp = tokens / (c.n * ((w * h) / 1e6));
      const q = String(c.reserve.quality);
      out[q] = Math.max(out[q] ?? 0, perMp);
    } catch {
      /* taille illisible : ignoré */
    }
  }
  return out;
}

export interface Summary {
  month: string;
  recovered: boolean;
  monthEstUsd: number;
  monthObsUsd: number;
  monthCountedUsd: number;
  sessionImages: number;
  sessionCountedUsd: number;
  monthImages: number;
}

/**
 * Compteur de session : par identifiant. Sans identifiant fiable (session "unknown-session"), toutes les sessions
 * anonymes partagent UN compteur, sur tout le mois (conservateur).
 */
export function summarize(events: LedgerEvent[], session: string, month = monthOf()): Summary {
  const all = calls(events);
  const inMonth = all.filter((c) => c.month === month);
  const mine = all.filter((c) => c.session === session && c.state !== 'released' && (session !== UNKNOWN_SESSION || c.month === month));
  const sum = (a: Call[], f: (c: Call) => number) => a.reduce((s, c) => s + f(c), 0);
  return {
    month,
    recovered: events.some((e) => e.ev === 'init' && e.recovered === true && e.month === month),
    monthEstUsd: sum(inMonth, (c) => (c.state === 'released' ? 0 : c.estUsd)),
    monthObsUsd: sum(inMonth, (c) => c.obsUsd ?? 0),
    monthCountedUsd: sum(inMonth, (c) => c.countedUsd),
    sessionImages: sum(mine, (c) => c.n),
    sessionCountedUsd: sum(mine, (c) => c.countedUsd),
    monthImages: sum(inMonth.filter((c) => c.state !== 'released'), (c) => c.n),
  };
}

export interface Persistence {
  tracked: boolean | null;
  uncommitted: boolean | null;
  detail: string;
}

/** Le registre n'est durable que s'il est suivi par git ET commité/poussé. Vérification locale (ne contacte pas GitHub). */
export function persistenceStatus(cwd?: string): Persistence {
  const file = paths().ledger;
  const git = (...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try {
    let tracked = true;
    try {
      git('ls-files', '--error-unmatch', '--', file);
    } catch {
      tracked = false;
    }
    const dirty = git('status', '--porcelain', '--', file) !== '';
    const detail = !tracked ? 'registre NON suivi par git : perdu si l\'environnement est recréé' : dirty ? 'modifications NON commitées : à commiter et pousser pour survivre à une recréation de l\'environnement' : 'à jour dans git localement (vérifiez aussi que la branche est poussée)';
    return { tracked, uncommitted: dirty, detail };
  } catch {
    return { tracked: null, uncommitted: null, detail: 'état git indisponible' };
  }
}
