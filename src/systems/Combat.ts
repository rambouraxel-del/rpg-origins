// Combat court en temps réel avec pause de réflexion. Les humains sont désarmés, jamais tués ; les machines peuvent être détruites.
import Phaser from 'phaser';
import { DEPTH } from '../config';
import { BALANCE } from '../data/balance';
import { hub } from '../game';
import { Actor } from './Actor';
import type { CompanionId, EnemySpawn, EnemyType, Pt } from '../core/types';
import type { WorldScene } from '../scenes/WorldScene';
import { POWERS } from '../data/powers';
import { audio } from './Audio';

interface Enemy {
  type: EnemyType;
  actor: Actor;
  hp: number;
  max: number;
  state: 'idle' | 'windup' | 'recover' | 'stun' | 'down';
  t: number;
  aim?: Pt;
  shield: boolean;
  node?: { x: number; y: number; cut: number };
  rooted: number;
  vuln: number;
  marked: boolean;
  blind: number;
  decoy: boolean;
  facing: number;
}

const NAME: Record<EnemyType, string> = { automate: 'Automate de garde', sentinelle: 'Sentinelle', pompage: 'Unité de pompage', soldat: 'Soldat' };
const CHAR: Record<EnemyType, string> = { automate: 'automate', sentinelle: 'sentinelle', pompage: 'pompage', soldat: 'soldat' };

export class Combat {
  active = false;
  pausedByPlayer = false;
  private enemies: Enemy[] = [];
  private gfx!: Phaser.GameObjects.Graphics;
  private resolveFn?: (r: 'won' | 'lost') => void;
  private lastStrike = 0;
  private dodgeCd = 0;
  private dodgeT = 0;
  private dodgeDir: Pt = { x: 0, y: 1 };
  private cd = { p1: 0, p2: 0 };
  private idleSince = 0;
  private supportUsed = false;
  private supportActive: { who: CompanionId; t: number } | null = null;
  private bondT = 0;
  private veilT = 0;
  private slowT = 0;
  private invuln = 0;
  private queued: (() => void) | null = null;
  private opts = { support: true, pauseAllowed: true };
  private hudAcc = 0;
  powersSel: [string | null, string | null] = [null, null];

