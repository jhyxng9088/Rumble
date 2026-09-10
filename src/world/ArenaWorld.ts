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
  readonly spawnPoint = new Vector3(-0.8, 0.02, -2.1);

  constructor(private readonly scene: Scene) {
    scene.clearColor = new Color4(0.34, 0.43, 0.56, 1);

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
    const sky = new HemisphericLight('sky-light', new Vector3(-0.25, 1, -0.1), this.scene);
    sky.intensity = 0.92;
    sky.diffuse = new Color3(0.84, 0.90, 1.0);
    sky.groundColor = new Color3(0.30, 0.24, 0.22);

    const key = new DirectionalLight('sun-light', new Vector3(-0.72, -1, 0.34), this.scene);
    key.intensity = 1.18;
    key.diffuse = new Color3(1.0, 0.72, 0.48);
  }

  private createArena(): void {
    const concrete = this.material('concrete-mat', new Color3(0.56, 0.52, 0.48));
    const concreteDark = this.material('concrete-dark-mat', new Color3(0.31, 0.31, 0.33));
    const rail = this.material('rail-mat', new Color3(0.20, 0.23, 0.27));
    const metal = this.material('metal-mat', new Color3(0.38, 0.44, 0.47));
    const metalDark = this.material('metal-dark-mat', new Color3(0.22, 0.26, 0.29));
    const wood = this.material('wood-mat', new Color3(0.58, 0.30, 0.13));
    const woodLight = this.material('wood-light-mat', new Color3(0.73, 0.43, 0.21));
    const warning = this.material('warning-mat', new Color3(0.94, 0.66, 0.18));
    const cityA = this.material('city-a-mat', new Color3(0.28, 0.32, 0.38));
    const cityB = this.material('city-b-mat', new Color3(0.36, 0.38, 0.43));

    const floor = CreateBox('arena-floor', { width: 18, depth: 14, height: 0.42 }, this.scene);
    floor.position.y = -0.23;
    floor.material = concrete;

    this.createTileSeams(concreteDark);
    this.createPerimeter(concreteDark, rail);

    this.createHvac(new Vector3(-4.5, 0, 2.7), metal, metalDark);
    this.createHvac(new Vector3(4.9, 0, -1.8), metal, metalDark, 0.78);
    this.createCrate(new Vector3(2.9, 0, 2.9), wood, woodLight, 1.25);
    this.createCrate(new Vector3(-2.1, 0, -3.7), wood, woodLight, 0.95);
    this.createBench(new Vector3(-5.9, 0, -1.2), wood, rail);

    const warningPlate = CreateBox('warning-plate', { width: 1.0, height: 0.035, depth: 1.0 }, this.scene);
    warningPlate.position.set(5.9, 0.02, 3.6);
    warningPlate.rotation.y = 0.18;
    warningPlate.material = warning;

    this.createUtilityRoom(concreteDark, metalDark);
    this.createCityBackdrop(cityA, cityB);
  }

  private createTileSeams(material: StandardMaterial): void {
    for (let x = -6; x <= 6; x += 3) {
      const seam = CreateBox(`tile-seam-x-${x}`, { width: 0.025, height: 0.012, depth: 13.1 }, this.scene);
      seam.position.set(x, 0.006, 0);
      seam.material = material;
    }

    for (let z = -4.5; z <= 4.5; z += 3) {
      const seam = CreateBox(`tile-seam-z-${z}`, { width: 17.1, height: 0.012, depth: 0.025 }, this.scene);
      seam.position.set(0, 0.006, z);
      seam.material = material;
    }
  }

  private createPerimeter(parapetMaterial: StandardMaterial, railMaterial: StandardMaterial): void {
    this.createBox('parapet-north', new Vector3(0, 0.28, 6.75), new Vector3(18, 0.56, 0.38), parapetMaterial);
    this.createBox('parapet-south', new Vector3(0, 0.28, -6.75), new Vector3(18, 0.56, 0.38), parapetMaterial);
    this.createBox('parapet-west', new Vector3(-8.8, 0.28, 0), new Vector3(0.38, 0.56, 13.5), parapetMaterial);
    this.createBox('parapet-east', new Vector3(8.8, 0.28, 0), new Vector3(0.38, 0.56, 13.5), parapetMaterial);

    for (let x = -7.5; x <= 7.5; x += 2.5) {
      this.createBox(`rail-n-post-${x}`, new Vector3(x, 1.05, 6.62), new Vector3(0.10, 1.08, 0.10), railMaterial);
      this.createBox(`rail-s-post-${x}`, new Vector3(x, 1.05, -6.62), new Vector3(0.10, 1.08, 0.10), railMaterial);
    }

    this.createBox('rail-n-top', new Vector3(0, 1.48, 6.62), new Vector3(16.1, 0.10, 0.10), railMaterial);
    this.createBox('rail-n-mid', new Vector3(0, 1.05, 6.62), new Vector3(16.1, 0.08, 0.08), railMaterial);
    this.createBox('rail-s-top', new Vector3(0, 1.48, -6.62), new Vector3(16.1, 0.10, 0.10), railMaterial);
  }

  private createHvac(
    position: Vector3,
    material: StandardMaterial,
    darkMaterial: StandardMaterial,
    scale = 1
  ): void {
    this.createBox(`hvac-body-${position.x}-${position.z}`, new Vector3(position.x, 0.58 * scale, position.z), new Vector3(2.0 * scale, 1.16 * scale, 1.55 * scale), material);
    this.createBox(`hvac-top-${position.x}-${position.z}`, new Vector3(position.x, 1.20 * scale, position.z), new Vector3(2.12 * scale, 0.10 * scale, 1.67 * scale), darkMaterial);
    this.createBox(`hvac-vent-${position.x}-${position.z}`, new Vector3(position.x, 0.67 * scale, position.z - 0.79 * scale), new Vector3(1.22 * scale, 0.48 * scale, 0.05 * scale), darkMaterial);
  }

  private createCrate(
    position: Vector3,
    material: StandardMaterial,
    trimMaterial: StandardMaterial,
    scale: number
  ): void {
    this.createBox(`crate-${position.x}-${position.z}`, new Vector3(position.x, 0.55 * scale, position.z), new Vector3(1.15 * scale, 1.1 * scale, 1.15 * scale), material);
    this.createBox(`crate-trim-top-${position.x}-${position.z}`, new Vector3(position.x, 1.05 * scale, position.z), new Vector3(1.25 * scale, 0.10 * scale, 1.25 * scale), trimMaterial);
    this.createBox(`crate-trim-front-${position.x}-${position.z}`, new Vector3(position.x, 0.56 * scale, position.z - 0.59 * scale), new Vector3(0.12 * scale, 0.92 * scale, 0.07 * scale), trimMaterial, 0.68);
  }

  private createBench(position: Vector3, wood: StandardMaterial, metal: StandardMaterial): void {
    this.createBox('bench-seat', new Vector3(position.x, 0.52, position.z), new Vector3(2.25, 0.16, 0.62), wood);
    this.createBox('bench-back', new Vector3(position.x, 0.94, position.z + 0.24), new Vector3(2.25, 0.72, 0.14), wood, -0.08);
    this.createBox('bench-leg-left', new Vector3(position.x - 0.78, 0.25, position.z), new Vector3(0.12, 0.5, 0.48), metal);
    this.createBox('bench-leg-right', new Vector3(position.x + 0.78, 0.25, position.z), new Vector3(0.12, 0.5, 0.48), metal);
  }

  private createUtilityRoom(wall: StandardMaterial, detail: StandardMaterial): void {
    this.createBox('utility-room', new Vector3(6.85, 1.4, 5.0), new Vector3(3.4, 2.8, 2.5), wall);
    this.createBox('utility-door', new Vector3(5.15, 1.15, 4.9), new Vector3(0.08, 1.9, 1.05), detail);
    this.createBox('utility-awning', new Vector3(5.05, 2.20, 4.9), new Vector3(0.75, 0.10, 1.35), detail);
  }

  private createCityBackdrop(cityA: StandardMaterial, cityB: StandardMaterial): void {
    const buildings = [
      [-7.0, 2.0, 10.5, 3.2, 4.0, 3.0],
      [-3.2, 2.8, 11.8, 3.6, 5.6, 3.4],
      [1.0, 1.9, 10.8, 3.2, 3.8, 2.8],
      [4.9, 2.5, 12.0, 3.8, 5.0, 3.8],
      [9.2, 1.65, 10.6, 3.0, 3.3, 2.8]
    ];

    buildings.forEach((building, index) => {
      const [x, y, z, width, height, depth] = building;
      this.createBox(`city-${index}`, new Vector3(x, y, z), new Vector3(width, height, depth), index % 2 === 0 ? cityA : cityB);
    });
  }

  private createBox(
    name: string,
    position: Vector3,
    size: Vector3,
    material: StandardMaterial,
    rotationY = 0
  ): void {
    const box = CreateBox(name, {
      width: size.x,
      height: size.y,
      depth: size.z
    }, this.scene);
    box.position.copyFrom(position);
    box.rotation.y = rotationY;
    box.material = material;
  }

  private material(name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.06, 0.06, 0.06);
    material.roughness = 0.88;
    return material;
  }
}
