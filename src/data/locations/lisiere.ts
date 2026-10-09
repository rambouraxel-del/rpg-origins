// Lisière : place du village et puits de soin. Fonds générés (style n°9).
import { loc, R, P } from './helper';

export const LISIERE = [
  loc({
    id: 'lisiere_square', name: 'Lisière', bg: 'assets/areas/lisiere_square.webp', mapPos: { x: 0.5, y: 0.5 },
    walk: [R(30, 150, 900, 330), R(380, 470, 200, 70)],
    blocks: [R(185, 180, 260, 170), R(600, 210, 90, 90), R(750, 290, 200, 100), R(670, 350, 220, 130), R(140, 360, 170, 60)],
    anchors: { start: P(480, 330), default: P(480, 330), darel_spot: P(520, 185), arven_spot: P(480, 205), lume_spot: P(340, 395), habitant1: P(150, 300), habitant2: P(820, 235), apprenti_spot: P(580, 190), ilan_spot: P(720, 185), refugie1: P(450, 425), refugie2: P(560, 425) },
    features: { pompe: R(590, 195, 120, 120), tables: R(180, 180, 280, 180), conteur: R(440, 240, 110, 70), grain: R(830, 150, 100, 100), ilan_zone: R(650, 160, 150, 100), lume_zone: R(300, 330, 140, 100) },
    exits: [{ side: 'left', at: 200, to: 'forest_crossing' }, { side: 'right', at: 210, to: 'river_bank' }, { side: 'down', at: 480, to: 'lisiere_well' }],
  }),
  loc({
    id: 'lisiere_well', name: 'Puits de Lisière', bg: 'assets/areas/lisiere_well.webp', mapPos: { x: 0.5, y: 0.7 },
    walk: [R(30, 130, 880, 350)],
    blocks: [R(330, 160, 430, 250), R(155, 225, 120, 70), R(790, 170, 60, 130), R(690, 440, 100, 60)],
    anchors: { start: P(220, 380), darel_spot: P(300, 420) },
    features: { pierres: R(330, 160, 430, 250), marque: R(580, 90, 100, 100) },
    rest: R(300, 380, 520, 110),
    exits: [{ side: 'left', at: 200, to: 'lisiere_square' }],
  }),
];
