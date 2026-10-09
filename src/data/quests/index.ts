// Les douze quêtes secondaires (bible §20). Chaque quête se joue sur place ; les récompenses sont appliquées une seule fois.
import type { QuestScript } from '../../core/types';
import { L, N, F, at, equip, hs, inspect, opt, puzzle, say, setv, talk, trust, choice, soin, item } from '../scenes/dsl';

const ent = (at: string, label: string, verb = 'Aider') => ({ at, label, verb });

export const QUESTS: QuestScript[] = [
  {
    id: 'q01', title: 'La pompe de Darel', where: 'Lisière', giver: 'Darel', summary: 'Le réservoir du dispensaire se vide : trouver pourquoi.',
    available: { chapterMin: 2 },
    stages: [{
      loc: 'lisiere_square', entry: ent('pompe', 'la pompe qui fuit'), task: 'Inspecter la pompe qui fuit',
      actors: [at('darel', 'darel_spot', 'down'), at('apprenti', 'apprenti_spot', 'left')],
      hotspots: [hs('q01_joint', 'pompe', 'joint usé', ['Trois observations montrent un joint usé.']), hs('q01_sortie', 'pompe', 'sortie bouchée', ['Une sortie bouchée.']), hs('q01_debit', 'pompe', 'débit trop fort', ['Un débit trop fort depuis une réparation récente.'])],
      steps: [
        say([N('Darel demande de trouver pourquoi le réservoir du dispensaire se vide.')]),
        inspect('Observer la pompe : joint, sortie, débit', ['q01_joint', 'q01_sortie', 'q01_debit'], 3),
        say([N('Vous récupérez un joint dans l\'atelier, dégagez la sortie et réglez la pompe avec Darel. Le Tissage peut tenir le support pendant le travail ; avant cela, un habitant aide, pour que la quête ne soit pas un faux verrou de compétence.'), N('L\'apprenti admet qu\'il avait augmenté le débit pour éviter une attente aux malades. Darel le corrige sans l\'humilier.')]),
        choice('À l\'apprenti :', [opt('Reconnaître sa bonne intention.', { set: setv('q01_answer', 'intent') }), opt('Expliquer la limite.', { set: setv('q01_answer', 'limit') })]),
        say([L('darel', 'Aider plus vite ne sert pas longtemps si l\'on abîme ce qui aide.')]),
      ],
    }],
    rewards: [F('q01_done'), equip('gilet_cuir'), soin(1)], done: 'Le dispensaire fonctionne. Darel vous remercie.',
  },
  {
    id: 'q02', title: 'Le dessin de Lume', where: 'Lisière et forêt d\'arrivée', giver: 'Lume', summary: 'Lume voudrait dessiner le bassin où Nara a trouvé l\'Étranger.',
    available: { chapterMin: 2 },
    stages: [
      { loc: 'lisiere_square', entry: ent('lume_zone', 'les feuilles de dessin de Lume', 'Regarder'), task: 'Regarder les feuilles de dessin de Lume', actors: [at('lume', 'lume_spot', 'down')], steps: [say([N('Lume voudrait dessiner le bassin où Nara a trouvé l\'Étranger. Elle n\'a pas le droit d\'y aller seule.'), L('lume', 'Tu peux venir avec Nara ? Je serai sage.')])] },
      {
        loc: 'forest_arrival', entry: ent('pool', 'le bassin avec Lume et Nara', 'Dessiner'), task: 'Accompagner Lume au bassin avec Nara', actors: [at('lume', 'lume_spot', 'down')],
        hotspots: [hs('q02_arbre', 'arbre', 'l\'arbre', ['Un arbre repère.']), hs('q02_pierre', 'stone', 'une pierre', ['Une pierre mousseuse.']), hs('q02_oiseau', 'oiseau', 'traces d\'oiseau', ['De petites traces d\'oiseau.'])],
        steps: [
          say([N('Lume attend dans les zones sûres et le retour s\'effectue après les trois observations. Nara lui apprend à reconnaître une marque de chemin plutôt qu\'à suivre n\'importe quelle personne gentille.')]),
          inspect('Inspecter trois repères : l\'arbre, la pierre, les traces d\'oiseau', ['q02_arbre', 'q02_pierre', 'q02_oiseau'], 3),
          choice('Comment décrire le héros dans le dessin ?', [opt('Aventureux.', { set: setv('q02_desc', 'adventurous') }), opt('Perdu.', { set: setv('q02_desc', 'lost') }), opt('Simplement mouillé.', { set: setv('q02_desc', 'wet') })]),
          say([N('Lume choisit de le dessiner avec la branche qu\'on lui a tendue.'), L('lume', 'Si tu retrouves ton nom, je pourrai changer le dessin ?'), L('elyan', 'Tu pourras écrire le nom. Le reste, c\'est ce que tu as vu.')]),
        ],
      },
    ],
    rewards: [F('q02_done'), item('lume_drawing'), soin(1)], done: 'Lume garde l\'original ; vous gardez une copie.',
  },
  {
    id: 'q03', title: 'Les graines qui attendent', where: 'Sanctuaire des racines', giver: 'Méline', summary: 'Des graines destinées à Miral sont tombées dans une zone devenue sèche.',
    available: { chapterMin: 2 },
    stages: [
      {
        loc: 'root_shrine', entry: ent('sachets', 'des sachets près du passage', 'Ramasser'), task: 'Retrouver trois sachets de graines au sanctuaire des racines',
        hotspots: [hs('q03_s1', 'sachets', 'sachet sec', ['Un sachet intact.']), hs('q03_s2', 'sachets', 'sachet mouillé', ['Ces graines ont pris l\'eau.']), hs('q03_s3', 'sachets', 'sachet au repos', ['Certaines doivent rester au repos : ne pas les arroser avec la magie.'])],
        steps: [
          inspect('Retrouver trois sachets, identifier ceux qui ont pris l\'eau', ['q03_s1', 'q03_s2', 'q03_s3'], 3),
          say([N('Vous demandez à Darel comment les conserver. La quête peut se terminer après le Tissage, lorsque le passage haut s\'ouvre.')]),
        ],
      },
      {
        loc: 'memory_garden', entry: ent('meline_spot', 'Méline et les graines', 'Parler à'), task: 'Rapporter les graines à Méline à Miral', actors: [at('meline', 'meline_spot', 'down')],
        steps: [
          say([L('meline', 'C\'est plus facile de compter les plants qui poussent que ceux qu\'on a gardés vivants sans les réveiller.')]),
          choice('Que faire des sachets ?', [opt('En laisser un à Lisière.', { set: setv('seed_share', 'lisiere') }), opt('Tout porter à Miral.', { set: setv('seed_share', 'miral') })]),
        ],
      },
    ],
    rewards: [F('q03_done'), equip('graine_chance')], done: 'Les plantes sont réparties entre deux décors sans priver un lieu de nourriture.',
  },
  {
    id: 'q04', title: 'Le sentier de son père', where: 'Forêt, avec Nara', giver: 'Nara', summary: 'Nara veut retrouver une balise laissée par son père.',
    available: { chapterMin: 3 },
    stages: [{
      loc: 'forest_crossing', entry: ent('sortie_haute', 'le sentier en hauteur avec Nara', 'Suivre'), task: 'Suivre trois marques jusqu\'à la balise', 
      hotspots: [hs('q04_m1', 'marque1', 'première marque', ['Une marque de chemin, presque effacée.']), hs('q04_m2', 'marque2', 'deuxième marque', ['La suivante, déplacée par l\'éboulement.']), hs('q04_m3', 'marque3', 'troisième marque', ['Un rebord qu\'il faut atteindre par le Tissage.'])],
      steps: [
        say([N('Nara veut retrouver une ancienne balise laissée par son père. Le sentier a été déplacé après l\'éboulement qui l\'a tué.')]),
        inspect('Suivre trois marques', ['q04_m1', 'q04_m2', 'q04_m3'], 3),
        say([N('Vous utilisez le Tissage pour atteindre un rebord et trouvez une pierre gravée. Il n\'y a ni vision attestant une survie secrète ni esprit du père donnant une quête.')]),
        talk('Écouter Nara', 'nara', [N('Nara raconte qu\'elle avait refusé de l\'accompagner ce jour-là et qu\'elle a longtemps traité ce refus comme la cause de sa mort.')], [
          opt('L\'écouter.', { lines: [N('Vous ne pouvez pas effacer son deuil avec une phrase brillante.')] }),
          opt('Lui demander ce qu\'elle sait réellement de l\'éboulement.', { lines: [N('Elle réfléchit longtemps.')] }),
          opt('Partager ma propre peur du choix.', { lines: [N('Elle ne répond pas tout de suite.')] }),
        ]),
        say([L('nara', 'J\'ai passé des années à imaginer le bon geste avant de comprendre que je n\'étais pas dans cette montagne.')]),
      ],
    }],
    rewards: [F('q04_done'), trust('nara', 1), equip('lame_veilleur')], done: 'Une balise à son nom est remise en place.',
  },
  {
    id: 'q05', title: 'La roue du meunier', where: 'Rivière', giver: 'Le meunier', summary: 'Le courant est revenu, mais la roue reste bloquée.',
    available: { scenes: ['C03S05'] },
    stages: [{
      loc: 'river_bank', entry: ent('moulin', 'la roue bloquée du moulin'), task: 'Examiner la roue avec le meunier et l\'ancien gardien',
      actors: [at('meunier', 'meunier_spot', 'down'), at('gardien', 'gardien_spot', 'left')],
      hotspots: [hs('q05_a1', 'moulin', 'premier appui', ['L\'appui fonctionne.']), hs('q05_a2', 'moulin', 'deuxième appui', ['La pièce neuve fonctionne aussi.']), hs('q05_a3', 'moulin', 'troisième appui', ['Une pierre amenée par la crue empêche la rotation.'])],
      steps: [
        say([N('Le courant est revenu, mais la roue reste bloquée. Le meunier accuse une pièce stellaire. Le gardien, qui a aidé lors du secours, propose de l\'examiner.')]),
        inspect('Vérifier les trois appuis', ['q05_a1', 'q05_a2', 'q05_a3'], 3),
        say([N('L\'Accord des eaux réduit temporairement le débit pendant que les deux hommes retirent la pierre.'), L('meunier', 'Votre machine a pris notre eau. Cette pièce-là, elle n\'y était pour rien. Je peux dire les deux.'), N('Le gardien accepte de travailler contre un salaire et non comme une dette imposée.')]),
      ],
    }],
    rewards: [F('q05_done'), equip('tenue_legere'), soin(1)], done: 'Le moulin tourne. Un civil stellaire s\'installe.',
  },
  {
    id: 'q06', title: 'Le nom d\'Ilan', where: 'Lisière', giver: 'Ilan', summary: 'Ilan veut réparer l\'insigne de messager brisé pendant sa détention.',
    available: { scenes: ['C03S05'] },
    stages: [
      { loc: 'river_bank', entry: ent('attache_zone', 'une attache de métal', 'Ramasser'), task: 'Recueillir une attache à la rivière', hotspots: [hs('q06_attache', 'attache_zone', 'attache', ['Une attache de métal adaptée à l\'insigne.'])], steps: [inspect('Ramasser l\'attache', ['q06_attache'], 1), say([N('Tessa réparera le métal.')])] },
      {
        loc: 'lisiere_square', entry: ent('ilan_zone', 'Ilan et Nara', 'Parler à'), task: 'Faire réparer l\'insigne par Tessa et parler à Ilan et Nara', actors: [at('ilan', 'ilan_spot', 'down')],
        steps: [
          say([N('Tessa répare le métal. Ilan choisit le signe qu\'il y grave.'), N('La conclusion se joue dans une conversation à trois. Le joueur ne tranche pas comme chef de famille ; il facilite l\'énoncé des engagements.')]),
          choice('Aider à énoncer les engagements :', [opt('Voyages en binôme.', { set: setv('q06_rule', 'pairs') }), opt('Points de rendez-vous.', { set: setv('q06_rule', 'meetings') }), opt('Limites précises.', { set: setv('q06_rule', 'limits') })]),
          say([L('ilan', 'Je ne veux pas courir seul pour que tu voies que je suis grand. Je veux qu\'on me confie quelque chose de vrai.')]),
        ],
      },
    ],
    rewards: [F('q06_done'), equip('insigne_ilan')], done: 'Ilan porte l\'insigne à Orme.',
  },
  {
    id: 'q07', title: 'Les deux versions de la crue', where: 'Archives et jardin de Miral', giver: 'Soren', summary: 'Soren veut vérifier un ancien récit de crue.',
    available: { scenes: ['C04S03'] },
    stages: [{
      loc: 'memory_garden', entry: ent('archives_zone', 'l\'ancien récit de crue', 'Examiner'), task: 'Examiner le registre des travaux, une pierre de niveau et les témoignages',
      hotspots: [hs('q07_registre', 'archives_zone', 'registre des travaux', ['Le conseil avait prévu l\'évacuation.']), hs('q07_pierre', 'archives_zone', 'pierre de niveau', ['Le niveau de la crue, gravé sur une pierre.']), hs('q07_temoins', 'archives_zone', 'témoignages', ['Une habitante : les ouvriers ont ouvert les vannes contre l\'ordre du conseil.'])],
      steps: [
        say([N('Un texte dit que le conseil a sauvé la cité ; une habitante dit que les ouvriers ont ouvert les vannes contre son ordre.')]),
        inspect('Examiner trois sources', ['q07_registre', 'q07_pierre', 'q07_temoins'], 3),
        say([N('La conclusion distingue deux moments : le conseil avait prévu l\'évacuation, mais les ouvriers ont dû changer le plan quand le canal a cédé.')]),
        choice('Proposer un titre :', [opt('Un titre collectif.', { set: setv('q07_title', 'collective') }), opt('Un titre nommant l\'ouvrière oubliée.', { set: setv('q07_title', 'worker') })]),
        say([L('soren', 'Je cherchais qui avait raison. Je n\'avais pas encore demandé quand.')]),
      ],
    }],
    rewards: [F('q07_done'), trust('soren', 1), equip('pierre_ecoute')], done: 'Soren rédige une note qui conserve les deux faits.',
  },
  {
    id: 'q08', title: 'Une chaise pour l\'absent', where: 'Jardin de mémoire', giver: 'Méline', summary: 'Une famille hésite à graver le nom d\'un artisan disparu.',
    available: { scenes: ['C04S03'] },
    stages: [
      { loc: 'memory_garden', entry: ent('banc_inacheve', 'un banc inachevé', 'Observer'), task: 'Observer le banc inachevé', actors: [at('meline', 'meline_spot', 'down')], steps: [say([N('Une famille hésite à graver le nom d\'un artisan dont elle n\'a pas retrouvé le corps après un accident ancien. Méline propose une marque d\'attente, qui ne déclare ni sa mort ni son retour.')])] },
      { loc: 'miral_gate', entry: ent('atelier_zone', 'l\'atelier de l\'artisan', 'Fouiller'), task: 'Récupérer une petite pièce dans l\'atelier', hotspots: [hs('q08_piece', 'atelier_zone', 'petite pièce', ['Une petite pièce que l\'homme avait laissée dans son atelier.'])], steps: [inspect('Prendre la petite pièce', ['q08_piece'], 1)] },
      { loc: 'memory_garden', entry: ent('banc_inacheve', 'la famille de l\'artisan', 'Remettre la pièce'), task: 'Remettre la pièce à la famille', actors: [at('habitant', 'habitant1', 'down')], steps: [
        choice('Vous pouvez demander quel mot utiliser ; vous ne choisissez pas à la place des proches.', [opt('Demander quel mot utiliser.', { lines: [N('Ils gravent « pour celui dont nous gardons la place ».')] }), opt('Rester en retrait.', { lines: [N('Ils gravent « pour celui dont nous gardons la place ».')] })]),
        say([L('meline', 'Une place peut attendre. Une histoire ne doit pas mentir pour la remplir.')]),
      ] },
    ],
    rewards: [F('q08_done'), equip('cordon_pierre')], done: 'Le banc porte la marque d\'attente.',
  },
  {
    id: 'q09', title: 'Un repas pour deux cuisines', where: 'Miral', giver: 'Une cuisinière et une réfugiée', summary: 'Une recette stellaire exige une chaleur continue que le puits ne peut donner.',
    available: { scenes: ['C04S01'] },
    stages: [
      { loc: 'miral_gate', entry: ent('tables_zone', 'les tables du repas', 'Discuter'), task: 'Discuter près des tables', actors: [at('cuisiniere', 'cuisiniere_spot', 'down'), at('refugiee', 'refugiee_spot', 'left')], steps: [
        say([N('Une réfugiée propose un pain de son habitat, mais sa recette exige une chaleur continue que le puits ne peut donner. La cuisinière locale propose une cuisson par étapes.')]),
      ] },
      { loc: 'stellar_dock', entry: ent('atelier_zone', 'l\'atelier du quai', 'Chercher'), task: 'Apporter un support métallique et un pot isolant', hotspots: [hs('q09_support', 'atelier_zone', 'support métallique', ['Un support métallique solide.']), hs('q09_pot', 'atelier_zone', 'pot isolant', ['Un pot isolant.'])], steps: [inspect('Rapporter les deux objets', ['q09_support', 'q09_pot'], 2)] },
      { loc: 'miral_gate', entry: ent('tables_zone', 'la fournée d\'essai', 'Tester'), task: 'Tester une seule fournée', actors: [at('cuisiniere', 'cuisiniere_spot', 'down'), at('refugiee', 'refugiee_spot', 'left')], steps: [
        say([N('Le repas est imparfait : la texture diffère et la réfugiée reconnaît ce qu\'elle regrette.'), L('refugiee', 'Ce n\'est pas celui de chez moi.'), L('cuisiniere', 'On peut lui donner un autre nom sans dire que tu as oublié l\'ancien.')]),
      ] },
    ],
    rewards: [F('q09_done'), equip('manteau_epais'), soin(1)], done: 'Les gens partagent néanmoins le pain.',
  },
  {
    id: 'q10', title: 'Les lettres de l\'Aube Basse', where: 'Station', giver: 'Tessa', summary: 'Des lettres ont été retenues parce que le transport prioritaire appartient au chantier.',
    available: { scenes: ['C05S01'] },
    stages: [{
      loc: 'stellar_dock', entry: ent('colis', 'un colis bloqué au quai'), task: 'Rassembler trois destinataires et libérer une commande non militaire',
      hotspots: [hs('q10_d1', 'colis', 'destinataire 1', ['Une mère, qui attend des nouvelles.']), hs('q10_d2', 'colis', 'destinataire 2', ['Un vieil homme, sans nouvelles depuis une saison.']), hs('q10_d3', 'colis', 'destinataire 3', ['Une jeune femme et ses frères.'])],
      steps: [
        say([N('Des lettres ont été retenues parce que le transport prioritaire appartient au chantier.')]),
        inspect('Rassembler trois destinataires', ['q10_d1', 'q10_d2', 'q10_d3'], 3),
        puzzle({ kind: 'pick', title: 'Un relais encore sûr', prompt: 'Identifiez un relais encore sûr et libérez une commande non militaire avec l\'Onde.', options: [{ id: 'militaire', label: 'La commande militaire du chantier', clue: 'Hors de question.' }, { id: 'civil', label: 'Une commande civile de transport', clue: 'Non militaire : l\'Onde peut la désynchroniser.' }, { id: 'medicale', label: 'Le relais médical', clue: 'Occupé par l\'urgence.' }], solution: 'civil', hints: ['But : libérer une commande qui ne sert pas l\'armée.', 'Contrainte : ne touchez pas au chantier.', 'Action : la commande civile.'], fail: 'Verrou inchangé.', success: 'La commande s\'ouvre ; Tessa émet les messages sans garantir une réponse immédiate.' }),
        say([N('Une lettre de sa mère arrive après un changement de scène. Elle décrit une panne et une voisine qui partage ses filtres.'), L('tessa', 'Il y a des gens là-haut qui n\'ont jamais demandé qu\'on mette un genou sur la terre d\'ici.')]),
      ],
    }],
    rewards: [F('q10_done'), item('witness_letters'), equip('cuirasse_stellaire')], done: 'Les lettres sont parties.',
  },
  {
    id: 'q11', title: 'Un relevé sans correction', where: 'Laboratoire', giver: 'Un technicien', summary: 'Un technicien a signalé une fluctuation qu\'on lui a demandé de retirer du rapport.',
    available: { scenes: ['C05S05'] },
    stages: [{
      loc: 'stellar_lab', entry: ent('technicien_zone', 'le jeune technicien'), task: 'Comparer l\'enregistrement brut au rapport',
      actors: [at('technicien', 'tech_spot', 'down'), at('ilyra', 'ilyra_spot', 'left')],
      hotspots: [hs('q11_brut', 'technicien_zone', 'enregistrement brut', ['La fluctuation est bien là.']), hs('q11_rapport', 'technicien_zone', 'rapport corrigé', ['La ligne a été retirée ; Ilyra l\'a validé.'])],
      steps: [
        say([N('Ilyra affirme qu\'elle n\'a jamais donné cet ordre, puis découvre qu\'elle a validé le document corrigé.')]),
        inspect('Comparer l\'enregistrement et le rapport', ['q11_brut', 'q11_rapport'], 2),
        choice('Demander qu\'une note d\'écart soit signée.', [opt('Insister pour qu\'Ilyra reconnaisse sa validation.', { set: setv('q11_press', 'press') }), opt('Chercher d\'abord le supérieur.', { set: setv('q11_press', 'search') })]),
        say([L('technicien', 'Je voulais qu\'on me croie. Ensuite j\'ai seulement voulu que mon nom disparaisse de la ligne.')]),
      ],
    }],
    rewards: [F('q11_done'), F('ilyra_early_doubt'), equip('amulette_eau')], done: 'Le relevé brut est conservé.',
  },
  {
    id: 'q12', title: 'Les objets sans propriétaire', where: 'Abri d\'Orme puis Miral', giver: 'Soren', summary: 'Des objets ramassés sur les routes : leurs propriétaires les cherchent peut-être.',
    available: { scenes: ['C08S03'] },
    stages: [
      { loc: 'valley_camp', entry: ent('objets_zone', 'les objets ramassés', 'Examiner'), task: 'Examiner les marques et interroger trois personnes', hotspots: [hs('q12_tasse', 'objets_zone', 'une tasse', ['Une tasse ébréchée.']), hs('q12_outil', 'objets_zone', 'un outil', ['Un outil usé.']), hs('q12_bague', 'objets_zone', 'une bague simple', ['Une bague simple. Ses marques ne disent rien.'])], steps: [
        say([N('Soren veut les conserver comme témoignages. Ilan rappelle que des propriétaires les cherchent peut-être encore.')]),
        inspect('Examiner trois objets et interroger trois personnes', ['q12_tasse', 'q12_outil', 'q12_bague'], 3),
        say([N('Vous rendez deux objets. Le dernier reste sans identification.'), L('soren', 'J\'allais garder leur histoire en prenant ce qui pouvait encore leur revenir.')]),
      ] },
      { loc: 'memory_garden', entry: ent('registre_zone', 'le registre de restitution', 'Ouvrir'), task: 'Ouvrir un registre de restitution à Miral', steps: [
        say([N('Le groupe crée un registre de restitution plutôt qu\'une vitrine définitive. Une famille retrouve une tasse et rit du fait qu\'elle ait survécu à tout. Le rire ne nie pas les absents.')]),
        choice('Votre ruban :', [opt('Le laisser dans ce registre, comme objet confié (confirmé avant le départ final).', { set: setv('q12_ribbon', 'registry') }), opt('Le garder.', { set: setv('q12_ribbon', 'keep') })]),
      ] },
    ],
    rewards: [F('q12_done'), equip('lance_racine')], done: 'Le registre de restitution est ouvert.',
  },
];
