// Infiltration : zones de détection visibles qui patrouillent ; le Voile (V) permet de passer. Une détection ramène au point sûr.
import Phaser from 'phaser';
import { DEPTH } from '../config';
import { hub } from '../game';
import type { Pt, Step } from '../core/types';
import type { WorldScene } from '../scenes/WorldScene';

type StealthStep = Extract<Step, { t: 'stealth' }>;

export class Stealth {
  private cur: StealthStep | null = null;
  private pos: { x: number; y: number; seg: number; t: number }[] = [];
  private gfx: Phaser.GameObjects.Graphics;
  private resolve?: () => void;
  private caught = 0;
  private goal: import('../core/types').Rect = { x: 0, y: 0, w: 0, h: 0 };
  private paths: Pt[][] = [];
  private start: Pt = { x: 0, y: 0 };

  constructor(private w: WorldScene) { this.gfx = w.add.graphics().setDepth(DEPTH.fx - 3); }

  async run(step: StealthStep): Promise<void> {
    const start = this.w.pt(step.start);
    this.goal = this.w.area(step.goal);
    this.paths = step.patrols.map((p) => p.path.map((q) => this.w.pt(q)));
    this.start = start;
    this.cur = step;
    this.pos = this.paths.map((p) => ({ x: p[0].x, y: p[0].y, seg: 0, t: 0 }));
    this.w.setGoal(this.goal);
    this.w.player.setPos(start.x, start.y);
    this.w.syncFollowers(true);
    await new Promise<void>((resolve) => { this.resolve = resolve; });
    this.w.setGoal(null);
    this.gfx.clear();
    this.cur = null;
  }

  update(dt: number): void {
    const s = this.cur;
    if (!s) return;
    if (hub.locked) return;
    const p = this.w.player;
    const g = this.gfx;
    g.clear();
    const veiled = this.w.combat.isVeiled();
    s.patrols.forEach((pt, i) => {
      const st = this.pos[i];
      const path = this.paths[i];
      const a = path[st.seg], b = path[(st.seg + 1) % path.length];
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      st.t += (60 * dt) / len;
      if (st.t >= 1) { st.t = 0; st.seg = (st.seg + 1) % path.length; }
      st.x = a.x + (b.x - a.x) * st.t; st.y = a.y + (b.y - a.y) * st.t;
      const r = { x: st.x - pt.w / 2, y: st.y - pt.h / 2, w: pt.w, h: pt.h };
      g.fillStyle(0xff4a3a, veiled ? 0.12 : 0.28).fillRoundedRect(r.x, r.y, r.w, r.h, 14);
      g.lineStyle(2, 0xff4a3a, 0.8).strokeRoundedRect(r.x, r.y, r.w, r.h, 14);
      g.fillStyle(0x222233, 1).fillCircle(st.x, st.y, 8);
      if (!veiled && p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h) this.alert(this.start);
    });
    if (this.w.playerIn(this.goal) && this.resolve) { const f = this.resolve; this.resolve = undefined; f(); }
  }

  private alert(start: Pt): void {
    this.caught++;
    hub.ui.toast(this.caught >= 2 ? 'Repéré ! Utilisez le Voile (V) pour passer une zone, ou attendez la ronde.' : 'Repéré ! Retour au point sûr.');
    const p = this.w.player;
    p.setPos(start.x, start.y);
    this.w.syncFollowers(true);
  }
}
