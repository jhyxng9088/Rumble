import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';

export type AnimalState = 'idle' | 'move' | 'dodge' | 'hurt' | 'ko';
export type AnimalKind = 'fox' | 'raccoon';

interface AnimalPalette {
  fur: Color3;
  furLight: Color3;
  furDark: Color3;
  accent: Color3;
}

interface AnimalOptions {
  name: string;
  kind: AnimalKind;
  spawn: Vector3;
  palette: AnimalPalette;
}

const MOVE_SPEED = 4.55;
const TURN_SPEED = 14;

export class AnimalFighter {
  readonly root: Mesh;
  readonly holdAnchor: TransformNode;
  readonly collisionRadius = 0.56;
  readonly maxHealth = 100;
  readonly name: string;
  readonly kind: AnimalKind;
  health = 100;
  state: AnimalState = 'idle';
  stateTime = 0;
  invulnerableTime = 0;

  private readonly visualRoot: TransformNode;
  private readonly bodyRoot: TransformNode;
  private readonly headRoot: TransformNode;
  private readonly knockbackVelocity = Vector3.Zero();
  private readonly movementDelta = Vector3.Zero();
  private yaw = 0;
  private motionTime = Math.random() * 3;
  private currentSpeed = 0;
  private hitFlash = 0;
  private readonly flashMeshes: Mesh[] = [];
  private readonly baseMaterials = new Map<Mesh, StandardMaterial>();
  private readonly hitMaterial: StandardMaterial;

  constructor(private readonly scene: Scene, readonly id: 'player' | 'rival', options: AnimalOptions) {
    this.name = options.name;
    this.kind = options.kind;
    this.root = CreateCapsule(`${id}-animal-collider`, { height: 1.45, radius: this.collisionRadius, tessellation: 8 }, scene);
    this.root.position.copyFrom(options.spawn);
    this.root.isVisible = false;

    this.visualRoot = new TransformNode(`${id}-animal-visual`, scene);
    this.visualRoot.parent = this.root;

    this.bodyRoot = new TransformNode(`${id}-body-root`, scene);
    this.bodyRoot.parent = this.visualRoot;
    this.bodyRoot.position.y = 0.72;

    this.headRoot = new TransformNode(`${id}-head-root`, scene);
    this.headRoot.parent = this.visualRoot;
    this.headRoot.position.set(0, 1.42, 0.28);

    this.holdAnchor = new TransformNode(`${id}-hold-anchor`, scene);
    this.holdAnchor.parent = this.visualRoot;
    this.holdAnchor.position.set(0, 1.18, 0.76);

    this.hitMaterial = this.material(`${id}-animal-hit`, new Color3(1, 0.96, 0.78));
    this.buildVisual(options.palette);
    this.createShadow();
    this.snapFacing(id === 'player' ? 0.45 : -2.65);
  }

  get position(): Vector3 {
    return this.root.position;
  }

  get forward(): Vector3 {
    return new Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  }

  get isAlive(): boolean {
    return this.state !== 'ko';
  }

  update(deltaSeconds: number): void {
    this.stateTime = Math.max(0, this.stateTime - deltaSeconds);
    this.invulnerableTime = Math.max(0, this.invulnerableTime - deltaSeconds);
    this.hitFlash = Math.max(0, this.hitFlash - deltaSeconds);
    this.motionTime += deltaSeconds;

    if (this.state === 'hurt' || this.state === 'ko') {
      this.root.position.addInPlace(this.knockbackVelocity.scale(deltaSeconds));
      this.knockbackVelocity.scaleInPlace(Math.exp(-5.1 * deltaSeconds));
    }

    if (this.stateTime <= 0 && this.state !== 'ko') this.state = 'idle';
    this.animate(deltaSeconds);
    this.updateFlash();
  }

  move(deltaSeconds: number, direction: Vector3, magnitude: number): void {
    if (!this.canAct()) return;
    const desiredSpeed = MOVE_SPEED * magnitude;
    this.currentSpeed += (desiredSpeed - this.currentSpeed) * (1 - Math.exp(-15 * deltaSeconds));
    if (direction.lengthSquared() < 0.001 || magnitude < 0.05) {
      if (this.state === 'move') this.state = 'idle';
      return;
    }
    this.movementDelta.copyFrom(direction.normalizeToNew()).scaleInPlace(this.currentSpeed * deltaSeconds);
    this.root.position.addInPlace(this.movementDelta);
    this.state = 'move';
  }

  faceTarget(target: Vector3, deltaSeconds: number): void {
    if (this.state === 'hurt' || this.state === 'ko' || this.state === 'dodge') return;
    const direction = target.subtract(this.root.position);
    direction.y = 0;
    if (direction.lengthSquared() < 0.01) return;
    const targetYaw = Math.atan2(direction.x, direction.z);
    let delta = targetYaw - this.yaw;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    this.yaw += delta * Math.min(TURN_SPEED * deltaSeconds, 1);
    this.visualRoot.rotation.y = this.yaw;
  }

