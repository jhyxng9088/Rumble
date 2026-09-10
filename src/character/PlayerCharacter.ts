import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
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
    this.createContactShadow(scene);
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
    this.walkTime += deltaSeconds * (moving ? 10.5 : 3.2);

    const targetBob = moving ? Math.abs(Math.sin(this.walkTime)) * 0.075 : 0;
    const idleBob = moving ? 0 : Math.sin(this.walkTime) * 0.012;
    this.visualRoot.position.y += (targetBob + idleBob - this.visualRoot.position.y) * Math.min(deltaSeconds * 15, 1);

    const squash = moving ? 1 + Math.sin(this.walkTime * 2) * 0.026 : 1;
    this.visualRoot.scaling.set(1 / squash, squash, 1 / squash);

    const targetLean = moving ? 0.055 : 0;
    const targetSway = moving ? Math.sin(this.walkTime) * 0.035 : 0;
    this.visualRoot.rotation.x += (targetLean - this.visualRoot.rotation.x) * Math.min(deltaSeconds * 9, 1);
    this.visualRoot.rotation.z += (targetSway - this.visualRoot.rotation.z) * Math.min(deltaSeconds * 10, 1);
  }

  private buildVisual(scene: Scene): void {
    const fur = this.material(scene, 'bear-fur-mat', new Color3(0.96, 0.92, 0.84));
    const muzzle = this.material(scene, 'bear-muzzle-mat', new Color3(0.84, 0.76, 0.64));
    const hoodie = this.material(scene, 'bear-hoodie-mat', new Color3(0.12, 0.36, 0.78));
    const hoodieLight = this.material(scene, 'bear-hoodie-light-mat', new Color3(0.20, 0.49, 0.94));
    const hoodieDark = this.material(scene, 'bear-hoodie-dark-mat', new Color3(0.065, 0.19, 0.46));
    const face = this.material(scene, 'bear-face-mat', new Color3(0.06, 0.052, 0.055));

    const body = CreateSphere('bear-body', { diameter: 1.16, segments: 16 }, scene);
    body.parent = this.visualRoot;
    body.position.y = 0.78;
    body.scaling.set(0.94, 1.06, 0.80);
    body.material = hoodie;

    this.createSpherePart(scene, 'bear-hoodie-belly', new Vector3(0, 0.76, 0.43), new Vector3(0.72, 0.76, 0.28), hoodieDark);
    this.createSpherePart(scene, 'bear-hoodie-hem', new Vector3(0, 0.46, 0.02), new Vector3(0.92, 0.28, 0.76), hoodie);

    const head = CreateSphere('bear-head', { diameter: 1.34, segments: 18 }, scene);
    head.parent = this.visualRoot;
    head.position.y = 1.55;
    head.scaling.set(1.04, 0.96, 0.99);
    head.material = fur;

    this.createSpherePart(scene, 'bear-ear-left', new Vector3(-0.45, 1.98, -0.01), new Vector3(0.43, 0.43, 0.34), fur);
    this.createSpherePart(scene, 'bear-ear-right', new Vector3(0.45, 1.98, -0.01), new Vector3(0.43, 0.43, 0.34), fur);
    this.createSpherePart(scene, 'bear-ear-inner-left', new Vector3(-0.45, 1.99, 0.12), new Vector3(0.22, 0.22, 0.09), muzzle);
    this.createSpherePart(scene, 'bear-ear-inner-right', new Vector3(0.45, 1.99, 0.12), new Vector3(0.22, 0.22, 0.09), muzzle);

    this.createSpherePart(scene, 'bear-hood', new Vector3(0, 1.36, -0.36), new Vector3(1.12, 0.76, 0.52), hoodie);
    this.createSpherePart(scene, 'bear-hood-rim', new Vector3(0, 1.43, -0.28), new Vector3(0.94, 0.58, 0.36), hoodieLight);

    this.createSpherePart(scene, 'bear-snout', new Vector3(0, 1.46, 0.59), new Vector3(0.62, 0.43, 0.28), muzzle);
    this.createSpherePart(scene, 'bear-eye-left', new Vector3(-0.22, 1.70, 0.61), new Vector3(0.105, 0.14, 0.065), face);
    this.createSpherePart(scene, 'bear-eye-right', new Vector3(0.22, 1.70, 0.61), new Vector3(0.105, 0.14, 0.065), face);
    this.createSpherePart(scene, 'bear-nose', new Vector3(0, 1.52, 0.79), new Vector3(0.17, 0.12, 0.09), face);

    const leftArm = this.createLimb(scene, 'bear-arm-left', new Vector3(-0.56, 0.92, 0.02), hoodieLight, 0.28, 0.58, 0.28);
    const rightArm = this.createLimb(scene, 'bear-arm-right', new Vector3(0.56, 0.92, 0.02), hoodieLight, 0.28, 0.58, 0.28);
    leftArm.rotation.z = -0.12;
    rightArm.rotation.z = 0.12;

    this.createSpherePart(scene, 'bear-hand-left', new Vector3(-0.61, 0.65, 0.08), new Vector3(0.34, 0.34, 0.34), fur);
    this.createSpherePart(scene, 'bear-hand-right', new Vector3(0.61, 0.65, 0.08), new Vector3(0.34, 0.34, 0.34), fur);

    this.createLimb(scene, 'bear-leg-left', new Vector3(-0.26, 0.22, 0.02), fur, 0.32, 0.38, 0.36);
    this.createLimb(scene, 'bear-leg-right', new Vector3(0.26, 0.22, 0.02), fur, 0.32, 0.38, 0.36);
    this.createSpherePart(scene, 'bear-tail', new Vector3(0, 0.72, -0.54), new Vector3(0.30, 0.30, 0.25), fur);
  }

  private createContactShadow(scene: Scene): void {
    const shadowMaterial = new StandardMaterial('bear-shadow-mat', scene);
    shadowMaterial.diffuseColor = new Color3(0.035, 0.045, 0.06);
    shadowMaterial.specularColor = Color3.Black();
    shadowMaterial.alpha = 0.23;
    shadowMaterial.disableLighting = true;

    const shadow = CreateCylinder('bear-contact-shadow', {
      height: 0.012,
      diameter: 1.28,
      tessellation: 24
    }, scene);
    shadow.parent = this.root;
    shadow.position.y = 0.005;
    shadow.scaling.z = 0.72;
    shadow.material = shadowMaterial;
  }

  private createSpherePart(
    scene: Scene,
    name: string,
    position: Vector3,
    size: Vector3,
    material: StandardMaterial
  ): Mesh {
    const part = CreateSphere(name, { diameter: 1, segments: 12 }, scene);
    part.parent = this.visualRoot;
    part.position.copyFrom(position);
    part.scaling.copyFrom(size);
    part.material = material;
    return part;
  }

  private createLimb(
    scene: Scene,
    name: string,
    position: Vector3,
    material: StandardMaterial,
    width: number,
    height: number,
    depth: number
  ): Mesh {
    const radius = Math.min(width, depth) / 2;
    const limb = CreateCapsule(name, {
      height: Math.max(height, radius * 2),
      radius,
      tessellation: 10
    }, scene);
    limb.parent = this.visualRoot;
    limb.position.copyFrom(position);
    limb.scaling.x = width / (radius * 2);
    limb.scaling.z = depth / (radius * 2);
    limb.material = material;
    return limb;
  }

  private material(scene: Scene, name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.045, 0.045, 0.045);
    material.roughness = 0.9;
    return material;
  }
}
