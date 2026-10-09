// Chapitre 10 — Le cœur et la couronne (C10S01 à C10S05). Texte : bible §17.
import { L, N, F, at, combat, fx, hs, inspect, item, journal, opt, puzzle, reach, say, scene, setv, talk, trust, save, choice, set } from './dsl';
import type { Step } from '../../core/types';

const branch = (key: string, map: Record<string, string>): Step => ({ t: 'branch', key, map });
const ifs = (cond: import('../../core/types').Cond, then: Step[], otherwise?: Step[]): Step => ({ t: 'if', cond, then, otherwise });

export const CH10 = [
  scene({
    id: 'C10S01', chapter: 10, title: 'La descente sans ciel', loc: 'core_approach', spawn: 'from_valley_outlook', party: ['nara', 'soren', 'tessa'],
    hotspots: [
      hs('c10s01_appui_racine', 'appui_racine', 'appui de racine', ['Une racine retient une plate-forme.']),
      hs('c10s01_appui_canal', 'appui_canal', 'conduite à refroidir', ['Un canal refroidit une conduite.']),
      hs('c10s01_appui_memoire', 'appui_memoire', 'séquence d\'ouverture', ['Une mémoire révèle la séquence d\'ouverture.']),
    ],
    steps: [
      say([N('Le passage utilise les trois accords. Le joueur active les appuis un à un avec les pouvoirs déjà acquis. La descente n\'affiche pas un compte à rebours menaçant pendant les conversations.')]),
      ifs({ flags: { ilyra_support: 'accepted' } }, [
        combat('Interrompre l\'automate de garde (infiltration réussie grâce à Ilyra)', [{ type: 'automate', at: 'auto1' }]),
      ], [
        combat('Traverser le trajet manuel : deux automates', [{ type: 'automate', at: 'auto1' }, { type: 'automate', at: 'auto2' }]),
      ]),
      puzzle({
        kind: 'order', title: 'Les trois appuis', prompt: 'Activez les appuis un à un avec les accords : la racine, le canal, puis la mémoire.',
        options: [{ id: 'racine', label: 'Accord des racines : retenir la plate-forme' }, { id: 'canal', label: 'Accord des eaux : refroidir la conduite' }, { id: 'memoire', label: 'Accord de mémoire : séquence d\'ouverture' }],
        solution: ['racine', 'canal', 'memoire'],
        hints: ['Rappel du but : descendre vers le cœur.', 'Contrainte : la plate-forme doit tenir avant de refroidir, et la séquence vient en dernier.', 'Action : racine, canal, mémoire.'],
        fail: 'La plate-forme tangue ; vous remontez. Aucun risque : réessayez.', success: 'Les trois appuis sont actifs. Le passage s\'ouvre.',
      }),
      say([
        N('Elyan devient translucide au moment où il s\'éloigne de la conduite d\'ancrage. Nara lui tend la main et le ramène vers le groupe. Le Lien rétablit une protection provisoire, pas une origine nouvelle.'),
        L('nara', 'Tu es encore là. Regarde-moi.'),
        L('elyan', 'Je vous vois à travers ma main.'),
        L('tessa', 'Le Lien nous donne le passage. Il ne doit pas nous faire croire qu\'il donne la fin.'),
        N('Au dernier appui, une projection de Vaelor propose de suspendre les hostilités si le prince vient seul. Le groupe refuse l\'isolement jusqu\'au cœur.'),
      ]),
    ],
    onComplete: [F('core_descent_done')],
    next: 'C10S02',
  }),
  scene({
    id: 'C10S02', chapter: 10, title: 'Le verrou des héritiers', loc: 'core_gate', spawn: 'from_core_approach', party: ['nara', 'soren', 'tessa'],
    actors: [at('vaelor', 'vaelor_spot', 'down')],
    steps: [
      say([N('Vaelor se tient derrière une barrière énergétique. Il demande à Elyan de poser le fragment dans la commande de fermeture ; les compagnons pourraient ensuite repartir.'), L('tessa', 'Ce geste autoriserait immédiatement l\'impulsion contre les dernières poches de résistance. Ne le confonds pas avec une action technique neutre.')]),
      puzzle({
        kind: 'pick', title: 'Distinguer deux souvenirs', prompt: 'La Rémanence distingue le souvenir de l\'ouverture de celui de la capture. Quelle commande donne une session de décision ?',
        options: [{ id: 'fermeture', label: 'La commande de fermeture', clue: 'Autorise l\'impulsion : souvenir de capture.' }, { id: 'session', label: 'La commande de session', clue: 'Donne une session de décision : souvenir d\'ouverture.' }, { id: 'impulsion', label: 'La commande d\'impulsion', clue: 'Cible les poches de résistance.' }],
        solution: 'session',
        hints: ['Rappel du but : ouvrir le verrou sans livrer les accords.', 'Contrainte : deux commandes autorisent la capture ou l\'impulsion.', 'Action : choisissez la commande de session.'],
        fail: 'Le souvenir de capture vous refoule. Réessayez.', success: 'Le verrou répond aux trois accords associés.',
      }),
      combat('Un garde attaque malgré l\'ordre de Vaelor de conserver l\'héritier', [{ type: 'automate', at: 'auto1' }]),
      say([
        L('vaelor', 'Ce réseau est la raison pour laquelle tu respires.'),
        L('elyan', 'C\'est aussi la raison pour laquelle elle ne le peut plus.'),
        L('vaelor', 'Tu peux améliorer notre œuvre. Tu ne peux pas naître de rien.'),
        N('La barrière s\'ouvre. Vaelor conserve une console de commandement secondaire. Il ne peut plus forcer le choix tant que le prince tient la session principale.'),
      ]),
    ],
    onComplete: [F('core_session_open')],
    next: 'C10S03',
  }),
  scene({
    id: 'C10S03', chapter: 10, title: 'Le monde qui ne demande pas une couronne', loc: 'planet_heart', spawn: 'from_core_gate', party: ['nara', 'soren', 'tessa'],
    actors: [at('eira', 'eira_spot', 'down'), at('vaelor', 'vaelor_far', 'left')],
    hotspots: [
      hs('c10s03_rompre', 'cmd_rompre', 'commande : rompre la Couronne', ['Libère Eïra, arrête l\'extermination, rend l\'énergie à la planète. Supprime le futur dynastique d\'où vient Elyan : il disparaîtra après avoir quitté l\'ancre.'], { verb: 'Inspecter' }),
      hs('c10s03_fermer', 'cmd_fermer', 'commande : refermer la Couronne', ['Préserve Elyan et sa lignée et permet un retour. Maintient Eïra captive et livre les chemins de résistance : la suppression organisée des Veilleurs.'], { verb: 'Inspecter' }),
    ],
    steps: [
      say([N('Le cœur est un entrelacement de racines et d\'anneaux. Des impulsions de lumière butent sur les attaches. Eïra ne se présente pas sous une forme royale. Sa voix emprunte les timbres des puits déjà rencontrés.')]),
      choice('Poser une première question à Eïra :', [
        opt('Ce qu\'il adviendra de mes compagnons.', { set: setv('c10_q_compagnons', true), lines: [L('eira', 'La rupture permet l\'évacuation des présents et la fin de la capture. Elle ne garantit pas une vie sans conflits.')] }),
        opt('Ce qu\'il adviendra des réfugiés stellaires.', { set: setv('c10_q_refugies', true), lines: [L('eira', 'Le plan d\'accueil reste nécessaire. Je ne punis pas ceux qui n\'ont pas signé.')] }),
        opt('Ce qu\'il adviendra de moi.', { set: setv('c10_q_moi', true), lines: [L('eira', 'Tu disparaîtras après avoir quitté l\'ancre, dans le temps du dernier passage.')] }),
      ]),
      choice('Seconde question :', [
        opt('Ce qu\'il adviendra de mes compagnons.', { cond: { notFlags: ['c10_q_compagnons'] }, set: setv('c10_q_compagnons', true), lines: [L('eira', 'La rupture permet l\'évacuation des présents et la fin de la capture. Elle ne garantit pas une vie sans conflits.')] }),
        opt('Ce qu\'il adviendra des réfugiés stellaires.', { cond: { notFlags: ['c10_q_refugies'] }, set: setv('c10_q_refugies', true), lines: [L('eira', 'Le plan d\'accueil reste nécessaire. Je ne punis pas ceux qui n\'ont pas signé.')] }),
        opt('Ce qu\'il adviendra de moi.', { cond: { notFlags: ['c10_q_moi'] }, set: setv('c10_q_moi', true), lines: [L('eira', 'Tu disparaîtras après avoir quitté l\'ancre, dans le temps du dernier passage.')] }),
      ]),
      choice('Dernière question :', [
        opt('Ce qu\'il adviendra de mes compagnons.', { cond: { notFlags: ['c10_q_compagnons'] }, set: setv('c10_q_compagnons', true), lines: [L('eira', 'La rupture permet l\'évacuation des présents et la fin de la capture. Elle ne garantit pas une vie sans conflits.')] }),
        opt('Ce qu\'il adviendra des réfugiés stellaires.', { cond: { notFlags: ['c10_q_refugies'] }, set: setv('c10_q_refugies', true), lines: [L('eira', 'Le plan d\'accueil reste nécessaire. Je ne punis pas ceux qui n\'ont pas signé.')] }),
        opt('Ce qu\'il adviendra de moi.', { cond: { notFlags: ['c10_q_moi'] }, set: setv('c10_q_moi', true), lines: [L('eira', 'Tu disparaîtras après avoir quitté l\'ancre, dans le temps du dernier passage.')] }),
      ]),
      say([N('La fermeture préserve son futur et permet un retour, mais maintient la souffrance d\'Eïra et la suppression organisée des Veilleurs.'), L('elyan', 'Tu ne peux pas me dire que tout ira bien.'), L('eira', 'Non. Je peux te dire ce qui cessera de les tenir prisonniers.'), L('nara', 'Nous devrons encore vivre après. C\'est justement ce qu\'on veut pouvoir faire.')]),
      inspect('Inspecter les deux commandes, nommées par leur effet', ['c10s03_rompre', 'c10s03_fermer'], 2),
    ],
    onComplete: [F('final_costs_confirmed'), journal('s_final', 'Les deux gestes', 'Rompre la Couronne : libérer Eïra, protéger les communautés, accepter la disparition d\'Elyan. Refermer la Couronne : préserver Elyan et sa lignée, livrer les chemins de résistance, maintenir Eïra captive.')],
    next: 'C10S04',
  }),
  scene({
    id: 'C10S04', chapter: 10, title: 'Les choses que l\'on rend', loc: 'planet_heart', spawn: 'center', party: ['nara', 'soren', 'tessa'],
    steps: [
      say([N('Elyan rend le carnet à Soren.')]),
      choice('Le héros peut y ajouter une phrase :', [
        opt('Une reconnaissance envers mes amis.', { set: setv('book_phrase', 'thanks') }),
        opt('Un aveu de peur.', { set: setv('book_phrase', 'fear') }),
        opt('Raconter le monde plutôt que ma seule personne.', { set: setv('book_phrase', 'world') }),
      ]),
      say([L('soren', 'Tu peux changer d\'avis jusqu\'au geste. Après, je devrai écrire ce que tu auras fait.'), L('elyan', 'Pas ce que j\'aurais voulu faire ?'), L('soren', 'Aussi. Mais pas à la place.')]),
      ifs({ flags: { ribbon_state: 'kept' } }, [
        choice('Le ruban de Mira :', [opt('Le confier à Nara.', { set: setv('ribbon_state', 'entrusted') }), opt('Le conserver.', { set: setv('ribbon_state', 'kept') })]),
      ]),
      choice('La cordelette :', [opt('La nouer à une racine du cœur.', { set: setv('thread_state', 'knotted') }), opt('La rendre à l\'éclaireuse.', { set: setv('thread_state', 'returned') })]),
      say([N('Tessa reprend son outil pour préparer l\'ouverture des sorties. Ces gestes restent possibles pour un héros qui choisira ensuite la trahison ; leur sens deviendra alors douloureux plutôt qu\'invalide.')]),
      ifs({ flags: { nara_relationship: 'romance' } }, [
        say([L('nara', 'Je voulais une vie avec toi. Je refuse de l\'obtenir au prix du silence des autres.')]),
      ], [
        say([L('nara', 'Je pensais au chemin qu\'on n\'aura peut-être pas le temps de parcourir.')]),
      ]),
    ],
    onComplete: [F('farewell_objects_resolved')],
    next: 'C10S05',
  }),
  scene({
    id: 'C10S05', chapter: 10, title: 'Deux gestes', loc: 'planet_heart', spawn: 'center', party: ['nara', 'soren', 'tessa'],
    actors: [at('vaelor', 'vaelor_far', 'left'), at('eira', 'eira_spot', 'down')],
    steps: [
      say([N('Le joueur voit deux actions formulées sans ambiguïté. Les scènes précédentes restent terminées. La sauvegarde de retour créée au seuil permet d\'explorer une autre fin plus tard.')]),
      { t: 'finalChoice' },
      ifs({ flags: { final_route: 'A' } }, [
        say([N('Elyan place les accords dans les ouvertures naturelles et retire le sceau de capture.'), L('nara', 'Alors on sort ensemble jusqu\'où on peut.'), L('elyan', 'Je ne veux plus appeler une prison mon commencement.')]),
      ], [
        say([N('Il utilise sa signature pour aligner les accords dans les anneaux artificiels et transmet la carte des accès.'), L('nara', 'Tu nous as demandé de te croire en sachant où nous menions les autres.'), L('elyan', 'Je ne peux pas choisir de ne jamais avoir vécu.')]),
      ]),
      branch('final_route', { A: 'A01', B: 'B01' }),
    ],
    onComplete: [save('auto')],
    next: null,
  }),
];
void fx; void item; void reach; void talk; void trust; void set; void hs;
