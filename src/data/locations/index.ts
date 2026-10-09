import type { LocationDef } from '../../core/types';
import { loc } from './helper';

// TEMPORAIRE (lot 1) : deux lieux de test sur le décor style n°9 existant.
export const LOCATIONS: LocationDef[] = [
  loc({
    id: 'forest_arrival', name: 'Forêt d\'arrivée', bg: 'assets/areas/forest-style9.png', mapPos: { x: 0.1, y: 0.5 },
    walk: [{ x: 250, y: 215, w: 330, h: 230 }, { x: 560, y: 260, w: 400, h: 120 }, { x: 340, y: 150, w: 120, h: 80 }],
    blocks: [{ x: 440, y: 180, w: 130, h: 70 }],
    anchors: { start: { x: 400, y: 380 }, center: { x: 480, y: 330 }, exit_east: { x: 860, y: 320 }, right_path: { x: 700, y: 330 } },
    features: { pool: { x: 20, y: 150, w: 180, h: 180 }, stone: { x: 470, y: 90, w: 110, h: 150 } },
    exits: [{ side: 'right', at: 320, to: 'forest_crossing' }],
    hotspots: [{ id: 'fa_pool', at: 'pool', label: 'bassin', text: ['L\'eau est claire, presque trop calme.'] }],
  }),
  loc({
    id: 'forest_crossing', name: 'Passage tombé', bg: 'assets/areas/forest-style9.png', mapPos: { x: 0.25, y: 0.5 },
    walk: [{ x: 250, y: 215, w: 330, h: 230 }, { x: 560, y: 260, w: 400, h: 120 }],
    anchors: { start: { x: 400, y: 380 }, center: { x: 480, y: 330 } }, features: {},
    exits: [{ side: 'left', at: 320, to: 'forest_arrival' }],
  }),
];
