import { FreeCamera, Scene, Vector3 } from '@babylonjs/core';

const CAMERA_OFFSET = new Vector3(0, 10.5, -10.8);
const LOOK_AHEAD = new Vector3(0, 0.65, 1.1);

export class FollowCamera {
  readonly camera: FreeCamera;
  private readonly desiredPosition = Vector3.Zero();
  private readonly lookTarget = Vector3.Zero();
  private readonly forwardOnGround = Vector3.Zero();
  private readonly rightOnGround = Vector3.Zero();

  constructor(scene: Scene, initialTarget: Vector3) {
    this.camera = new FreeCamera('follow-camera', initialTarget.add(CAMERA_OFFSET), scene);
    this.camera.minZ = 0.1;
    this.camera.fov = 0.78;
    this.camera.inputs.clear();
    scene.activeCamera = this.camera;

    this.snapTo(initialTarget);
  }

  update(deltaSeconds: number, target: Vector3): void {
    this.desiredPosition.copyFrom(target).addInPlace(CAMERA_OFFSET);
    const followAlpha = 1 - Math.exp(-6.2 * deltaSeconds);
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
    const forward = this.camera.getForwardRay().direction;
    this.forwardOnGround.set(forward.x, 0, forward.z).normalize();
    Vector3.CrossToRef(Vector3.Up(), this.forwardOnGround, this.rightOnGround);
    this.rightOnGround.normalize();
  }
}
