import { ArenaCamera } from '../camera/ArenaCamera';
import { Fighter } from '../character/Fighter';
import { CombatSystem } from '../combat/CombatSystem';
import type { InputFrame, Vec2 } from './types';
import { Effects } from '../effects/Effects';
import { InputController } from '../input/InputController';
import { GameUI } from '../ui/GameUI';
import { ArenaWorld } from '../world/ArenaWorld';

export class Game {
  private readonly context: CanvasRenderingContext2D;
  private readonly world: ArenaWorld;
  private readonly camera = new ArenaCamera();
  private readonly effects = new Effects();
  private readonly combat: CombatSystem;
  private readonly player: Fighter;
  private readonly rival: Fighter;
  private readonly ui: GameUI;
  private readonly input: InputController;
  private animationFrame = 0;
  private lastTime = performance.now();
  private rivalThinkTime = 0;
  private resizeTimer = 0;

  constructor(
    canvas: HTMLCanvasElement,
    uiHost: HTMLElement,
  ) {
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('2D canvas is unavailable');
    this.context = context;
    this.world = new ArenaWorld(canvas);
    this.ui = new GameUI(uiHost);
    this.input = new InputController(this.ui.root);
    this.combat = new CombatSystem(this.effects, this.camera);
    this.player = new Fighter('player', 'YOU', { x: -2.5, y: 0.4 }, {
      body: '#f2d9b8', bodyDark: '#a87353', glove: '#ff4b38', accent: '#2e7cff', face: '#17151b',
    });
    this.rival = new Fighter('rival', 'RIVAL', { x: 2.5, y: -0.2 }, {
      body: '#d9c3ff', bodyDark: '#765aa5', glove: '#34d8bb', accent: '#7c44ff', face: '#17151b',
    });
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  start(): void {
    this.animationFrame = requestAnimationFrame(this.frame);
  }

  destroy(): void {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.onResize);
    this.input.destroy();
  }

  private frame = (time: number): void => {
    const deltaSeconds = Math.min((time - this.lastTime) / 1000, 0.033);
    this.lastTime = time;
    const input = this.input.readFrame();

    if (!this.combat.consumeHitStop(deltaSeconds)) {
      this.update(deltaSeconds, input);
    }
    this.effects.update(deltaSeconds);
    this.camera.update(deltaSeconds);
    this.render();
    this.ui.update(this.player, this.rival);
    this.animationFrame = requestAnimationFrame(this.frame);
  };

  private update(deltaSeconds: number, input: InputFrame): void {
    this.player.face(this.rival.position.x);
    this.rival.face(this.player.position.x);
    this.player.update(deltaSeconds, this.world.bounds);
    this.rival.update(deltaSeconds, this.world.bounds);

    this.player.move(input.move, deltaSeconds, this.world.bounds);
    if (input.lightPressed) this.player.startAttack('light');
    if (input.heavyPressed) this.player.startAttack('heavy');
    if (input.dodgePressed) this.player.startDodge(input.move);

    this.updateRival(deltaSeconds);
    this.combat.update(this.player, this.rival);
    this.combat.update(this.rival, this.player);
  }

  private updateRival(deltaSeconds: number): void {
    if (this.rival.state === 'ko' || this.player.state === 'ko') return;
    this.rivalThinkTime -= deltaSeconds;
    const dx = this.player.position.x - this.rival.position.x;
    const dy = this.player.position.y - this.rival.position.y;
    const distance = Math.hypot(dx, dy * 1.6);

    if (this.rivalThinkTime <= 0) {
      this.rivalThinkTime = 0.16 + Math.random() * 0.15;
      if (this.player.state === 'attack' && distance < 2.1 && Math.random() < 0.42) {
        this.rival.startDodge({ x: -Math.sign(dx || 1), y: Math.random() - 0.5 });
        return;
      }
      if (distance < 1.7 && Math.random() < 0.66) {
        this.rival.startAttack(Math.random() < 0.72 ? 'light' : 'heavy');
        return;
      }
    }

    if (distance > 1.35) {
      const direction: Vec2 = { x: dx / Math.max(distance, 0.01), y: dy / Math.max(distance, 0.01) };
      this.rival.move(direction, deltaSeconds * 0.86, this.world.bounds);
    }
  }

