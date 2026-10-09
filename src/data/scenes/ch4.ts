// Chapitre 4 — Le jardin des voix (C04S01 à C04S05). Texte : bible §11.
import { L, N, F, accord, at, chapter, hs, inspect, item, journal, opt, power, puzzle, reach, say, scene, setv, talk, trust, save, choice } from './dsl';

export const CH4 = [
  scene({
    id: 'C04S01', chapter: 4, title: 'La cité ouverte', loc: 'miral_gate', spawn: 'from_river_bank', party: ['nara', 'soren', 'tessa'],
    actors: [at('ysane', 'ysane_spot', 'down'), at('representant', 'rep_spot', 'left'), at('arven', 'arven_spot', 'down'), at('stellaire', 'civil_spot', 'right')],
    hotspots: [hs('c04s01_table', 'table_conseil', 'table du conseil', ['Un conseil discute des accords d\'accueil. Les portes de Miral sont ouvertes à des commerçants veilleurs et à quelques civils stellaires.'])],
    steps: [
      say([N('Miral est bâtie autour d\'un jardin et de bassins reliés. Un conseil discute des accords d\'accueil.')]),
      talk('Présenter les témoignages à Ysane', 'ysane', [L('ysane', 'Je vous écoute avant de parler à la délégation. Que voulez-vous qu\'on retienne ?')], [
        opt('Insister sur Ilan.', { set: setv('c04_testimony', 'ilan') }),
        opt('Insister sur l\'eau.', { set: setv('c04_testimony', 'water') }),
        opt('Insister sur les ouvriers sauvés.', { set: setv('c04_testimony', 'workers') }),
      ]),
      say([
        N('Le compte rendu complet reste livré pour éviter qu\'un choix de formulation supprime une preuve essentielle.'),
        N('Ysane demande la suspension des pompes jusqu\'à expertise commune. Un représentant de Vaelor promet de transmettre, mais annonce qu\'un arrêt menace l\'habitat supérieur. Tessa explique qu\'il existe un régime réduit permettant de tenir plusieurs semaines.'),
        L('ysane', 'Nous proposons de vous accueillir. Vous nous demandez de disparaître pour rendre votre accueil plus commode.'),
        L('representant', 'Vous ne mesurez pas notre urgence.'),
        L('tessa', 'Je la mesure. J\'y ai une mère. Ne lui faites pas dire ce que vous voulez.'),
        N('La délégation part. Ysane autorise l\'accès aux archives et réclame des preuves vérifiables avant toute mobilisation. Arven juge cette prudence dangereuse.'),
      ]),
    ],
    onComplete: [F('ysane_met'), F('miral_access'), journal('p_ysane', 'Ysane', 'Reine médiatrice des Veilleurs. Arbitre les passages entre territoires ; ne possède pas la planète.', 'people'), journal('s_refusal', 'Refus de suspension', 'La délégation stellaire a refusé de suspendre les pompes.')],
    next: 'C04S02',
  }),
  scene({
    id: 'C04S02', chapter: 4, title: 'Les noms sur les bancs', loc: 'memory_garden', spawn: 'from_miral_gate', party: ['nara', 'soren', 'tessa'],
    actors: [at('meline', 'meline_spot', 'down'), at('habitant', 'habitant1', 'right')],
    hotspots: [
      hs('c04s02_berceuse', 'banc_berceuse', 'banc de la berceuse', ['Une berceuse. Elyan y reconnaît le palais.']),
      hs('c04s02_partage', 'banc_partage', 'banc du partage de l\'eau', ['Un rituel de partage d\'eau. Elyan ne le connaît pas.']),
      hs('c04s02_funerailles', 'banc_funerailles', 'banc des funérailles', ['Un chant de funérailles. Inconnu aussi.']),
    ],
    steps: [
      say([N('Le jardin conserve les souvenirs de la cité par des bancs, des plantes et des chants.'), L('meline', 'Un nom gravé ne possède pas une personne ; il laisse une place pour parler d\'elle. Déposez un objet ordinaire dans cette coupe, puis reprenez-le. La mémoire n\'est pas une taxe.')]),
      inspect('Examiner les trois usages de la mélodie', ['c04s02_berceuse', 'c04s02_partage', 'c04s02_funerailles'], 3),
      say([
        N('Soren remarque que son souvenir pourrait conserver un fragment déplacé de cette culture. Il évite d\'en déduire immédiatement une guerre ou un vol.'),
        L('meline', 'Une chanson peut devenir celle de plusieurs maisons. Le mal commence quand une maison interdit aux autres de se souvenir qu\'elles l\'ont chantée.'),
        L('elyan', 'Et si ceux qui l\'ont reçue ne savaient pas ?'),
        L('meline', 'Ils peuvent apprendre. Ce n\'est pas la même chose que l\'avoir prise.'),
      ]),
      choice('Nara l\'accompagne jusqu\'au banc vide de son père.', [
        opt('Rester en silence.', { set: setv('c04s02_nara', 'silence'), effects: [trust('nara', 1)], lines: [N('Nara choisit ce qu\'elle raconte. Sa mémoire ne devient pas un collectible forcé.')] }),
        opt('Lui demander un récit.', { set: setv('c04s02_nara', 'story'), effects: [trust('nara', 1)], lines: [N('Dans les deux cas, elle choisit ce qu\'elle raconte.')] }),
      ]),
    ],
    onComplete: [F('memory_culture_seen'), journal('p_meline', 'Méline', 'Jardinière de Miral. Pratique de la mémoire par les bancs, les plantes et les chants.', 'people')],
    next: 'C04S03',
  }),
  scene({
    id: 'C04S03', chapter: 4, title: 'Ce qu\'une image cache', loc: 'memory_shrine', spawn: 'from_memory_garden', party: ['nara', 'soren', 'tessa'],
    hotspots: [hs('c04s03_pont', 'surface_pont', 'image du pont construit', ['Un pont construit.']), hs('c04s03_dispute', 'surface_dispute', 'image de la dispute du partage', ['Une dispute lors du partage.']), hs('c04s03_crue', 'surface_crue', 'image de la crue', ['Une crue qui a obligé à déplacer la construction.'])],
    steps: [
      say([N('Le sanctuaire de mémoire présente trois images d\'un même événement : un pont construit, une dispute lors du partage, une crue qui a obligé à déplacer la construction.'), N('Soren croyait d\'abord que l\'une était la bonne archive et les autres des erreurs. L\'Écoute révèle qu\'elles appartiennent à des témoins différents.')]),
      inspect('Observer les trois surfaces', ['c04s03_pont', 'c04s03_dispute', 'c04s03_crue'], 3),
      puzzle({
        kind: 'set', title: 'Recomposer une trace', prompt: 'Placez les images côte à côte plutôt que d\'en supprimer deux. Choisir seulement la scène heureuse donne une image nette mais muette.',
        options: [{ id: 'pont', label: 'Le pont construit', clue: 'Une image heureuse, nette.' }, { id: 'dispute', label: 'La dispute du partage', clue: 'Une voix discordante.' }, { id: 'crue', label: 'La crue', clue: 'Ce qui a obligé à déplacer la construction.' }],
        solution: ['pont', 'dispute', 'crue'],
        hints: ['Rappel du but : recomposer la trace sans effacer les voix discordantes.', 'Contrainte : la cohérence n\'est pas l\'absence de désaccord.', 'Action : conservez les trois images, côte à côte.'],
        fail: 'L\'image est nette mais muette. Vous comprenez que quelque chose a été retiré.', success: 'Les trois images tiennent ensemble. Un chemin discret s\'ouvre entre les racines.',
      }),
      say([
        L('soren', 'J\'aurais retiré celle qui contredisait le plan.'),
        L('tessa', 'Chez nous, ils appellent ça corriger un relevé.'),
        L('elyan', 'Et si le plan était ce qui devait être corrigé ?'),
        N('L\'accord de mémoire se manifeste comme trois timbres simultanés qui ne fusionnent pas. Eïra montre une silhouette entrant dans un cercle lumineux. Elle porte le fragment du prince, mais l\'image est trop ancienne et trop large pour identifier Vaelor.'),
        L('nara', 'Les sanctuaires ne sont pas des fenêtres donnant toujours le même degré de détail.'),
      ]),
    ],
    onComplete: [power('veil'), accord('accord_memory'), item('accord_memory'), save('auto')],
    next: 'C04S04',
  }),
  scene({
    id: 'C04S04', chapter: 4, title: 'La Vivante', loc: 'memory_garden', spawn: 'well', party: ['nara', 'soren', 'tessa'],
    actors: [at('eira', 'eira_spot', 'down'), at('ysane', 'ysane_spot', 'left')],
    steps: [
      say([N('Dans l\'eau, plusieurs reflets apparaissent alors qu\'une seule personne se tient au bord. Une voix brève parle de « celui qui revient par une porte blessée ».')]),
      choice('Que demander à la présence ?', [
        opt('Son nom.', { set: setv('c04_eira_q', 'name'), lines: [L('eira', 'Les Veilleurs m\'appellent Eïra. Je ne suis pas un nom ; je suis ce que vos puits touchent.')] }),
        opt('La nature de la présence.', { set: setv('c04_eira_q', 'nature'), lines: [L('eira', 'Je suis ici. Je ressens les puits. Je ne possède pas la mémoire privée du prince.')] }),
        opt('La cause de sa douleur.', { set: setv('c04_eira_q', 'pain'), lines: [L('eira', 'Des prises. On me tire sans rien me demander.')] }),
      ]),
      say([
        L('eira', 'Je peux te montrer ce que mon eau a touché. Je ne peux pas te rendre ce que ta tête a perdu en te disant de me croire.'),
        L('elyan', 'Tu pourrais fermer les chemins à ceux qui te blessent.'),
        L('eira', 'Certains cherchent un refuge. D\'autres cherchent une prise. Les fermer tous ferait taire aussi ceux qui veulent apprendre.'),
        N('Nara est émue d\'entendre la présence aussi clairement. Tessa recule, car elle pensait que les Veilleurs personnifiaient simplement une énergie. Elle accepte que ses instruments ne décrivent pas toute la réalité.'),
        N('Un tremblement traverse le bassin. Eïra cesse de parler pour protéger un puits éloigné. Son silence donne une mesure de sa limite.'),
        L('ysane', 'Vaelor nous invite : le groupe doit visiter sa station d\'arrivée.'),
      ]),
    ],
    onComplete: [F('eira_contact'), journal('p_eira', 'Eïra', 'La Vivante. Une présence lumineuse entre des racines, sans corps à combattre. Elle ne peut pas tout faire.', 'people')],
    next: 'C04S05',
  }),
  scene({
    id: 'C04S05', chapter: 4, title: 'Des mots pour la route', loc: 'miral_gate', spawn: 'from_memory_garden', party: ['nara', 'soren', 'tessa'],
    actors: [at('ysane', 'ysane_spot', 'down'), at('arven', 'arven_spot', 'left')],
    hotspots: [hs('c04s05_tessa', 'tessa_zone', 'Tessa, au départ', ['Tessa : « L\'Aube Basse n\'est pas la station militaire de Vaelor. C\'est un habitat, avec des filtres qui lâchent et des voisins qui partagent. »', 'Ce nom servira au secours orbital et aux lettres de sa mère.'], { verb: 'Écouter', effects: [F('tessa_aube_basse_named')] })],
    steps: [
      say([N('Ysane remet une copie des accords et demande trois choses : reconnaître la présence d\'Eïra, rouvrir l\'accès aux puits, libérer les détenus sans preuve.'), N('Arven exige un ultimatum plus court. Nara répond qu\'il faut aussi un plan si la discussion échoue.')]),
      talk('Parler à Ysane', 'ysane', [L('ysane', 'Je ne vous demande pas de parler à notre place. Je vous demande de revenir avec des faits que nous puissions discuter.')], [
        opt('Pourquoi moi, alors que je ne me souviens de rien ?', { lines: [N('Ysane ne le choisit pas comme roi caché : elle sait que les verrous lui répondent et veut comprendre cette anomalie avec des témoins. Soren obtient l\'engagement que les observations seront rendues publiques.')] }),
        opt('Nous reviendrons avec des faits.', { lines: [N('Le groupe emporte une carte de routes secondaires, sans connaître encore les accès militaires du cœur.')] }),
      ]),
      say([L('arven', 'Et s\'ils ne vous laissent pas revenir ?'), L('nara', 'Alors nous aurons eu tort de prendre leurs portes pour leurs seules issues.')]),
    ],
    onComplete: [F('mandate_obtained'), chapter(5), save('auto')],
    next: 'C05S01',
  }),
];
void reach; void hs;
