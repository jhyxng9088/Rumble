import type { InputFrame, Vec2 } from '../core/types';

const ZERO: Vec2 = { x: 0, y: 0 };

export class InputController {
  private readonly keys = new Set<string>();
  private move: Vec2 = { ...ZERO };
  private lightQueued = false;
  private heavyQueued = false;
  private dodgeQueued = false;
  private activePointerId: number | null = null;
  private joystickOrigin: Vec2 = { ...ZERO };

  constructor(private readonly root: HTMLElement) {
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp, { passive: false });
    this.bindControls();
  }

  readFrame(): InputFrame {
    const keyboard = this.keyboardMove();
    const move = Math.hypot(keyboard.x, keyboard.y) > 0 ? keyboard : this.move;
    const frame: InputFrame = {
      move,
      lightPressed: this.lightQueued,
      heavyPressed: this.heavyQueued,
      dodgePressed: this.dodgeQueued,
    };
    this.lightQueued = false;
    this.heavyQueued = false;
    this.dodgeQueued = false;
    return frame;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private bindControls(): void {
    const zone = this.required<HTMLElement>('[data-control="move-zone"]');
    const knob = this.required<HTMLElement>('[data-control="move-knob"]');

    zone.addEventListener('pointerdown', (event) => {
      if (this.activePointerId !== null) return;
      this.activePointerId = event.pointerId;
      zone.setPointerCapture(event.pointerId);
      const rect = zone.getBoundingClientRect();
      this.joystickOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      this.updateJoystick(event.clientX, event.clientY, knob);
    });

    zone.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this.activePointerId) return;
      this.updateJoystick(event.clientX, event.clientY, knob);
    });

    const release = (event: PointerEvent) => {
      if (event.pointerId !== this.activePointerId) return;
      this.activePointerId = null;
      this.move = { ...ZERO };
      knob.style.transform = 'translate3d(0, 0, 0)';
    };
    zone.addEventListener('pointerup', release);
    zone.addEventListener('pointercancel', release);

    this.bindAction('light', () => { this.lightQueued = true; });
    this.bindAction('heavy', () => { this.heavyQueued = true; });
    this.bindAction('dodge', () => { this.dodgeQueued = true; });
  }

  private bindAction(name: string, action: () => void): void {
    const button = this.required<HTMLButtonElement>(`[data-action="${name}"]`);
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      action();
      button.dataset.pressed = 'true';
    });
    const release = () => { button.dataset.pressed = 'false'; };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
  }

  private updateJoystick(clientX: number, clientY: number, knob: HTMLElement): void {
    const dx = clientX - this.joystickOrigin.x;
    const dy = clientY - this.joystickOrigin.y;
    const radius = 42;
    const distance = Math.hypot(dx, dy);
    const scale = distance > radius ? radius / distance : 1;
    const x = dx * scale;
    const y = dy * scale;
    this.move = { x: x / radius, y: y / radius };
    knob.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  private keyboardMove(): Vec2 {
    const x = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0)
      - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
    const y = (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0)
      - (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0);
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    this.keys.add(event.code);
    if (event.repeat) return;
    if (event.code === 'KeyJ') this.lightQueued = true;
    if (event.code === 'KeyK') this.heavyQueued = true;
    if (event.code === 'Space' || event.code === 'KeyL') {
      event.preventDefault();
      this.dodgeQueued = true;
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  private required<T extends Element>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing control: ${selector}`);
    return element;
  }
}
