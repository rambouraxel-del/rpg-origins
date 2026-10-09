// Les sept pouvoirs (bible §5.1) et leur version de combat (règles §6).
export interface PowerDef { id: string; name: string; chapter: number; explore: string; combatText: string; combat: boolean; cost: number; cooldown: number }
export const POWERS: Record<string, PowerDef> = {
  listen: { id: 'listen', name: 'Écoute', chapter: 1, explore: 'Percevoir les réponses proches d\'un puits, identifier une blessure.', combatText: 'Marque le point d\'alimentation d\'un adversaire : prochain coup doublé.', combat: true, cost: 20, cooldown: 6 },
  weave: { id: 'weave', name: 'Tissage', chapter: 2, explore: 'Réunir brièvement racines, pierres marquées et supports existants.', combatText: 'Immobilise brièvement près d\'un appui compatible.', combat: true, cost: 25, cooldown: 8 },
  flow: { id: 'flow', name: 'Accord des eaux', chapter: 3, explore: 'Réorienter un flux entre canaux ou ouvrir une conduite.', combatText: 'Refroidit une machine ou modifie un circuit si de l\'eau est présente.', combat: true, cost: 25, cooldown: 9 },
  veil: { id: 'veil', name: 'Voile', chapter: 4, explore: 'Réduire la détection pendant une courte traversée (touche V).', combatText: 'Réduit momentanément le ciblage.', combat: true, cost: 20, cooldown: 8 },
  pulse: { id: 'pulse', name: 'Onde', chapter: 5, explore: 'Désynchroniser un verrou artificiel identifié.', combatText: 'Interrompt et fragilise une machine.', combat: true, cost: 25, cooldown: 8 },
  echo: { id: 'echo', name: 'Rémanence', chapter: 6, explore: 'Relire un souvenir local déjà accessible et comparer deux traces.', combatText: 'Montre la prochaine fenêtre de frappe des adversaires.', combat: true, cost: 20, cooldown: 10 },
  bond: { id: 'bond', name: 'Lien', chapter: 7, explore: 'Coordonner les accords et créer un abri consenti.', combatText: 'Protection courte du groupe.', combat: true, cost: 30, cooldown: 10 },
};
