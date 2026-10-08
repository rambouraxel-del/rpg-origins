import type { AreaConfig } from '../types';

export const sanctuary: AreaConfig = {
  id: 'sanctuary',
  name: 'Sanctuaire',
  backgroundColor: 0x3a3550,
  background: 'sanctuary',
  // Zones praticables (pieds du personnage), repérées sur l'image.
  walkable: [
    { x: 445, y: 455, width: 75, height: 85 },
    { x: 420, y: 395, width: 125, height: 60 },
    { x: 400, y: 300, width: 160, height: 100 },
    { x: 120, y: 345, width: 280, height: 50 },
    { x: 620, y: 350, width: 170, height: 50 },
    { x: 240, y: 305, width: 160, height: 40 },
    { x: 560, y: 305, width: 160, height: 40 },
    { x: 440, y: 205, width: 80, height: 95 },
  ],
  spawns: {
    default: { x: 480, y: 400 },
    fromClearing: { x: 482, y: 515 },
  },
  exits: [
    { edge: 'bottom', from: 445, to: 520, target: 'clearing', targetSpawn: 'fromSanctuary' },
  ],
};
