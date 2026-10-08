import type { AreaConfig } from '../types';

export const sanctuary: AreaConfig = {
  id: 'sanctuary',
  name: 'Sanctuaire',
  backgroundColor: 0x3a3550,
  spawns: {
    default: { x: 240, y: 200 },
    fromClearing: { x: 240, y: 235 },
  },
  exits: [{ edge: 'bottom', from: 210, to: 270, target: 'clearing', targetSpawn: 'fromSanctuary' }],
  decor: [
    // Dallage
    { x: 160, y: 60, width: 160, height: 210, color: 0x5c5670, layer: 'ground' },
    // Autel (solide)
    { x: 220, y: 70, width: 40, height: 24, color: 0xb8b0d0, layer: 'decor', solid: true },
    // Piliers : base solide + haut au premier plan
    { x: 170, y: 120, width: 14, height: 20, color: 0x8c86a6, layer: 'decor', solid: true },
    { x: 170, y: 96, width: 14, height: 24, color: 0x8c86a6, layer: 'foreground' },
    { x: 296, y: 120, width: 14, height: 20, color: 0x8c86a6, layer: 'decor', solid: true },
    { x: 296, y: 96, width: 14, height: 24, color: 0x8c86a6, layer: 'foreground' },
  ],
  effects: [{ kind: 'mist' }], // pas encore rendu, exemple de configuration future
};
