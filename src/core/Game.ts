import { Engine } from '@babylonjs/core/Engines/engine';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { FollowCamera } from '../camera/FollowCamera';
import { AnimalFighter } from '../character/AnimalFighter';
import { ImpactEffects } from '../effects/ImpactEffects';
import { InputController } from '../input/InputController';
import { ThrowableSystem } from '../throwing/ThrowableSystem';
import { GameUI } from '../ui/GameUI';
import { ArenaWorld } from '../world/ArenaWorld';

export class Game {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly world: ArenaWorld;
  private readonly player: AnimalFighter;
  private readonly rival: AnimalFighter;
  private readonly camera: FollowCamera;
  private readonly input: InputController;
  private readonly effects: ImpactEffects;
  private readonly throwing: ThrowableSystem;
  private readonly ui: GameUI;
  private rivalThink = 0;

  constructor(canvas: HTMLCanvasElement, ui: GameUI) {
    this.ui = ui;
    this.engine = new Engine(canvas, false);
    this.applyResolutionCap();
    this.scene = new Scene(this.engine);
    this.world = new ArenaWorld(this.scene);
    this.player = new AnimalFighter(this.scene, 'player', {
      name: 'FOX', kind: 'fox', spawn: new Vector3(-2.2, 0.02, -0.8),
      palette: { fur: new Color3(0.92, 0.35, 0.08), furLight: new Color3(0.98, 0.82, 0.63), furDark: new Color3(0.16, 0.10, 0.09), accent: new Color3(0.10, 0.46, 0.92) },
    });
    this.rival = new AnimalFighter(this.scene, 'rival', {
      name: 'RACCOON', kind: 'raccoon', spawn: new Vector3(2.4, 0.02, 0.8),
      palette: { fur: new Color3(0.48, 0.51, 0.55), furLight: new Color3(0.76, 0.77, 0.75), furDark: new Color3(0.10, 0.11, 0.13), accent: new Color3(0.26, 0.78, 0.58) },
    });
    const midpoint = this.player.position.add(this.rival.position).scale(0.5);
    this.camera = new FollowCamera(this.scene, midpoint);
    this.effects = new ImpactEffects(this.scene);
    this.throwing = new ThrowableSystem(this.scene, this.effects, this.camera);
    this.input = new InputController(ui.joystickElement, ui.pickupButton, ui.throwButton, ui.dodgeButton);
    window.addEventListener('resize', this.handleResize, { passive: true });
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  start(): void {
    this.engine.runRenderLoop(() => {
      const deltaSeconds = Math.min(this.engine.getDeltaTime() / 1000, 1 / 30);
      if (!this.throwing.consumeHitStop(deltaSeconds)) this.update(deltaSeconds);
      this.effects.update(deltaSeconds);
      const target = this.player.position.add(this.rival.position).scale(0.5);
      this.camera.update(deltaSeconds, target);
      this.ui.update(this.player, this.rival, this.throwing.heldLabel(this.player));
      this.scene.render();
    });
  }

  private update(deltaSeconds: number): void {
    const movement = this.input.movement;
    const worldDirection = this.camera.toWorldDirection(movement.x, movement.y);
    const actions = this.input.readActions();

    this.player.update(deltaSeconds);
    this.rival.update(deltaSeconds);
    this.player.faceTarget(this.rival.position, deltaSeconds);
    this.rival.faceTarget(this.player.position, deltaSeconds);
    this.player.move(deltaSeconds, worldDirection, movement.length());

    if (actions.pickup) this.throwing.tryPickup(this.player);
    if (actions.throwItem) {
      const targetDirection = this.rival.position.subtract(this.player.position);
      targetDirection.y = 0;
      this.throwing.throwHeld(this.player, targetDirection);
    }
    if (actions.dodge) this.player.startDodge(worldDirection);

    this.updateRival(deltaSeconds);
    this.throwing.update(deltaSeconds, this.player, this.rival);
    this.world.constrainPlayerPosition(this.player.position, this.player.collisionRadius);
    this.world.constrainPlayerPosition(this.rival.position, this.rival.collisionRadius);
  }

  private updateRival(deltaSeconds: number): void {
    if (!this.rival.isAlive || !this.player.isAlive) return;
    this.rivalThink -= deltaSeconds;
    const toPlayer = this.player.position.subtract(this.rival.position);
    toPlayer.y = 0;
    const playerDistance = toPlayer.length();

    if (this.throwing.hasHeld(this.rival)) {
      if (this.rivalThink <= 0 && playerDistance < 7.4) {
        this.rivalThink = 0.55 + Math.random() * 0.42;
        const aim = toPlayer.clone();
        aim.x += (Math.random() - 0.5) * 0.55;
        aim.z += (Math.random() - 0.5) * 0.55;
        this.throwing.throwHeld(this.rival, aim);
      } else if (playerDistance > 4.8) {
        this.rival.move(deltaSeconds * 0.76, toPlayer.normalizeToNew(), 0.78);
      }
      return;
    }

    const pickupTarget = this.throwing.nearestGroundPosition(this.rival.position);
    if (!pickupTarget) return;
    const toItem = pickupTarget.subtract(this.rival.position);
    toItem.y = 0;
    if (toItem.length() <= 1.22) {
      this.throwing.tryPickup(this.rival);
      this.rivalThink = 0.28;
      return;
    }
    this.rival.move(deltaSeconds * 0.84, toItem.normalizeToNew(), 0.92);

    if (this.rivalThink <= 0 && playerDistance < 2.2 && Math.random() < 0.25) {
      this.rival.startDodge(Vector3.Cross(Vector3.Up(), toPlayer.normalizeToNew()));
      this.rivalThink = 0.7;
    }
  }

  private readonly handleResize = (): void => {
    this.applyResolutionCap();
    this.engine.resize();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) this.input.reset();
  };

  private applyResolutionCap(): void {
    const cappedDpr = Math.min(window.devicePixelRatio || 1, 1.55);
    this.engine.setHardwareScalingLevel(1 / cappedDpr);
  }
}
