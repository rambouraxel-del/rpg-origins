// La station stellaire : quai, commandement, laboratoire, chambre chronale, archive occupée, voûte généalogique. Fonds générés.
import { loc, R, P } from './helper';

export const STELLAR = [
  loc({
    id: 'stellar_dock', name: 'Quai de la station', bg: 'assets/areas/stellar_dock.webp', mapPos: { x: 0.7, y: 0.18 },
    walk: [R(60, 170, 860, 310), R(640, 20, 60, 160), R(20, 120, 130, 130), R(850, 100, 100, 100)],
    blocks: [R(100, 190, 260, 110), R(30, 300, 230, 170), R(270, 360, 170, 120), R(740, 325, 220, 115), R(570, 110, 70, 150), R(695, 175, 75, 100), R(410, 100, 170, 100), R(770, 150, 80, 70)],
    anchors: { start: P(500, 400), default: P(500, 400), ravel_spot: P(560, 295), famille1: P(300, 335), famille2: P(380, 300), refugiee_spot: P(490, 430) },
    features: { famille1_zone: R(100, 190, 260, 110), collegues: R(400, 220, 150, 120), soins: R(30, 300, 230, 170), colis: R(740, 325, 220, 115), atelier_zone: R(270, 360, 170, 120) },
    exits: [{ side: 'up', at: 665, to: 'miral_gate' }, { side: 'right', at: 150, to: 'stellar_command' }, { side: 'left', at: 190, to: 'occupied_archive' }],
  }),
  loc({
    id: 'stellar_command', name: 'Poste de commandement', bg: 'assets/areas/stellar_command.webp', mapPos: { x: 0.78, y: 0.12 },
    walk: [R(40, 150, 860, 350)],
    blocks: [R(320, 230, 350, 190), R(650, 100, 310, 200), R(170, 100, 190, 110), R(115, 120, 70, 130)],
    anchors: { start: P(500, 450), default: P(500, 450), vaelor_spot: P(495, 225), ilyra_spot: P(270, 335) },
    features: { carte_orbite: R(320, 230, 350, 190) },
    exits: [{ side: 'left', at: 195, to: 'stellar_dock' }, { side: 'up', at: 390, to: 'stellar_lab' }],
  }),
  loc({
    id: 'stellar_lab', name: 'Laboratoire', bg: 'assets/areas/stellar_lab.webp', mapPos: { x: 0.85, y: 0.12 },
    walk: [R(30, 150, 900, 330)],
    blocks: [R(110, 230, 290, 160), R(480, 100, 270, 150), R(850, 200, 110, 150), R(0, 90, 190, 210), R(680, 350, 260, 150)],
    anchors: { start: P(500, 420), default: P(500, 420), ilyra_spot: P(430, 300), tech_spot: P(780, 330) },
    features: { banc_test: R(110, 230, 290, 160), banc_abri: R(480, 110, 100, 140), banc_capsule: R(590, 110, 100, 140), banc_signature: R(700, 110, 90, 140), banc_fragment: R(0, 90, 190, 210), technicien_zone: R(680, 350, 260, 150) },
    exits: [{ side: 'down', at: 420, to: 'stellar_command' }, { side: 'up', at: 360, to: 'chronal_chamber' }],
  }),
  loc({
    id: 'chronal_chamber', name: 'Chambre chronale', bg: 'assets/areas/chronal_chamber.webp', mapPos: { x: 0.92, y: 0.1 },
    walk: [R(110, 200, 780, 290), R(200, 150, 600, 60)],
    blocks: [R(310, 140, 400, 230), R(60, 150, 230, 140), R(760, 200, 130, 110)],
    anchors: { start: P(500, 440), default: P(500, 440), oren_spot: P(400, 425), tech_spot: P(200, 350), vaelor_spot: P(640, 400) },
    features: { sonde: R(60, 150, 230, 140), horodatage: R(760, 10, 190, 160), conso: R(330, 150, 340, 230), console_archive: R(760, 200, 130, 110), tablette: R(430, 380, 140, 70) },
    exits: [{ side: 'down', at: 510, to: 'stellar_lab' }],
  }),
  loc({
    id: 'occupied_archive', name: 'Archive de Miral (occupée)', bg: 'assets/areas/occupied_archive.webp', mapPos: { x: 0.55, y: 0.12 },
    walk: [R(40, 130, 900, 380)],
    blocks: [R(220, 230, 170, 100), R(260, 380, 170, 120), R(420, 350, 190, 110), R(510, 260, 220, 120), R(720, 320, 120, 110), R(150, 450, 200, 80), R(740, 100, 200, 150), R(0, 270, 200, 140)],
    anchors: { start: P(880, 440), default: P(880, 440), entree: P(880, 440), ronde_a1: P(400, 170), ronde_a2: P(400, 300), ronde_b1: P(660, 170), ronde_b2: P(660, 420) },
    features: { registre_zone: R(440, 110, 120, 70), etiquettes: R(220, 230, 170, 100), liste_sites: R(740, 100, 200, 150) },
    exits: [{ side: 'right', at: 440, to: 'stellar_dock' }, { side: 'up', at: 500, to: 'archive_core' }],
  }),
  loc({
    id: 'archive_core', name: 'Voûte généalogique', bg: 'assets/areas/archive_core.webp', mapPos: { x: 0.55, y: 0.05 },
    walk: [R(90, 200, 780, 290)],
    blocks: [R(235, 255, 130, 70), R(395, 300, 140, 70), R(565, 255, 130, 70), R(405, 190, 140, 70), R(0, 330, 220, 150), R(870, 360, 90, 130)],
    anchors: { start: P(500, 440), default: P(500, 440) },
    spawns: { registre: { x: 460, y: 285 } },
    features: { trace_pere: R(235, 255, 130, 70), trace_jardin: R(395, 300, 140, 70), trace_choc: R(565, 255, 130, 70), trace_royale: R(235, 255, 130, 70), trace_veilleurs: R(395, 300, 140, 70), trace_militaire: R(565, 255, 130, 70) },
    exits: [{ side: 'down', at: 500, to: 'occupied_archive' }],
  }),
];
