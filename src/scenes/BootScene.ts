import Phaser from 'phaser';
import { createHeroAnimations, preloadHero } from '../entities/Player';
import { START_AREA } from '../world/areas';

/** Charge les ressources graphiques puis lance le monde. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    preloadHero(this);
  }

  create(): void {
    createHeroAnimations(this);
    this.scene.start('World', { areaId: START_AREA, spawn: 'default' });
  }
}
