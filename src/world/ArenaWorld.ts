import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import type { Scene } from '@babylonjs/core/scene';

const PLAYABLE_HALF_WIDTH = 8.35;
const PLAYABLE_HALF_DEPTH = 6.35;

export class ArenaWorld {
  readonly spawnPoint = new Vector3(-0.7, 0.02, -1.7);

  constructor(private readonly scene: Scene) {
    scene.clearColor = new Color4(0.34, 0.43, 0.56, 1);

    this.createLighting();
    this.createArena();
  }

  constrainPlayerPosition(position: Vector3, radius: number): void {
    position.x = Math.min(Math.max(position.x, -PLAYABLE_HALF_WIDTH + radius), PLAYABLE_HALF_WIDTH - radius);
    position.z = Math.min(Math.max(position.z, -PLAYABLE_HALF_DEPTH + radius), PLAYABLE_HALF_DEPTH - radius);
  }

  private createLighting(): void {
    const sky = new HemisphericLight('sky-light', new Vector3(-0.18, 1, -0.12), this.scene);
    sky.intensity = 0.78;
    sky.diffuse = new Color3(0.78, 0.86, 1.0);
    sky.groundColor = new Color3(0.26, 0.23, 0.25);

    const key = new DirectionalLight('sun-light', new Vector3(-0.66, -1, 0.30), this.scene);
    key.intensity = 0.98;
    key.diffuse = new Color3(1.0, 0.82, 0.66);
  }

  private createArena(): void {
    const roof = this.material('roof-mat', new Color3(0.49, 0.46, 0.43));
    const seam = this.material('roof-seam-mat', new Color3(0.39, 0.39, 0.40));
    const parapet = this.material('parapet-mat', new Color3(0.29, 0.29, 0.31));
    const rail = this.material('rail-mat', new Color3(0.13, 0.16, 0.20));
    const metal = this.material('metal-mat', new Color3(0.39, 0.43, 0.43));
    const metalDark = this.material('metal-dark-mat', new Color3(0.19, 0.23, 0.25));
    const wood = this.material('wood-mat', new Color3(0.49, 0.25, 0.11));
    const woodEdge = this.material('wood-edge-mat', new Color3(0.67, 0.38, 0.18));
    const planter = this.material('planter-mat', new Color3(0.33, 0.27, 0.23));
    const foliage = this.material('foliage-mat', new Color3(0.18, 0.34, 0.22));
    const cityA = this.material('city-a-mat', new Color3(0.28, 0.31, 0.36));
    const cityB = this.material('city-b-mat', new Color3(0.35, 0.36, 0.40));
    const cityC = this.material('city-c-mat', new Color3(0.24, 0.27, 0.33));
    const window = this.material('city-window-mat', new Color3(0.56, 0.61, 0.66));
    window.emissiveColor = new Color3(0.12, 0.13, 0.14);
    const shadow = this.shadowMaterial();

    const floor = CreateBox('arena-floor', { width: 18, depth: 14, height: 0.42 }, this.scene);
    floor.position.y = -0.23;
    floor.material = roof;

    this.createTileSeams(seam);
    this.createPerimeter(parapet, rail);

    this.createHvac(new Vector3(-4.35, 0, 2.65), metal, metalDark, shadow, 0.94);
    this.createHvac(new Vector3(4.65, 0, -1.55), metal, metalDark, shadow, 0.72);
    this.createCrate(new Vector3(2.85, 0, 2.45), wood, woodEdge, shadow, 1.06);
    this.createCrate(new Vector3(-2.6, 0, -3.45), wood, woodEdge, shadow, 0.82);
    this.createBench(new Vector3(-5.75, 0, -0.75), wood, rail, shadow);
    this.createPlanter(new Vector3(-6.25, 0, 3.55), planter, foliage, shadow, 1.0);
    this.createPlanter(new Vector3(5.55, 0, 3.55), planter, foliage, shadow, 0.82);
    this.createVentPipe(new Vector3(0.7, 0, 4.85), metalDark, metal, shadow);

    this.createUtilityRoom(parapet, metalDark, shadow);
    this.createCityBackdrop(cityA, cityB, cityC, window);
  }

