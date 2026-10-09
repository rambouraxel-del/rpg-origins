import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';
import { hub } from '../game';
import { COL, button, text } from '../ui/kit';
import { slotInfo } from '../core/save';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create(): void {
    this.scene.stop('World'); this.scene.stop('UI');
    this.add.image(0, 0, 'title-bg').setOrigin(0, 0).setDisplaySize(GAME_W, GAME_H);
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x05100a, 0.55).setOrigin(0, 0);
    text(this, 480, 90, 'RPG ORIGINS', 56, COL.gold).setOrigin(0.5).setStroke('#000', 6);
    text(this, 480, 148, 'La mémoire du monde', 24, COL.text).setOrigin(0.5).setStroke('#000', 4);
    const auto = slotInfo('auto');
    const anySave = !auto.empty || ['slot1', 'slot2', 'slot3', 'threshold'].some((s) => !slotInfo(s as 'slot1').empty);
    let y = 215;
    const mk = (label: string, cb: () => void, enabled = true) => { const b = button(this, 330, y, 300, 44, label, cb, 19); b.setEnabled(enabled); y += 54; return b; };
    mk('Nouvelle partie', () => this.start('new'));
    mk('Continuer', () => this.start('continue'), !auto.empty);
    mk('Charger / Importer', () => this.start('menu-saves'), anySave || true);
    mk('Options', () => this.start('menu-options'));
    text(this, 480, 505, 'ZQSD / flèches : se déplacer — E : agir — Échap : menu — F2 (mode développement ?dev=1) : zones', 14, COL.dim).setOrigin(0.5);
    text(this, 940, 520, 'v0.1', 12, COL.dim).setOrigin(1, 1);
  }
  private start(mode: 'new' | 'continue' | 'menu-saves' | 'menu-options'): void {
    hub.events.emit('title-choice', mode);
  }
}
