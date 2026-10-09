// Menus : pause, journal, inventaire, carte, sauvegardes, options, puits. Tous suspendent la simulation.
import Phaser from 'phaser';
import { DEPTH, GAME_H, GAME_W } from '../config';
import { hub } from '../game';
import { COL, button, downloadText, panel, pickTextFile, text, type Btn } from './kit';
import { EQUIPMENT, NARRATIVE, TRUST_WORDS, UPGRADES } from '../data/items';
import { POWERS } from '../data/powers';
import { CHARS, COMPANIONS, nameOf } from '../data/characters';
import { SLOTS, SaveError, eraseSlot, exportSlot, importInto, saveOptions, slotInfo, type SlotId } from '../core/save';
import { saveTo, loadFrom } from '../systems/Saves';
import { applyEffects, evalCond } from '../core/state';
import { bannerFor } from '../data/banter';
import type { CompanionId } from '../core/types';

type Kind = 'pause' | 'journal' | 'inventory' | 'map' | 'saves' | 'options' | 'rest' | 'points';

const SLOT_NAME: Record<SlotId, string> = { slot1: 'Emplacement 1', slot2: 'Emplacement 2', slot3: 'Emplacement 3', auto: 'Sauvegarde automatique', threshold: 'Sauvegarde du seuil' };
const fmtTime = (ms = 0) => `${Math.floor(ms / 3600000)} h ${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}`;

export class Menus {
  private kind: Kind | '' = '';
  private objs: { destroy(): void }[] = [];
  private restResolve?: () => void;

  constructor(private s: Phaser.Scene) {}

  isOpen(k: string): boolean { return k === '' ? this.kind !== '' : this.kind === k; }

  toggle(k: Kind): void {
    if (this.kind === k) { this.close(); return; }
    if (this.kind) this.destroyObjs(); else {
      if (hub.locked && k !== 'pause') return;
      hub.lock();
    }
    this.kind = k;
    this.build(k);
  }

  private destroyObjs(): void { for (const o of this.objs) o.destroy(); this.objs = []; }

  close(): void {
    if (!this.kind) return;
    this.destroyObjs();
    this.kind = '';
    hub.unlock();
    if (this.restResolve) { this.restResolve(); this.restResolve = undefined; }
  }

  private add<T extends { destroy(): void }>(o: T): T { this.objs.push(o); return o; }
  private D = DEPTH.ui + 40;

  private frame(title: string, w = 820, h = 470): { x: number; y: number } {
    const s = this.s;
    const x = (GAME_W - w) / 2, y = (GAME_H - h) / 2;
    this.add(s.add.rectangle(0, 0, GAME_W, GAME_H, 0x061018, 0.72).setOrigin(0, 0).setDepth(this.D).setInteractive());
    this.add(panel(s, x, y, w, h, 0.97).setDepth(this.D + 1));
    this.add(text(s, GAME_W / 2, y + 12, title, 26, COL.gold).setOrigin(0.5, 0).setDepth(this.D + 2));
    this.btn(x + w - 120, y + h - 50, 100, 36, 'Fermer', () => this.close());
    return { x, y };
  }

  private btn(x: number, y: number, w: number, h: number, label: string, cb: () => void, size = 16): Btn {
    const b = button(this.s, x, y, w, h, label, cb, size);
    b.box.setDepth(this.D + 2); b.label.setDepth(this.D + 3);
    this.add(b);
    return b;
  }
  private txt(x: number, y: number, t: string, size = 16, color: string = COL.text, wrap?: number): Phaser.GameObjects.Text {
    return this.add(text(this.s, x, y, t, size, color, wrap).setDepth(this.D + 2));
  }
  private rebuild(): void { const k = this.kind; if (!k) return; this.destroyObjs(); this.build(k); }

  private build(k: Kind): void {
    if (k === 'pause') this.pause();
    else if (k === 'journal') this.journal();
    else if (k === 'inventory') this.inventory();
    else if (k === 'map') this.map();
    else if (k === 'saves') this.saves();
    else if (k === 'options') this.options();
    else if (k === 'rest') this.restPanel();
    else if (k === 'points') this.points();
  }

