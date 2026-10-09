// Registre persistant (JSONL, ajout seul) des dépenses et compteurs, par session et par mois.
// Chaque appel = un événement "reserve" (estimation), puis "settle" (calcul réel) ou "release" (rien généré).
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { paths } from './config.ts';

export interface LedgerEvent {
  ev: 'init' | 'reserve' | 'settle' | 'release' | 'unknown' | 'review';
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
}

/** Reconstruit l'état de chaque appel à partir des événements. */
export function calls(events: LedgerEvent[]): Call[] {
  const byId = new Map<string, Call>();
  for (const e of events) {
    if (e.ev === 'reserve') {
      byId.set(e.id!, {
        id: e.id!, session: e.session, month: e.month, task: String(e.task ?? ''), n: Number(e.n), estUsd: Number(e.estUsd),
        obsUsd: null, countedUsd: Number(e.estUsd), state: 'reserved', reserve: e, reviews: [],
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

export function summarize(events: LedgerEvent[], session: string, month = monthOf()): Summary {
  const all = calls(events);
  const inMonth = all.filter((c) => c.month === month);
  const mine = all.filter((c) => c.session === session && c.state !== 'released');
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
