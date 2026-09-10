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
const VISUAL_SCALE = 1.14;

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
    this.visualRoot.scaling.setAll(VISUAL_SCALE);
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
    this.walkTime += deltaSeconds * (moving ? 10.8 : 3.0);

    const step = Math.sin(this.walkTime);
    const targetBob = moving ? Math.abs(step) * 0.082 : 0;
    const idleBob = moving ? 0 : Math.sin(this.walkTime) * 0.013;
    this.visualRoot.position.y += (targetBob + idleBob - this.visualRoot.position.y) * Math.min(deltaSeconds * 15, 1);

    const squash = moving ? 1 + Math.sin(this.walkTime * 2) * 0.030 : 1;
    this.visualRoot.scaling.set(
      VISUAL_SCALE / squash,
      VISUAL_SCALE * squash,
      VISUAL_SCALE / squash
    );

    const targetLean = moving ? 0.075 : 0;
    const targetSway = moving ? step * 0.050 : 0;
    this.visualRoot.rotation.x += (targetLean - this.visualRoot.rotation.x) * Math.min(deltaSeconds * 9, 1);
    this.visualRoot.rotation.z += (targetSway - this.visualRoot.rotation.z) * Math.min(deltaSeconds * 10, 1);
  }

  private buildVisual(scene: Scene): void {
    const fur = this.material(scene, 'bear-fur-mat', new Color3(0.97, 0.93, 0.86));
    const furShade = this.material(scene, 'bear-fur-shade-mat', new Color3(0.84, 0.77, 0.67));
    const hoodie = this.material(scene, 'bear-hoodie-mat', new Color3(0.10, 0.34, 0.82));
    const hoodieLight = this.material(scene, 'bear-hoodie-light-mat', new Color3(0.22, 0.52, 0.98));
    const hoodieDark = this.material(scene, 'bear-hoodie-dark-mat', new Color3(0.045, 0.16, 0.46));
    const face = this.material(scene, 'bear-face-mat', new Color3(0.055, 0.048, 0.052));

    const body = CreateSphere('bear-body', { diameter: 1.20, segments: 16 }, scene);
    body.parent = this.visualRoot;
    body.position.y = 0.76;
    body.scaling.set(0.97, 1.05, 0.83);
    body.material = hoodie;

    this.createSpherePart(scene, 'bear-hoodie-belly', new Vector3(0, 0.76, 0.45), new Vector3(0.76, 0.78, 0.27), hoodieLight);
    this.createSpherePart(scene, 'bear-hoodie-hem', new Vector3(0, 0.44, 0.01), new Vector3(0.96, 0.27, 0.79), hoodieDark);
    this.createSpherePart(scene, 'bear-pocket', new Vector3(0, 0.58, 0.66), new Vector3(0.46, 0.18, 0.08), hoodieDark);

    const head = CreateSphere('bear-head', { diameter: 1.48, segments: 20 }, scene);
    head.parent = this.visualRoot;
    head.position.y = 1.54;
    head.scaling.set(1.06, 0.95, 1.0);
    head.material = fur;

    this.createSpherePart(scene, 'bear-ear-left', new Vector3(-0.50, 2.02, -0.01), new Vector3(0.47, 0.47, 0.37), fur);
    this.createSpherePart(scene, 'bear-ear-right', new Vector3(0.50, 2.02, -0.01), new Vector3(0.47, 0.47, 0.37), fur);
    this.createSpherePart(scene, 'bear-ear-inner-left', new Vector3(-0.50, 2.03, 0.13), new Vector3(0.24, 0.24, 0.09), furShade);
    this.createSpherePart(scene, 'bear-ear-inner-right', new Vector3(0.50, 2.03, 0.13), new Vector3(0.24, 0.24, 0.09), furShade);

    this.createSpherePart(scene, 'bear-hood', new Vector3(0, 1.34, -0.39), new Vector3(1.18, 0.79, 0.54), hoodie);
    this.createSpherePart(scene, 'bear-hood-rim', new Vector3(0, 1.42, -0.29), new Vector3(1.00, 0.60, 0.38), hoodieLight);

    this.createSpherePart(scene, 'bear-snout', new Vector3(0, 1.45, 0.65), new Vector3(0.66, 0.45, 0.28), furShade);
    this.createSpherePart(scene, 'bear-eye-left', new Vector3(-0.24, 1.72, 0.69), new Vector3(0.12, 0.15, 0.07), face);
    this.createSpherePart(scene, 'bear-eye-right', new Vector3(0.24, 1.72, 0.69), new Vector3(0.12, 0.15, 0.07), face);
    this.createSpherePart(scene, 'bear-nose', new Vector3(0, 1.53, 0.87), new Vector3(0.18, 0.13, 0.10), face);
    this.createSpherePart(scene, 'bear-mouth-left', new Vector3(-0.055, 1.43, 0.88), new Vector3(0.055, 0.035, 0.035), face);
    this.createSpherePart(scene, 'bear-mouth-right', new Vector3(0.055, 1.43, 0.88), new Vector3(0.055, 0.035, 0.035), face);

    const browLeft = this.createSpherePart(scene, 'bear-brow-left', new Vector3(-0.24, 1.86, 0.69), new Vector3(0.19, 0.045, 0.035), face);
    const browRight = this.createSpherePart(scene, 'bear-brow-right', new Vector3(0.24, 1.86, 0.69), new Vector3(0.19, 0.045, 0.035), face);
    browLeft.rotation.z = 0.16;
    browRight.rotation.z = -0.16;

    const leftArm = this.createLimb(scene, 'bear-arm-left', new Vector3(-0.59, 0.90, 0.03), hoodieLight, 0.30, 0.54, 0.30);
    const rightArm = this.createLimb(scene, 'bear-arm-right', new Vector3(0.59, 0.90, 0.03), hoodieLight, 0.30, 0.54, 0.30);
    leftArm.rotation.z = -0.15;
    rightArm.rotation.z = 0.15;

    this.createSpherePart(scene, 'bear-hand-left', new Vector3(-0.64, 0.65, 0.10), new Vector3(0.37, 0.37, 0.37), fur);
    this.createSpherePart(scene, 'bear-hand-right', new Vector3(0.64, 0.65, 0.10), new Vector3(0.37, 0.37, 0.37), fur);

    this.createLimb(scene, 'bear-leg-left', new Vector3(-0.26, 0.22, 0.03), fur, 0.34, 0.34, 0.38);
    this.createLimb(scene, 'bear-leg-right', new Vector3(0.26, 0.22, 0.03), fur, 0.34, 0.34, 0.38);
    this.createSpherePart(scene, 'bear-foot-left', new Vector3(-0.27, 0.10, 0.20), new Vector3(0.39, 0.22, 0.48), furShade);
    this.createSpherePart(scene, 'bear-foot-right', new Vector3(0.27, 0.10, 0.20), new Vector3(0.39, 0.22, 0.48), furShade);
    this.createSpherePart(scene, 'bear-tail', new Vector3(0, 0.72, -0.58), new Vector3(0.34, 0.34, 0.28), fur);
  }

  private createContactShadow(scene: Scene): void {
    const shadowMaterial = new StandardMaterial('bear-shadow-mat', scene);
    shadowMaterial.diffuseColor = new Color3(0.025, 0.035, 0.05);
    shadowMaterial.specularColor = Color3.Black();
    shadowMaterial.alpha = 0.28;
    shadowMaterial.disableLighting = true;

    const shadow = CreateCylinder('bear-contact-shadow', {
      height: 0.012,
      diameter: 1.48,
      tessellation: 24
    }, scene);
    shadow.parent = this.root;
    shadow.position.y = 0.005;
    shadow.scaling.z = 0.70;
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
