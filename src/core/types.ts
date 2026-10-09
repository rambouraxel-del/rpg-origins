// Types partagés : lieux, scènes, effets, conditions. Tout le contenu est en données (src/data), jamais en code arbitraire.
export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }
/** Position : nom d'ancre du lieu courant ou point explicite. */
export type Place = string | Pt;
/** Zone : nom de zone/ancre du lieu courant ou rectangle explicite. */
export type Area = string | Rect;
export type Facing = 'down' | 'up' | 'left' | 'right';
export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export type QuestState = 'unavailable' | 'available' | 'active' | 'completed' | 'left_open';
export type CompanionId = 'nara' | 'soren' | 'tessa';

/** Condition évaluée sur l'état de jeu. Tous les champs présents doivent être vrais. */
export interface Cond {
  flags?: Record<string, Json>;
  notFlags?: string[];
  scenes?: string[];
  notScenes?: string[];
  powers?: string[];
  items?: string[];
  party?: string[];
  chapterMin?: number;
  chapterMax?: number;
  quests?: Record<string, QuestState | QuestState[]>;
  any?: Cond[];
}

/** Opérations de données autorisées (liste fermée). Les opérations "once" sont idempotentes. */
export type Effect =
  | { op: 'flag'; key: string; value?: Json }
  | { op: 'power'; id: string }
  | { op: 'accord'; id: string }
  | { op: 'item'; id: string; qty?: number }
  | { op: 'removeItem'; id: string }
  | { op: 'quest'; id: string; state: QuestState }
  | { op: 'trust'; who: CompanionId; delta: number }
  | { op: 'chapter'; n: number }
  | { op: 'party'; add?: CompanionId; remove?: CompanionId }
  | { op: 'journal'; id: string; title: string; text: string; tab?: 'story' | 'people' | 'memory' }
  | { op: 'save'; slot: 'auto' | 'threshold' }
  | { op: 'heal' }
  | { op: 'money'; delta: number }
  | { op: 'discover'; loc: string }
  | { op: 'maxStats'; hp?: number; energy?: number; points?: number }
  | { op: 'equip'; id: string }
  | { op: 'consumable'; id: string; qty: number };

export interface Line {
  /** Identifiant de ligne (facultatif) : sert à l'historique et aux contrôles. */
  id?: string;
  who: string;
  text: string;
  /** Narration sans interlocuteur. */
  narr?: boolean;
}

export interface Choice {
  label: string;
  /** Conditions d'affichage. */
  cond?: Cond;
  effects?: Effect[];
  lines?: Line[];
  /** Identifiant d'une variante enregistrée dans les drapeaux. */
  set?: { key: string; value: Json };
}

export type PuzzleDef =
  | { kind: 'pick'; title: string; prompt: string; options: { id: string; label: string; clue: string }[]; solution: string; hints: [string, string, string]; fail: string; success: string }
  | { kind: 'set'; title: string; prompt: string; options: { id: string; label: string; clue: string }[]; solution: string[]; hints: [string, string, string]; fail: string; success: string }
  | { kind: 'valves'; title: string; prompt: string; basins: { id: string; label: string; min: number; max: number }[]; supply: number; hints: [string, string, string]; fail: string; success: string }
  | { kind: 'order'; title: string; prompt: string; options: { id: string; label: string }[]; solution: string[]; hints: [string, string, string]; fail: string; success: string };

export interface EnemySpawn { type: EnemyType; at: Place }
export type EnemyType = 'automate' | 'sentinelle' | 'pompage' | 'soldat';

export interface GuideGroup { id: string; label: string; from: Place; to: Place; count?: number }

