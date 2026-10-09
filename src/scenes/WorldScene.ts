// Scène générique d'un lieu : fond fixe, zones de marche, profondeur, interactions, sorties, compagnons.
import Phaser from 'phaser';
import { DEPTH, GAME_H, GAME_W, INTERACT_RADIUS, RUN_SPEED, WALK_SPEED } from '../config';
import { Actor } from '../systems/Actor';
import { nameOf } from '../data/characters';
import { hub } from '../game';
import { applyEffects, evalCond } from '../core/state';
import type { ActorPlacement, Area, CompanionId, Facing, Hotspot, LocationDef, Place, Pt, Rect } from '../core/types';
import { Director } from '../systems/Director';
import { Combat } from '../systems/Combat';
import { Stealth } from '../systems/Stealth';
import { bannerFor } from '../data/banter';
import { audio } from '../systems/Audio';
import { heroMods } from '../systems/Mods';

export const inRect = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

interface Target { kind: 'actor' | 'hotspot' | 'rest' | 'follower'; id: string; x: number; y: number; label: string; dist: number }

export class WorldScene extends Phaser.Scene {
  loc!: LocationDef;
  player!: Actor;
  followers = new Map<string, Actor>();
  npcs = new Map<string, Actor>();
  director!: Director;
  combat!: Combat;
  stealth!: Stealth;
  /** Tant que vrai : aucun déplacement (cinématique, transition). */
  cinematic = false;
  transitioning = false;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private bg?: Phaser.GameObjects.Image;
  private bgLayer: Phaser.GameObjects.GameObject[] = [];
  private marks: Phaser.GameObjects.Graphics[] = [];
  private history: Pt[] = [];
  private target: Target | null = null;
  private sceneHotspots: Hotspot[] = [];
  private tintRect?: Phaser.GameObjects.Rectangle;
  private watchers: { check: () => boolean; resolve: () => void }[] = [];
  private talkHandlers = new Map<string, () => Promise<void>>();
  private pulse = 0;
  private hintGfx!: Phaser.GameObjects.Graphics;
  private debugGfx?: Phaser.GameObjects.Graphics;
  editor?: import('../systems/Editor').Editor;
  /** Cible de l'objectif courant, affichée comme zone (anneau). */
  private goalRect: Rect | null = null;
  private exitHint = new Map<string, Phaser.GameObjects.Text>();
  /** Nœud de circuit proche du héros pendant un combat (affichage). */
  hintNode: Pt | null = null;
  private questHotspots: Hotspot[] = [];

  constructor() { super('World'); }

  create(): void {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,Z,Q,UP,DOWN,LEFT,RIGHT,SHIFT,E,SPACE,ENTER') as Record<string, Phaser.Input.Keyboard.Key>;
    this.hintGfx = this.add.graphics().setDepth(DEPTH.fx - 1);
    this.director = new Director(this);
    this.combat = new Combat(this);
    this.stealth = new Stealth(this);
    this.player = new Actor(this, 'elyan', 480, 400);
    this.cameras.main.setBackgroundColor(0x0b0f12);
    kb.on('keydown-E', () => this.interact());
    kb.on('keydown-ENTER', () => this.interact());
    if (hub.devMode) {
      import('../systems/Editor').then((m) => { this.editor = new m.Editor(this); });
      kb.on('keydown-F2', () => { this.debugGfx ? (this.debugGfx.destroy(), (this.debugGfx = undefined)) : this.drawDebug(); });
    }
    this.events.on('shutdown', () => { this.watchers = []; });
    hub.events.emit('world-ready', this);
  }

  // ------------------------------------------------------------------ lieu
  async loadLocation(locId: string, spawn?: string | Pt, face?: Facing): Promise<void> {
    const def = hub.locations.get(locId);
    if (!def) throw new Error(`Lieu inconnu : ${locId}`);
    await this.ensureBackground(def);
    // Le lieu courant ne change qu'une fois le fond prêt, et les points d'intérêt de l'ancien lieu sont retirés au même instant.
    this.clearLocation();
    this.loc = def;
    this.questHotspots = [];
    hub.state.location.loc = locId;
    applyEffects(hub.state, [{ op: 'discover', loc: locId }]);
    this.buildBackground(def);
    const sp: Pt & { face?: Facing } = typeof spawn === 'object' ? spawn : def.spawns[spawn ?? 'default'] ?? def.spawns.default ?? { x: 480, y: 400 };
    this.player.setPos(sp.x, sp.y);
    this.player.face(face ?? sp.face ?? 'down');
    this.history = [];
    for (let i = 0; i < 80; i++) this.history.push({ x: sp.x, y: sp.y });
    this.syncFollowers(true);
    hub.state.location.x = sp.x; hub.state.location.y = sp.y;
    audio.forLocation(def.id);
    hub.events.emit('location', def);
  }

