import { Engine } from '@babylonjs/core/Engines/engine';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { FollowCamera } from '../camera/FollowCamera';
import { StylizedFighter } from '../character/StylizedFighter';
import { CombatSystem } from '../combat/CombatSystem';
import { ImpactEffects } from '../effects/ImpactEffects';
import { InputController } from '../input/InputController';
import { GameUI } from '../ui/GameUI';
import { ArenaWorld } from '../world/ArenaWorld';

export class Game {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly world: ArenaWorld;
  private readonly player: StylizedFighter;
  private readonly rival: StylizedFighter;
  private readonly camera: FollowCamera;
  private readonly input: InputController;
  private readonly effects: ImpactEffects;
  private readonly combat: CombatSystem;
  private readonly ui: GameUI;
  private rivalThink = 0;

  constructor(canvas: HTMLCanvasElement, ui: GameUI) {
    this.ui = ui;
    this.engine = new Engine(canvas, false);
    this.applyResolutionCap();
    this.scene = new Scene(this.engine);
    this.world = new ArenaWorld(this.scene);
    this.player = new StylizedFighter(this.scene, 'player', {
      name: 'YOU', spawn: new Vector3(-1.8, 0.02, -0.45),
      palette: { skin: new Color3(0.80,0.58,0.42), top: new Color3(0.12,0.25,0.78), topDark: new Color3(0.035,0.07,0.22), pants: new Color3(0.08,0.09,0.14), glove: new Color3(0.95,0.16,0.09), shoe: new Color3(0.90,0.91,0.94) }
    });
    this.rival = new StylizedFighter(this.scene, 'rival', {
      name: 'RIVAL', spawn: new Vector3(1.8, 0.02, 0.45),
      palette: { skin: new Color3(0.62,0.42,0.31), top: new Color3(0.33,0.12,0.62), topDark: new Color3(0.09,0.035,0.17), pants: new Color3(0.09,0.10,0.12), glove: new Color3(0.08,0.78,0.67), shoe: new Color3(0.13,0.15,0.18) }
    });
    const midpoint = this.player.position.add(this.rival.position).scale(0.5);
    this.camera = new FollowCamera(this.scene, midpoint);
    this.effects = new ImpactEffects(this.scene);
    this.combat = new CombatSystem(this.effects, this.camera);
    this.input = new InputController(ui.joystickElement, ui.lightButton, ui.heavyButton, ui.dodgeButton);
    window.addEventListener('resize', this.handleResize, { passive: true });
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  start(): void {
    this.engine.runRenderLoop(() => {
      const deltaSeconds = Math.min(this.engine.getDeltaTime() / 1000, 1 / 30);
      if (!this.combat.consumeHitStop(deltaSeconds)) this.update(deltaSeconds);
      this.effects.update(deltaSeconds);
      const target = this.player.position.add(this.rival.position).scale(0.5);
      this.camera.update(deltaSeconds, target);
      this.ui.update(this.player, this.rival);
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

    if (actions.light) this.player.startAttack('light');
    if (actions.heavy) this.player.startAttack('heavy');
    if (actions.dodge) this.player.startDodge(worldDirection);

    this.updateRival(deltaSeconds);
    this.combat.resolve(this.player, this.rival);
    this.combat.resolve(this.rival, this.player);
    this.world.constrainPlayerPosition(this.player.position, this.player.collisionRadius);
    this.world.constrainPlayerPosition(this.rival.position, this.rival.collisionRadius);
  }

  private updateRival(deltaSeconds: number): void {
    if (this.rival.state === 'ko' || this.player.state === 'ko') return;
    const delta = this.player.position.subtract(this.rival.position);
    delta.y = 0;
    const distance = delta.length();
    this.rivalThink -= deltaSeconds;
    if (this.rivalThink <= 0) {
      this.rivalThink = 0.17 + Math.random() * 0.16;
      if (this.player.state === 'attack' && distance < 2.1 && Math.random() < 0.40) {
        const evade = Vector3.Cross(Vector3.Up(), delta.normalizeToNew()).scale(Math.random() < 0.5 ? 1 : -1);
        this.rival.startDodge(evade);
        return;
      }
      if (distance < 1.68 && Math.random() < 0.68) {
        this.rival.startAttack(Math.random() < 0.76 ? 'light' : 'heavy');
        return;
      }
    }
    if (distance > 1.35) this.rival.move(deltaSeconds * 0.82, delta.normalizeToNew(), 0.92);
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
