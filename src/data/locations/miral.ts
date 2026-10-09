// Miral : porte de la cité, jardin de mémoire, sanctuaire de mémoire. Fonds générés (style n°9).
import { loc, R, P } from './helper';

export const MIRAL = [
  loc({
    id: 'miral_gate', name: 'Porte de Miral', bg: 'assets/areas/miral_gate.webp', mapPos: { x: 0.7, y: 0.5 },
    walk: [R(90, 110, 830, 360), R(370, 460, 150, 80), R(20, 190, 110, 200), R(360, 20, 100, 110), R(770, 60, 150, 120)],
    blocks: [R(180, 170, 260, 150), R(490, 190, 250, 220), R(820, 300, 140, 160), R(530, 90, 160, 60)],
    anchors: { start: P(450, 440), default: P(450, 440), ysane_spot: P(300, 355), arven_spot: P(560, 165), rep_spot: P(200, 405), civil_spot: P(700, 440), cuisiniere_spot: P(780, 435), refugiee_spot: P(620, 440), ilan_spot: P(150, 405) },
    features: { table_conseil: R(170, 160, 280, 170), tessa_zone: R(520, 420, 200, 80), atelier_zone: R(800, 300, 150, 160), tables_zone: R(480, 170, 270, 250) },
    exits: [{ side: 'left', at: 290, to: 'river_bank' }, { side: 'up', at: 468, to: 'stellar_dock' }, { side: 'right', at: 140, to: 'memory_garden' }, { side: 'down', at: 440, to: 'valley_camp' }],
  }),
  loc({
    id: 'memory_garden', name: 'Jardin de mémoire', bg: 'assets/areas/memory_garden.webp', mapPos: { x: 0.78, y: 0.4 },
    walk: [R(240, 160, 680, 330), R(410, 20, 110, 160), R(460, 470, 260, 70)],
    blocks: [R(400, 210, 190, 110), R(590, 170, 200, 100), R(770, 95, 150, 100), R(600, 340, 240, 130), R(890, 250, 40, 130)],
    anchors: { start: P(330, 420), default: P(330, 420), eira_spot: P(540, 338), meline_spot: P(360, 300), ysane_spot: P(560, 425), habitant1: P(330, 200) },
    spawns: { well: { x: 440, y: 375 } },
    features: { banc_berceuse: R(200, 160, 120, 60), banc_partage: R(110, 205, 110, 70), banc_funerailles: R(150, 280, 110, 70), banc_inacheve: R(600, 340, 240, 130), archives_zone: R(770, 95, 150, 110), registre_zone: R(590, 170, 200, 110), meline_spot: R(300, 250, 120, 100) },
    rest: R(380, 335, 230, 110),
    exits: [{ side: 'up', at: 460, to: 'miral_gate' }, { side: 'down', at: 590, to: 'memory_shrine' }],
  }),
  loc({
    id: 'memory_shrine', name: 'Sanctuaire de mémoire', bg: 'assets/areas/memory_shrine.webp', mapPos: { x: 0.85, y: 0.55 },
    walk: [R(170, 200, 610, 280), R(770, 100, 100, 220)],
    anchors: { start: P(500, 400), eira_spot: P(480, 238) },
    features: { surface_pont: R(290, 30, 130, 170), surface_dispute: R(420, 30, 130, 170), surface_crue: R(540, 30, 130, 170) },
    exits: [{ side: 'down', at: 520, to: 'memory_garden' }],
  }),
];
