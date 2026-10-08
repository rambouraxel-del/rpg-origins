import type { AreaConfig } from '../types';

export const clearing: AreaConfig = {
  id: 'clearing',
  name: 'Clairière',
  backgroundColor: 0x5fa04e,
  background: 'clearing',
  // Zones praticables (pieds du personnage), repérées sur l'image.
  walkable: [
    { x: 0, y: 245, width: 160, height: 55 },
    { x: 100, y: 250, width: 230, height: 85 },
    { x: 330, y: 170, width: 150, height: 80 },
    { x: 330, y: 250, width: 270, height: 245 },
    { x: 600, y: 250, width: 90, height: 75 },
    { x: 470, y: 0, width: 90, height: 250 },
  ],
  spawns: {
    default: { x: 420, y: 330 },
    fromForest: { x: 40, y: 272 },
    fromSanctuary: { x: 505, y: 50 },
  },
  exits: [
    { edge: 'left', from: 245, to: 300, target: 'forest', targetSpawn: 'fromClearing' },
    { edge: 'top', from: 470, to: 545, target: 'sanctuary', targetSpawn: 'fromClearing' },
  ],
};