  private async ensureBackground(def: LocationDef): Promise<void> {
    const key = `bg:${def.id}`;
    if (this.textures.exists(key)) return;
    await new Promise<void>((resolve) => {
      this.load.once('complete', () => resolve());
      this.load.once('loaderror', () => undefined);
      this.load.image(key, def.bg);
      this.load.start();
    });
    if (!this.textures.exists(key) || this.textures.get(key).key === '__MISSING') this.makeFallback(def);
  }

  /** Fond provisoire quand l'image n'existe pas encore : dégradé + repères (clairement identifié comme provisoire). */
  private makeFallback(def: LocationDef): void {
    const key = `bg:${def.id}`;
    if (this.textures.exists(key)) this.textures.remove(key);
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillGradientStyle(0x2f5f3a, 0x2f5f3a, 0x1f3f2a, 0x1f3f2a, 1).fillRect(0, 0, GAME_W, GAME_H);
    g.fillStyle(0x6a8f4a, 1);
    for (const r of def.walk) g.fillRoundedRect(r.x, r.y, r.w, r.h, 18);
    g.fillStyle(0x30261d, 1);
    for (const r of def.blocks ?? []) g.fillRoundedRect(r.x, r.y, r.w, r.h, 10);
    g.fillStyle(0xe8d9a0, 0.9);
    for (const e of def.exits) g.fillRect(e.rect.x, e.rect.y, e.rect.w, e.rect.h);
    g.generateTexture(key, GAME_W, GAME_H);
    g.destroy();
  }

  private buildBackground(def: LocationDef): void {
    const key = `bg:${def.id}`;
    this.bg = this.add.image(0, 0, key).setOrigin(0, 0).setDepth(DEPTH.background);
    this.bg.setDisplaySize(GAME_W, GAME_H);
    this.bgLayer.push(this.bg);
    for (const o of def.occluders ?? []) {
      const sx = this.bg.width / GAME_W, sy = this.bg.height / GAME_H;
      const img = this.add.image(o.rect.x, o.rect.y, key).setOrigin(0, 0).setDisplaySize(GAME_W, GAME_H);
      img.setCrop(o.rect.x * sx, o.rect.y * sy, o.rect.w * sx, o.rect.h * sy);
      img.setPosition(0, 0).setDepth(DEPTH.entityBase + o.baseY);
      this.bgLayer.push(img);
    }
    this.sceneHotspots = [];
    if (this.tintRect) { this.tintRect.destroy(); this.tintRect = undefined; }
  }

  private clearLocation(): void {
    for (const o of this.bgLayer) o.destroy();
    this.bgLayer = [];
    for (const a of this.npcs.values()) a.destroy();
    this.npcs.clear();
    this.talkHandlers.clear();
    this.hintGfx.clear();
    for (const t of this.exitHint.values()) t.destroy();
    this.exitHint.clear();
    this.debugGfx?.destroy(); this.debugGfx = undefined;
    this.goalRect = null;
  }

  setTint(t?: { color: number; alpha: number }): void {
    this.tintRect?.destroy(); this.tintRect = undefined;
    if (!t || hub.options.reduceFx && t.alpha > 0.4) return;
    this.tintRect = this.add.rectangle(0, 0, GAME_W, GAME_H, t.color, t.alpha).setOrigin(0, 0).setDepth(DEPTH.foreground + 10);
  }

  setSceneHotspots(h: Hotspot[] | undefined): void { this.sceneHotspots = h ?? []; }
  setQuestHotspots(h: Hotspot[]): void { this.questHotspots = h; }

