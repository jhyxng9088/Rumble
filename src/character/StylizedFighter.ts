import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';

export type AttackKind = 'light' | 'heavy';
export type FighterState = 'idle' | 'move' | 'attack' | 'dodge' | 'hurt' | 'ko';

interface FighterPalette {
  skin: Color3;
  top: Color3;
  topDark: Color3;
  pants: Color3;
  glove: Color3;
  shoe: Color3;
}

interface FighterOptions {
  name: string;
  spawn: Vector3;
  palette: FighterPalette;
}

const MOVE_SPEED = 4.65;
const TURN_SPEED = 14;

export class StylizedFighter {
  readonly root: Mesh;
  readonly collisionRadius = 0.48;
  readonly maxHealth = 100;

  health = 100;
  rage = 0;
  state: FighterState = 'idle';
  stateTime = 0;
  attackKind: AttackKind | null = null;
  attackSerial = 0;
  invulnerableTime = 0;

  private readonly visualRoot: TransformNode;
  private readonly chest: TransformNode;
  private readonly headPivot: TransformNode;
  private readonly leftArm: TransformNode;
  private readonly rightArm: TransformNode;
  private readonly leftForearm: TransformNode;
  private readonly rightForearm: TransformNode;
  private readonly leftLeg: TransformNode;
  private readonly rightLeg: TransformNode;
  private readonly movementDelta = Vector3.Zero();
  private readonly knockbackVelocity = Vector3.Zero();
  private readonly originalMaterials = new Map<Mesh, StandardMaterial>();
  private readonly hitMaterial: StandardMaterial;

  private yaw = 0;
  private motionTime = Math.random() * 4;
  private currentSpeed = 0;
  private hitFlash = 0;

  constructor(
    private readonly scene: Scene,
    readonly id: 'player' | 'rival',
    options: FighterOptions,
  ) {
    this.root = CreateCapsule(`${id}-collider`, {
      height: 1.72,
      radius: this.collisionRadius,
      tessellation: 8,
    }, scene);
    this.root.position.copyFrom(options.spawn);
    this.root.isVisible = false;

    this.visualRoot = new TransformNode(`${id}-visual`, scene);
    this.visualRoot.parent = this.root;

    this.chest = new TransformNode(`${id}-chest`, scene);
    this.chest.parent = this.visualRoot;
    this.chest.position.y = 1.06;

    this.headPivot = new TransformNode(`${id}-head`, scene);
    this.headPivot.parent = this.chest;
    this.headPivot.position.y = 0.76;

    this.leftArm = new TransformNode(`${id}-left-arm`, scene);
    this.rightArm = new TransformNode(`${id}-right-arm`, scene);
    this.leftArm.parent = this.chest;
    this.rightArm.parent = this.chest;
    this.leftArm.position.set(-0.48, 0.34, 0.05);
    this.rightArm.position.set(0.48, 0.34, 0.05);

    this.leftForearm = new TransformNode(`${id}-left-forearm`, scene);
    this.rightForearm = new TransformNode(`${id}-right-forearm`, scene);
    this.leftForearm.parent = this.leftArm;
    this.rightForearm.parent = this.rightArm;
    this.leftForearm.position.set(0, -0.40, 0.09);
    this.rightForearm.position.set(0, -0.40, 0.09);

    this.leftLeg = new TransformNode(`${id}-left-leg`, scene);
    this.rightLeg = new TransformNode(`${id}-right-leg`, scene);
    this.leftLeg.parent = this.visualRoot;
    this.rightLeg.parent = this.visualRoot;
    this.leftLeg.position.set(-0.23, 0.56, 0);
    this.rightLeg.position.set(0.23, 0.56, 0);

    this.hitMaterial = this.material(`${id}-hit`, new Color3(1, 0.96, 0.82));
    this.buildVisual(options.palette);
    this.createContactShadow();
    this.snapFacing(id === 'player' ? 0.35 : -2.7);
  }

  get position(): Vector3 {
    return this.root.position;
  }

  get forward(): Vector3 {
    return new Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  }

  update(deltaSeconds: number): void {
    this.stateTime = Math.max(0, this.stateTime - deltaSeconds);
    this.invulnerableTime = Math.max(0, this.invulnerableTime - deltaSeconds);
    this.hitFlash = Math.max(0, this.hitFlash - deltaSeconds);
    this.motionTime += deltaSeconds;

    if (this.state === 'hurt' || this.state === 'ko') {
      this.root.position.addInPlace(this.knockbackVelocity.scale(deltaSeconds));
      this.knockbackVelocity.scaleInPlace(Math.exp(-5.5 * deltaSeconds));
    }

    if (this.stateTime <= 0 && this.state !== 'ko') {
      this.state = 'idle';
      this.attackKind = null;
    }

    this.animatePose(deltaSeconds);
    this.updateFlash();
  }

