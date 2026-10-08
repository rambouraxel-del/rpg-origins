import type { AreaConfig } from '../types';

export const forest: AreaConfig = {
  id: 'forest',
  name: 'Forêt',
  backgroundColor: 0x1f4d2b,
  spawns: {
    default: { x: 240, y: 280 },
    fromClearing: { x: 880, y: 270 },
  },
  exits: [{ edge: 'right', from: 210, to: 330, target: 'clearing', targetSpawn: 'fromForest' }],
  decor: [
    // Chemin vers la sortie est
    { x: 200, y: 230, width: 760, height: 80, color: 0x6b5a3a, layer: 'ground' },
    // Troncs (solides)
    { x: 140, y: 80, width: 32, height: 48, color: 0x4a3020, layer: 'decor', solid: true },
    { x: 400, y: 120, width: 32, height: 48, color: 0x4a3020, layer: 'decor', solid: true },
    { x: 640, y: 380, width: 32, height: 48, color: 0x4a3020, layer: 'decor', solid: true },
    { x: 300, y: 400, width: 32, height: 48, color: 0x4a3020, layer: 'decor', solid: true },
    // Feuillages au premier plan (le joueur passe dessous)
    { x: 108, y: 16, width: 96, height: 72, color: 0x2f7a3e, layer: 'foreground' },
    { x: 368, y: 56, width: 96, height: 72, color: 0x2f7a3e, layer: 'foreground' },
    { x: 608, y: 316, width: 96, height: 72, color: 0x2f7a3e, layer: 'foreground' },
    { x: 268, y: 336, width: 96, height: 72, color: 0x2f7a3e, layer: 'foreground' },
  ],
};
