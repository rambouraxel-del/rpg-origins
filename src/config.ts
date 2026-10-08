// Résolution interne 16:9 (agrandie x2 => 1920x1080). Tout le jeu est pensé en pixels "natifs".
// Le personnage (92x92) est affiché à sa taille d'origine pour garder un pixel art net.
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
