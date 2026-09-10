export interface MoveInput {
  x: number;
  y: number;
}

const MOVEMENT_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
]);

export class InputController {
  private readonly pressedKeys = new Set<string>();
  private touchMove: MoveInput = { x: 0, y: 0 };
  private touchActive = false;

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!MOVEMENT_KEYS.has(event.code)) {
      return;
    }
    event.preventDefault();
    this.pressedKeys.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (!MOVEMENT_KEYS.has(event.code)) {
      return;
    }
    event.preventDefault();
    this.pressedKeys.delete(event.code);
  };

  constructor() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  setTouchMove(move: MoveInput, active: boolean): void {
    this.touchMove = normalizeMove(move);
    this.touchActive = active;
  }

  getMove(): MoveInput {
    if (this.touchActive) {
      return this.touchMove;
    }

    const x = Number(this.pressedKeys.has("ArrowRight") || this.pressedKeys.has("KeyD"))
      - Number(this.pressedKeys.has("ArrowLeft") || this.pressedKeys.has("KeyA"));
    const y = Number(this.pressedKeys.has("ArrowUp") || this.pressedKeys.has("KeyW"))
      - Number(this.pressedKeys.has("ArrowDown") || this.pressedKeys.has("KeyS"));

    return normalizeMove({ x, y });
  }

  dispose(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.pressedKeys.clear();
  }
}

function normalizeMove(move: MoveInput): MoveInput {
  const length = Math.hypot(move.x, move.y);
  if (length <= 1 || length === 0) {
    return move;
  }
  return { x: move.x / length, y: move.y / length };
}