  private createTileSeams(material: StandardMaterial): void {
    for (let x = -7.2; x <= 7.2; x += 2.4) {
      this.createBox(`tile-seam-x-${x}`, new Vector3(x, 0.006, 0), new Vector3(0.018, 0.01, 13.15), material);
    }

    for (let z = -4.8; z <= 4.8; z += 2.4) {
      this.createBox(`tile-seam-z-${z}`, new Vector3(0, 0.006, z), new Vector3(17.15, 0.01, 0.018), material);
    }
  }

  private createPerimeter(parapetMaterial: StandardMaterial, railMaterial: StandardMaterial): void {
    this.createBox('parapet-north', new Vector3(0, 0.22, 6.75), new Vector3(18, 0.44, 0.38), parapetMaterial);
    this.createBox('parapet-south', new Vector3(0, 0.22, -6.75), new Vector3(18, 0.44, 0.38), parapetMaterial);
    this.createBox('parapet-west', new Vector3(-8.8, 0.22, 0), new Vector3(0.38, 0.44, 13.5), parapetMaterial);
    this.createBox('parapet-east', new Vector3(8.8, 0.22, 0), new Vector3(0.38, 0.44, 13.5), parapetMaterial);

    this.createRailRun('north', new Vector3(0, 0, 6.60), 16.4, true, railMaterial);
    this.createRailRun('west', new Vector3(-8.66, 0, 0.85), 10.5, false, railMaterial);
    this.createRailRun('east-back', new Vector3(8.66, 0, 3.1), 5.1, false, railMaterial);
  }

  private createRailRun(name: string, center: Vector3, length: number, horizontalX: boolean, material: StandardMaterial): void {
    const postCount = Math.max(3, Math.floor(length / 2.4));
    for (let i = 0; i <= postCount; i += 1) {
      const t = i / postCount - 0.5;
      const x = horizontalX ? center.x + t * length : center.x;
      const z = horizontalX ? center.z : center.z + t * length;
      this.createBox(`${name}-post-${i}`, new Vector3(x, 0.96, z), new Vector3(0.09, 1.18, 0.09), material);
    }

    const topSize = horizontalX ? new Vector3(length, 0.09, 0.09) : new Vector3(0.09, 0.09, length);
    const midSize = horizontalX ? new Vector3(length, 0.07, 0.07) : new Vector3(0.07, 0.07, length);
    this.createBox(`${name}-top`, new Vector3(center.x, 1.46, center.z), topSize, material);
    this.createBox(`${name}-mid`, new Vector3(center.x, 1.00, center.z), midSize, material);
  }

  private createHvac(
    position: Vector3,
    material: StandardMaterial,
    darkMaterial: StandardMaterial,
    shadowMaterial: StandardMaterial,
    scale: number
  ): void {
    this.createShadowPlate(`hvac-shadow-${position.x}`, position.x + 0.12, position.z - 0.10, 2.15 * scale, 1.7 * scale, shadowMaterial);
    this.createBox(`hvac-body-${position.x}`, new Vector3(position.x, 0.55 * scale, position.z), new Vector3(2.0 * scale, 1.10 * scale, 1.52 * scale), material);
    this.createBox(`hvac-top-${position.x}`, new Vector3(position.x, 1.13 * scale, position.z), new Vector3(2.14 * scale, 0.10 * scale, 1.66 * scale), darkMaterial);
    this.createBox(`hvac-panel-${position.x}`, new Vector3(position.x, 0.58 * scale, position.z - 0.775 * scale), new Vector3(1.25 * scale, 0.48 * scale, 0.04), darkMaterial);

    const fan = CreateCylinder(`hvac-fan-${position.x}`, { height: 0.035, diameter: 0.58 * scale, tessellation: 20 }, this.scene);
    fan.position.set(position.x, 0.58 * scale, position.z - 0.80 * scale);
    fan.rotation.x = Math.PI / 2;
    fan.material = material;
  }

