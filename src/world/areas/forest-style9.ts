import type { AreaConfig } from '../types';
import { forest } from './forest';

/**
 * Prototype style n°9 : la forêt avec le décor de référence (copie réduite à 960x540 de
 * assets-src/style-reference/style9-reference-decor.png). Mêmes sorties et apparitions que la forêt d'origine.
 */
export const forestStyle9: AreaConfig = {
  ...forest,
  background: 'forest-style9',
  // Zones praticables (pieds du personnage), repérées sur le décor de référence.
  walkable: [
    { x: 400, y: 240, width: 140, height: 185 }, // clairière centrale
    { x: 340, y: 240, width: 60, height: 88 }, // au-dessus du buisson de gauche
    { x: 340, y: 388, width: 60, height: 37 }, // en dessous du buisson de gauche
    { x: 540, y: 265, width: 60, height: 160 }, // sous le gros rocher
    { x: 360, y: 200, width: 110, height: 60 }, // passage vers le nord
    { x: 360, y: 150, width: 62, height: 50 }, // dalles du nord, à gauche du rocher
    { x: 600, y: 295, width: 100, height: 115 }, // chemin de terre
    { x: 600, y: 290, width: 160, height: 45 }, // sous la clôture centrale
    { x: 740, y: 235, width: 220, height: 77 }, // chemin vers la sortie est
  ],
};
