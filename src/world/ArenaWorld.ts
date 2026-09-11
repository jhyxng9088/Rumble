import type { ArenaBounds, Vec2 } from '../core/types';

export class ArenaWorld {
  readonly bounds: ArenaBounds = { minX: -7.2, maxX: 7.2, minY: -2.2, maxY: 2.2 };
  private width = 1;
  private height = 1;
  private pixelRatio = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.width * this.pixelRatio);
    this.canvas.height = Math.round(this.height * this.pixelRatio);
  }

  beginFrame(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#11121c');
    gradient.addColorStop(0.56, '#21162d');
    gradient.addColorStop(1, '#08090f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  drawArena(ctx: CanvasRenderingContext2D): void {
    const horizon = this.height * 0.27;
    ctx.save();
    ctx.fillStyle = '#0d0d16';
    ctx.fillRect(0, horizon - 42, this.width, 42);

    for (let index = 0; index < 18; index += 1) {
      const buildingWidth = 38 + (index % 5) * 14;
      const x = index * (this.width / 17) - 22;
      const buildingHeight = 24 + ((index * 17) % 60);
      ctx.fillStyle = index % 3 === 0 ? '#151525' : '#10101c';
      ctx.fillRect(x, horizon - buildingHeight, buildingWidth, buildingHeight);
      if (index % 2 === 0) {
        ctx.fillStyle = 'rgba(255,210,115,0.13)';
        ctx.fillRect(x + 9, horizon - buildingHeight + 12, 6, 4);
      }
    }

    const farLeft = this.project({ x: this.bounds.minX, y: this.bounds.minY });
    const farRight = this.project({ x: this.bounds.maxX, y: this.bounds.minY });
    const nearLeft = this.project({ x: this.bounds.minX, y: this.bounds.maxY });
    const nearRight = this.project({ x: this.bounds.maxX, y: this.bounds.maxY });

    const floor = ctx.createLinearGradient(0, farLeft.y, 0, nearLeft.y);
    floor.addColorStop(0, '#292332');
    floor.addColorStop(1, '#17141d');
    ctx.fillStyle = floor;
    ctx.beginPath();
    ctx.moveTo(farLeft.x, farLeft.y);
    ctx.lineTo(farRight.x, farRight.y);
    ctx.lineTo(nearRight.x, nearRight.y);
    ctx.lineTo(nearLeft.x, nearLeft.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.055)';
    ctx.lineWidth = 1;
    for (let x = -6; x <= 6; x += 2) {
      const start = this.project({ x, y: this.bounds.minY });
      const end = this.project({ x, y: this.bounds.maxY });
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
    for (let y = -1.6; y <= 2; y += 0.9) {
      const start = this.project({ x: this.bounds.minX, y });
      const end = this.project({ x: this.bounds.maxX, y });
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#5a415f';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(farLeft.x, farLeft.y);
    ctx.lineTo(farRight.x, farRight.y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.13)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(farLeft.x, farLeft.y - 3);
    ctx.lineTo(farRight.x, farRight.y - 3);
    ctx.stroke();
    ctx.restore();
  }

  project(point: Vec2): Vec2 {
    const xNormalized = (point.x - this.bounds.minX) / (this.bounds.maxX - this.bounds.minX);
    const yNormalized = (point.y - this.bounds.minY) / (this.bounds.maxY - this.bounds.minY);
    const farWidth = this.width * 0.73;
    const nearWidth = this.width * 0.94;
    const planeWidth = farWidth + (nearWidth - farWidth) * yNormalized;
    const left = (this.width - planeWidth) * 0.5;
    return {
      x: left + xNormalized * planeWidth,
      y: this.height * (0.42 + yNormalized * 0.37),
    };
  }

  getViewport(): Vec2 {
    return { x: this.width, y: this.height };
  }
}
