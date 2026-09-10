import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';

const MOVE_SPEED = 4.8;
const TURN_SPEED = 15;

export class PlayerCharacter {
  readonly root: Mesh;
  readonly collisionRadius = 0.48;
  private readonly visualRoot: TransformNode;
  private readonly movementDelta = Vector3.Zero();
  private walkTime = 0;
  private currentSpeed = 0;

  constructor(scene: Scene, spawnPoint: Vector3) {
    this.root = CreateCapsule('player-collider', {
      height: 1.55,
      radius: this.collisionRadius,
      tessellation: 8
    }, scene);
    this.root.position.copyFrom(spawnPoint);
    this.root.isVisible = false;

    this.visualRoot = new TransformNode('player-visual', scene);
    this.visualRoot.parent = this.root;
    this.buildVisual(scene);
  }

  update(deltaSeconds: number, worldDirection: Vector3, inputMagnitude: number): void {
    const desiredSpeed = MOVE_SPEED * inputMagnitude;
    const response = 1 - Math.exp(-14 * deltaSeconds);
    this.currentSpeed += (desiredSpeed - this.currentSpeed) * response;

    if (worldDirection.lengthSquared() > 0.0001) {
      const normalized = worldDirection.normalizeToNew();
      this.movementDelta.copyFrom(normalized).scaleInPlace(this.currentSpeed * deltaSeconds);
      this.root.position.addInPlace(this.movementDelta);
      this.faceDirection(normalized, deltaSeconds);
    }

    this.animateWalk(deltaSeconds, inputMagnitude);
  }

  private faceDirection(direction: Vector3, deltaSeconds: number): void {
    const targetYaw = Math.atan2(direction.x, direction.z);
    const currentYaw = this.visualRoot.rotation.y;
    let difference = targetYaw - currentYaw;
    difference = Math.atan2(Math.sin(difference), Math.cos(difference));
    this.visualRoot.rotation.y += difference * Math.min(TURN_SPEED * deltaSeconds, 1);
  }

  private animateWalk(deltaSeconds: number, inputMagnitude: number): void {
    const moving = inputMagnitude > 0.05;
    this.walkTime += deltaSeconds * (moving ? 10 : 3.5);

    const targetBob = moving ? Math.abs(Math.sin(this.walkTime)) * 0.07 : 0;
    const idleBob = moving ? 0 : Math.sin(this.walkTime) * 0.014;
    this.visualRoot.position.y += (targetBob + idleBob - this.visualRoot.position.y) * Math.min(deltaSeconds * 15, 1);

    const squash = moving ? 1 + Math.sin(this.walkTime * 2) * 0.024 : 1;
    this.visualRoot.scaling.set(1 / squash, squash, 1 / squash);
  }

