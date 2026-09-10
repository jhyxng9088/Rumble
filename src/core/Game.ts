import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FollowCamera } from '../camera/FollowCamera';
import { PlayerCharacter } from '../character/PlayerCharacter';
import { InputController } from '../input/InputController';
import { ArenaWorld } from '../world/ArenaWorld';

export class Game {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly player: PlayerCharacter;
  private readonly camera: FollowCamera;
  private readonly input: InputController;

  constructor(
    canvas: HTMLCanvasElement,
    joystickElement: HTMLElement
  ) {
    // Keep WebGL context creation conservative for Safari/WKWebView.
    // Babylon's defaults already provide the normal WebGL2 -> WebGL1 fallback path.
    this.engine = new Engine(canvas, false);
    this.applyResolutionCap();

    this.scene = new Scene(this.engine);
    const world = new ArenaWorld(this.scene);
    this.player = new PlayerCharacter(this.scene, world.spawnPoint);
    this.camera = new FollowCamera(this.scene, this.player.root.position);
    this.input = new InputController(joystickElement);

    window.addEventListener('resize', this.handleResize, { passive: true });
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  start(): void {
    this.engine.runRenderLoop(() => {
      const deltaSeconds = Math.min(this.engine.getDeltaTime() / 1000, 1 / 30);
      const inputVector = this.input.movement;
      const worldDirection = this.camera.toWorldDirection(inputVector.x, inputVector.y);

      this.player.update(deltaSeconds, worldDirection, inputVector.length());
      this.camera.update(deltaSeconds, this.player.root.position);
      this.scene.render();
    });
  }

  private readonly handleResize = (): void => {
    this.applyResolutionCap();
    this.engine.resize();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.input.reset();
    }
  };

  private applyResolutionCap(): void {
    const cappedDpr = Math.min(window.devicePixelRatio || 1, 1.65);
    this.engine.setHardwareScalingLevel(1 / cappedDpr);
  }
}
