// Chapitre 2 — Ceux qui écoutent (C02S01 à C02S05). Texte : bible §9.
import { L, N, F, choice, accord, at, chapter, equip, fx, hs, inspect, item, joinParty, journal, opt, power, puzzle, reach, say, scene, setv, talk, trust, save, soin } from './dsl';

export const CH2 = [
  scene({
    id: 'C02S01', chapter: 2, title: 'L\'archiviste dans la boue', loc: 'forest_crossing', spawn: 'from_lisiere_square', party: ['nara'],
    actors: [at('soren', 'soren_spot', 'down')],
    hotspots: [
      hs('c02s01_branch', 'branche', 'branche solide', ['Une branche assez longue pour caler le sac.']),
      hs('c02s01_edge', 'bordure', 'bordure sèche', ['Une bordure sèche, en retrait de la boue : on peut avancer sans s\'enfoncer.']),
    ],
    steps: [
      say([N('Soren cherche une page sous le tronc, tandis que son sac s\'enfonce dans la boue. Il refuse de le lâcher : il contient des copies des contrats d\'accueil proposés à la flotte.')]),
      inspect('Stabiliser le sac : la branche, puis la bordure sèche', ['c02s01_branch', 'c02s01_edge'], 2),
      say([N('Soren récupère lui-même les feuillets ; l\'aide ne fait pas de lui un personnage inutile.'), N('La page recherchée porte un signe que le fragment du prince reproduit presque. Soren remarque la ressemblance.')]),
      talk('Parler à Soren', 'soren', [
        L('soren', 'Ce signe… Un objet peut avoir été volé, donné, trouvé ou hérité. On ne sait pas lequel avec un dessin.'),
        L('nara', 'Tu dirais la même chose s\'il avait une arme braquée sur nous ?'),
        L('soren', 'Je lui demanderais d\'abord de la poser. Ce n\'est pas une raison pour inventer son enfance.'),
        N('L\'archiviste propose de comparer le signe à la stèle du sanctuaire, plutôt que d\'accuser immédiatement le héros.'),
      ]),
      say([N('Il rejoint le groupe jusqu\'à Miral, destination d\'abord différée par les troubles de la rivière.'), L('soren', 'Au fait, quel est ton nom ?'), L('elyan', 'Je ne sais pas.'), L('soren', 'D\'accord. Ce n\'est pas urgent.')]),
    ],
    onComplete: [F('soren_met'), joinParty('soren'), item('contract_page'), journal('p_soren', 'Soren', 'Archiviste de Miral. Sceptique y compris envers ses propres traditions.', 'people'), journal('s_contract', 'Contrats d\'accueil', 'Soren transporte des copies des contrats d\'accueil proposés à la flotte. Pas encore une preuve d\'asservissement.')],
    next: 'C02S02',
  }),
  scene({
    id: 'C02S02', chapter: 2, title: 'La racine que l\'on laisse', loc: 'root_shrine', spawn: 'from_forest_crossing', party: ['nara', 'soren'],
    hotspots: [hs('c02s02_inscr', 'inscription', 'inscription du sanctuaire', ['Soren traduit partiellement : « Ce qui lie… ce qui laisse… » Il manque un mot.'])],
    steps: [
      say([N('Le sanctuaire possède trois supports et quatre racines. Des voyageurs ont autrefois tissé une passerelle au-dessus d\'un creux.')]),
      inspect('Lire l\'inscription avec Soren', ['c02s02_inscr'], 1),
      puzzle({
        kind: 'set', title: 'Tisser la passerelle', prompt: 'Réunissez des racines entre les supports. L\'Écoute révèle qu\'une racine n\'alimente pas les supports : elle nourrit un arbre hors du cercle.',
        options: [
          { id: 'racine_a', label: 'Racine du premier support', clue: 'Alimente le premier support.' },
          { id: 'racine_b', label: 'Racine du deuxième support', clue: 'Alimente le deuxième support.' },
          { id: 'racine_c', label: 'Racine du troisième support', clue: 'Alimente le troisième support.' },
          { id: 'racine_arbre', label: 'Racine de l\'arbre voisin', clue: 'Nourrit un arbre situé hors du cercle ; ses feuilles pâlissent quand on la lie.' },
        ],
        solution: ['racine_a', 'racine_b', 'racine_c'],
        hints: ['Rappel du but : tisser une passerelle sans fermer tous les flux.', 'Contrainte : tout lier fatigue le bassin et défait la passerelle.', 'Action : laissez libre la racine qui nourrit l\'arbre.'],
        fail: 'La passerelle brille puis se défait aussitôt ; l\'arbre voisin pâlit. Aucune sanction : l\'erreur rend la contrainte visible.', success: 'La passerelle tient juste assez longtemps pour atteindre la pierre centrale.',
      }),
      say([
        L('soren', 'Le mot manquant n\'était peut-être pas un objet.'),
        L('elyan', 'Une place ?'),
        L('nara', 'Une place pour ce qui ne nous sert pas.'),
        N('Une réponse chaude traverse le héros, différente du métal brûlant. Le premier accord reste sous la forme d\'un motif à quatre battements dont le dernier est silencieux.'),
      ]),
    ],
    onComplete: [power('weave'), accord('accord_root'), item('accord_root'), save('auto')],
    next: 'C02S03',
  }),
  scene({
    id: 'C02S03', chapter: 2, title: 'Une chanson mal reconnue', loc: 'lisiere_square', spawn: 'from_forest_crossing', party: ['nara', 'soren'],
    tint: { color: 0xe08a30, alpha: 0.2 },
    actors: [at('darel', 'darel_spot', 'down'), at('lume', 'lume_spot', 'down'), at('habitant', 'habitant1', 'right'), at('habitant', 'habitant2', 'left')],
    hotspots: [
      hs('c02s03_tables', 'tables', 'tables du repas', ['Plusieurs personnes ont porté du bois et réparé la pompe pendant votre absence. Le village ne célèbre pas un sauveur universel.'], { verb: 'Aider' }),
      hs('c02s03_story', 'conteur', 'une histoire du village', ['Un habitant raconte la crue de l\'an dernier. Vous vous asseyez pour l\'écouter.'], { verb: 'Écouter' }),
    ],
    steps: [
      say([N('Le village célèbre le retour du passage vers ses réserves. Il ne célèbre pas Elyan comme un sauveur : plusieurs personnes ont porté du bois et réparé la pompe pendant son absence.')]),
      inspect('Participer au repas : dresser les tables ou écouter une histoire', ['c02s03_tables', 'c02s03_story'], 1),
      say([N('Une chanson commence. C\'est la mélodie de Mira, mais le refrain parle de garder une part d\'eau pour l\'aval. Elyan se lève brusquement, convaincu de connaître la chanteuse.')]),
      choice('Le souvenir montre seulement une main près d\'un bassin de verre.', [
        opt('Raconter cette image.', { set: setv('c02s03_memory', 'told'), effects: [trust('nara', 1)], lines: [L('elyan', 'Quelqu\'un me la chantait. Je crois que je l\'aimais.'), L('darel', 'Alors ne la chasse pas parce qu\'elle est arrivée sans son nom.'), L('soren', 'Les chansons voyagent. Nous apprendrons peut-être où celle-ci a été.')] }),
        opt('Prétendre avoir eu un vertige.', { set: setv('c02s03_memory', 'dizzy'), lines: [L('darel', 'Assieds-toi. Ça arrive.'), L('soren', 'Les chansons voyagent. Nous apprendrons peut-être où celle-ci a été.')] }),
      ]),
      say([N('Nara raconte une soirée avec son père et Ilan. Elle évoque son frère, parti livrer des plantes à la rivière. Une habitante répond qu\'il aurait déjà dû revenir.'), N('Le calme se transforme en attente, pas immédiatement en urgence spectaculaire.')]),
    ],
    onComplete: [F('lullaby_link_seen'), journal('mem_lullaby', 'Une chanson mal reconnue', 'La mélodie de la reine, avec des paroles différentes : garder une part d\'eau pour l\'aval.', 'memory')],
    next: 'C02S04',
  }),
  scene({
    id: 'C02S04', chapter: 2, title: 'Le bassin privé', loc: 'river_bank', spawn: 'from_lisiere_square', party: ['nara', 'soren'],
    actors: [at('soldat', 'soldat_spot', 'down'), at('pecheur', 'pecheur1', 'right'), at('pecheur', 'pecheur2', 'left')],
    hotspots: [
      hs('c02s04_fence', 'cloture', 'clôture autour du bassin', ['Une clôture entoure le bassin de la rivière. Les pêcheurs attendent depuis deux jours et leurs filets sèchent.']),
      hs('c02s04_water', 'bassin', 'bassin de la rivière', ['L\'eau claire ne répond presque plus à l\'Écoute.']),
    ],
    steps: [
      say([N('Le groupe trouve une clôture autour du bassin de la rivière. Un soldat annonce qu\'il s\'agit d\'un dispositif sanitaire : les techniciens doivent vérifier la qualité de l\'eau.')]),
      choice('Accéder au bord :', [
        opt('Négocier un accès avec le soldat.', { set: setv('river_access', 'negotiated'), lines: [L('soldat', 'Je ne décide pas qui passe. Mais je peux vous laisser regarder, de loin.')] }),
        opt('Contourner la clôture par une passerelle de racines.', { cond: { powers: ['weave'] }, set: setv('river_access', 'bypassed'), lines: [N('Le Tissage vous permet de franchir la clôture sans l\'ouvrir.')] }),
      ]),
      inspect('Observer le bassin et la clôture', ['c02s04_water', 'c02s04_fence'], 1),
      say([
        N('Le soldat est fatigué, pas sadique. Il propose une ration de sa flotte à une vieille femme. Soren constate que le contrat d\'accueil n\'autorisait pas la fermeture complète du puits.'),
        L('nara', 'Mon frère livre des plantes.'),
        L('soldat', 'Je ne décide pas qui doit être retenu.'),
        L('soren', 'C\'est précisément pour cela qu\'il faut demander qui décide.'),
        N('Le fragment gravé pulse contre la clôture. Un verrou hésite avant de rester fermé. Un bruit de pompe couvre la conversation, puis l\'eau du village en aval baisse.'),
      ]),
    ],
    onComplete: [F('river_relay_known'), journal('s_ilan', 'Retrouver Ilan', 'Les livreurs ont été dirigés vers le relais pour interrogatoire. Ilan est probablement retenu.')],
    next: 'C02S05',
  }),
  scene({
    id: 'C02S05', chapter: 2, title: 'Le soir où l\'on décide de partir', loc: 'lisiere_well', spawn: 'from_lisiere_square', party: ['nara', 'soren'],
    tint: { color: 0x101a40, alpha: 0.38 },
    actors: [at('darel', 'darel_spot', 'left')],
    steps: [
      say([N('Nara assemble des provisions sans demander au héros de la suivre. Elle estime devoir agir pour son frère, même si les conseils décident d\'attendre.'), L('soren', 'Je veux emporter les contrats, afin qu\'une discussion reste possible.'), L('darel', 'Ramenez des témoins, pas seulement un récit de colère.')]),
      choice('Pourquoi partez-vous ?', [
        opt('Pour Ilan.', { set: setv('c02s05_reason', 'ilan'), lines: [L('nara', 'Une réponse honnête vaut mieux qu\'une promesse héroïque. Merci.')] }),
        opt('Pour comprendre le métal.', { set: setv('c02s05_reason', 'metal'), lines: [L('nara', 'Si tu viens seulement parce que tu espères retrouver ta mémoire, dis-le. Je peux marcher avec ça.')] }),
        opt('Pour les deux.', { set: setv('c02s05_reason', 'both'), lines: [L('nara', 'Si tu viens seulement parce que tu espères retrouver ta mémoire, dis-le. Je peux marcher avec ça.')] }),
      ]),
      say([
        L('elyan', 'Et si je viens parce que vous m\'avez donné une place ?'),
        L('nara', 'Alors n\'en fais pas une dette. Fais-en un choix.'),
        N('Elle lui donne une cordelette qui sert à marquer les chemins. Elle dit qu\'il devra apprendre à distinguer un sentier sûr d\'un sentier rassurant.'),
      ]),
      fx('fade-out', 700),
      say([N('Pendant le repos, Elyan entend une pulsation qui se transforme en claquement de portes. Un rêve montre des gens dans une salle éclairée, mais aucun visage identifiable.')]),
      fx('fade-in', 700),
      say([N('Au matin, la sortie de Lisière mène à la rivière. La place conserve ses activités secondaires.')]),
    ],
    onComplete: [item('nara_thread'), chapter(3), soin(1), save('auto')],
    next: 'C03S01',
  }),
];
void equip; void reach; void trust;
