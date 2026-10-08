// Description "données" d'une zone du jeu. Ajouter une zone = ajouter un fichier de config.

export type AreaId = 'forest' | 'clearing' | 'sanctuary';

export type Edge = 'left' | 'right' | 'top' | 'bottom';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Élément de décor provisoire (rectangle coloré). */
export interface DecorElement extends Rect {
  color: number;
  /** 'ground' = sol, 'decor' = derrière le joueur, 'foreground' = devant le joueur. */
  layer: 'ground' | 'decor' | 'foreground';
  /** Si vrai, le joueur ne peut pas traverser cet élément. */
  solid?: boolean;
}

/** Sortie : une portion d'un bord de l'écran qui mène à une autre zone. */
export interface Exit {
  edge: Edge;
  /** Début et fin de l'ouverture le long du bord (en pixels). */
  from: number;
  to: number;
  target: AreaId;
  /** Point d'apparition dans la zone cible. */
  targetSpawn: string;
}

/** Réservé pour plus tard : coffres, panneaux, PNJ... */
export interface InteractableConfig extends Rect {
  id: string;
  kind: string;
}

/** Réservé pour plus tard : pluie, brouillard, lucioles... */
export interface EffectConfig {
  kind: string;
  options?: Record<string, unknown>;
}

export interface AreaConfig {
  id: AreaId;
  name: string;
  backgroundColor: number;
  /** Points d'apparition nommés. 'default' est utilisé au lancement. */
  spawns: Record<string, { x: number; y: number }>;
  exits: Exit[];
  decor: DecorElement[];
  /** Murs invisibles supplémentaires. */
  colliders?: Rect[];
  interactables?: InteractableConfig[];
  effects?: EffectConfig[];
}
