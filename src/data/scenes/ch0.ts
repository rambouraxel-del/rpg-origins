// Prologue — Le ciel tombe (P01 à P05). Texte : bible §7.
import { L, N, F, at, chapter, fx, guide, hs, inspect, item, journal, move, opt, reach, say, scene, set, setv, talk } from './dsl';

export const PROLOGUE = [
  scene({
    id: 'P01', chapter: 0, title: 'Le jardin sous le verre', loc: 'palace_garden', spawn: 'start',
    actors: [at('mira', 'mira_spot', 'down'), at('jardinier', 'jardinier_spot', 'right'), at('intendant', 'intendant_spot', 'left'), at('courtisan', 'courtisan_spot', 'down')],
    hotspots: [
      hs('p01_plant', 'plant', 'plante desséchée', ['Une plante s\'est desséchée à côté d\'une conduite parfaitement intacte.', 'Le confort du jardin dépend de quelque chose que ses habitants ne voient plus.']),
      hs('p01_conduit', 'conduit', 'conduite lumineuse', ['Une nervure de lumière chauffe l\'allée. Elle vibre sans pause.']),
    ],
    ambient: [
      { npc: 'jardinier', lines: [L('jardinier', 'Il faudrait réduire le débit général, Altesse. Cette plante n\'est que la première.'), L('intendant', 'La cérémonie est demain. On ne coupe rien avant.')], effects: [F('p01_listened')] },
      { npc: 'courtisan', lines: [L('courtisan', 'Quelle splendeur, ces jardins. Il paraît que la province est de mauvaise humeur — rien de grave.')] },
    ],
    steps: [
      say([N('Asterion, an 780. Sous la coupole de cristal, des nervures lumineuses chauffent le jardin du palais.'), N('Vous pouvez écouter le jardinier, ou rejoindre directement la reine près du bassin.')]),
      reach('Rejoindre Mira près du bassin', 'mira_zone'),
      say([N('Mira fredonne une mélodie. Elle demande à son fils s\'il a lu les doléances d\'une province où les puits cessent de répondre.')]),
      talk('Parler à Mira', 'mira', [L('mira', 'As-tu lu les doléances de la province ? Les puits n\'y répondent plus.')], [
        opt('Je les ai survolées.', { lines: [L('mira', 'Survolées. Alors tu sais qu\'un nom de plus ne change rien tant que personne ne vient les écouter.')] }),
        opt('Je compte intervenir.', { lines: [L('mira', 'Alors fais-le avant qu\'on te dise que c\'est trop tard.')] }),
        opt('Je ne sais pas comment aider.', { lines: [L('mira', 'C\'est un début honnête. Il ne reste qu\'à ne pas s\'en contenter.')] }),
      ]),
      say([
        N('Elle ne lui livre pas un sermon : elle lui rappelle qu\'une décision devient réelle pour quelqu\'un qui n\'est pas dans la pièce.'),
        L('mira', 'Ton père peut supporter qu\'on lui dise non. Ce qui lui manque, c\'est quelqu\'un qui le dise avant que tout le monde se taise.'),
        L('elyan', 'Et si je me trompe ?'),
        L('mira', 'Alors tu reviendras écouter. Une couronne ne dispense pas de revenir.'),
      ]),
      fx('shake', 700),
      say([N('Un grondement fait trembler l\'eau. Les courtisans parlent d\'un orage.'), N('Le jardinier regarde la conduite plutôt que le ciel.')]),
    ],
    onComplete: [F('p01_done'), journal('mem_garden', 'Verre et jardin', 'Un jardin chauffé par des nervures lumineuses. Une plante desséchée à côté d\'une conduite intacte. La voix d\'une mère : « Une couronne ne dispense pas de revenir. »', 'memory')],
    next: 'P02',
  }),
  scene({
    id: 'P02', chapter: 0, title: 'Les doléances d\'Oren', loc: 'palace_hall', spawn: 'start',
    actors: [at('oren', 'oren_spot', 'right'), at('adrien', 'adrien_spot', 'left')],
    hotspots: [
      hs('p02_map', 'map_table', 'carte du cercle des puits', ['Les régions taries forment un cercle autour de la capitale.', 'Une carte beaucoup plus vieille montre le sceau du palais au centre d\'un réseau dont les racines ne sont pas représentées.']),
      hs('p02_window', 'window', 'hautes fenêtres', ['La fête se prépare. Personne ne regarde les relevés.']),
    ],
    steps: [
      say([N('Dans la salle des cartes, Oren a posé des relevés que personne ne veut commenter pendant la fête.')]),
      reach('Remettre le dossier des puits à Oren', 'oren_zone'),
      say([
        L('adrien', 'Vous me demandez d\'éteindre la capitale sur une hypothèse.'),
        L('oren', 'Nous avons appris à compter ce qui entre dans nos murs. Nous n\'avons jamais appris à compter ce qui manque dehors.'),
        L('oren', 'Je vous demande d\'ouvrir une issue avant de découvrir qu\'il n\'y en a plus.'),
      ]),
      talk('Parler à Oren', 'oren', [L('oren', 'Les régions taries forment un cercle autour de la capitale. Une machine ancienne peut continuer longtemps après que sa dette est devenue insupportable.')], [
        opt('Interroger le cercle des puits.', { lines: [L('oren', 'Regardez : le sceau du palais, au centre d\'un réseau. Les racines n\'y sont pas dessinées. Pas encore la peine de demander pourquoi.')] }),
        opt('Demander si la ville est menacée.', { lines: [L('oren', 'Pas ce soir, je l\'espère. Mais je préfère préparer des passages.')] }),
      ]),
      fx('shake', 600),
      say([N('Une cloche sonne trois fois, trop vite. Le plafond se colore comme si une aube rouge traversait la pierre.'), L('adrien', 'Cherche ta mère. Oren, préparez les passages.')]),
    ],
    onComplete: [F('oren_warning_seen')],
    next: 'P03',
  }),
  scene({
    id: 'P03', chapter: 0, title: 'La brèche au-dessus des toits', loc: 'palace_hall', spawn: 'start',
    tint: { color: 0xc03020, alpha: 0.22 },
    actors: [at('garde', 'garde_spot', 'right')],
    steps: [
      say([N('Le ciel s\'ouvre en anneaux blancs. Des fragments tombent au-delà des murailles. Un automate portant le signe royal frappe une porte qu\'il devrait garder.'), N('Chaque groupe attend dans une zone sûre dès qu\'il est guidé : aucun civil ne souffre d\'un temps de lecture trop long.')]),
      guide('Guider les trois groupes jusqu\'à la sortie sûre', [
        { id: 'poutre', label: 'Garde bloqué sous une poutre', from: 'group_a', to: 'safe' },
        { id: 'mere', label: 'Une femme et son enfant', from: 'group_b', to: 'safe_b' },
        { id: 'lateral', label: 'Civils au passage secondaire', from: 'group_c', to: 'safe_c' },
      ]),
      say([
        L('garde', 'Ils portent notre marque. Pourquoi ils frappent nos portes ?'),
        L('elyan', 'On comprendra après. Faites-les passer derrière nous.'),
        N('Une conduite éclate quand le dernier groupe avance. La lumière se change en cri sourd. Une silhouette de racines apparaît une fraction de seconde dans le verre brisé, sans explication.'),
      ]),
      reach('Ramasser le fragment de son sceau tombé au sol', 'shard_spot', [item('royal_shard')]),
      say([N('Elyan ramasse machinalement un fragment de son sceau. Le passage vers Oren s\'ouvre.')]),
    ],
    onComplete: [F('p03_done')],
    next: 'P04',
  }),
  scene({
    id: 'P04', chapter: 0, title: 'Les portes d\'évacuation', loc: 'palace_portal', spawn: 'start',
    actors: [at('oren', 'oren_spot', 'down'), at('mira', 'mira_spot', 'down'), at('civil', 'civ1', 'right'), at('civil', 'civ2', 'left')],
    hotspots: [
      hs('p04_chair', 'civ_chair', 'une chaise refusée', ['Un civil refuse d\'abandonner sa chaise. Oren n\'a pas le temps de discuter.']),
      hs('p04_ring', 'ring', 'anneau ancien', ['Les anciennes coordonnées ne tiennent plus. L\'anneau cherche une origine.']),
    ],
    steps: [
      say([N('Oren a réactivé un portail de fondation. Des civils traversent les ouvertures locales, emportant des sacs, des enfants, parfois seulement une chaise.')]),
      reach('Stabiliser les sorties avec Oren', 'oren_zone'),
      say([L('oren', 'Ce passage cherche une origine. Les anciennes coordonnées ne tiennent plus.'), L('elyan', 'Une origine de quoi ?'), L('oren', 'De la blessure.')]),
      talk('Retrouver Mira', 'mira', [N('Mira aide les civils au lieu de traverser la première. Elle détache un ruban de son poignet.'), L('mira', 'Prends ça.')], [
        opt('Mère, partez !', { lines: [L('mira', 'Ne reste pas pour me prouver que tu es courageux. Reste seulement s\'il y a quelqu\'un à aider.')] }),
        opt('Je vous rejoins, je le promets.', { lines: [L('mira', 'Ne reste pas pour me prouver que tu es courageux. Reste seulement s\'il y a quelqu\'un à aider.')] }),
      ], undefined, [item('ribbon')]),
      say([N('Elle passe lorsque les derniers civils arrivent, puis le lien visuel s\'éteint. Son destin immédiat reste inconnu d\'Elyan.'), N('L\'automate arrive derrière une vitre fissurée. Le mage ferme les autres portes pour préserver l\'une d\'elles. L\'anneau montre soudain une forêt au lieu du sanctuaire prévu.')]),
    ],
    onComplete: [F('mira_departed')],
    next: 'P05',
  }),
  scene({
    id: 'P05', chapter: 0, title: 'Le prince tombe', loc: 'palace_portal', spawn: 'start',
    tint: { color: 0xc03020, alpha: 0.2 },
    actors: [at('oren', 'oren_spot', 'down'), at('automate', 'auto_spot', 'down')],
    steps: [
      say([N('L\'automate rompt la vitre.')]),
      reach('Atteindre le mage', 'oren_zone'),
      fx('flash', 700), fx('shake', 600),
      say([N('Une explosion projette Elyan contre une colonne. Un voile blanc, une perte de son, un bourdonnement.'), L('oren', 'Écoute avant d\'ouvrir. Tu m\'entends ? Avant d\'ouvrir.'), L('elyan', 'Ma mère…'), L('oren', 'Je ne peux pas promettre ce que je ne sais pas. Mais ici, je ne peux plus te garder.')]),
      say([N('Une lame mécanique traverse la silhouette du mage hors du centre du cadre. Oren pousse Elyan. La forêt remplit l\'anneau ; le prince tombe dans une eau peu profonde.'), N('Des voix, la berceuse, le grondement et une phrase d\'Adrien se mêlent, puis cessent.')]),
      fx('fade-out', 900),
      fx('title', 3200, 'RPG ORIGINS'),
      move('forest_arrival', 'wake'),
    ],
    onComplete: [F('amnesia'), chapter(1), journal('mem_portal', 'Une porte, une forêt', 'Un mage qui criait « Avant d\'ouvrir ». Une main sur un ruban. Le reste est blanc.', 'memory')],
    next: 'C01S01',
  }),
];
void set; void inspect; void setv;
