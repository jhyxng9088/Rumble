import { FreeCamera, Scene, Vector3 } from "@babylonjs/core";
import type { MoveInput } from "../input/InputController";

export class FollowCamera {
  private readonly camera: FreeCamera;
  private readonly offset = new Vector3(10.2, 14.2, -10.2);
  private readonly smoothedFocus: Vector3;
  private readonly forward: Vector3;
  private readonly right: Vector3;

  constructor(scene: Scene, initialTarget: Vector3) {
    this.smoothedFocus = initialTarget.add(new Vector3(0, 0.82, 0));
    this.camera = new FreeCamera("followCamera", this.smoothedFocus.add(this.offset), scene);
    this.camera.inputs.clear();
    this.camera.fov = 0.68;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 80;
    this.camera.setTarget(this.smoothedFocus);
    scene.activeCamera = this.camera;

    this.forward = this.offset.scale(-1);
    this.forward.y = 0;
    this.forward.normalize();
    this.right = Vector3.Cross(Vector3.Up(), this.forward).normalize();
  }

  screenToWorld(move: MoveInput): Vector3 {
    const worldMove = this.right.scale(move.x).addInPlace(this.forward.scale(move.y));
    if (worldMove.lengthSquared() > 1) {
      worldMove.normalize();
    }
    return worldMove;
  }

  update(deltaSeconds: number, target: Vector3): void {
    const desiredFocus = target.add(new Vector3(0, 0.82, 0));
    const follow = 1 - Math.exp(-7.5 * deltaSeconds);
    Vector3.LerpToRef(this.smoothedFocus, desiredFocus, follow, this.smoothedFocus);
    this.camera.position.copyFrom(this.smoothedFocus.add(this.offset));
    this.camera.setTarget(this.smoothedFocus);
  }
}
