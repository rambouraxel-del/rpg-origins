// Mini-éditeur de zones : export, modification, réimport sans perte (contrôle automatique).
import { launch, ev, sleep } from './lib.mjs';
const { browser, page, logs } = await launch({ url: `${process.env.E2E_BASE ?? 'http://127.0.0.1:4173'}/?dev=1&jump=C01S03` });
await sleep(6500);
const r = await ev(page, async () => {
  const w = window.__hub.world; const ed = w.editor;
  if (!ed) return { err: "éditeur absent (mode ?dev=1 requis)" };
  const before = JSON.stringify(ed.export());
  const snapshot = JSON.parse(before);
  // modification : ajoute une zone de marche, un obstacle, une ancre, une zone nommée
  w.loc.walk.push({ x: 5, y: 5, w: 20, h: 20 }); (w.loc.blocks ??= []).push({ x: 7, y: 7, w: 5, h: 5 }); w.loc.anchors.test_ancre = { x: 9, y: 9 }; w.loc.features.test_zone = { x: 1, y: 1, w: 2, h: 2 };
  const modified = JSON.stringify(ed.export());
  ed.importData(snapshot);
  const after = JSON.stringify(ed.export());
  return { identiqueApresReimport: before === after, differeApresModification: before !== modified, taille: before.length };
});
console.log(JSON.stringify(r));
console.log(logs.filter((l) => !/GPU/.test(l)).join('\n') || 'aucune erreur console');
await browser.close();
process.exit(r.identiqueApresReimport && r.differeApresModification ? 0 : 1);
