import type { Vec2 } from '../core/types';

export class ArenaCamera {
  private shakeStrength = 0;
  private shakeTime = 0;
  private shakeDuration = 0.01;
  private zoomPunch = 0;

  update(deltaSeconds: number): void {
    this.shakeTime = Math.max(0, this.shakeTime - deltaSeconds);
    this.zoomPunch *= Math.exp(-12 * deltaSeconds);
    if (this.shakeTime <= 0) this.shakeStrength = 0;
  }

  kick(strength: number, duration: number): void {
    this.shakeStrength = Math.max(this.shakeStrength, strength);
    this.shakeTime = Math.max(this.shakeTime, duration);
    this.shakeDuration = Math.max(duration, 0.01);
    this.zoomPunch = Math.max(this.zoomPunch, strength * 0.012);
  }

  getOffset(): Vec2 {
    if (this.shakeTime <= 0) return { x: 0, y: 0 };
    const fade = this.shakeTime / this.shakeDuration;
    const amount = this.shakeStrength * 7 * fade;
    return {
      x: (Math.random() - 0.5) * amount,
      y: (Math.random() - 0.5) * amount,
    };
  }

  getScale(): number {
    return 1 + this.zoomPunch;
  }
}
