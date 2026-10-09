import Phaser from 'phaser';
import { CHARS } from '../data/characters';
import { makePlaceholders } from '../systems/Actor';
import { GAME_H, GAME_W } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload(): void {
    const t = this.add.text(GAME_W / 2, GAME_H / 2, 'Chargement…', { fontFamily: 'Georgia, serif', fontSize: '24px', color: '#f4ecd8' }).setOrigin(0.5);
    void t;
    for (const c of Object.values(CHARS)) if (c.sheet) this.load.spritesheet(c.sheet.key, c.sheet.url, { frameWidth: c.sheet.frameW, frameHeight: c.sheet.frameH });
    for (const c of Object.values(CHARS)) if (c.img) this.load.image(`c:${c.id}`, c.img);
    this.load.image('title-bg', 'assets/areas/forest-style9.png');
  }
  create(): void {
    makePlaceholders(this);
    this.scene.start('Title');
  }
}
