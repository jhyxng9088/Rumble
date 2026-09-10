import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3
} from '@babylonjs/core';

const MOVE_SPEED = 4.8;
const TURN_SPEED = 15;

export class PlayerCharacter {
  readonly root: Mesh;
  private readonly visualRoot: TransformNode;
  private walkTime = 0;
  private currentSpeed = 0;

  constructor(scene: Scene, spawnPoint: Vector3) {
    this.root = MeshBuilder.CreateCapsule('player-collider', {
      height: 1.65,
      radius: 0.42,
      tessellation: 8
    }, scene);
    this.root.position.copyFrom(spawnPoint);
    this.root.isVisible = false;
    this.root.checkCollisions = true;
    this.root.ellipsoid = new Vector3(0.42, 0.82, 0.42);
    this.root.ellipsoidOffset = new Vector3(0, 0.82, 0);

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
      this.root.moveWithCollisions(normalized.scale(this.currentSpeed * deltaSeconds));
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
    this.walkTime += deltaSeconds * (moving ? 10 : 4);

    const targetBob = moving ? Math.abs(Math.sin(this.walkTime)) * 0.055 : 0;
    const idleBob = moving ? 0 : Math.sin(this.walkTime) * 0.012;
    this.visualRoot.position.y += (targetBob + idleBob - this.visualRoot.position.y) * Math.min(deltaSeconds * 16, 1);

    const stretch = moving ? 1 + Math.sin(this.walkTime * 2) * 0.018 : 1;
    this.visualRoot.scaling.set(1 / stretch, stretch, 1 / stretch);
  }

  private buildVisual(scene: Scene): void {
    const bodyMaterial = this.material(scene, 'player-body-mat', new Color3(0.25, 0.32, 0.92));
    const skinMaterial = this.material(scene, 'player-skin-mat', new Color3(1.0, 0.70, 0.42));
    const darkMaterial = this.material(scene, 'player-dark-mat', new Color3(0.08, 0.07, 0.11));
    const shoeMaterial = this.material(scene, 'player-shoe-mat', new Color3(0.12, 0.14, 0.19));

    const body = MeshBuilder.CreateCapsule('player-body', {
      height: 1.0,
      radius: 0.43,
      tessellation: 12
    }, scene);
    body.parent = this.visualRoot;
    body.position.y = 0.95;
    body.scaling.x = 1.06;
    body.material = bodyMaterial;

    const head = MeshBuilder.CreateSphere('player-head', { diameter: 1.02, segments: 16 }, scene);
    head.parent = this.visualRoot;
    head.position.y = 1.72;
    head.scaling.set(1.03, 0.98, 1.0);
    head.material = skinMaterial;

    const hair = MeshBuilder.CreateSphere('player-hair', { diameter: 1.04, segments: 12 }, scene);
    hair.parent = this.visualRoot;
    hair.position.set(0, 1.88, -0.045);
    hair.scaling.set(1.02, 0.55, 0.96);
    hair.material = darkMaterial;

    this.createEye(scene, -0.19, darkMaterial);
    this.createEye(scene, 0.19, darkMaterial);

    this.createLimb(scene, 'arm-left', new Vector3(-0.47, 1.03, 0), bodyMaterial, 0.18, 0.58, 0.18);
    this.createLimb(scene, 'arm-right', new Vector3(0.47, 1.03, 0), bodyMaterial, 0.18, 0.58, 0.18);
    this.createLimb(scene, 'leg-left', new Vector3(-0.22, 0.32, 0), darkMaterial, 0.22, 0.48, 0.22);
    this.createLimb(scene, 'leg-right', new Vector3(0.22, 0.32, 0), darkMaterial, 0.22, 0.48, 0.22);

    this.createLimb(scene, 'shoe-left', new Vector3(-0.22, 0.11, 0.10), shoeMaterial, 0.28, 0.16, 0.42);
    this.createLimb(scene, 'shoe-right', new Vector3(0.22, 0.11, 0.10), shoeMaterial, 0.28, 0.16, 0.42);
  }

  private createEye(scene: Scene, x: number, material: StandardMaterial): void {
    const eye = MeshBuilder.CreateSphere('player-eye', { diameter: 0.095, segments: 8 }, scene);
    eye.parent = this.visualRoot;
    eye.position.set(x, 1.77, 0.48);
    eye.scaling.z = 0.45;
    eye.material = material;
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
    const limb = MeshBuilder.CreateCapsule(name, {
      height,
      radius: Math.min(width, depth) / 2,
      tessellation: 8
    }, scene);
    limb.parent = this.visualRoot;
    limb.position.copyFrom(position);
    limb.scaling.x = width / Math.min(width, depth);
    limb.scaling.z = depth / Math.min(width, depth);
    limb.material = material;
  }

  private material(scene: Scene, name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.12, 0.12, 0.12);
    material.roughness = 0.78;
    return material;
  }
}
