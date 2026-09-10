import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';

const PORTRAIT_OFFSET = new Vector3(5.7, 7.4, -8.7);
const LANDSCAPE_OFFSET = new Vector3(7.2, 5.8, -9.2);
const PORTRAIT_LOOK_OFFSET = new Vector3(-0.30, 0.95, 2.45);
const LANDSCAPE_LOOK_OFFSET = new Vector3(-0.55, 0.92, 3.25);
const PORTRAIT_FOV = 0.82;
const LANDSCAPE_FOV = 0.76;

export class FollowCamera {
  readonly camera: FreeCamera;
  private readonly desiredPosition = Vector3.Zero();
  private readonly cameraOffset = Vector3.Zero();
  private readonly lookOffset = Vector3.Zero();
  private readonly lookTarget = Vector3.Zero();
  private readonly forwardOnGround = Vector3.Zero();
  private readonly rightOnGround = Vector3.Zero();

  constructor(private readonly scene: Scene, initialTarget: Vector3) {
    this.camera = new FreeCamera('follow-camera', initialTarget.add(PORTRAIT_OFFSET), scene);
    this.camera.minZ = 0.1;
    this.camera.maxZ = 90;
    this.camera.inputs.clear();
    scene.activeCamera = this.camera;

    this.refreshFraming();
    this.snapTo(initialTarget);
  }

  update(deltaSeconds: number, target: Vector3): void {
    this.refreshFraming();

    this.desiredPosition.copyFrom(target).addInPlace(this.cameraOffset);
    const followAlpha = 1 - Math.exp(-5.25 * deltaSeconds);
    Vector3.LerpToRef(this.camera.position, this.desiredPosition, followAlpha, this.camera.position);

    this.lookTarget.copyFrom(target).addInPlace(this.lookOffset);
    this.camera.setTarget(this.lookTarget);
    this.updateBasis();
  }

  toWorldDirection(screenX: number, screenY: number): Vector3 {
    if (Math.abs(screenX) < 0.0001 && Math.abs(screenY) < 0.0001) {
      return Vector3.Zero();
    }

    return this.rightOnGround.scale(screenX).add(this.forwardOnGround.scale(screenY)).normalize();
  }

  private refreshFraming(): void {
    const engine = this.scene.getEngine();
    const height = Math.max(engine.getRenderHeight(), 1);
    const aspect = engine.getRenderWidth() / height;
    const landscapeMix = Math.min(Math.max((aspect - 0.82) / 0.52, 0), 1);

    Vector3.LerpToRef(PORTRAIT_OFFSET, LANDSCAPE_OFFSET, landscapeMix, this.cameraOffset);
    Vector3.LerpToRef(PORTRAIT_LOOK_OFFSET, LANDSCAPE_LOOK_OFFSET, landscapeMix, this.lookOffset);
    this.camera.fov = PORTRAIT_FOV + (LANDSCAPE_FOV - PORTRAIT_FOV) * landscapeMix;
  }

  private snapTo(target: Vector3): void {
    this.camera.position.copyFrom(target).addInPlace(this.cameraOffset);
    this.lookTarget.copyFrom(target).addInPlace(this.lookOffset);
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
