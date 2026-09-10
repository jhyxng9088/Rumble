import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { RooftopWorld } from "../world/RooftopWorld";

const MOVE_SPEED = 4.35;
const CHARACTER_RADIUS = 0.5;

export class PlayerCharacter {
  private readonly root: TransformNode;
  private readonly visualRoot: TransformNode;
  private readonly leftArm: TransformNode;
  private readonly rightArm: TransformNode;
  private readonly leftLeg: TransformNode;
  private readonly rightLeg: TransformNode;
  private walkClock = 0;

  constructor(
    private readonly scene: Scene,
    private readonly world: RooftopWorld,
  ) {
    this.root = new TransformNode("playerRoot", scene);
    this.root.position.set(0, 0, -0.8);

    this.visualRoot = new TransformNode("playerVisual", scene);
    this.visualRoot.parent = this.root;

    const fur = this.material("playerFur", "#f8fafc");
    const hoodie = this.material("playerHoodie", "#3b82f6");
    const dark = this.material("playerFace", "#111827");
    const muzzle = this.material("playerMuzzle", "#e5e7eb");

    this.sphere("body", 1.18, new Vector3(0, 0.86, 0), new Vector3(0.95, 1.0, 0.8), hoodie, this.visualRoot);
    this.sphere("head", 1.08, new Vector3(0, 1.7, 0.02), Vector3.One(), fur, this.visualRoot);
    this.sphere("earL", 0.34, new Vector3(-0.37, 2.08, 0.0), Vector3.One(), fur, this.visualRoot);
    this.sphere("earR", 0.34, new Vector3(0.37, 2.08, 0.0), Vector3.One(), fur, this.visualRoot);
    this.sphere("muzzle", 0.43, new Vector3(0, 1.55, 0.48), new Vector3(1, 0.72, 0.42), muzzle, this.visualRoot);
    this.sphere("eyeL", 0.105, new Vector3(-0.2, 1.76, 0.49), Vector3.One(), dark, this.visualRoot);
    this.sphere("eyeR", 0.105, new Vector3(0.2, 1.76, 0.49), Vector3.One(), dark, this.visualRoot);
    this.sphere("nose", 0.11, new Vector3(0, 1.61, 0.585), new Vector3(1.15, 0.82, 0.7), dark, this.visualRoot);

    this.leftArm = this.limb("leftArm", -0.63, 1.05, hoodie, -0.2);
    this.rightArm = this.limb("rightArm", 0.63, 1.05, hoodie, 0.2);
    this.leftLeg = this.limb("leftLeg", -0.3, 0.37, fur, 0);
    this.rightLeg = this.limb("rightLeg", 0.3, 0.37, fur, 0);

    const shadow = MeshBuilder.CreateDisc("playerBlobShadow", { radius: 0.58, tessellation: 32 }, scene);
    shadow.parent = this.root;
    shadow.position.y = 0.012;
    shadow.rotation.x = Math.PI / 2;
    shadow.scaling.y = 0.68;
    const shadowMaterial = new StandardMaterial("playerBlobShadowMaterial", scene);
    shadowMaterial.diffuseColor = Color3.Black();
    shadowMaterial.emissiveColor = Color3.Black();
    shadowMaterial.alpha = 0.18;
    shadowMaterial.disableLighting = true;
    shadow.material = shadowMaterial;
    shadow.isPickable = false;
  }

  get position(): Vector3 {
    return this.root.position;
  }

  update(worldMove: Vector3, deltaSeconds: number): void {
    const inputStrength = Math.min(1, worldMove.length());
    if (inputStrength > 0.01) {
      const direction = worldMove.normalize();
      const displacement = direction.scale(MOVE_SPEED * inputStrength * deltaSeconds);
      const next = this.world.moveCharacter(this.root.position, displacement, CHARACTER_RADIUS);
      this.root.position.copyFrom(next);

      const targetYaw = Math.atan2(direction.x, direction.z);
      this.root.rotation.y = lerpAngle(this.root.rotation.y, targetYaw, 1 - Math.exp(-14 * deltaSeconds));
      this.walkClock += deltaSeconds * (8.8 + inputStrength * 2.2);
    }

    this.animateLocomotion(inputStrength, deltaSeconds);
  }

  private animateLocomotion(strength: number, deltaSeconds: number): void {
    const blend = 1 - Math.exp(-12 * deltaSeconds);
    const cycle = Math.sin(this.walkClock);
    const desiredBob = strength > 0.01 ? Math.abs(Math.sin(this.walkClock * 2)) * 0.045 : 0;
    this.visualRoot.position.y += (desiredBob - this.visualRoot.position.y) * blend;

    const desiredScaleY = strength > 0.01 ? 1 + Math.abs(cycle) * 0.018 : 1;
    const desiredScaleXZ = 1 / Math.sqrt(desiredScaleY);
    this.visualRoot.scaling.y += (desiredScaleY - this.visualRoot.scaling.y) * blend;
    this.visualRoot.scaling.x += (desiredScaleXZ - this.visualRoot.scaling.x) * blend;
    this.visualRoot.scaling.z += (desiredScaleXZ - this.visualRoot.scaling.z) * blend;

    const swing = cycle * 0.5 * strength;
    this.leftArm.rotation.x += (swing - this.leftArm.rotation.x) * blend;
    this.rightArm.rotation.x += (-swing - this.rightArm.rotation.x) * blend;
    this.leftLeg.rotation.x += (-swing * 0.72 - this.leftLeg.rotation.x) * blend;
    this.rightLeg.rotation.x += (swing * 0.72 - this.rightLeg.rotation.x) * blend;
  }

  private limb(
    name: string,
    x: number,
    y: number,
    material: StandardMaterial,
    z: number,
  ): TransformNode {
    const pivot = new TransformNode(`${name}Pivot`, this.scene);
    pivot.parent = this.visualRoot;
    pivot.position.set(x, y, z);
    this.sphere(name, 0.46, new Vector3(0, -0.17, 0), new Vector3(0.74, 1.15, 0.74), material, pivot);
    return pivot;
  }

  private sphere(
    name: string,
    diameter: number,
    position: Vector3,
    scaling: Vector3,
    material: StandardMaterial,
    parent: TransformNode,
  ): Mesh {
    const mesh = MeshBuilder.CreateSphere(name, { diameter, segments: 12 }, this.scene);
    mesh.parent = parent;
    mesh.position.copyFrom(position);
    mesh.scaling.copyFrom(scaling);
    mesh.material = material;
    mesh.isPickable = false;
    return mesh;
  }

  private material(name: string, hex: string): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = Color3.FromHexString(hex);
    material.specularColor = Color3.White().scale(0.08);
    return material;
  }
}

function lerpAngle(current: number, target: number, amount: number): number {
  let delta = (target - current + Math.PI) % (Math.PI * 2) - Math.PI;
  if (delta < -Math.PI) {
    delta += Math.PI * 2;
  }
  return current + delta * amount;
}
