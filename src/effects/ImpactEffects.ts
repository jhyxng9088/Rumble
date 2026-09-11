import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { AttackKind } from '../character/StylizedFighter';

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
  private readonly evade: StandardMaterial;

  constructor(private readonly scene: Scene) {
    this.warm = this.effectMaterial('impact-warm', new Color3(1, 0.34, 0.12));
    this.white = this.effectMaterial('impact-white', new Color3(1, 0.92, 0.68));
    this.evade = this.effectMaterial('impact-evade', new Color3(0.26, 0.95, 0.87));
  }

  spawnHit(position: Vector3, kind: AttackKind, direction: Vector3): void {
    const count = kind === 'heavy' ? 18 : 10;
    for (let index = 0; index < count; index += 1) {
      const mesh = CreateSphere(`impact-${kind}-${performance.now()}-${index}`, { diameter: kind === 'heavy' ? 0.12 : 0.08, segments: 6 }, this.scene);
      mesh.position.copyFrom(position);
      mesh.material = index % 3 === 0 ? this.white : this.warm;
      const spread = new Vector3(
        direction.x * (2.2 + Math.random() * 3.0) + (Math.random() - 0.5) * 2.8,
        (Math.random() - 0.15) * 3.2,
        direction.z * (2.2 + Math.random() * 3.0) + (Math.random() - 0.5) * 2.8,
      );
      const total = kind === 'heavy' ? 0.30 : 0.20;
      this.burst.push({ mesh, velocity: spread, life: total, total });
    }

    const ring = CreateTorus(`impact-ring-${performance.now()}`, { diameter: kind === 'heavy' ? 1.0 : 0.72, thickness: 0.055, tessellation: 24 }, this.scene);
    ring.position.copyFrom(position);
    ring.rotation.x = Math.PI / 2;
    ring.material = this.white;
    const total = kind === 'heavy' ? 0.24 : 0.16;
    this.rings.push({ mesh: ring, life: total, total });
  }

  spawnEvade(position: Vector3): void {
    const ring = CreateTorus(`evade-ring-${performance.now()}`, { diameter: 0.82, thickness: 0.035, tessellation: 24 }, this.scene);
    ring.position.copyFrom(position);
    ring.rotation.x = Math.PI / 2;
    ring.material = this.evade;
    this.rings.push({ mesh: ring, life: 0.18, total: 0.18 });
  }

  update(deltaSeconds: number): void {
    for (const piece of this.burst) {
      piece.life -= deltaSeconds;
      piece.mesh.position.addInPlace(piece.velocity.scale(deltaSeconds));
      piece.velocity.scaleInPlace(Math.exp(-5 * deltaSeconds));
      piece.mesh.scaling.setAll(Math.max(0.1, piece.life / piece.total));
    }
    for (const ring of this.rings) {
      ring.life -= deltaSeconds;
      const progress = 1 - ring.life / ring.total;
      ring.mesh.scaling.setAll(0.75 + progress * 1.15);
    }
    this.cleanup(this.burst);
    this.cleanup(this.rings);
  }

  private cleanup<T extends { mesh: Mesh; life: number }>(items: T[]): void {
    let write = 0;
    for (let read = 0; read < items.length; read += 1) {
      const item = items[read];
      if (item.life > 0) {
        items[write] = item;
        write += 1;
      } else {
        item.mesh.dispose();
      }
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
