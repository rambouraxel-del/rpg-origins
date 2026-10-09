// État de jeu unique, sérialisable. La liste des scènes terminées fait autorité sur la progression.
import { SAVE_VERSION, SCENARIO_VERSION } from '../config';
import type { CompanionId, Cond, Effect, Json, QuestState } from './types';
import { BALANCE } from '../data/balance';
import { audio } from '../systems/Audio';

export interface JournalEntry { id: string; title: string; text: string; tab: 'story' | 'people' | 'memory' }

export interface GameState {
  saveVersion: number;
  scenarioVersion: number;
  chapter: number;
  completedScenes: string[];
  currentScene: string | null;
  stepIndex: number;
  flags: Record<string, Json>;
  powers: string[];
  accords: string[];
  items: string[]; // objets narratifs
  equipment: { owned: string[]; slots: { arme: string | null; protection: string | null; talisman: string | null } };
  consumables: Record<string, number>;
  money: number;
  quests: Record<string, QuestState>;
  questTasks: Record<string, string[]>;
  trust: Record<string, number>;
  party: CompanionId[];
  support: CompanionId | null;
  hero: { hp: number; energy: number; maxHp: number; maxEnergy: number; points: number; spent: Record<string, number>; name: string };
  location: { loc: string; x: number; y: number };
  discovered: string[];
  journal: JournalEntry[];
  /** Effets déjà appliqués (récompenses, acquisitions) : garantit l'unicité même après rechargement. */
  once: Record<string, true>;
  seenHotspots: Record<string, true>;
  seenLines: string[];
  playMs: number;
  difficulty: 'histoire' | 'aventure';
  /** Date de la sauvegarde, pour l'affichage. */
  savedAt?: string;
}

export function newState(): GameState {
  return {
    saveVersion: SAVE_VERSION,
    scenarioVersion: SCENARIO_VERSION,
    chapter: 0,
    completedScenes: [],
    currentScene: null,
    stepIndex: 0,
    flags: { amnesia: false, identity_known: false, ancestry_known: false, companions_know_origin: false, origin_confession: null, final_route: null, b_mercy: null, b_archive_cache: null, b_truth_told: null, elyan_status: 'alive', ending: null, nara_relationship: 'friendship' },
    powers: [],
    accords: [],
    items: [],
    equipment: { owned: [], slots: { arme: null, protection: null, talisman: null } },
    consumables: { soin: 2 },
    money: 12,
    quests: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`q${String(i + 1).padStart(2, '0')}`, 'unavailable' as QuestState])),
    questTasks: {},
    trust: {},
    party: [],
    support: null,
    hero: { hp: BALANCE.hero.hp, energy: BALANCE.hero.energy, maxHp: BALANCE.hero.hp, maxEnergy: BALANCE.hero.energy, points: 0, spent: {}, name: 'Le prince' },
    location: { loc: 'palace_garden', x: 480, y: 420 },
    discovered: [],
    journal: [],
    once: {},
    seenHotspots: {},
    seenLines: [],
    playMs: 0,
    difficulty: 'aventure',
  };
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function evalCond(s: GameState, c?: Cond): boolean {
  if (!c) return true;
  if (c.flags) for (const [k, v] of Object.entries(c.flags)) if (s.flags[k] !== v) return false;
  if (c.notFlags) for (const k of c.notFlags) if (s.flags[k]) return false;
  if (c.scenes) for (const id of c.scenes) if (!s.completedScenes.includes(id)) return false;
  if (c.notScenes) for (const id of c.notScenes) if (s.completedScenes.includes(id)) return false;
  if (c.powers) for (const p of c.powers) if (!s.powers.includes(p)) return false;
  if (c.items) for (const i of c.items) if (!s.items.includes(i)) return false;
  if (c.party) for (const p of c.party) if (!s.party.includes(p as CompanionId)) return false;
  if (c.chapterMin !== undefined && s.chapter < c.chapterMin) return false;
  if (c.chapterMax !== undefined && s.chapter > c.chapterMax) return false;
  if (c.quests) for (const [q, st] of Object.entries(c.quests)) { const a = Array.isArray(st) ? st : [st]; if (!a.includes(s.quests[q])) return false; }
  if (c.any && !c.any.some((x) => evalCond(s, x))) return false;
  return true;
}

