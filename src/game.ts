// Registre central : état de partie, options, données chargées, événements. Un seul exemplaire par page.
import Phaser from 'phaser';
import { newState, type GameState } from './core/state';
import { loadOptions, type Options } from './core/save';
import type { LocationDef, QuestDef, SceneDef } from './core/types';

export class GameHub {
  state: GameState = newState();
  options: Options = loadOptions();
  events = new Phaser.Events.EventEmitter();
  locations = new Map<string, LocationDef>();
  scenes = new Map<string, SceneDef>();
  quests = new Map<string, QuestDef>();
  /** Vrai quand un menu ou un dialogue suspend la simulation. */
  uiLock = 0;
  devMode = false;
  world?: import('./scenes/WorldScene').WorldScene;
  /** Fonctions de pont fournies par la scène interface (assignées au démarrage). */
  ui!: UiApi & { menus: import('./ui/menus').Menus };

  get locked(): boolean { return this.uiLock > 0; }
  lock(): void { this.uiLock++; }
  unlock(): void { this.uiLock = Math.max(0, this.uiLock - 1); }
  reset(): void { this.state = newState(); this.uiLock = 0; }
}

export interface UiApi {
  say(lines: import('./core/types').Line[]): Promise<void>;
  choose(prompt: string | undefined, labels: string[]): Promise<number>;
  puzzle(def: import('./core/types').PuzzleDef): Promise<void>;
  toast(text: string): void;
  objective(text: string | null): void;
  prompt(text: string | null): void;
  fade(out: boolean, ms?: number): Promise<void>;
  flash(ms?: number): void;
  titleCard(text: string, ms?: number): Promise<void>;
  restMenu(): Promise<void>;
  finalChoice(): Promise<'A' | 'B'>;
  confirm(text: string, yes: string, no: string): Promise<boolean>;
  openMenu(kind: 'pause' | 'journal' | 'inventory' | 'map'): void;
  setHud(visible: boolean): void;
  reset(): void;
  combatHud(info: CombatHudInfo | null): void;
  pauseOverlay(on: boolean): void;
  gameOver(): Promise<'retry' | 'load'>;
  credits(ending: 'A' | 'B'): Promise<void>;
  endMenu(): Promise<'threshold' | 'new' | 'title'>;
  epilogue(ending: 'A' | 'B'): Promise<void>;
}

export interface CombatHudInfo { enemies: { name: string; hp: number; max: number }[]; support?: string | null; supportReady: boolean; cooldowns: { dodge: number; p1: number; p2: number }; powers: [string | null, string | null] }

export const hub = new GameHub();
