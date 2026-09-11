import type { AttackKind, Vec2 } from '../core/types';

interface Particle {
  position: Vec2;
  velocity: Vec2;
  life: number;
  maxLife: number;
  radius: number;
  bright: boolean;
}

interface Slash {
  position: Vec2;
  life: number;
  heavy: boolean;
  direction: number;
}

export class Effects {
  private readonly particles: Particle[] = [];
  private readonly slashes: Slash[] = [];

  spawnImpact(position: Vec2, kind: AttackKind, direction: number): void {
    const count = kind === 'heavy' ? 22 : 12;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.random() - 0.5) * 1.6 + (direction > 0 ? 0 : Math.PI);
      const speed = (kind === 'heavy' ? 4.8 : 3.2) * (0.55 + Math.random());
      this.particles.push({
        position: { x: position.x, y: position.y },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed * 0.45 },
        life: 0.22 + Math.random() * 0.16,
        maxLife: 0.38,
        radius: kind === 'heavy' ? 5 + Math.random() * 7 : 3 + Math.random() * 5,
        bright: Math.random() > 0.35,
      });
    }
    this.slashes.push({ position: { ...position }, life: kind === 'heavy' ? 0.22 : 0.14, heavy: kind === 'heavy', direction });
  }

  spawnDodgeSpark(position: Vec2): void {
    for (let index = 0; index < 7; index += 1) {
      this.particles.push({
        position: { ...position },
        velocity: { x: (Math.random() - 0.5) * 2.5, y: -0.8 - Math.random() * 2.5 },
        life: 0.18 + Math.random() * 0.16,
        maxLife: 0.34,
        radius: 2 + Math.random() * 3,
        bright: true,
      });
    }
  }

  update(deltaSeconds: number): void {
    for (const particle of this.particles) {
      particle.life -= deltaSeconds;
      particle.position.x += particle.velocity.x * deltaSeconds;
      particle.position.y += particle.velocity.y * deltaSeconds;
      particle.velocity.x *= Math.exp(-4 * deltaSeconds);
      particle.velocity.y *= Math.exp(-4 * deltaSeconds);
    }
    for (const slash of this.slashes) slash.life -= deltaSeconds;
    this.removeDead(this.particles);
    this.removeDead(this.slashes);
  }

  draw(ctx: CanvasRenderingContext2D, project: (point: Vec2) => Vec2): void {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const particle of this.particles) {
      const point = project(particle.position);
      const alpha = Math.max(0, particle.life / particle.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.bright ? '#fff7d6' : '#ff5a36';
      ctx.beginPath();
      ctx.arc(point.x, point.y - 52, particle.radius * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const slash of this.slashes) {
      const point = project(slash.position);
      const alpha = Math.min(1, slash.life * 8);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = slash.heavy ? '#ffffff' : '#ffd15c';
      ctx.lineWidth = slash.heavy ? 9 : 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const span = slash.heavy ? 78 : 50;
      ctx.moveTo(point.x - span * slash.direction, point.y - 70);
      ctx.lineTo(point.x + span * 0.65 * slash.direction, point.y - 40);
      ctx.stroke();
    }
    ctx.restore();
  }

  private removeDead<T extends { life: number }>(items: T[]): void {
    let write = 0;
    for (let read = 0; read < items.length; read += 1) {
      if (items[read].life > 0) {
        items[write] = items[read];
        write += 1;
      }
    }
    items.length = write;
  }
}
