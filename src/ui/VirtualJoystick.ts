import type { MoveInput } from "../input/InputController";

type MoveHandler = (move: MoveInput, active: boolean) => void;

export class VirtualJoystick {
  private activePointerId: number | null = null;

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.activePointerId !== null) {
      return;
    }

    this.activePointerId = event.pointerId;
    this.root.setPointerCapture(event.pointerId);
    this.root.dataset.active = "true";
    this.updateFromPointer(event);
    event.preventDefault();
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }
    this.updateFromPointer(event);
    event.preventDefault();
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }

    if (this.root.hasPointerCapture(event.pointerId)) {
      this.root.releasePointerCapture(event.pointerId);
    }
    this.activePointerId = null;
    this.root.dataset.active = "false";
    this.root.style.setProperty("--stick-x", "0px");
    this.root.style.setProperty("--stick-y", "0px");
    this.onMove({ x: 0, y: 0 }, false);
    event.preventDefault();
  };

  constructor(
    private readonly root: HTMLElement,
    private readonly knob: HTMLElement,
    private readonly onMove: MoveHandler,
  ) {
    this.root.addEventListener("pointerdown", this.handlePointerDown);
    this.root.addEventListener("pointermove", this.handlePointerMove);
    this.root.addEventListener("pointerup", this.handlePointerEnd);
    this.root.addEventListener("pointercancel", this.handlePointerEnd);
    void this.knob;
  }

  dispose(): void {
    this.root.removeEventListener("pointerdown", this.handlePointerDown);
    this.root.removeEventListener("pointermove", this.handlePointerMove);
    this.root.removeEventListener("pointerup", this.handlePointerEnd);
    this.root.removeEventListener("pointercancel", this.handlePointerEnd);
    this.onMove({ x: 0, y: 0 }, false);
  }

  private updateFromPointer(event: PointerEvent): void {
    const rect = this.root.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxTravel = rect.width * 0.29;
    const rawX = event.clientX - centerX;
    const rawY = event.clientY - centerY;
    const distance = Math.hypot(rawX, rawY);
    const scale = distance > maxTravel ? maxTravel / distance : 1;
    const x = rawX * scale;
    const y = rawY * scale;

    this.root.style.setProperty("--stick-x", `${x.toFixed(2)}px`);
    this.root.style.setProperty("--stick-y", `${y.toFixed(2)}px`);
    this.onMove({ x: x / maxTravel, y: -y / maxTravel }, true);
  }
}
