import './styles.css';
import { Game } from './core/Game';
import { GameUI } from './ui/GameUI';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const hudRoot = document.querySelector<HTMLDivElement>('#hud-root');

if (!canvas || !hudRoot) {
  throw new Error('RUMBLE root elements are missing.');
}

const ui = new GameUI(hudRoot);

try {
  const game = new Game(canvas, ui.joystickElement);
  ui.markReady();
  game.start();
} catch (error) {
  console.error('[RUMBLE] Stage 1 bootstrap failed', error);
  ui.showFatal(error);
}