  private createCrate(
    position: Vector3,
    material: StandardMaterial,
    trimMaterial: StandardMaterial,
    shadowMaterial: StandardMaterial,
    scale: number
  ): void {
    this.createShadowPlate(`crate-shadow-${position.x}`, position.x + 0.08, position.z - 0.06, 1.28 * scale, 1.28 * scale, shadowMaterial);
    this.createBox(`crate-body-${position.x}`, new Vector3(position.x, 0.53 * scale, position.z), new Vector3(1.13 * scale, 1.06 * scale, 1.13 * scale), material);
    this.createBox(`crate-top-${position.x}`, new Vector3(position.x, 1.03 * scale, position.z), new Vector3(1.24 * scale, 0.10 * scale, 1.24 * scale), trimMaterial);
    this.createBox(`crate-front-v-${position.x}`, new Vector3(position.x, 0.53 * scale, position.z - 0.58 * scale), new Vector3(0.10 * scale, 0.82 * scale, 0.05), trimMaterial);
    this.createBox(`crate-front-h-${position.x}`, new Vector3(position.x, 0.53 * scale, position.z - 0.585 * scale), new Vector3(0.92 * scale, 0.10 * scale, 0.05), trimMaterial);
  }

  private createBench(position: Vector3, wood: StandardMaterial, metal: StandardMaterial, shadow: StandardMaterial): void {
    this.createShadowPlate('bench-shadow', position.x + 0.10, position.z, 2.35, 0.72, shadow);
    this.createBox('bench-seat', new Vector3(position.x, 0.48, position.z), new Vector3(2.20, 0.14, 0.58), wood);
    this.createBox('bench-back', new Vector3(position.x, 0.87, position.z + 0.24), new Vector3(2.20, 0.66, 0.12), wood);
    this.createBox('bench-leg-left', new Vector3(position.x - 0.76, 0.23, position.z), new Vector3(0.11, 0.46, 0.45), metal);
    this.createBox('bench-leg-right', new Vector3(position.x + 0.76, 0.23, position.z), new Vector3(0.11, 0.46, 0.45), metal);
  }

  private createPlanter(position: Vector3, pot: StandardMaterial, leaf: StandardMaterial, shadow: StandardMaterial, scale: number): void {
    this.createShadowPlate(`planter-shadow-${position.x}`, position.x + 0.08, position.z, 1.15 * scale, 0.90 * scale, shadow);
    this.createBox(`planter-${position.x}`, new Vector3(position.x, 0.34 * scale, position.z), new Vector3(1.05 * scale, 0.68 * scale, 0.78 * scale), pot);

    const offsets = [-0.28, 0, 0.28];
    offsets.forEach((offset, index) => {
      const bush = CreateSphere(`planter-bush-${position.x}-${index}`, { diameter: 0.72 * scale, segments: 8 }, this.scene);
      bush.position.set(position.x + offset * scale, 0.82 * scale + (index % 2) * 0.08, position.z);
      bush.scaling.y = 1.18;
      bush.material = leaf;
    });
  }

  private createVentPipe(position: Vector3, dark: StandardMaterial, metal: StandardMaterial, shadow: StandardMaterial): void {
    this.createShadowPlate('pipe-shadow', position.x + 0.05, position.z, 0.72, 0.72, shadow);
    const pipe = CreateCylinder('vent-pipe', { height: 1.15, diameter: 0.48, tessellation: 16 }, this.scene);
    pipe.position.set(position.x, 0.575, position.z);
    pipe.material = metal;
    const cap = CreateCylinder('vent-cap', { height: 0.14, diameterTop: 0.78, diameterBottom: 0.54, tessellation: 16 }, this.scene);
    cap.position.set(position.x, 1.18, position.z);
    cap.material = dark;
  }

