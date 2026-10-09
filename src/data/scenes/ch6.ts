// Chapitre 6 — Le nom sous la couronne (C06S01 à C06S05). Texte : bible §13.
import { L, N, F, at, chapter, combat, fx, hs, inspect, item, journal, opt, power, puzzle, reach, say, scene, setv, stealth, trust, save, choice, set } from './dsl';

export const CH6 = [
  scene({
    id: 'C06S01', chapter: 6, title: 'Les rayons déplacés', loc: 'occupied_archive', spawn: 'from_stellar_dock', party: ['nara', 'soren', 'tessa'],
    hotspots: [
      hs('c06s01_etiquettes', 'etiquettes', 'étiquettes neuves sur rayons anciens', ['Des étiquettes neuves sur des rayons anciens. Les livres qui contestent les prélèvements ont été déplacés dans une zone marquée « traditions sans valeur opérationnelle ».']),
      hs('c06s01_liste', 'liste_sites', 'liste de sites préparés', ['Une liste de sites préparés pour le prélèvement. Lisière y figure comme une unité de renouvellement. Votre foyer provisoire a déjà été réduit à une ressource.'], { effects: [F('colonial_classification_seen')] }),
    ],
    steps: [
      say([N('L\'archive de Miral porte des étiquettes neuves sur des rayons anciens. Soren reconnaît le banc où il travaillait. Il doit contenir sa colère pour guider le groupe.'), L('soren', 'Ils n\'ont pas brûlé les livres. Ils ont changé les questions auxquelles on a le droit de les laisser répondre.'), L('tessa', 'Celui-là est un inventaire de lieux vivants. Ils l\'ont rangé avec les stocks.')]),
      stealth('Traverser l\'archive : le Voile (V) permet de passer une zone de ronde', 'entree', 'registre_zone', [
        { path: ['ronde_a1', 'ronde_a2'], w: 150, h: 90 },
        { path: ['ronde_b1', 'ronde_b2'], w: 130, h: 90 },
      ]),
      puzzle({
        kind: 'order', title: 'La porte du registre', prompt: 'Observez le cycle du verrou : l\'Onde ouvre la porte après observation.',
        options: [{ id: 'observer', label: 'Observer le cycle' }, { id: 'ecouter', label: 'Écouter le verrou' }, { id: 'onde', label: 'Lancer l\'Onde au creux du cycle' }],
        solution: ['observer', 'ecouter', 'onde'],
        hints: ['Rappel du but : ouvrir la porte du registre.', 'Contrainte : l\'Onde doit tomber au creux du cycle.', 'Action : observer, écouter, puis lancer l\'Onde.'],
        fail: 'Le verrou se referme. Recommencez ; aucune alarme.', success: 'Le verrou plus ancien accepte le fragment sans hésiter et affiche une inscription complète que vous pouvez relire.',
      }),
      inspect('Lire la liste des sites préparés', ['c06s01_liste'], 1),
    ],
    onComplete: [F('archive_entered'), journal('s_classification', 'Classification coloniale', 'Une première preuve : Lisière, classée comme « unité de renouvellement ».')],
    next: 'C06S02',
  }),
  scene({
    id: 'C06S02', chapter: 6, title: 'Elyan Aster', loc: 'archive_core', spawn: 'from_occupied_archive', party: ['nara', 'soren', 'tessa'],
    hotspots: [
      hs('c06s02_trace1', 'trace_pere', 'trace : la salle des cartes', ['Votre père dans la salle des cartes. Un souvenir remonte.']),
      hs('c06s02_trace2', 'trace_jardin', 'trace : le jardin', ['Le jardin, une main près d\'un bassin de verre.']),
      hs('c06s02_trace3', 'trace_choc', 'trace : la douleur du choc', ['La colonne, le voile blanc, la douleur du choc.']),
    ],
    steps: [
      say([N('Le registre ne dit pas seulement « Aster ». Il affiche une lignée, une date et le portrait de l\'héritier de l\'an 780. La reconnaissance s\'appuie sur le sceau de transit du prologue et la signature enregistrée.'), N('Elyan voit son nom et l\'image de Mira. La mémoire revient par fragments.')]),
      inspect('Parcourir les trois traces, dans l\'ordre de votre choix', ['c06s02_trace1', 'c06s02_trace2', 'c06s02_trace3'], 3),
      say([
        N('Soren lit l\'année à voix haute. Tessa reconnaît les commandes de transit qui maintiennent un voyageur venu d\'une ligne future. Nara pose son arme au sol pour que le héros ne se sente pas interrogé sous menace.'),
        L('elyan', 'Je savais comment on devait me saluer. Je ne savais plus qui j\'étais.'),
        L('nara', 'Tu peux nous dire ton nom sans nous demander de nous agenouiller.'),
        L('elyan', 'Elyan.'),
        L('soren', 'Elyan Aster. De l\'an sept cent quatre-vingts.'),
        N('Le journal remplace « l\'Étranger » par Elyan. La mémoire est partiellement restaurée, pas parfaite.'),
      ]),
    ],
    onComplete: [F('identity_known'), F('origin_year', 780), F('amnesia', 'partial'), journal('mem_name', 'Elyan Aster', 'Votre nom. De l\'an 780. Un prince, un royaume nommé Asterion.', 'memory'), save('auto')],
    next: 'C06S03',
  }),
  scene({
    id: 'C06S03', chapter: 6, title: 'La fondation corrigée', loc: 'archive_core', spawn: 'registre', party: ['nara', 'soren', 'tessa'],
    hotspots: [
      hs('c06s03_royal', 'trace_royale', 'enregistrement royal', ['La fondation d\'Asterion : Vaelor aurait trouvé un monde vide, réveillé une source endormie et offert la paix aux survivants.']),
      hs('c06s03_veilleurs', 'trace_veilleurs', 'archives veilleurs', ['Miral, Lisière et les traités signés.']),
      hs('c06s03_militaire', 'trace_militaire', 'trace militaire', ['Une « neutralisation définitive des foyers de refus » en préparation. L\'événement n\'est pas encore accompli : un projet que le groupe peut empêcher.']),
    ],
    steps: [
      inspect('Comparer les trois versions de la fondation', ['c06s03_royal', 'c06s03_veilleurs', 'c06s03_militaire'], 3),
      puzzle({
        kind: 'set', title: 'Tenir ensemble trois traces', prompt: 'La Rémanence s\'ouvre lorsque vous tenez ensemble les trois traces. Elle montre ce qui a été retiré de la version future.',
        options: [{ id: 'royale', label: 'Version royale', clue: 'La fondation pacifique.' }, { id: 'veilleurs', label: 'Archives veilleurs', clue: 'Les traités signés.' }, { id: 'militaire', label: 'Trace militaire', clue: 'Le projet d\'extermination.' }],
        solution: ['royale', 'veilleurs', 'militaire'],
        hints: ['Rappel du but : comparer sans choisir une seule version.', 'Contrainte : retirer une trace cache ce qui a été effacé.', 'Action : tenez les trois traces ensemble.'],
        fail: 'L\'image est incomplète : quelque chose manque. Reprenez avec les trois.', success: 'Les noms, les lieux et les réponses d\'Eïra retirés de la version future apparaissent. Vaelor est inscrit au départ de la lignée d\'Elyan.',
      }),
      say([L('elyan', 'Nous apprenions que personne n\'habitait ici.'), L('soren', 'Nous sommes les personnes retirées de cette phrase.'), L('tessa', 'Ce sont des ordres. Pas une catastrophe arrivée malgré eux.'), N('Le palais devient compréhensible : les conduites du jardin sont les descendants du réseau en construction.')]),
    ],
    onComplete: [power('echo'), F('ancestry_known'), F('conquest_truth_known'), journal('s_conquest', 'La fondation corrigée', 'Le royaume d\'Elyan est né d\'une conquête. Vaelor Aster est son ancêtre. Le projet de massacre est connu partiellement.')],
    next: 'C06S04',
  }),
  scene({
    id: 'C06S04', chapter: 6, title: 'La dernière phrase du mage', loc: 'chronal_chamber', spawn: 'from_stellar_lab', party: ['nara', 'soren', 'tessa'],
    tint: { color: 0x8080ff, alpha: 0.18 },
    actors: [at('oren', 'oren_spot', 'down')],
    hotspots: [hs('c06s04_tablette', 'tablette', 'tablette d\'Oren', ['Les notes d\'Oren : il cherchait l\'origine de la rupture et ne pouvait choisir un autre héritier enregistré. Il a sauvé une personne, sans lui imposer d\'accomplir une prophétie.'], { effects: [F('oren_notes')] })],
    steps: [
      say([N('La coordonnée d\'archive ouvre une mémoire de transit conservée par la Couronne : quelques instants avant et après le passage d\'Elyan. Ce n\'est pas un portail permettant d\'aller sauver Oren. Les données ne contiennent pas un présent habitable, seulement l\'enregistrement du passage.'), N('Le héros voit le mage détourner la puissance vers un point marqué « première capture ».')]),
      inspect('Lire la tablette d\'Oren', ['c06s04_tablette'], 1),
      say([
        N('Le joueur entend enfin une phrase couverte par l\'explosion.'),
        L('oren', 'Il faut qu\'au moins quelqu\'un voie ce que nous avons oublié.'),
        L('elyan', 'Il savait que mon royaume avait commencé ici.'),
        L('soren', 'Il savait assez pour chercher. Pas assez pour écrire ton choix à ta place.'),
        L('nara', 'Il t\'a ouvert une porte. Ça ne lui donne pas le droit de décider ce que tu trouveras derrière.'),
        N('Un indicateur affiche que l\'ancre d\'origine maintient le voyageur. La suppression de la fondation est signalée comme divergence incompatible. Tessa reconnaît un risque d\'effacement, mais demande une confirmation avant de prononcer une condamnation.'),
        N('L\'accès à l\'archive est maintenant surveillé ; le groupe doit sortir.'),
      ]),
    ],
    onComplete: [item('oren_notes'), F('anchor_risk_seen'), journal('s_anchor', 'L\'ancre d\'origine', 'Un indicateur : l\'ancre d\'origine maintient le voyageur. Supprimer la fondation est une divergence incompatible. À confirmer auprès d\'Eïra.')],
    next: 'C06S05',
  }),
  scene({
    id: 'C06S05', chapter: 6, title: 'Le nom que l\'on dit soi-même', loc: 'memory_garden', spawn: 'from_miral_gate', party: ['nara', 'soren', 'tessa'],
    tint: { color: 0x101a40, alpha: 0.38 },
    actors: [at('ysane', 'ysane_spot', 'left')],
    steps: [
      say([N('Le groupe revient à Miral avec les copies. Les compagnons connaissent déjà les preuves.')]),
      choice('Dire la vérité à vos alliés :', [
        opt('Tout dire immédiatement.', { set: setv('origin_confession', 'honest'), effects: [trust('nara', 1), trust('soren', 1), trust('tessa', 1)] }),
        opt('Me limiter à ma parenté, puis répondre aux questions.', { set: setv('origin_confession', 'partial') }),
        opt('Tenter de minimiser les archives.', { set: setv('origin_confession', 'minimized'), effects: [trust('nara', -1), trust('soren', -1), trust('tessa', -1)], lines: [N('Les compagnons connaissent déjà les preuves. Le dernier choix réduit la confiance et provoque une confrontation, sans créer une illusion où ils ignoreraient ce qu\'ils viennent de voir.')] }),
      ]),
      say([
        N('Nara demande s\'il veut encore sauver Ilan et Lisière lorsqu\'il sait ce que cela pourrait coûter. Soren refuse de considérer la naissance comme une faute. Tessa reconnaît sa peur : il n\'est plus le seul à appartenir au peuple qui construit les machines.'),
        L('soren', 'Tu n\'as pas signé les ordres de tes ancêtres. Mais tu peux signer les suivants.'),
        L('elyan', 'Si je les arrête, je ne sais pas ce qu\'il restera de moi.'),
        L('nara', 'Moi non plus. Je ne vais pas te mentir pour te garder de notre côté.'),
        N('Ysane arrive. Elle demande que les preuves soient présentées au conseil et que le risque temporel soit vérifié auprès d\'Eïra. Elle maintient l\'accueil d\'Elyan, avec escorte dans les zones sensibles.'),
      ]),
    ],
    onComplete: [F('companions_know_origin'), chapter(7), save('auto')],
    next: 'C07S01',
  }),
];
void combat; void fx; void reach; void set; void hs;
