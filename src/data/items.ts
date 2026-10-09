// Objets narratifs, équipement (une douzaine, déterministes), améliorations.
export interface ItemDef { id: string; name: string; text: string }
export const NARRATIVE: Record<string, ItemDef> = {
  royal_shard: { id: 'royal_shard', name: 'Fragment gravé', text: 'Un métal tiède, gravé d\'une main qui semble s\'ouvrir ou se fermer selon l\'angle. Il réagit aux verrous des machines.' },
  ribbon: { id: 'ribbon', name: 'Ruban non identifié', text: 'Un tissu familier. Il appartenait à quelqu\'un qui comptait.' },
  nara_thread: { id: 'nara_thread', name: 'Cordelette de Nara', text: 'Pour marquer les chemins. « Distingue un sentier sûr d\'un sentier rassurant. »' },
  soren_book: { id: 'soren_book', name: 'Carnet de Soren', text: 'Un carnet de témoignages confié avant le choix final.' },
  tessa_tool: { id: 'tessa_tool', name: 'Outil de dérivation de Tessa', text: 'Prêté pour la rivière, utile au cœur.' },
  accord_root: { id: 'accord_root', name: 'Accord des racines', text: 'Un motif à quatre battements dont le dernier est silencieux.' },
  accord_water: { id: 'accord_water', name: 'Accord des eaux', text: 'Une réponse fraîche : laisser passer ce qui doit passer.' },
  accord_memory: { id: 'accord_memory', name: 'Accord de mémoire', text: 'Trois timbres simultanés qui ne fusionnent pas.' },
  evacuation_map: { id: 'evacuation_map', name: 'Carte d\'évacuation', text: 'Des chemins et des rendez-vous, pas les noms des familles.' },
  massacre_orders: { id: 'massacre_orders', name: 'Ordre de massacre authentifié', text: 'Signé par Vaelor, confirmé par Ravel. Une page entière, avec les réglages.' },
  drain_report: { id: 'drain_report', name: 'Rapport d\'épuisement', text: 'Mesures montrant qu\'une extraction forcée ne devient pas inoffensive par simple bonne intention.' },
  witness_letters: { id: 'witness_letters', name: 'Lettres de l\'Aube Basse', text: 'Les vies des civils de la flotte, avec leurs mots.' },
  oren_notes: { id: 'oren_notes', name: 'Notes d\'Oren', text: 'Feuillets du mage : il cherchait l\'origine de la rupture.' },
  core_pass: { id: 'core_pass', name: 'Accès au cœur', text: 'Remis par Vaelor. Il ne suffit pas à entrer sans les accords.' },
  lume_drawing: { id: 'lume_drawing', name: 'Dessin de Lume', text: 'Un homme avec une branche. Pas de couronne.' },
  contract_page: { id: 'contract_page', name: 'Page de contrat d\'accueil', text: 'Une copie des contrats proposés à la flotte.' },
};

export interface EquipDef { id: string; name: string; slot: 'arme' | 'protection' | 'talisman'; text: string; strike?: number; def?: number; cost?: number; speed?: number; dodge?: number }
export const EQUIPMENT: Record<string, EquipDef> = {
  baton: { id: 'baton', name: 'Bâton de marche', slot: 'arme', text: 'Prêté à Lisière. Simple et fiable.', strike: 0 },
  lame_veilleur: { id: 'lame_veilleur', name: 'Lame des Veilleurs', slot: 'arme', text: 'Légère, rapide à reprendre.', strike: 2, speed: 0.03 },
  lance_racine: { id: 'lance_racine', name: 'Lance de racine', slot: 'arme', text: 'Plus lourde, plus de dégâts.', strike: 5 },
  gilet_cuir: { id: 'gilet_cuir', name: 'Gilet de cuir', slot: 'protection', text: 'Réduit un peu les dégâts.', def: 0.08 },
  tenue_legere: { id: 'tenue_legere', name: 'Tenue légère', slot: 'protection', text: 'Favorise le déplacement.', speed: 0.06 },
  manteau_epais: { id: 'manteau_epais', name: 'Manteau épais', slot: 'protection', text: 'Limite les dégâts.', def: 0.14 },
  cuirasse_stellaire: { id: 'cuirasse_stellaire', name: 'Cuirasse stellaire légère', slot: 'protection', text: 'Offerte par les civils de l\'Aube Basse.', def: 0.18 },
  pierre_ecoute: { id: 'pierre_ecoute', name: 'Pierre d\'écoute', slot: 'talisman', text: 'Réduit le coût des pouvoirs.', cost: 0.1 },
  amulette_eau: { id: 'amulette_eau', name: 'Amulette d\'eau vive', slot: 'talisman', text: 'Aide la protection.', def: 0.06 },
  cordon_pierre: { id: 'cordon_pierre', name: 'Cordon de pierres', slot: 'talisman', text: 'Esquive plus fréquente.', dodge: 0.12 },
  graine_chance: { id: 'graine_chance', name: 'Graine de Méline', slot: 'talisman', text: 'Un peu de tout, avec modération.', cost: 0.05, def: 0.03 },
  insigne_ilan: { id: 'insigne_ilan', name: 'Insigne de messager', slot: 'talisman', text: 'Pour courir sans s\'épuiser.', speed: 0.05 },
};

export interface UpgradeDef { id: string; orient: 'Gardien' | 'Accordeur' | 'Voyageur'; name: string; text: string }
export const UPGRADES: UpgradeDef[] = [
  { id: 'dmg', orient: 'Gardien', name: 'Peau solide', text: 'Dégâts subis −10 %.' },
  { id: 'heal', orient: 'Gardien', name: 'Soin efficace', text: 'Soin +15 %.' },
  { id: 'dodge', orient: 'Gardien', name: 'Pied léger', text: 'Recharge d\'esquive −10 %.' },
  { id: 'bond', orient: 'Gardien', name: 'Abri durable', text: 'Protection du Lien +20 %.' },
  { id: 'cost', orient: 'Accordeur', name: 'Souffle économe', text: 'Coût des pouvoirs −10 %.' },
  { id: 'pulse', orient: 'Accordeur', name: 'Onde durable', text: 'Onde : effet +15 %.' },
  { id: 'weave', orient: 'Accordeur', name: 'Tissage stable', text: 'Tissage : durée +15 %.' },
  { id: 'veil', orient: 'Accordeur', name: 'Voile durable', text: 'Voile +15 %.' },
  { id: 'sprint', orient: 'Voyageur', name: 'Sprint confortable', text: 'Course +10 %.' },
  { id: 'reach', orient: 'Voyageur', name: 'Aide à l\'interaction', text: 'Portée d\'interaction +15 %.' },
  { id: 'read', orient: 'Voyageur', name: 'Lecture des signes', text: 'Annonces d\'attaque plus lisibles.' },
  { id: 'support', orient: 'Voyageur', name: 'Soutien amélioré', text: 'Intervention : effet +25 %.' },
];

export const TRUST_WORDS = ['Distante', 'Prudente', 'Cordiale', 'Proche', 'Confiante', 'Indéfectible'];
