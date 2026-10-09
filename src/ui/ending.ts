// Choix final, épilogues et crédits.
import Phaser from 'phaser';
import { DEPTH, GAME_H, GAME_W } from '../config';
import { hub } from '../game';
import { COL, button, panel, text } from './kit';
import { buildEpilogue } from '../data/epilogues';
import { CREDITS } from '../data/credits';

export function showFinalChoice(s: Phaser.Scene): Promise<'A' | 'B'> {
  return new Promise((resolve) => {
    hub.lock();
    const D = DEPTH.ui + 80;
    const objs: { destroy(): void }[] = [];
    const add = <T extends { destroy(): void }>(o: T): T => { objs.push(o); return o; };
    const clear = () => { for (const o of objs.splice(0)) o.destroy(); };
    const A = 'Rompre la Couronne : libérer Eïra, protéger les communautés et accepter la disparition d\'Elyan.';
    const B = 'Refermer la Couronne : préserver Elyan et sa lignée, livrer les chemins de résistance et maintenir Eïra captive.';
    const show = () => {
      clear();
      add(s.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.78).setOrigin(0, 0).setDepth(D).setInteractive());
      add(text(s, 480, 70, 'Deux gestes', 34, COL.gold).setOrigin(0.5, 0).setDepth(D + 1));
      add(text(s, 480, 120, 'Ce choix est le vôtre. Aucun score caché ne le remplace.', 16, COL.dim).setOrigin(0.5, 0).setDepth(D + 1));
      for (const [i, [route, label]] of ([['A', A], ['B', B]] as const).entries()) {
        const b = button(s, 120, 190 + i * 130, 720, 100, label, () => confirm(route as 'A' | 'B'), 20);
        b.box.setDepth(D + 1); b.label.setDepth(D + 2); add(b);
      }
    };
    const confirm = (route: 'A' | 'B') => {
      clear();
      add(s.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.85).setOrigin(0, 0).setDepth(D).setInteractive());
      add(panel(s, 120, 120, 720, 300, 0.98).setDepth(D + 1));
      add(text(s, 480, 150, route === 'A' ? A : B, 21, COL.text, 640).setOrigin(0.5, 0).setAlign('center').setDepth(D + 2));
      add(text(s, 480, 280, 'Les scènes précédentes restent terminées. La sauvegarde du seuil permettra de voir l\'autre fin.', 15, COL.dim, 620).setOrigin(0.5, 0).setAlign('center').setDepth(D + 2));
      const ok = button(s, 150, 350, 300, 46, 'Accomplir ce geste', () => { clear(); hub.unlock(); resolve(route); });
      const back = button(s, 510, 350, 300, 46, 'Revenir à la réflexion', show);
      for (const b of [ok, back]) { b.box.setDepth(D + 2); b.label.setDepth(D + 3); add(b); }
    };
    show();
  });
}

export async function showEpilogue(s: Phaser.Scene, route: 'A' | 'B'): Promise<void> {
  const paras = buildEpilogue(hub.state, route);
  const D = DEPTH.ui + 95;
  for (let i = 0; i < paras.length; i++) {
    const bg = s.add.rectangle(0, 0, GAME_W, GAME_H, 0x05080c, 1).setOrigin(0, 0).setDepth(D);
    const t = text(s, 480, 270, paras[i], 21, COL.text, 700).setOrigin(0.5).setAlign('center').setDepth(D + 1).setAlpha(0);
    const hint = text(s, 480, 510, `${i + 1} / ${paras.length} — cliquer ou E pour continuer`, 13, COL.dim).setOrigin(0.5).setDepth(D + 1);
    s.tweens.add({ targets: t, alpha: 1, duration: 700 });
    await new Promise<void>((r) => { const go = () => { s.input.off('pointerdown', go); s.input.keyboard!.off('keydown-E', go); s.input.keyboard!.off('keydown-SPACE', go); r(); }; s.time.delayedCall(500, () => { s.input.on('pointerdown', go); s.input.keyboard!.on('keydown-E', go); s.input.keyboard!.on('keydown-SPACE', go); }); });
    bg.destroy(); t.destroy(); hint.destroy();
  }
}

export async function showCredits(s: Phaser.Scene, route: 'A' | 'B'): Promise<void> {
  const D = DEPTH.ui + 96;
  const bg = s.add.rectangle(0, 0, GAME_W, GAME_H, 0x03060a, 1).setOrigin(0, 0).setDepth(D);
  const body = [route === 'A' ? 'Fin A — Un monde qui respire' : 'Fin B — L\'héritier des étoiles', '', ...CREDITS.flatMap((c) => [c.title, ...c.lines, ''])].join('\n');
  const t = text(s, 480, GAME_H + 20, body, 22, COL.text, 700).setOrigin(0.5, 0).setAlign('center').setDepth(D + 1).setLineSpacing(10);
  const done = new Promise<void>((r) => { s.tweens.add({ targets: t, y: -t.height - 40, duration: Math.max(18000, t.height * 28), onComplete: () => r() }); const skip = () => r(); s.time.delayedCall(1500, () => s.input.once('pointerdown', skip)); });
  await done;
  t.destroy(); bg.destroy();
}
