import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { FollowCamera } from '../camera/FollowCamera';
import type { AnimalFighter } from '../character/AnimalFighter';
import type { ImpactEffects } from '../effects/ImpactEffects';

export type ThrowableKind = 'rock' | 'crate' | 'bomb';
type ThrowableState = 'ground' | 'held' | 'flying' | 'respawning';

interface ThrowableSpec {
  label: string;
  speed: number;
  damage: number;
  knockback: number;
  groundY: number;
}

interface ThrowableItem {
  id: number;
  kind: ThrowableKind;
  mesh: Mesh;
  spawn: Vector3;
  state: ThrowableState;
  holderId: 'player' | 'rival' | null;
  ownerId: 'player' | 'rival' | null;
  velocity: Vector3;
  fuse: number;
  respawn: number;
}

const SPECS: Record<ThrowableKind, ThrowableSpec> = {
  rock: { label: 'ROCK', speed: 10.0, damage: 19, knockback: 6.2, groundY: 0.24 },
  crate: { label: 'CRATE', speed: 7.5, damage: 31, knockback: 8.4, groundY: 0.38 },
  bomb: { label: 'BOMB', speed: 8.2, damage: 38, knockback: 9.5, groundY: 0.30 },
};

export class ThrowableSystem {
  private readonly items: ThrowableItem[] = [];
  private readonly rockMat: StandardMaterial;
  private readonly crateMat: StandardMaterial;
  private readonly crateEdgeMat: StandardMaterial;
  private readonly bombMat: StandardMaterial;
  private readonly fuseMat: StandardMaterial;
  private hitStop = 0;
  private nextId = 1;

  constructor(
    private readonly scene: Scene,
    private readonly effects: ImpactEffects,
    private readonly camera: FollowCamera,
  ) {
    this.rockMat = this.material('throw-rock', new Color3(0.28, 0.30, 0.34));
    this.crateMat = this.material('throw-crate', new Color3(0.47, 0.24, 0.09));
    this.crateEdgeMat = this.material('throw-crate-edge', new Color3(0.78, 0.48, 0.17));
    this.bombMat = this.material('throw-bomb', new Color3(0.07, 0.08, 0.10));
    this.fuseMat = this.material('throw-fuse', new Color3(1.0, 0.46, 0.08));
    this.spawnSet();
  }

  consumeHitStop(deltaSeconds: number): boolean {
    if (this.hitStop <= 0) return false;
    this.hitStop = Math.max(0, this.hitStop - deltaSeconds);
    return true;
  }

  hasHeld(fighter: AnimalFighter): boolean {
    return this.items.some((item) => item.state === 'held' && item.holderId === fighter.id);
  }

  heldLabel(fighter: AnimalFighter): string {
    const item = this.items.find((candidate) => candidate.state === 'held' && candidate.holderId === fighter.id);
    return item ? SPECS[item.kind].label : 'EMPTY';
  }

