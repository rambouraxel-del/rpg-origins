// Chapitre 7 — Le prix d'une origine (C07S01 à C07S05). Texte : bible §14.
import { L, N, F, accord, at, chapter, hs, inspect, item, journal, opt, power, puzzle, reach, say, scene, setv, talk, trust, save, choice, set } from './dsl';

export const CH7 = [
  scene({
    id: 'C07S01', chapter: 7, title: 'L\'avenir dans l\'eau', loc: 'memory_shrine', spawn: 'from_memory_garden', party: ['nara', 'soren', 'tessa'],
    actors: [at('eira', 'eira_spot', 'down')],
    steps: [
      say([N('Elyan apporte les traces du registre à Eïra. La Rémanence permet de superposer le palais et les racines : les conduites du futur ne nourrissent pas seulement des jardins, elles empêchent le cycle de reprendre depuis des siècles.')]),
      say([
        N('Eïra confirme que libérer le cœur supprimera le futur exact qui a produit Elyan. Il ne mourra pas simplement d\'une dépense de magie qu\'un puits pourrait réparer. Son maintien temporaire cessera lorsque la coordonnée d\'origine n\'existera plus.'),
        L('elyan', 'Tu pourrais garder ce qui me tient, juste pour une personne.'),
        L('eira', 'Ce qui te tient est ce qui me ferme. Une petite porte de cette cage reste une cage.'),
        L('elyan', 'Alors je suis une partie de ta prison.'),
        L('eira', 'Tu es une personne qui peut encore choisir de l\'ouvrir.'),
        N('Nara refuse de considérer la première réponse comme la fin de toute recherche. Tessa propose de vérifier les solutions techniques. Eïra accepte leur recherche et ne la traite pas comme une trahison.'),
      ]),
    ],
    onComplete: [F('erasure_cost_known'), journal('s_cost', 'Le prix', 'Libérer le cœur supprime le futur exact qui a produit Elyan. Il ne s\'agit pas d\'une blessure qu\'un puits pourrait réparer : le mot est « disparaître ».')],
    next: 'C07S02',
  }),
  scene({
    id: 'C07S02', chapter: 7, title: 'Les issues qui ne sont pas des portes', loc: 'stellar_lab', spawn: 'from_stellar_command', party: ['nara', 'soren', 'tessa'],
    actors: [at('ilyra', 'ilyra_spot', 'down')],
    hotspots: [
      hs('c07s02_abri', 'banc_abri', 'démonstration : abri orbital', ['L\'abri reçoit son énergie de la même ancre : il ne change rien à l\'origine.'], { verb: 'Observer' }),
      hs('c07s02_capsule', 'banc_capsule', 'démonstration : capsule de sommeil', ['Le sommeil ralentit le corps, pas l\'effacement de son origine.'], { verb: 'Observer' }),
      hs('c07s02_signature', 'banc_signature', 'démonstration : nouvelle signature d\'accueil', ['La nouvelle signature peut autoriser une machine, mais ne crée pas les parents, la naissance et les années vécues par Elyan.'], { verb: 'Observer' }),
      hs('c07s02_fragment', 'banc_fragment', 'épreuve du fragment hors circuit', ['Une tentative de conserver le fragment hors du circuit échoue : sa partie temporelle se dissout, alors que son métal ordinaire demeure. La différence explique pourquoi un carnet peut survivre au prince sans conserver sa vie.'], { verb: 'Observer' }),
    ],
    steps: [
      say([N('Tessa et Ilyra examinent un abri orbital, une capsule de sommeil et une nouvelle signature d\'accueil. L\'expérience porte sur des modèles et un objet marqué par le transit, jamais sur un compagnon sacrifié.')]),
      inspect('Vérifier les trois solutions, dans l\'ordre de votre choix', ['c07s02_abri', 'c07s02_capsule', 'c07s02_signature'], 3),
      say([
        L('tessa', 'Je peux changer ce qu\'une porte croit reconnaître. Je ne peux pas fabriquer le passé d\'une personne.'),
        L('nara', 'Et s\'il restait sans jamais revenir ?'),
        L('ilyra', 'Il le fait déjà. C\'est l\'origine, pas la destination, qui le maintient.'),
        N('Ilyra admet qu\'elle connaît une autre voie : achever la Couronne et corriger son débit. Elle avertit que cette voie maintient nécessairement la capture. Elle ne promet pas un partage libre sous un nom différent.'),
      ]),
    ],
    onComplete: [F('alternatives_checked'), journal('s_alternatives', 'Trois solutions vérifiées', 'Abri orbital, capsule de sommeil, nouvelle signature : aucune ne remplace l\'origine. Une seule voie conserve Elyan : achever la Couronne, et maintenir la capture.')],
    next: 'C07S03',
  }),
  scene({
    id: 'C07S03', chapter: 7, title: 'La famille proposée', loc: 'stellar_command', spawn: 'from_stellar_lab', party: ['nara', 'soren', 'tessa'],
    actors: [at('vaelor', 'vaelor_spot', 'down')],
    steps: [
      choice('Qui vous accompagne comme témoin ?', [
        opt('Nara', { set: setv('c07_witness', 'nara') }), opt('Soren', { set: setv('c07_witness', 'soren') }), opt('Tessa', { set: setv('c07_witness', 'tessa') }),
      ]),
      say([N('Vaelor reçoit Elyan après avoir confirmé les données de succession. Il lui montre les listes de morts de l\'exode, puis une projection du royaume futur : Mira vivante dans un enregistrement du palais. Il parle d\'un retour possible si l\'ancre est stabilisée. La douleur du prince devient une prise.')]),
      choice('Répondre à Vaelor :', [
        opt('Défendre les Veilleurs.', { set: setv('c07_stance', 'defend') }),
        opt('Demander pourquoi le partage est refusé.', { set: setv('c07_stance', 'ask') }),
        opt('Avouer ma peur.', { set: setv('c07_stance', 'fear') }),
      ]),
      say([
        N('Vaelor répond que des peuples différents finiront par se disputer la source et qu\'un commandement unique préviendra les guerres. Il présente le massacre à venir comme une opération contre les « foyers irréconciliables ». Le témoin relève le terme ; Tessa rappelle l\'offre d\'accueil d\'Ysane.'),
        L('vaelor', 'Ce n\'est pas une idée que tu sauveras en me rejoignant. C\'est ta mère. C\'est la chambre où tu as appris à lire.'),
        L('elyan', 'Et combien de chambres ont disparu pour qu\'elle existe ?'),
        L('vaelor', 'Toutes les origines ont un prix. Les survivants sont ceux qui cessent d\'en demander pardon.'),
        N('Elyan quitte la salle sans choisir de route. Vaelor lui remet un accès au cœur comme preuve de confiance intéressée. L\'objet ne permet pas encore d\'y entrer sans les accords et sans traverser la vallée.'),
      ]),
    ],
    onComplete: [F('vaelor_offer_seen'), F('core_pass_acquired'), item('core_pass')],
    next: 'C07S04',
  }),
  scene({
    id: 'C07S04', chapter: 7, title: 'Se tenir ensemble', loc: 'root_shrine', spawn: 'from_forest_crossing', party: ['nara', 'soren', 'tessa'],
    actors: [at('eira', 'eira_spot', 'down')],
    steps: [
      say([N('Nara veut arrêter les machines avant qu\'Elyan ne soit prêt ; Soren veut publier les preuves ; Tessa veut sauver aussi les civils de l\'orbite. Chacun exprime son intention dans le cercle.')]),
      puzzle({
        kind: 'set', title: 'Le dialogue de synthèse', prompt: 'Reconnaissez les trois objectifs de vos compagnons. Une réponse centrée sur votre seule disparition fait recommencer la formulation.',
        options: [{ id: 'nara', label: 'Nara : arrêter les machines', clue: 'Elle veut protéger Ilan et Lisière.' }, { id: 'soren', label: 'Soren : publier les preuves', clue: 'Pour qu\'elles soient discutées.' }, { id: 'tessa', label: 'Tessa : sauver aussi les civils de l\'orbite', clue: 'Ceux de l\'Aube Basse.' }, { id: 'moi', label: 'Moi : ma propre disparition', clue: 'Ce n\'est pas ce que le cercle demande.' }],
        solution: ['nara', 'soren', 'tessa'],
        hints: ['Rappel du but : relier les trois accords sans absorber les autres.', 'Contrainte : personne n\'est contraint de renoncer à sa voix.', 'Action : reconnaissez Nara, Soren et Tessa.'],
        fail: 'Les compagnons vous aident à reformuler. Aucun blocage.', success: 'Les trois accords résonnent. Le Lien naît lorsque personne n\'est contraint de renoncer à sa voix.',
      }),
      say([
        N('Le joueur peut créer un abri bref qui protège le groupe d\'une secousse. La capacité ne transfère pas leurs âmes et ne donne aucun pouvoir de persuasion automatique.'),
        L('nara', 'Je veux que tu restes. Je veux aussi qu\'Ilan ait un monde où vivre. Je ne vais pas prétendre que ces deux phrases sont faciles à garder ensemble.'),
        L('elyan', 'Je peux vous aider sans savoir encore lequel de mes futurs je supporte.'),
        L('soren', 'Oui. Mais pas en nous laissant croire que tu as déjà choisi.'),
        N('L\'Écoute révèle que l\'un des relais prépare une surcharge en direction d\'Orme. Ysane confirme que les réfugiés y sont regroupés. L\'annonce transforme la réflexion en action.'),
      ]),
    ],
    onComplete: [power('bond'), F('three_accords_linked'), save('auto')],
    next: 'C07S05',
  }),
  scene({
    id: 'C07S05', chapter: 7, title: 'La carte et les mains', loc: 'miral_gate', spawn: 'from_memory_garden', party: ['nara', 'soren', 'tessa'],
    actors: [at('ysane', 'ysane_spot', 'down'), at('arven', 'arven_spot', 'left'), at('ilan', 'ilan_spot', 'right')],
    steps: [
      say([N('Ilan apporte des nouvelles : les populations qui ont fui les puits occupés se sont réunies dans la vallée d\'Orme. Ravel promet des rations si elles se laissent compter et installer derrière une clôture. Ysane refuse d\'attendre la preuve d\'un massacre pour ouvrir des routes de départ.')]),
      choice('Le conseil répartit les tâches. Arven réclame d\'attaquer immédiatement :', [
        opt('Une approche silencieuse.', { set: setv('valley_approach', 'quiet') }),
        opt('Une diversion limitée.', { set: setv('valley_approach', 'diversion') }),
      ]),
      say([
        L('ysane', 'Nous ne sauverons personne avec une carte que seuls ceux de cette pièce savent lire.'),
        L('ilan', 'Je peux porter les signes aux familles.'),
        L('nara', 'Avec deux messagers et une route de retour. Pas seul pour prouver que tu as grandi.'),
        N('Le héros reçoit la carte d\'évacuation. Elle décrit des chemins et des rendez-vous, pas les noms de toutes les familles.'),
      ]),
    ],
    onComplete: [F('evacuation_map'), item('evacuation_map'), chapter(8), save('auto')],
    next: 'C08S01',
  }),
];
void accord; void hs; void inspect; void reach; void talk; void trust; void set;