  // -------------------------------------------------------------------- pause
  private pause(): void {
    const { x, y } = this.frame('Pause', 420, 420);
    const items: [string, () => void][] = [
      ['Reprendre', () => this.close()],
      ['Journal (J)', () => this.go('journal')],
      ['Inventaire (I)', () => this.go('inventory')],
      ['Carte (M)', () => this.go('map')],
      ['Sauvegarder / Charger', () => this.go('saves')],
      ['Options', () => this.go('options')],
      ['Retour au titre', async () => { if (await hub.ui.confirm('Retourner au titre ? La progression non sauvegardée sera perdue.', 'Oui, retourner', 'Non')) { this.close(); hub.events.emit('return-title'); } }],
    ];
    items.forEach(([l, f], i) => this.btn(x + 60, y + 60 + i * 48, 300, 40, l, f));
  }
  private go(k: Kind): void { this.destroyObjs(); this.kind = k; this.build(k); }

  // ------------------------------------------------------------------ journal
  private tab = 'story';
  private journal(): void {
    const { x, y } = this.frame('Journal');
    const s = hub.state;
    const tabs: [string, string][] = [['story', 'Histoire'], ['quests', 'Quêtes'], ['people', 'Personnes'], ['memory', 'Souvenirs'], ['log', 'Dialogues']];
    tabs.forEach(([id, l], i) => { const b = this.btn(x + 20 + i * 150, y + 54, 142, 34, l, () => { this.tab = id; this.rebuild(); }, 15); if (this.tab === id) b.box.setFillStyle(COL.btnHi); });
    let lines: string[] = [];
    const pend = hub.world?.director.pending ? hub.scenes.get(hub.world.director.pending) : undefined;
    if (this.tab === 'story') {
      lines.push(`Chapitre ${s.chapter} — ${s.chapter === 0 ? 'Prologue' : ''}`.trim());
      lines.push(pend ? `Prochain objectif : ${pend.title} (${hub.locations.get(pend.loc)?.name ?? pend.loc})` : 'Prochain objectif : poursuivre l\'aventure.');
      lines.push('');
      for (const id of s.completedScenes.slice(-10)) lines.push(`• ${hub.scenes.get(id)?.title ?? id}`);
      for (const j of s.journal.filter((e) => e.tab === 'story')) lines.push('', `${j.title}\n${j.text}`);
    } else if (this.tab === 'quests') {
      for (const q of hub.quests.values()) {
        const st = s.quests[q.id];
        if (st === 'unavailable') continue;
        const stName = { available: 'À découvrir', active: 'En cours', completed: 'Terminée', left_open: 'Laissée ouverte' }[st as string] ?? st;
        lines.push(`${q.title} — ${stName}`, `   ${q.summary}`);
        const qs = q as unknown as import('../core/types').QuestScript;
        if (st === 'available' || st === 'active') { const idx = Number(s.flags[`qs_${q.id}`] ?? 0); const stg = qs.stages[idx]; if (stg) lines.push(`   Prochaine action : ${stg.task} (${hub.locations.get(stg.loc)?.name ?? stg.loc})`); }
        lines.push('');
      }
      if (!lines.length) lines.push('Aucune quête pour l\'instant. Parlez aux habitants.');
    } else if (this.tab === 'people') {
      for (const id of COMPANIONS) if (s.party.includes(id) || s.trust[id] !== undefined) lines.push(`${nameOf(id)} — confiance : ${TRUST_WORDS[Math.round(s.trust[id] ?? 1)]}`);
      for (const j of s.journal.filter((e) => e.tab === 'people')) lines.push('', `${j.title}\n${j.text}`);
      if (!lines.length) lines.push('Personne pour l\'instant.');
    } else if (this.tab === 'memory') {
      for (const j of s.journal.filter((e) => e.tab === 'memory')) lines.push(`${j.title}\n${j.text}`, '');
      if (!lines.length) lines.push('Aucun souvenir noté.');
    } else {
      lines = s.seenLines.slice(-14);
      if (!lines.length) lines.push('Rien encore.');
    }
    const t = this.txt(x + 24, y + 100, lines.join('\n'), 15, COL.text, 770);
    t.setCrop(0, 0, 780, 330);
    let off = 0;
    const wheel = (_p: unknown, _o: unknown, _dx: number, dy: number) => { off = Math.max(0, Math.min(Math.max(0, t.height - 330), off + dy)); t.setCrop(0, off, 780, 330); t.y = y + 100 - off; };
    this.s.input.on('wheel', wheel);
    this.objs.push({ destroy: () => this.s.input.off('wheel', wheel) });
  }