  move(deltaSeconds: number, worldDirection: Vector3, magnitude: number): void {
    if (!this.canMove()) return;

    const desiredSpeed = MOVE_SPEED * magnitude;
    const response = 1 - Math.exp(-15 * deltaSeconds);
    this.currentSpeed += (desiredSpeed - this.currentSpeed) * response;

    if (worldDirection.lengthSquared() > 0.0001 && magnitude > 0.05) {
      const direction = worldDirection.normalizeToNew();
      this.movementDelta.copyFrom(direction).scaleInPlace(this.currentSpeed * deltaSeconds);
      this.root.position.addInPlace(this.movementDelta);
      this.turnToward(direction, deltaSeconds);
      this.state = 'move';
      return;
    }

    if (this.state === 'move') this.state = 'idle';
  }

  faceTarget(target: Vector3, deltaSeconds: number): void {
    if (this.state === 'attack' || this.state === 'hurt' || this.state === 'ko') return;
    const direction = target.subtract(this.root.position);
    direction.y = 0;
    if (direction.lengthSquared() > 0.01) this.turnToward(direction.normalize(), deltaSeconds);
  }

  startAttack(kind: AttackKind): boolean {
    if (!this.canAct()) return false;
    this.state = 'attack';
    this.attackKind = kind;
    this.attackSerial += 1;
    this.stateTime = kind === 'light' ? 0.31 : 0.56;
    this.currentSpeed *= 0.2;
    return true;
  }

  startDodge(direction: Vector3): boolean {
    if (!this.canAct()) return false;
    const dodgeDirection = direction.lengthSquared() > 0.03
      ? direction.normalizeToNew()
      : this.forward.scale(-1);
    this.root.position.addInPlace(dodgeDirection.scale(1.34));
    this.state = 'dodge';
    this.stateTime = 0.26;
    this.invulnerableTime = 0.18;
    this.currentSpeed = 0;
    return true;
  }

  receiveHit(damage: number, knockback: Vector3, hitStun: number): boolean {
    if (this.invulnerableTime > 0 || this.state === 'ko') return false;

    this.health = Math.max(0, this.health - damage);
    this.rage = Math.min(100, this.rage + damage * 0.75);
    this.knockbackVelocity.copyFrom(knockback);
    this.hitFlash = 0.105;

    if (this.health <= 0) {
      this.state = 'ko';
      this.stateTime = Number.POSITIVE_INFINITY;
      this.knockbackVelocity.scaleInPlace(1.25);
    } else {
      this.state = 'hurt';
      this.stateTime = hitStun;
    }
    return true;
  }

  isAttackActive(): boolean {
    if (this.state !== 'attack' || !this.attackKind) return false;
    const total = this.attackKind === 'light' ? 0.31 : 0.56;
    const elapsed = total - this.stateTime;
    return this.attackKind === 'light'
      ? elapsed >= 0.105 && elapsed <= 0.175
      : elapsed >= 0.245 && elapsed <= 0.345;
  }

  private canMove(): boolean {
    return this.state !== 'attack'
      && this.state !== 'dodge'
      && this.state !== 'hurt'
      && this.state !== 'ko';
  }

  private canAct(): boolean {
    return this.state === 'idle' || this.state === 'move';
  }

  private turnToward(direction: Vector3, deltaSeconds: number): void {
    const targetYaw = Math.atan2(direction.x, direction.z);
    let difference = targetYaw - this.yaw;
    difference = Math.atan2(Math.sin(difference), Math.cos(difference));
    this.yaw += difference * Math.min(TURN_SPEED * deltaSeconds, 1);
    this.visualRoot.rotation.y = this.yaw;
  }

  private snapFacing(yaw: number): void {
    this.yaw = yaw;
    this.visualRoot.rotation.y = yaw;
  }