  /** Place les acteurs d'une scène (les précédents sont retirés). */
  placeActors(list: ActorPlacement[] | undefined): void {
    for (const a of this.npcs.values()) a.destroy();
    this.npcs.clear();
    this.talkHandlers.clear();
    for (const p of list ?? []) {
      const pos = this.pt(p.at);
      const a = new Actor(this, p.id, pos.x, pos.y);
      a.face(p.face ?? 'down');
      if (p.label !== undefined) a.showLabel(p.label);
      this.npcs.set(p.id, a);
    }
  }

  onTalk(npc: string, fn: () => Promise<void>): void { this.talkHandlers.set(npc, fn); }
  clearTalk(npc: string): void { this.talkHandlers.delete(npc); }

  // ------------------------------------------------------- ancres et zones
  pt(p: Place): Pt {
    if (typeof p !== 'string') return p;
    const a = this.loc.anchors[p];
    if (a) return a;
    const f = this.loc.features[p];
    if (f) return { x: f.x + f.w / 2, y: f.y + f.h };
    throw new Error(`Ancre inconnue « ${p} » dans ${this.loc.id}`);
  }
  area(a: Area): Rect {
    if (typeof a !== 'string') return a;
    const f = this.loc.features[a];
    if (f) return f;
    const p = this.loc.anchors[a];
    if (p) return { x: p.x - 55, y: p.y - 45, w: 110, h: 70 };
    throw new Error(`Zone inconnue « ${a} » dans ${this.loc.id}`);
  }
  /** Rectangle d'un point d'intérêt, résolu via les zones nommées du lieu. */
  hotRect(h: Hotspot): Rect {
    if (h.w !== undefined && h.x !== undefined && h.y !== undefined && h.h !== undefined) return { x: h.x, y: h.y, w: h.w, h: h.h };
    const f = this.loc.features[h.at ?? h.id];
    if (!f) throw new Error(`Zone « ${h.at ?? h.id} » inconnue dans ${this.loc.id} (point d'intérêt ${h.id})`);
    return f;
  }

  // -------------------------------------------------------------- collision
  canStand(x: number, y: number): boolean {
    const L = this.loc;
    if (!L) return false;
    let ok = false;
    for (const r of L.walk) if (inRect(r, x, y)) { ok = true; break; }
    if (!ok) return false;
    for (const b of L.blocks ?? []) if (inRect(b, x, y)) return false;
    return true;
  }

  /** Déplace en glissant le long des obstacles. */
  tryMove(x: number, y: number, dx: number, dy: number): Pt {
    let nx = x, ny = y;
    if (this.canStand(x + dx, y)) nx = x + dx;
    if (this.canStand(nx, y + dy)) ny = y + dy;
    return { x: nx, y: ny };
  }

  /** Point accessible le plus proche (utilisé pour placer les compagnons). */
  nearestStand(x: number, y: number): Pt {
    if (this.canStand(x, y)) return { x, y };
    for (let r = 8; r < 200; r += 8) for (let a = 0; a < 16; a++) {
      const px = x + Math.cos(a * Math.PI / 8) * r, py = y + Math.sin(a * Math.PI / 8) * r;
      if (this.canStand(px, py)) return { x: px, y: py };
    }
    return { x, y };
  }

  // ----------------------------------------------------------------- boucle
  update(_t: number, dtMs: number): void {
    const dt = Math.min(dtMs, 50) / 1000;
    if (!this.loc) return;
    this.pulse += dt;
    if (!hub.locked && !this.cinematic) hub.state.playMs += dtMs;
    const k = this.keys;
    let dx = 0, dy = 0;
    const free = !hub.locked && !this.cinematic && !this.transitioning && !this.combat.pausedByPlayer;
    if (free) {
      if (k.LEFT.isDown || k.Q.isDown || k.A.isDown) dx -= 1;
      if (k.RIGHT.isDown || k.D.isDown) dx += 1;
      if (k.UP.isDown || k.Z.isDown || k.W.isDown) dy -= 1;
      if (k.DOWN.isDown || k.S.isDown) dy += 1;
    }
    const moving = dx !== 0 || dy !== 0;
    if (moving && !this.combat.pausedByPlayer) {
      const len = Math.hypot(dx, dy);
      const mods = heroMods();
      const sp = (k.SHIFT.isDown && !this.combat.active ? RUN_SPEED * (1 + mods.sprint) : WALK_SPEED) * (1 + mods.speed) * this.combat.speedFactor();
      const p = this.tryMove(this.player.x, this.player.y, (dx / len) * sp * dt, (dy / len) * sp * dt);
      this.player.setFacingVec(dx, dy);
      this.player.setPos(p.x, p.y);
      this.history.unshift({ x: p.x, y: p.y });
      if (this.history.length > 400) this.history.length = 400;
    }
    this.player.tick(dt, moving);
    this.updateFollowers(dt, moving);
    for (const n of this.npcs.values()) n.tick(dt, false);
    this.combat.update(dt);
    this.stealth.update(dt);
    if (free || this.combat.active) this.updateTarget();
    else this.setTarget(null);
    if (free) this.checkExits();
    this.drawHints();
    for (let i = this.watchers.length - 1; i >= 0; i--) {
      if (this.watchers[i].check()) { const w = this.watchers.splice(i, 1)[0]; w.resolve(); }
    }
    hub.state.location.x = this.player.x; hub.state.location.y = this.player.y;
    this.editor?.update();
  }