  startDodge(direction: Vector3): boolean {
    if (!this.canAct()) return false;
    const dodge = direction.lengthSquared() > 0.03 ? direction.normalizeToNew() : this.forward.scale(-1);
    this.root.position.addInPlace(dodge.scale(1.38));
    this.state = 'dodge';
    this.stateTime = 0.24;
    this.invulnerableTime = 0.17;
    this.currentSpeed = 0;
    return true;
  }

  receiveHit(damage: number, knockback: Vector3): boolean {
    if (this.invulnerableTime > 0 || this.state === 'ko') return false;
    this.health = Math.max(0, this.health - damage);
    this.knockbackVelocity.copyFrom(knockback);
    this.hitFlash = 0.11;
    if (this.health <= 0) {
      this.state = 'ko';
      this.stateTime = Number.POSITIVE_INFINITY;
      this.knockbackVelocity.scaleInPlace(1.25);
    } else {
      this.state = 'hurt';
      this.stateTime = 0.27;
    }
    return true;
  }

  private canAct(): boolean {
    return this.state === 'idle' || this.state === 'move';
  }

  private animate(deltaSeconds: number): void {
    const moving = this.state === 'move';
    const hurt = this.state === 'hurt' || this.state === 'ko';
    const dodge = this.state === 'dodge';
    const step = Math.sin(this.motionTime * 10.8);
    const breathing = Math.sin(this.motionTime * 3.3);
    const bobTarget = moving ? Math.abs(step) * 0.075 : breathing * 0.018;
    this.visualRoot.position.y += (bobTarget - this.visualRoot.position.y) * Math.min(16 * deltaSeconds, 1);
    const bodyTilt = hurt ? -0.28 : dodge ? 0.22 : moving ? step * 0.055 : breathing * 0.018;
    this.bodyRoot.rotation.z += (bodyTilt - this.bodyRoot.rotation.z) * Math.min(16 * deltaSeconds, 1);
    const headTilt = hurt ? 0.24 : moving ? -step * 0.04 : -0.04;
    this.headRoot.rotation.x += (headTilt - this.headRoot.rotation.x) * Math.min(14 * deltaSeconds, 1);
    const targetScaleY = hurt ? 0.90 : moving ? 1 + Math.abs(step) * 0.035 : 1;
    this.visualRoot.scaling.y += (targetScaleY - this.visualRoot.scaling.y) * Math.min(18 * deltaSeconds, 1);
    this.visualRoot.scaling.x += ((hurt ? 1.07 : 1) - this.visualRoot.scaling.x) * Math.min(18 * deltaSeconds, 1);
    this.visualRoot.scaling.z = this.visualRoot.scaling.x;
  }

