// Rivière : berge du moulin, relais stellaire, sanctuaire des eaux. Fonds générés (style n°9).
import { loc, R, P } from './helper';

export const RIVER = [
  loc({
    id: 'river_bank', name: 'La rivière', bg: 'assets/areas/river_bank.webp', mapPos: { x: 0.6, y: 0.45 },
    walk: [R(120, 0, 160, 140), R(170, 120, 380, 230), R(400, 230, 520, 130), R(470, 350, 170, 160), R(780, 150, 170, 100)],
    blocks: [R(130, 160, 150, 180), R(470, 175, 230, 115)],
    anchors: { start: P(350, 270), meunier_spot: P(330, 305), pecheur1: P(250, 345), pecheur2: P(480, 320), soldat_spot: P(450, 205), gardien_spot: P(740, 262), ilan_spot: P(620, 330) },
    features: { cloture: R(460, 170, 250, 130), bassin: R(500, 190, 170, 90), moulin: R(0, 100, 230, 260), attache_zone: R(330, 300, 100, 60), canal_habitations: R(550, 40, 100, 140), canal_relais: R(665, 40, 100, 140), canal_decharge: R(760, 60, 75, 120), exit_relay: R(830, 110, 130, 90) },
    exits: [{ side: 'up', at: 300, to: 'lisiere_square' }, { side: 'right', at: 260, to: 'miral_gate' }, { side: 'up', at: 900, to: 'river_relay' }],
  }),
  loc({
    id: 'river_relay', name: 'Relais de la rivière', bg: 'assets/areas/river_relay.webp', mapPos: { x: 0.65, y: 0.35 },
    walk: [R(130, 135, 800, 300), R(40, 230, 100, 90)],
    blocks: [R(420, 190, 230, 150), R(640, 245, 240, 80), R(170, 100, 120, 90), R(650, 100, 290, 90)],
    anchors: { start: P(200, 270), tessa_spot: P(720, 208), ilan_spot: P(840, 208), gardien_spot: P(560, 168), captifs: P(760, 215), ouvriers: P(560, 395), rive: P(110, 270), rive_b: P(100, 300) },
    features: { pompe: R(420, 170, 240, 190), vanne: R(780, 230, 100, 110), console: R(170, 100, 130, 110), support_cloison: R(330, 360, 200, 80), canal: R(480, 400, 260, 40) },
    exits: [{ side: 'left', at: 270, to: 'river_bank' }, { side: 'up', at: 360, to: 'water_shrine' }],
  }),
  loc({
    id: 'water_shrine', name: 'Sanctuaire des eaux', bg: 'assets/areas/water_shrine.webp', mapPos: { x: 0.7, y: 0.3 },
    walk: [R(40, 130, 880, 400)],
    blocks: [R(395, 205, 240, 105), R(630, 370, 180, 80), R(200, 130, 260, 40)],
    anchors: { start: P(300, 390), tessa_spot: P(230, 340) },
    features: { inscription: R(95, 80, 100, 160) },
    rest: R(150, 330, 230, 140),
    exits: [{ side: 'left', at: 260, to: 'river_relay' }],
  }),
];
