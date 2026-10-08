import type { AreaConfig } from '../types';

export const clearing: AreaConfig = {
  id: 'clearing',
  name: 'Clairière',
  backgroundColor: 0x5fa04e,
  spawns: {
    default: { x: 480, y: 300 },
    fromForest: { x: 80, y: 270 },
    fromSanctuary: { x: 480, y: 80 },
  },
  exits: [
    { edge: 'left', from: 210, to: 330, target: 'forest', targetSpawn: 'fromClearing' },
    { edge: 'top', from: 420, to: 540, target: 'sanctuary', targetSpawn: 'fromClearing' },
  ],
  decor: [
    // Chemins
    { x: 0, y: 230, width: 520, height: 80, color: 0x8a7550, layer: 'ground' },
    { x: 440, y: 0, width: 80, height: 310, color: 0x8a7550, layer: 'ground' },
    // Rochers (solides)
    { x: 680, y: 160, width: 48, height: 32, color: 0x7a7a7a, layer: 'decor', solid: true },
    { x: 240, y: 420, width: 48, height: 32, color: 0x7a7a7a, layer: 'decor', solid: true },
    // Fleurs
    { x: 760, y: 400, width: 12, height: 12, color: 0xe8d84a, layer: 'ground' },
    { x: 800, y: 430, width: 12, height: 12, color: 0xe85a8a, layer: 'ground' },
    { x: 160, y: 120, width: 12, height: 12, color: 0xe8d84a, layer: 'ground' },
  ],
};
