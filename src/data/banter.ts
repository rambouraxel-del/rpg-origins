// Répliques ambiantes des compagnons quand on leur parle hors scène (par chapitre). Aucune révélation anticipée.
import type { GameState } from '../core/state';
import type { CompanionId } from '../core/types';

const B: Record<CompanionId, { upTo: number; lines: string[] }[]> = {
  nara: [
    { upTo: 2, lines: ['Regarde ce qui tient encore. Le reste attendra.', 'Tu marches mieux qu\'hier. Ne force pas.'] },
    { upTo: 5, lines: ['Ilan sait se débrouiller. C\'est ce que je me répète.', 'Un sentier sûr et un sentier rassurant, ce n\'est pas la même chose.'] },
    { upTo: 10, lines: ['Je ne vais pas te dire que tout ira bien. Je te dis que je suis là.', 'Regarde ce qui tient encore.'] },
  ],
  soren: [
    { upTo: 3, lines: ['Ce n\'est pas encore une preuve.', 'Je note tout. On verra ce que cela dit.'] },
    { upTo: 7, lines: ['J\'ai relu le contrat d\'accueil. Il ne dit pas ce qu\'ils prétendent.', 'Une archive peut mentir par ses silences.'] },
    { upTo: 10, lines: ['Je garde de la place dans le carnet. Pour ceux qui n\'ont pas parlé.', 'Un nom n\'est pas tout ce qu\'une vie laisse.'] },
  ],
  tessa: [
    { upTo: 4, lines: ['Un circuit n\'a pas de conscience. Ceux qui le ferment, si.', 'Ma mère dirait que je réfléchis trop fort. Elle aurait raison.'] },
    { upTo: 8, lines: ['Chaque machine ici parle de ce qu\'on lui a demandé de taire.', 'Je mesure, je compare. Ensuite je décide.'] },
    { upTo: 10, lines: ['Tu peux avoir peur. Ce n\'est pas une faute.', 'Je veux qu\'elle sache où me chercher.'] },
  ],
};

export function bannerFor(who: CompanionId, s: GameState): string[] {
  const table = B[who];
  const band = table.find((b) => s.chapter <= b.upTo) ?? table[table.length - 1];
  const i = Math.floor(s.playMs / 4000) % band.lines.length;
  return [band.lines[i]];
}
