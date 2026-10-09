import Phaser from 'phaser';
import { DEPTH, PLAYER_RUN_SPEED, PLAYER_SPEED } from '../config';
import type { InputController } from '../systems/InputController';
import { ART_SET } from '../artSet';

const STYLE9 = ART_SET === 'style9';

/**
 * Prototype style n°9 : 8 poses statiques extraites de la planche de référence (tools/extract-style9-hero.py).
 * Bande de 8 cases 59x77, dans l'ordre : bas, bas-droite, droite, haut-droite, haut, haut-gauche, gauche, bas-gauche.
 */
const HERO9 = { key: 'hero9-dirs', url: 'assets/hero-style9/hero9-dirs.png', frameWidth: 59, frameHeight: 77 };
/** Secteur d'angle (0 = droite, puis sens horaire par pas de 45°) -> case de la bande. */
const DIR8_FRAME = [2, 1, 0, 7, 6, 5, 4, 3];
/** Cases diagonales de la bande. */
const DIAGONAL_FRAMES = new Set([1, 3, 5, 7]);
/** Délai avant de quitter une pose diagonale : on relâche rarement deux touches au même instant. */
const DIAGONAL_HOLD_MS = 120;

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
export const FEET_OFFSET_Y = STYLE9 ? 33 : 27;

export function preloadHero(scene: Phaser.Scene): void {
  if (STYLE9) {
    scene.load.spritesheet(HERO9.key, HERO9.url, { frameWidth: HERO9.frameWidth, frameHeight: HERO9.frameHeight });
    return;
  }
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
  if (STYLE9) return; // héros style n°9 : filtrage lissé par défaut
  for (const key of HERO_SHEETS) scene.textures.get(`hero-${key}`).setFilter(Phaser.Textures.FilterMode.NEAREST);
}

export function createHeroAnimations(scene: Phaser.Scene): void {
  if (STYLE9) return; // prototype : poses statiques, pas d'animation
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
  private pendingFrame = -1;
  private pendingSince = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, STYLE9 ? HERO9.key : 'hero-idle-dirs', STYLE9 ? 0 : IDLE_FRAME.down);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.entities);
    this.setCollideWorldBounds(true);
    // Hitbox limitée aux pieds (bas du sprite) : le haut du corps peut passer derrière le décor.
    if (STYLE9) this.body!.setSize(20, 8).setOffset(20, 67);
    else this.body!.setSize(22, 10).setOffset(35, 68);
  }

  updateMovement(input: InputController): void {
    const dir = input.getMovement();
    const running = input.isRunning();
    const speed = running ? PLAYER_RUN_SPEED : PLAYER_SPEED;
    this.setVelocity(dir.x * speed, dir.y * speed);

    if (STYLE9) {
      // Pose de la direction la plus proche parmi 8 ; à l'arrêt, la dernière pose reste affichée.
      if (dir.lengthSq() === 0) {
        this.pendingFrame = -1;
        return;
      }
      const sector = (Math.round(Math.atan2(dir.y, dir.x) / (Math.PI / 4)) + 8) % 8;
      this.showPose(DIR8_FRAME[sector]);
      return;
    }

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

  /** Change de pose ; d'une diagonale vers une autre direction, seulement si celle-ci dure plus de DIAGONAL_HOLD_MS. */
  private showPose(frame: number): void {
    const current = Number(this.frame.name);
    if (frame === current) {
      this.pendingFrame = -1;
      return;
    }
    if (DIAGONAL_FRAMES.has(current) && !DIAGONAL_FRAMES.has(frame)) {
      const now = this.scene.time.now;
      if (this.pendingFrame !== frame) {
        this.pendingFrame = frame;
        this.pendingSince = now;
        return;
      }
      if (now - this.pendingSince < DIAGONAL_HOLD_MS) return;
    }
    this.pendingFrame = -1;
    this.setFrame(frame);
  }

  private showIdle(): void {
    this.anims.stop();
    this.setFlipX(false).setTexture('hero-idle-dirs', IDLE_FRAME[this.facing]);
  }
}
