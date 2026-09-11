import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';

interface BurstPiece {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
  total: number;
}

interface RingPiece {
  mesh: Mesh;
  life: number;
  total: number;
}

export class ImpactEffects {
  private readonly burst: BurstPiece[] = [];
  private readonly rings: RingPiece[] = [];
  private readonly warm: StandardMaterial;
  private readonly white: StandardMaterial;
  private readonly hot: StandardMaterial;

  constructor(private readonly scene: Scene) {
    this.warm = this.effectMaterial('impact-warm', new Color3(1, 0.40, 0.10));
    this.white = this.effectMaterial('impact-white', new Color3(1, 0.94, 0.70));
    this.hot = this.effectMaterial('impact-hot', new Color3(1, 0.12, 0.04));
  }

  spawnImpact(position: Vector3, strong: boolean, direction: Vector3): void {
    this.spawnBurst(position, direction, strong ? 18 : 10, strong ? 4.8 : 3.5, strong ? 0.30 : 0.21, strong);
    this.spawnRing(position, strong ? 1.05 : 0.72, strong ? 0.24 : 0.16, this.white);
  }

  spawnExplosion(position: Vector3): void {
    this.spawnBurst(position, Vector3.Up(), 28, 6.0, 0.38, true);
    this.spawnRing(position, 1.15, 0.30, this.hot);
    this.spawnRing(position, 1.75, 0.36, this.warm);
  }

  update(deltaSeconds: number): void {
    for (const piece of this.burst) {
      piece.life -= deltaSeconds;
      piece.mesh.position.addInPlace(piece.velocity.scale(deltaSeconds));
      piece.velocity.y -= 4.2 * deltaSeconds;
      piece.velocity.scaleInPlace(Math.exp(-4.8 * deltaSeconds));
      piece.mesh.scaling.setAll(Math.max(0.08, piece.life / piece.total));
    }
    for (const ring of this.rings) {
      ring.life -= deltaSeconds;
      const progress = 1 - ring.life / ring.total;
      ring.mesh.scaling.setAll(0.72 + progress * 1.35);
    }
    this.cleanup(this.burst);
    this.cleanup(this.rings);
  }

  private spawnBurst(position: Vector3, direction: Vector3, count: number, speed: number, total: number, strong: boolean): void {
    for (let index = 0; index < count; index += 1) {
      const mesh = CreateSphere(`impact-${performance.now()}-${index}`, { diameter: strong ? 0.12 : 0.08, segments: 6 }, this.scene);
      mesh.position.copyFrom(position);
      mesh.material = index % 4 === 0 ? this.white : index % 3 === 0 ? this.hot : this.warm;
      const planar = direction.lengthSquared() > 0.01 ? direction.normalizeToNew() : new Vector3(1, 0, 0);
      const velocity = new Vector3(
        planar.x * speed * (0.55 + Math.random() * 0.65) + (Math.random() - 0.5) * 4.2,
        1.0 + Math.random() * speed * 0.75,
        planar.z * speed * (0.55 + Math.random() * 0.65) + (Math.random() - 0.5) * 4.2,
      );
      this.burst.push({ mesh, velocity, life: total, total });
    }
  }

  private spawnRing(position: Vector3, diameter: number, total: number, material: StandardMaterial): void {
    const ring = CreateTorus(`impact-ring-${performance.now()}-${diameter}`, { diameter, thickness: 0.055, tessellation: 24 }, this.scene);
    ring.position.copyFrom(position);
    ring.rotation.x = Math.PI / 2;
    ring.material = material;
    this.rings.push({ mesh: ring, life: total, total });
  }

  private cleanup<T extends { mesh: Mesh; life: number }>(items: T[]): void {
    let write = 0;
    for (let read = 0; read < items.length; read += 1) {
      const item = items[read];
      if (item.life > 0) items[write++] = item;
      else item.mesh.dispose();
    }
    items.length = write;
  }

  private effectMaterial(name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.emissiveColor = color;
    material.specularColor = Color3.Black();
    material.disableLighting = true;
    return material;
  }
}
