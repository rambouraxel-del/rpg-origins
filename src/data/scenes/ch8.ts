// Chapitre 8 — La vallée des absents (C08S01 à C08S05). Texte : bible §15.
import { L, N, F, at, chapter, combat, fx, guide, hs, inspect, item, journal, opt, puzzle, reach, say, scene, setv, talk, trust, save, choice } from './dsl';

export const CH8 = [
  scene({
    id: 'C08S01', chapter: 8, title: 'Le camp des numéros', loc: 'valley_camp', spawn: 'from_miral_gate', party: ['nara', 'soren', 'tessa'],
    actors: [at('refugiee', 'refugiee_spot', 'down'), at('soldat', 'garde_spot', 'left'), at('ravel', 'ravel_far', 'down'), at('arven', 'arven_spot', 'right')],
    hotspots: [
      hs('c08s01_groupe1', 'groupe_file', 'famille dans la file de distribution', ['Une femme refuse de quitter la file de distribution parce que son compagnon a été conduit ailleurs. Un garde répète que « l\'unité manquante » sera transférée plus tard.'], { verb: 'Rassurer' }),
      hs('c08s01_groupe2', 'groupe_tentes', 'familles sous les tentes', ['Les familles portent des bracelets de comptage ; leurs noms ne figurent pas sur les panneaux.'], { verb: 'Rassurer' }),
      hs('c08s01_groupe3', 'groupe_cloture', 'groupe près de la clôture', ['Un petit groupe, des voix, quelques silhouettes qui suggèrent le reste du camp.'], { verb: 'Rassurer' }),
      hs('c08s01_panneau', 'panneau', 'panneau reconnaissant l\'accès royal', ['Elyan trouve un panneau qui reconnaît son accès royal. La machine lui donne une vue du relais : le camp dépend d\'une vanne centrale que Ravel peut fermer.']),
    ],
    steps: [
      say([N('La vallée est devenue un camp. Selon le plan choisi, Arven provoque une dispute contrôlée au poste extérieur, ou Nara indique une traversée discrète.')]),
      inspect('Entrer en contact avec trois groupes de réfugiés', ['c08s01_groupe1', 'c08s01_groupe2', 'c08s01_groupe3'], 3),
      say([
        L('soren', 'Ils ont encore les noms dans leurs dossiers. Ils choisissent de ne plus les utiliser devant vous.'),
        L('refugiee', 'Alors écris le mien. Pas pour me sauver. Pour qu\'il reste quelque part si je ne reviens pas.'),
        N('Soren l\'inscrit et demande son consentement pour recueillir le témoignage.'),
      ]),
      inspect('Examiner le panneau d\'accès', ['c08s01_panneau'], 1),
    ],
    onComplete: [F('valley_contacts'), journal('s_valley', 'La vallée d\'Orme', 'Un camp de comptage. Une vanne centrale que Ravel peut fermer. Un panneau reconnaît l\'accès royal d\'Elyan.')],
    next: 'C08S02',
  }),
  scene({
    id: 'C08S02', chapter: 8, title: 'L\'ordre sans métaphore', loc: 'valley_relay', spawn: 'from_valley_camp', party: ['soren', 'tessa'],
    hotspots: [
      hs('c08s02_signature', 'signature', 'signature de Vaelor', ['Soren vérifie la signature par un registre déjà connu : authentique.']),
      hs('c08s02_calendrier', 'calendrier', 'calendrier d\'exécution', ['Tessa compare le calendrier au cycle de la pompe. L\'exécution est liée à la fermeture du cœur, ce qui laisse une fenêtre d\'action.']),
      hs('c08s02_reglages', 'reglages', 'réglages de saturation', ['Les réglages de saturation du camp. Pour qu\'on ne puisse pas appeler ça un ordre mal compris.']),
    ],
    steps: [
      say([N('Le relais contient un ordre signé par Vaelor et confirmé par Ravel. Il prévoit de couper les passages, de saturer le camp avec une impulsion du réseau et de détruire les archives après inventaire. Le texte nomme explicitement l\'élimination des communautés qui ne se soumettent pas.')]),
      inspect('Lire et authentifier l\'ordre', ['c08s02_signature', 'c08s02_calendrier', 'c08s02_reglages'], 3),
      say([L('elyan', 'Ils écrivent « réduire les foyers ». Ils ont ajouté le nombre de personnes à côté.'), L('soren', 'Ne garde pas seulement la phrase qu\'ils pourraient défendre. Garde la page entière.'), L('tessa', 'Et les réglages. Pour qu\'on ne puisse pas appeler ça un ordre mal compris.')]),
      fx('shake', 700),
      say([N('Elyan utilise son accès pour copier le document, puis le Lien protège le groupe d\'une impulsion de test. Les réfugiés ne sont pas frappés pendant cette scène ; le test vise un circuit extérieur et montre la puissance prévue.'), N('Ravel reçoit une alerte d\'accès et commence à rejoindre le relais.')]),
    ],
    onComplete: [F('massacre_orders'), F('orders_authenticated'), item('massacre_orders'), journal('s_orders', 'L\'ordre authentifié', 'Une preuve utilisable devant Ilyra et les civils stellaires : signée par Vaelor, confirmée par Ravel.'), save('auto')],
    next: 'C08S03',
  }),
  scene({
    id: 'C08S03', chapter: 8, title: 'Sortir avec les noms', loc: 'valley_bridge', spawn: 'from_valley_camp', party: ['nara', 'soren', 'tessa'],
    actors: [at('arven', 'arven_spot', 'right'), at('ilan', 'ilan_spot', 'left')],
    steps: [
      say([N('L\'évacuation combine les pouvoirs appris. Ces actions sont effectuées en séquence ; le joueur n\'a pas à gérer trois personnages simultanément. Chaque groupe atteint un repère sûr avant que le suivant se mette en mouvement.')]),
      puzzle({
        kind: 'set', title: 'Ouvrir deux chemins', prompt: 'Le Tissage renforce le pont latéral, l\'Accord des eaux abaisse un passage inondé et le Voile masque un petit groupe auprès des capteurs. Lesquels employer ?',
        options: [{ id: 'tissage', label: 'Tissage : renforcer le pont latéral', clue: 'Le pont latéral peut tenir.' }, { id: 'eaux', label: 'Accord des eaux : abaisser le passage inondé', clue: 'Un second chemin devient praticable.' }, { id: 'voile', label: 'Voile : masquer un petit groupe', clue: 'Les capteurs ne voient plus le groupe.' }, { id: 'detruire', label: 'Détruire le pont principal', clue: 'Arven le propose ; une famille manque encore.' }],
        solution: ['tissage', 'eaux', 'voile'],
        hints: ['Rappel du but : ouvrir deux chemins et protéger le passage.', 'Contrainte : détruire le pont isolerait la famille qui manque.', 'Action : Tissage, Accord des eaux et Voile.'],
        fail: 'Un des chemins reste fermé. Réessayez.', success: 'Deux chemins sont ouverts. Les groupes peuvent se mettre en mouvement.',
      }),
      choice('Deux groupes secondaires attendent :', [
        opt('Les enfants et leurs parents d\'abord.', { set: setv('c08_order', 'children'), lines: [N('Un remerciement différent, sans condamner personne.')] }),
        opt('Les personnes âgées d\'abord.', { set: setv('c08_order', 'elders'), lines: [N('Un remerciement différent, sans condamner personne.')] }),
      ]),
      guide('Mener les groupes au repère sûr', [
        { id: 'g1', label: 'Premier groupe', from: 'g1_from', to: 'safe' },
        { id: 'g2', label: 'Second groupe', from: 'g2_from', to: 'safe_b' },
      ]),
      say([L('arven', 'Si nous attendons tout le monde, ils nous reprendront tous.'), L('ilan', '« Tout le monde », c\'est encore quelqu\'un que tu connais quand tu le regardes.'), L('elyan', 'Garde le pont. Je vais regarder.')]),
      reach('Aller chercher la dernière famille par la voie de maintenance', 'famille_zone'),
      say([N('Une dernière famille arrive avec un homme incapable de marcher vite. Tessa apporte une civière mécanique. Le mélange des savoirs devient visible dans un geste pratique. Soren coche des noms et laisse de l\'espace pour les absents, plutôt que déclarer la communauté complète à sa place.')]),
    ],
    onComplete: [F('valley_evacuated')],
    next: 'C08S04',
  }),
  scene({
    id: 'C08S04', chapter: 8, title: 'Ravel au milieu du pont', loc: 'valley_bridge', spawn: 'ravel_arrive', party: ['nara', 'soren', 'tessa'],
    actors: [at('ravel', 'ravel_spot', 'down')],
    hotspots: [hs('c08s04_appui', 'appui_pont', 'appui du pont (racine)', ['Un appui de racine : le Tissage peut y retenir un adversaire.'])],
    steps: [
      say([N('Ravel arrive et reconnaît Elyan comme héritier. Il lui ordonne de se placer derrière les gardes : il prétend protéger le prince d\'un groupe qui exploite sa confusion.')]),
      choice('Répondre à Ravel :', [
        opt('Montrer les ordres.', { set: setv('c08_ravel_talk', 'orders'), lines: [L('ravel', 'Je suis le plan approuvé. Les archives seront discutées après la prise du cœur.')] }),
        opt('Rappeler les ouvriers de la rivière.', { set: setv('c08_ravel_talk', 'workers'), lines: [L('ravel', 'Je suis le plan approuvé.')] }),
        opt('Demander de laisser partir les familles.', { set: setv('c08_ravel_talk', 'release'), lines: [L('ravel', 'Je suis le plan approuvé.')] }),
      ]),
      combat('Neutraliser Ravel et ses automates', [{ type: 'automate', at: 'auto1' }, { type: 'automate', at: 'auto2' }, { type: 'soldat', at: 'ravel_spot' }]),
      say([
        L('ravel', 'Vous êtes l\'avenir de notre maison.'),
        L('elyan', 'Vous parlez de mon avenir devant des gens à qui vous avez retiré le leur.'),
        N('Elyan n\'exécute pas l\'officier après la victoire. Le journal distingue neutraliser, capturer et tuer. Tessa retire la commande du pont. Ravel reste sous garde d\'Arven et de deux Veilleurs, avec instruction d\'être conduit au conseil.'),
      ]),
    ],
    onComplete: [F('ravel_defeated'), F('bridge_control_disabled'), journal('s_ravel', 'Ravel capturé', 'Neutralisé, pas tué. Il retrouvera plus tard sa liberté sous l\'autorité de Vaelor avant la route B ; en route A, son arrestation devient définitive après la défaite du réseau.')],
    next: 'C08S05',
  }),
  scene({
    id: 'C08S05', chapter: 8, title: 'Ce que l\'on peut encore choisir', loc: 'valley_outlook', spawn: 'from_valley_bridge', party: ['nara', 'soren', 'tessa'],
    tint: { color: 0x101a40, alpha: 0.32 },
    steps: [
      say([N('Depuis un promontoire, le groupe regarde les lanternes d\'évacuation disparaître dans les arbres. Elyan est épuisé ; une partie de sa main devient translucide puis retrouve sa couleur.'), L('tessa', 'Les divergences s\'accumulent. Ce signe n\'a rien à voir avec une quête manquée : il appartient à la progression obligatoire.')]),
      choice('Nara demande s\'il veut s\'arrêter :', [
        opt('Je cherche encore une autre issue.', { set: setv('c08_intent', 'other') }),
        opt('Je compte libérer Eïra.', { set: setv('c08_intent', 'free') }),
        opt('Je ne veux pas mourir.', { set: setv('c08_intent', 'fear') }),
      ]),
      say([
        N('Les compagnons ne lui demandent pas une promesse définitive cette nuit-là. Ils exigent cependant qu\'il ne livre pas leurs chemins.'),
        L('tessa', 'Tu peux avoir peur. Je ne sais pas qui a commencé à dire que la peur rendait les gens indignes d\'être aidés.'),
        L('soren', 'Nous avons une chose à décider maintenant : donner ces pages au conseil ou les laisser à ceux qui les ont écrites.'),
        L('elyan', 'Donnons-les.'),
        N('Le messager annonce qu\'Ilyra demande à voir les preuves. La station peut offrir un accès moins dangereux au cœur. Le groupe rentre avant la dernière marche, avec le droit de terminer les histoires locales.'),
      ]),
    ],
    onComplete: [F('valley_proofs_delivered'), chapter(9), save('auto')],
    next: 'C09S01',
  }),
];
void hs; void trust; void talk; void item;
