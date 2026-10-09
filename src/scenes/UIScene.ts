// Interface au-dessus du jeu : HUD, dialogues, choix, fondus, menus. Toutes les méthodes publiques renvoient des promesses.
import Phaser from 'phaser';
import { DEPTH, GAME_H, GAME_W } from '../config';
import { hub, type CombatHudInfo, type UiApi } from '../game';
import { COL, bar, button, fs, panel, text } from '../ui/kit';
import { nameOf } from '../data/characters';
import type { Line, PuzzleDef } from '../core/types';
import { Menus } from '../ui/menus';
import { runPuzzle } from '../ui/puzzle';
import { showFinalChoice, showEpilogue, showCredits } from '../ui/ending';
import { POWERS } from '../data/powers';

export class UIScene extends Phaser.Scene implements UiApi {
  private hpBar!: ReturnType<typeof bar>;
  private enBar!: ReturnType<typeof bar>;
  private hudTexts!: { hp: Phaser.GameObjects.Text; en: Phaser.GameObjects.Text; loc: Phaser.GameObjects.Text };
  private objBox!: Phaser.GameObjects.Container;
  private objText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private promptBg!: Phaser.GameObjects.Rectangle;
  private fadeRect!: Phaser.GameObjects.Rectangle;
  private flashRect!: Phaser.GameObjects.Rectangle;
  private toastBox: { t: Phaser.GameObjects.Text; bg: Phaser.GameObjects.Rectangle }[] = [];
  private dlg!: Phaser.GameObjects.Container;
  private dlgName!: Phaser.GameObjects.Text;
  private dlgText!: Phaser.GameObjects.Text;
  private dlgNameBg!: Phaser.GameObjects.Graphics;
  private dlgMore!: Phaser.GameObjects.Text;
  private hudGroup: Phaser.GameObjects.GameObject[] = [];
  private combatGroup?: Phaser.GameObjects.Container;
  private combatTxt?: Phaser.GameObjects.Text;
  private pauseGroup?: Phaser.GameObjects.Container;
  private chain: Promise<unknown> = Promise.resolve();
  menus!: Menus;
  hudOn = false;
  private lastAdvance = 0;
  private advanceWaiter: (() => void) | null = null;
  private typing: { full: string; shown: number; timer?: Phaser.Time.TimerEvent } | null = null;

  constructor() { super('UI'); }

