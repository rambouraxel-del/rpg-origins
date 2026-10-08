import Phaser from 'phaser';
import { DEPTH, PLAYER_SPEED } from '../config';
import type { InputController } from '../systems/InputController';

export const PLAYER_TEXTURE = 'player-placeholder';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PLAYER_TEXTURE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.entities);
    this.setCollideWorldBounds(true);
    // Hitbox réduite aux pieds pour passer "derrière" les éléments de premier plan.
    this.body!.setSize(10, 8).setOffset(1, 8);
  }

  updateMovement(input: InputController): void {
    const dir = input.getMovement();
    this.setVelocity(dir.x * PLAYER_SPEED, dir.y * PLAYER_SPEED);
    if (dir.x !== 0) this.setFlipX(dir.x < 0);
  }
}