  private buildVisual(scene: Scene): void {
    const fur = this.material(scene, 'bear-fur-mat', new Color3(0.94, 0.90, 0.82));
    const muzzle = this.material(scene, 'bear-muzzle-mat', new Color3(0.82, 0.74, 0.62));
    const hoodie = this.material(scene, 'bear-hoodie-mat', new Color3(0.15, 0.42, 0.88));
    const hoodieDark = this.material(scene, 'bear-hoodie-dark-mat', new Color3(0.08, 0.23, 0.58));
    const face = this.material(scene, 'bear-face-mat', new Color3(0.075, 0.065, 0.07));

    const body = CreateSphere('bear-body', { diameter: 1.25, segments: 14 }, scene);
    body.parent = this.visualRoot;
    body.position.y = 0.82;
    body.scaling.set(0.92, 1.08, 0.78);
    body.material = hoodie;

    const belly = CreateSphere('bear-belly', { diameter: 0.86, segments: 12 }, scene);
    belly.parent = this.visualRoot;
    belly.position.set(0, 0.82, 0.43);
    belly.scaling.set(0.74, 0.84, 0.30);
    belly.material = hoodieDark;

    const head = CreateSphere('bear-head', { diameter: 1.18, segments: 16 }, scene);
    head.parent = this.visualRoot;
    head.position.y = 1.62;
    head.scaling.set(1.04, 0.96, 0.98);
    head.material = fur;

    this.createSpherePart(scene, 'bear-ear-left', new Vector3(-0.42, 2.02, -0.02), new Vector3(0.42, 0.42, 0.32), fur);
    this.createSpherePart(scene, 'bear-ear-right', new Vector3(0.42, 2.02, -0.02), new Vector3(0.42, 0.42, 0.32), fur);
    this.createSpherePart(scene, 'bear-ear-inner-left', new Vector3(-0.42, 2.03, 0.105), new Vector3(0.22, 0.22, 0.10), muzzle);
    this.createSpherePart(scene, 'bear-ear-inner-right', new Vector3(0.42, 2.03, 0.105), new Vector3(0.22, 0.22, 0.10), muzzle);

    const hood = CreateSphere('bear-hood', { diameter: 1.12, segments: 14 }, scene);
    hood.parent = this.visualRoot;
    hood.position.set(0, 1.42, -0.30);
    hood.scaling.set(1.05, 0.72, 0.45);
    hood.material = hoodie;

    const snout = CreateSphere('bear-snout', { diameter: 0.58, segments: 12 }, scene);
    snout.parent = this.visualRoot;
    snout.position.set(0, 1.52, 0.50);
    snout.scaling.set(1.0, 0.70, 0.42);
    snout.material = muzzle;

    this.createSpherePart(scene, 'bear-eye-left', new Vector3(-0.20, 1.73, 0.52), new Vector3(0.105, 0.14, 0.07), face);
    this.createSpherePart(scene, 'bear-eye-right', new Vector3(0.20, 1.73, 0.52), new Vector3(0.105, 0.14, 0.07), face);
    this.createSpherePart(scene, 'bear-nose', new Vector3(0, 1.58, 0.69), new Vector3(0.17, 0.12, 0.10), face);

    this.createLimb(scene, 'bear-arm-left', new Vector3(-0.58, 0.94, 0.02), hoodie, 0.26, 0.62, 0.26);
    this.createLimb(scene, 'bear-arm-right', new Vector3(0.58, 0.94, 0.02), hoodie, 0.26, 0.62, 0.26);
    this.createSpherePart(scene, 'bear-hand-left', new Vector3(-0.60, 0.66, 0.08), new Vector3(0.32, 0.32, 0.32), fur);
    this.createSpherePart(scene, 'bear-hand-right', new Vector3(0.60, 0.66, 0.08), new Vector3(0.32, 0.32, 0.32), fur);

    this.createLimb(scene, 'bear-leg-left', new Vector3(-0.27, 0.26, 0.02), fur, 0.30, 0.46, 0.34);
    this.createLimb(scene, 'bear-leg-right', new Vector3(0.27, 0.26, 0.02), fur, 0.30, 0.46, 0.34);
  }

  private createSpherePart(
    scene: Scene,
    name: string,
    position: Vector3,
    size: Vector3,
    material: StandardMaterial
  ): void {
    const part = CreateSphere(name, { diameter: 1, segments: 10 }, scene);
    part.parent = this.visualRoot;
    part.position.copyFrom(position);
    part.scaling.copyFrom(size);
    part.material = material;
  }

  private createLimb(
    scene: Scene,
    name: string,
    position: Vector3,
    material: StandardMaterial,
    width: number,
    height: number,
    depth: number
  ): void {
    const radius = Math.min(width, depth) / 2;
    const limb = CreateCapsule(name, {
      height: Math.max(height, radius * 2),
      radius,
      tessellation: 8
    }, scene);
    limb.parent = this.visualRoot;
    limb.position.copyFrom(position);
    limb.scaling.x = width / (radius * 2);
    limb.scaling.z = depth / (radius * 2);
    limb.material = material;
  }

  private material(scene: Scene, name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.08, 0.08, 0.08);
    material.roughness = 0.86;
    return material;
  }
}
