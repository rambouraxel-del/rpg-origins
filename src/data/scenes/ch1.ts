// Chapitre 1 — Une forêt sans nom (C01S01 à C01S05). Texte : bible §8.
import { L, N, F, accord, at, chapter, equip, fx, hs, inspect, journal, joinParty, opt, power, puzzle, reach, rest, say, scene, setv, talk, trust, save } from './dsl';

export const CH1 = [
  scene({
    id: 'C01S01', chapter: 1, title: 'L\'eau dans les branches', loc: 'forest_arrival', spawn: 'wake',
    actors: [at('nara', 'nara_spot', 'left')],
    hotspots: [
      hs('c01s01_shard', 'pool', 'fragment dans la poche', ['Un métal tiède, gravé. Un fragment gravé : il semble se refermer ou s\'ouvrir selon l\'angle.']),
      hs('c01s01_ribbon', 'pool', 'ruban', ['Un tissu familier. Vous ne savez pas à qui il appartenait.']),
      hs('c01s01_tracks', 'tracks', 'traces dans la boue', ['Des empreintes qui ne sont pas les vôtres.']),
    ],
    steps: [
      say([N('Elyan se réveille au bord d\'un bassin, sous des branches qui semblent retenir la lumière. Il vérifie ses mains et sa blessure.'), N('Son reflet est visible, mais ne lui évoque aucun nom.')]),
      reach('Suivre le bruit, vers le chemin', 'nara_zone'),
      say([N('Nara apparaît à la limite du chemin, son arme abaissée sans être rangée.'), L('nara', 'Tu peux marcher ? D\'où viens-tu ?')]),
      talk('Répondre à Nara', 'nara', [L('nara', 'Ton nom ?'), L('elyan', 'Je devrais pouvoir répondre.')], [
        opt('Je ne sais pas.', { set: setv('c01_first_answer', 'unknown'), effects: [trust('nara', 1)], lines: [L('nara', 'D\'accord. Alors commence par ce que tu sais : tu es blessé, et l\'eau monte.')] }),
        opt('Je viens d\'un village lointain.', { set: setv('c01_first_answer', 'lie'), lines: [N('Nara remarque simplement que ses vêtements ne correspondent pas.'), L('nara', 'D\'accord. Alors commence par ce que tu sais : tu es blessé, et l\'eau monte.')] }),
        opt('(Garder le silence.)', { set: setv('c01_first_answer', 'silent'), lines: [L('nara', 'D\'accord. Alors commence par ce que tu sais : tu es blessé, et l\'eau monte.')] }),
      ]),
      say([N('Elle lui tend une branche pour franchir un trou. Le héros doit avancer, pas résoudre son amnésie pour obtenir de l\'aide.')]),
      reach('Franchir le trou et suivre Nara jusqu\'au chemin', 'exit_east'),
      fx('flash', 400),
      say([N('Une pulsation du bassin répond à sa paume. Nara la voit et ne la commente pas encore.')]),
    ],
    onComplete: [F('nara_met'), F('identity_known', false), joinParty('nara'), trust('nara', 0)],
    next: 'C01S02',
  }),
  scene({
    id: 'C01S02', chapter: 1, title: 'Le passage tombé', loc: 'forest_crossing', spawn: 'from_forest_arrival', party: ['nara'],
    actors: [at('bete', 'beast_spot', 'left')],
    hotspots: [
      hs('c01s02_ring', 'cercle', 'cercle de racines sèches', ['Les racines ont séché dans un cercle net. La chute de l\'arbre n\'est pas naturelle.']),
      hs('c01s02_clamp', 'attache', 'attache métallique', ['Une attache métallique, ouverte à moitié. Une petite bête s\'y est prise.']),
      hs('c01s02_high', 'sortie_haute', 'sortie en hauteur fermée par des racines', ['Une sortie en hauteur, fermée par des racines. Le Tissage permettra d\'y revenir.']),
    ],
    steps: [
      say([N('Un arbre abattu bloque le sentier. Nara constate que sa chute n\'est pas naturelle.'), N('Un petit animal s\'est pris dans une attache métallique.')]),
      inspect('Examiner le cercle de racines et l\'attache', ['c01s02_ring', 'c01s02_clamp'], 2),
      talk('Libérer la bête avec Nara', 'nara', [L('nara', 'Tiens-la, je défais l\'attache. Ou tu préfères que je la défasse seule ?')], [
        opt('Ouvrir l\'attache avec Nara.', { set: setv('c01s02_beast', 'helped'), lines: [N('Vous ouvrez l\'attache ensemble. La bête file.')] }),
        opt('Préférer ne pas la toucher : tenir la branche.', { set: setv('c01s02_beast', 'branch'), lines: [N('Nara accomplit le geste, le héros tient la branche. Les deux actions contribuent ; l\'option prudente n\'est pas jugée.')] }),
      ]),
      fx('flash', 300),
      say([
        N('En déplaçant le métal, Elyan ressent un fragment de son : trois notes, un claquement, quelqu\'un qui appelle. La mémoire cesse avant qu\'il distingue le nom.'),
        L('nara', 'Ça te rappelle quelque chose ?'),
        L('elyan', 'Une pièce fermée. Du verre, peut-être.'),
        L('nara', 'Garde-le pour Darel. Moi, je sais où marcher ; pas ce qui se passe dans ta tête.'),
        N('Au loin, un point brillant traverse le ciel à contre-courant des oiseaux.'),
      ]),
      reach('Contourner le tronc et suivre le sentier', 'exit_east'),
    ],
    onComplete: [F('c01s02_done'), journal('mem_sound', 'Trois notes et un claquement', 'En ouvrant une attache métallique, un son : trois notes, un claquement, quelqu\'un qui appelle.', 'memory')],
    next: 'C01S03',
  }),
  scene({
    id: 'C01S03', chapter: 1, title: 'Une place à la table', loc: 'lisiere_square', spawn: 'from_forest_crossing', party: ['nara'],
    actors: [at('darel', 'darel_spot', 'down'), at('arven', 'arven_spot', 'left'), at('lume', 'lume_spot', 'down'), at('habitant', 'habitant1', 'right'), at('habitant', 'habitant2', 'left')],
    hotspots: [
      hs('c01s03_pump', 'pompe', 'pompe qui fuit', ['Une pompe fuit. Du linge sèche sur une corde. Lisière est un lieu occupé, pas une halte pour le héros.']),
      hs('c01s03_grain', 'grain', 'voisins et partage de grain', ['Deux voisins discutent d\'un partage de grain.']),
    ],
    steps: [
      say([N('Lisière est un lieu occupé : du linge sèche, une pompe fuit, deux voisins discutent d\'un partage de grain.')]),
      talk('Se laisser examiner par Darel', 'darel', [N('Darel nettoie sa blessure et vérifie qu\'il comprend les mots, les nombres et les gestes.'), L('darel', 'La mémoire d\'une vie peut manquer alors que beaucoup de savoirs demeurent. Tu as encore ta langue, tes gestes. Ce n\'est pas rien.')]),
      say([
        L('arven', 'Nara n\'a-t-elle pas recueilli un éclaireur de la flotte ? Ce fragment métallique rend la question plausible.'),
        L('nara', 'Je l\'ai trouvé presque noyé. Cela ne prouve pas son innocence.'),
        L('arven', 'Nous ne pouvons pas ouvrir nos portes à chaque secret tombé du ciel.'),
        L('darel', 'Nous pouvons ouvrir une chaise. Les portes, nous en discuterons lorsqu\'il pourra tenir debout.'),
        N('Darel impose une règle provisoire : pas de sortie solitaire vers les puits éloignés, une place au repas et un travail léger lorsque la douleur cesse.'),
      ]),
      talk('Répondre à Lume', 'lume', [N('Lume lui apporte un bol trop rempli.'), L('lume', 'Tu es un prince ? Ton manteau brille.')], [
        opt('(Rire.) Je n\'en sais rien.', { set: setv('lume_prince_answer', 'laugh'), lines: [L('lume', 'Moi, je trouve que oui.')] }),
        opt('Je n\'en sais rien, vraiment.', { set: setv('lume_prince_answer', 'unknown'), lines: [L('lume', 'Alors tu peux être ce que tu veux.')] }),
        opt('Qu\'est-ce qu\'un prince devrait faire ?', { set: setv('lume_prince_answer', 'ask'), lines: [L('lume', 'Écouter, je crois. Et aider à porter.')] }),
      ]),
    ],
    onComplete: [F('lisiere_guest'), journal('p_darel', 'Darel', 'Guérisseur de Lisière. Enseigne les puits et refuse de soigner en épuisant la source.', 'people'), journal('p_lume', 'Lume', 'Enfant du village. Veut savoir si l\'Étranger est un prince.', 'people'), equip('baton')],
    next: 'C01S04',
  }),
  scene({
    id: 'C01S04', chapter: 1, title: 'Le puits qui attend', loc: 'lisiere_well', spawn: 'from_lisiere_square', party: ['nara'],
    actors: [at('darel', 'darel_spot', 'right')],
    hotspots: [
      hs('c01s04_stones', 'pierres', 'pierres des familles', ['Des pierres de tailles différentes encerclent l\'eau, chacune ajoutée par une famille.']),
      hs('c01s04_mark', 'marque', 'marque presque effacée', ['Une marque presque effacée. Darel la montre, puis attend.']),
    ],
    steps: [
      say([N('Darel mène le héros au puits. Ce n\'est pas une fontaine royale : des pierres de tailles différentes encerclent l\'eau.'), N('Elyan, habitué sans le savoir aux dispositifs qui répondent immédiatement, touche plusieurs fois le bord.'), N('Le bassin se trouble. Nara lui demande d\'arrêter.')]),
      puzzle({
        kind: 'order', title: 'Le repos sans forcer', prompt: 'Le bassin répond par trois impulsions. Comprenez l\'exercice : demandez, observez, retirez votre demande quand la source faiblit.',
        options: [{ id: 'demander', label: 'Demander doucement' }, { id: 'observer', label: 'Observer l\'impulsion' }, { id: 'retirer', label: 'Retirer la demande' }, { id: 'toucher', label: 'Toucher le bord plus vite' }],
        solution: ['demander', 'observer', 'retirer'],
        hints: ['Rappel du but : se reposer sans épuiser la source.', 'Contrainte : appuyer plus vite trouble l\'eau ; il faut savoir s\'arrêter.', 'Action : demander, observer l\'impulsion, puis retirer la demande.'],
        fail: 'L\'eau se trouble. Nara : « Attends. Recommence plus lentement. »', success: 'Le soin arrive lorsque vous retirez votre demande. Votre douleur diminue ; la blessure ne disparaît pas.',
      }),
      say([
        L('darel', 'Tu peux demander. Tu peux recommencer plus tard. Ce que tu ne peux pas faire, c\'est appeler ton besoin une permission.'),
        L('elyan', 'Chez moi…'),
        L('nara', 'Tu te souviens ?'),
        L('elyan', 'Non. Seulement que je n\'aurais pas attendu.'),
        N('Une image de jardins sous verre remonte puis se brise. Darel conseille de noter ce qui revient plutôt que de forcer le souvenir.'),
        N('Le menu de repos propose désormais soin, sauvegarde et conversation.'),
      ]),
    ],
    onComplete: [F('well_tutorial_done'), journal('mem_glass', 'Verre et jardin', 'Un jardin sous verre, une impression de ne pas devoir attendre. Une image brisée.', 'memory'), save('auto')],
    next: 'C01S05',
  }),
  scene({
    id: 'C01S05', chapter: 1, title: 'Une réponse sans voix', loc: 'root_shrine', spawn: 'from_forest_crossing', party: ['nara'],
    hotspots: [
      hs('c01s05_stone', 'pierre', 'pierre', ['La pierre renvoie l\'eau du village.']),
      hs('c01s05_root', 'racine_seche', 'racine desséchée', ['La racine renvoie une douleur.']),
      hs('c01s05_clamp', 'attache', 'attache métallique', ['Le métal répète une demande sans fin.']),
    ],
    steps: [
      say([N('Nara accompagne le héros à un ancien cercle de pierres. Une racine desséchée y touche une attache similaire à celle du passage tombé.'), N('Le cercle semble silencieux ; pourtant le héros distingue une pulsation sous le bruit des feuilles.')]),
      puzzle({
        kind: 'pick', title: 'Écouter trois points', prompt: 'Écoutez la pierre, la racine et l\'attache. Sélectionnez ce qui souffre pour le signaler.',
        options: [{ id: 'pierre', label: 'La pierre', clue: 'Elle renvoie l\'eau du village.' }, { id: 'racine', label: 'La racine', clue: 'Elle renvoie une douleur.' }, { id: 'attache', label: 'L\'attache métallique', clue: 'Elle répète une demande sans fin.' }],
        solution: 'racine',
        hints: ['Rappel du but : signaler ce qui souffre.', 'Contrainte : le métal ne souffre pas, il répète ; la pierre est calme.', 'Action : choisissez la racine.'],
        fail: 'Vous comparez vos impressions avec Nara. Réessayez.', success: 'Le fragment gravé s\'échauffe près de l\'attache. Avec l\'aide de Nara, vous retirez la pièce.',
      }),
      say([
        N('Le héros pose sa main sur la pierre. La pulsation devient régulière.'),
        L('nara', 'Tu n\'as pas donné un ordre.'),
        L('elyan', 'Je ne savais pas quoi dire.'),
        L('nara', 'Peut-être que c\'est la première chose qu\'elle avait besoin d\'entendre.'),
        N('Une silhouette de lumière apparaît derrière les branches puis se dissipe. Aucun message « tu es l\'élu ».'),
        N('Une cloche au village interrompt le calme : un messager annonce qu\'un nouveau relais a été posé près de la rivière.'),
      ]),
    ],
    onComplete: [power('listen'), F('root_distress_seen'), chapter(2), journal('mem_eira1', 'Une silhouette de lumière', 'Derrière les branches, une silhouette de lumière. Elle n\'a rien dit.', 'memory'), save('auto')],
    next: 'C02S01',
  }),
];
void accord; void rest;
