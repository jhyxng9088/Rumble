import './styles.css';
import { Game } from './core/Game';
import { GameUI } from './ui/GameUI';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const hudRoot = document.querySelector<HTMLElement>('#hud-root');
if (!canvas || !hudRoot) throw new Error('RUMBLE root elements are missing');

const ui = new GameUI(hudRoot);
try {
  const game = new Game(canvas, ui);
  game.start();
  ui.markReady();
} catch (error) {
  console.error(error);
  ui.showFatal(error);
}
