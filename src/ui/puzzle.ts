// Interface des énigmes : quatre mécanismes génériques décrits par des données (pick, set, valves, order).
import Phaser from 'phaser';
import { DEPTH, GAME_H, GAME_W } from '../config';
import { hub } from '../game';
import type { PuzzleDef } from '../core/types';
import { COL, bar, button, panel, text } from './kit';

export function runPuzzle(s: Phaser.Scene, def: PuzzleDef): Promise<void> {
  return new Promise((resolve) => {
    hub.lock();
    const D = DEPTH.ui + 40;
    const objs: ({ destroy(): void })[] = [];
    const add = <T extends { destroy(): void }>(o: T): T => { objs.push(o); return o; };
    add(s.add.rectangle(0, 0, GAME_W, GAME_H, 0x061018, 0.7).setOrigin(0, 0).setDepth(D).setInteractive());
    add(panel(s, 90, 30, 780, 480, 0.97).setDepth(D + 1));
    add(text(s, 480, 44, def.title, 26, COL.gold).setOrigin(0.5, 0).setDepth(D + 2));
    add(text(s, 120, 84, def.prompt, 16, COL.text, 720).setDepth(D + 2));
    const info = add(text(s, 120, 400, '', 15, COL.gold, 720).setDepth(D + 2));
    const setInfo = (t: string, color: string = COL.gold) => info.setText(t).setColor(color);
    let hintN = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      setInfo(def.success, COL.good);
      s.time.delayedCall(1300, () => { for (const o of objs) o.destroy(); hub.unlock(); resolve(); });
    };
    const fail = () => setInfo(def.fail, COL.bad);

    const hintBtn = add(button(s, 120, 450, 190, 38, 'Aide (rappel)', () => {
      const labels = ['Rappel du but', 'Indication de la contrainte', 'Suggestion de la prochaine action'];
      if (hintN < 3) hintN++;
      setInfo(`${labels[hintN - 1]} : ${def.hints[hintN - 1]}`);
      hintBtn.setLabel(hintN < 3 ? `Aide (${hintN}/3)` : 'Aide (3/3)');
    }));
    hintBtn.box.setDepth(D + 2); hintBtn.label.setDepth(D + 3);

    const deco = (b: { box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }) => { b.box.setDepth(D + 2); b.label.setDepth(D + 3); return b; };

    if (def.kind === 'pick' || def.kind === 'set') {
      const sel = new Set<string>();
      const btns = def.options.map((o, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const b = add(button(s, 120 + col * 370, 170 + row * 70, 350, 58, o.label, () => {
          if (finished) return;
          if (def.kind === 'pick') sel.clear();
          if (sel.has(o.id)) sel.delete(o.id); else sel.add(o.id);
          btns.forEach((x, j) => x.box.setFillStyle(sel.has(def.options[j].id) ? COL.btnHi : COL.btn));
          setInfo(sel.size ? def.options.filter((q) => sel.has(q.id)).map((q) => `${q.label} : ${q.clue}`).join('\n') : '');
        }, 16));
        deco(b);
        return b;
      });
      const ok = add(button(s, 650, 450, 190, 38, 'Valider', () => {
        if (finished) return;
        const good = def.kind === 'pick' ? sel.size === 1 && sel.has(def.solution) : sel.size === def.solution.length && def.solution.every((x) => sel.has(x));
        if (good) finish(); else { fail(); sel.clear(); btns.forEach((x) => x.box.setFillStyle(COL.btn)); }
      }));
      deco(ok);
    } else if (def.kind === 'valves') {
      const lv: Record<string, number> = Object.fromEntries(def.basins.map((b) => [b.id, 0]));
      const bars: ReturnType<typeof bar>[] = [];
      const lbl: Phaser.GameObjects.Text[] = [];
      const supplyTxt = add(text(s, 120, 132, '', 16, COL.gold).setDepth(D + 2));
      const refresh = () => {
        const used = Object.values(lv).reduce((a, b) => a + b, 0);
        supplyTxt.setText(`Débit disponible : ${def.supply - used} / ${def.supply}`);
        def.basins.forEach((b, i) => { bars[i].set(lv[b.id], b.max); lbl[i].setText(`${b.label} : ${lv[b.id]}`); });
      };
      def.basins.forEach((b, i) => {
        const y = 175 + i * 66;
        lbl.push(add(text(s, 120, y, '', 17, COL.text).setDepth(D + 2)));
        const br = bar(s, 330, y + 4, 300, 22, 0x4fa8e8); br.gfx.setDepth(D + 2); objs.push(br); bars.push(br);
        deco(add(button(s, 650, y - 2, 46, 34, '−', () => { if (!finished && lv[b.id] > 0) { lv[b.id]--; refresh(); } })));
        deco(add(button(s, 704, y - 2, 46, 34, '+', () => { const used = Object.values(lv).reduce((a, c) => a + c, 0); if (!finished && lv[b.id] < b.max && used < def.supply) { lv[b.id]++; refresh(); } })));
      });
      refresh();
      deco(add(button(s, 650, 450, 190, 38, 'Ouvrir les vannes', () => {
        if (finished) return;
        const good = def.basins.every((b) => lv[b.id] >= b.min && lv[b.id] <= b.max);
        if (good) finish(); else { fail(); for (const b of def.basins) lv[b.id] = 0; refresh(); }
      })));
    } else if (def.kind === 'order') {
      const seq: string[] = [];
      const seqTxt = add(text(s, 120, 360, 'Ordre choisi : —', 16, COL.text, 720).setDepth(D + 2));
      def.options.forEach((o, i) => {
        deco(add(button(s, 120 + (i % 2) * 370, 150 + Math.floor(i / 2) * 62, 350, 52, o.label, () => {
          if (finished || seq.includes(o.id)) return;
          seq.push(o.id);
          seqTxt.setText(`Ordre choisi : ${seq.map((id) => def.options.find((q) => q.id === id)!.label).join(' → ')}`);
          if (seq.length === def.solution.length) {
            if (def.solution.every((x, j) => seq[j] === x)) finish(); else { fail(); seq.length = 0; seqTxt.setText('Ordre choisi : —'); }
          }
        })));
      });
      deco(add(button(s, 650, 450, 190, 38, 'Recommencer', () => { seq.length = 0; seqTxt.setText('Ordre choisi : —'); setInfo(''); })));
    }
    void GAME_H;
  });
}
