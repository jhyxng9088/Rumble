import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StylizedFighter } from '../character/StylizedFighter';
import { ImpactEffects } from '../effects/ImpactEffects';
import { FollowCamera } from '../camera/FollowCamera';

interface AttackSpec {
  reach: number;
  damage: number;
  knockback: number;
  hitStun: number;
  hitStop: number;
}

const ATTACKS = {
  light: { reach: 1.65, damage: 9, knockback: 5.1, hitStun: 0.16, hitStop: 0.055 },
  heavy: { reach: 1.95, damage: 18, knockback: 8.4, hitStun: 0.27, hitStop: 0.085 },
} satisfies Record<'light' | 'heavy', AttackSpec>;

export class CombatSystem {
  private readonly resolved = new Map<string, number>();
  private hitStopRemaining = 0;

  constructor(private readonly effects: ImpactEffects, private readonly camera: FollowCamera) {}

  resolve(attacker: StylizedFighter, defender: StylizedFighter): void {
    if (!attacker.attackKind || !attacker.isAttackActive()) return;
    const key = `${attacker.id}:${defender.id}`;
    if (this.resolved.get(key) === attacker.attackSerial) return;
    this.resolved.set(key, attacker.attackSerial);

    const spec = ATTACKS[attacker.attackKind];
    const delta = defender.position.subtract(attacker.position);
    delta.y = 0;
    const distance = delta.length();
    if (distance > spec.reach || distance < 0.001) return;
    const direction = delta.normalizeToNew();
    if (Vector3.Dot(attacker.forward, direction) < 0.12) return;

    const knockback = direction.scale(spec.knockback);
    knockback.y = attacker.attackKind === 'heavy' ? 1.35 : 0.55;
    if (!defender.receiveHit(spec.damage, knockback, spec.hitStun)) {
      this.effects.spawnEvade(defender.position.add(new Vector3(0, 1.15, 0)));
      return;
    }

    attacker.rage = Math.min(100, attacker.rage + spec.damage * 0.95);
    this.hitStopRemaining = Math.max(this.hitStopRemaining, spec.hitStop);
    this.effects.spawnHit(defender.position.add(new Vector3(0, 1.15, 0)), attacker.attackKind, direction);
    this.camera.kick(attacker.attackKind === 'heavy' ? 1 : 0.55);
  }

  consumeHitStop(deltaSeconds: number): boolean {
    if (this.hitStopRemaining <= 0) return false;
    this.hitStopRemaining = Math.max(0, this.hitStopRemaining - deltaSeconds);
    return true;
  }
}