export type StateListener = (s: GameState, e: Effect) => void;
const listeners: StateListener[] = [];
export const onEffect = (fn: StateListener) => { listeners.push(fn); };

/** Applique des effets. Avec onceKey, l'ensemble n'est appliqué qu'une seule fois (idempotent). Renvoie vrai si appliqué. */
export function applyEffects(s: GameState, effects: Effect[] | undefined, onceKey?: string): boolean {
  if (!effects || effects.length === 0) return false;
  if (onceKey) {
    if (s.once[onceKey]) return false;
    s.once[onceKey] = true;
  }
  for (const e of effects) {
    applyOne(s, e);
    for (const l of listeners) l(s, e);
  }
  return true;
}

function applyOne(s: GameState, e: Effect): void {
  switch (e.op) {
    case 'flag': s.flags[e.key] = e.value === undefined ? true : e.value; break;
    case 'power': if (!s.powers.includes(e.id)) { s.powers.push(e.id); audio.chime(); } break;
    case 'accord': if (!s.accords.includes(e.id)) s.accords.push(e.id); break;
    case 'item': if (!s.items.includes(e.id)) { s.items.push(e.id); audio.chime(); } break;
    case 'removeItem': s.items = s.items.filter((i) => i !== e.id); break;
    case 'quest': {
      const cur = s.quests[e.id];
      // monotone : une quête terminée ne revient pas en arrière
      if (cur === 'completed') break;
      s.quests[e.id] = e.state;
      break;
    }
    case 'trust': s.trust[e.who] = clamp((s.trust[e.who] ?? 1) + e.delta, 0, 5); break;
    case 'chapter': {
      const old = s.chapter;
      s.chapter = Math.max(s.chapter, e.n);
      for (const t of BALANCE.tiers.chapters) {
        if (old <= t && s.chapter > t && !s.once[`tier:${t}`]) {
          s.once[`tier:${t}`] = true;
          s.hero.maxHp += BALANCE.tiers.hp; s.hero.maxEnergy += BALANCE.tiers.energy; s.hero.points += BALANCE.tiers.points;
          s.hero.hp = s.hero.maxHp; s.hero.energy = s.hero.maxEnergy;
        }
      }
      break;
    }
    case 'party': {
      if (e.add && !s.party.includes(e.add)) { s.party.push(e.add); if (s.trust[e.add] === undefined) s.trust[e.add] = 1; if (!s.support) s.support = e.add; }
      if (e.remove) { s.party = s.party.filter((p) => p !== e.remove); if (s.support === e.remove) s.support = s.party[0] ?? null; }
      break;
    }
    case 'journal': if (!s.journal.some((j) => j.id === e.id)) s.journal.push({ id: e.id, title: e.title, text: e.text, tab: e.tab ?? 'story' }); break;
    case 'heal': s.hero.hp = s.hero.maxHp; s.hero.energy = s.hero.maxEnergy; break;
    case 'money': s.money = Math.max(0, s.money + e.delta); break;
    case 'discover': if (!s.discovered.includes(e.loc)) s.discovered.push(e.loc); break;
    case 'maxStats':
      s.hero.maxHp += e.hp ?? 0; s.hero.maxEnergy += e.energy ?? 0; s.hero.points += e.points ?? 0;
      s.hero.hp = s.hero.maxHp; s.hero.energy = s.hero.maxEnergy; break;
    case 'equip': if (!s.equipment.owned.includes(e.id)) s.equipment.owned.push(e.id); break;
    case 'consumable': s.consumables[e.id] = Math.min(e.id === 'soin' ? BALANCE.hero.maxHealItems : 99, (s.consumables[e.id] ?? 0) + e.qty); break;
    case 'save': break; // traité par le service de sauvegarde via onEffect
  }
}

export function completeScene(s: GameState, id: string): void {
  if (!s.completedScenes.includes(id)) s.completedScenes.push(id);
}

/** Valeur stable de drapeau (jamais undefined). */
export const flag = (s: GameState, k: string): Json => s.flags[k] ?? false;
