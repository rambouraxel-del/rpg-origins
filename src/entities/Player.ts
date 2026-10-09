import Phaser from 'phaser';
import { DEPTH, PLAYER_RUN_SPEED, PLAYER_SPEED } from '../config';
import type { InputController } from '../systems/InputController';

/** Chaque animation = une bande PNG de 8 images 92x92 (générée depuis assets-src/hero/*.gif). */
const HERO_FRAME = 92;
const HERO_SHEETS = [
  'idle-dirs', // 4 poses à l'arrêt : bas, droite, haut, gauche
  'walk-down',
  'walk-up',
  'walk-right',
  'walk-right-slow', // non utilisée pour l'instant
  'run-right',
  'run-left',
] as const;

type Facing = 'down' | 'up' | 'left' | 'right';

const IDLE_FRAME: Record<Facing, number> = { down: 0, right: 1, up: 2, left: 3 };

/** Distance entre le centre du sprite et le centre de ses pieds (hitbox). */
export const FEET_OFFSET_Y = 27;

export function preloadHero(scene: Phaser.Scene): void {
  for (const key of HERO_SHEETS) {
    scene.load.spritesheet(`hero-${key}`, `assets/hero/${key}.png`, {
      frameWidth: HERO_FRAME,
      frameHeight: HERO_FRAME,
    });
  }
}

/**
 * Le héros est encore en pixel art (provisoire) alors que le reste du jeu est lissé : filtrage NEAREST sur ses seules textures.
 * À retirer quand le héros passera au style n°9.
 */
export function applyHeroTextureFilter(scene: Phaser.Scene): void {
  for (const key of HERO_SHEETS) scene.textures.get(`hero-${key}`).setFilter(Phaser.Textures.FilterMode.NEAREST);
}

export function createHeroAnimations(scene: Phaser.Scene): void {
  const add = (key: string, sheet: string, frameRate: number) =>
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(`hero-${sheet}`),
      frameRate,
      repeat: -1,
    });
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
    super(scene, x, y, 'hero-idle-dirs', IDLE_FRAME.down);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.entities);
    this.setCollideWorldBounds(true);
    // Hitbox limitée aux pieds (bas du sprite) : le haut du corps peut passer derrière le décor.
    this.body!.setSize(22, 10).setOffset(35, 68);
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
    this.anims.stop();
    this.setFlipX(false).setTexture('hero-idle-dirs', IDLE_FRAME[this.facing]);
  }
}