  private render(): void {
    const ctx = this.context;
    this.world.beginFrame(ctx);
    const offset = this.camera.getOffset();
    const viewport = this.world.getViewport();
    ctx.save();
    ctx.translate(viewport.x * 0.5 + offset.x, viewport.y * 0.5 + offset.y);
    ctx.scale(this.camera.getScale(), this.camera.getScale());
    ctx.translate(-viewport.x * 0.5, -viewport.y * 0.5);
    this.world.drawArena(ctx);

    const fighters = [this.player, this.rival].sort((a, b) => a.position.y - b.position.y);
    for (const fighter of fighters) this.drawFighter(ctx, fighter);
    this.effects.draw(ctx, (point) => this.world.project(point));
    ctx.restore();

    if (this.player.state === 'ko' || this.rival.state === 'ko') {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.24)';
      ctx.fillRect(0, 0, viewport.x, viewport.y);
      ctx.restore();
    }
  }

  private drawFighter(ctx: CanvasRenderingContext2D, fighter: Fighter): void {
    const point = this.world.project(fighter.position);
    const depth = (fighter.position.y - this.world.bounds.minY) / (this.world.bounds.maxY - this.world.bounds.minY);
    const scale = 0.82 + depth * 0.24;
    const attackProgress = this.attackProgress(fighter);
    const hurtLean = fighter.state === 'hurt' || fighter.state === 'ko' ? -fighter.facing * 0.24 : 0;
    const dodgeLean = fighter.state === 'dodge' ? -fighter.facing * 0.18 : 0;
    const bob = fighter.state === 'move' ? Math.sin(performance.now() * 0.014 + (fighter.id === 'rival' ? 1.7 : 0)) * 3 : 0;
    const squash = fighter.state === 'hurt' ? 0.9 : fighter.state === 'attack' ? 1.03 : 1;

    ctx.save();
    ctx.translate(point.x, point.y + bob);
    ctx.scale(scale * fighter.facing, scale);
    ctx.rotate(hurtLean + dodgeLean);

    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 38, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyY = -58;
    ctx.scale(squash, 2 - squash);
    this.roundRect(ctx, -27, bodyY - 20, 54, 57, 23, fighter.hitFlash > 0 ? '#fff5e6' : fighter.palette.accent);

    ctx.fillStyle = fighter.palette.bodyDark;
    ctx.beginPath();
    ctx.arc(-17, bodyY - 66, 15, 0, Math.PI * 2);
    ctx.arc(17, bodyY - 66, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fighter.hitFlash > 0 ? '#ffffff' : fighter.palette.body;
    ctx.beginPath();
    ctx.arc(0, bodyY - 52, 37, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fighter.palette.bodyDark;
    ctx.beginPath();
    ctx.ellipse(18, bodyY - 42, 19, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fighter.palette.face;
    ctx.beginPath();
    ctx.arc(14, bodyY - 58, 4, 0, Math.PI * 2);
    ctx.arc(29, bodyY - 55, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = fighter.palette.face;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(27, bodyY - 43, 7, 0.2, 1.8);
    ctx.stroke();

    const rearArmX = -30;
    const frontArmX = 31 + attackProgress * 43;
    const armY = bodyY - 18 - attackProgress * 10;
    this.drawArm(ctx, rearArmX, bodyY - 12, fighter.palette.body, fighter.palette.glove, 0.08);
    this.drawArm(ctx, frontArmX, armY, fighter.palette.body, fighter.palette.glove, attackProgress * -0.16);

    ctx.fillStyle = fighter.palette.bodyDark;
    ctx.beginPath();
    ctx.ellipse(-16, -17, 13, 20, -0.1, 0, Math.PI * 2);
    ctx.ellipse(16, -17, 13, 20, 0.1, 0, Math.PI * 2);
    ctx.fill();

    if (fighter.state === 'dodge') {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = fighter.palette.accent;
      ctx.beginPath();
      ctx.ellipse(-38 * fighter.facing, bodyY - 35, 46, 55, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawArm(ctx: CanvasRenderingContext2D, x: number, y: number, bodyColor: string, gloveColor: string, rotation: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = bodyColor;
    this.capsule(ctx, -16, -7, 31, 14, 7);
    ctx.fillStyle = gloveColor;
    ctx.beginPath();
    ctx.arc(21, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private attackProgress(fighter: Fighter): number {
    if (fighter.state !== 'attack' || !fighter.attackKind) return 0;
    const total = fighter.attackKind === 'light' ? 0.25 : 0.46;
    const elapsed = total - fighter.stateTime;
    const peak = fighter.attackKind === 'light' ? 0.11 : 0.25;
    if (elapsed <= peak) return Math.min(1, elapsed / peak);
    return Math.max(0, 1 - (elapsed - peak) / (total - peak));
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string): void {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  }

  private capsule(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  }

  private onResize = (): void => {
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => this.world.resize(), 80);
  };
}
