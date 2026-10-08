// Résolution interne 16:9 (agrandie x4 => 1920x1080). Tout le jeu est pensé en pixels "natifs".
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;

export const PLAYER_SPEED = 90; // pixels / seconde

// Ordre d'affichage des calques.
export const DEPTH = {
  ground: 0,
  decor: 10,
  entities: 20, // joueur, PNJ, objets interactifs
  foreground: 30, // éléments qui passent devant le joueur (feuillages, arches...)
  effects: 40, // pluie, brouillard, lumières...
  ui: 100,
} as const;
