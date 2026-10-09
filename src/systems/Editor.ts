// Mini-éditeur de zones (mode développement : ouvrir le jeu avec ?dev=1, touche F3).
// Dessine zones de marche, obstacles, sorties, zones nommées et ancres sur le décor ; exporte / réimporte en JSON sans perte.
import Phaser from 'phaser';
import { DEPTH } from '../config';
import { hub } from '../game';
import type { Pt, Rect } from '../core/types';
import type { WorldScene } from '../scenes/WorldScene';
import { downloadText } from '../ui/kit';

type Tool = 'walk' | 'block' | 'exit' | 'feature' | 'anchor' | 'occluder';
const COLORS: Record<Tool, number> = { walk: 0x00ff88, block: 0xff0044, exit: 0xffee00, feature: 0x66aaff, anchor: 0xffffff, occluder: 0xff8800 };

export interface EditorExport {
  id: string;
  walk: Rect[];
  blocks: Rect[];
  exits: { id: string; rect: Rect }[];
  features: Record<string, Rect>;
  anchors: Record<string, Pt>;
  occluders: { rect: Rect; baseY: number }[];
}

export class Editor {
  on = false;
  tool: Tool = 'walk';
  private gfx: Phaser.GameObjects.Graphics;
  private info: Phaser.GameObjects.Text;
  private drag: { x: number; y: number } | null = null;
  private lastLoc = '';

