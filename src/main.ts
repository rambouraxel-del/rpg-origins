import Phaser from 'phaser';
import { GAME_H, GAME_W } from './config';
import { hub } from './game';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldScene } from './scenes/WorldScene';
import { UIScene } from './scenes/UIScene';
import { registerContent } from './data';
import { initSaves, loadFrom, freshGame } from './systems/Saves';
import * as saveApi from './core/save';
import { applyEffects } from './core/state';
import { buildEpilogue } from './data/epilogues';
import { audio } from './systems/Audio';

const params = new URLSearchParams(location.search);
hub.devMode = params.has('dev');
registerContent();
initSaves();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#05080c',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, WorldScene, UIScene],
  render: { antialias: true, roundPixels: false },
  input: { mouse: { preventDefaultWheel: false } },
});

/** Lance (ou relance) une partie dans les scènes World + UI. */
async function enterGame(kind: 'new' | 'load'): Promise<void> {
  const sm = game.scene;
  sm.stop('Title');
  game.canvas.focus();
  if (!sm.isActive('World')) { sm.start('World'); sm.start('UI'); }
  await new Promise<void>((resolve) => { const check = () => { if (hub.world && hub.ui) resolve(); else setTimeout(check, 30); }; check(); });
  const w = hub.world!;
  w.director.abort();
  hub.ui.setHud(true);
  if (kind === 'new') { await w.director.startNewGame(); } else { await w.director.resume(); }
}

const CANON_ORDER = ['P01', 'P02', 'P03', 'P04', 'P05', ...Array.from({ length: 10 }, (_, c) => [1, 2, 3, 4, 5].map((n) => `C${String(c + 1).padStart(2, '0')}S${String(n).padStart(2, '0')}`)).flat(), 'A01', 'A02', 'A03', 'B01', 'B02', 'B03'];
const jump = params.get('jump');
if (hub.devMode && jump) {
  hub.events.once('title-ready', async () => {
    freshGame();
    const sm = game.scene;
    sm.stop('Title');
    sm.start('World'); sm.start('UI');
    await new Promise<void>((r) => { const c = () => (hub.world && hub.ui ? r() : setTimeout(c, 30)); c(); });
    await hub.world!.director.jumpTo(jump, CANON_ORDER);
    hub.ui.setHud(true);
    await hub.world!.director.resume();
  });
}

hub.events.on('world-ready', (w: WorldScene) => { hub.world = w; });
hub.events.on('title-choice', (mode: string) => {
  if (mode === 'new') { freshGame(); void enterGame('new'); }
  else if (mode === 'continue') { if (loadFrom('auto')) void enterGame('load'); }
  else {
    // menus accessibles depuis le titre : on démarre World/UI en arrière-plan sans lancer de partie
    freshGame();
    const sm = game.scene;
    sm.stop('Title');
    if (!sm.isActive('World')) { sm.start('World'); sm.start('UI'); }
    const wait = () => { if (hub.world && hub.ui) { hub.ui.setHud(false); hub.ui.menus.toggle(mode === 'menu-saves' ? 'saves' : 'options'); } else setTimeout(wait, 30); };
    wait();
  }
});
hub.events.on('load-game', () => { void enterGame('load'); });
hub.events.on('load-threshold', () => { if (loadFrom('threshold')) void enterGame('load'); else game.scene.start('Title'); });
hub.events.on('new-game', () => { freshGame(); void enterGame('new'); });
hub.events.on('reload-last', () => { if (loadFrom('auto')) void enterGame('load'); });
hub.events.on('return-title', () => {
  hub.world?.director.abort();
  hub.uiLock = 0;
  game.scene.stop('World'); game.scene.stop('UI');
  hub.world = undefined;
  game.scene.start('Title');
});

(window as unknown as { __save: typeof saveApi; __fx: typeof applyEffects }).__save = saveApi;
(window as unknown as { __fx: typeof applyEffects }).__fx = applyEffects;
(window as unknown as { __audio: typeof audio }).__audio = audio;
(window as unknown as { __epilogue: () => string[] }).__epilogue = () => buildEpilogue(hub.state, hub.state.flags.final_route as 'A' | 'B');
(window as unknown as { __hub: typeof hub; __game: Phaser.Game }).__hub = hub;
(window as unknown as { __game: Phaser.Game }).__game = game;
