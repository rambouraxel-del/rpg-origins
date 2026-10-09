import Phaser from 'phaser';
import { applyHeroTextureFilter, createHeroAnimations, preloadHero } from '../entities/Player';
import { AREAS, START_AREA } from '../world/areas';

/** Charge les ressources graphiques puis lance le monde. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    preloadHero(this);
    for (const area of Object.values(AREAS)) {
      if (area.background) this.load.image(`bg-${area.background}`, `assets/areas/${area.background}.png`);
    }
  }

  create(): void {
    applyHeroTextureFilter(this);
    createHeroAnimations(this);
    this.scene.start('World', { areaId: START_AREA, spawn: 'default' });
  }
}
