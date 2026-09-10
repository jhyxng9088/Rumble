import { Color4, Engine, Scene } from "@babylonjs/core";
import { FollowCamera } from "../camera/FollowCamera";
import { PlayerCharacter } from "../character/PlayerCharacter";
import { InputController } from "../input/InputController";
import { VirtualJoystick } from "../ui/VirtualJoystick";
import { RooftopWorld } from "../world/RooftopWorld";

interface GameElements {
  canvas: HTMLCanvasElement;
  joystick: HTMLElement;
  joystickKnob: HTMLElement;
}

export class Game {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly input: InputController;
  private readonly joystick: VirtualJoystick;
  private readonly world: RooftopWorld;
  private readonly player: PlayerCharacter;
  private readonly camera: FollowCamera;
  private disposed = false;

  private readonly handleResize = (): void => {
    this.applyResolutionPolicy();
    this.engine.resize();
  };

  constructor(private readonly elements: GameElements) {
    this.engine = new Engine(
      elements.canvas,
      true,
      {
        preserveDrawingBuffer: false,
        stencil: false,
        powerPreference: "high-performance",
      },
      false,
    );
    this.applyResolutionPolicy();

    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.53, 0.67, 0.78, 1);
    this.scene.skipPointerMovePicking = true;

    this.input = new InputController();
    this.world = new RooftopWorld(this.scene);
    this.player = new PlayerCharacter(this.scene, this.world);
    this.camera = new FollowCamera(this.scene, this.player.position);
    this.joystick = new VirtualJoystick(
      elements.joystick,
      elements.joystickKnob,
      (move, active) => this.input.setTouchMove(move, active),
    );

    window.addEventListener("resize", this.handleResize);
  }

  start(): void {
    this.engine.runRenderLoop(() => {
      if (this.disposed) {
        return;
      }

      const deltaSeconds = Math.min(this.engine.getDeltaTime() / 1000, 1 / 30);
      const worldMove = this.camera.screenToWorld(this.input.getMove());
      this.player.update(worldMove, deltaSeconds);
      this.camera.update(deltaSeconds, this.player.position);
      this.scene.render();
    });
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    window.removeEventListener("resize", this.handleResize);
    this.joystick.dispose();
    this.input.dispose();
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }

  private applyResolutionPolicy(): void {
    const deviceDpr = Math.max(1, window.devicePixelRatio || 1);
    const targetDpr = Math.min(deviceDpr, 1.6);
    this.engine.setHardwareScalingLevel(deviceDpr / targetDpr);
  }
}
