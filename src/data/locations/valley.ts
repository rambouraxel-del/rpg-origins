// La vallée d'Orme et la descente vers le cœur. Fonds générés (style n°9).
import { loc, R, P } from './helper';

export const VALLEY = [
  loc({
    id: 'valley_camp', name: 'Camp d\'Orme', bg: 'assets/areas/valley_camp.webp', mapPos: { x: 0.72, y: 0.72 },
    walk: [R(20, 230, 940, 230), R(520, 50, 70, 200), R(0, 320, 330, 110)],
    blocks: [R(370, 235, 170, 90), R(590, 120, 110, 140), R(880, 190, 80, 90), R(30, 160, 220, 170), R(650, 350, 220, 100)],
    anchors: { start: P(480, 400), default: P(480, 400), refugiee_spot: P(450, 365), garde_spot: P(320, 285), ravel_far: P(700, 300), arven_spot: P(620, 405) },
    features: { groupe_file: R(370, 235, 170, 90), groupe_tentes: R(200, 130, 290, 100), groupe_cloture: R(880, 190, 80, 90), panneau: R(590, 120, 110, 140), objets_zone: R(650, 350, 220, 100) },
    exits: [{ side: 'right', at: 300, to: 'miral_gate' }, { side: 'left', at: 340, to: 'valley_bridge' }, { side: 'up', at: 550, to: 'valley_relay' }],
  }),
  loc({
    id: 'valley_relay', name: 'Relais d\'Orme', bg: 'assets/areas/valley_relay.webp', mapPos: { x: 0.72, y: 0.82 },
    walk: [R(90, 230, 780, 260)],
    blocks: [R(100, 170, 240, 90), R(660, 150, 120, 110), R(850, 130, 110, 260), R(730, 280, 130, 100)],
    anchors: { start: P(480, 400), default: P(480, 400) },
    features: { signature: R(100, 170, 240, 100), calendrier: R(330, 20, 370, 200), reglages: R(740, 70, 110, 190) },
    exits: [{ side: 'down', at: 130, to: 'valley_camp' }],
  }),
  loc({
    id: 'valley_bridge', name: 'Pont d\'Orme', bg: 'assets/areas/valley_bridge.webp', mapPos: { x: 0.6, y: 0.72 },
    walk: [R(170, 140, 670, 75), R(0, 60, 190, 150), R(830, 0, 130, 210), R(0, 200, 150, 130), R(40, 240, 120, 70), R(140, 290, 130, 70), R(240, 340, 140, 80), R(290, 330, 300, 170)],
    anchors: { start: P(500, 175), default: P(500, 175), ravel_spot: P(560, 172), auto1: P(500, 165), auto2: P(620, 190), arven_spot: P(700, 175), ilan_spot: P(200, 170), g1_from: P(100, 275), g2_from: P(120, 160), safe: P(400, 430), safe_b: P(480, 455) },
    spawns: { ravel_arrive: { x: 300, y: 175 } },
    features: { appui_pont: R(60, 380, 150, 140), famille_zone: R(420, 400, 120, 70) },
    exits: [{ side: 'right', at: 100, to: 'valley_camp' }, { side: 'left', at: 120, to: 'valley_outlook' }],
  }),
  loc({
    id: 'valley_outlook', name: 'Promontoire', bg: 'assets/areas/valley_outlook.webp', mapPos: { x: 0.55, y: 0.82 },
    walk: [R(120, 140, 640, 340), R(330, 440, 150, 100), R(340, 0, 100, 160)],
    blocks: [R(60, 80, 230, 150), R(310, 225, 130, 60), R(530, 195, 170, 70), R(140, 370, 140, 100), R(520, 375, 170, 80)],
    anchors: { start: P(420, 335), default: P(420, 335) },
    features: {},
    exits: [{ side: 'up', at: 390, to: 'valley_bridge' }, { side: 'down', at: 400, to: 'core_approach' }],
  }),
  loc({
    id: 'core_approach', name: 'Seuil du cœur', bg: 'assets/areas/core_approach.webp', mapPos: { x: 0.4, y: 0.92 },
    walk: [R(60, 260, 860, 230), R(800, 230, 150, 140), R(460, 440, 120, 100)],
    blocks: [R(140, 160, 170, 115), R(395, 160, 180, 125), R(620, 235, 170, 70)],
    anchors: { start: P(500, 420), default: P(500, 420), auto1: P(300, 360), auto2: P(700, 410), ilyra_spot: P(380, 425) },
    features: { appui_racine: R(140, 160, 170, 115), appui_canal: R(395, 160, 180, 125), appui_memoire: R(620, 235, 170, 70), seuil: R(800, 230, 150, 140) },
    exits: [{ side: 'down', at: 520, to: 'valley_outlook' }, { side: 'right', at: 280, to: 'core_gate' }],
  }),
  loc({
    id: 'core_gate', name: 'Verrou des héritiers', bg: 'assets/areas/core_gate.webp', mapPos: { x: 0.3, y: 0.92 },
    walk: [R(110, 230, 760, 260), R(390, 100, 220, 140), R(420, 440, 140, 100)],
    blocks: [R(250, 190, 130, 80), R(590, 190, 130, 80), R(710, 150, 150, 100)],
    anchors: { start: P(500, 410), default: P(500, 410), auto1: P(350, 310), vaelor_spot: P(800, 268) },
    features: {},
    exits: [{ side: 'down', at: 480, to: 'core_approach' }, { side: 'up', at: 500, to: 'planet_heart' }],
  }),
  loc({
    id: 'planet_heart', name: 'Cœur de la planète', bg: 'assets/areas/planet_heart.webp', mapPos: { x: 0.2, y: 0.92 },
    walk: [R(230, 175, 500, 200), R(400, 370, 180, 140)],
    blocks: [R(200, 180, 80, 100), R(700, 230, 100, 70)],
    anchors: { start: P(480, 300), default: P(480, 300), center: P(480, 300), eira_spot: P(480, 205), vaelor_far: P(700, 190), vaelor_spot: P(610, 265), auto1: P(350, 300), pompe1: P(600, 335), sent1: P(400, 232) },
    spawns: { center: { x: 480, y: 300 } },
    features: { cmd_rompre: R(190, 170, 90, 120), cmd_fermer: R(700, 200, 110, 100) },
    exits: [{ side: 'down', at: 480, to: 'core_gate' }],
  }),
];
