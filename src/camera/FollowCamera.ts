import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';

const CAMERA_OFFSET = new Vector3(6.8, 7.2, -8.8);
const LOOK_AHEAD = new Vector3(0, 0.82, 1.25);

export class FollowCamera {
  readonly camera: FreeCamera;
  private readonly desiredPosition = Vector3.Zero();
  private readonly lookTarget = Vector3.Zero();
  private readonly forwardOnGround = Vector3.Zero();
  private readonly rightOnGround = Vector3.Zero();

  constructor(scene: Scene, initialTarget: Vector3) {
    this.camera = new FreeCamera('follow-camera', initialTarget.add(CAMERA_OFFSET), scene);
    this.camera.minZ = 0.1;
    this.camera.fov = 0.68;
    this.camera.inputs.clear();
    scene.activeCamera = this.camera;

    this.snapTo(initialTarget);
  }

  update(deltaSeconds: number, target: Vector3): void {
    this.desiredPosition.copyFrom(target).addInPlace(CAMERA_OFFSET);
    const followAlpha = 1 - Math.exp(-5.1 * deltaSeconds);
    Vector3.LerpToRef(this.camera.position, this.desiredPosition, followAlpha, this.camera.position);

    this.lookTarget.copyFrom(target).addInPlace(LOOK_AHEAD);
    this.camera.setTarget(this.lookTarget);
    this.updateBasis();
  }

  toWorldDirection(screenX: number, screenY: number): Vector3 {
    if (Math.abs(screenX) < 0.0001 && Math.abs(screenY) < 0.0001) {
      return Vector3.Zero();
    }

    return this.rightOnGround.scale(screenX).add(this.forwardOnGround.scale(screenY)).normalize();
  }

  private snapTo(target: Vector3): void {
    this.camera.position.copyFrom(target).addInPlace(CAMERA_OFFSET);
    this.lookTarget.copyFrom(target).addInPlace(LOOK_AHEAD);
    this.camera.setTarget(this.lookTarget);
    this.updateBasis();
  }

  private updateBasis(): void {
    this.forwardOnGround.copyFrom(this.lookTarget).subtractInPlace(this.camera.position);
    this.forwardOnGround.y = 0;

    if (this.forwardOnGround.lengthSquared() < 0.0001) {
      this.forwardOnGround.set(0, 0, 1);
    } else {
      this.forwardOnGround.normalize();
    }

    Vector3.CrossToRef(Vector3.Up(), this.forwardOnGround, this.rightOnGround);
    this.rightOnGround.normalize();
  }
}
