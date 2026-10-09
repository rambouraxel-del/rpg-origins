// Chapitre 5 — Les hommes venus du ciel (C05S01 à C05S05). Texte : bible §12.
import { L, N, F, at, chapter, hs, inspect, item, journal, opt, power, puzzle, reach, say, scene, setv, talk, trust, save, choice } from './dsl';

export const CH5 = [
  scene({
    id: 'C05S01', chapter: 5, title: 'Le métal et les couvertures', loc: 'stellar_dock', spawn: 'from_miral_gate', party: ['nara', 'soren', 'tessa'],
    actors: [at('ravel', 'ravel_spot', 'down'), at('stellaire', 'famille1', 'right'), at('stellaire', 'famille2', 'left')],
    hotspots: [
      hs('c05s01_temoin1', 'famille1_zone', 'famille sous une couverture thermique', ['Un enfant tient une plante morte dans une boîte transparente. Sa mère murmure : « Elle ne veut plus pousser. »'], { verb: 'Écouter' }),
      hs('c05s01_temoin2', 'collegues', 'collègues de Tessa', ['Certains reprochent à Tessa d\'avoir quitté le relais ; d\'autres demandent si la rivière s\'est calmée.'], { verb: 'Écouter' }),
      hs('c05s01_soins', 'soins', 'zone de soins surchargée', ['Les réfugiés ont des besoins urgents, mais la station consacre une grande salle à l\'installation d\'un dispositif royal.']),
    ],
    steps: [
      say([N('Le débarcadère n\'est pas seulement une base ennemie. Des familles attendent sous des couvertures thermiques.')]),
      inspect('Écouter deux témoignages et observer la zone de soins', ['c05s01_temoin1', 'c05s01_temoin2', 'c05s01_soins'], 2),
      talk('Se présenter à Ravel', 'ravel', [
        N('Ravel accueille la délégation avec courtoisie rigide. Il relève le fragment du héros et lui demande de le montrer au contrôle. La borne affiche des données que l\'officier masque immédiatement.'),
        L('ravel', 'Nous avons connu des ports qui fermaient leurs portes aux enfants. Vous comprendrez que nous ne préparions pas un nouveau départ.'),
        L('nara', 'Les gens ici n\'ont pas fermé les leurs.'),
        L('ravel', 'Pas encore.'),
      ]),
      say([N('Le groupe est autorisé à avancer, mais un garde suit Elyan à distance.'), L('soren', 'Il y a déjà un choix de priorités derrière le discours d\'urgence.')]),
    ],
    onComplete: [F('stellar_civilians_seen'), journal('p_ravel', 'Ravel', 'Officier stellaire loyal à Vaelor. Courtoisie rigide.', 'people')],
    next: 'C05S02',
  }),
  scene({
    id: 'C05S02', chapter: 5, title: 'Le commandant qui connaît la peur', loc: 'stellar_command', spawn: 'from_stellar_dock', party: ['nara', 'soren', 'tessa'],
    actors: [at('vaelor', 'vaelor_spot', 'down'), at('ilyra', 'ilyra_spot', 'left')],
    hotspots: [hs('c05s02_orbit', 'carte_orbite', 'carte d\'orbite', ['Une carte d\'orbite. Les yeux de Vaelor reviennent plusieurs fois sur le fragment du héros.'])],
    steps: [
      say([N('Vaelor reçoit la délégation debout devant une carte d\'orbite. Il remercie le groupe d\'avoir sauvé les ouvriers. Il mentionne chacun par son nom, preuve de compétence et de surveillance.')]),
      choice('Face au commandant :', [
        opt('Soutenir Nara.', { set: setv('c05_stance', 'nara'), effects: [trust('nara', 1)] }),
        opt('Demander une démonstration technique.', { set: setv('c05_stance', 'demo') }),
        opt('Rester prudent.', { set: setv('c05_stance', 'careful') }),
      ]),
      say([
        L('vaelor', 'J\'ai attendu un accord jusqu\'à regarder mourir les gens qui l\'attendaient avec moi. Je ne recommencerai pas.'),
        L('soren', 'Quel accord vous a été refusé ici ?'),
        L('vaelor', 'La puissance nécessaire.'),
        L('tessa', 'Nécessaire à vivre, ou nécessaire à commander ?'),
        N('Le commandant ne répond pas directement. Ilyra accepte de montrer les relevés. Vaelor autorise la visite, persuadé qu\'une machine convaincra mieux qu\'une menace.'),
        N('Il demande à parler seul à l\'Étranger après la visite.'),
      ]),
      choice('Parler seul à Vaelor ?', [
        opt('Accepter.', { set: setv('c05_private', 'alone'), lines: [N('Vaelor obtient quelques minutes plus tard une conversation en présence d\'un témoin choisi.')] }),
        opt('Je ne veux rien cacher à mes compagnons.', { set: setv('c05_private', 'witnessed'), effects: [trust('soren', 1), trust('tessa', 1), trust('nara', 1)] }),
      ]),
    ],
    onComplete: [F('vaelor_met'), F('ilyra_met'), journal('p_vaelor', 'Vaelor Aster', 'Commandant de la flotte. Conserve les listes des morts de l\'exode ; en fait une dette exigeant l\'obéissance.', 'people'), journal('p_ilyra', 'Ilyra', 'Ingénieure responsable des relais. Accepte de montrer ses relevés.', 'people')],
    next: 'C05S03',
  }),
  scene({
    id: 'C05S03', chapter: 5, title: 'Les chiffres qui crient', loc: 'stellar_lab', spawn: 'from_stellar_command', party: ['nara', 'soren', 'tessa'],
    actors: [at('ilyra', 'ilyra_spot', 'down')],
    hotspots: [hs('c05s03_champ', 'banc_test', 'champ « non pertinent »', ['Ilyra reconnaît que le système a été conçu pour une réserve minérale, pas pour une source capable de répondre.'])],
    steps: [
      say([N('Ilyra affiche une extraction stable. Tessa demande la mesure du retour vers la source. L\'ingénieure montre un champ marqué « non pertinent ». Soren l\'interroge sur ce terme.')]),
      inspect('Examiner le relevé', ['c05s03_champ'], 1),
      say([L('ilyra', 'Le débit ne dépasse pas la capacité prévue.'), L('tessa', 'La capacité prévue de quoi ? Vous n\'avez pas mesuré ce qui se répare pendant que nous prenons.'), L('elyan', 'Quelque chose essaie d\'arrêter la pompe. Ce n\'est pas une panne.')]),
      puzzle({
        kind: 'set', title: 'Mettre deux sondes en décalage', prompt: 'L\'Écoute révèle une tension que les instruments lissent. Touchez deux sondes pour décaler leur impulsion — sans blesser l\'assistant à côté.',
        options: [{ id: 'sonde_a', label: 'Sonde A (entrée)', clue: 'Impulsion régulière.' }, { id: 'sonde_b', label: 'Sonde B (retour)', clue: 'Impulsion régulière, légèrement en retard.' }, { id: 'sonde_c', label: 'Sonde C (assistant)', clue: 'Branchée à l\'assistant humain : ne pas toucher.' }],
        solution: ['sonde_a', 'sonde_b'],
        hints: ['Rappel du but : déverrouiller la porte en décalant deux impulsions.', 'Contrainte : ne touchez pas la sonde de l\'assistant.', 'Action : touchez A et B.'],
        fail: 'Rien ne se passe, ou l\'assistant recule. Réessayez.', success: 'Une porte verrouillée s\'ouvre un instant : c\'est la première Onde. Vous refaites ce geste sur un automate de test, sans blesser personne.',
      }),
      say([N('Ilyra sauvegarde les données brutes. Elle accepte d\'en donner une copie, mais avertit que Vaelor considérera toute interruption comme une attaque contre la flotte. Son aide est limitée ; elle ne désobéit pas encore ouvertement.')]),
    ],
    onComplete: [power('pulse'), F('drain_report'), item('drain_report'), save('auto')],
    next: 'C05S04',
  }),
  scene({
    id: 'C05S04', chapter: 5, title: 'Une porte dans une porte', loc: 'chronal_chamber', spawn: 'from_stellar_lab', party: ['nara', 'soren', 'tessa'],
    actors: [at('technicien', 'tech_spot', 'right'), at('vaelor', 'vaelor_spot', 'down')],
    hotspots: [
      hs('c05s04_sonde', 'sonde', 'sonde revenue', ['La sonde revient avec une marque déjà visible sur la table de contrôle.']),
      hs('c05s04_horodatage', 'horodatage', 'horodatages', ['Soren vérifie les horodatages : la marque est antérieure à l\'envoi.']),
      hs('c05s04_conso', 'conso', 'consommation de l\'expérience', ['Tessa explique que les expériences consomment trop pour être une solution de ravitaillement quotidien.']),
      hs('c05s04_console', 'console_archive', 'console : numéro d\'archive', ['Ilyra a laissé le numéro d\'archive sur une console. Vous le lisez sans qu\'une capture rapide soit nécessaire.'], { effects: [F('archive_coordinate_known')] }),
    ],
    steps: [
      say([N('Une chambre annulaire projette l\'image du quai quelques minutes plus tôt. Le technicien envoie une sonde.')]),
      inspect('Observer l\'expérience', ['c05s04_sonde', 'c05s04_horodatage', 'c05s04_conso'], 3),
      fx_flash(),
      say([
        N('Le fragment d\'Elyan déclenche une image différente : le palais sous le verre, puis le couloir du prologue. Le héros chancelle. Il voit une main d\'Oren et entend « avant d\'ouvrir ». Vaelor arrive et coupe l\'expérience.'),
        L('elyan', 'Cet endroit existe ?'),
        L('vaelor', 'Il pourrait. Votre objet parle à une coordonnée qui n\'est pas encore la nôtre.'),
        L('soren', 'Vous savez lire cette coordonnée.'),
        L('vaelor', 'Je sais reconnaître ce qu\'il serait imprudent de forcer devant des visiteurs.'),
        N('Le commandant propose d\'aider le héros à retrouver sa mémoire s\'il revient seul. Nara demande une copie de la trace ; Vaelor refuse.'),
      ]),
      inspect('Lire le numéro d\'archive laissé par Ilyra', ['c05s04_console'], 1),
    ],
    onComplete: [F('time_travel_seen'), journal('s_time', 'Une porte dans une porte', 'Les Stellaires disposent d\'une technologie de voyage temporel, coûteuse. L\'objet du prince « parle » à une coordonnée future.')],
    next: 'C05S05',
  }),
  scene({
    id: 'C05S05', chapter: 5, title: 'La vérité derrière le quai', loc: 'stellar_dock', spawn: 'from_stellar_command', party: ['nara', 'soren', 'tessa'],
    tint: { color: 0x101a40, alpha: 0.35 },
    actors: [at('refugiee', 'refugiee_spot', 'down')],
    steps: [
      say([N('Au retour, une femme de l\'Aube Basse cherche un colis de médicaments qu\'on a transféré vers le chantier de la Couronne. Tessa vérifie la liste : le transport a été réquisitionné avec d\'autres charges civiles.'), N('Vaelor prépare déjà une installation dépassant les besoins du secours immédiat.')]),
      choice('Le fragment d\'image du palais :', [
        opt('Le montrer à mes compagnons.', { set: setv('c05_palace_image', 'shown'), effects: [trust('nara', 1), trust('soren', 1), trust('tessa', 1)] }),
        opt('J\'ai besoin de réfléchir.', { set: setv('c05_palace_image', 'withheld'), lines: [N('Soren rapporte ce qu\'il a vu dans la chambre sans publier une identité encore incertaine.')] }),
      ]),
      say([
        L('nara', 'Quand tu as vu cette salle, tu n\'avais plus l\'air perdu. Tu avais l\'air de vouloir y retourner.'),
        L('elyan', 'Je crois que quelqu\'un m\'y attend.'),
        L('tessa', 'Alors cherchons ce qu\'il faudrait laisser derrière toi pour y arriver.'),
        N('Une route de maintenance relie la station à l\'ancienne archive de Miral réquisitionnée. Le Voile permettra de passer les capteurs, l\'Onde d\'ouvrir les verrous. Le groupe prépare une infiltration pour lire, pas pour faire exploser la station habitée.'),
      ]),
    ],
    onComplete: [chapter(6), F('archive_mission'), save('auto')],
    next: 'C06S01',
  }),
];
void reach; void power; void setv; void hs;
import type { Step } from '../../core/types';
function fx_flash(): Step { return { t: 'fx', kind: 'flash', ms: 500 }; }