  // --------------------------------------------------------------- inventaire
  private inventory(): void {
    const { x, y } = this.frame('Inventaire et équipement');
    const s = hub.state;
    this.txt(x + 24, y + 54, `Vie ${Math.ceil(s.hero.hp)}/${s.hero.maxHp}   Énergie ${Math.ceil(s.hero.energy)}/${s.hero.maxEnergy}   Pièces ${s.money}   Soins ${s.consumables.soin ?? 0}/5   Points d'amélioration : ${s.hero.points}`, 15, COL.gold);
    // équipement
    let yy = y + 90;
    this.txt(x + 24, yy, 'Équipement', 17, COL.gold); yy += 28;
    for (const slot of ['arme', 'protection', 'talisman'] as const) {
      const cur = s.equipment.slots[slot];
      const owned = s.equipment.owned.filter((id) => EQUIPMENT[id]?.slot === slot);
      this.txt(x + 24, yy + 6, `${slot[0].toUpperCase() + slot.slice(1)} : ${cur ? EQUIPMENT[cur].name : '—'}`, 15);
      if (owned.length) this.btn(x + 300, yy, 130, 30, 'Changer', () => {
        const i = owned.indexOf(cur ?? '');
        s.equipment.slots[slot] = owned[(i + 1) % owned.length];
        this.rebuild();
      }, 14);
      yy += 38;
    }
    this.txt(x + 24, yy + 4, 'Pouvoirs : ' + (s.powers.length ? s.powers.map((p) => POWERS[p].name).join(', ') : 'aucun'), 15, COL.text, 400);
    yy += 56;
    this.btn(x + 24, yy, 260, 34, `Améliorations (${s.hero.points} pt)`, () => this.go('points'), 15);
    // objets
    this.txt(x + 450, y + 90, 'Objets', 17, COL.gold);
    const names = s.items.map((i) => NARRATIVE[i]?.name ?? i);
    const t = this.txt(x + 450, y + 118, names.length ? names.map((n) => `• ${n}`).join('\n') : 'Aucun objet.', 14, COL.text, 350);
    t.setCrop(0, 0, 350, 280);
    if (s.items.length) this.txt(x + 24, y + 340, (NARRATIVE[s.items[s.items.length - 1]]?.text ?? ''), 13, COL.dim, 400);
  }

  private points(): void {
    const { x, y } = this.frame('Améliorations');
    const s = hub.state;
    this.txt(x + 24, y + 54, `Points disponibles : ${s.hero.points} — gratuits à redistribuer au puits (« Répartir »).`, 15, COL.gold);
    UPGRADES.forEach((u, i) => {
      const col = Math.floor(i / 4);
      const yy = y + 90 + (i % 4) * 66;
      const xx = x + 20 + col * 270;
      if (i % 4 === 0) this.txt(xx, y + 80 - 22 + 0, u.orient, 16, COL.gold);
      const have = s.hero.spent[u.id] ?? 0;
      const b = this.btn(xx, yy + 8, 250, 56, `${u.name}${have ? ' ✓' : ''}\n${u.text}`, () => {
        if (have) { s.hero.spent[u.id] = 0; s.hero.points++; }
        else if (s.hero.points > 0) { s.hero.spent[u.id] = 1; s.hero.points--; }
        this.rebuild();
      }, 13);
      if (have) b.box.setFillStyle(COL.btnHi);
    });
    this.btn(x + 20, y + 400, 180, 34, 'Retour', () => this.go('inventory'), 14);
  }

