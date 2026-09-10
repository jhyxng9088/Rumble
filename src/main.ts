import "./styles.css";
import { Game } from "./game/Game";
import { registerServiceWorker } from "./platform/registerServiceWorker";

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const joystick = document.querySelector<HTMLElement>("#move-stick");
const joystickKnob = document.querySelector<HTMLElement>("#move-stick-knob");

if (!canvas || !joystick || !joystickKnob) {
  throw new Error("RUMBLE bootstrap failed: required DOM nodes are missing.");
}

const game = new Game({ canvas, joystick, joystickKnob });
game.start();
registerServiceWorker();

window.addEventListener("pagehide", () => game.dispose(), { once: true });
