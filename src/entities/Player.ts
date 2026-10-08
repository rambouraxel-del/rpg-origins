import Phaser from 'phaser';
import { DEPTH, PLAYER_RUN_SPEED, PLAYER_SPEED } from '../config';
import type { InputController } from '../systems/InputController';

/** Chaque animation = une bande PNG de 8 images 92x92 (générée depuis assets-src/hero/*.gif). */
const HERO_FRAME = 92;
const HERO_SHEETS = [
  'idle-down',
  'walk-down',
  'walk-up',
  'walk-right',
  'walk-right-slow', // non utilisée pour l'instant
  'run-right',
  'run-left',
] as const;

type Facing = 'down' | 'up' | 'left' | 'right';

export function preloadHero(scene: Phaser.Scene): void {
  for (const key of HERO_SHEETS) {
    scene.load.spritesheet(`hero-${key}`, `assets/hero/${key}.png`, {
      frameWidth: HERO_FRAME,
      frameHeight: HERO_FRAME,
    });
  }
}

export function createHeroAnimations(scene: Phaser.Scene): void {
  const add = (key: string, sheet: string, frameRate: number) =>
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(`hero-${sheet}`),
      frameRate,
      repeat: -1,
    });
  add('hero-idle-down', 'idle-down', 5);
  add('hero-walk-down', 'walk-down', 10);
  add('hero-walk-up', 'walk-up', 10);
  add('hero-walk-right', 'walk-right', 10); // gauche = même animation retournée
  add('hero-run-down', 'walk-down', 16);
  add('hero-run-up', 'walk-up', 16);
  add('hero-run-right', 'run-right', 14);
  add('hero-run-left', 'run-left', 14);
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private facing: Facing = 'down';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero-idle-down');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.entities);
    this.setCollideWorldBounds(true);
    // Hitbox limitée aux pieds (bas du sprite) : le haut du corps peut passer derrière le décor.
    this.body!.setSize(22, 10).setOffset(35, 68);
    this.play('hero-idle-down');
  }

  updateMovement(input: InputController): void {
    const dir = input.getMovement();
    const running = input.isRunning();
    const speed = running ? PLAYER_RUN_SPEED : PLAYER_SPEED;
    this.setVelocity(dir.x * speed, dir.y * speed);

    if (dir.lengthSq() === 0) {
      this.showIdle();
      return;
    }
    // Le déplacement horizontal prime sur la diagonale (pas d'animation diagonale fournie).
    if (dir.x !== 0) this.facing = dir.x < 0 ? 'left' : 'right';
    else this.facing = dir.y < 0 ? 'up' : 'down';

    const mode = running ? 'run' : 'walk';
    if (this.facing === 'left' && !running) {
      this.setFlipX(true).play('hero-walk-right', true);
    } else {
      this.setFlipX(false).play(`hero-${mode}-${this.facing}`, true);
    }
  }

  private showIdle(): void {
    if (this.facing === 'down') {
      this.setFlipX(false).play('hero-idle-down', true);
      return;
    }
    // Pas d'animation d'attente pour ces directions : on fige la 1re image de marche.
    const anim = this.facing === 'up' ? 'hero-walk-up' : 'hero-walk-right';
    this.setFlipX(this.facing === 'left');
    if (this.anims.currentAnim?.key !== anim || this.anims.isPlaying) {
      this.play(anim).anims.pause(this.anims.currentAnim!.frames[0]);
    }
  }
}