  // -------------------------------------------------------------------- carte
  private map(): void {
    const { x, y } = this.frame('Carte des lieux', 900, 500);
    const s = hub.state;
    const pend = hub.world?.director.pending ? hub.scenes.get(hub.world.director.pending) : undefined;
    const g = this.add(this.s.add.graphics().setDepth(this.D + 2));
    const pos = (id: string) => { const m = hub.locations.get(id)?.mapPos ?? { x: 0.5, y: 0.5 }; return { x: x + 40 + m.x * 820, y: y + 70 + m.y * 340 }; };
    const seen = new Set(s.discovered);
    g.lineStyle(2, 0xc9a45a, 0.5);
    for (const l of hub.locations.values()) {
      if (!seen.has(l.id)) continue;
      for (const e of l.exits) if (hub.locations.has(e.to) && seen.has(e.to)) { const a = pos(l.id), b = pos(e.to); g.lineBetween(a.x, a.y, b.x, b.y); }
    }
    const canTravel = !hub.world?.director.running && !hub.world?.combat.active;
    for (const l of hub.locations.values()) {
      if (!seen.has(l.id)) continue;
      const p = pos(l.id);
      const here = s.location.loc === l.id, goal = pend?.loc === l.id;
      g.fillStyle(here ? 0xffd98a : goal ? 0x8ae0ff : 0x3a5a7a, 1).fillCircle(p.x, p.y, 11);
      g.lineStyle(2, 0xffffff, 0.8).strokeCircle(p.x, p.y, 11);
      const hit = this.add(this.s.add.circle(p.x, p.y, 16, 0xffffff, 0.001).setDepth(this.D + 3).setInteractive({ useHandCursor: true }));
      hit.on('pointerdown', () => {
        if (!canTravel || here || s.chapter < 1) { hub.ui.toast(here ? 'Vous êtes ici.' : 'Déplacement rapide indisponible maintenant.'); return; }
        this.close();
        void hub.world!.travel(l.id, 'default');
      });
      this.add(text(this.s, p.x, p.y + 15, l.name, 12, here ? COL.gold : COL.text).setOrigin(0.5, 0).setDepth(this.D + 3));
    }
    this.txt(x + 24, y + 440, `Jaune : vous êtes ici — Bleu clair : objectif d'histoire${pend ? ` (${hub.locations.get(pend.loc)?.name ?? ''})` : ''}. Cliquez un lieu découvert pour y aller (hors scène).`, 13, COL.dim, 700);
  }

  // ------------------------------------------------------------- sauvegardes
  private saves(): void {
    const { x, y } = this.frame('Sauvegardes (stockage de ce navigateur)', 860, 470);
    this.txt(x + 24, y + 48, 'Les sauvegardes sont locales à ce navigateur : exportez un fichier pour changer de machine.', 14, COL.dim, 800);
    SLOTS.forEach((sl, i) => {
      const info = slotInfo(sl);
      const yy = y + 80 + i * 62;
      const label = info.empty ? 'vide' : info.broken ? 'illisible' : `Ch. ${info.chapter} — ${hub.scenes.get(info.scene ?? '')?.title ?? info.scene ?? 'exploration'} — ${fmtTime(info.playMs)}`;
      this.txt(x + 24, yy, SLOT_NAME[sl], 15, COL.gold);
      this.txt(x + 24, yy + 24, label, 13, COL.text, 330);
      const manual = sl.startsWith('slot');
      if (manual) this.btn(x + 360, yy, 90, 40, 'Écrire', () => { if (hub.world?.director.running || hub.world?.combat.active) { hub.ui.toast('Sauvegarde manuelle impossible pendant une scène ou un combat : utilisez un puits.'); return; } saveTo(sl); this.rebuild(); }, 14);
      const ld = this.btn(x + 456, yy, 90, 40, 'Charger', () => { if (loadFrom(sl)) { this.close(); hub.events.emit('load-game'); } }, 14); ld.setEnabled(!info.empty && !info.broken);
      const ex = this.btn(x + 552, yy, 90, 40, 'Exporter', () => { const t = exportSlot(sl); if (t) downloadText(`rpg-origins-${sl}.json`, t); }, 14); ex.setEnabled(!info.empty && !info.broken);
      if (manual) {
        this.btn(x + 648, yy, 90, 40, 'Importer', async () => {
          const t = await pickTextFile(); if (t === null) return;
          try { importInto(sl, t); hub.ui.toast('Sauvegarde importée.'); this.rebuild(); } catch (e) { hub.ui.toast(e instanceof SaveError ? e.message : 'Import impossible.'); }
        }, 14);
        this.btn(x + 744, yy, 90, 40, 'Effacer', async () => { if (await hub.ui.confirm(`Effacer « ${SLOT_NAME[sl]} » ?`, 'Effacer', 'Annuler')) { eraseSlot(sl); this.rebuild(); } }, 14);
      }
    });
  }