  constructor(private w: WorldScene) {
    this.gfx = w.add.graphics().setDepth(DEPTH.fx - 2);
    const kb = w.input.keyboard!;
    kb.on('keydown-TAB', (e: KeyboardEvent) => { e.preventDefault(); this.togglePause(); });
    kb.on('keydown-SPACE', () => this.dodge());
    kb.on('keydown-ONE', () => this.cyclePower(0));
    kb.on('keydown-TWO', () => this.cyclePower(1));
    kb.on('keydown-R', () => this.useSupport());
    kb.on('keydown-F', () => this.useHeal());
    kb.on('keydown-V', () => { if (!this.active) this.useVeil(); });
    w.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.active || hub.locked || this.pausedByPlayer) return;
      if (p.rightButtonDown()) this.usePower(0, p.worldX, p.worldY); else this.strike(p.worldX, p.worldY);
    });
    w.input.mouse?.disableContextMenu();
  }

  /** Pilote de test : approche l'adversaire le plus proche, esquive pendant une préparation, frappe. Utilise les vraies règles de dégâts. */
  autoStep(dt: number): void {
    if (!this.active || this.pausedByPlayer) return;
    const p = this.w.player;
    const alive = this.enemies.filter((e) => e.state !== 'down');
    if (!alive.length) return;
    const t = alive.sort((a, b) => Math.hypot(a.actor.x - p.x, a.actor.y - p.y) - Math.hypot(b.actor.x - p.x, b.actor.y - p.y))[0];
    if (t.type === 'pompage' && t.shield && t.node) { p.setPos(t.node.x + 20, t.node.y); this.w.input.keyboard!.emit('keydown-E'); t.shield = false; }
    const d = Math.hypot(t.actor.x - p.x, t.actor.y - p.y);
    if (d > 48) { const m = this.w.tryMove(p.x, p.y, ((t.actor.x - p.x) / d) * 180 * dt, ((t.actor.y - p.y) / d) * 180 * dt); p.setPos(m.x, m.y); }
    if (alive.some((e) => e.state === 'windup') && this.dodgeCd <= 0) this.dodge();
    if (d < 58) this.strike(t.actor.x, t.actor.y - 26);
    if (hub.state.hero.hp < hub.state.hero.maxHp * 0.4) this.useHeal();
  }

  speedFactor(): number { return this.slowT > 0 ? 0.6 : 1; }
  isVeiled(): boolean { return this.veilT > 0; }

  availablePowers(): string[] {
    return hub.state.powers.filter((p) => POWERS[p]?.combat);
  }

  private ensureSel(): void {
    const av = this.availablePowers();
    for (let i = 0; i < 2; i++) if (!this.powersSel[i] || !av.includes(this.powersSel[i]!)) this.powersSel[i] = av.filter((p) => p !== this.powersSel[1 - i])[i === 0 ? 0 : 0] ?? null;
  }

  private cyclePower(i: 0 | 1): void {
    const av = this.availablePowers();
    if (!av.length) return;
    const cur = av.indexOf(this.powersSel[i] ?? '');
    this.powersSel[i] = av[(cur + 1) % av.length];
    hub.ui.toast(`Raccourci ${i + 1} : ${POWERS[this.powersSel[i]!].name}`);
  }

  run(spawns: EnemySpawn[], opts: { support: boolean; pauseAllowed: boolean }): Promise<'won' | 'lost'> {
    this.opts = opts;
    this.ensureSel();
    for (const e of this.enemies) e.actor.destroy();
    this.enemies = spawns.map((s) => this.makeEnemy(s));
    this.active = true;
    audio.combat(true);
    this.pausedByPlayer = false;
    this.supportUsed = false;
    this.supportActive = null;
    this.dodgeCd = 0; this.cd = { p1: 0, p2: 0 };
    this.idleSince = 0;
    this.invuln = 0.6;
    hub.ui.combatHud(this.hudInfo());
    return new Promise((resolve) => { this.resolveFn = resolve; });
  }

  private makeEnemy(s: EnemySpawn): Enemy {
    const stat = BALANCE.enemy[s.type];
    const at = this.w.pt(s.at);
    const actor = new Actor(this.w, CHAR[s.type], at.x, at.y);
    const e: Enemy = { type: s.type, actor, hp: stat.hp, max: stat.hp, state: 'idle', t: 0.6 + Math.random() * 0.8, shield: s.type === 'pompage', rooted: 0, vuln: 0, marked: false, blind: 0, decoy: false, facing: 0 };
    if (s.type === 'pompage') e.node = { x: at.x - 70, y: at.y + 10, cut: 0 };
    return e;
  }

  private hudInfo() {
    return {
      enemies: this.enemies.filter((e) => e.state !== 'down').map((e) => ({ name: NAME[e.type], hp: Math.max(0, e.hp), max: e.max })),
      support: hub.state.support, supportReady: !this.supportUsed && this.opts.support && !!hub.state.support,
      cooldowns: { dodge: this.dodgeCd, p1: this.cd.p1, p2: this.cd.p2 },
      powers: [this.powersSel[0], this.powersSel[1]] as [string | null, string | null],
    };
  }

  // ------------------------------------------------------------ pause
  togglePause(): void {
    if (!this.active || !this.opts.pauseAllowed || hub.state.hero.hp <= 0) return;
    this.pausedByPlayer = !this.pausedByPlayer;
    hub.ui.pauseOverlay(this.pausedByPlayer);
    if (!this.pausedByPlayer && this.queued) { const q = this.queued; this.queued = null; q(); }
  }
  queueAction(fn: () => void, label: string): void { this.queued = fn; hub.ui.toast(`À la reprise : ${label}`); }
  actions(): { label: string; run: () => void; ok: boolean }[] {
    const out: { label: string; run: () => void; ok: boolean }[] = [];
    const s = hub.state;
    out.push({ label: `Se soigner (${s.consumables.soin ?? 0})`, ok: (s.consumables.soin ?? 0) > 0 && s.hero.hp < s.hero.maxHp, run: () => this.queueAction(() => this.useHeal(), 'soin') });
    ([0, 1] as const).forEach((i) => { const id = this.powersSel[i]; if (id) out.push({ label: `Pouvoir ${i + 1} : ${POWERS[id].name} (${POWERS[id].cost} énergie)`, ok: s.hero.energy >= POWERS[id].cost, run: () => this.queueAction(() => this.usePower(i, this.w.player.x + this.faceVec().x * 80, this.w.player.y + this.faceVec().y * 80), POWERS[id].name) }); });
    if (s.support && this.opts.support) out.push({ label: `Intervention de ${s.support}`, ok: !this.supportUsed, run: () => this.queueAction(() => this.useSupport(), `intervention de ${s.support}`) });
    return out;
  }
  enemyInfo(): { name: string; hp: number; max: number; note: string }[] {
    return this.enemies.filter((e) => e.state !== 'down').map((e) => ({
      name: NAME[e.type], hp: Math.max(0, Math.round(e.hp)), max: e.max,
      note: e.type === 'pompage' ? (e.shield ? 'Protégée par un circuit : couper le nœud lumineux (E)' : 'Circuit coupé') : e.type === 'soldat' ? 'Bloque de face : contourner' : e.type === 'sentinelle' ? 'Tire après une visée marquée : se couvrir ou interrompre' : 'Prépare une frappe proche : esquiver puis frapper',
    }));
  }

  // ---------------------------------------------------------- actions
  private faceVec(): Pt {
    const f = this.w.player.facing;
    return { x: f === 'right' ? 1 : f === 'left' ? -1 : 0, y: f === 'down' ? 1 : f === 'up' ? -1 : 0 };
  }

  private damageHero(n: number): void {
    const s = hub.state;
    if (this.invuln > 0 || this.bondT > 0) return;
    const f = s.difficulty === 'histoire' ? BALANCE.histoireDamageFactor : 1;
    s.hero.hp = Math.max(0, s.hero.hp - Math.round(n * f));
    this.invuln = 0.5;
    audio.hurt();
    this.w.cameras.main.shake(120, 0.004);
    this.idleSince = 0;
    if (s.hero.hp <= 0) this.finish('lost');
  }

  private strike(tx: number, ty: number): void {
    const now = this.w.time.now / 1000;
    if (!this.active || now - this.lastStrike < BALANCE.hero.strikeInterval || this.dodgeT > 0) return;
    this.lastStrike = now;
    audio.strike();
    const p = this.w.player;
    const dx = tx - p.x, dy = ty - (p.y - 30);
    const len = Math.hypot(dx, dy) || 1;
    p.setFacingVec(dx, dy);
    const ux = dx / len, uy = dy / len;
    this.flashArc(p.x, p.y - 26, ux, uy, 56);
    for (const e of this.enemies) {
      if (e.state === 'down') continue;
      const ex = e.actor.x - p.x, ey = e.actor.y - 26 - (p.y - 26);
      const d = Math.hypot(ex, ey);
      if (d > 62) continue;
      if ((ex * ux + ey * uy) / (d || 1) < 0.35) continue;
      this.hit(e, BALANCE.hero.strike, { x: ux, y: uy });
    }
    this.idleSince = 0;
  }

  private hit(e: Enemy, dmg: number, dir: Pt): void {
    let d = dmg;
    if (e.type === 'pompage' && e.shield) { this.pop(e.actor.x, e.actor.y - 50, 'Protégé', 0xffe08a); return; }
    if (e.type === 'soldat') {
      const front = (e.facing - Math.atan2(dir.y, dir.x));
      const dot = Math.cos(front);
      if (dot < -0.4) { d *= 0.2; this.pop(e.actor.x, e.actor.y - 50, 'Paré', 0xaaaaaa); }
    }
    if (e.marked) { d *= 2; e.marked = false; }
    if (e.vuln > 0) d *= 1.5;
    if (e.state === 'recover') d *= 1.25;
    e.hp -= d;
    audio.hit();
    e.actor.sprite.setTint(0xffaaaa);
    this.w.time.delayedCall(90, () => e.actor.sprite.clearTint());
    this.pop(e.actor.x, e.actor.y - 56, String(Math.round(d)), 0xffffff);
    if (e.hp <= 0) this.down(e);
    else if (e.state === 'windup' && d >= 15) { e.state = 'stun'; e.t = 0.35; }
  }

  private down(e: Enemy): void {
    e.state = 'down';
    const human = e.type === 'soldat';
    this.pop(e.actor.x, e.actor.y - 56, human ? 'Désarmé' : 'Détruit', 0xffdd66);
    this.w.tweens.add({ targets: [e.actor.sprite, e.actor.shadow], alpha: 0, duration: 450, onComplete: () => e.actor.destroy() });
    if (this.enemies.every((x) => x.state === 'down')) this.w.time.delayedCall(500, () => this.finish('won'));
  }

  private dodge(): void {
    if (!this.active || this.pausedByPlayer || this.dodgeCd > 0 || hub.locked) return;
    const k = this.w.input.keyboard!;
    void k;
    const f = this.faceVec();
    const move = this.moveVec();
    this.dodgeDir = move.x || move.y ? move : f;
    audio.dodge();
    this.dodgeT = BALANCE.hero.dodgeTime;
    this.dodgeCd = BALANCE.hero.dodgeCooldown * (hub.state.hero.spent.dodge ? 0.9 : 1);
    this.invuln = Math.max(this.invuln, BALANCE.hero.dodgeTime + 0.08);
  }

  private moveVec(): Pt {
    const k = this.w.input.keyboard!;
    const dn = (c: number) => k.checkDown(k.addKey(c), 0);
    const L = dn(Phaser.Input.Keyboard.KeyCodes.Q) || dn(Phaser.Input.Keyboard.KeyCodes.A) || dn(Phaser.Input.Keyboard.KeyCodes.LEFT);
    const R = dn(Phaser.Input.Keyboard.KeyCodes.D) || dn(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    const U = dn(Phaser.Input.Keyboard.KeyCodes.Z) || dn(Phaser.Input.Keyboard.KeyCodes.W) || dn(Phaser.Input.Keyboard.KeyCodes.UP);
    const D = dn(Phaser.Input.Keyboard.KeyCodes.S) || dn(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const x = (R ? 1 : 0) - (L ? 1 : 0), y = (D ? 1 : 0) - (U ? 1 : 0);
    const len = Math.hypot(x, y);
    return len ? { x: x / len, y: y / len } : { x: 0, y: 0 };
  }

  private useHeal(): void {
    const s = hub.state;
    if (!this.active || hub.locked) return;
    if ((s.consumables.soin ?? 0) <= 0 || s.hero.hp >= s.hero.maxHp) { hub.ui.toast('Aucun soin utile.'); return; }
    audio.heal();
    s.consumables.soin--;
    s.hero.hp = Math.min(s.hero.maxHp, s.hero.hp + BALANCE.hero.healItem);
    this.pop(this.w.player.x, this.w.player.y - 70, `+${BALANCE.hero.healItem}`, 0x8aff9a);
  }

  private useVeil(): void {
    const s = hub.state;
    if (!s.powers.includes('veil') || s.hero.energy < BALANCE.veil.cost || this.veilT > 0 || hub.locked) return;
    s.hero.energy -= BALANCE.veil.cost;
    this.veilT = BALANCE.veil.duration * (s.hero.spent.veil ? 1.15 : 1);
    hub.ui.toast('Voile : vous êtes moins visible.');
  }

  private usePower(slot: 0 | 1, tx: number, ty: number): void {
    const id = this.powersSel[slot];
    if (!this.active || !id || hub.locked) return;
    const P = POWERS[id];
    const s = hub.state;
    const cdKey = slot === 0 ? 'p1' : 'p2';
    if (this.cd[cdKey] > 0) { hub.ui.toast('Pouvoir en recharge.'); return; }
    if (s.hero.energy < P.cost) { hub.ui.toast('Pas assez d\'énergie.'); return; }
    const p = this.w.player;
    const near = (r: number) => this.enemies.filter((e) => e.state !== 'down' && Math.hypot(e.actor.x - p.x, e.actor.y - p.y) < r);
    let used = true;
    switch (id) {
      case 'pulse': {
        const t = near(190).sort((a, b) => Math.hypot(a.actor.x - tx, a.actor.y - ty) - Math.hypot(b.actor.x - tx, b.actor.y - ty))[0];
        if (!t) { hub.ui.toast('Aucune cible à portée de l\'Onde.'); used = false; break; }
        t.state = 'stun'; t.t = 2.2; t.vuln = 2.4;
        if (t.type === 'pompage') t.shield = false;
        this.ring(t.actor.x, t.actor.y - 30, 0x9fe8ff);
        break;
      }
      case 'weave': {
        const supports = this.w.loc.hotspots?.filter((h) => /appui|support|racine|poutre/i.test(h.id + h.label)) ?? [];
        const t = near(220).find((e) => supports.some((h) => { const r = this.w.hotRect(h); return Math.hypot(e.actor.x - (r.x + r.w / 2), e.actor.y - (r.y + r.h / 2)) < 170; }));
        if (!t) { hub.ui.toast('Aucun appui compatible près des cibles.'); used = false; break; }
        for (const e of near(120)) e.rooted = 2.8;
        t.rooted = 2.8; this.ring(t.actor.x, t.actor.y, 0x8aff7a);
        break;
      }
      case 'flow': {
        if (!this.w.loc.hotspots?.some((h) => /eau|canal|bassin|conduite|vanne/i.test(h.id + h.label)) && !/river|water|valley/.test(this.w.loc.id)) { hub.ui.toast('Aucune eau ni conduite ici.'); used = false; break; }
        for (const e of near(260)) { e.shield = false; e.hp -= 14; e.rooted = 1.2; this.ring(e.actor.x, e.actor.y, 0x6ad0ff); if (e.hp <= 0) this.down(e); }
        break;
      }
      case 'veil': { this.veilT = BALANCE.veil.duration; for (const e of this.enemies) { e.blind = 3; if (e.state === 'windup') { e.state = 'idle'; e.t = 1.2; } } this.ring(p.x, p.y, 0xc9a0ff); break; }
      case 'listen': { const t = near(280)[0]; if (t) { t.marked = true; this.ring(t.actor.x, t.actor.y - 30, 0xfff0a0); this.pop(t.actor.x, t.actor.y - 70, 'Point faible', 0xfff0a0); } else used = false; break; }
      case 'echo': { this.slowT = 0; for (const e of this.enemies) e.vuln = Math.max(e.vuln, 3); this.ring(p.x, p.y, 0xffc0ff); hub.ui.toast('Rémanence : les fenêtres de frappe sont visibles.'); break; }
      case 'bond': { this.bondT = 3 * (s.hero.spent.bond ? 1.2 : 1); this.ring(p.x, p.y, 0xffe08a); break; }
    }
    if (!used) return;
    audio.power();
    s.hero.energy -= P.cost * (s.hero.spent.cost ? 0.9 : 1);
    this.cd[cdKey] = P.cooldown;
    this.idleSince = 0;
  }

  private useSupport(): void {
    const s = hub.state;
    if (!this.active || !this.opts.support || this.supportUsed || !s.support || hub.locked) return;
    const who = s.support;
    const machines = this.enemies.filter((e) => e.state !== 'down' && e.type !== 'soldat');
    if (who === 'tessa' && machines.length === 0) { hub.ui.toast('Tessa : « Pas de circuit à couper ici. »'); return; }
    this.supportUsed = true;
    this.supportActive = { who, t: 4 };
    if (who === 'nara') for (const e of this.enemies) { e.decoy = true; if (e.state === 'windup') { e.state = 'idle'; e.t = 1.5; } }
    if (who === 'soren') for (const e of this.enemies) e.vuln = 4;
    if (who === 'tessa') for (const e of machines) { e.shield = false; e.state = 'stun'; e.t = 3; }
    this.pop(this.w.player.x, this.w.player.y - 80, `${who === 'nara' ? 'Nara' : who === 'soren' ? 'Soren' : 'Tessa'} intervient`, 0xfff0a0);
  }

  // ----------------------------------------------------------- boucle
  update(dt: number): void {
    if (!this.active) { this.gfx.clear(); return; }
    if (this.pausedByPlayer || hub.locked) return;
    const p = this.w.player, s = hub.state;
    this.invuln = Math.max(0, this.invuln - dt);
    this.dodgeCd = Math.max(0, this.dodgeCd - dt);
    this.cd.p1 = Math.max(0, this.cd.p1 - dt); this.cd.p2 = Math.max(0, this.cd.p2 - dt);
    this.bondT = Math.max(0, this.bondT - dt); this.veilT = Math.max(0, this.veilT - dt); this.slowT = Math.max(0, this.slowT - dt);
    if (this.supportActive) { this.supportActive.t -= dt; if (this.supportActive.t <= 0) { this.supportActive = null; for (const e of this.enemies) e.decoy = false; } }
    this.idleSince += dt;
    if (this.idleSince > BALANCE.hero.regenDelay) s.hero.energy = Math.min(s.hero.maxEnergy, s.hero.energy + BALANCE.hero.regenCombat * dt);
    if (this.dodgeT > 0) {
      this.dodgeT -= dt;
      const sp = BALANCE.hero.dodgeDist / BALANCE.hero.dodgeTime;
      const m = this.w.tryMove(p.x, p.y, this.dodgeDir.x * sp * dt, this.dodgeDir.y * sp * dt);
      p.setPos(m.x, m.y);
    }
    const g = this.gfx;
    g.clear();
    const pointer = this.w.input.activePointer;
    // coupure de circuit (E près du nœud)
    for (const e of this.enemies) {
      if (e.state === 'down') continue;
      this.updateEnemy(e, dt);
      e.rooted = Math.max(0, e.rooted - dt); e.vuln = Math.max(0, e.vuln - dt); e.blind = Math.max(0, e.blind - dt);
      this.drawEnemy(e);
    }
    if (this.bondT > 0) { g.lineStyle(3, 0xffe08a, 0.8).strokeCircle(p.x, p.y - 28, 38 + Math.sin(this.w.time.now / 80) * 2); }
    if (this.veilT > 0) { g.lineStyle(2, 0xc9a0ff, 0.6).strokeCircle(p.x, p.y - 28, 30); this.w.player.setAlpha(0.6); } else this.w.player.setAlpha(1);
    void pointer;
    this.hudAcc += dt;
    if (this.hudAcc > 0.1) { this.hudAcc = 0; hub.ui.combatHud(this.hudInfo()); }
  }

  private updateEnemy(e: Enemy, dt: number): void {
    const p = this.w.player;
    const stat = BALANCE.enemy[e.type];
    const a = e.actor;
    const tx = e.decoy ? p.x - 140 : p.x, ty = e.decoy ? p.y + 20 : p.y;
    const dx = tx - a.x, dy = ty - a.y;
    const dist = Math.hypot(dx, dy);
    a.setFacingVec(dx, dy);
    e.facing = Math.atan2(dy, dx);
    e.t -= dt;
    // nœud de circuit (pompage)
    if (e.node) {
      const nd = Math.hypot(e.node.x - p.x, e.node.y - p.y);
      if (nd < 54 && e.shield) {
        this.w.hintNode = { x: e.node.x, y: e.node.y };
        if (this.w.input.keyboard!.checkDown(this.w.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E), 120)) { e.shield = false; e.t = 0.2; e.node.cut = 8; this.pop(e.node.x, e.node.y - 20, 'Circuit coupé', 0x8affff); }
      }
      if (!e.shield && e.node.cut > 0) { e.node.cut -= dt; if (e.node.cut <= 0 && e.type === 'pompage') e.shield = true; }
    }
    if (e.state === 'stun') { if (e.t <= 0) { e.state = 'idle'; e.t = 0.5; } return; }
    if (e.blind > 0 || this.veilT > 0 && dist > 120) { if (e.state === 'windup') { e.state = 'idle'; e.t = 0.8; } return; }
    if (e.state === 'recover') { if (e.t <= 0) { e.state = 'idle'; e.t = 0.2; } return; }
    if (e.state === 'windup') {
      if (e.t <= 0) this.resolveStrike(e, stat);
      return;
    }
    // idle : se déplacer / préparer
    if (e.type === 'sentinelle') {
      const want = dist < 200 ? -1 : dist > 300 ? 1 : 0;
      if (want && e.rooted <= 0) { const m = this.w.tryMove(a.x, a.y, (dx / dist) * stat.speed * want * dt, (dy / dist) * stat.speed * want * dt); a.setPos(m.x, m.y); }
      if (e.t <= 0 && dist < stat.range) { e.state = 'windup'; e.t = stat.windup * (e.vuln > 0 ? 1.5 : 1); e.aim = { x: tx, y: ty }; }
    } else {
      if (dist > stat.range - 6 && e.rooted <= 0) { const m = this.w.tryMove(a.x, a.y, (dx / dist) * stat.speed * dt, (dy / dist) * stat.speed * dt); a.setPos(m.x, m.y); }
      if (dist <= stat.range + 4 && e.t <= 0) { e.state = 'windup'; e.t = stat.windup * (e.vuln > 0 ? 1.5 : 1); e.aim = { x: tx, y: ty }; }
    }
    a.tick(dt, e.state === 'idle');
  }

  private resolveStrike(e: Enemy, stat: { damage: number; reach: number }): void {
    const p = this.w.player;
    if (!e.decoy) {
      if (e.type === 'sentinelle') {
        const a = e.actor;
        const ang = Math.atan2(e.aim!.y - a.y, e.aim!.x - a.x);
        const ux = Math.cos(ang), uy = Math.sin(ang);
        const rx = p.x - a.x, ry = p.y - 26 - (a.y - 26);
        const along = rx * ux + ry * uy, side = Math.abs(rx * -uy + ry * ux);
        if (along > 0 && along < 340 && side < 26) this.damageHero(stat.damage);
        this.ring(a.x + ux * 60, a.y - 26 + uy * 60, 0xffd27a);
      } else if (Math.hypot(p.x - e.actor.x, p.y - e.actor.y) < stat.reach) this.damageHero(stat.damage);
    }
    e.state = 'recover'; e.t = 1.0;
  }

  private drawEnemy(e: Enemy): void {
    const g = this.gfx, a = e.actor;
    const bw = 40, ratio = Math.max(0, e.hp / e.max);
    g.fillStyle(0x000000, 0.6).fillRect(a.x - bw / 2, a.y - a.height - 12, bw, 5);
    g.fillStyle(e.type === 'soldat' ? 0xe0a050 : 0xff5a5a, 1).fillRect(a.x - bw / 2, a.y - a.height - 12, bw * ratio, 5);
    if (e.shield) g.lineStyle(2, 0xffe08a, 0.9).strokeCircle(a.x, a.y - 30, 34);
    if (e.node) { g.fillStyle(e.shield ? 0xffe08a : 0x555555, 0.9).fillCircle(e.node.x, e.node.y, 7); g.lineStyle(2, 0xffffff, 0.7).strokeCircle(e.node.x, e.node.y, 12 + Math.sin(this.w.time.now / 150) * 2); }
    if (e.marked) g.lineStyle(2, 0xfff0a0, 1).strokeCircle(a.x, a.y - 30, 26);
    if (e.state === 'windup' && e.aim) {
      const prog = 1 - e.t / (BALANCE.enemy[e.type].windup * (e.vuln > 0 ? 1.5 : 1));
      if (e.type === 'sentinelle') {
        const ang = Math.atan2(e.aim.y - a.y, e.aim.x - a.x);
        g.lineStyle(3, 0xff6a3a, 0.35 + prog * 0.6).lineBetween(a.x, a.y - 26, a.x + Math.cos(ang) * 340, a.y - 26 + Math.sin(ang) * 340);
      } else {
        g.fillStyle(0xff3a3a, 0.15 + prog * 0.35).fillCircle(a.x, a.y, BALANCE.enemy[e.type].reach);
        g.lineStyle(2, 0xff3a3a, 0.8).strokeCircle(a.x, a.y, BALANCE.enemy[e.type].reach);
      }
    }
    if (e.state === 'stun') g.lineStyle(2, 0x9fe8ff, 0.9).strokeCircle(a.x, a.y - 30, 20);
  }

  // ----------------------------------------------------------- effets
  private flashArc(x: number, y: number, ux: number, uy: number, r: number): void {
    const g = this.w.add.graphics().setDepth(DEPTH.fx);
    g.lineStyle(5, 0xffffff, 0.9).beginPath().arc(x, y, r, Math.atan2(uy, ux) - 0.9, Math.atan2(uy, ux) + 0.9).strokePath();
    this.w.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() });
  }
  private ring(x: number, y: number, color: number): void {
    const g = this.w.add.graphics().setDepth(DEPTH.fx);
    g.lineStyle(4, color, 0.9).strokeCircle(x, y, 18);
    this.w.tweens.add({ targets: g, scale: 2.4, alpha: 0, duration: 420, onComplete: () => g.destroy() });
  }
  private pop(x: number, y: number, text: string, color: number): void {
    const t = this.w.add.text(x, y, text, { fontFamily: 'Georgia, serif', fontSize: '15px', color: '#' + color.toString(16).padStart(6, '0'), stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(DEPTH.fx);
    this.w.tweens.add({ targets: t, y: y - 26, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  /** Arrêt brutal (chargement de partie) : aucune promesse n'est résolue. */
  abort(): void {
    if (this.active) audio.combat(false);
    this.active = false; this.pausedByPlayer = false; this.resolveFn = undefined; this.queued = null;
    for (const e of this.enemies) e.actor.destroy();
    this.enemies = []; this.gfx.clear();
    hub.ui?.combatHud(null); hub.ui?.pauseOverlay(false);
  }

  private finish(r: 'won' | 'lost'): void {
    if (!this.active) return;
    this.active = false;
    audio.combat(false);
    this.pausedByPlayer = false;
    hub.ui.pauseOverlay(false);
    hub.ui.combatHud(null);
    this.gfx.clear();
    this.w.player.setAlpha(1);
    for (const e of this.enemies) e.actor.destroy();
    this.enemies = [];
    this.w.hintNode = null;
    const f = this.resolveFn; this.resolveFn = undefined;
    f?.(r);
  }
}
