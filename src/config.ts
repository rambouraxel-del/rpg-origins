// Constantes globales. Écran logique fixe 960x540 (16:9), caméra fixe.
export const GAME_W = 960;
export const GAME_H = 540;

export const DEPTH = {
  background: 0,
  ground: 10,
  /** Les entités se trient par y des pieds (ENTITY_BASE + y). */
  entityBase: 1000,
  foreground: 5000,
  fx: 6000,
  ui: 10000,
} as const;

export const HERO_SCALE = 0.85;
export const WALK_SPEED = 150;
export const RUN_SPEED = 230;
export const INTERACT_RADIUS = 62;
export const SAVE_VERSION = 1;
/** Version du scénario : sert aux migrations de sauvegarde. */
export const SCENARIO_VERSION = 1;
