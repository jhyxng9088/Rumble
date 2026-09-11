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
  readonly spawnPoint = new Vector3(-0.35, 0.02, -1.55);

  constructor(private readonly scene: Scene) {
    scene.clearColor = new Color4(0.40, 0.54, 0.69, 1);
    scene.imageProcessingConfiguration.contrast = 1.12;
    scene.imageProcessingConfiguration.exposure = 1.04;

    this.createLighting();
    this.createArena();
  }

  constrainPlayerPosition(position: Vector3, radius: number): void {
    position.x = Math.min(Math.max(position.x, -PLAYABLE_HALF_WIDTH + radius), PLAYABLE_HALF_WIDTH - radius);
    position.z = Math.min(Math.max(position.z, -PLAYABLE_HALF_DEPTH + radius), PLAYABLE_HALF_DEPTH - radius);
  }

  private createLighting(): void {
    const sky = new HemisphericLight('sky-light', new Vector3(-0.18, 1, -0.12), this.scene);
    sky.intensity = 0.72;
    sky.diffuse = new Color3(0.75, 0.84, 1.0);
    sky.groundColor = new Color3(0.30, 0.24, 0.23);

    const sun = new DirectionalLight('sun-light', new Vector3(-0.68, -1, 0.34), this.scene);
    sun.intensity = 1.12;
    sun.diffuse = new Color3(1.0, 0.78, 0.58);
  }

  private createArena(): void {
    const roof = this.material('roof-mat', new Color3(0.58, 0.53, 0.49));
    const roofWarm = this.material('roof-warm-mat', new Color3(0.62, 0.55, 0.49));
    const roofCool = this.material('roof-cool-mat', new Color3(0.52, 0.50, 0.50));
    const seam = this.material('roof-seam-mat', new Color3(0.39, 0.39, 0.41));
    const parapet = this.material('parapet-mat', new Color3(0.30, 0.29, 0.31));
    const buildingBase = this.material('building-base-mat', new Color3(0.22, 0.23, 0.27));
    const rail = this.material('rail-mat', new Color3(0.10, 0.13, 0.17));
    const metal = this.material('metal-mat', new Color3(0.40, 0.46, 0.47));
    const metalLight = this.material('metal-light-mat', new Color3(0.54, 0.59, 0.58));
    const metalDark = this.material('metal-dark-mat', new Color3(0.18, 0.22, 0.25));
    const wood = this.material('wood-mat', new Color3(0.48, 0.22, 0.09));
    const woodEdge = this.material('wood-edge-mat', new Color3(0.72, 0.39, 0.17));
    const planter = this.material('planter-mat', new Color3(0.31, 0.24, 0.20));
    const foliage = this.material('foliage-mat', new Color3(0.19, 0.37, 0.22));
    const foliageLight = this.material('foliage-light-mat', new Color3(0.28, 0.48, 0.29));
    const warning = this.material('warning-mat', new Color3(0.93, 0.57, 0.16));
    const cityNear = this.material('city-near-mat', new Color3(0.25, 0.28, 0.34));
    const cityMid = this.material('city-mid-mat', new Color3(0.34, 0.37, 0.43));
    const cityFar = this.material('city-far-mat', new Color3(0.43, 0.47, 0.53));
    const window = this.material('city-window-mat', new Color3(0.63, 0.68, 0.72));
    window.emissiveColor = new Color3(0.10, 0.11, 0.12);
    const shadow = this.shadowMaterial();

    this.createBox('roof-building-mass', new Vector3(0, -2.38, 0), new Vector3(18.9, 4.5, 15.0), buildingBase);
    this.createBox('arena-floor', new Vector3(0, -0.22, 0), new Vector3(18.2, 0.44, 14.2), roof);
    this.createRoofSurface(roofWarm, roofCool, seam);
    this.createPerimeter(parapet, rail);

    this.createHvac(new Vector3(-4.65, 0, 3.15), metal, metalLight, metalDark, shadow, 0.92, -0.08);
    this.createHvac(new Vector3(4.15, 0, -2.45), metal, metalLight, metalDark, shadow, 0.70, 0.12);
    this.createCrate(new Vector3(2.05, 0, 2.05), wood, woodEdge, shadow, 1.02, 0.18);
    this.createCrate(new Vector3(-3.85, 0, -2.35), wood, woodEdge, shadow, 0.82, -0.22);
    this.createCrate(new Vector3(-6.15, 0, 0.85), wood, woodEdge, shadow, 0.60, 0.10);
    this.createBench(new Vector3(-5.45, 0, 3.70), wood, rail, shadow, -0.06);
    this.createPlanter(new Vector3(-7.0, 0, 4.35), planter, foliage, foliageLight, shadow, 0.95);
    this.createPlanter(new Vector3(5.50, 0, 3.20), planter, foliage, foliageLight, shadow, 0.78);
    this.createVentPipe(new Vector3(0.15, 0, 4.90), metalDark, metalLight, shadow, 1.0);
    this.createVentPipe(new Vector3(5.75, 0, -0.25), metalDark, metalLight, shadow, 0.72);
    this.createTrashCan(new Vector3(-5.65, 0, -4.40), metalDark, metalLight, shadow);
    this.createWarningCone(new Vector3(1.05, 0, -4.05), warning, shadow);

    this.createUtilityRoom(parapet, metalDark, metalLight, shadow);
    this.createCityBackdrop(cityNear, cityMid, cityFar, window, metalDark);
  }

  private createRoofSurface(warm: StandardMaterial, cool: StandardMaterial, seam: StandardMaterial): void {
    const patches = [
      [-5.9, -3.8, 2.6, 2.2, warm],
      [-2.2, 3.7, 3.0, 2.4, cool],
      [3.8, 3.8, 2.8, 2.3, warm],
      [5.8, -4.1, 2.5, 2.0, cool],
      [0.2, -0.2, 3.2, 2.6, warm]
    ] as const;

    patches.forEach(([x, z, width, depth, material], index) => {
      this.createBox(`roof-patch-${index}`, new Vector3(x, 0.008, z), new Vector3(width, 0.012, depth), material, index % 2 === 0 ? 0.025 : -0.025);
    });

    for (let x = -6; x <= 6; x += 3) {
      this.createBox(`roof-seam-x-${x}`, new Vector3(x, 0.014, 0), new Vector3(0.018, 0.012, 13.1), seam);
    }
    for (let z = -4.5; z <= 4.5; z += 3) {
      this.createBox(`roof-seam-z-${z}`, new Vector3(0, 0.014, z), new Vector3(17.1, 0.012, 0.018), seam);
    }
  }

  private createPerimeter(parapetMaterial: StandardMaterial, railMaterial: StandardMaterial): void {
    this.createBox('parapet-north', new Vector3(0, 0.24, 6.78), new Vector3(18.2, 0.48, 0.42), parapetMaterial);
    this.createBox('parapet-south', new Vector3(0, 0.18, -6.78), new Vector3(18.2, 0.36, 0.42), parapetMaterial);
    this.createBox('parapet-west', new Vector3(-8.88, 0.24, 0), new Vector3(0.42, 0.48, 13.6), parapetMaterial);
    this.createBox('parapet-east', new Vector3(8.88, 0.24, 0), new Vector3(0.42, 0.48, 13.6), parapetMaterial);

    this.createRailRun('north', new Vector3(0, 0, 6.60), 16.5, true, railMaterial);
    this.createRailRun('west-back', new Vector3(-8.68, 0, 2.8), 6.6, false, railMaterial);
    this.createRailRun('east-back', new Vector3(8.68, 0, 3.4), 5.1, false, railMaterial);
  }

  private createRailRun(name: string, center: Vector3, length: number, horizontalX: boolean, material: StandardMaterial): void {
    const postCount = Math.max(3, Math.floor(length / 2.5));
    for (let i = 0; i <= postCount; i += 1) {
      const t = i / postCount - 0.5;
      const x = horizontalX ? center.x + t * length : center.x;
      const z = horizontalX ? center.z : center.z + t * length;
      this.createBox(`${name}-post-${i}`, new Vector3(x, 0.92, z), new Vector3(0.09, 1.05, 0.09), material);
    }

    const topSize = horizontalX ? new Vector3(length, 0.09, 0.09) : new Vector3(0.09, 0.09, length);
    const midSize = horizontalX ? new Vector3(length, 0.07, 0.07) : new Vector3(0.07, 0.07, length);
    this.createBox(`${name}-top`, new Vector3(center.x, 1.36, center.z), topSize, material);
    this.createBox(`${name}-mid`, new Vector3(center.x, 0.94, center.z), midSize, material);
  }

  private createHvac(
    position: Vector3,
    material: StandardMaterial,
    lightMaterial: StandardMaterial,
    darkMaterial: StandardMaterial,
    shadowMaterial: StandardMaterial,
    scale: number,
    rotationY: number
  ): void {
    this.createShadowPlate(`hvac-shadow-${position.x}`, position.x + 0.10, position.z - 0.08, 2.2 * scale, 1.75 * scale, shadowMaterial, rotationY);
    this.createBox(`hvac-body-${position.x}`, new Vector3(position.x, 0.55 * scale, position.z), new Vector3(2.05 * scale, 1.10 * scale, 1.55 * scale), material, rotationY);
    this.createBox(`hvac-top-${position.x}`, new Vector3(position.x, 1.14 * scale, position.z), new Vector3(2.18 * scale, 0.11 * scale, 1.68 * scale), darkMaterial, rotationY);
    this.createBox(`hvac-band-${position.x}`, new Vector3(position.x, 0.93 * scale, position.z), new Vector3(2.10 * scale, 0.10 * scale, 1.60 * scale), lightMaterial, rotationY);

    const fan = CreateCylinder(`hvac-fan-${position.x}`, { height: 0.045, diameter: 0.62 * scale, tessellation: 20 }, this.scene);
    fan.position.set(position.x, 0.58 * scale, position.z - 0.80 * scale);
    fan.rotation.x = Math.PI / 2;
    fan.rotation.z = rotationY;
    fan.material = darkMaterial;
  }

  private createCrate(
    position: Vector3,
    material: StandardMaterial,
    trimMaterial: StandardMaterial,
    shadowMaterial: StandardMaterial,
    scale: number,
    rotationY: number
  ): void {
    this.createShadowPlate(`crate-shadow-${position.x}`, position.x + 0.08, position.z - 0.05, 1.30 * scale, 1.30 * scale, shadowMaterial, rotationY);
    this.createBox(`crate-body-${position.x}`, new Vector3(position.x, 0.53 * scale, position.z), new Vector3(1.14 * scale, 1.06 * scale, 1.14 * scale), material, rotationY);
    this.createBox(`crate-top-${position.x}`, new Vector3(position.x, 1.03 * scale, position.z), new Vector3(1.25 * scale, 0.10 * scale, 1.25 * scale), trimMaterial, rotationY);
    this.createBox(`crate-front-v-${position.x}`, new Vector3(position.x, 0.53 * scale, position.z - 0.59 * scale), new Vector3(0.10 * scale, 0.82 * scale, 0.05), trimMaterial, rotationY);
    this.createBox(`crate-front-h-${position.x}`, new Vector3(position.x, 0.53 * scale, position.z - 0.595 * scale), new Vector3(0.90 * scale, 0.10 * scale, 0.05), trimMaterial, rotationY);
  }

  private createBench(position: Vector3, wood: StandardMaterial, metal: StandardMaterial, shadow: StandardMaterial, rotationY: number): void {
    this.createShadowPlate('bench-shadow', position.x + 0.08, position.z, 2.4, 0.75, shadow, rotationY);
    this.createBox('bench-seat', new Vector3(position.x, 0.48, position.z), new Vector3(2.28, 0.14, 0.60), wood, rotationY);
    this.createBox('bench-back', new Vector3(position.x, 0.88, position.z + 0.24), new Vector3(2.28, 0.68, 0.12), wood, rotationY);
    this.createBox('bench-leg-left', new Vector3(position.x - 0.78, 0.23, position.z), new Vector3(0.11, 0.46, 0.45), metal, rotationY);
    this.createBox('bench-leg-right', new Vector3(position.x + 0.78, 0.23, position.z), new Vector3(0.11, 0.46, 0.45), metal, rotationY);
  }

  private createPlanter(
    position: Vector3,
    pot: StandardMaterial,
    leaf: StandardMaterial,
    leafLight: StandardMaterial,
    shadow: StandardMaterial,
    scale: number
  ): void {
    this.createShadowPlate(`planter-shadow-${position.x}`, position.x + 0.08, position.z, 1.16 * scale, 0.94 * scale, shadow);
    this.createBox(`planter-${position.x}`, new Vector3(position.x, 0.34 * scale, position.z), new Vector3(1.08 * scale, 0.68 * scale, 0.80 * scale), pot);

    const offsets = [-0.30, -0.02, 0.28];
    offsets.forEach((offset, index) => {
      const bush = CreateSphere(`planter-bush-${position.x}-${index}`, { diameter: 0.74 * scale, segments: 10 }, this.scene);
      bush.position.set(position.x + offset * scale, 0.82 * scale + (index % 2) * 0.11, position.z + (index - 1) * 0.05);
      bush.scaling.y = 1.18;
      bush.material = index === 1 ? leafLight : leaf;
    });
  }

  private createVentPipe(position: Vector3, dark: StandardMaterial, metal: StandardMaterial, shadow: StandardMaterial, scale: number): void {
    this.createShadowPlate(`pipe-shadow-${position.x}`, position.x + 0.05, position.z, 0.72 * scale, 0.72 * scale, shadow);
    const pipe = CreateCylinder(`vent-pipe-${position.x}`, { height: 1.18 * scale, diameter: 0.46 * scale, tessellation: 16 }, this.scene);
    pipe.position.set(position.x, 0.59 * scale, position.z);
    pipe.material = metal;
    const cap = CreateCylinder(`vent-cap-${position.x}`, { height: 0.14 * scale, diameterTop: 0.76 * scale, diameterBottom: 0.52 * scale, tessellation: 16 }, this.scene);
    cap.position.set(position.x, 1.20 * scale, position.z);
    cap.material = dark;
  }

  private createTrashCan(position: Vector3, dark: StandardMaterial, light: StandardMaterial, shadow: StandardMaterial): void {
    this.createShadowPlate('trash-shadow', position.x + 0.05, position.z, 0.82, 0.82, shadow);
    const body = CreateCylinder('trash-body', { height: 0.88, diameterTop: 0.66, diameterBottom: 0.72, tessellation: 14 }, this.scene);
    body.position.set(position.x, 0.44, position.z);
    body.material = dark;
    const lid = CreateCylinder('trash-lid', { height: 0.10, diameter: 0.78, tessellation: 14 }, this.scene);
    lid.position.set(position.x, 0.92, position.z);
    lid.material = light;
  }

  private createWarningCone(position: Vector3, warning: StandardMaterial, shadow: StandardMaterial): void {
    this.createShadowPlate('cone-shadow', position.x + 0.04, position.z, 0.70, 0.54, shadow);
    const cone = CreateCylinder('warning-cone', { height: 0.78, diameterTop: 0.10, diameterBottom: 0.58, tessellation: 14 }, this.scene);
    cone.position.set(position.x, 0.39, position.z);
    cone.material = warning;
    this.createBox('warning-cone-base', new Vector3(position.x, 0.05, position.z), new Vector3(0.72, 0.10, 0.72), warning, 0.16);
  }

  private createUtilityRoom(
    wall: StandardMaterial,
    detail: StandardMaterial,
    trim: StandardMaterial,
    shadow: StandardMaterial
  ): void {
    this.createShadowPlate('utility-shadow', 6.72, 4.96, 3.8, 2.9, shadow, -0.04);
    this.createBox('utility-room', new Vector3(6.72, 1.38, 4.96), new Vector3(3.55, 2.76, 2.58), wall, -0.04);
    this.createBox('utility-door', new Vector3(4.94, 1.14, 4.82), new Vector3(0.07, 1.92, 1.08), detail, -0.04);
    this.createBox('utility-awning', new Vector3(4.78, 2.22, 4.82), new Vector3(0.72, 0.10, 1.38), detail, -0.04);
    this.createBox('utility-trim', new Vector3(6.72, 2.80, 4.96), new Vector3(3.70, 0.11, 2.73), trim, -0.04);
    this.createBox('utility-side-panel', new Vector3(6.15, 1.88, 3.65), new Vector3(1.40, 0.10, 0.05), trim, -0.04);
  }

  private createCityBackdrop(
    near: StandardMaterial,
    mid: StandardMaterial,
    far: StandardMaterial,
    windows: StandardMaterial,
    roofDetail: StandardMaterial
  ): void {
    const farBuildings = [
      [-11.5, 2.7, 16.8, 4.8, 5.4, 4.0],
      [-6.2, 3.9, 17.8, 4.1, 7.8, 4.2],
      [-1.2, 2.5, 16.2, 4.8, 5.0, 3.5],
      [4.0, 3.2, 18.0, 4.3, 6.4, 4.4],
      [9.3, 2.2, 16.6, 4.7, 4.4, 3.8]
    ];

    farBuildings.forEach((b, index) => {
      this.createBox(`city-far-${index}`, new Vector3(b[0], b[1], b[2]), new Vector3(b[3], b[4], b[5]), far, index % 2 === 0 ? -0.025 : 0.025);
    });

    const nearBuildings = [
      { x: -9.0, z: 10.5, w: 3.7, h: 5.8, d: 3.4, mat: mid },
      { x: -4.7, z: 11.6, w: 3.2, h: 7.4, d: 3.6, mat: near },
      { x: -0.5, z: 10.9, w: 4.0, h: 4.9, d: 3.2, mat: mid },
      { x: 4.4, z: 11.7, w: 4.2, h: 6.7, d: 3.8, mat: near },
      { x: 9.0, z: 10.6, w: 3.6, h: 4.5, d: 3.1, mat: mid }
    ];

    nearBuildings.forEach((building, index) => {
      const y = building.h / 2 - 0.2;
      this.createBox(`city-near-${index}`, new Vector3(building.x, y, building.z), new Vector3(building.w, building.h, building.d), building.mat, index % 2 === 0 ? 0.018 : -0.018);
      this.createBox(`city-roof-${index}`, new Vector3(building.x, building.h - 0.12, building.z), new Vector3(building.w + 0.16, 0.18, building.d + 0.16), roofDetail);
      this.createCityWindows(index, building.x, building.z - building.d / 2 - 0.025, building.w, building.h, windows);
    });

    this.createBox('city-side-left', new Vector3(-13.0, 1.2, 5.0), new Vector3(5.0, 2.4, 7.0), mid, 0.03);
    this.createBox('city-side-right', new Vector3(13.0, 1.5, 5.2), new Vector3(5.2, 3.0, 7.4), mid, -0.03);
  }

  private createCityWindows(index: number, centerX: number, frontZ: number, width: number, height: number, material: StandardMaterial): void {
    const columns = Math.max(2, Math.floor(width / 1.05));
    const rows = Math.max(2, Math.min(5, Math.floor(height / 1.25)));

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        if ((row + column + index) % 4 === 0) continue;
        const x = centerX + (column - (columns - 1) / 2) * 0.78;
        const y = 0.85 + row * 1.10;
        this.createBox(`city-window-${index}-${row}-${column}`, new Vector3(x, y, frontZ), new Vector3(0.34, 0.48, 0.035), material);
      }
    }
  }

  private createShadowPlate(
    name: string,
    x: number,
    z: number,
    width: number,
    depth: number,
    material: StandardMaterial,
    rotationY = 0
  ): void {
    this.createBox(name, new Vector3(x, 0.018, z), new Vector3(width, 0.015, depth), material, rotationY);
  }

  private shadowMaterial(): StandardMaterial {
    const material = new StandardMaterial('static-shadow-mat', this.scene);
    material.diffuseColor = new Color3(0.035, 0.045, 0.055);
    material.specularColor = Color3.Black();
    material.alpha = 0.18;
    material.disableLighting = true;
    return material;
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
    material.specularColor = new Color3(0.055, 0.055, 0.055);
    material.roughness = 0.88;
    return material;
  }
}
