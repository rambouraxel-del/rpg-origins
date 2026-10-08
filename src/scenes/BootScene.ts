import Phaser from 'phaser';
import { PLAYER_TEXTURE } from '../entities/Player';
import { START_AREA } from '../world/areas';

/** Génère les graphismes provisoires puis lance le monde. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const g = this.add.graphics();
    g.fillStyle(0x2b2b6b).fillRect(0, 0, 12, 16); // contour
    g.fillStyle(0xf0c890).fillRect(2, 1, 8, 6); // tête
    g.fillStyle(0xc0392b).fillRect(2, 7, 8, 6); // tunique
    g.fillStyle(0x222222).fillRect(6, 3, 2, 2); // oeil
    g.generateTexture(PLAYER_TEXTURE, 12, 16);
    g.destroy();

    this.scene.start('World', { areaId: START_AREA, spawn: 'default' });
  }
}
