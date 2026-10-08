import type { AreaConfig } from '../types';

export const forest: AreaConfig = {
  id: 'forest',
  name: 'Forêt',
  backgroundColor: 0x1f4d2b,
  spawns: {
    default: { x: 120, y: 140 },
    fromClearing: { x: 440, y: 135 },
  },
  exits: [{ edge: 'right', from: 105, to: 165, target: 'clearing', targetSpawn: 'fromForest' }],
  decor: [
    // Chemin vers la sortie est
    { x: 100, y: 115, width: 380, height: 40, color: 0x6b5a3a, layer: 'ground' },
    // Troncs (solides)
    { x: 70, y: 40, width: 16, height: 24, color: 0x4a3020, layer: 'decor', solid: true },
    { x: 200, y: 60, width: 16, height: 24, color: 0x4a3020, layer: 'decor', solid: true },
    { x: 320, y: 190, width: 16, height: 24, color: 0x4a3020, layer: 'decor', solid: true },
    { x: 150, y: 200, width: 16, height: 24, color: 0x4a3020, layer: 'decor', solid: true },
    // Feuillages au premier plan (le joueur passe dessous)
    { x: 54, y: 8, width: 48, height: 36, color: 0x2f7a3e, layer: 'foreground' },
    { x: 184, y: 28, width: 48, height: 36, color: 0x2f7a3e, layer: 'foreground' },
    { x: 304, y: 158, width: 48, height: 36, color: 0x2f7a3e, layer: 'foreground' },
    { x: 134, y: 168, width: 48, height: 36, color: 0x2f7a3e, layer: 'foreground' },
  ],
};
