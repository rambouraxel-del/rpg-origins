// Petits éléments d'interface natifs (aucune image) : panneaux, boutons, textes.
import Phaser from 'phaser';
import { hub } from '../game';
import { audio } from '../systems/Audio';

export const FONT = 'Georgia, "Times New Roman", serif';
export const COL = { panel: 0x0f1620, edge: 0xc9a45a, text: '#f4ecd8', dim: '#a9a28c', gold: '#ffd98a', good: '#9ae6a4', bad: '#ff9a8a', hl: 0x24344a, btn: 0x1c2a3c, btnHi: 0x2c4468 };

export const fs = (n: number) => `${Math.round(n * hub.options.textSize / 18)}px`;

export function panel(s: Phaser.Scene, x: number, y: number, w: number, h: number, alpha = 0.94): Phaser.GameObjects.Graphics {
  const g = s.add.graphics();
  g.fillStyle(COL.panel, alpha).fillRoundedRect(x, y, w, h, 12);
  g.lineStyle(2, COL.edge, 0.9).strokeRoundedRect(x, y, w, h, 12);
  return g;
}

export function text(s: Phaser.Scene, x: number, y: number, str: string, size = 18, color: string = COL.text, wrap?: number, o: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.GameObjects.Text {
  return s.add.text(x, y, str, { fontFamily: FONT, fontSize: fs(size), color, wordWrap: wrap ? { width: wrap } : undefined, lineSpacing: 4, ...o });
}

/** Registre des boutons affichés : sert aux tests de bout en bout (clic par libellé), jamais au jeu lui-même. */
export interface RegBtn { label: () => string; cb: () => void; box: Phaser.GameObjects.Rectangle; enabled: () => boolean }
export const BUTTONS = new Set<RegBtn>();

export interface Btn { box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text; destroy(): void; setEnabled(v: boolean): void; setLabel(t: string): void }

export function button(s: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, cb: () => void, size = 17): Btn {
  const box = s.add.rectangle(x, y, w, h, COL.btn).setOrigin(0, 0).setStrokeStyle(2, COL.edge, 0.8).setInteractive({ useHandCursor: true });
  const lab = text(s, x + w / 2, y + h / 2, label, size, COL.text, w - 12).setOrigin(0.5).setAlign('center');
  let enabled = true;
  const reg: RegBtn = { label: () => lab.text, cb, box, enabled: () => enabled };
  BUTTONS.add(reg);
  box.on('pointerover', () => enabled && box.setFillStyle(COL.btnHi));
  box.on('pointerout', () => box.setFillStyle(COL.btn));
  box.on('pointerdown', () => { if (enabled) { audio.start(); audio.click(); cb(); } });
  return {
    box, label: lab,
    destroy() { BUTTONS.delete(reg); box.destroy(); lab.destroy(); },
    setEnabled(v: boolean) { enabled = v; lab.setAlpha(v ? 1 : 0.4); box.setAlpha(v ? 1 : 0.6); },
    setLabel(t: string) { lab.setText(t); },
  };
}

export function bar(s: Phaser.Scene, x: number, y: number, w: number, h: number, color: number): { set(v: number, max: number): void; destroy(): void; gfx: Phaser.GameObjects.Graphics } {
  const g = s.add.graphics();
  return {
    gfx: g,
    set(v: number, max: number) {
      g.clear();
      g.fillStyle(0x000000, 0.6).fillRoundedRect(x, y, w, h, 4);
      g.fillStyle(color, 1).fillRoundedRect(x + 1, y + 1, Math.max(0, (w - 2) * Math.min(1, v / max)), h - 2, 3);
      g.lineStyle(1, 0xffffff, 0.35).strokeRoundedRect(x, y, w, h, 4);
    },
    destroy() { g.destroy(); },
  };
}

/** Téléchargement d'un fichier texte (export de sauvegarde). */
export function downloadText(name: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/** Choix d'un fichier texte (import de sauvegarde). */
export function pickTextFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files?.[0];
      if (!f) { resolve(null); return; }
      const r = new FileReader();
      r.onload = () => resolve(String(r.result ?? ''));
      r.onerror = () => resolve(null);
      r.readAsText(f);
    };
    inp.click();
  });
}
