export class GameUI {
  readonly joystickElement: HTMLDivElement;
  private readonly bootStatus: HTMLDivElement;

  constructor(root: HTMLElement) {
    root.replaceChildren();

    const brand = document.createElement('div');
    brand.className = 'brand-chip';
    brand.innerHTML = '<strong>RUMBLE</strong><span>STAGE 1</span>';

    const hint = document.createElement('div');
    hint.className = 'move-hint';
    hint.textContent = '왼쪽 스틱으로 이동';

    this.joystickElement = document.createElement('div');
    this.joystickElement.className = 'joystick';
    this.joystickElement.setAttribute('aria-label', '이동 조이스틱');
    this.joystickElement.innerHTML = '<div class="joystick-ring"></div><div class="joystick-knob"></div>';

    this.bootStatus = document.createElement('div');
    this.bootStatus.className = 'boot-status';
    this.bootStatus.textContent = '3D 초기화 중…';

    root.append(brand, hint, this.joystickElement, this.bootStatus);
  }

  markReady(): void {
    this.bootStatus.remove();
  }

  showFatal(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.bootStatus.className = 'boot-status boot-status--fatal';
    this.bootStatus.textContent = `3D 초기화 실패\n${message}`;
    this.joystickElement.hidden = true;
  }
}