  /** Réinitialise ce qui dépend d'une scène en cours (chargement de partie). */
  resetForLoad(): void {
    this.watchers = [];
    this.talkHandlers.clear();
    this.cinematic = false;
    this.transitioning = false;
    this.combat.abort();
    hub.ui?.reset();
    this.placeActors(undefined);
    this.setSceneHotspots(undefined);
    this.setGoal(null);
  }

  waitUntil(check: () => boolean): Promise<void> {
    return new Promise((resolve) => { this.watchers.push({ check, resolve }); });
  }

  playerIn(r: Rect): boolean { return inRect(r, this.player.x, this.player.y); }
  setGoal(r: Rect | null): void { this.goalRect = r; }

  // ---------------------------------------------------------- compagnons
  currentParty(): CompanionId[] {
    const s = hub.state;
    const sceneParty = this.director?.activeScene?.party;
    return (sceneParty ?? s.party) as CompanionId[];
  }

  syncFollowers(snap = false): void {
    const want = this.currentParty();
    for (const [id, a] of this.followers) if (!want.includes(id as CompanionId)) { a.destroy(); this.followers.delete(id); }
    want.forEach((id, i) => {
      let a = this.followers.get(id);
      if (!a) { a = new Actor(this, id, this.player.x, this.player.y); this.followers.set(id, a); snap = true; }
      if (snap) {
        const p = this.nearestStand(this.player.x - 28 * (i + 1), this.player.y + 6 * (i % 2 ? 1 : -1));
        a.setPos(p.x, p.y);
      }
    });
  }

  private updateFollowers(dt: number, moving: boolean): void {
    const FORM = [{ x: -30, y: 8 }, { x: 30, y: 10 }, { x: 0, y: 26 }];
    let i = 0;
    for (const a of this.followers.values()) {
      const h = this.history[Math.min(this.history.length - 1, (i + 1) * 22)];
      // à l'arrêt : formation autour du héros ; en marche : on suit le tracé, sans jamais coller au héros
      let tx = h ? h.x : a.x, ty = h ? h.y : a.y;
      if (!moving || Math.hypot(tx - this.player.x, ty - this.player.y) < 24) {
        const f = FORM[i % FORM.length];
        const p = this.nearestStand(this.player.x + f.x, this.player.y + f.y);
        tx = p.x; ty = p.y;
      }
      const dx = tx - a.x, dy = ty - a.y;
      const d = Math.hypot(dx, dy);
      if (d > 3) {
        const step = Math.min(d, (d > 90 ? RUN_SPEED * 1.6 : RUN_SPEED) * dt);
        const nx = a.x + (dx / d) * step, ny = a.y + (dy / d) * step;
        a.setFacingVec(dx, dy); a.setPos(nx, ny);
      }
      a.tick(dt, d > 6);
      i++;
    }
  }

  // ----------------------------------------------------------- interaction
  private allHotspots(): Hotspot[] {
    return [...(this.loc.hotspots ?? []), ...this.sceneHotspots, ...this.questHotspots].filter((h) => evalCond(hub.state, h.cond));
  }

