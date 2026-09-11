import { Fighter } from '../character/Fighter';
import type { AttackKind, Vec2 } from '../core/types';
import { Effects } from '../effects/Effects';
import { ArenaCamera } from '../camera/ArenaCamera';

interface AttackSpec {
  reach: number;
  depth: number;
  damage: number;
  knockback: number;
  hitStun: number;
  stopMs: number;
}

const ATTACKS: Record<AttackKind, AttackSpec> = {
  light: { reach: 1.65, depth: 0.95, damage: 9, knockback: 4.6, hitStun: 0.16, stopMs: 54 },
  heavy: { reach: 2.0, depth: 1.05, damage: 18, knockback: 7.8, hitStun: 0.26, stopMs: 82 },
};

export class CombatSystem {
  private readonly resolvedAttack = new Map<string, number>();
  private hitStopRemaining = 0;

  constructor(
    private readonly effects: Effects,
    private readonly camera: ArenaCamera,
  ) {}

  update(attacker: Fighter, defender: Fighter): void {
    if (!attacker.attackKind || !attacker.isAttackActive()) return;
    const key = `${attacker.id}:${defender.id}`;
    if (this.resolvedAttack.get(key) === attacker.attackSerial) return;
    this.resolvedAttack.set(key, attacker.attackSerial);

    const spec = ATTACKS[attacker.attackKind];
    const dx = defender.position.x - attacker.position.x;
    const dy = defender.position.y - attacker.position.y;
    const inFront = Math.sign(dx || attacker.facing) === attacker.facing;
    if (!inFront || Math.abs(dx) > spec.reach || Math.abs(dy) > spec.depth) return;

    const direction = Math.sign(dx || attacker.facing) || attacker.facing;
    const knockback: Vec2 = {
      x: direction * spec.knockback,
      y: Math.sign(dy || 1) * spec.knockback * 0.12,
    };
    if (!defender.receiveHit(spec.damage, knockback, spec.hitStun)) {
      this.effects.spawnDodgeSpark(defender.position);
      return;
    }

    attacker.rage = Math.min(100, attacker.rage + spec.damage * 0.9);
    this.hitStopRemaining = Math.max(this.hitStopRemaining, spec.stopMs / 1000);
    this.effects.spawnImpact(defender.position, attacker.attackKind, direction);
    this.camera.kick(attacker.attackKind === 'heavy' ? 1.0 : 0.55, attacker.attackKind === 'heavy' ? 0.15 : 0.10);
  }

  consumeHitStop(deltaSeconds: number): boolean {
    if (this.hitStopRemaining <= 0) return false;
    this.hitStopRemaining = Math.max(0, this.hitStopRemaining - deltaSeconds);
    return true;
  }
}
