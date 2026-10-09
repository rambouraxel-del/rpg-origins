// Chapitre 3 — La rivière immobile (C03S01 à C03S05). Texte : bible §10.
import { L, N, F, accord, at, chapter, guide, hs, inspect, item, joinParty, journal, opt, power, puzzle, reach, say, scene, setv, talk, trust, save } from './dsl';

export const CH3 = [
  scene({
    id: 'C03S01', chapter: 3, title: 'La roue sans courant', loc: 'river_bank', spawn: 'from_lisiere_square', party: ['nara', 'soren'],
    actors: [at('meunier', 'meunier_spot', 'down'), at('pecheur', 'pecheur1', 'right')],
    hotspots: [
      hs('c03s01_canal1', 'canal_habitations', 'canal vers les habitations', ['Ce canal est ouvert vers les habitations.']),
      hs('c03s01_canal2', 'canal_relais', 'canal vers le relais', ['Ce canal est ouvert vers le relais.']),
      hs('c03s01_canal3', 'canal_decharge', 'canal de décharge, bouché', ['Ce canal de décharge est bouché par des débris. L\'Écoute y distingue une pression piégée.']),
    ],
    steps: [
      say([N('La rivière a été ralentie par une prise d\'énergie et une dérivation. Le moulin s\'arrête, alors qu\'une conduite métallique brille.')]),
      talk('Parler au meunier', 'meunier', [L('meunier', 'Je veux retrouver ma roue. Je ne veux pas retrouver les enfants de l\'autre rive dans mes filets.'), L('nara', 'Nous allons faire les deux. Il faut juste que quelqu\'un là-bas accepte de répondre.'), L('soren', 'Il y a un camp stellaire en contrebas. L\'eau pourrait aussi le submerger.')]),
      inspect('Observer les trois canaux', ['c03s01_canal1', 'c03s01_canal2', 'c03s01_canal3'], 3),
      puzzle({
        kind: 'pick', title: 'Les trois canaux', prompt: 'Le Tissage stabilise une passerelle jusqu\'aux débris ; l\'Écoute distingue une pression piégée. Quel canal libérer d\'abord ?',
        options: [{ id: 'habitations', label: 'Le canal vers les habitations', clue: 'Déjà ouvert : l\'eau y passe.' }, { id: 'relais', label: 'Le canal vers le relais', clue: 'Ouvrir la vanne principale d\'abord ferait courir un risque aux deux rives.' }, { id: 'decharge', label: 'Le canal de décharge', clue: 'Bouché par des débris ; libère la pression piégée.' }],
        solution: 'decharge',
        hints: ['Rappel du but : atteindre la vanne du relais sans noyer personne.', 'Contrainte : une ouverture brutale emporterait les réserves.', 'Action : libérez le canal de décharge avant de toucher la vanne.'],
        fail: 'La pression monte ; la passerelle vibre. Vous reculez avant que rien ne cède. Réessayez.', success: 'Le canal de décharge s\'ouvre. La pression retombe.',
      }),
      say([N('À la porte du relais, une machine détecte le fragment et prononce un message incomplet.'), L('automate', 'Signature de succession… incohérente…'), N('Elyan ne peut pas choisir de l\'ignorer entièrement ; il l\'entend, puis Nara lui demande de revenir à leur objectif immédiat.')]),
      reach('Entrer dans le relais', 'exit_relay'),
    ],
    onComplete: [F('royal_access_hint'), journal('s_succession', 'Signature de succession', 'Une machine a dit : « Signature de succession… incohérente… ». Le fragment gravé y répond.')],
    next: 'C03S02',
  }),
  scene({
    id: 'C03S02', chapter: 3, title: 'La prisonnière aux mains brûlées', loc: 'river_relay', spawn: 'from_river_bank', party: ['nara', 'soren'],
    actors: [at('tessa', 'tessa_spot', 'down'), at('ilan', 'ilan_spot', 'down'), at('gardien', 'gardien_spot', 'left')],
    hotspots: [
      hs('c03s02_blast', 'pompe', 'conduite éclatée', ['Une explosion vers l\'extérieur : la conduite a éclaté sous la pression.']),
      hs('c03s02_tool', 'vanne', 'outil cassé sur la vanne d\'arrêt', ['Un outil cassé sur la vanne d\'arrêt : quelqu\'un a tenté de couper la pompe.']),
      hs('c03s02_gauge', 'console', 'mesures', ['Les mesures affichent un dépassement avant l\'intervention.']),
    ],
    steps: [
      say([N('Dans une cellule improvisée, Tessa porte une veste de la flotte. Ses mains sont brûlées. Ilan se trouve dans une autre pièce, accusé de sabotage parce qu\'il livrait des plantes au moment où une conduite a éclaté.')]),
      talk('Parler à Tessa', 'tessa', [L('tessa', 'Ils peuvent me punir pour avoir arrêté leur pompe. Pas pour l\'avoir laissée tourner.'), L('nara', 'Pourquoi Ilan est là ?'), L('tessa', 'Parce qu\'ils avaient déjà écrit « sabotage » quand ils ont commencé à chercher qui accuser.')]),
      inspect('Réunir les trois observations (Soren compare les traces)', ['c03s02_blast', 'c03s02_tool', 'c03s02_gauge'], 3),
      say([N('Elles prouvent l\'accident et l\'action de Tessa, sans déclarer que toute la flotte est innocente.'), N('Le fragment ouvre le panneau de contrôle. Une seconde mention de succession apparaît et se masque. Tessa la voit, mais n\'en sait pas assez pour identifier le prince.'), N('Le gardien accepte un transfert des blessés lorsque la pompe sera rendue sûre. Il refuse encore de laisser sortir tout le monde.')]),
    ],
    onComplete: [F('tessa_met'), journal('p_tessa', 'Tessa', 'Mécanicienne de la flotte stellaire. Travaille sur les filtres et les pompes, pas sur les armes.', 'people'), journal('p_ilan', 'Ilan', 'Frère de Nara, dix-sept ans. Captif au relais.', 'people')],
    next: 'C03S03',
  }),
  scene({
    id: 'C03S03', chapter: 3, title: 'L\'eau qui doit passer', loc: 'water_shrine', spawn: 'from_river_relay', party: ['nara', 'soren'],
    hotspots: [hs('c03s03_inscr', 'inscription', 'inscription des trois bassins', ['Trois bassins reliés, dont le plus petit se trouve après les autres.', 'Soren lit : « Le dernier attend encore quand le premier se croit plein. »'])],
    actors: [at('tessa', 'tessa_spot', 'down')],
    steps: [
      say([N('Derrière le relais, un sanctuaire a été muré à moitié. Tessa explique les vannes artificielles ; Nara reconnaît les anciens canaux.')]),
      inspect('Lire l\'inscription', ['c03s03_inscr'], 1),
      puzzle({
        kind: 'valves', title: 'Un débit pour chaque rive', prompt: 'Répartissez le flux entre le puits, le moulin et le bassin éloigné. Remplir un seul bassin bloque le circuit.',
        basins: [{ id: 'puits', label: 'Puits du village', min: 1, max: 2 }, { id: 'moulin', label: 'Moulin', min: 1, max: 2 }, { id: 'decharge', label: 'Bassin éloigné (aval)', min: 1, max: 3 }],
        supply: 5,
        hints: ['Rappel du but : un débit doit atteindre les trois bassins.', 'Contrainte : le dernier attend encore quand le premier se croit plein.', 'Action : donnez au moins 1 à chaque bassin, sans en remplir un au-delà de 2 (puits, moulin).'],
        fail: 'Le circuit se bloque. Les niveaux se réinitialisent ; personne n\'en pâtit.', success: 'Un débit mesuré atteint le bassin éloigné. L\'eau rejoint le moulin ; la pompe stellaire cesse de chauffer.',
      }),
      say([
        L('elyan', 'Je pensais qu\'il fallait choisir qui recevrait l\'eau.'),
        L('tessa', 'La machine t\'a donné cette impression. Elle n\'a gardé que les sorties qui l\'arrangeaient.'),
        N('Une réponse fraîche traverse sa main. Dans une brève image, Elyan voit un anneau sous des racines, sans comprendre qu\'il s\'agit de l\'origine de son palais.'),
      ]),
    ],
    onComplete: [power('flow'), accord('accord_water'), item('accord_water'), F('river_safe'), item('tessa_tool'), save('auto')],
    next: 'C03S04',
  }),
  scene({
    id: 'C03S04', chapter: 3, title: 'Ceux des deux rives', loc: 'river_relay', spawn: 'from_water_shrine', party: ['nara', 'soren'],
    tint: { color: 0xa04030, alpha: 0.12 },
    hotspots: [hs('c03s04_support', 'support_cloison', 'supports de la cloison', ['Des supports existants : le Tissage peut les tenir.']), hs('c03s04_canal', 'canal', 'canal déjà ouvert', ['Le canal ouvert au sanctuaire passe ici : l\'Accord des eaux peut détourner la pression.'])],
    actors: [at('tessa', 'tessa_spot', 'down'), at('ilan', 'ilan_spot', 'down')],
    steps: [
      say([N('L\'arrêt de la pompe rompt un câble déjà endommagé. Une cloison tombe devant une équipe d\'ouvriers de la flotte. Ilan est libre, mais Nara voit le héros hésiter entre rejoindre la sortie et aider Tessa à lever l\'obstacle.'), N('La scène exige de sauver les deux groupes : la route principale ne propose pas de sacrifice arbitraire.')]),
      puzzle({
        kind: 'set', title: 'Lever l\'obstacle', prompt: 'Tessa guide le héros pour détourner la pression. Quelles actions combiner ? (L\'Onde n\'est pas encore disponible.)',
        options: [{ id: 'tisser', label: 'Tisser les supports de la cloison', clue: 'Le Tissage tient les supports existants.' }, { id: 'canal', label: 'Ouvrir le canal déjà ouvert', clue: 'L\'Accord des eaux détourne la pression.' }, { id: 'forcer', label: 'Forcer la cloison à main nue', clue: 'Dangereux : tout risque de s\'effondrer sur les ouvriers.' }, { id: 'couper', label: 'Couper le câble restant', clue: 'Le câble est endommagé : le couper aggraverait la secousse.' }],
        solution: ['tisser', 'canal'],
        hints: ['Rappel du but : sauver les deux groupes.', 'Contrainte : seuls le Tissage et l\'Accord des eaux sont disponibles.', 'Action : Tissage sur les supports et Accord des eaux dans le canal.'],
        fail: 'La cloison grince. Tessa : « Pas comme ça. » Recommencez.', success: 'La pression est détournée, la cloison tient. La voie est libre.',
      }),
      guide('Sortir les captifs et secourir l\'équipe technique', [
        { id: 'ilan', label: 'Ilan et les captifs', from: 'captifs', to: 'rive' },
        { id: 'ouvriers', label: 'Les ouvriers de la flotte', from: 'ouvriers', to: 'rive_b' },
      ]),
      say([
        L('ilan', 'Tu viens ?'),
        L('nara', 'Je suis juste derrière toi. Et eux aussi.'),
        L('tessa', 'Je sais ce que cet uniforme vous a fait. Mais derrière la porte, il y a des gens.'),
        N('Tous les ouvriers atteignent la rive. Le gardien retire son arme pour aider. Un officier exige par transmission de retenir les témoins ; il coupe l\'appel au lieu d\'obéir.'),
      ]),
    ],
    onComplete: [F('river_rescue_done'), F('tessa_party'), joinParty('tessa'), trust('tessa', 0), journal('s_gardien', 'Le gardien du relais', 'Il a retiré son arme pour aider. Il pourrait un jour faire défection.')],
    next: 'C03S05',
  }),
  scene({
    id: 'C03S05', chapter: 3, title: 'Une dette refusée', loc: 'river_bank', spawn: 'from_river_relay', party: ['nara', 'soren', 'tessa'],
    tint: { color: 0xd06a30, alpha: 0.22 },
    actors: [at('ilan', 'ilan_spot', 'right'), at('meunier', 'meunier_spot', 'left')],
    steps: [
      say([N('Ilan veut rentrer. Nara lui donne la corde de retour et un message pour Darel. Elle ne le laisse pas seul dans une région hostile : le meunier organise une escorte déjà visible.')]),
      talk('Écouter Tessa', 'tessa', [N('Tessa révèle les filtres défaillants de l\'habitat où vit sa mère, les rations réduites et les morts que Vaelor promet d\'empêcher.')], [
        opt('Cette urgence justifie-t-elle le relais ?', { lines: [L('tessa', 'Elle explique le relais. Elle ne l\'excuse pas : j\'ai coupé leur pompe, tu te souviens ?')] }),
        opt('Je n\'avais pas imaginé la vie au-dessus des nuages.', { effects: [trust('tessa', 1)], lines: [L('tessa', 'Personne ne l\'imagine. C\'est pour ça qu\'il y a des lettres.')] }),
      ]),
      say([
        L('tessa', 'Tu ne m\'as pas achetée en ouvrant une porte.'),
        L('elyan', 'Je n\'allais pas te le demander.'),
        L('tessa', 'Tant mieux. Je préfère le dire avant d\'apprendre qu\'on n\'avait pas la même idée d\'un merci.'),
        N('Nara remercie néanmoins Tessa pour Ilan. Soren annonce que Miral peut identifier les anciens signes.'),
        N('Au-dessus de la rivière, un vaisseau apparaît brièvement : sa forme rappelle les fragments du prologue, sans donner encore d\'explication complète.'),
      ]),
    ],
    onComplete: [chapter(4), F('tessa_met_full'), save('auto')],
    next: 'C04S01',
  }),
];
void accord; void hs; void opt; void reach; void setv;