export type Step =
  | { t: 'say'; lines: Line[]; effects?: Effect[] }
  | { t: 'reach'; text: string; zone: Area; effects?: Effect[] }
  | { t: 'inspect'; text: string; targets: string[]; min?: number; effects?: Effect[] }
  | { t: 'talk'; text: string; npc: string; lines: Line[]; choices?: Choice[]; choicePrompt?: string; effects?: Effect[] }
  | { t: 'choice'; prompt?: string; options: Choice[]; key?: string }
  | { t: 'puzzle'; def: PuzzleDef; effects?: Effect[] }
  | { t: 'combat'; text?: string; enemies: EnemySpawn[]; support?: boolean; effects?: Effect[]; pauseAllowed?: boolean }
  | { t: 'guide'; text: string; groups: GuideGroup[]; effects?: Effect[] }
  | { t: 'stealth'; text: string; goal: Area; patrols: { path: Place[]; w: number; h: number }[]; start: Place; effects?: Effect[]; fallback: 'retry' }
  | { t: 'move'; loc: string; spawn: string }
  | { t: 'fx'; kind: 'fade-out' | 'fade-in' | 'flash' | 'shake' | 'title' | 'wait'; ms?: number; text?: string }
  | { t: 'set'; effects: Effect[] }
  | { t: 'rest'; text: string; effects?: Effect[] }
  | { t: 'end'; ending: 'A' | 'B' }
  | { t: 'finalChoice' };

export interface ActorPlacement { id: string; at: Place; face?: Facing; label?: string }

export interface SceneDef {
  id: string;
  chapter: number;
  title: string;
  loc: string;
  spawn?: string;
  requires?: Cond;
  actors?: ActorPlacement[];
  /** Compagnons affichés (suivent le héros). */
  party?: CompanionId[];
  /** Points d'intérêt supplémentaires propres à la scène. */
  hotspots?: Hotspot[];
  /** Flashback / lumière particulière du lieu. */
  tint?: { color: number; alpha: number };
  steps: Step[];
  onComplete?: Effect[];
  next?: string | null;
  /** Texte de transition affiché avant la scène suivante. */
  summary?: string;
}

export interface Hotspot {
  id: string;
  /** Nom d'une zone du lieu (LocationDef.features) ; sinon x,y,w,h explicites. */
  at?: string;
  x?: number; y?: number; w?: number; h?: number;
  label: string;
  /** Texte d'examen (lignes affichées une à une). */
  text: string[];
  verb?: string;
  cond?: Cond;
  /** Conséquences à la première observation. */
  effects?: Effect[];
}

export interface ExitDef {
  id: string;
  rect: Rect;
  to: string;
  spawn: string;
  label?: string;
  cond?: Cond;
  lockedText?: string;
}

export interface LocationDef {
  id: string;
  name: string;
  /** Fichier de fond sous public/ ; sinon fond provisoire. */
  bg: string;
  /** Zones où les PIEDS peuvent aller. */
  walk: Rect[];
  /** Obstacles retirés de la zone de marche. */
  blocks?: Rect[];
  /** Parties du fond dessinées devant le héros quand ses pieds passent au-dessus de baseY. */
  occluders?: { rect: Rect; baseY: number }[];
  spawns: Record<string, Pt & { face?: Facing }>;
  /** Points d'appui nommés pour placer personnages, objectifs et ennemis (positions des pieds). */
  anchors: Record<string, Pt>;
  /** Zones nommées (éléments du décor interactifs). */
  features: Record<string, Rect>;
  exits: ExitDef[];
  hotspots?: Hotspot[];
  ambient?: string;
  /** Sol de repos (puits) : permet soin/sauvegarde. */
  rest?: Rect;
  mapPos?: { x: number; y: number };
}

export interface QuestDef {
  id: string;
  title: string;
  giver: string;
  where: string;
  availableAfter: Cond;
  summary: string;
  tasks: { id: string; text: string }[];
}

/** Une quête secondaire = suite d'étapes jouées sur place, chacune déclenchée par un point d'entrée dans un lieu. */
export interface QuestStage {
  loc: string;
  entry: { at: string; label: string; verb?: string };
  /** Brève description de l'étape dans le journal. */
  task: string;
  actors?: ActorPlacement[];
  hotspots?: Hotspot[];
  steps: Step[];
}

export interface QuestScript {
  id: string;
  title: string;
  where: string;
  giver: string;
  summary: string;
  available: Cond;
  stages: QuestStage[];
  rewards: Effect[];
  /** Phrase affichée à l'accomplissement. */
  done: string;
}
