import { Vector2 } from '@babylonjs/core';

export class InputController {
  private readonly movementVector = Vector2.Zero();
  private activePointerId: number | null = null;
  private centerX = 0;
  private centerY = 0;
  private maxRadius = 1;
  private readonly pressedKeys = new Set<string>();

  constructor(private readonly joystick: HTMLElement) {
    joystick.addEventListener('pointerdown', this.handlePointerDown);
    joystick.addEventListener('pointermove', this.handlePointerMove);
    joystick.addEventListener('pointerup', this.handlePointerEnd);
    joystick.addEventListener('pointercancel', this.handlePointerEnd);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  get movement(): Vector2 {
    if (this.activePointerId !== null) {
      return this.movementVector;
    }

    const x = Number(this.pressedKeys.has('KeyD') || this.pressedKeys.has('ArrowRight'))
      - Number(this.pressedKeys.has('KeyA') || this.pressedKeys.has('ArrowLeft'));
    const y = Number(this.pressedKeys.has('KeyW') || this.pressedKeys.has('ArrowUp'))
      - Number(this.pressedKeys.has('KeyS') || this.pressedKeys.has('ArrowDown'));

    this.movementVector.set(x, y);
    if (this.movementVector.lengthSquared() > 1) {
      this.movementVector.normalize();
    }
    return this.movementVector;
  }

  reset(): void {
    this.activePointerId = null;
    this.pressedKeys.clear();
    this.movementVector.set(0, 0);
    this.updateKnob(0, 0);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.activePointerId !== null) return;

    this.activePointerId = event.pointerId;
    this.joystick.setPointerCapture(event.pointerId);

    const rect = this.joystick.getBoundingClientRect();
    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;
    this.maxRadius = rect.width * 0.31;
    this.updateFromPointer(event.clientX, event.clientY);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) return;
    this.updateFromPointer(event.clientX, event.clientY);
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) return;

    this.activePointerId = null;
    this.movementVector.set(0, 0);
    this.updateKnob(0, 0);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.isMovementKey(event.code)) {
      this.pressedKeys.add(event.code);
      event.preventDefault();
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

    if (distance > this.maxRadius) {
      const scale = this.maxRadius / distance;
      dx *= scale;
      dy *= scale;
    }

    const normalizedX = dx / this.maxRadius;
    const normalizedY = -dy / this.maxRadius;
    const deadZone = 0.08;
    const magnitude = Math.hypot(normalizedX, normalizedY);

    if (magnitude <= deadZone) {
      this.movementVector.set(0, 0);
    } else {
      const remappedMagnitude = Math.min((magnitude - deadZone) / (1 - deadZone), 1);
      const inverse = 1 / magnitude;
      this.movementVector.set(
        normalizedX * inverse * remappedMagnitude,
        normalizedY * inverse * remappedMagnitude
      );
    }

    this.updateKnob(dx, dy);
  }

  private updateKnob(x: number, y: number): void {
    this.joystick.style.setProperty('--stick-x', `${x}px`);
    this.joystick.style.setProperty('--stick-y', `${y}px`);
  }

  private isMovementKey(code: string): boolean {
    return code === 'KeyW'
      || code === 'KeyA'
      || code === 'KeyS'
      || code === 'KeyD'
      || code === 'ArrowUp'
      || code === 'ArrowLeft'
      || code === 'ArrowDown'
      || code === 'ArrowRight';
  }
}
