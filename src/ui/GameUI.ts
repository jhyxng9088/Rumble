import type { AnimalFighter } from '../character/AnimalFighter';

export class GameUI {
  readonly joystickElement: HTMLDivElement;
  readonly pickupButton: HTMLButtonElement;
  readonly throwButton: HTMLButtonElement;
  readonly dodgeButton: HTMLButtonElement;
  private readonly bootStatus: HTMLDivElement;
  private readonly playerHealth: HTMLDivElement;
  private readonly rivalHealth: HTMLDivElement;
  private readonly centerStatus: HTMLDivElement;

  constructor(root: HTMLElement) {
    root.replaceChildren();
    const brand = document.createElement('div');
    brand.className = 'brand-lockup';
    brand.innerHTML = '<strong>RUMBLE</strong><span>ANIMAL THROW BRAWL</span>';

    const top = document.createElement('div');
    top.className = 'fight-hud';
    top.innerHTML = '<div class="fighter-bar"><span>FOX</span><div class="health"><i data-health="player"></i></div></div><div class="fight-center" data-status>GRAB SOMETHING · THROW IT</div><div class="fighter-bar fighter-bar--rival"><span>RACCOON</span><div class="health"><i data-health="rival"></i></div></div>';
    this.playerHealth = top.querySelector<HTMLDivElement>('[data-health="player"]')!;
    this.rivalHealth = top.querySelector<HTMLDivElement>('[data-health="rival"]')!;
    this.centerStatus = top.querySelector<HTMLDivElement>('[data-status]')!;

    this.joystickElement = document.createElement('div');
    this.joystickElement.className = 'joystick';
    this.joystickElement.setAttribute('aria-label', '이동 조이스틱');
    this.joystickElement.innerHTML = '<div class="joystick-ring"></div><div class="joystick-knob"></div>';

    const actions = document.createElement('div');
    actions.className = 'action-cluster';
    this.dodgeButton = this.button('DODGE', 'action action--dodge');
    this.throwButton = this.button('THROW', 'action action--heavy');
    this.pickupButton = this.button('GRAB', 'action action--light');
    actions.append(this.dodgeButton, this.throwButton, this.pickupButton);

    this.bootStatus = document.createElement('div');
    this.bootStatus.className = 'boot-status';
    this.bootStatus.textContent = '난투 준비 중…';
    root.append(brand, top, this.joystickElement, actions, this.bootStatus);
  }

  update(player: AnimalFighter, rival: AnimalFighter, heldLabel: string): void {
    this.playerHealth.style.transform = `scaleX(${player.health / player.maxHealth})`;
    this.rivalHealth.style.transform = `scaleX(${rival.health / rival.maxHealth})`;
    if (player.state === 'ko') this.centerStatus.textContent = 'RACCOON WINS';
    else if (rival.state === 'ko') this.centerStatus.textContent = 'FOX WINS';
    else if (heldLabel !== 'EMPTY') this.centerStatus.textContent = `HOLDING ${heldLabel} · THROW!`;
    else this.centerStatus.textContent = 'GET CLOSE · GRAB SOMETHING';
  }

  markReady(): void { this.bootStatus.remove(); }

  showFatal(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.bootStatus.className = 'boot-status boot-status--fatal';
    this.bootStatus.textContent = `RUMBLE 시작 실패\n${message}`;
    this.joystickElement.hidden = true;
    this.pickupButton.hidden = true;
    this.throwButton.hidden = true;
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