  private animatePose(deltaSeconds: number): void {
    const breathing = Math.sin(this.motionTime * 3.1);
    const moving = this.state === 'move';
    const step = Math.sin(this.motionTime * 10.5);
    const attack = this.attackProgress();
    const heavy = this.attackKind === 'heavy';
    const hurt = this.state === 'hurt' || this.state === 'ko';
    const dodge = this.state === 'dodge';

    const targetY = moving ? Math.abs(step) * 0.055 : breathing * 0.018;
    this.visualRoot.position.y += (targetY - this.visualRoot.position.y) * Math.min(16 * deltaSeconds, 1);

    const targetChestX = hurt
      ? -0.32
      : dodge
        ? 0.20
        : heavy
          ? -0.13 * Math.sin(attack * Math.PI)
          : 0.03 + breathing * 0.014;
    const targetChestZ = moving ? step * 0.035 : hurt ? 0.12 : 0;
    this.chest.rotation.x += (targetChestX - this.chest.rotation.x) * Math.min(18 * deltaSeconds, 1);
    this.chest.rotation.z += (targetChestZ - this.chest.rotation.z) * Math.min(18 * deltaSeconds, 1);

    const guard = 0.82;
    const frontShoulder = heavy ? attack * 1.65 : attack * 1.18;
    const rearShoulder = heavy ? attack * 0.72 : attack * 0.18;
    const swing = moving ? step * 0.26 : 0;

    this.rightArm.rotation.x = this.lerp(
      this.rightArm.rotation.x,
      -guard + frontShoulder + swing * 0.25,
      deltaSeconds * 20,
    );
    this.leftArm.rotation.x = this.lerp(
      this.leftArm.rotation.x,
      -guard + rearShoulder - swing * 0.25,
      deltaSeconds * 20,
    );
    this.rightArm.rotation.z = this.lerp(this.rightArm.rotation.z, -0.28 - attack * 0.22, deltaSeconds * 18);
    this.leftArm.rotation.z = this.lerp(this.leftArm.rotation.z, 0.28 + attack * 0.12, deltaSeconds * 18);
    this.rightForearm.rotation.x = this.lerp(this.rightForearm.rotation.x, -1.18 + attack * 1.20, deltaSeconds * 22);
    this.leftForearm.rotation.x = this.lerp(this.leftForearm.rotation.x, -1.08 + attack * 0.35, deltaSeconds * 22);

    this.leftLeg.rotation.x = this.lerp(this.leftLeg.rotation.x, moving ? step * 0.42 : -0.06, deltaSeconds * 18);
    this.rightLeg.rotation.x = this.lerp(this.rightLeg.rotation.x, moving ? -step * 0.42 : 0.08, deltaSeconds * 18);
    this.headPivot.rotation.x = this.lerp(
      this.headPivot.rotation.x,
      hurt ? 0.22 : -0.04 + breathing * 0.012,
      deltaSeconds * 15,
    );
    this.visualRoot.rotation.z = this.lerp(this.visualRoot.rotation.z, hurt ? -0.24 : 0, deltaSeconds * (hurt ? 22 : 14));
  }

  private attackProgress(): number {
    if (this.state !== 'attack' || !this.attackKind) return 0;
    const total = this.attackKind === 'light' ? 0.31 : 0.56;
    const elapsed = total - this.stateTime;
    const peak = this.attackKind === 'light' ? 0.15 : 0.31;
    return elapsed <= peak
      ? Math.min(1, elapsed / peak)
      : Math.max(0, 1 - (elapsed - peak) / (total - peak));
  }

  private buildVisual(palette: FighterPalette): void {
    const skin = this.material(`${this.id}-skin`, palette.skin);
    const top = this.material(`${this.id}-top`, palette.top);
    const topDark = this.material(`${this.id}-top-dark`, palette.topDark);
    const pants = this.material(`${this.id}-pants`, palette.pants);
    const glove = this.material(`${this.id}-glove`, palette.glove);
    const shoe = this.material(`${this.id}-shoe`, palette.shoe);
    const eyes = this.material(`${this.id}-eyes`, new Color3(0.035, 0.04, 0.055));

    const hips = this.partBox('hips', this.visualRoot, new Vector3(0, 0.72, 0), new Vector3(0.72, 0.42, 0.48), pants);
    hips.rotation.x = -0.05;

    const torso = this.partBox('torso', this.chest, new Vector3(0, 0.02, 0), new Vector3(0.88, 0.86, 0.54), top);
    torso.scaling.z = 0.93;
    const chestBand = this.partBox('chest-band', this.chest, new Vector3(0, 0.03, 0.29), new Vector3(0.72, 0.20, 0.045), topDark);
    chestBand.rotation.x = 0.04;

    const neck = this.partCapsule('neck', this.chest, new Vector3(0, 0.56, 0), 0.18, 0.34, skin);
    neck.scaling.z = 0.92;

    this.partSphere('head', this.headPivot, new Vector3(0, 0.16, 0), new Vector3(0.52, 0.58, 0.50), skin);
    const hair = this.partSphere('hair', this.headPivot, new Vector3(0, 0.34, -0.015), new Vector3(0.53, 0.25, 0.50), topDark);
    hair.scaling.z = 0.93;
    this.partSphere('nose', this.headPivot, new Vector3(0, 0.12, 0.48), new Vector3(0.11, 0.09, 0.12), skin);
    this.partSphere('eye-left', this.headPivot, new Vector3(-0.15, 0.23, 0.45), new Vector3(0.055, 0.07, 0.035), eyes);
    this.partSphere('eye-right', this.headPivot, new Vector3(0.15, 0.23, 0.45), new Vector3(0.055, 0.07, 0.035), eyes);

    this.buildArm(this.leftArm, this.leftForearm, 'left', top, skin, glove);
    this.buildArm(this.rightArm, this.rightForearm, 'right', top, skin, glove);
    this.buildLeg(this.leftLeg, 'left', pants, shoe);
    this.buildLeg(this.rightLeg, 'right', pants, shoe);
  }

