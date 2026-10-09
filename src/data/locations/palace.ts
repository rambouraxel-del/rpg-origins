// Asterion (an 780) : jardin, salle des cartes, chambre du portail. Fonds générés (style n°9), voir production/ASSETS.json.
import { loc, R, P } from './helper';

export const PALACE = [
  loc({
    id: 'palace_garden', name: 'Jardin du palais', bg: 'assets/areas/palace_garden.webp', mapPos: { x: 0.08, y: 0.2 },
    walk: [R(150, 185, 720, 250), R(780, 110, 130, 100)],
    blocks: [R(365, 200, 245, 125), R(90, 230, 150, 150), R(235, 130, 125, 70), R(150, 400, 90, 40)],
    anchors: { start: P(300, 410), mira_spot: P(660, 300), jardinier_spot: P(270, 360), intendant_spot: P(310, 235), courtisan_spot: P(780, 360) },
    features: { plant: R(90, 230, 150, 150), conduit: R(600, 160, 170, 50), mira_zone: R(600, 250, 150, 110) },
    exits: [{ side: 'up', at: 840, to: 'palace_hall' }],
  }),
  loc({
    id: 'palace_hall', name: 'Salle des cartes', bg: 'assets/areas/palace_hall.webp', mapPos: { x: 0.14, y: 0.2 },
    walk: [R(100, 170, 830, 320)],
    blocks: [R(150, 260, 370, 160), R(100, 430, 60, 60), R(870, 440, 60, 50)],
    anchors: { start: P(500, 440), adrien_spot: P(690, 300), oren_spot: P(570, 330), garde_spot: P(300, 450), mira_spot: P(700, 380),
      group_a: P(200, 450), safe: P(860, 430), group_b: P(400, 200), safe_b: P(880, 300), group_c: P(620, 200), safe_c: P(860, 240) },
    features: { map_table: R(150, 250, 370, 190), oren_zone: R(500, 300, 160, 120), mira_zone: R(620, 330, 150, 100), shard_spot: R(380, 440, 130, 50), window: R(420, 60, 300, 110) },
    exits: [{ side: 'up', at: 180, to: 'palace_garden' }, { side: 'right', at: 200, to: 'palace_portal' }],
  }),
  loc({
    id: 'palace_portal', name: 'Chambre du portail', bg: 'assets/areas/palace_portal.webp', mapPos: { x: 0.2, y: 0.2 },
    walk: [R(40, 230, 880, 260)],
    blocks: [R(40, 290, 70, 80), R(870, 280, 60, 70), R(750, 450, 210, 40)],
    anchors: { start: P(480, 440), oren_spot: P(470, 260), mira_spot: P(380, 380), civ1: P(250, 330), civ2: P(700, 320), auto_spot: P(800, 280) },
    features: { oren_zone: R(400, 240, 160, 120), civ_chair: R(40, 280, 100, 100), ring: R(380, 40, 230, 170) },
    exits: [{ side: 'left', at: 250, to: 'palace_hall' }],
  }),
];
