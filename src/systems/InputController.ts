import Phaser from 'phaser';

const { KeyCodes } = Phaser.Input.Keyboard;

// Plusieurs touches par direction : ZQSD (AZERTY), WASD (QWERTY) et flèches. Maj = courir.
const BINDINGS = {
  up: [KeyCodes.Z, KeyCodes.W, KeyCodes.UP],
  down: [KeyCodes.S, KeyCodes.DOWN],
  left: [KeyCodes.Q, KeyCodes.A, KeyCodes.LEFT],
  right: [KeyCodes.D, KeyCodes.RIGHT],
};

type Direction = keyof typeof BINDINGS;

export class InputController {
  private keys: Record<Direction, Phaser.Input.Keyboard.Key[]>;
  private runKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard!;
    const make = (codes: number[]) => codes.map((c) => keyboard.addKey(c));
    this.keys = {
      up: make(BINDINGS.up),
      down: make(BINDINGS.down),
      left: make(BINDINGS.left),
      right: make(BINDINGS.right),
    };
    this.runKey = keyboard.addKey(KeyCodes.SHIFT);
  }

  isRunning(): boolean {
    return this.runKey.isDown;
  }

  private isDown(dir: Direction): boolean {
    return this.keys[dir].some((k) => k.isDown);
  }

  /** Direction normalisée (diagonales à la même vitesse). */
  getMovement(): Phaser.Math.Vector2 {
    const v = new Phaser.Math.Vector2(
      Number(this.isDown('right')) - Number(this.isDown('left')),
      Number(this.isDown('down')) - Number(this.isDown('up')),
    );
    return v.normalize();
  }
}