  constructor(private w: WorldScene) {
    this.gfx = w.add.graphics().setDepth(DEPTH.ui + 5).setVisible(false);
    this.info = w.add.text(8, 60, '', { fontFamily: 'monospace', fontSize: '12px', color: '#fff', backgroundColor: '#000a', padding: { x: 6, y: 4 } }).setDepth(DEPTH.ui + 6).setVisible(false);
    const kb = w.input.keyboard!;
    kb.on('keydown-F3', () => this.toggle());
    const keys: [string, Tool][] = [['ONE', 'walk'], ['TWO', 'block'], ['THREE', 'exit'], ['FOUR', 'feature'], ['FIVE', 'anchor'], ['SIX', 'occluder']];
    for (const [k, t] of keys) kb.on(`keydown-${k}`, () => { if (this.on) this.tool = t; });
    kb.on('keydown-BACKSPACE', () => { if (this.on) this.undo(); });
    kb.on('keydown-P', () => { if (this.on) this.exportJson(); });
    kb.on('keydown-O', () => { if (this.on) void this.importPrompt(); });
    w.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (!this.on) return; if (this.tool === 'anchor') this.addAnchor(p.worldX, p.worldY); else this.drag = { x: Math.round(p.worldX), y: Math.round(p.worldY) }; });
    w.input.on('pointerup', (p: Phaser.Input.Pointer) => { if (!this.on || !this.drag) return; this.commit(this.drag, { x: Math.round(p.worldX), y: Math.round(p.worldY) }); this.drag = null; });
  }

  toggle(): void { this.on = !this.on; this.gfx.setVisible(this.on); this.info.setVisible(this.on); }

  private rect(a: Pt, b: Pt): Rect { return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) }; }

  private commit(a: Pt, b: Pt): void {
    const r = this.rect(a, b);
    if (r.w < 6 || r.h < 6) return;
    const L = this.w.loc;
    if (this.tool === 'walk') L.walk.push(r);
    else if (this.tool === 'block') (L.blocks ??= []).push(r);
    else if (this.tool === 'exit') { const n = window.prompt('Destination (id du lieu) ?', ''); if (n) L.exits.push({ id: `${L.id}>${n}`, rect: r, to: n, spawn: `from_${L.id}` }); }
    else if (this.tool === 'feature') { const n = window.prompt('Nom de la zone ?', ''); if (n) L.features[n] = r; }
    else if (this.tool === 'occluder') { const y = window.prompt('baseY (y des pieds sous lequel la zone passe devant) ?', String(r.y + r.h)); if (y) (L.occluders ??= []).push({ rect: r, baseY: Number(y) }); }
  }

  private addAnchor(x: number, y: number): void {
    const n = window.prompt('Nom de l\'ancre ?', '');
    if (n) this.w.loc.anchors[n] = { x: Math.round(x), y: Math.round(y) };
  }

  private undo(): void {
    const L = this.w.loc;
    if (this.tool === 'walk') L.walk.pop(); else if (this.tool === 'block') L.blocks?.pop(); else if (this.tool === 'exit') L.exits.pop(); else if (this.tool === 'occluder') L.occluders?.pop();
    else if (this.tool === 'feature') { const k = Object.keys(L.features).pop(); if (k) delete L.features[k]; }
    else { const k = Object.keys(L.anchors).pop(); if (k) delete L.anchors[k]; }
  }

  export(): EditorExport {
    const L = this.w.loc;
    return { id: L.id, walk: L.walk, blocks: L.blocks ?? [], exits: L.exits.map((e) => ({ id: e.id, rect: e.rect })), features: L.features, anchors: L.anchors, occluders: L.occluders ?? [] };
  }

  private exportJson(): void {
    const json = JSON.stringify(this.export(), null, 2);
    downloadText(`${this.w.loc.id}.zones.json`, json);
    console.log(json);
  }

  /** Réimporte un export (sans perte) dans le lieu courant. */
  importData(d: EditorExport): void {
    const L = this.w.loc;
    L.walk = d.walk; L.blocks = d.blocks; L.features = d.features; L.anchors = d.anchors; L.occluders = d.occluders;
    for (const e of L.exits) { const m = d.exits.find((x) => x.id === e.id); if (m) e.rect = m.rect; }
  }

  private async importPrompt(): Promise<void> {
    const t = window.prompt('Collez le JSON exporté :', '');
    if (!t) return;
    try { this.importData(JSON.parse(t) as EditorExport); } catch { hub.ui.toast('JSON invalide.'); }
  }

  update(): void {
    if (!this.on) return;
    if (this.lastLoc !== this.w.loc.id) { this.lastLoc = this.w.loc.id; }
    const L = this.w.loc, g = this.gfx;
    g.clear();
    const draw = (r: Rect, c: number, a = 0.25) => { g.fillStyle(c, a).fillRect(r.x, r.y, r.w, r.h); g.lineStyle(1, c, 0.9).strokeRect(r.x, r.y, r.w, r.h); };
    for (const r of L.walk) draw(r, COLORS.walk, 0.14);
    for (const r of L.blocks ?? []) draw(r, COLORS.block, 0.3);
    for (const e of L.exits) draw(e.rect, COLORS.exit, 0.35);
    for (const r of Object.values(L.features)) draw(r, COLORS.feature, 0.25);
    for (const o of L.occluders ?? []) { draw(o.rect, COLORS.occluder, 0.25); g.lineStyle(1, COLORS.occluder, 1).lineBetween(o.rect.x, o.baseY, o.rect.x + o.rect.w, o.baseY); }
    for (const [, p] of Object.entries(L.anchors)) { g.fillStyle(0xffffff, 1).fillCircle(p.x, p.y, 4); }
    const p = this.w.input.activePointer;
    if (this.drag) draw(this.rect(this.drag, { x: p.worldX, y: p.worldY }), COLORS[this.tool], 0.2);
    this.info.setText(`ÉDITEUR ${L.id}  outil : ${this.tool}  (1 marche · 2 obstacle · 3 sortie · 4 zone · 5 ancre · 6 devant)  Retour : annuler · P : exporter · O : importer\nsouris : ${Math.round(p.worldX)}, ${Math.round(p.worldY)}   pieds : ${Math.round(this.w.player.x)}, ${Math.round(this.w.player.y)}\nancres : ${Object.keys(L.anchors).join(', ')}`);
  }
}
