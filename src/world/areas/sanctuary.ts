import type { AreaConfig } from '../types';

export const sanctuary: AreaConfig = {
  id: 'sanctuary',
  name: 'Sanctuaire',
  backgroundColor: 0x3a3550,
  spawns: {
    default: { x: 480, y: 400 },
    fromClearing: { x: 480, y: 470 },
  },
  exits: [{ edge: 'bottom', from: 420, to: 540, target: 'clearing', targetSpawn: 'fromSanctuary' }],
  decor: [
    // Dallage
    { x: 320, y: 120, width: 320, height: 420, color: 0x5c5670, layer: 'ground' },
    // Autel (solide)
    { x: 440, y: 140, width: 80, height: 48, color: 0xb8b0d0, layer: 'decor', solid: true },
    // Piliers : base solide + haut au premier plan
    { x: 340, y: 240, width: 28, height: 40, color: 0x8c86a6, layer: 'decor', solid: true },
    { x: 340, y: 192, width: 28, height: 48, color: 0x8c86a6, layer: 'foreground' },
    { x: 592, y: 240, width: 28, height: 40, color: 0x8c86a6, layer: 'decor', solid: true },
    { x: 592, y: 192, width: 28, height: 48, color: 0x8c86a6, layer: 'foreground' },
  ],
  effects: [{ kind: 'mist' }], // pas encore rendu, exemple de configuration future
};
