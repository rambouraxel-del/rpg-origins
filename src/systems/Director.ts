// Exécute les scènes principales et les étapes de quêtes à partir des données. Les effets sont appliqués une seule fois.
import { hub } from '../game';
import { applyEffects, completeScene, evalCond, flag } from '../core/state';
import type { ActorPlacement, Choice, Effect, QuestScript, QuestStage, SceneDef, Step } from '../core/types';
import type { WorldScene } from '../scenes/WorldScene';
import { Actor } from './Actor';
import { saveTo } from './Saves';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class Director {
  activeScene: SceneDef | null = null;
  running = false;
  private questRunning = false;
  private runId = 0;

  constructor(private world: WorldScene) {}

  get pending(): string | null { return (hub.state.flags._pending as string | null) ?? null; }
  set pending(v: string | null) { hub.state.flags._pending = v; }

  /** Interrompt toute scène en cours (chargement d'une partie, retour au titre). */
  abort(): void {
    this.runId++;
    this.running = false;
    this.questRunning = false;
    this.activeScene = null;
    this.world.resetForLoad();
  }

  // --------------------------------------------------------------- démarrage
  async startNewGame(): Promise<void> {
    const first = hub.scenes.get('P01')!;
    this.pending = 'P01';
    hub.state.currentScene = null;
    await this.world.loadLocation(first.loc, first.spawn ?? 'default');
    await hub.ui.fade(false, 400);
    await this.onEnterLocation(first.loc);
  }

  /** Reprise depuis l'état chargé : lieu, scène en cours, étape. */
  async resume(): Promise<void> {
    const s = hub.state;
    const cur = s.currentScene ? hub.scenes.get(s.currentScene) : undefined;
    await this.world.loadLocation(s.location.loc, { x: s.location.x, y: s.location.y });
    this.world.syncFollowers(true);
    this.showObjectiveForPending();
    await hub.ui.fade(false, 300);
    if (cur && !s.completedScenes.includes(cur.id)) {
      if (cur.loc !== s.location.loc) await this.world.loadLocation(cur.loc, cur.spawn ?? 'default');
      void this.runScene(cur.id, s.stepIndex);
    } else {
      await this.onEnterLocation(s.location.loc);
    }
  }

  afterLocationLoad(): void {
    const sc = this.activeScene;
    if (sc && sc.loc === this.world.loc.id) {
      this.world.setSceneHotspots(sc.hotspots);
      this.world.setTint(sc.tint);
    } else {
      this.world.setSceneHotspots(undefined);
      this.world.setTint(undefined);
    }
    this.placeQuestEntries();
  }

  async onEnterLocation(locId: string): Promise<void> {
    if (this.running || this.questRunning) return;
    const id = this.pending;
    if (id) {
      const sc = hub.scenes.get(id);
      if (sc && sc.loc === locId && evalCond(hub.state, sc.requires) && !hub.state.completedScenes.includes(sc.id)) {
        await this.runScene(id, 0);
        return;
      }
    }
    this.showObjectiveForPending();
  }

  showObjectiveForPending(): void {
    const id = this.pending;
    const sc = id ? hub.scenes.get(id) : undefined;
    if (!sc) { hub.ui?.objective(null); return; }
    const loc = hub.locations.get(sc.loc);
    hub.ui?.objective(this.world.loc?.id === sc.loc ? null : `Histoire : rejoindre ${loc?.name ?? sc.loc}`);
  }

  // ---------------------------------------------------------------- scènes
  async runScene(id: string, from = 0): Promise<void> {
    const def = hub.scenes.get(id);
    if (!def || this.running) return;
    this.running = true;
    const myRun = ++this.runId;
    const s = hub.state;
    this.activeScene = def;
    s.currentScene = id;
    s.stepIndex = from;
    if (this.world.loc.id !== def.loc) {
      await hub.ui.fade(true, 250);
      await this.world.loadLocation(def.loc, def.spawn ?? 'default');
      await hub.ui.fade(false, 250);
    } else if (def.spawn && from === 0) {
      const sp = this.world.loc.spawns[def.spawn];
      if (sp) { this.world.player.setPos(sp.x, sp.y); this.world.syncFollowers(true); }
    }
    this.world.placeActors(def.actors);
    this.world.syncFollowers();
    this.afterLocationLoad();
    hub.ui.objective(null);
    for (let i = from; i < def.steps.length; i++) {
      s.stepIndex = i;
      await this.runStep(def.steps[i], `${id}:${i}`, def.id);
      if (myRun !== this.runId) return;
    }
    this.finishScene(def);
  }

  private finishScene(def: SceneDef): void {
    const s = hub.state;
    const saves = (def.onComplete ?? []).filter((e) => e.op === 'save');
    applyEffects(s, (def.onComplete ?? []).filter((e) => e.op !== 'save'), `scene:${def.id}`);
    completeScene(s, def.id);
    this.refreshQuests();
    this.activeScene = null;
    s.currentScene = null;
    s.stepIndex = 0;
    this.pending = def.next ?? null;
    this.world.placeActors(undefined);
    this.world.setSceneHotspots(undefined);
    this.world.setTint(undefined);
    this.world.syncFollowers();
    this.running = false;
    for (const e of saves) applyEffects(s, [e]);
    saveTo('auto');
    hub.events.emit('scene-done', def.id);
    if (def.summary) hub.ui.toast(def.summary);
    const nxt = def.next ? hub.scenes.get(def.next) : undefined;
    if (nxt && nxt.loc === this.world.loc.id && evalCond(s, nxt.requires)) void this.runScene(nxt.id, 0);
    else this.showObjectiveForPending();
  }

  /** Les quêtes passent à "disponible" quand leur condition est remplie (une seule fois, monotone). */
  refreshQuests(): void {
    for (const q of hub.quests.values()) {
      const cur = hub.state.quests[q.id];
      if (cur === 'unavailable' && evalCond(hub.state, (q as unknown as QuestScript).available)) {
        hub.state.quests[q.id] = 'available';
        hub.ui?.toast(`Nouvelle quête : ${q.title}`);
      }
    }
  }

  // ---------------------------------------------------------------- étapes
  async runStep(step: Step, once: string, sceneId: string): Promise<void> {
    const w = this.world, ui = hub.ui, s = hub.state;
    switch (step.t) {
      case 'say': {
        await ui.say(step.lines);
        applyEffects(s, step.effects, once);
        break;
      }
      case 'reach': {
        ui.objective(step.text);
        const zone = w.area(step.zone);
        w.setGoal(zone);
        await w.waitUntil(() => w.playerIn(zone) && !hub.locked);
        w.setGoal(null);
        ui.objective(null);
        applyEffects(s, step.effects, once);
        break;
      }
      case 'inspect': {
        const need = step.min ?? step.targets.length;
        const count = () => step.targets.filter((t) => s.seenHotspots[t]).length;
        const render = () => ui.objective(`${step.text} (${Math.min(count(), need)}/${need})`);
        render();
        const off = () => hub.events.off('hotspot', render);
        hub.events.on('hotspot', render);
        await w.waitUntil(() => count() >= need && !hub.locked);
        off();
        ui.objective(null);
        applyEffects(s, step.effects, once);
        break;
      }
      case 'talk': {
        ui.objective(step.text);
        const done = new Promise<void>((resolve) => {
          w.onTalk(step.npc, async () => {
            await ui.say(step.lines);
            if (step.choices) await this.runChoices(step.choicePrompt, step.choices, once);
            w.clearTalk(step.npc);
            resolve();
          });
        });
        await done;
        ui.objective(null);
        applyEffects(s, step.effects, once);
        break;
      }
      case 'choice': {
        await this.runChoices(step.prompt, step.options, once);
        break;
      }
      case 'puzzle': {
        ui.objective(`Énigme : ${step.def.title}`);
        await ui.puzzle(step.def);
        ui.objective(null);
        applyEffects(s, step.effects, once);
        break;
      }
      case 'combat': {
        if (step.text) ui.objective(step.text);
        await this.runCombat(step);
        ui.objective(null);
        applyEffects(s, step.effects, once);
        break;
      }
      case 'guide': {
        await this.runGuide(step);
        applyEffects(s, step.effects, once);
        break;
      }
      case 'stealth': {
        ui.objective(step.text);
        await w.stealth.run(step);
        ui.objective(null);
        applyEffects(s, step.effects, once);
        break;
      }
      case 'move': {
        await ui.fade(true, 300);
        await w.loadLocation(step.loc, step.spawn);
        this.afterLocationLoad();
        const sc = this.activeScene;
        if (sc && sc.loc !== step.loc) { /* la scène continue ailleurs : acteurs de la scène non affichés */ w.placeActors(undefined); }
        await ui.fade(false, 300);
        break;
      }
      case 'fx': {
        if (step.kind === 'fade-out') await ui.fade(true, step.ms ?? 500);
        else if (step.kind === 'fade-in') await ui.fade(false, step.ms ?? 500);
        else if (step.kind === 'flash') { ui.flash(step.ms ?? 500); await sleep(step.ms ?? 500); }
        else if (step.kind === 'shake') { w.cameras.main.shake(step.ms ?? 400, 0.006); await sleep(step.ms ?? 400); }
        else if (step.kind === 'title') await ui.titleCard(step.text ?? '', step.ms ?? 2600);
        else await sleep(step.ms ?? 400);
        break;
      }
      case 'set': applyEffects(s, step.effects, once); break;
      case 'rest': {
        ui.objective(step.text);
        await new Promise<void>((resolve) => { const f = () => { hub.events.off('rested', f); resolve(); }; hub.events.on('rested', f); });
        ui.objective(null);
        applyEffects(s, step.effects, once);
        break;
      }
      case 'finalChoice': {
        const route = await ui.finalChoice();
        if (!s.flags.final_route) { s.flags.final_route = route; }
        break;
      }
      case 'end': {
        s.flags.ending = step.ending;
        s.flags._ended = true;
        saveTo('auto');
        await ui.fade(true, 800);
        await ui.epilogue(step.ending);
        await ui.credits(step.ending);
        hub.events.emit('return-title');
        // on laisse l'appelant gérer le retour ; la scène ne se termine pas
        await new Promise<void>(() => undefined);
        break;
      }
    }
    void sceneId;
  }

  private async runChoices(prompt: string | undefined, options: Choice[], once: string): Promise<void> {
    const s = hub.state;
    const avail = options.filter((o) => evalCond(s, o.cond));
    if (!avail.length) return;
    const i = await hub.ui.choose(prompt, avail.map((o) => o.label));
    const o = avail[i];
    if (o.set) s.flags[o.set.key] = o.set.value;
    applyEffects(s, o.effects, `${once}:c${i}`);
    if (o.lines) await hub.ui.say(o.lines);
  }

  private async runCombat(step: Extract<Step, { t: 'combat' }>): Promise<void> {
    const s = hub.state;
    for (;;) {
      const snap = JSON.stringify({ hp: s.hero.hp, energy: s.hero.energy, c: s.consumables });
      const r = await this.world.combat.run(step.enemies, { support: step.support !== false, pauseAllowed: step.pauseAllowed !== false });
      if (r === 'won') return;
      const a = await hub.ui.gameOver();
      const o = JSON.parse(snap) as { hp: number; energy: number; c: Record<string, number> };
      s.hero.hp = Math.max(o.hp, Math.ceil(s.hero.maxHp * 0.6)); s.hero.energy = o.energy; s.consumables = o.c;
      if (a === 'load') { hub.events.emit('reload-last'); await new Promise<void>(() => undefined); }
    }
  }

  private async runGuide(step: Extract<Step, { t: 'guide' }>): Promise<void> {
    const w = this.world;
    const remaining = new Set(step.groups.map((g) => g.id));
    const render = () => hub.ui.objective(`${step.text} (${step.groups.length - remaining.size}/${step.groups.length})`);
    render();
    const actors: Actor[] = [];
    for (const g of step.groups) {
      const from = w.pt(g.from), to = w.pt(g.to);
      const a = new Actor(w, 'civil', from.x, from.y);
      a.title = g.label; a.verb = 'Guider';
      actors.push(a);
      w.npcs.set(`g_${g.id}`, a);
      w.onTalk(`g_${g.id}`, async () => {
        w.clearTalk(`g_${g.id}`);
        await hub.ui.say([{ who: 'narr', narr: true, text: `${g.label} : « On vous suit. »` }]);
        const dist = Math.hypot(to.x - a.x, to.y - a.y);
        const ms = Math.max(600, dist * 9);
        const sx = a.x, sy = a.y;
        await new Promise<void>((resolve) => {
          const o = { t: 0 };
          w.tweens.add({ targets: o, t: 1, duration: ms, onUpdate: () => { a.setFacingVec(to.x - sx, to.y - sy); a.setPos(sx + (to.x - sx) * o.t, sy + (to.y - sy) * o.t); a.tick(0.016, true); }, onComplete: () => resolve() });
        });
        a.setPos(to.x, to.y); a.tick(0, false);
        remaining.delete(g.id);
        render();
      });
    }
    await w.waitUntil(() => remaining.size === 0);
    hub.ui.objective(null);
    for (const a of actors) a.setVisible(true);
    for (const g of step.groups) { w.npcs.delete(`g_${g.id}`); }
  }

  // ---------------------------------------------------------------- quêtes
  /** Place sur le lieu courant les points d'entrée des quêtes disponibles ou en cours. */
  placeQuestEntries(): void {
    const scene = this.world;
    const list: import('../core/types').Hotspot[] = [];
    for (const q of hub.quests.values()) {
      const qs = q as unknown as QuestScript;
      const st = hub.state.quests[qs.id];
      if (st !== 'available' && st !== 'active') continue;
      const idx = this.questStage(qs.id);
      const stage = qs.stages[idx];
      if (!stage || stage.loc !== scene.loc?.id) continue;
      list.push({ id: `quest:${qs.id}:${idx}`, at: stage.entry.at, label: stage.entry.label, verb: stage.entry.verb ?? 'Aider', text: [], effects: [] });
    }
    scene.setQuestHotspots(list);
  }

  questStage(id: string): number { return Number(hub.state.flags[`qs_${id}`] ?? 0); }

  /** Appelé quand le joueur interagit avec un point d'entrée de quête. */
  async runQuestStage(qid: string): Promise<void> {
    if (this.running || this.questRunning) return;
    const qs = hub.quests.get(qid) as unknown as QuestScript | undefined;
    if (!qs) return;
    const idx = this.questStage(qid);
    const stage: QuestStage | undefined = qs.stages[idx];
    if (!stage) return;
    this.questRunning = true;
    const s = hub.state;
    if (s.quests[qid] === 'available') { s.quests[qid] = 'active'; hub.ui.toast(`Quête commencée : ${qs.title}`); }
    this.world.placeActors(stage.actors);
    this.world.setSceneHotspots(stage.hotspots);
    for (let i = 0; i < stage.steps.length; i++) await this.runStep(stage.steps[i], `quest:${qid}:${idx}:${i}`, qid);
    this.world.placeActors(undefined);
    this.world.setSceneHotspots(undefined);
    s.flags[`qs_${qid}`] = idx + 1;
    if (idx + 1 >= qs.stages.length) {
      applyEffects(s, qs.rewards, `quest-reward:${qid}`);
      s.quests[qid] = 'completed';
      hub.ui.toast(`Quête accomplie : ${qs.title}`);
      hub.events.emit('quest-done', qid);
    } else hub.ui.toast(`Quête : ${qs.title} — étape suivante dans le journal`);
    this.questRunning = false;
    this.afterLocationLoad();
    saveTo('auto');
  }

  /** Quêtes encore ouvertes au seuil final. */
  leaveOpenQuests(): void {
    for (const [id, st] of Object.entries(hub.state.quests)) if (st === 'available' || st === 'active') hub.state.quests[id] = 'left_open';
  }

}

export type { Effect, ActorPlacement };
void flag;
