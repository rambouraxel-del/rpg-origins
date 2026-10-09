// Résolution interne 16:9 (affichée à l'échelle de la fenêtre, ex. x2 => 1920x1080, avec lissage).
// Les décors (style non-pixel art n°9) sont en 960x540. Le héros (92x92, pixel art provisoire) est affiché à sa taille d'origine.
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const PLAYER_SPEED = 130; // pixels / seconde
export const PLAYER_RUN_SPEED = 220; // avec Maj

// Ordre d'affichage des calques.
export const DEPTH = {
  ground: 0,
  decor: 10,
  entities: 20, // joueur, PNJ, objets interactifs
  foreground: 30, // éléments qui passent devant le joueur (feuillages, arches...)
  effects: 40, // pluie, brouillard, lumières...
  ui: 100,
} as const;