  private updateTarget(): void {
    let best: Target | null = null;
    const px = this.player.x, py = this.player.y;
    const reachR = 1 + heroMods().reach;
    const consider = (t: Target) => { const d = t.dist + (t.kind === 'hotspot' && hub.state.seenHotspots[t.id] ? 30 : 0) + (t.kind === 'hotspot' && t.id.startsWith('quest:') ? 25 : 0); if (t.dist <= INTERACT_RADIUS * 1.25 * reachR && (!best || d < best.dist)) best = { ...t, dist: d }; };
    for (const [id, a] of this.npcs) {
      if (!this.talkHandlers.has(id)) continue;
      consider({ kind: 'actor', id, x: a.x, y: a.y, label: `${a.verb ?? 'Parler à'} ${a.title ?? nameOf(id)}`.replace(/^Guider (.*)$/, 'Guider : $1'), dist: Math.hypot(a.x - px, a.y - py) - 40 });
    }
    for (const [id, a] of this.followers) {
      // Un compagnon attendu par l'histoire (conversation de scène) passe avant les autres, même s'ils sont groupés.
      consider({ kind: 'follower', id, x: a.x, y: a.y, label: `Parler à ${nameOf(id)}`, dist: Math.hypot(a.x - px, a.y - py) + (this.talkHandlers.has(id) ? -40 : 45) });
    }
    for (const h of this.allHotspots()) {
      const r = this.hotRect(h);
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      const dx = Math.max(r.x - px, 0, px - (r.x + r.w)), dy = Math.max(r.y - py, 0, py - (r.y + r.h));
      const d = Math.hypot(dx, dy);
      consider({ kind: 'hotspot', id: h.id, x: cx, y: cy, label: `${h.verb ?? 'Examiner'} : ${h.label}`, dist: d });
    }
    const rest = this.loc.rest;
    if (rest) {
      const dx = Math.max(rest.x - px, 0, px - (rest.x + rest.w)), dy = Math.max(rest.y - py, 0, py - (rest.y + rest.h));
      consider({ kind: 'rest', id: 'rest', x: rest.x + rest.w / 2, y: rest.y + rest.h / 2, label: 'Se reposer au puits', dist: Math.hypot(dx, dy) });
    }
    this.setTarget(best);
  }

  private setTarget(t: Target | null): void {
    this.target = t;
    hub.ui?.prompt(t ? `E — ${t.label}` : null);
  }

  async interact(): Promise<void> {
    const t = this.target;
    if (!t || hub.locked || this.cinematic || this.transitioning || this.combat.active) return;
    hub.lock();
    audio.interact();
    try {
      if (t.kind === 'actor') { const fn = this.talkHandlers.get(t.id); this.setTarget(null); if (fn) await fn(); }
      else if (t.kind === 'follower') { const fn = this.talkHandlers.get(t.id); this.setTarget(null); if (fn) await fn(); else await this.banter(t.id as CompanionId); }
      else if (t.kind === 'rest') await hub.ui.restMenu();
      else if (t.kind === 'hotspot') await this.examine(t.id);
    } catch (e) {
      console.error('Erreur pendant une interaction', e);
      throw e;
    } finally { hub.unlock(); }
  }

  private async examine(id: string): Promise<void> {
    const h = this.allHotspots().find((x) => x.id === id);
    if (!h) return;
    if (h.id.startsWith('resume:')) { const sid = h.id.split(':')[1]; hub.unlock(); try { this.setSceneHotspots(undefined); await this.director.runScene(sid, Number(hub.state.flags[`resume_${sid}`] ?? 0)); } finally { hub.lock(); } return; }
    if (h.id.startsWith('quest:')) { const qid = h.id.split(':')[1]; hub.unlock(); try { await this.director.runQuestStage(qid); } finally { hub.lock(); } return; }
    const r = this.hotRect(h);
    this.player.setFacingVec(r.x + r.w / 2 - this.player.x, r.y + r.h / 2 - this.player.y);
    await hub.ui.say(h.text.map((t) => ({ who: 'narr', text: t, narr: true })));
    hub.state.seenHotspots[h.id] = true;
    applyEffects(hub.state, h.effects, `hs:${h.id}`);
    hub.events.emit('hotspot', h.id);
  }

  private async banter(id: CompanionId): Promise<void> {
    const lines = bannerFor(id, hub.state);
    this.player.setFacingVec(this.followers.get(id)!.x - this.player.x, 0);
    await hub.ui.say(lines.map((t) => ({ who: id, text: t })));
  }