  // ------------------------------------------------------------------ options
  private options(): void {
    const { x, y } = this.frame('Options', 720, 440);
    const o = hub.options;
    const row = (i: number, label: string, val: () => string, dec: () => void, inc: () => void) => {
      const yy = y + 60 + i * 52;
      this.txt(x + 30, yy + 6, label, 17);
      this.btn(x + 380, yy, 46, 36, '−', () => { dec(); saveOptions(o); this.rebuild(); });
      this.txt(x + 440, yy + 6, val(), 17, COL.gold);
      this.btn(x + 560, yy, 46, 36, '+', () => { inc(); saveOptions(o); this.rebuild(); });
    };
    const pct = (v: number) => `${Math.round(v * 100)} %`;
    row(0, 'Musique', () => pct(o.music), () => { o.music = Math.max(0, +(o.music - 0.1).toFixed(2)); }, () => { o.music = Math.min(1, +(o.music + 0.1).toFixed(2)); });
    row(1, 'Effets sonores', () => pct(o.sfx), () => { o.sfx = Math.max(0, +(o.sfx - 0.1).toFixed(2)); }, () => { o.sfx = Math.min(1, +(o.sfx + 0.1).toFixed(2)); });
    row(2, 'Vitesse du texte', () => `${o.textSpeed} car./s`, () => { o.textSpeed = Math.max(15, o.textSpeed - 10); }, () => { o.textSpeed = Math.min(200, o.textSpeed + 10); });
    row(3, 'Taille du texte', () => `${o.textSize}`, () => { o.textSize = Math.max(14, o.textSize - 1); }, () => { o.textSize = Math.min(24, o.textSize + 1); });
    const diffBtn = this.btn(x + 30, y + 60 + 4 * 52, 330, 36, `Difficulté : ${hub.state.difficulty === 'histoire' ? 'Histoire (dégâts réduits)' : 'Aventure'}`, () => {
      if (hub.world?.combat.active) return;
      hub.state.difficulty = hub.state.difficulty === 'histoire' ? 'aventure' : 'histoire'; this.rebuild();
    }, 15);
    void diffBtn;
    this.btn(x + 380, y + 60 + 4 * 52, 300, 36, `Effets lumineux réduits : ${o.reduceFx ? 'oui' : 'non'}`, () => { o.reduceFx = !o.reduceFx; saveOptions(o); this.rebuild(); }, 15);
    this.txt(x + 30, y + 60 + 5 * 52 + 6, 'Touches : ZQSD / WASD / flèches (déplacement), Maj (course), E (agir), Clic gauche (frapper), Espace (esquive), clic droit (pouvoir), 1/2 (raccourcis), R (soutien), F (soin), V (Voile), Tab (pause de réflexion), I J M (menus), Échap.', 13, COL.dim, 660);
  }

  // -------------------------------------------------------------------- puits
  rest(): Promise<void> {
    return new Promise((resolve) => { this.restResolve = resolve; hub.lock(); this.kind = 'rest'; this.build('rest'); });
  }

  private restPanel(): void {
    const { x, y } = this.frame('Le puits', 520, 420);
    const s = hub.state;
    this.txt(x + 30, y + 52, 'Une eau claire. On peut demander ; on ne peut pas appeler son besoin une permission.', 14, COL.dim, 460);
    this.btn(x + 40, y + 100, 440, 42, 'Se reposer : soigne la vie et l\'énergie', () => {
      applyEffects(s, [{ op: 'heal' }]);
      hub.events.emit('rested');
      hub.ui.toast('Vous vous reposez. Vie et énergie restaurées.');
    });
    this.btn(x + 40, y + 152, 440, 42, 'Sauvegarder (emplacement automatique + choix)', () => { saveTo('auto'); this.go('saves'); this.kind = 'saves'; });
    this.btn(x + 40, y + 204, 440, 42, `Répartir les améliorations (${s.hero.points} pt)`, () => this.go('points'));
    const comp = s.party.filter(() => evalCond(s, undefined));
    this.btn(x + 40, y + 256, 440, 42, comp.length ? `Parler à un compagnon (${comp.map(nameOf).join(', ')})` : 'Parler (personne ici)', () => {
      if (!comp.length) return;
      const who = comp[Math.floor(s.playMs / 3000) % comp.length] as CompanionId;
      const lines = bannerFor(who, s);
      hub.ui.toast(`${nameOf(who)} : « ${lines[0]} »`);
    });
    void CHARS;
  }
}
