// Forêt de Lisière : arrivée, passage tombé, sanctuaire des racines. Fonds générés (style n°9).
import { loc, R, P } from './helper';

export const FOREST = [
  loc({
    id: 'forest_arrival', name: 'Clairière d\'arrivée', bg: 'assets/areas/forest_arrival.webp', mapPos: { x: 0.3, y: 0.5 },
    walk: [R(260, 170, 560, 280), R(760, 140, 200, 120)],
    blocks: [R(260, 320, 70, 130), R(250, 170, 100, 90), R(470, 160, 100, 40)],
    anchors: { start: P(380, 390), wake: P(380, 390), nara_spot: P(780, 230), lume_spot: P(560, 390) },
    spawns: { wake: { x: 380, y: 390 } },
    features: { pool: R(70, 320, 260, 140), stone: R(470, 150, 110, 90), tracks: R(380, 330, 120, 90), arbre: R(300, 260, 140, 80), oiseau: R(600, 400, 140, 80), nara_zone: R(700, 170, 200, 130), exit_east: R(820, 140, 110, 110) },
    exits: [{ side: 'right', at: 190, to: 'forest_crossing' }],
  }),
  loc({
    id: 'forest_crossing', name: 'Passage tombé', bg: 'assets/areas/forest_crossing.webp', mapPos: { x: 0.4, y: 0.5 },
    walk: [R(20, 200, 320, 150), R(330, 290, 270, 100), R(560, 270, 400, 110), R(660, 170, 120, 120), R(300, 370, 100, 170)],
    blocks: [R(330, 230, 200, 110)],
    anchors: { start: P(200, 260), soren_spot: P(420, 355), beast_spot: P(620, 310), center: P(460, 360) },
    features: { cercle: R(320, 230, 220, 130), attache: R(680, 200, 80, 60), branche: R(110, 120, 150, 90), bordure: R(40, 300, 160, 60), sortie_haute: R(720, 20, 150, 120), marque1: R(40, 150, 60, 60), marque2: R(850, 215, 60, 60), marque3: R(700, 100, 100, 80), exit_east: R(850, 260, 100, 110) },
    exits: [{ side: 'left', at: 250, to: 'forest_arrival' }, { side: 'right', at: 320, to: 'lisiere_square' }, { side: 'down', at: 340, to: 'root_shrine' }],
  }),
  loc({
    id: 'root_shrine', name: 'Sanctuaire des racines', bg: 'assets/areas/root_shrine.webp', mapPos: { x: 0.4, y: 0.75 },
    walk: [R(200, 230, 600, 230), R(170, 440, 200, 100), R(130, 280, 100, 150)],
    blocks: [R(415, 270, 140, 70), R(700, 235, 100, 70)],
    anchors: { start: P(350, 410), eira_spot: P(540, 238) },
    features: { pierre: R(410, 255, 150, 100), racine_seche: R(620, 170, 150, 110), attache: R(690, 230, 110, 80), inscription: R(100, 140, 130, 150), sachets: R(600, 300, 130, 90) },
    exits: [{ side: 'down', at: 260, to: 'forest_crossing' }],
  }),
];
