import './styles.css';
import { Game } from './core/Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const uiHost = document.querySelector<HTMLElement>('#hud-root');

if (!canvas || !uiHost) throw new Error('RUMBLE root elements are missing');

try {
  const game = new Game(canvas, uiHost);
  game.start();
  window.addEventListener('pagehide', () => game.destroy(), { once: true });
} catch (error) {
  console.error(error);
  uiHost.innerHTML = `<div class="boot-error">RUMBLE failed to start.<br><small>${error instanceof Error ? error.message : 'Unknown error'}</small></div>`;
}
