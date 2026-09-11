import type { ArenaBounds, AttackKind, FighterId, Vec2 } from '../core/types';

export type FighterState = 'idle' | 'move' | 'attack' | 'dodge' | 'hurt' | 'ko';

export interface FighterPalette {
  body: string;
  bodyDark: string;
  glove: string;
  accent: string;
  face: string;
}

export class Fighter {
  readonly maxHealth = 100;
  health = 100;
  position: Vec2;
  velocity: Vec2 = { x: 0, y: 0 };
  facing = 1;
  state: FighterState = 'idle';
  stateTime = 0;
  attackKind: AttackKind | null = null;
  attackSerial = 0;
  invulnerableTime = 0;
  hitFlash = 0;
  rage = 0;

  constructor(
    readonly id: FighterId,
    readonly name: string,
    position: Vec2,
    readonly palette: FighterPalette,
  ) {
    this.position = { ...position };
  }

  update(deltaSeconds: number, bounds: ArenaBounds): void {
    this.stateTime = Math.max(0, this.stateTime - deltaSeconds);
    this.invulnerableTime = Math.max(0, this.invulnerableTime - deltaSeconds);
    this.hitFlash = Math.max(0, this.hitFlash - deltaSeconds);

    if (this.state === 'hurt' || this.state === 'ko') {
      this.position.x += this.velocity.x * deltaSeconds;
      this.position.y += this.velocity.y * deltaSeconds;
      const drag = Math.exp(-5.4 * deltaSeconds);
      this.velocity.x *= drag;
      this.velocity.y *= drag;
    }

    this.position.x = Math.min(bounds.maxX, Math.max(bounds.minX, this.position.x));
    this.position.y = Math.min(bounds.maxY, Math.max(bounds.minY, this.position.y));

    if (this.stateTime <= 0) {
      if (this.state === 'ko') return;
      this.state = 'idle';
      this.attackKind = null;
    }
  }

  move(direction: Vec2, deltaSeconds: number, bounds: ArenaBounds): void {
    if (!this.canMove()) return;
    const magnitude = Math.min(1, Math.hypot(direction.x, direction.y));
    if (magnitude < 0.08) {
      if (this.state === 'move') this.state = 'idle';
      return;
    }
    const speed = 4.55;
    this.position.x += direction.x * speed * deltaSeconds;
    this.position.y += direction.y * speed * 0.64 * deltaSeconds;
    this.position.x = Math.min(bounds.maxX, Math.max(bounds.minX, this.position.x));
    this.position.y = Math.min(bounds.maxY, Math.max(bounds.minY, this.position.y));
    if (Math.abs(direction.x) > 0.12) this.facing = direction.x > 0 ? 1 : -1;
    this.state = 'move';
  }

  face(targetX: number): void {
    if (this.state === 'attack' || this.state === 'hurt' || this.state === 'ko') return;
    const delta = targetX - this.position.x;
    if (Math.abs(delta) > 0.08) this.facing = delta > 0 ? 1 : -1;
  }

  startAttack(kind: AttackKind): boolean {
    if (!this.canAct()) return false;
    this.state = 'attack';
    this.attackKind = kind;
    this.attackSerial += 1;
    this.stateTime = kind === 'light' ? 0.25 : 0.46;
    return true;
  }

  startDodge(direction: Vec2): boolean {
    if (!this.canAct()) return false;
    const length = Math.hypot(direction.x, direction.y);
    const fallback = { x: -this.facing, y: 0 };
    const normalized = length > 0.12 ? { x: direction.x / length, y: direction.y / length } : fallback;
    this.state = 'dodge';
    this.stateTime = 0.24;
    this.invulnerableTime = 0.17;
    this.position.x += normalized.x * 1.25;
    this.position.y += normalized.y * 0.72;
    return true;
  }

  receiveHit(damage: number, knockback: Vec2, hitStun: number): boolean {
    if (this.invulnerableTime > 0 || this.state === 'ko') return false;
    this.health = Math.max(0, this.health - damage);
    this.velocity = { ...knockback };
    this.hitFlash = 0.12;
    this.rage = Math.min(100, this.rage + damage * 0.7);
    if (this.health <= 0) {
      this.state = 'ko';
      this.stateTime = Number.POSITIVE_INFINITY;
      this.velocity.x *= 1.28;
      this.velocity.y *= 1.28;
    } else {
      this.state = 'hurt';
      this.stateTime = hitStun;
    }
    return true;
  }

  isAttackActive(): boolean {
    if (this.state !== 'attack' || !this.attackKind) return false;
    const elapsed = (this.attackKind === 'light' ? 0.25 : 0.46) - this.stateTime;
    return this.attackKind === 'light'
      ? elapsed >= 0.075 && elapsed <= 0.145
      : elapsed >= 0.19 && elapsed <= 0.30;
  }

  private canMove(): boolean {
    return this.state !== 'attack' && this.state !== 'hurt' && this.state !== 'ko' && this.state !== 'dodge';
  }

  private canAct(): boolean {
    return this.state === 'idle' || this.state === 'move';
  }
}
