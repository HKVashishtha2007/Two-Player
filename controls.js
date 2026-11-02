/**
 * Pixel Football Showdown - Input & Controls Manager
 * Handles desktop keyboard inputs, simultaneous key tracking, and mobile virtual touch controls.
 */

class Controls {
  constructor() {
    this.keys = new Set();
    this.touchP1 = {
      up: false,
      down: false,
      left: false,
      right: false,
      kick: false,
      sprint: false
    };

    this.onPauseToggle = null;
    this.onSoundToggle = null;
    this.isTouchDevice = false;

    this.initKeyboard();
    this.initTouchControls();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser from scrolling on arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      this.keys.add(e.code);
      this.keys.add(e.key.toLowerCase());

      // Global hotkeys
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (this.onPauseToggle) this.onPauseToggle();
      }
      if (e.code === 'KeyM') {
        if (this.onSoundToggle) this.onSoundToggle();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.keys.delete(e.key.toLowerCase());
    });

    // Reset keys if browser window loses focus
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.resetTouch();
    });
  }

  resetTouch() {
    this.touchP1.up = false;
    this.touchP1.down = false;
    this.touchP1.left = false;
    this.touchP1.right = false;
    this.touchP1.kick = false;
    this.touchP1.sprint = false;
  }

  initTouchControls() {
    // Detect touch capability
    window.addEventListener('touchstart', () => {
      this.isTouchDevice = true;
      const mobileLayer = document.getElementById('mobile-controls-layer');
      if (mobileLayer && mobileLayer.classList.contains('hidden')) {
        mobileLayer.classList.remove('hidden');
      }
    }, { once: true });

    // D-Pad buttons
    const dpadButtons = document.querySelectorAll('.dpad-btn');
    dpadButtons.forEach((btn) => {
      const dir = btn.dataset.dir;

      const handlePress = (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        this.touchP1[dir] = true;
      };

      const handleRelease = (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        this.touchP1[dir] = false;
      };

      btn.addEventListener('touchstart', handlePress, { passive: false });
      btn.addEventListener('touchend', handleRelease, { passive: false });
      btn.addEventListener('touchcancel', handleRelease, { passive: false });
      btn.addEventListener('mousedown', handlePress);
      btn.addEventListener('mouseup', handleRelease);
      btn.addEventListener('mouseleave', handleRelease);
    });

    // Action buttons: Kick & Dash
    const kickBtn = document.getElementById('btn-touch-kick');
    const sprintBtn = document.getElementById('btn-touch-sprint');
    const kickChargeFill = document.getElementById('touch-kick-charge');

    if (kickBtn) {
      const startKick = (e) => {
        e.preventDefault();
        kickBtn.classList.add('pressed');
        this.touchP1.kick = true;
      };
      const endKick = (e) => {
        e.preventDefault();
        kickBtn.classList.remove('pressed');
        this.touchP1.kick = false;
        if (kickChargeFill) kickChargeFill.style.height = '0%';
      };

      kickBtn.addEventListener('touchstart', startKick, { passive: false });
      kickBtn.addEventListener('touchend', endKick, { passive: false });
      kickBtn.addEventListener('touchcancel', endKick, { passive: false });
      kickBtn.addEventListener('mousedown', startKick);
      kickBtn.addEventListener('mouseup', endKick);
      kickBtn.addEventListener('mouseleave', endKick);
    }

    if (sprintBtn) {
      const startSprint = (e) => {
        e.preventDefault();
        sprintBtn.classList.add('pressed');
        this.touchP1.sprint = true;
      };
      const endSprint = (e) => {
        e.preventDefault();
        sprintBtn.classList.remove('pressed');
        this.touchP1.sprint = false;
      };

      sprintBtn.addEventListener('touchstart', startSprint, { passive: false });
      sprintBtn.addEventListener('touchend', endSprint, { passive: false });
      sprintBtn.addEventListener('touchcancel', endSprint, { passive: false });
      sprintBtn.addEventListener('mousedown', startSprint);
      sprintBtn.addEventListener('mouseup', endSprint);
      sprintBtn.addEventListener('mouseleave', endSprint);
    }
  }

  /**
   * Retrieves inputs for Player 1 (Keyboard WASD + F / Shift + Touch)
   */
  getP1Input() {
    let moveX = 0;
    let moveY = 0;

    // Horizontal
    if (this.keys.has('KeyA') || this.keys.has('a') || this.touchP1.left) moveX -= 1;
    if (this.keys.has('KeyD') || this.keys.has('d') || this.touchP1.right) moveX += 1;

    // Vertical
    if (this.keys.has('KeyW') || this.keys.has('w') || this.touchP1.up) moveY -= 1;
    if (this.keys.has('KeyS') || this.keys.has('s') || this.touchP1.down) moveY += 1;

    // Actions
    const kick = this.keys.has('KeyF') || this.keys.has('f') || this.touchP1.kick;
    const sprint = this.keys.has('ShiftLeft') || this.keys.has('Space') || this.keys.has(' ') || this.touchP1.sprint;

    return { moveX, moveY, kick, sprint };
  }

  /**
   * Retrieves inputs for Player 2 (Keyboard Arrow Keys + L / Enter)
   */
  getP2Input() {
    let moveX = 0;
    let moveY = 0;

    // Horizontal
    if (this.keys.has('ArrowLeft')) moveX -= 1;
    if (this.keys.has('ArrowRight')) moveX += 1;

    // Vertical
    if (this.keys.has('ArrowUp')) moveY -= 1;
    if (this.keys.has('ArrowDown')) moveY += 1;

    // Actions
    const kick = this.keys.has('KeyL') || this.keys.has('l');
    const sprint = this.keys.has('ShiftRight') || this.keys.has('Enter');

    return { moveX, moveY, kick, sprint };
  }
}

window.Controls = Controls;
