import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import type { Scene } from '@babylonjs/core/scene';

const PLAYABLE_HALF_WIDTH = 8.35;
const PLAYABLE_HALF_DEPTH = 6.35;

export class ArenaWorld {
  readonly spawnPoint = new Vector3(0, 0.02, -1.4);

  constructor(private readonly scene: Scene) {
    scene.clearColor = new Color4(0.055, 0.045, 0.08, 1);

    this.createLighting();
    this.createArena();
  }

  constrainPlayerPosition(position: Vector3, radius: number): void {
    position.x = Math.min(
      Math.max(position.x, -PLAYABLE_HALF_WIDTH + radius),
      PLAYABLE_HALF_WIDTH - radius
    );
    position.z = Math.min(
      Math.max(position.z, -PLAYABLE_HALF_DEPTH + radius),
      PLAYABLE_HALF_DEPTH - radius
    );
  }

  private createLighting(): void {
    const sky = new HemisphericLight('sky-light', new Vector3(0.2, 1, -0.2), this.scene);
    sky.intensity = 1.15;
    sky.diffuse = new Color3(0.86, 0.86, 1);
    sky.groundColor = new Color3(0.22, 0.18, 0.30);

    const key = new DirectionalLight('key-light', new Vector3(-0.5, -1, 0.45), this.scene);
    key.intensity = 0.72;
    key.diffuse = new Color3(1, 0.84, 0.68);
  }

  private createArena(): void {
    const floorMaterial = this.material('floor-mat', new Color3(0.32, 0.30, 0.38));
    const wallMaterial = this.material('wall-mat', new Color3(0.18, 0.17, 0.22));
    const accentMaterial = this.material('accent-mat', new Color3(0.74, 0.33, 0.20));
    const metalMaterial = this.material('metal-mat', new Color3(0.25, 0.31, 0.35));

    const floor = CreateBox('arena-floor', { width: 18, depth: 14, height: 0.45 }, this.scene);
    floor.position.y = -0.24;
    floor.material = floorMaterial;

    this.createWall('wall-north', new Vector3(0, 0.75, 6.8), new Vector3(18, 1.5, 0.42), wallMaterial);
    this.createWall('wall-south', new Vector3(0, 0.75, -6.8), new Vector3(18, 1.5, 0.42), wallMaterial);
    this.createWall('wall-west', new Vector3(-8.8, 0.75, 0), new Vector3(0.42, 1.5, 13.6), wallMaterial);
    this.createWall('wall-east', new Vector3(8.8, 0.75, 0), new Vector3(0.42, 1.5, 13.6), wallMaterial);

    this.createObstacle('hvac-main', new Vector3(-3.2, 0.8, 1.7), new Vector3(2.7, 1.6, 1.9), metalMaterial);
    this.createObstacle('utility-box', new Vector3(3.9, 0.65, 2.5), new Vector3(1.7, 1.3, 2.2), accentMaterial);
    this.createObstacle('low-vent', new Vector3(2.1, 0.38, -3.2), new Vector3(2.5, 0.76, 1.15), metalMaterial);

    for (let i = 0; i < 5; i += 1) {
      const stripe = CreateBox(`roof-stripe-${i}`, { width: 0.18, height: 0.012, depth: 2.5 }, this.scene);
      stripe.position.set(-6.3 + i * 0.42, 0.015, -4.3);
      stripe.rotation.y = -0.55;
      stripe.material = accentMaterial;
    }
  }

  private createWall(name: string, position: Vector3, size: Vector3, material: StandardMaterial): void {
    const wall = CreateBox(name, {
      width: size.x,
      height: size.y,
      depth: size.z
    }, this.scene);
    wall.position.copyFrom(position);
    wall.material = material;
  }

  private createObstacle(name: string, position: Vector3, size: Vector3, material: StandardMaterial): void {
    const obstacle = CreateBox(name, {
      width: size.x,
      height: size.y,
      depth: size.z
    }, this.scene);
    obstacle.position.copyFrom(position);
    obstacle.material = material;
  }

  private material(name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.08, 0.08, 0.08);
    material.roughness = 0.82;
    return material;
  }
}
