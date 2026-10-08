import type { AreaConfig } from '../types';

export const clearing: AreaConfig = {
  id: 'clearing',
  name: 'Clairière',
  backgroundColor: 0x5fa04e,
  spawns: {
    default: { x: 240, y: 150 },
    fromForest: { x: 40, y: 135 },
    fromSanctuary: { x: 240, y: 40 },
  },
  exits: [
    { edge: 'left', from: 105, to: 165, target: 'forest', targetSpawn: 'fromClearing' },
    { edge: 'top', from: 210, to: 270, target: 'sanctuary', targetSpawn: 'fromClearing' },
  ],
  decor: [
    // Chemins
    { x: 0, y: 115, width: 260, height: 40, color: 0x8a7550, layer: 'ground' },
    { x: 220, y: 0, width: 40, height: 155, color: 0x8a7550, layer: 'ground' },
    // Rochers (solides)
    { x: 340, y: 80, width: 24, height: 16, color: 0x7a7a7a, layer: 'decor', solid: true },
    { x: 120, y: 210, width: 24, height: 16, color: 0x7a7a7a, layer: 'decor', solid: true },
    // Fleurs
    { x: 380, y: 200, width: 6, height: 6, color: 0xe8d84a, layer: 'ground' },
    { x: 400, y: 215, width: 6, height: 6, color: 0xe85a8a, layer: 'ground' },
    { x: 80, y: 60, width: 6, height: 6, color: 0xe8d84a, layer: 'ground' },
  ],
};