  create(): void {
    hub.ui = this;
    this.menus = new Menus(this);
    const D = DEPTH.ui;
    // HUD
    const hpBg = panel(this, 10, 8, 230, 54, 0.78).setDepth(D);
    this.hpBar = bar(this, 44, 16, 186, 14, 0xd9534f); this.hpBar.gfx.setDepth(D + 1);
    this.enBar = bar(this, 44, 38, 186, 12, 0x4fa8e8); this.enBar.gfx.setDepth(D + 1);
    const l1 = text(this, 18, 13, 'PV', 13, COL.gold).setDepth(D + 1), l2 = text(this, 18, 35, 'EN', 13, COL.gold).setDepth(D + 1);
    this.hudTexts = {
      hp: text(this, 136, 14, '', 12).setOrigin(0.5, 0).setDepth(D + 2), en: text(this, 136, 35, '', 11).setOrigin(0.5, 0).setDepth(D + 2),
      loc: text(this, GAME_W - 12, 10, '', 15, COL.gold).setOrigin(1, 0).setDepth(D + 1).setStroke('#000', 3),
    };
    this.hudGroup = [hpBg, this.hpBar.gfx, this.enBar.gfx, l1, l2, this.hudTexts.hp, this.hudTexts.en, this.hudTexts.loc];
    // objectif
    const ob = panel(this, 0, 0, 560, 36, 0.8);
    this.objText = text(this, 280, 18, '', 16, COL.gold, 540).setOrigin(0.5);
    this.objBox = this.add.container(200, 8, [ob, this.objText]).setDepth(D).setVisible(false);
    // invite d'interaction
    this.promptBg = this.add.rectangle(GAME_W / 2, GAME_H - 28, 400, 34, 0x0f1620, 0.85).setStrokeStyle(2, COL.edge, 0.8).setDepth(D).setVisible(false);
    this.promptText = text(this, GAME_W / 2, GAME_H - 28, '', 17, COL.text).setOrigin(0.5).setDepth(D + 1).setVisible(false);
    // fondus
    this.fadeRect = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 1).setOrigin(0, 0).setDepth(D + 100);
    this.flashRect = this.add.rectangle(0, 0, GAME_W, GAME_H, 0xffffff, 0).setOrigin(0, 0).setDepth(D + 90);
    // dialogue
    const dbg = panel(this, 0, 0, 920, 150, 0.95);
    this.dlgNameBg = this.add.graphics();
    this.dlgName = text(this, 40, -17, '', 18, COL.gold).setOrigin(0, 0.5);
    this.dlgText = text(this, 24, 18, '', 18, COL.text, 872);
    this.dlgMore = text(this, 892, 126, '▼', 16, COL.gold);
    this.dlg = this.add.container(20, 378, [dbg, this.dlgNameBg, this.dlgName, this.dlgText, this.dlgMore]).setDepth(D + 10).setVisible(false);
    // entrées
    const kb = this.input.keyboard!;
    const adv = () => this.advance();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (p.leftButtonDown()) adv(); });
    for (const k of ['E', 'SPACE', 'ENTER']) kb.on(`keydown-${k}`, adv);
    kb.on('keydown-ESC', () => { if (!hub.locked || this.menus.isOpen('')) this.menus.toggle('pause'); });
    kb.on('keydown-J', () => { if (!hub.locked) this.menus.toggle('journal'); else if (this.menus.isOpen('journal')) this.menus.close(); });
    kb.on('keydown-I', () => { if (!hub.locked) this.menus.toggle('inventory'); else if (this.menus.isOpen('inventory')) this.menus.close(); });
    kb.on('keydown-M', () => { if (!hub.locked) this.menus.toggle('map'); else if (this.menus.isOpen('map')) this.menus.close(); });
    this.setHud(false);
    this.fadeRect.setAlpha(1);
    hub.events.emit('ui-ready');
  }

  update(): void {
    if (!this.hudOn) return;
    const h = hub.state.hero;
    this.hpBar.set(h.hp, h.maxHp); this.enBar.set(h.energy, h.maxEnergy);
    this.hudTexts.hp.setText(`${Math.ceil(h.hp)} / ${h.maxHp}`);
    this.hudTexts.en.setText(`${Math.ceil(h.energy)} / ${h.maxEnergy}`);
    this.hudTexts.loc.setText(hub.locations.get(hub.state.location.loc)?.name ?? '');
    // énergie hors combat
    const w = hub.world;
    if (w && !w.combat.active && !hub.locked) h.energy = Math.min(h.maxEnergy, h.energy + 12 * (this.game.loop.delta / 1000) * 0.3);
  }

  /** Remet l'interface à zéro (chargement d'une partie, retour au titre). */
  reset(): void {
    this.advanceWaiter = null;
    this.typing?.timer?.remove(); this.typing = null;
    this.dlg.setVisible(false);
    this.chain = Promise.resolve();
    this.menus.close();
    this.combatHud(null);
    this.pauseOverlay(false);
    this.objective(null); this.prompt(null);
    hub.uiLock = 0;
  }

  setHud(v: boolean): void { this.hudOn = v; for (const o of this.hudGroup) (o as unknown as { setVisible(v: boolean): void }).setVisible(v); }

  // ------------------------------------------------------------- petits éléments
  objective(t: string | null): void { this.objBox.setVisible(!!t && this.hudOn); if (t) this.objText.setText(t); }
  prompt(t: string | null): void {
    this.promptBg.setVisible(!!t && !hub.locked); this.promptText.setVisible(!!t && !hub.locked);
    if (t) { this.promptText.setText(t); this.promptBg.width = Math.max(220, this.promptText.width + 40); }
  }

  toast(t: string): void {
    const y = 56 + this.toastBox.length * 36;
    const tx = text(this, GAME_W / 2, y, t, 16, COL.text, 700).setOrigin(0.5, 0.5).setDepth(DEPTH.ui + 50).setAlpha(0);
    const bg = this.add.rectangle(GAME_W / 2, y, Math.min(740, tx.width + 36), tx.height + 14, 0x0f1620, 0.9).setStrokeStyle(2, COL.edge, 0.8).setDepth(DEPTH.ui + 49).setAlpha(0);
    const item = { t: tx, bg };
    this.toastBox.push(item);
    this.tweens.add({ targets: [tx, bg], alpha: 1, duration: 160 });
    this.time.delayedCall(2800, () => {
      this.tweens.add({ targets: [tx, bg], alpha: 0, duration: 300, onComplete: () => { tx.destroy(); bg.destroy(); this.toastBox = this.toastBox.filter((x) => x !== item); } });
    });
  }

  fade(out: boolean, ms = 300): Promise<void> {
    return new Promise((resolve) => { this.tweens.add({ targets: this.fadeRect, alpha: out ? 1 : 0, duration: ms, onComplete: () => resolve() }); });
  }
  flash(ms = 400): void { this.flashRect.setAlpha(0.95); this.tweens.add({ targets: this.flashRect, alpha: 0, duration: ms }); }

  async titleCard(t: string, ms = 2400): Promise<void> {
    const tx = text(this, GAME_W / 2, GAME_H / 2, t, 38, COL.gold, 820).setOrigin(0.5).setAlign('center').setDepth(DEPTH.ui + 120).setAlpha(0);
    this.tweens.add({ targets: tx, alpha: 1, duration: 600 });
    await new Promise((r) => setTimeout(r, ms));
    await new Promise<void>((r) => this.tweens.add({ targets: tx, alpha: 0, duration: 600, onComplete: () => { tx.destroy(); r(); } }));
  }

  // ------------------------------------------------------------------ dialogues
  private advance(): void {
    const now = this.time.now;
    if (now - this.lastAdvance < 120) return;
    this.lastAdvance = now;
    if (this.typing) { this.finishTyping(); return; }
    const w = this.advanceWaiter;
    if (w) { this.advanceWaiter = null; w(); }
  }

  private finishTyping(): void {
    if (!this.typing) return;
    this.typing.timer?.remove();
    this.dlgText.setText(this.typing.full);
    this.typing = null;
    this.dlgMore.setVisible(true);
  }

  say(lines: Line[]): Promise<void> {
    const job = this.chain.then(async () => {
      hub.lock();
      this.prompt(null);
      this.dlg.setVisible(true);
      for (const ln of lines) {
        const who = ln.narr ? '' : nameOf(ln.who);
        this.dlgName.setText(who);
        this.dlgNameBg.clear();
        if (who) {
          this.dlgNameBg.fillStyle(COL.panel, 1).fillRoundedRect(24, -35, this.dlgName.width + 32, 34, 8).lineStyle(2, COL.edge, 0.9).strokeRoundedRect(24, -35, this.dlgName.width + 32, 34, 8);
        }
        this.dlgText.setStyle({ fontStyle: ln.narr ? 'italic' : 'normal', color: ln.narr ? COL.dim : COL.text, fontSize: fs(18) });
        this.dlgMore.setVisible(false);
        this.dlgText.setText('');
        hub.state.seenLines.push(`${who ? who + ' : ' : ''}${ln.text}`);
        if (hub.state.seenLines.length > 120) hub.state.seenLines.shift();
        const speed = Math.max(10, hub.options.textSpeed);
        this.typing = { full: ln.text, shown: 0 };
        const t = this.typing;
        t.timer = this.time.addEvent({ delay: 1000 / speed, repeat: ln.text.length, callback: () => {
          if (this.typing !== t) return;
          t.shown++;
          this.dlgText.setText(ln.text.slice(0, t.shown));
          if (t.shown >= ln.text.length) { this.typing = null; this.dlgMore.setVisible(true); }
        } });
        this.lastAdvance = this.time.now;
        await new Promise<void>((r) => { this.advanceWaiter = r; });
      }
      this.dlg.setVisible(false);
      hub.unlock();
    });
    this.chain = job.catch(() => undefined);
    return job;
  }

  choose(prompt: string | undefined, labels: string[]): Promise<number> {
    const job = this.chain.then(() => new Promise<number>((resolve) => {
      hub.lock();
      this.prompt(null);
      const D = DEPTH.ui + 20;
      const items: { destroy(): void }[] = [];
      const objs: Phaser.GameObjects.GameObject[] = [];
      const h = 70 + labels.length * 50;
      const y0 = Math.max(60, 400 - h);
      const bg = panel(this, 150, y0, 660, h, 0.96).setDepth(D); objs.push(bg);
      if (prompt) objs.push(text(this, 480, y0 + 20, prompt, 17, COL.gold, 620).setOrigin(0.5, 0).setAlign('center').setDepth(D + 1));
      const t0 = this.time.now;
      let done = false;
      const pick = (i: number) => {
        if (done || this.time.now - t0 < 300) return;
        done = true;
        for (const o of objs) o.destroy();
        for (const b of items) b.destroy();
        this.input.keyboard!.off('keydown', onKey);
        hub.unlock();
        resolve(i);
      };
      const onKey = (e: KeyboardEvent) => { const n = Number(e.key); if (n >= 1 && n <= labels.length) pick(n - 1); };
      labels.forEach((l, i) => {
        const b = button(this, 170, y0 + 50 + i * 50 + (prompt ? 16 : 0), 620, 42, `${i + 1}.  ${l}`, () => pick(i), 17);
        b.box.setDepth(D + 1); b.label.setDepth(D + 2);
        items.push(b);
      });
      this.input.keyboard!.on('keydown', onKey);
    }));
    this.chain = job.then(() => undefined, () => undefined);
    return job;
  }

  confirm(t: string, yes: string, no: string): Promise<boolean> {
    return new Promise((resolve) => {
      hub.lock();
      const D = DEPTH.ui + 60;
      const objs: Phaser.GameObjects.GameObject[] = [];
      const shade = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.6).setOrigin(0, 0).setDepth(D).setInteractive();
      objs.push(shade, panel(this, 180, 150, 600, 240, 0.97).setDepth(D + 1), text(this, 480, 210, t, 19, COL.text, 540).setOrigin(0.5, 0).setAlign('center').setDepth(D + 2));
      const close = (v: boolean) => { for (const o of objs) o.destroy(); by.destroy(); bn.destroy(); hub.unlock(); resolve(v); };
      const by = button(this, 210, 330, 260, 44, yes, () => close(true)); const bn = button(this, 490, 330, 260, 44, no, () => close(false));
      for (const b of [by, bn]) { b.box.setDepth(D + 2); b.label.setDepth(D + 3); }
    });
  }

  // ------------------------------------------------------------------- énigmes & fins
  puzzle(def: PuzzleDef): Promise<void> { return runPuzzle(this, def); }
  finalChoice(): Promise<'A' | 'B'> { return showFinalChoice(this); }
  epilogue(e: 'A' | 'B'): Promise<void> { return showEpilogue(this, e); }
  credits(e: 'A' | 'B'): Promise<void> { return showCredits(this, e); }
  restMenu(): Promise<void> { return this.menus.rest(); }
  openMenu(kind: 'pause' | 'journal' | 'inventory' | 'map'): void { this.menus.toggle(kind); }

  // ------------------------------------------------------------------- combat
  combatHud(info: CombatHudInfo | null): void {
    if (!info) { this.combatGroup?.destroy(); this.combatGroup = undefined; this.combatTxt = undefined; return; }
    if (!this.combatGroup) {
      const bg = panel(this, 0, 0, 330, 120, 0.8);
      this.combatTxt = text(this, 12, 8, '', 14, COL.text, 310);
      this.combatGroup = this.add.container(10, 70, [bg, this.combatTxt]).setDepth(DEPTH.ui);
    }
    const p = (id: string | null, cd: number) => id ? `${POWERS[id].name}${cd > 0 ? ` (${cd.toFixed(0)}s)` : ''}` : '—';
    const lines = [
      ...info.enemies.map((e) => `${e.name} : ${Math.max(0, Math.ceil(e.hp))}/${e.max}`),
      `[Clic] frapper  [Espace] esquive${info.cooldowns.dodge > 0 ? ` (${info.cooldowns.dodge.toFixed(1)}s)` : ''}`,
      `[1] ${p(info.powers[0], info.cooldowns.p1)}  [2] ${p(info.powers[1], info.cooldowns.p2)}  clic droit : pouvoir 1`,
      `[R] ${info.support ? 'intervention de ' + nameOf(info.support) : 'pas de soutien'}${info.supportReady ? '' : ' (utilisée)'}  [F] soin  [Tab] pause`,
    ];
    this.combatTxt!.setText(lines.join('\n'));
  }

  pauseOverlay(on: boolean): void {
    this.pauseGroup?.destroy(); this.pauseGroup = undefined;
    if (!on) return;
    const w = hub.world!;
    const D = DEPTH.ui + 30;
    const objs: Phaser.GameObjects.GameObject[] = [];
    objs.push(this.add.rectangle(0, 0, GAME_W, GAME_H, 0x061018, 0.55).setOrigin(0, 0));
    objs.push(panel(this, 230, 90, 500, 360, 0.95));
    objs.push(text(this, 480, 106, 'Pause de réflexion', 24, COL.gold).setOrigin(0.5, 0));
    const info = w.combat.enemyInfo();
    objs.push(text(this, 250, 150, info.map((e) => `${e.name} — ${e.hp}/${e.max}\n   ${e.note}`).join('\n') || 'Aucun adversaire.', 14, COL.text, 460));
    const acts = w.combat.actions();
    const btns = acts.map((a, i) => { const b = button(this, 250, 300 + i * 38, 460, 32, a.label, () => { if (a.ok) a.run(); }, 14); b.setEnabled(a.ok); return b; });
    const resume = button(this, 250, 300 + acts.length * 38, 460, 34, 'Reprendre (Tab)', () => w.combat.togglePause(), 15);
    this.pauseGroup = this.add.container(0, 0, objs).setDepth(D);
    (this.pauseGroup as unknown as { _b: unknown })._b = [btns, resume];
    const orig = this.pauseGroup.destroy.bind(this.pauseGroup);
    this.pauseGroup.destroy = (...a: unknown[]) => { btns.forEach((b) => b.destroy()); resume.destroy(); orig(...(a as [])); };
    btns.forEach((b) => { b.box.setDepth(D + 1); b.label.setDepth(D + 2); }); resume.box.setDepth(D + 1); resume.label.setDepth(D + 2);
  }

  gameOver(): Promise<'retry' | 'load'> {
    return new Promise((resolve) => {
      hub.lock();
      const D = DEPTH.ui + 70;
      const objs: Phaser.GameObjects.GameObject[] = [];
      objs.push(this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.7).setOrigin(0, 0).setDepth(D).setInteractive());
      objs.push(text(this, 480, 170, 'Elyan est à terre…', 34, COL.gold).setOrigin(0.5).setDepth(D + 1));
      objs.push(text(this, 480, 215, 'La rencontre reprend à zéro ; rien n\'est perdu.', 16, COL.dim).setOrigin(0.5).setDepth(D + 1));
      const fin = (v: 'retry' | 'load') => { for (const o of objs) o.destroy(); b1.destroy(); b2.destroy(); hub.unlock(); resolve(v); };
      const b1 = button(this, 300, 270, 360, 46, 'Recommencer la rencontre', () => fin('retry'));
      const b2 = button(this, 300, 330, 360, 46, 'Reprendre la dernière sauvegarde', () => fin('load'));
      for (const b of [b1, b2]) { b.box.setDepth(D + 1); b.label.setDepth(D + 2); }
    });
  }
}