  private createUtilityRoom(wall: StandardMaterial, detail: StandardMaterial, shadow: StandardMaterial): void {
    this.createShadowPlate('utility-shadow', 6.85, 5.05, 3.55, 2.65, shadow);
    this.createBox('utility-room', new Vector3(6.85, 1.35, 5.0), new Vector3(3.35, 2.70, 2.45), wall);
    this.createBox('utility-door', new Vector3(5.16, 1.12, 4.85), new Vector3(0.06, 1.86, 1.0), detail);
    this.createBox('utility-awning', new Vector3(5.02, 2.18, 4.85), new Vector3(0.66, 0.09, 1.28), detail);
    this.createBox('utility-trim', new Vector3(6.84, 2.73, 5.0), new Vector3(3.48, 0.10, 2.58), detail);
  }

  private createCityBackdrop(a: StandardMaterial, b: StandardMaterial, c: StandardMaterial, windows: StandardMaterial): void {
    const buildings = [
      { x: -10.8, y: 2.4, z: 7.9, w: 4.0, h: 4.8, d: 3.5, mat: c },
      { x: -7.0, y: 3.3, z: 10.8, w: 3.4, h: 6.6, d: 3.0, mat: a },
      { x: -2.8, y: 2.25, z: 11.8, w: 4.0, h: 4.5, d: 3.2, mat: b },
      { x: 1.8, y: 3.0, z: 12.6, w: 4.1, h: 6.0, d: 3.6, mat: c },
      { x: 6.5, y: 2.1, z: 12.0, w: 3.8, h: 4.2, d: 3.1, mat: a }
    ];

    buildings.forEach((building, index) => {
      this.createBox(`city-${index}`, new Vector3(building.x, building.y, building.z), new Vector3(building.w, building.h, building.d), building.mat);
      this.createCityWindows(index, building.x, building.y, building.z - building.d / 2 - 0.02, building.w, building.h, windows);
      this.createBox(`city-roof-${index}`, new Vector3(building.x, building.h + 0.12, building.z), new Vector3(building.w + 0.18, 0.16, building.d + 0.18), building.mat);
    });
  }

  private createCityWindows(index: number, x: number, centerY: number, frontZ: number, width: number, height: number, material: StandardMaterial): void {
    const columns = Math.max(2, Math.floor(width / 0.9));
    const rows = Math.max(2, Math.floor(height / 1.25));
    const bottom = centerY - height / 2 + 0.65;

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        if ((row + column + index) % 3 === 0) continue;
        const px = x + (column - (columns - 1) / 2) * 0.72;
        const py = bottom + row * 1.02;
        this.createBox(`window-${index}-${row}-${column}`, new Vector3(px, py, frontZ), new Vector3(0.40, 0.46, 0.035), material);
      }
    }
  }

  private createShadowPlate(name: string, x: number, z: number, width: number, depth: number, material: StandardMaterial): void {
    this.createBox(name, new Vector3(x, 0.014, z), new Vector3(width, 0.012, depth), material);
  }

  private createBox(name: string, position: Vector3, size: Vector3, material: StandardMaterial): void {
    const box = CreateBox(name, { width: size.x, height: size.y, depth: size.z }, this.scene);
    box.position.copyFrom(position);
    box.material = material;
  }

  private material(name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.035, 0.035, 0.035);
    material.roughness = 0.92;
    return material;
  }

  private shadowMaterial(): StandardMaterial {
    const material = new StandardMaterial('world-contact-shadow-mat', this.scene);
    material.diffuseColor = new Color3(0.04, 0.045, 0.055);
    material.specularColor = Color3.Black();
    material.alpha = 0.18;
    material.disableLighting = true;
    return material;
  }
}