  nearestGroundPosition(position: Vector3): Vector3 | null {
    let best: ThrowableItem | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const item of this.items) {
      if (item.state !== 'ground') continue;
      const distance = Vector3.DistanceSquared(position, item.mesh.position);
      if (distance < bestDistance) {
        best = item;
        bestDistance = distance;
      }
    }
    return best ? best.mesh.position.clone() : null;
  }

  tryPickup(fighter: AnimalFighter): boolean {
    if (!fighter.isAlive || this.hasHeld(fighter)) return false;
    let best: ThrowableItem | null = null;
    let bestDistance = 1.35 * 1.35;
    for (const item of this.items) {
      if (item.state !== 'ground') continue;
      const dx = item.mesh.position.x - fighter.position.x;
      const dz = item.mesh.position.z - fighter.position.z;
      const distance = dx * dx + dz * dz;
      if (distance <= bestDistance) {
        best = item;
        bestDistance = distance;
      }
    }
    if (!best) return false;
    best.state = 'held';
    best.holderId = fighter.id;
    best.ownerId = null;
    best.velocity.setAll(0);
    best.mesh.parent = fighter.holdAnchor;
    best.mesh.position.set(0, 0, 0);
    best.mesh.rotation.set(0, 0, 0);
    return true;
  }

  throwHeld(fighter: AnimalFighter, targetDirection: Vector3): boolean {
    const item = this.items.find((candidate) => candidate.state === 'held' && candidate.holderId === fighter.id);
    if (!item || !fighter.isAlive) return false;
    const spec = SPECS[item.kind];
    const worldPosition = item.mesh.getAbsolutePosition().clone();
    const direction = targetDirection.lengthSquared() > 0.01 ? targetDirection.normalizeToNew() : fighter.forward;
    direction.y = 0;
    direction.normalize();
    item.mesh.parent = null;
    item.mesh.position.copyFrom(worldPosition);
    item.state = 'flying';
    item.holderId = null;
    item.ownerId = fighter.id;
    item.velocity.copyFrom(direction.scale(spec.speed));
    item.velocity.y = item.kind === 'crate' ? 3.1 : 3.7;
    item.fuse = item.kind === 'bomb' ? 1.18 : 0;
    return true;
  }

  update(deltaSeconds: number, player: AnimalFighter, rival: AnimalFighter): void {
    for (const item of this.items) {
      if (item.state === 'respawning') {
        item.respawn -= deltaSeconds;
        if (item.respawn <= 0) this.restoreItem(item);
        continue;
      }
      if (item.state !== 'flying') continue;

      item.fuse = item.kind === 'bomb' ? item.fuse - deltaSeconds : 0;
      item.velocity.y -= 9.2 * deltaSeconds;
      item.mesh.position.addInPlace(item.velocity.scale(deltaSeconds));
      item.mesh.rotation.x += deltaSeconds * 5.5;
      item.mesh.rotation.z += deltaSeconds * 4.1;

      if (item.kind === 'bomb' && item.fuse <= 0) {
        this.explode(item, player, rival);
        continue;
      }

      const target = item.ownerId === 'player' ? rival : player;
      if (target.isAlive && this.hitsFighter(item, target)) {
        if (item.kind === 'bomb') {
          this.explode(item, player, rival);
          continue;
        }
        this.directHit(item, target);
        continue;
      }

      const groundY = SPECS[item.kind].groundY;
      if (item.mesh.position.y <= groundY) {
        item.mesh.position.y = groundY;
        if (item.kind === 'bomb') {
          item.velocity.x *= 0.48;
          item.velocity.z *= 0.48;
          item.velocity.y = 0.6;
        } else {
          item.state = 'ground';
          item.ownerId = null;
          item.velocity.setAll(0);
        }
      }
    }
  }

  private directHit(item: ThrowableItem, target: AnimalFighter): void {
    const spec = SPECS[item.kind];
    const direction = item.velocity.clone();
    direction.y = 0;
    if (direction.lengthSquared() < 0.01) direction.set(1, 0, 0);
    direction.normalize();
    const accepted = target.receiveHit(spec.damage, direction.scale(spec.knockback));
    if (accepted) {
      this.effects.spawnImpact(item.mesh.position.clone(), item.kind === 'crate', direction);
      this.camera.kick(item.kind === 'crate' ? 1.05 : 0.72);
      this.hitStop = Math.max(this.hitStop, item.kind === 'crate' ? 0.082 : 0.058);
    }
    item.state = 'ground';
    item.ownerId = null;
    item.mesh.position.y = spec.groundY;
    item.velocity.setAll(0);
  }

  private explode(item: ThrowableItem, player: AnimalFighter, rival: AnimalFighter): void {
    const center = item.mesh.position.clone();
    this.effects.spawnExplosion(center);
    this.camera.kick(1.35);
    this.hitStop = Math.max(this.hitStop, 0.095);
    for (const fighter of [player, rival]) {
      if (!fighter.isAlive) continue;
      const offset = fighter.position.subtract(center);
      offset.y = 0;
      const distance = offset.length();
      if (distance > 2.65) continue;
      if (distance < 0.05) offset.set(1, 0, 0);
      const falloff = 1 - Math.min(distance / 2.65, 0.72);
      fighter.receiveHit(Math.round(SPECS.bomb.damage * falloff), offset.normalize().scale(SPECS.bomb.knockback * falloff));
    }
    item.state = 'respawning';
    item.ownerId = null;
    item.holderId = null;
    item.respawn = 3.2;
    item.mesh.setEnabled(false);
  }

  private hitsFighter(item: ThrowableItem, fighter: AnimalFighter): boolean {
    if (item.mesh.position.y < 0.25 || item.mesh.position.y > 1.95) return false;
    const dx = item.mesh.position.x - fighter.position.x;
    const dz = item.mesh.position.z - fighter.position.z;
    return dx * dx + dz * dz < 0.72 * 0.72;
  }

  private restoreItem(item: ThrowableItem): void {
    item.mesh.setEnabled(true);
    item.mesh.parent = null;
    item.mesh.position.copyFrom(item.spawn);
    item.mesh.rotation.set(0, 0, 0);
    item.state = 'ground';
    item.ownerId = null;
    item.holderId = null;
    item.velocity.setAll(0);
    item.fuse = 0;
  }

  private spawnSet(): void {
    const placements: Array<[ThrowableKind, number, number]> = [
      ['rock', -4.3, -1.7], ['rock', 3.8, 2.6], ['rock', 0.6, -3.6],
      ['crate', -2.3, 3.2], ['crate', 4.7, -2.8],
      ['bomb', 0.0, 3.7], ['bomb', -4.9, 1.8],
    ];
    for (const [kind, x, z] of placements) this.spawn(kind, new Vector3(x, SPECS[kind].groundY, z));
  }

  private spawn(kind: ThrowableKind, position: Vector3): void {
    const mesh = this.createMesh(kind);
    mesh.position.copyFrom(position);
    this.items.push({
      id: this.nextId++, kind, mesh, spawn: position.clone(), state: 'ground', holderId: null, ownerId: null,
      velocity: Vector3.Zero(), fuse: 0, respawn: 0,
    });
  }

  private createMesh(kind: ThrowableKind): Mesh {
    if (kind === 'rock') {
      const rock = CreateSphere(`rock-${this.nextId}`, { diameter: 0.58, segments: 7 }, this.scene);
      rock.scaling.set(1.18, 0.84, 1.0);
      rock.material = this.rockMat;
      this.outline(rock);
      return rock;
    }
    if (kind === 'crate') {
      const crate = CreateBox(`crate-${this.nextId}`, { size: 0.78 }, this.scene);
      crate.material = this.crateMat;
      this.outline(crate);
      const band = CreateBox(`crate-band-${this.nextId}`, { width: 0.82, height: 0.13, depth: 0.82 }, this.scene);
      band.parent = crate;
      band.material = this.crateEdgeMat;
      return crate;
    }
    const bomb = CreateSphere(`bomb-${this.nextId}`, { diameter: 0.64, segments: 10 }, this.scene);
    bomb.material = this.bombMat;
    this.outline(bomb);
    const fuse = CreateCylinder(`bomb-fuse-${this.nextId}`, { height: 0.30, diameter: 0.09, tessellation: 8 }, this.scene);
    fuse.parent = bomb;
    fuse.position.set(0.18, 0.34, 0);
    fuse.rotation.z = -0.35;
    fuse.material = this.fuseMat;
    return bomb;
  }

  private outline(mesh: Mesh): void {
    mesh.renderOutline = true;
    mesh.outlineWidth = 0.028;
    mesh.outlineColor = new Color3(0.03, 0.035, 0.045);
  }

  private material(name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.03, 0.03, 0.03);
    material.roughness = 0.9;
    return material;
  }
}
