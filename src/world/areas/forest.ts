import type { AreaConfig } from '../types';

export const forest: AreaConfig = {
  id: 'forest',
  name: 'Forêt',
  backgroundColor: 0x1f4d2b,
  background: 'forest',
  // Zones praticables (pieds du personnage), repérées sur l'image.
  walkable: [
    { x: 340, y: 240, width: 200, height: 180 },
    { x: 540, y: 265, width: 60, height: 155 },
    { x: 360, y: 150, width: 110, height: 110 },
    { x: 600, y: 295, width: 100, height: 115 },
    { x: 600, y: 290, width: 160, height: 45 },
    { x: 740, y: 235, width: 220, height: 77 },
  ],
  spawns: {
    default: { x: 420, y: 330 },
    fromClearing: { x: 930, y: 270 },
  },
  exits: [
    { edge: 'right', from: 235, to: 300, target: 'clearing', targetSpawn: 'fromForest' },
  ],
};
