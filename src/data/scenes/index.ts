import type { SceneDef } from '../../core/types';

// TEMPORAIRE (lot 1) : scène témoin.
export const SCENES: SceneDef[] = [
  {
    id: 'P01', chapter: 0, title: 'Scène témoin', loc: 'forest_arrival', spawn: 'start',
    actors: [{ id: 'nara', at: 'center' }],
    steps: [
      { t: 'say', lines: [{ who: 'narr', narr: true, text: 'Scène témoin : déplacement, collision, profondeur, dialogue.' }, { who: 'nara', text: 'Regarde ce qui tient encore.' }] },
      { t: 'talk', text: 'Parler à Nara', npc: 'nara', lines: [{ who: 'nara', text: 'Ton nom ?' }], choices: [{ label: 'Je ne sais pas.', set: { key: 'answer', value: 'unknown' } }, { label: 'Je viens d\'un village lointain.', set: { key: 'answer', value: 'lie' } }] },
      { t: 'reach', text: 'Aller vers l\'est', zone: 'exit_east' },
    ],
    next: null,
  },
];
