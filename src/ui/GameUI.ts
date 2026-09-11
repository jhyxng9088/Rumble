import type { StylizedFighter } from '../character/StylizedFighter';

export class GameUI {
  readonly joystickElement: HTMLDivElement;
  readonly lightButton: HTMLButtonElement;
  readonly heavyButton: HTMLButtonElement;
  readonly dodgeButton: HTMLButtonElement;
  private readonly bootStatus: HTMLDivElement;
  private readonly playerHealth: HTMLDivElement;
  private readonly rivalHealth: HTMLDivElement;
  private readonly rageFill: HTMLDivElement;
  private readonly centerStatus: HTMLDivElement;

  constructor(root: HTMLElement) {
    root.replaceChildren();
    const brand = document.createElement('div');
    brand.className = 'brand-lockup';
    brand.innerHTML = '<strong>RUMBLE</strong><span>3D COMBAT PROTOTYPE</span>';

    const top = document.createElement('div');
    top.className = 'fight-hud';
    top.innerHTML = '<div class="fighter-bar"><span>YOU</span><div class="health"><i data-health="player"></i></div><div class="rage"><i data-rage></i></div></div><div class="fight-center" data-status>MOVE · DODGE · COUNTER</div><div class="fighter-bar fighter-bar--rival"><span>RIVAL</span><div class="health"><i data-health="rival"></i></div></div>';

    this.playerHealth = top.querySelector<HTMLDivElement>('[data-health="player"]')!;
    this.rivalHealth = top.querySelector<HTMLDivElement>('[data-health="rival"]')!;
    this.rageFill = top.querySelector<HTMLDivElement>('[data-rage]')!;
    this.centerStatus = top.querySelector<HTMLDivElement>('[data-status]')!;

    this.joystickElement = document.createElement('div');
    this.joystickElement.className = 'joystick';
    this.joystickElement.setAttribute('aria-label', '이동 조이스틱');
    this.joystickElement.innerHTML = '<div class="joystick-ring"></div><div class="joystick-knob"></div>';

    const actions = document.createElement('div');
    actions.className = 'action-cluster';
    this.dodgeButton = this.button('DODGE', 'action action--dodge');
    this.heavyButton = this.button('HEAVY', 'action action--heavy');
    this.lightButton = this.button('HIT', 'action action--light');
    actions.append(this.dodgeButton, this.heavyButton, this.lightButton);

    this.bootStatus = document.createElement('div');
    this.bootStatus.className = 'boot-status';
    this.bootStatus.textContent = '3D 초기화 중…';
    root.append(brand, top, this.joystickElement, actions, this.bootStatus);
  }

  update(player: StylizedFighter, rival: StylizedFighter): void {
    this.playerHealth.style.transform = `scaleX(${player.health / player.maxHealth})`;
    this.rivalHealth.style.transform = `scaleX(${rival.health / rival.maxHealth})`;
    this.rageFill.style.transform = `scaleX(${player.rage / 100})`;
    if (player.state === 'ko') this.centerStatus.textContent = 'YOU GOT DROPPED';
    else if (rival.state === 'ko') this.centerStatus.textContent = 'RIVAL DOWN';
    else if (player.rage >= 100) this.centerStatus.textContent = 'RAGE FULL';
    else this.centerStatus.textContent = 'MOVE · DODGE · COUNTER';
  }

  markReady(): void { this.bootStatus.remove(); }

  showFatal(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.bootStatus.className = 'boot-status boot-status--fatal';
    this.bootStatus.textContent = `3D 초기화 실패\n${message}`;
    this.joystickElement.hidden = true;
    this.lightButton.hidden = true;
    this.heavyButton.hidden = true;
    this.dodgeButton.hidden = true;
  }

  private button(label: string, className: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    return button;
  }
}