  private buildVisual(palette: AnimalPalette): void {
    const fur = this.material(`${this.id}-fur`, palette.fur);
    const light = this.material(`${this.id}-fur-light`, palette.furLight);
    const dark = this.material(`${this.id}-fur-dark`, palette.furDark);
    const accent = this.material(`${this.id}-accent`, palette.accent);
    const eye = this.material(`${this.id}-eye`, new Color3(0.03, 0.035, 0.045));

    this.partSphere('body', this.bodyRoot, new Vector3(0, 0, 0), new Vector3(0.72, 0.62, 0.82), fur);
    this.partSphere('belly', this.bodyRoot, new Vector3(0, -0.02, 0.56), new Vector3(0.49, 0.45, 0.22), light);
    this.partSphere('head', this.headRoot, new Vector3(0, 0, 0), new Vector3(0.63, 0.60, 0.60), fur);
    this.partSphere('muzzle', this.headRoot, new Vector3(0, -0.08, 0.52), new Vector3(0.38, 0.28, 0.25), light);
    this.partSphere('nose', this.headRoot, new Vector3(0, -0.04, 0.72), new Vector3(0.13, 0.10, 0.10), dark);
    this.partSphere('eye-l', this.headRoot, new Vector3(-0.19, 0.13, 0.54), new Vector3(0.075, 0.09, 0.045), eye);
    this.partSphere('eye-r', this.headRoot, new Vector3(0.19, 0.13, 0.54), new Vector3(0.075, 0.09, 0.045), eye);

    const earLeft = this.partSphere('ear-l', this.headRoot, new Vector3(-0.38, 0.48, 0.02), new Vector3(0.25, 0.36, 0.18), fur);
    const earRight = this.partSphere('ear-r', this.headRoot, new Vector3(0.38, 0.48, 0.02), new Vector3(0.25, 0.36, 0.18), fur);
    earLeft.rotation.z = -0.28;
    earRight.rotation.z = 0.28;

    if (this.kind === 'raccoon') {
      this.partSphere('mask-l', this.headRoot, new Vector3(-0.18, 0.12, 0.57), new Vector3(0.20, 0.15, 0.06), dark);
      this.partSphere('mask-r', this.headRoot, new Vector3(0.18, 0.12, 0.57), new Vector3(0.20, 0.15, 0.06), dark);
    } else {
      const cheekLeft = this.partSphere('cheek-l', this.headRoot, new Vector3(-0.31, -0.11, 0.45), new Vector3(0.26, 0.23, 0.17), light);
      const cheekRight = this.partSphere('cheek-r', this.headRoot, new Vector3(0.31, -0.11, 0.45), new Vector3(0.26, 0.23, 0.17), light);
      cheekLeft.rotation.z = 0.18;
      cheekRight.rotation.z = -0.18;
    }

    this.partCapsule('paw-fl', this.visualRoot, new Vector3(-0.38, 0.44, 0.40), 0.15, 0.46, dark);
    this.partCapsule('paw-fr', this.visualRoot, new Vector3(0.38, 0.44, 0.40), 0.15, 0.46, dark);
    this.partCapsule('paw-bl', this.visualRoot, new Vector3(-0.34, 0.36, -0.32), 0.16, 0.42, dark);
    this.partCapsule('paw-br', this.visualRoot, new Vector3(0.34, 0.36, -0.32), 0.16, 0.42, dark);

    const tail = this.partCapsule('tail', this.visualRoot, new Vector3(0, 0.72, -0.75), 0.20, this.kind === 'fox' ? 1.18 : 0.94, fur);
    tail.rotation.x = Math.PI / 2 - 0.28;
    if (this.kind === 'raccoon') {
      const stripe = this.partSphere('tail-stripe', this.visualRoot, new Vector3(0, 0.73, -1.03), new Vector3(0.23, 0.18, 0.27), dark);
      stripe.rotation.x = 0.25;
    } else {
      this.partSphere('tail-tip', this.visualRoot, new Vector3(0, 0.88, -1.20), new Vector3(0.24, 0.22, 0.34), light);
    }

    const collar = this.partSphere('collar', this.visualRoot, new Vector3(0, 1.03, 0.12), new Vector3(0.48, 0.14, 0.47), accent);
    collar.scaling.y *= 0.72;
  }

  private createShadow(): void {
    const shadowMat = this.material(`${this.id}-shadow`, new Color3(0.02, 0.025, 0.035));
    shadowMat.alpha = 0.23;
    shadowMat.disableLighting = true;
    const shadow = CreateSphere(`${this.id}-shadow`, { diameter: 1, segments: 12 }, this.scene);
    shadow.parent = this.root;
    shadow.position.y = 0.018;
    shadow.scaling.set(0.86, 0.018, 0.62);
    shadow.material = shadowMat;
  }

  private partSphere(name: string, parent: TransformNode, position: Vector3, scale: Vector3, material: StandardMaterial): Mesh {
    const mesh = CreateSphere(`${this.id}-${name}`, { diameter: 1, segments: 12 }, this.scene);
    mesh.parent = parent;
    mesh.position.copyFrom(position);
    mesh.scaling.copyFrom(scale);
    mesh.material = material;
    this.style(mesh, material);
    return mesh;
  }

  private partCapsule(name: string, parent: TransformNode, position: Vector3, radius: number, height: number, material: StandardMaterial): Mesh {
    const mesh = CreateCapsule(`${this.id}-${name}`, { radius, height, tessellation: 10 }, this.scene);
    mesh.parent = parent;
    mesh.position.copyFrom(position);
    mesh.material = material;
    this.style(mesh, material);
    return mesh;
  }

  private style(mesh: Mesh, material: StandardMaterial): void {
    mesh.renderOutline = true;
    mesh.outlineWidth = 0.025;
    mesh.outlineColor = new Color3(0.035, 0.04, 0.05);
    this.flashMeshes.push(mesh);
    this.baseMaterials.set(mesh, material);
  }

  private material(name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.emissiveColor = color.scale(0.035);
    material.specularColor = new Color3(0.025, 0.025, 0.03);
    material.roughness = 0.94;
    return material;
  }

  private updateFlash(): void {
    for (const mesh of this.flashMeshes) {
      mesh.material = this.hitFlash > 0 ? this.hitMaterial : this.baseMaterials.get(mesh) ?? null;
    }
  }

  private snapFacing(yaw: number): void {
    this.yaw = yaw;
    this.visualRoot.rotation.y = yaw;
  }
}
