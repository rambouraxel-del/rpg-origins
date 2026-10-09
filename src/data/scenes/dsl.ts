// Constructeurs compacts pour écrire les scènes en données. Aucune logique : chaque helper renvoie un objet de données validable.
import type { ActorPlacement, Area, Choice, CompanionId, Cond, Effect, EnemySpawn, Hotspot, Json, Line, Place, PuzzleDef, SceneDef, Step } from '../../core/types';

export const L = (who: string, text: string): Line => ({ who, text });
export const N = (text: string): Line => ({ who: 'narr', narr: true, text });

export const say = (lines: Line[], effects?: Effect[]): Step => ({ t: 'say', lines, effects });
export const reach = (text: string, zone: Area, effects?: Effect[]): Step => ({ t: 'reach', text, zone, effects });
export const inspect = (text: string, targets: string[], min?: number, effects?: Effect[]): Step => ({ t: 'inspect', text, targets, min, effects });
export const talk = (text: string, npc: string, lines: Line[], choices?: Choice[], choicePrompt?: string, effects?: Effect[]): Step => ({ t: 'talk', text, npc, lines, choices, choicePrompt, effects });
export const choice = (prompt: string | undefined, options: Choice[]): Step => ({ t: 'choice', prompt, options });
export const puzzle = (def: PuzzleDef, effects?: Effect[]): Step => ({ t: 'puzzle', def, effects });
export const fx = (kind: 'fade-out' | 'fade-in' | 'flash' | 'shake' | 'title' | 'wait', ms?: number, text?: string): Step => ({ t: 'fx', kind, ms, text });
export const set = (...effects: Effect[]): Step => ({ t: 'set', effects });
export const move = (loc: string, spawn: string): Step => ({ t: 'move', loc, spawn });
export const combat = (text: string | undefined, enemies: EnemySpawn[], effects?: Effect[], support = true): Step => ({ t: 'combat', text, enemies, effects, support });
export const guide = (text: string, groups: { id: string; label: string; from: Place; to: Place }[], effects?: Effect[]): Step => ({ t: 'guide', text, groups, effects });
export const stealth = (text: string, start: Place, goal: Area, patrols: { path: Place[]; w: number; h: number }[], effects?: Effect[]): Step => ({ t: 'stealth', text, start, goal, patrols, effects, fallback: 'retry' });
export const rest = (text: string, effects?: Effect[]): Step => ({ t: 'rest', text, effects });

export const F = (key: string, value: Json = true): Effect => ({ op: 'flag', key, value });
export const item = (id: string): Effect => ({ op: 'item', id });
export const power = (id: string): Effect => ({ op: 'power', id });
export const accord = (id: string): Effect => ({ op: 'accord', id });
export const trust = (who: CompanionId, delta: number): Effect => ({ op: 'trust', who, delta });
export const chapter = (n: number): Effect => ({ op: 'chapter', n });
export const joinParty = (add: CompanionId): Effect => ({ op: 'party', add });
export const save = (slot: 'auto' | 'threshold'): Effect => ({ op: 'save', slot });
export const journal = (id: string, title: string, text: string, tab: 'story' | 'people' | 'memory' = 'story'): Effect => ({ op: 'journal', id, title, text, tab });
export const equip = (id: string): Effect => ({ op: 'equip', id });
export const heal = (): Effect => ({ op: 'heal' });
export const soin = (qty: number): Effect => ({ op: 'consumable', id: 'soin', qty });

export const at = (id: string, where: Place, face?: ActorPlacement['face'], label?: string): ActorPlacement => ({ id, at: where, face, label });
export const hs = (id: string, where: string, label: string, text: string[], o: { verb?: string; cond?: Cond; effects?: Effect[] } = {}): Hotspot => ({ id, at: where, label, text, ...o });

export const opt = (label: string, o: Omit<Choice, 'label'> = {}): Choice => ({ label, ...o });
export const setv = (key: string, value: Json) => ({ key, value });

export function scene(d: SceneDef): SceneDef { return d; }

/** Énigmes : aides en trois niveaux (rappel du but, contrainte, prochaine action). */
export type Hints = [string, string, string];
