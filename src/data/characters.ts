export { CHARS, COMPANIONS } from './chardefs';
export type { CharDef, CharSheet } from './chardefs';
import { CHARS } from './chardefs';
import { hub } from '../game';
/** Nom affiché : le héros est « Le prince » au prologue, « L'Étranger » jusqu'à C06S02, puis « Elyan ». */
export const nameOf = (id: string): string => {
  if (id === 'elyan') {
    const s = hub.state;
    return s.flags.identity_known ? 'Elyan' : s.chapter === 0 ? 'Le prince' : "L'Étranger";
  }
  return CHARS[id]?.name ?? id;
};
