// Sauvegardes locales (localStorage) : 3 emplacements manuels, une automatique, une de seuil (avant C09S05).
// Export/import par fichier JSON avec somme de contrôle ; un import refusé ne touche à aucun emplacement.
import { SAVE_VERSION } from '../config';
import { newState, type GameState } from './state';

export type SlotId = 'slot1' | 'slot2' | 'slot3' | 'auto' | 'threshold';
export const SLOTS: SlotId[] = ['slot1', 'slot2', 'slot3', 'auto', 'threshold'];
const KEY = (s: SlotId) => `rpgo:save:${s}`;

export class SaveError extends Error {}

/** Somme de contrôle simple (FNV-1a 32 bits) : détecte les fichiers corrompus ou tronqués, pas une protection anti-triche. */
export function checksum(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

export interface SaveEnvelope { game: 'rpg-origins'; saveVersion: number; sum: string; body: string }

export function serialize(s: GameState): string {
  const body = JSON.stringify({ ...s, savedAt: new Date().toISOString() });
  const env: SaveEnvelope = { game: 'rpg-origins', saveVersion: SAVE_VERSION, sum: checksum(body), body };
  return JSON.stringify(env);
}

/** Décode et valide. Lève SaveError avec un message compréhensible. Migre les anciennes versions. */
export function deserialize(text: string): GameState {
  let env: SaveEnvelope;
  try { env = JSON.parse(text) as SaveEnvelope; } catch { throw new SaveError("Ce fichier n'est pas une sauvegarde de RPG Origins (contenu illisible)."); }
  if (!env || env.game !== 'rpg-origins' || typeof env.body !== 'string') throw new SaveError("Ce fichier n'est pas une sauvegarde de RPG Origins.");
  if (checksum(env.body) !== env.sum) throw new SaveError('Sauvegarde corrompue ou modifiée (somme de contrôle incorrecte). Aucun emplacement n\'a été modifié.');
  if (typeof env.saveVersion !== 'number' || env.saveVersion > SAVE_VERSION) throw new SaveError('Sauvegarde issue d\'une version plus récente du jeu : impossible de la lire.');
  let raw: Partial<GameState>;
  try { raw = JSON.parse(env.body) as Partial<GameState>; } catch { throw new SaveError('Sauvegarde illisible.'); }
  return migrate(raw);
}

/** Migration explicite : complète les champs manquants sans jamais renvoyer le joueur au prologue. */
export function migrate(raw: Partial<GameState>): GameState {
  const base = newState();
  const s: GameState = { ...base, ...raw, flags: { ...base.flags, ...(raw.flags ?? {}) }, hero: { ...base.hero, ...(raw.hero ?? {}) } } as GameState;
  if (!Array.isArray(s.completedScenes) || typeof s.chapter !== 'number') throw new SaveError('Sauvegarde incomplète.');
  s.saveVersion = SAVE_VERSION;
  return s;
}

const hasStorage = (): boolean => { try { return typeof localStorage !== 'undefined'; } catch { return false; } };

export function writeSlot(slot: SlotId, s: GameState): void {
  if (!hasStorage()) throw new SaveError('Stockage du navigateur indisponible.');
  localStorage.setItem(KEY(slot), serialize(s));
}

export function readSlot(slot: SlotId): GameState | null {
  if (!hasStorage()) return null;
  const t = localStorage.getItem(KEY(slot));
  if (!t) return null;
  try { return deserialize(t); } catch { return null; }
}

export interface SlotInfo { slot: SlotId; empty: boolean; chapter?: number; scene?: string | null; savedAt?: string; playMs?: number; broken?: boolean }

export function slotInfo(slot: SlotId): SlotInfo {
  if (!hasStorage()) return { slot, empty: true };
  const t = localStorage.getItem(KEY(slot));
  if (!t) return { slot, empty: true };
  try {
    const s = deserialize(t);
    return { slot, empty: false, chapter: s.chapter, scene: s.currentScene ?? s.completedScenes[s.completedScenes.length - 1] ?? null, savedAt: s.savedAt, playMs: s.playMs };
  } catch { return { slot, empty: false, broken: true }; }
}

export function exportSlot(slot: SlotId): string | null {
  return hasStorage() ? localStorage.getItem(KEY(slot)) : null;
}

/** Importe un fichier dans un emplacement. En cas d'échec, lève SaveError et ne modifie rien. */
export function importInto(slot: SlotId, text: string): GameState {
  const s = deserialize(text);
  writeSlot(slot, s);
  return s;
}

export function eraseSlot(slot: SlotId): void { if (hasStorage()) localStorage.removeItem(KEY(slot)); }

// --- Réglages (séparés de la partie) ---
export interface Options { music: number; sfx: number; textSpeed: number; textSize: number; reduceFx: boolean; keys: Record<string, string> }
export const DEFAULT_OPTIONS: Options = { music: 0.6, sfx: 0.8, textSpeed: 40, textSize: 18, reduceFx: false, keys: {} };
export function loadOptions(): Options {
  try { return { ...DEFAULT_OPTIONS, ...(JSON.parse(localStorage.getItem('rpgo:options') ?? '{}') as Partial<Options>) }; } catch { return { ...DEFAULT_OPTIONS }; }
}
export function saveOptions(o: Options): void { try { localStorage.setItem('rpgo:options', JSON.stringify(o)); } catch { /* stockage indisponible */ } }
