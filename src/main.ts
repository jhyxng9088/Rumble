import './styles.css';
import { Game } from './core/Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const hudRoot = document.querySelector<HTMLDivElement>('#hud-root');

if (!canvas || !hudRoot) {
  throw new Error('RUMBLE root elements are missing.');
}

const game = new Game(canvas, hudRoot);
game.start();