  // --------------------------------------------------------------- sorties
  private checkExits(): void {
    // Pendant une scène ou une étape de quête, les sorties sont inactives : l'histoire ne change de lieu que par ses propres étapes.
    if (this.director.running || this.director.questRunning) return;
    const feet = this.player;
    for (const e of this.loc.exits) {
      if (!inRect(e.rect, feet.x, feet.y)) continue;
      if (!evalCond(hub.state, e.cond)) {
        if (!this.exitHint.has(e.id)) {
          hub.ui.toast(e.lockedText ?? 'Le passage est fermé pour l\'instant.');
          const t = this.add.text(0, 0, '').setVisible(false);
          this.exitHint.set(e.id, t);
          this.time.delayedCall(2500, () => { this.exitHint.get(e.id)?.destroy(); this.exitHint.delete(e.id); });
        }
        continue;
      }
      if (!hub.locations.has(e.to)) {
        if (!this.exitHint.has(e.id)) { hub.ui.toast(`Zone « ${e.to} » non disponible.`); this.exitHint.set(e.id, this.add.text(0, 0, '').setVisible(false)); this.time.delayedCall(2500, () => { this.exitHint.get(e.id)?.destroy(); this.exitHint.delete(e.id); }); }
        continue;
      }
      void this.travel(e.to, e.spawn);
      return;
    }
  }

  /** Transition avec fondu vers un autre lieu. */
  async travel(locId: string, spawn?: string | Pt, face?: Facing): Promise<void> {
    if (this.transitioning) return;
    this.transitioning = true;
    audio.whoosh();
    hub.ui.prompt(null);
    await hub.ui.fade(true, 260);
    try {
      await this.loadLocation(locId, spawn, face);
      this.director.afterLocationLoad();
    } finally {
      await hub.ui.fade(false, 260);
      this.transitioning = false;
    }
    await this.director.onEnterLocation(locId);
  }

  // ------------------------------------------------------------------ dessin
  private drawHints(): void {
    const g = this.hintGfx;
    g.clear();
    if (this.goalRect) {
      const r = this.goalRect;
      const a = 0.35 + Math.sin(this.pulse * 4) * 0.15;
      g.lineStyle(3, 0xfff0a0, a).strokeRoundedRect(r.x, r.y, r.w, r.h, 12);
      g.fillStyle(0xfff0a0, a * 0.25).fillRoundedRect(r.x, r.y, r.w, r.h, 12);
    }
    if (hub.locked || this.cinematic) return;
    for (const h of this.allHotspots()) {
      if (hub.state.seenHotspots[h.id]) continue;
      const r = this.hotRect(h);
      const cx = r.x + r.w / 2, cy = r.y + Math.min(r.h, 30) / 2;
      const a = 0.5 + Math.sin(this.pulse * 3 + cx) * 0.25;
      g.fillStyle(0xffffff, a * 0.5).fillCircle(cx, cy, 5);
      g.lineStyle(2, 0xfff0a0, a).strokeCircle(cx, cy, 8);
    }
    for (const [id] of this.npcs) {
      if (!this.talkHandlers.has(id)) continue;
      const a = this.npcs.get(id)!;
      g.fillStyle(0xfff0a0, 0.9).fillTriangle(a.x - 6, a.y - a.height - 16 + Math.sin(this.pulse * 4) * 3, a.x + 6, a.y - a.height - 16 + Math.sin(this.pulse * 4) * 3, a.x, a.y - a.height - 6 + Math.sin(this.pulse * 4) * 3);
    }
  }

  drawDebug(): void {
    const g = this.add.graphics().setDepth(DEPTH.ui - 1);
    this.debugGfx = g;
    g.fillStyle(0x00ff88, 0.18);
    for (const r of this.loc.walk) g.fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle(0xff0044, 0.3);
    for (const r of this.loc.blocks ?? []) g.fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle(0xffee00, 0.35);
    for (const e of this.loc.exits) g.fillRect(e.rect.x, e.rect.y, e.rect.w, e.rect.h);
    g.lineStyle(2, 0x66aaff, 0.9);
    for (const h of this.allHotspots()) { const r = this.hotRect(h); g.strokeRect(r.x, r.y, r.w, r.h); }
  }

  /** Ajoute une zone au sol (marqueur visuel d'un objectif d'appui). */
  addMark(g: Phaser.GameObjects.Graphics): void { this.marks.push(g); }
}