  private buildArm(
    upper: TransformNode,
    lower: TransformNode,
    side: string,
    sleeve: StandardMaterial,
    skin: StandardMaterial,
    glove: StandardMaterial,
  ): void {
    this.partCapsule(`${side}-upper-arm`, upper, new Vector3(0, -0.22, 0), 0.15, 0.52, sleeve);
    this.partCapsule(`${side}-forearm`, lower, new Vector3(0, -0.20, 0), 0.145, 0.46, skin);
    this.partSphere(`${side}-glove`, lower, new Vector3(0, -0.47, 0.075), new Vector3(0.27, 0.24, 0.31), glove);
    this.partBox(`${side}-glove-cuff`, lower, new Vector3(0, -0.35, 0.025), new Vector3(0.28, 0.18, 0.27), glove);
  }

  private buildLeg(
    pivot: TransformNode,
    side: string,
    pants: StandardMaterial,
    shoe: StandardMaterial,
  ): void {
    this.partCapsule(`${side}-leg`, pivot, new Vector3(0, -0.28, 0), 0.17, 0.66, pants);
    const foot = this.partBox(`${side}-shoe`, pivot, new Vector3(0, -0.62, 0.11), new Vector3(0.34, 0.20, 0.54), shoe);
    foot.rotation.x = 0.03;
  }

  private createContactShadow(): void {
    const material = this.material(`${this.id}-shadow`, new Color3(0.02, 0.025, 0.04));
    material.alpha = 0.25;
    material.disableLighting = true;
    const mesh = CreateSphere(`${this.id}-contact-shadow`, { diameter: 1, segments: 16 }, this.scene);
    mesh.parent = this.root;
    mesh.position.y = 0.018;
    mesh.scaling.set(0.78, 0.018, 0.52);
    mesh.material = material;
  }

  private partSphere(
    name: string,
    parent: TransformNode,
    position: Vector3,
    scale: Vector3,
    material: StandardMaterial,
  ): Mesh {
    const mesh = CreateSphere(`${this.id}-${name}`, { diameter: 1, segments: 16 }, this.scene);
    mesh.parent = parent;
    mesh.position.copyFrom(position);
    mesh.scaling.copyFrom(scale);
    this.finishPart(mesh, material);
    return mesh;
  }

  private partCapsule(
    name: string,
    parent: TransformNode,
    position: Vector3,
    radius: number,
    height: number,
    material: StandardMaterial,
  ): Mesh {
    const mesh = CreateCapsule(`${this.id}-${name}`, { radius, height, tessellation: 12 }, this.scene);
    mesh.parent = parent;
    mesh.position.copyFrom(position);
    this.finishPart(mesh, material);
    return mesh;
  }

  private partBox(
    name: string,
    parent: TransformNode,
    position: Vector3,
    size: Vector3,
    material: StandardMaterial,
  ): Mesh {
    const mesh = CreateBox(`${this.id}-${name}`, {
      width: size.x,
      height: size.y,
      depth: size.z,
    }, this.scene);
    mesh.parent = parent;
    mesh.position.copyFrom(position);
    this.finishPart(mesh, material);
    return mesh;
  }

  private finishPart(mesh: Mesh, material: StandardMaterial): void {
    mesh.material = material;
    mesh.renderOutline = true;
    mesh.outlineWidth = 0.025;
    mesh.outlineColor = new Color3(0.035, 0.04, 0.055);
    this.originalMaterials.set(mesh, material);
  }

  private material(name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.025, 0.025, 0.03);
    material.emissiveColor = color.scale(0.045);
    material.roughness = 0.92;
    return material;
  }

  private updateFlash(): void {
    for (const [mesh, material] of this.originalMaterials) {
      mesh.material = this.hitFlash > 0 ? this.hitMaterial : material;
    }
  }

  private lerp(current: number, target: number, alpha: number): number {
    const t = Math.min(Math.max(alpha, 0), 1);
    return current + (target - current) * t;
  }
}
