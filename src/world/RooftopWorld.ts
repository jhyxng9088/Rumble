import {
  Color3,
  DirectionalLight,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import {
  moveCircleWithColliders,
  type ArenaBounds,
  type AxisAlignedObstacle,
} from "./collision";

interface ObstacleSpec {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
}

const ARENA_BOUNDS: ArenaBounds = {
  minX: -7.35,
  maxX: 7.35,
  minZ: -5.35,
  maxZ: 5.35,
};

const OBSTACLE_SPECS: readonly ObstacleSpec[] = [
  { x: -2.7, z: 1.7, width: 1.8, depth: 1.6, height: 1.4 },
  { x: 2.75, z: -1.35, width: 1.7, depth: 1.7, height: 1.25 },
  { x: 0.85, z: 3.4, width: 2.2, depth: 1.15, height: 1.0 },
];

export class RooftopWorld {
  private readonly obstacles: AxisAlignedObstacle[];

  constructor(private readonly scene: Scene) {
    this.obstacles = OBSTACLE_SPECS.map((spec) => ({
      minX: spec.x - spec.width / 2,
      maxX: spec.x + spec.width / 2,
      minZ: spec.z - spec.depth / 2,
      maxZ: spec.z + spec.depth / 2,
    }));

    this.createLighting();
    this.createArena();
  }

  moveCharacter(position: Vector3, displacement: Vector3, radius: number): Vector3 {
    const next = moveCircleWithColliders(
      { x: position.x, z: position.z },
      { x: displacement.x, z: displacement.z },
      radius,
      ARENA_BOUNDS,
      this.obstacles,
    );
    return new Vector3(next.x, position.y, next.z);
  }

  private createLighting(): void {
    const ambient = new HemisphericLight("worldAmbient", new Vector3(0.25, 1, -0.2), this.scene);
    ambient.intensity = 1.0;
    ambient.diffuse = Color3.FromHexString("#dbeafe");
    ambient.groundColor = Color3.FromHexString("#64748b");

    const sun = new DirectionalLight("worldSun", new Vector3(-0.45, -1, 0.35), this.scene);
    sun.intensity = 0.72;
    sun.diffuse = Color3.FromHexString("#fff1d6");
  }

  private createArena(): void {
    const floorMaterial = this.material("floorMaterial", "#c7b8a5", "#1f2937");
    const railMaterial = this.material("railMaterial", "#6b7280", "#0f172a");
    const crateMaterial = this.material("crateMaterial", "#b77945", "#2b1b11");

    const floor = MeshBuilder.CreateBox("rooftopFloor", { width: 16, depth: 12, height: 0.45 }, this.scene);
    floor.position.y = -0.225;
    floor.material = floorMaterial;
    floor.isPickable = false;

    this.createWall("railNorth", 0, 6.05, 16.5, 0.38, railMaterial);
    this.createWall("railSouth", 0, -6.05, 16.5, 0.38, railMaterial);
    this.createWall("railEast", 8.05, 0, 0.38, 12.5, railMaterial);
    this.createWall("railWest", -8.05, 0, 0.38, 12.5, railMaterial);

    OBSTACLE_SPECS.forEach((spec, index) => {
      const crate = MeshBuilder.CreateBox(
        `crate-${index}`,
        { width: spec.width, depth: spec.depth, height: spec.height },
        this.scene,
      );
      crate.position.set(spec.x, spec.height / 2, spec.z);
      crate.rotation.y = index === 0 ? 0.08 : index === 1 ? -0.12 : 0.04;
      crate.material = crateMaterial;
      crate.isPickable = false;
    });
  }

  private createWall(
    name: string,
    x: number,
    z: number,
    width: number,
    depth: number,
    material: StandardMaterial,
  ): void {
    const wall = MeshBuilder.CreateBox(name, { width, depth, height: 0.9 }, this.scene);
    wall.position.set(x, 0.45, z);
    wall.material = material;
    wall.isPickable = false;
  }

  private material(name: string, diffuse: string, specular: string): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = Color3.FromHexString(diffuse);
    material.specularColor = Color3.FromHexString(specular).scale(0.12);
    return material;
  }
}
