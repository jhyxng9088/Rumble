import { Vector2 } from '@babylonjs/core/Maths/math.vector';

export interface ActionFrame {
  pickup: boolean;
  throwItem: boolean;
  dodge: boolean;
}

export class InputController {
  private readonly movementVector = Vector2.Zero();
  private activePointerId: number | null = null;
  private centerX = 0;
  private centerY = 0;
  private maxRadius = 1;
  private readonly pressedKeys = new Set<string>();
  private pickupQueued = false;
  private throwQueued = false;
  private dodgeQueued = false;

  constructor(
    private readonly joystick: HTMLElement,
    pickupButton: HTMLButtonElement,
    throwButton: HTMLButtonElement,
    dodgeButton: HTMLButtonElement,
  ) {
    joystick.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    window.addEventListener('pointermove', this.handlePointerMove, { passive: false });
    window.addEventListener('pointerup', this.handlePointerEnd, { passive: false });
    window.addEventListener('pointercancel', this.handlePointerEnd, { passive: false });
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.bindAction(pickupButton, () => { this.pickupQueued = true; });
    this.bindAction(throwButton, () => { this.throwQueued = true; });
    this.bindAction(dodgeButton, () => { this.dodgeQueued = true; });
  }

  get movement(): Vector2 {
    if (this.activePointerId !== null) return this.movementVector;
    const x = Number(this.pressedKeys.has('KeyD') || this.pressedKeys.has('ArrowRight')) - Number(this.pressedKeys.has('KeyA') || this.pressedKeys.has('ArrowLeft'));
    const y = Number(this.pressedKeys.has('KeyW') || this.pressedKeys.has('ArrowUp')) - Number(this.pressedKeys.has('KeyS') || this.pressedKeys.has('ArrowDown'));
    this.movementVector.set(x, y);
    if (this.movementVector.lengthSquared() > 1) this.movementVector.normalize();
    return this.movementVector;
  }

  readActions(): ActionFrame {
    const frame = { pickup: this.pickupQueued, throwItem: this.throwQueued, dodge: this.dodgeQueued };
    this.pickupQueued = false;
    this.throwQueued = false;
    this.dodgeQueued = false;
    return frame;
  }

  reset(): void {
    this.releasePointerCapture();
    this.activePointerId = null;
    this.pressedKeys.clear();
    this.movementVector.set(0, 0);
    this.updateKnob(0, 0);
  }

  private bindAction(button: HTMLButtonElement, queue: () => void): void {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      queue();
      button.dataset.pressed = 'true';
    }, { passive: false });
    const release = () => { button.dataset.pressed = 'false'; };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.activePointerId !== null) return;
    event.preventDefault();
    this.activePointerId = event.pointerId;
    const rect = this.joystick.getBoundingClientRect();
    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;
    this.maxRadius = Math.max(rect.width * 0.31, 1);
    this.updateFromPointer(event.clientX, event.clientY);
    try { this.joystick.setPointerCapture(event.pointerId); } catch { /* window tracking owns fallback */ }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) return;
    event.preventDefault();
    this.updateFromPointer(event.clientX, event.clientY);
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) return;
    event.preventDefault();
    this.releasePointerCapture();
    this.activePointerId = null;
    this.movementVector.set(0, 0);
    this.updateKnob(0, 0);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.isMovementKey(event.code)) {
      this.pressedKeys.add(event.code);
      event.preventDefault();
    }
    if (event.repeat) return;
    if (event.code === 'KeyJ' || event.code === 'KeyE') this.pickupQueued = true;
    if (event.code === 'KeyK' || event.code === 'KeyF') this.throwQueued = true;
    if (event.code === 'Space' || event.code === 'KeyL') {
      event.preventDefault();
      this.dodgeQueued = true;
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (this.isMovementKey(event.code)) {
      this.pressedKeys.delete(event.code);
      event.preventDefault();
    }
  };

  private updateFromPointer(clientX: number, clientY: number): void {
    let dx = clientX - this.centerX;
    let dy = clientY - this.centerY;
    const distance = Math.hypot(dx, dy);
    if (distance > this.maxRadius && distance > 0) {
      const scale = this.maxRadius / distance;
      dx *= scale;
      dy *= scale;
    }
    const normalizedX = dx / this.maxRadius;
    const normalizedY = -dy / this.maxRadius;
    const deadZone = 0.08;
    const magnitude = Math.hypot(normalizedX, normalizedY);
    if (magnitude <= deadZone) this.movementVector.set(0, 0);
    else {
      const remapped = Math.min((magnitude - deadZone) / (1 - deadZone), 1);
      this.movementVector.set(normalizedX / magnitude * remapped, normalizedY / magnitude * remapped);
    }
    this.updateKnob(dx, dy);
  }

  private updateKnob(x: number, y: number): void {
    this.joystick.style.setProperty('--stick-x', `${x}px`);
    this.joystick.style.setProperty('--stick-y', `${y}px`);
  }

  private releasePointerCapture(): void {
    if (this.activePointerId === null) return;
    try {
      if (this.joystick.hasPointerCapture(this.activePointerId)) this.joystick.releasePointerCapture(this.activePointerId);
    } catch { /* optional */ }
  }

  private isMovementKey(code: string): boolean {
    return ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'].includes(code);
  }
}
