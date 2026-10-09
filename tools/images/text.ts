// Comparaison de textes très simple (mots significatifs, indice de Jaccard).
const STOP = new Set(['avec', 'dans', 'pour', 'sans', 'vers', 'cette', 'that', 'with', 'from', 'this', 'into', 'sont', 'plus', 'tres', 'very', 'game', 'jeu']);

export const words = (s: string): Set<string> =>
  new Set(s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP.has(w)));

export function similarity(a: string, b: string): number {
  const A = words(a), B = words(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}
