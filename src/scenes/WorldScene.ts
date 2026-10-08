import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { FEET_OFFSET_Y, Player } from '../entities/Player';
import { InputController } from '../systems/InputController';
import { AREAS } from '../world/areas';
import type { AreaConfig, AreaId, Exit, Rect } from '../world/types';

interface WorldData {
  areaId: AreaId;
  spawn: string;
}

const EXIT_THICKNESS = 6;
const CELL = 8; // finesse de la grille de collision générée depuis les zones praticables

/**
 * Scène générique : affiche n'importe quelle zone à partir de sa configuration.
 * Caméra fixe : une zone = un écran.
 */
export class WorldScene extends Phaser.Scene {
  private area!: AreaConfig;
  private spawnName = 'default';
  private player!: Player;
  private controls!: InputController;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private transitioning = false;

  constructor() {
    super('World');
  }

  init(data: WorldData): void {
    this.area = AREAS[data.areaId];
    this.transitioning = false;
    this.spawnName = data.spawn;
  }

  create(): void {
    const area = this.area;
    this.cameras.main.setBackgroundColor(area.backgroundColor);
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.solids = this.physics.add.staticGroup();
    this.buildBackground();
    this.buildDecor();
    this.buildWalkableLimits();
    for (const c of area.colliders ?? []) this.addSolid(c);

    const spawn = area.spawns[this.spawnName] ?? area.spawns.default;
    this.controls = new InputController(this);
    this.player = new Player(this, spawn.x, spawn.y - FEET_OFFSET_Y);
    this.physics.add.collider(this.player, this.solids);

    this.buildExits();
    // Points d'extension prévus : objets interactifs (area.interactables) et effets (area.effects).

    this.add
      .text(8, 8, area.name, { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' })
      .setDepth(DEPTH.ui)
      .setResolution(2);

    if (new URLSearchParams(location.search).has('debug')) this.drawDebug();
    this.cameras.main.fadeIn(200, 0, 0, 0);
  }

  update(): void {
    if (this.transitioning) return;
    this.player.updateMovement(this.controls);
  }

  private buildBackground(): void {
    if (!this.area.background) return;
    this.add.image(0, 0, `bg-${this.area.background}`).setOrigin(0).setDepth(DEPTH.ground);
  }

  /** Tout ce qui n'est pas dans une zone praticable devient un obstacle (cellules fusionnées par lignes). */
  private buildWalkableLimits(): void {
    const walkable = this.area.walkable;
    if (!walkable) return;
    const inside = (x: number, y: number) =>
      walkable.some((r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height);
    for (let cy = 0; cy < GAME_HEIGHT; cy += CELL) {
      let runStart = -1;
      for (let cx = 0; cx <= GAME_WIDTH; cx += CELL) {
        const blocked = cx < GAME_WIDTH && !inside(cx + CELL / 2, cy + CELL / 2);
        if (blocked && runStart < 0) runStart = cx;
        if (!blocked && runStart >= 0) {
          this.addSolid({ x: runStart, y: cy, width: cx - runStart, height: CELL });
          runStart = -1;
        }
      }
    }
  }

  private drawDebug(): void {
    this.physics.world.createDebugGraphic();
    this.physics.world.drawDebug = true;
    this.physics.world.debugGraphic.setDepth(DEPTH.ui);
  }

  private buildDecor(): void {
    for (const d of this.area.decor ?? []) {
      this.add
        .rectangle(d.x, d.y, d.width, d.height, d.color)
        .setOrigin(0)
        .setDepth(DEPTH[d.layer]);
      if (d.solid) this.addSolid(d);
    }
  }

  private addSolid(r: Rect): void {
    const zone = this.add.zone(r.x, r.y, r.width, r.height).setOrigin(0);
    this.solids.add(zone);
  }

  private buildExits(): void {
    for (const exit of this.area.exits) {
      const r = exitRect(exit);
      const zone = this.add.zone(r.x, r.y, r.width, r.height).setOrigin(0);
      this.physics.add.existing(zone, true);
      this.physics.add.overlap(this.player, zone, () => this.goTo(exit));
    }
  }

  private goTo(exit: Exit): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.player.setVelocity(0, 0);
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({ areaId: exit.target, spawn: exit.targetSpawn } satisfies WorldData);
    });
  }
}

/** Bande fine collée au bord de l'écran, sur la portion autorisée. */
function exitRect(exit: Exit): Rect {
  const len = exit.to - exit.from;
  switch (exit.edge) {
    case 'left':
      return { x: 0, y: exit.from, width: EXIT_THICKNESS, height: len };
    case 'right':
      return { x: GAME_WIDTH - EXIT_THICKNESS, y: exit.from, width: EXIT_THICKNESS, height: len };
    case 'top':
      return { x: exit.from, y: 0, width: len, height: EXIT_THICKNESS };
    case 'bottom':
      return { x: exit.from, y: GAME_HEIGHT - EXIT_THICKNESS, width: len, height: EXIT_THICKNESS };
  }
}
