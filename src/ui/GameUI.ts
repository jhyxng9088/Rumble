import { Fighter } from '../character/Fighter';

export class GameUI {
  readonly root: HTMLElement;
  private readonly playerFill: HTMLElement;
  private readonly rivalFill: HTMLElement;
  private readonly playerRage: HTMLElement;
  private readonly status: HTMLElement;

  constructor(host: HTMLElement) {
    host.innerHTML = `
      <section class="hud" aria-label="RUMBLE controls">
        <div class="top-hud">
          <div class="fighter-hud fighter-hud--player">
            <div class="fighter-name">YOU</div>
            <div class="health-track"><div class="health-fill health-fill--player" data-ui="player-health"></div></div>
            <div class="rage-track"><div class="rage-fill" data-ui="player-rage"></div></div>
          </div>
          <div class="round-mark">RUMBLE</div>
          <div class="fighter-hud fighter-hud--rival">
            <div class="fighter-name">RIVAL</div>
            <div class="health-track"><div class="health-fill health-fill--rival" data-ui="rival-health"></div></div>
          </div>
        </div>
        <div class="status" data-ui="status">MOVE • DODGE • COUNTER</div>
        <div class="mobile-controls">
          <div class="move-zone" data-control="move-zone" aria-label="movement joystick">
            <div class="move-ring"></div>
            <div class="move-knob" data-control="move-knob"></div>
          </div>
          <div class="action-cluster">
            <button class="action action--dodge" data-action="dodge" type="button"><span>DODGE</span></button>
            <button class="action action--heavy" data-action="heavy" type="button"><span>HEAVY</span></button>
            <button class="action action--light" data-action="light" type="button"><span>HIT</span></button>
          </div>
        </div>
        <div class="desktop-help">WASD / ARROWS · J HIT · K HEAVY · SPACE DODGE</div>
      </section>
    `;
    this.root = host;
    this.playerFill = this.required('[data-ui="player-health"]');
    this.rivalFill = this.required('[data-ui="rival-health"]');
    this.playerRage = this.required('[data-ui="player-rage"]');
    this.status = this.required('[data-ui="status"]');
  }

  update(player: Fighter, rival: Fighter): void {
    this.playerFill.style.transform = `scaleX(${player.health / player.maxHealth})`;
    this.rivalFill.style.transform = `scaleX(${rival.health / rival.maxHealth})`;
    this.playerRage.style.transform = `scaleX(${player.rage / 100})`;
    if (player.state === 'ko') this.status.textContent = 'YOU GOT DROPPED';
    else if (rival.state === 'ko') this.status.textContent = 'RIVAL DOWN';
    else if (player.rage >= 100) this.status.textContent = 'RAGE FULL';
    else this.status.textContent = 'MOVE • DODGE • COUNTER';
  }

  private required(selector: string): HTMLElement {
    const element = this.root.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing UI element: ${selector}`);
    return element;
  }
}
