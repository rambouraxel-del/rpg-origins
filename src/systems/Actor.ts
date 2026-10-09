// Entité affichée : sprite + ombre. La position (x,y) est celle des PIEDS ; la profondeur suit y.
import Phaser from 'phaser';
import { CHARS, type CharDef } from '../data/characters';
import { DEPTH, HERO_SCALE } from '../config';
import type { Facing } from '../core/types';

/** Case de la bande de 8 vues selon le secteur d'angle (0 = droite, pas de 45° dans le sens horaire). */
const DIR8_FRAME = [2, 1, 0, 7, 6, 5, 4, 3];

export function placeholderKey(id: string): string { return `ph:${id}`; }

/** Silhouette provisoire (chibi simplifiée) pour les personnages sans planche. */
export function makePlaceholders(scene: Phaser.Scene): void {
  for (const c of Object.values(CHARS)) {
    const key = placeholderKey(c.id);
    if (c.sheet || scene.textures.exists(key)) continue;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const W = 56, H = 76;
    const body = c.color, hair = c.hair;
    if (c.role === 'machine') {
      g.fillStyle(0x222233, 1).fillRoundedRect(14, 30, 28, 34, 6);
      g.fillStyle(body, 1).fillRoundedRect(16, 32, 24, 30, 5);
      g.fillStyle(0x222233, 1).fillCircle(28, 22, 13).fillStyle(body, 1).fillCircle(28, 22, 11);
      g.fillStyle(0xffe08a, 1).fillCircle(24, 22, 3).fillCircle(32, 22, 3);
      g.fillStyle(0x222233, 1).fillRect(16, 62, 8, 10).fillRect(32, 62, 8, 10);
    } else if (c.role === 'animal') {
      g.fillStyle(0x3a2a1a, 1).fillEllipse(28, 56, 34, 24).fillStyle(body, 1).fillEllipse(28, 56, 30, 20);
      g.fillStyle(body, 1).fillCircle(40, 46, 8);
    } else if (c.role === 'présence') {
      g.fillStyle(body, 0.25).fillCircle(28, 40, 26).fillStyle(body, 0.5).fillCircle(28, 40, 16).fillStyle(0xffffff, 0.9).fillCircle(28, 40, 7);
    } else {
      g.fillStyle(0x2b1d14, 1).fillEllipse(28, 70, 26, 8);
      g.fillStyle(0x3a2a1a, 1).fillRoundedRect(17, 62, 9, 10, 3).fillRoundedRect(30, 62, 9, 10, 3);
      g.fillStyle(0x1f1f24, 1).fillRoundedRect(14, 36, 28, 30, 8);
      g.fillStyle(body, 1).fillRoundedRect(16, 38, 24, 26, 7);
      g.fillStyle(0xf3d3b0, 1).fillCircle(28, 26, 15);
      g.fillStyle(hair, 1).fillEllipse(28, 15, 32, 16).fillRect(13, 16, 6, 14).fillRect(37, 16, 6, 14);
      g.fillStyle(0x2a2a40, 1).fillCircle(22, 28, 2.5).fillCircle(34, 28, 2.5);
    }
    g.generateTexture(key, W, H);
    g.destroy();
  }
}

export class Actor {
  readonly id: string;
  readonly def: CharDef;
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  label?: Phaser.GameObjects.Text;
  x = 0;
  y = 0;
  facing: Facing = 'down';
  private scale: number;
  private bobT = 0;
  moving = false;
  visible = true;
  /** Libellé d'interaction personnalisé (groupes à guider, etc.). */
  title?: string;
  verb?: string;
  /** Hauteur affichée (px) : sert à placer les étiquettes. */
  height: number;

  constructor(private scene: Phaser.Scene, id: string, x: number, y: number) {
    this.id = id;
    this.def = CHARS[id] ?? CHARS.civil;
    const sheet = this.def.sheet;
    const hasImg = !!this.def.img && scene.textures.exists(`c:${id}`);
    const texKey = sheet ? sheet.key : hasImg ? `c:${id}` : placeholderKey(this.def.id);
    // Images de face : normalisées à ~66 px d'adulte (la planche source est normalisée à 168 px).
    this.scale = (this.def.scale ?? 1) * (id === 'elyan' ? HERO_SCALE : hasImg ? 66 / 168 : sheet ? 1 : 0.95);
    this.sprite = scene.add.image(x, y, texKey, sheet ? 0 : undefined).setOrigin(0.5, hasImg ? 0.985 : 0.96).setScale(this.scale);
    this.height = this.sprite.height * this.scale;
    this.shadow = scene.add.ellipse(x, y, 34 * this.scale, 11 * this.scale, 0x000000, 0.28);
    this.setPos(x, y);
  }

  setPos(x: number, y: number): void {
    this.x = x; this.y = y;
    this.sprite.setPosition(x, y + this.bobOffset());
    this.shadow.setPosition(x, y - 1);
    this.sprite.setDepth(DEPTH.entityBase + y);
    this.shadow.setDepth(DEPTH.entityBase + y - 0.5);
    this.label?.setPosition(x, y - this.height - 6).setDepth(DEPTH.fx);
  }

  private bobOffset(): number { return this.moving ? -Math.abs(Math.sin(this.bobT * 11)) * 3.2 : Math.sin(this.bobT * 2.2) * 0.4; }

  setFacingVec(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;
    const ang = Math.atan2(dy, dx);
    const sector = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8;
    const sheet = this.def.sheet;
    if (Math.abs(dx) >= Math.abs(dy)) this.facing = dx > 0 ? 'right' : 'left';
    else this.facing = dy > 0 ? 'down' : 'up';
    if (!sheet) { this.sprite.setFlipX(this.facing === 'left'); return; }
    if (sheet.views === 8) { this.sprite.setFrame(DIR8_FRAME[sector]); this.sprite.setFlipX(false); }
    else if (sheet.views === 3) {
      const f = this.facing === 'down' ? 0 : this.facing === 'up' ? 2 : 1;
      this.sprite.setFrame(f); this.sprite.setFlipX(this.facing === 'left');
    }
  }

  face(f: Facing): void {
    this.setFacingVec(f === 'right' ? 1 : f === 'left' ? -1 : 0, f === 'down' ? 1 : f === 'up' ? -1 : 0);
  }

  tick(dt: number, moving: boolean): void {
    this.moving = moving;
    this.bobT += dt;
    this.sprite.y = this.y + this.bobOffset();
    this.sprite.setScale(this.scale * (moving ? 1 + Math.sin(this.bobT * 22) * 0.012 : 1));
  }

  showLabel(text: string | null): void {
    if (!text) { this.label?.destroy(); this.label = undefined; return; }
    if (!this.label) this.label = this.scene.add.text(this.x, this.y - this.height - 6, text, { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(DEPTH.fx);
    else this.label.setText(text);
  }

  setVisible(v: boolean): void { this.visible = v; this.sprite.setVisible(v); this.shadow.setVisible(v); this.label?.setVisible(v); }
  setAlpha(a: number): void { this.sprite.setAlpha(a); this.shadow.setAlpha(a * 0.28); }
  destroy(): void { this.sprite.destroy(); this.shadow.destroy(); this.label?.destroy(); }
}
