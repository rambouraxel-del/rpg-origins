// Chapitre 9 — Avant la dernière porte (C09S01 à C09S05). Texte : bible §16.
import { L, N, F, at, chapter, hs, inspect, item, move, opt, puzzle, reach, say, scene, setv, talk, trust, save, choice, set } from './dsl';

export const CH9 = [
  scene({
    id: 'C09S01', chapter: 9, title: 'Le retour à Lisière', loc: 'lisiere_square', spawn: 'from_river_bank', party: ['nara', 'soren', 'tessa'],
    actors: [at('darel', 'darel_spot', 'down'), at('lume', 'lume_spot', 'down'), at('ilan', 'ilan_spot', 'right'), at('refugie', 'refugie1', 'left'), at('refugie', 'refugie2', 'down')],
    hotspots: [hs('c09s01_tables', 'tables', 'tables déplacées', ['Les mêmes tables du chapitre 2 sont déplacées pour distribuer des repas aux réfugiés d\'Orme.'])],
    steps: [
      say([N('La place accueille les réfugiés d\'Orme. Les gens ne savent pas tous qui est Elyan. Darel a entendu le récit d\'Ysane et l\'appelle par son prénom sans titre.')]),
      talk('Parler à Lume', 'lume', [N('Lume montre un dessin commencé avant la révélation : un homme avec une branche, pas une couronne.')]),
      talk('Parler à Darel', 'darel', [
        L('darel', 'Je ne vais pas te dire que le monde exige ton sacrifice. Le monde n\'a pas rempli un formulaire. Ce sont des gens qui veulent vivre, et toi parmi eux.'),
        L('elyan', 'Alors comment on choisit ?'),
        L('darel', 'Sans appeler le prix des autres une solution pour soi.'),
      ]),
      say([N('Le joueur peut voir les effets des quêtes : une pompe réparée, des graines protégées, un courrier arrivé. Ilan remercie le groupe et annonce qu\'il restera avec les messagers. Nara accepte de ne plus décider seule de ses tâches, tout en posant des conditions de sécurité.')]),
      choice('Le ruban de Mira :', [
        opt('Le laisser dans ma chambre provisoire.', { set: setv('ribbon_state', 'entrusted'), lines: [N('Le dépôt n\'efface pas sa famille. Il marque simplement sa volonté de confier un souvenir à quelqu\'un.')] }),
        opt('Le garder jusqu\'à la fin.', { set: setv('ribbon_state', 'kept') }),
      ]),
    ],
    onComplete: [F('lisiere_return_seen')],
    next: 'C09S02',
  }),
  scene({
    id: 'C09S02', chapter: 9, title: 'L\'ingénieure devant la page', loc: 'stellar_lab', spawn: 'from_stellar_command', party: ['soren', 'tessa'],
    actors: [at('ilyra', 'ilyra_spot', 'down')],
    steps: [
      say([N('Ilyra voit le rapport brut et l\'ordre authentifié. Elle tente d\'abord de distinguer sa responsabilité technique de celle du commandement. Tessa lui demande qui a conçu le mode de saturation du camp.')]),
      puzzle({
        kind: 'set', title: 'Présenter les preuves', prompt: 'Sélectionnez les deux preuves principales à montrer à Ilyra.',
        options: [{ id: 'drain', label: 'Rapport d\'épuisement', clue: 'Les mesures brutes de l\'extraction.' }, { id: 'orders', label: 'Ordre de massacre authentifié', clue: 'La page entière, avec les réglages.' }, { id: 'letters', label: 'Lettres de l\'Aube Basse', clue: 'Des vies, mais pas une preuve technique.' }, { id: 'contract', label: 'Page de contrat d\'accueil', clue: 'Un contrat, pas une preuve de l\'opération.' }],
        solution: ['drain', 'orders'],
        hints: ['Rappel du but : convaincre Ilyra avec les preuves principales.', 'Contrainte : elle réagit aux faits techniques et à l\'ordre signé.', 'Action : le rapport d\'épuisement et l\'ordre authentifié.'],
        fail: 'Ilyra reste de marbre. Ces pièces ne suffisent pas : réessayez.', success: 'Ilyra regarde les deux pages. Elle ne peut plus prétendre ignorer.',
      }),
      say([L('ilyra', 'Je pensais que mon rôle était de rendre la chose moins dangereuse.'), L('tessa', 'Tu as rendu possible une chose qu\'on devait empêcher.'), L('ilyra', 'Je peux ouvrir le circuit. Je ne peux pas retirer mon nom de la page.')]),
      choice('Ilyra pose une condition : que ses travaux soient examinés par les deux peuples après la crise.', [
        opt('Accepter son aide contrôlée.', { set: setv('ilyra_support', 'accepted'), lines: [N('Ilyra retire son badge de commandement et ouvre un passage de maintenance.')] }),
        opt('Refuser : Tessa préparera une dérivation manuelle.', { set: setv('ilyra_support', 'refused'), lines: [N('Tessa emporte un outil de dérivation et prépare un trajet plus exposé. Aucun manque de confiance ne tue automatiquement Tessa.')] }),
      ]),
    ],
    onComplete: [F('core_route_ready')],
    next: 'C09S03',
  }),
  scene({
    id: 'C09S03', chapter: 9, title: 'Trois conversations sans promesse', loc: 'lisiere_well', spawn: 'from_lisiere_square', party: ['nara'],
    steps: [
      say([N('Nara montre un sentier qu\'elle veut rouvrir après la crise. Elle demande au héros ce qu\'il aimerait voir si personne ne lui avait proposé de trône.')]),
      choice('Ce que j\'aimerais voir :', [
        opt('Un voyage.', { set: setv('c09_nara_wish', 'trip') }), opt('Une maison.', { set: setv('c09_nara_wish', 'home') }), opt('Une journée sans devoir tout comprendre.', { set: setv('c09_nara_wish', 'day') }),
      ]),
      choice('Nara :', [
        opt('(Exprimer clairement une proximité plus tendre.)', { cond: { trustMin: { nara: 3 } }, set: setv('nara_relationship', 'romance'), effects: [trust('nara', 1)], lines: [N('Elle prend sa main. Sans promettre qu\'ils vivront forcément ensemble.')] }),
        opt('(Rester amis.)', { set: setv('nara_relationship', 'friendship'), lines: [N('Elle lui donne une deuxième cordelette. Les deux versions évitent de promettre qu\'ils vivront forcément ensemble.')] }),
      ]),
      say([L('nara', 'Je ne te dirai pas adieu pendant que tu es encore là.')]),
      move('memory_garden', 'well'),
      say([N('Soren relit son carnet. Il demande si le héros veut que son nom soit écrit avec son titre.')]),
      choice('Le titre du témoignage :', [
        opt('« Elyan »', { set: setv('testimony_title', 'Elyan') }), opt('« Elyan Aster »', { set: setv('testimony_title', 'Elyan Aster') }), opt('« L\'homme de la porte »', { set: setv('testimony_title', 'L\'homme de la porte') }),
      ]),
      say([L('soren', 'Un nom n\'est pas tout ce qu\'une vie laisse. Mais il mérite de ne pas être choisi par ses ennemis.'), N('Soren gardera aussi les faits nécessaires pour comprendre la dynastie ; le choix porte sur le titre du témoignage, pas sur la censure des archives.')]),
      move('stellar_dock', 'from_stellar_command'),
      say([N('Tessa prépare un message à sa mère. Elyan l\'aide à régler l\'émission, action qui ne restaure pas une flotte entière.'), L('tessa', 'Je veux qu\'elle sache où me chercher. Même si je ne reviens pas en haut.')]),
    ],
    onComplete: [F('farewells_seen')],
    next: 'C09S04',
  }),
  scene({
    id: 'C09S04', chapter: 9, title: 'L\'offre d\'un autre commencement', loc: 'miral_gate', spawn: 'from_river_bank', party: ['nara', 'soren', 'tessa'],
    actors: [at('ysane', 'ysane_spot', 'down'), at('stellaire', 'civil_spot', 'left'), at('arven', 'arven_spot', 'right')],
    steps: [
      say([N('Ysane rencontre des représentants de l\'Aube Basse. Elle propose des abris au sol, un usage limité et public des puits, des échanges de savoir et une autorité commune sur les conduites. Il faudra abandonner une partie de la flotte et vivre autrement. Cette solution est difficile, mais réelle.')]),
      say([
        N('Un civil accuse Tessa de renoncer à leur histoire. Elle répond qu\'une histoire peut continuer hors de ses machines. Arven veut exclure tous les soldats. Ysane distingue les personnes qui déposent les armes de celles qui ont signé les ordres.'),
        L('stellaire', 'Nous ne demandons pas que vous nous aimiez en quatre jours. Nous demandons où poser ceux qui ne peuvent plus respirer là-haut.'),
        L('ysane', 'Ici. Avec des limites que nous pourrons discuter sans une arme sur le puits.'),
        N('Elyan comprend que la disparition de sa lignée n\'oblige pas à exterminer les Stellaires. La fin A défend les autochtones et laisse aux réfugiés une possibilité de vie. Vaelor ne signe pas l\'accord.'),
      ]),
    ],
    onComplete: [F('shared_refuge_plan'), save('threshold')],
    next: 'C09S05',
  }),
  scene({
    id: 'C09S05', chapter: 9, title: 'Le seuil que l\'on peut quitter', loc: 'core_approach', spawn: 'from_valley_outlook', party: ['nara', 'soren', 'tessa'],
    actors: [at('ilyra', 'ilyra_spot', 'left')],
    steps: [
      say([N('Au bord d\'une faille de racines, les trois accords répondent au fragment royal. Tessa vérifie le retour vers le village. Nara marque le chemin d\'évacuation avec la cordelette. Soren confie le carnet à Elyan pour qu\'il puisse le rendre avant la décision.')]),
      set(item('soren_book')),
      say([
        L('elyan', 'Si je ne sais toujours pas au moment d\'ouvrir ?'),
        L('tessa', 'Alors tu le diras. Ne laisse pas le métal répondre à ta place.'),
        L('nara', 'Nous pouvons aller jusqu\'à la porte avec toi. Après, nous devrons chacun rester ceux que nous sommes.'),
      ]),
      choice('Poursuivre termine l\'exploration libre de cette période. Une sauvegarde de retour est créée automatiquement.', [
        opt('Entrer.', { set: setv('entered_core', true) }),
        opt('Revenir préparer le départ.', { set: setv('entered_core', false), lines: [N('Vous pouvez parcourir les lieux, terminer les histoires locales, puis revenir.')] }),
      ]),
      { t: 'gate', flag: 'entered_core', text: 'Préparez le départ : terminez les histoires locales, puis revenez au seuil.', at: 'seuil', label: 'le seuil du cœur', back: 1 },
    ],
    onComplete: [F('point_of_no_return'), chapter(10), save('auto')],
    next: 'C10S01',
  }),
];
void hs; void inspect; void reach; void talk; void puzzle; void chapter;
