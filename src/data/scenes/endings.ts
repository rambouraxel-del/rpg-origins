// Fin A — Un monde qui respire (A01–A03) et Fin B — L'héritier des étoiles (B01–B03). Texte : bible §18 et §19.
import { L, N, F, at, combat, fx, hs, inspect, journal, move, opt, puzzle, reach, say, scene, setv, trust, choice } from './dsl';
import type { Step } from '../../core/types';

const ifs = (cond: import('../../core/types').Cond, then: Step[], otherwise?: Step[]): Step => ({ t: 'if', cond, then, otherwise });

export const ENDINGS = [
  // ------------------------------------------------------------------ Fin A
  scene({
    id: 'A01', chapter: 10, title: 'Défaire l\'anneau', loc: 'planet_heart', spawn: 'center', party: ['nara', 'soren', 'tessa'],
    tint: { color: 0x70f0d0, alpha: 0.12 },
    actors: [at('vaelor', 'vaelor_spot', 'down'), at('eira', 'eira_spot', 'down')],
    steps: [
      say([N('Les racines se déploient dans les intervalles que les accords ont ouverts. Vaelor tente de transférer la capture vers sa console secondaire. Le dernier affrontement consiste à couper trois liaisons, en protégeant les compagnons pendant qu\'ils ouvrent les issues. Il ne faut pas frapper Eïra.')]),
      combat('Neutraliser les automates qui protègent les liaisons', [{ type: 'automate', at: 'auto1' }, { type: 'pompage', at: 'pompe1' }, { type: 'sentinelle', at: 'sent1' }]),
      puzzle({
        kind: 'order', title: 'Couper les trois liaisons', prompt: 'Tessa dérive la pression, Soren conserve les preuves, Nara garde le pont. Utilisez l\'Onde sur les commandes repérées, puis l\'Accord des eaux sur la conduite finale.',
        options: [{ id: 'onde1', label: 'Onde : première commande' }, { id: 'onde2', label: 'Onde : deuxième commande' }, { id: 'eaux', label: 'Accord des eaux : conduite finale' }],
        solution: ['onde1', 'onde2', 'eaux'],
        hints: ['Rappel du but : couper trois liaisons.', 'Contrainte : la conduite finale se coupe en dernier.', 'Action : Onde, Onde, puis Accord des eaux.'],
        fail: 'La liaison tient. Le Lien protège un espace commun ; recommencez.', success: 'Les trois liaisons sont coupées. Vaelor tombe sur une plateforme basse et perd son accès. Il reste vivant.',
      }),
      say([
        L('vaelor', 'Tu préfères une tombe qui n\'aura même pas ton nom.'),
        L('elyan', 'Ils savent mon nom. Et ce n\'est pas ce que je suis venu sauver.'),
        L('vaelor', 'Sans nous, tu n\'es rien.'),
        L('elyan', 'Sans votre œuvre, je ne nais pas. Ce n\'est pas la même chose.'),
        N('Les puits reprennent leur réponse. À l\'extérieur, les équipes d\'Ysane désarment les relais, arrêtent Ravel et sécurisent les départs de la flotte. Le plan d\'accueil s\'active.'),
        N('Eïra ne remercie pas Elyan en lui donnant une exception. Elle ouvre le passage qu\'elle avait promis. Un bref arrêt de jeu permet de voir le cœur respirer, puis le groupe remonte.'),
      ]),
    ],
    onComplete: [F('crown_broken'), F('eira_free'), F('vaelor_captured'), F('companions_alive')],
    next: 'A02',
  }),
  scene({
    id: 'A02', chapter: 10, title: 'Jusqu\'à l\'arbre', loc: 'forest_arrival', spawn: 'from_forest_crossing', party: ['nara', 'soren', 'tessa'],
    tint: { color: 0xfff0c0, alpha: 0.1 },
    hotspots: [
      hs('a02_pool', 'pool', 'le bassin de l\'arrivée', ['Le même bassin. Il redevient simplement un bassin.'], { verb: 'Regarder' }),
      hs('a02_tree', 'arbre', 'l\'arbre repère', ['Un arbre. C\'est ici que vous choisirez de vous asseoir.'], { verb: 'Regarder' }),
      hs('a02_bird', 'oiseau', 'l\'oiseau clair', ['Un oiseau clair. Il n\'est pas l\'âme d\'Elyan.'], { verb: 'Regarder' }),
    ],
    steps: [
      say([N('Le groupe atteint le bassin. Elyan marche encore, mais son contour se dissout avec les particules du puits. Vous conservez quelques déplacements et trois interactions finales. Les compagnons attendent sans que la disparition avance pendant la lecture.')]),
      inspect('Vos dernières interactions', ['a02_pool', 'a02_tree', 'a02_bird'], 3),
      reach('S\'asseoir sous l\'arbre : le temps dramatique commence alors', 'arbre'),
      say([N('Nara veut le tenir. Sa main traverse un instant le manteau, puis elle reprend contact grâce au dernier Lien.')]),
      ifs({ flags: { nara_relationship: 'romance' } }, [say([L('nara', 'Tu te souviens de la branche que je t\'ai tendue ? C\'est tout ce que je voulais te dire.')])], [say([L('nara', 'Je ne t\'ai jamais demandé d\'être parfait pour mériter cette place.')])]),
      say([L('nara', 'Je me souviendrai de ce que tu faisais avant de savoir que tu étais prince.'), L('elyan', 'Souviens-toi aussi de ce que j\'ai fait après.')]),
      say([N('Soren montre le titre choisi pour son témoignage. Tessa affirme qu\'elle dira aux gens de la flotte qui a permis leur accueil.')]),
      choice('Une dernière phrase :', [opt('À chacun, une dernière phrase.', { set: setv('a02_last', 'words') }), opt('Choisir le silence.', { set: setv('a02_last', 'silence') })]),
      say([
        L('eira', 'Je ne peux pas te garder vivant sans garder la blessure. Je peux laisser entendre que tu as été ici.'),
        L('elyan', 'Alors laisse-les parler à ma place quand ils le voudront. Pas tout le temps.'),
        N('Le corps disparaît, sans chute violente ni visage transformé en trophée spirituel. Le bassin redevient simplement un bassin. Nara reste assise ; les autres ne la pressent pas.'),
      ]),
      fx('fade-out', 1200),
    ],
    onComplete: [F('elyan_status', 'erased'), F('arrival_tree_memorial')],
    next: 'A03',
  }),
  scene({
    id: 'A03', chapter: 10, title: 'Une année de vie', loc: 'lisiere_square', spawn: 'default', party: ['nara', 'soren', 'tessa'],
    steps: [
      fx('title', 2600, 'Un an plus tard'),
      move('lisiere_square', 'default'),
      say([N('Lisière possède de nouvelles maisons modestes. Les réfugiés stellaires n\'ont pas apporté un âge parfait : il existe des disputes sur l\'eau, le travail et les anciennes responsabilités. Un conseil public examine les prélèvements.'), N('Vaelor et Ravel sont jugés à partir des documents conservés. Le jeu ne présente pas leurs peines en spectacle ; il montre que leur autorité ne décide plus du récit.')]),
      move('memory_garden', 'default'),
      say([N('Soren lit le témoignage d\'Elyan devant ceux qui choisissent de venir. Il inclut sa peur et son ascendance.')]),
      move('stellar_dock', 'default'),
      say([N('Le quai est devenu un atelier au sol. Tessa a fait descendre sa mère de l\'Aube Basse.')]),
      move('forest_arrival', 'from_forest_crossing'),
      say([N('Nara retourne au bassin, seule ou accompagnée selon la relation. Elle n\'entend pas le prince lui promettre un retour. Elle entend la mélodie, désormais avec les paroles veilleurs et un couplet écrit par Soren.'), L('nara', 'Il y a encore tant de choses que tu aurais détesté manquer.'), N('L\'oiseau clair passe. Elle se relève et suit un appel du village. Le dernier plan reste sur l\'eau vivante.')]),
      { t: 'end', ending: 'A' },
    ],
    onComplete: [F('ending', 'A')],
    next: null,
  }),

  // ------------------------------------------------------------------ Fin B
  scene({
    id: 'B01', chapter: 10, title: 'La carte rendue au commandant', loc: 'planet_heart', spawn: 'center', party: ['nara', 'soren', 'tessa'],
    tint: { color: 0xff7040, alpha: 0.12 },
    actors: [at('vaelor', 'vaelor_spot', 'down'), at('eira', 'eira_spot', 'down')],
    steps: [
      say([N('Elyan transmet la carte et les réponses des sanctuaires. Le réseau identifie les passages utilisés par les réfugiés. Les routes ouvertes avec Nara ne sont plus des abris : elles deviennent des accès pour les unités de Vaelor. Le jeu montre cette inversion avec les mêmes marques visuelles, sans déployer une cinématique de massacre.')]),
      puzzle({
        kind: 'order', title: 'Maintenir la commande', prompt: 'Nara tente de retirer le sceau, Tessa coupe une dérivation, Soren vous demande de regarder le carnet. Pour maintenir la commande, vous devez désactiver leurs appuis : les compagnons sont neutralisés par les barrières, sans que vous ayez à les frapper.',
        options: [{ id: 'nara', label: 'Désactiver l\'appui de Nara' }, { id: 'tessa', label: 'Désactiver la dérivation de Tessa' }, { id: 'soren', label: 'Désactiver l\'appui de Soren' }],
        solution: ['nara', 'tessa', 'soren'],
        hints: ['Rappel du but : maintenir la fermeture.', 'Contrainte : chacun agit à son tour.', 'Action : Nara, Tessa, puis Soren.'],
        fail: 'L\'appui se rétablit. Recommencez.', success: 'Les compagnons sont tenus par les barrières.',
      }),
      say([L('nara', 'Tu sais où nous avons conduit les familles. Ce n\'était pas une confiance abstraite.'), L('elyan', 'Je peux encore vous protéger.'), L('tessa', 'De l\'ordre que tu viens de rendre possible.'), L('soren', 'N\'appelle pas notre silence un accord.')]),
      choice('Une dernière fenêtre. La première option implique leur captivité.', [
        opt('Exiger qu\'ils vivent.', { set: setv('b_mercy', 'spare'), lines: [N('Vaelor accepte la clémence personnelle : il veut l\'héritier coopératif et peut épargner quelques témoins sans laisser subsister les cités.')] }),
        opt('Laisser Vaelor décider.', { set: setv('b_mercy', 'abandon'), lines: [N('Nara et Tessa meurent lors de leur résistance aux gardes après l\'arrestation ; Soren est conservé pour traduire les archives puis emprisonné. Le bilan le dit sans image gore.')] }),
      ]),
    ],
    onComplete: [F('crown_closed'), F('eira_free', false), { op: 'party', remove: 'nara' }, { op: 'party', remove: 'soren' }, { op: 'party', remove: 'tessa' }],
    next: 'B02',
  }),
  scene({
    id: 'B02', chapter: 10, title: 'Une victoire sans chanson', loc: 'stellar_command', spawn: 'default', party: [],
    actors: [at('vaelor', 'vaelor_spot', 'down')],
    steps: [
      say([N('Vaelor célèbre la stabilisation du réseau. Ravel, libéré par les unités stellaires après la reprise du relais, reçoit le commandement de la vallée. Les cités veilleurs perdent leurs conseils ; leurs habitants sont tués, déplacés ou assignés au réseau. Les archives qui ne servent pas aux machines sont détruites.')]),
      ifs({ flags: { b_mercy: 'spare' } }, [say([N('Ysane survit en captivité, puisque Elyan a exigé la clémence.')])], [say([N('Ysane est exécutée avec d\'autres responsables. Dans les deux cas, son gouvernement n\'existe plus.')])]),
      choice('Interroger Vaelor sur les réformes promises :', [opt('Demander le retour du consentement d\'Eïra.', { lines: [L('vaelor', 'Un refus possible menacerait l\'origine conservée.'), N('Elyan comprend le piège : il peut améliorer la cage, pas l\'ouvrir.')] }), opt('Accepter la régulation des débits.', { lines: [N('Le commandant accepte une régulation des débits, des rations supplémentaires et des interdictions de cruauté individuelle.')] })]),
      move('memory_garden', 'default'),
      ifs({ flags: { b_mercy: 'spare' } }, [say([N('Si les compagnons vivent, une visite les montre derrière une barrière. Nara refuse le ruban offert comme réconciliation. Tessa demande à rejoindre sa mère librement ; Vaelor la veut comme ingénieure.')])], [say([N('Soren, conservé pour traduire les archives, regarde Elyan sans un mot.')])]),
      choice('Le carnet de Soren :', [opt('Laisser clandestinement l\'original dans une cache.', { set: setv('b_archive_cache', true) }), opt('Le laisser sous contrôle royal.', { set: setv('b_archive_cache', false) })]),
      say([L('vaelor', 'Maintenant que nous avons gagné, nous pouvons être généreux.'), L('elyan', 'Ils n\'ont pas demandé ta générosité.'), L('vaelor', 'Tu découvriras qu\'un roi doit parfois donner autre chose que ce qu\'on lui demande.'), N('L\'ancre de l\'an 780 s\'ouvre. Le prince repart avec les plans permettant de limiter la catastrophe de son époque après la nuit du prologue. Le retour ne ressuscite ni Oren ni les victimes déjà mortes.')]),
    ],
    onComplete: [F('dynasty_preserved'), F('veilleurs_civilization_destroyed'), F('return_portal_open')],
    next: 'B03',
  }),
  scene({
    id: 'B03', chapter: 10, title: 'Le jardin réparé', loc: 'palace_hall', spawn: 'default', party: [],
    actors: [at('mira', 'mira_spot', 'down'), at('adrien', 'adrien_spot', 'left')],
    steps: [
      fx('fade-out', 900), fx('fade-in', 900),
      say([N('Elyan arrive dans le palais partiellement détruit. Les portails locaux ont sauvé Mira et Adrien. Oren est mort ; une chaise vide dans la salle des cartes rappelle sa présence. Le prince apporte les plans de régulation. Les équipes isolent les conduites dangereuses et évitent l\'effondrement complet du royaume. Elles ne libèrent pas Eïra.')]),
      reach('Rejoindre Mira', 'mira_zone'),
      choice('Mira serre son fils. Elle ne sait pas encore ce qu\'il a fait.', [
        opt('Lui dire toute la vérité.', { set: setv('b_truth_told', 'full'), lines: [N('Elle demande à lire le carnet et cesse de fredonner lorsqu\'il lui explique l\'origine de la mélodie.')] }),
        opt('Ne parler que du voyage.', { set: setv('b_truth_told', 'journey_only'), lines: [N('Elle chante pendant qu\'il regarde la conduite.')] }),
        opt('Garder le silence.', { set: setv('b_truth_told', 'silent'), lines: [N('Elle fredonne ; il regarde la conduite.')] }),
      ]),
      move('palace_garden', 'default'),
      fx('title', 2400, 'Quelques mois plus tard'),
      say([N('Les jardins refleurissent. Le roi annonce un règne plus attentif aux puits provinciaux. Le peuple l\'acclame pour la stabilisation. Une chronique officielle décrit Vaelor comme un fondateur courageux.'), L('adrien', 'Tu nous as rendus à nous-mêmes.'), L('elyan', 'Je ne sais plus ce que cette phrase veut dire.')]),
      say([N('Le prince touche le bassin. Aucune réponse libre ne vient. Un automate diffuse le chant de l\'oiseau. Sous la pierre, un battement persiste, contraint, mais vivant. La dernière image laisse Elyan devant une porte qu\'il a choisie de refermer.')]),
      { t: 'end', ending: 'B' },
    ],
    onComplete: [F('ending', 'B')],
    next: null,
  }),
];
void inspect; void journal; void trust; void combat; void reach; void hs;
