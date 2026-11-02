/**
 * Pixel Football Showdown - UI & Screens Controller
 * Manages menus, HUD, banners, modals, color pickers, and settings.
 */

class UIController {
  constructor(game) {
    this.game = game;

    // Cache DOM elements
    this.elements = {
      // Screens
      screenMainMenu: document.getElementById('screen-main-menu'),
      screenTeamSelect: document.getElementById('screen-team-select'),
      screenHowToPlay: document.getElementById('screen-how-to-play'),
      screenSettings: document.getElementById('screen-settings'),

      // In-game HUD
      inGameHud: document.getElementById('in-game-hud'),
      hudP1Name: document.getElementById('hud-p1-name'),
      hudP2Name: document.getElementById('hud-p2-name'),
      hudP1Color: document.getElementById('hud-p1-color'),
      hudP2Color: document.getElementById('hud-p2-color'),
      scoreP1: document.getElementById('score-p1'),
      scoreP2: document.getElementById('score-p2'),
      matchTimer: document.getElementById('match-timer'),
      soundIcon: document.getElementById('sound-icon'),
      btnSoundToggle: document.getElementById('btn-sound-toggle'),
      btnPause: document.getElementById('btn-pause'),

      // Banner Announcement
      bannerContainer: document.getElementById('announcement-banner'),
      bannerText: document.getElementById('banner-text'),
      bannerSubtext: document.getElementById('banner-subtext'),

      // Modals
      pauseModal: document.getElementById('pause-modal'),
      resultsModal: document.getElementById('results-modal'),

      // Main Menu buttons
      btnMenuSingle: document.getElementById('btn-menu-single'),
      btnMenuTwo: document.getElementById('btn-menu-two'),
      btnMenuHow: document.getElementById('btn-menu-how'),
      btnMenuSettings: document.getElementById('btn-menu-settings'),
      quickSoundBtn: document.getElementById('quick-sound-btn'),
      menuSoundStatus: document.getElementById('menu-sound-status'),
      menuBestStreak: document.getElementById('menu-best-streak'),

      // Setup screen elements
      setupModeLabel: document.getElementById('setup-mode-label'),
      p1PreviewCanvas: document.getElementById('p1-preview-canvas'),
      p2PreviewCanvas: document.getElementById('p2-preview-canvas'),
      p1TitleLabel: document.getElementById('p1-title-label'),
      p2TitleLabel: document.getElementById('p2-title-label'),
      p2ControlsHint: document.getElementById('p2-controls-hint'),
      difficultyOptionGroup: document.getElementById('difficulty-option-group'),
      selectDuration: document.getElementById('select-duration'),
      selectDifficulty: document.getElementById('select-difficulty'),
      selectSpeed: document.getElementById('select-speed'),
      btnBackToMenu: document.getElementById('btn-back-to-menu'),
      btnStartKickoff: document.getElementById('btn-start-kickoff'),

      // How to Play
      btnHowBack: document.getElementById('btn-how-back'),

      // Settings Screen
      toggleSoundEffect: document.getElementById('toggle-sound-effect'),
      rangeVolume: document.getElementById('range-volume'),
      volumeLabel: document.getElementById('volume-label'),
      toggleScreenshake: document.getElementById('toggle-screenshake'),
      toggleVirtualPad: document.getElementById('toggle-virtual-pad'),
      btnResetRecords: document.getElementById('btn-reset-records'),
      btnSettingsBack: document.getElementById('btn-settings-back'),

      // Pause Modal buttons
      btnPauseResume: document.getElementById('btn-pause-resume'),
      btnPauseRestart: document.getElementById('btn-pause-restart'),
      btnPauseSound: document.getElementById('btn-pause-sound'),
      btnPauseQuit: document.getElementById('btn-pause-quit'),

      // Results Modal elements
      resultsTitle: document.getElementById('results-title'),
      resultsWinner: document.getElementById('results-winner'),
      resP1Name: document.getElementById('res-p1-name'),
      resP2Name: document.getElementById('res-p2-name'),
      resP1Score: document.getElementById('res-p1-score'),
      resP2Score: document.getElementById('res-p2-score'),
      statP1Shots: document.getElementById('stat-p1-shots'),
      statP2Shots: document.getElementById('stat-p2-shots'),
      statP1Target: document.getElementById('stat-p1-target'),
      statP2Target: document.getElementById('stat-p2-target'),
      statP1Possession: document.getElementById('stat-p1-possession'),
      statP2Possession: document.getElementById('stat-p2-possession'),
      statP1Saves: document.getElementById('stat-p1-saves'),
      statP2Saves: document.getElementById('stat-p2-saves'),
      btnResultsRematch: document.getElementById('btn-results-rematch'),
      btnResultsMenu: document.getElementById('btn-results-menu')
    };

    // Color options
    this.selectedP1Color = '#1E88E5';
    this.selectedP2Color = '#F5F5F5';
    this.selectedMode = 'single'; // 'single' or 'two'

    this.bannerTimeout = null;
    this.bindEvents();
    this.loadRecords();
    this.updateSoundUI();
  }

  bindEvents() {
    const el = this.elements;

    // Main Menu Nav
    el.btnMenuSingle.addEventListener('click', () => {
      this.playClick();
      this.openSetup('single');
    });

    el.btnMenuTwo.addEventListener('click', () => {
      this.playClick();
      this.openSetup('two');
    });

    el.btnMenuHow.addEventListener('click', () => {
      this.playClick();
      this.showScreen('screen-how-to-play');
    });

    el.btnMenuSettings.addEventListener('click', () => {
      this.playClick();
      this.showScreen('screen-settings');
    });

    el.btnHowBack.addEventListener('click', () => {
      this.playClick();
      this.showScreen('screen-main-menu');
    });

    el.btnSettingsBack.addEventListener('click', () => {
      this.playClick();
      this.showScreen('screen-main-menu');
    });

    el.btnBackToMenu.addEventListener('click', () => {
      this.playClick();
      this.showScreen('screen-main-menu');
    });

    // Start Match
    el.btnStartKickoff.addEventListener('click', () => {
      this.playClick();
      this.startMatchFromSetup();
    });

    // Sound Toggles
    const toggleSoundAction = () => {
      window.soundSystem.setEnabled(!window.soundSystem.enabled);
      this.updateSoundUI();
      this.playClick();
    };

    el.quickSoundBtn.addEventListener('click', toggleSoundAction);
    el.btnSoundToggle.addEventListener('click', toggleSoundAction);
    el.btnPauseSound.addEventListener('click', toggleSoundAction);
    el.toggleSoundEffect.addEventListener('click', toggleSoundAction);

    // Volume Slider
    el.rangeVolume.addEventListener('input', (e) => {
      const vol = parseInt(e.target.value, 10);
      el.volumeLabel.textContent = `${vol}%`;
      window.soundSystem.setVolume(vol / 100);
    });

    // Screen Shake Toggle
    el.toggleScreenshake.addEventListener('click', () => {
      this.game.renderer.enableScreenShake = !this.game.renderer.enableScreenShake;
      el.toggleScreenshake.textContent = this.game.renderer.enableScreenShake ? 'ENABLED' : 'DISABLED';
      el.toggleScreenshake.classList.toggle('active', this.game.renderer.enableScreenShake);
      this.playClick();
    });

    // Reset Records
    el.btnResetRecords.addEventListener('click', () => {
      try {
        localStorage.removeItem('pfs_high_streak');
        this.loadRecords();
        alert('Match win records reset!');
      } catch (e) {}
    });

    // In-Game Pause
    el.btnPause.addEventListener('click', () => {
      this.playClick();
      this.game.togglePause();
    });

    el.btnPauseResume.addEventListener('click', () => {
      this.playClick();
      this.game.togglePause();
    });

    el.btnPauseRestart.addEventListener('click', () => {
      this.playClick();
      this.hidePauseModal();
      this.game.startMatch();
    });

    el.btnPauseQuit.addEventListener('click', () => {
      this.playClick();
      this.hidePauseModal();
      this.hideHUD();
      this.showScreen('screen-main-menu');
      this.game.stopMatch();
    });

    // Match Over / Rematch
    el.btnResultsRematch.addEventListener('click', () => {
      this.playClick();
      this.hideResultsModal();
      this.game.startMatch();
    });

    el.btnResultsMenu.addEventListener('click', () => {
      this.playClick();
      this.hideResultsModal();
      this.hideHUD();
      this.showScreen('screen-main-menu');
      this.game.stopMatch();
    });

    // Color Pickers
    this.setupColorChips();
  }

  setupColorChips() {
    const p1Chips = document.querySelectorAll('#p1-colors .color-chip');
    p1Chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        p1Chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectedP1Color = chip.dataset.color;
        this.updatePreviews();
        this.playClick();
      });
    });

    const p2Chips = document.querySelectorAll('#p2-colors .color-chip');
    p2Chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        p2Chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectedP2Color = chip.dataset.color;
        this.updatePreviews();
        this.playClick();
      });
    });
  }

  playClick() {
    if (window.soundSystem) window.soundSystem.playClick();
  }

  showScreen(screenId) {
    const screens = [
      this.elements.screenMainMenu,
      this.elements.screenTeamSelect,
      this.elements.screenHowToPlay,
      this.elements.screenSettings
    ];

    screens.forEach((sc) => {
      if (sc.id === screenId) {
        sc.classList.remove('hidden');
        sc.classList.add('active');
      } else {
        sc.classList.add('hidden');
        sc.classList.remove('active');
      }
    });

    if (screenId === 'screen-team-select') {
      this.updatePreviews();
    }
  }

  hideAllScreens() {
    const screens = [
      this.elements.screenMainMenu,
      this.elements.screenTeamSelect,
      this.elements.screenHowToPlay,
      this.elements.screenSettings
    ];
    screens.forEach((sc) => {
      sc.classList.add('hidden');
      sc.classList.remove('active');
    });
  }

  openSetup(mode = 'single') {
    this.selectedMode = mode;
    this.elements.setupModeLabel.textContent = mode === 'single' ? '1 PLAYER VS CPU MODE' : '2 PLAYERS LOCAL MATCH';
    this.elements.p2TitleLabel.textContent = mode === 'single' ? 'CPU OPPONENT' : 'PLAYER 2';
    this.elements.p2ControlsHint.innerHTML = mode === 'single' ? 'Controlled by <b>Pixel AI</b>' : 'Controls: <b>Arrow Keys + L</b>';

    if (mode === 'two') {
      this.elements.difficultyOptionGroup.classList.add('hidden');
    } else {
      this.elements.difficultyOptionGroup.classList.remove('hidden');
    }

    this.showScreen('screen-team-select');
    this.updatePreviews();
  }

  updatePreviews() {
    Player.renderPreview(this.elements.p1PreviewCanvas, this.selectedP1Color, '#FFFFFF', 'spiky', 10, 'p1');
    Player.renderPreview(this.elements.p2PreviewCanvas, this.selectedP2Color, '#FFFFFF', 'headband', 7, 'p2');
  }

  startMatchFromSetup() {
    const duration = parseInt(this.elements.selectDuration.value, 10);
    const difficulty = this.elements.selectDifficulty.value;
    const speed = parseFloat(this.elements.selectSpeed.value);

    const config = {
      mode: this.selectedMode,
      duration: duration,
      difficulty: difficulty,
      gameSpeed: speed,
      p1Color: this.selectedP1Color,
      p2Color: this.selectedP2Color,
      p1Name: this.getColorName(this.selectedP1Color),
      p2Name: this.selectedMode === 'single' ? `CPU (${difficulty.toUpperCase()})` : this.getColorName(this.selectedP2Color)
    };

    this.hideAllScreens();
    this.showHUD(config);
    this.game.startMatch(config);
  }

  getColorName(hex) {
    const names = {
      '#1E88E5': 'BLUE',
      '#E53935': 'RED',
      '#FDD835': 'YELLOW',
      '#43A047': 'GREEN',
      '#8E24AA': 'PURPLE',
      '#F5F5F5': 'WHITE',
      '#212121': 'BLACK',
      '#FB8C00': 'ORANGE'
    };
    return names[hex.toUpperCase()] || 'TEAM';
  }

  showHUD(config) {
    const el = this.elements;
    el.inGameHud.classList.remove('hidden');
    el.hudP1Name.textContent = config.p1Name;
    el.hudP2Name.textContent = config.p2Name;
    el.hudP1Color.style.backgroundColor = config.p1Color;
    el.hudP2Color.style.backgroundColor = config.p2Color;
    el.scoreP1.textContent = '0';
    el.scoreP2.textContent = '0';
  }

  hideHUD() {
    this.elements.inGameHud.classList.add('hidden');
  }

  updateHUD(score1, score2, secondsLeft) {
    this.elements.scoreP1.textContent = score1;
    this.elements.scoreP2.textContent = score2;

    if (secondsLeft === null || secondsLeft < 0) {
      this.elements.matchTimer.textContent = 'PRACTICE';
    } else {
      const mins = Math.floor(secondsLeft / 60);
      const secs = Math.floor(secondsLeft % 60);
      this.elements.matchTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  showBanner(title, subtext = '', durationMs = 1800) {
    if (this.bannerTimeout) {
      clearTimeout(this.bannerTimeout);
    }
    const el = this.elements;
    el.bannerText.textContent = title;
    el.bannerSubtext.textContent = subtext;
    el.bannerContainer.classList.remove('hidden');

    this.bannerTimeout = setTimeout(() => {
      el.bannerContainer.classList.add('hidden');
    }, durationMs);
  }

  showPauseModal() {
    this.elements.pauseModal.classList.remove('hidden');
  }

  hidePauseModal() {
    this.elements.pauseModal.classList.add('hidden');
  }

  showResultsModal(results) {
    const el = this.elements;
    el.resultsTitle.textContent = 'MATCH COMPLETED';
    el.resultsWinner.textContent = results.winnerText;
    el.resP1Name.textContent = results.p1Name;
    el.resP2Name.textContent = results.p2Name;
    el.resP1Score.textContent = results.score1;
    el.resP2Score.textContent = results.score2;

    el.statP1Shots.textContent = results.p1Stats.shots;
    el.statP2Shots.textContent = results.p2Stats.shots;
    el.statP1Target.textContent = results.p1Stats.shotsOnTarget;
    el.statP2Target.textContent = results.p2Stats.shotsOnTarget;

    const totalPoss = (results.p1Stats.possessionTicks + results.p2Stats.possessionTicks) || 1;
    const p1Poss = Math.round((results.p1Stats.possessionTicks / totalPoss) * 100);
    const p2Poss = 100 - p1Poss;
    el.statP1Possession.textContent = `${p1Poss}%`;
    el.statP2Possession.textContent = `${p2Poss}%`;

    el.statP1Saves.textContent = results.p1Stats.saves;
    el.statP2Saves.textContent = results.p2Stats.saves;

    el.resultsModal.classList.remove('hidden');

    // Save records
    if (results.isP1Winner) {
      this.incrementWinStreak();
    }
  }

  hideResultsModal() {
    this.elements.resultsModal.classList.add('hidden');
  }

  loadRecords() {
    try {
      const streak = localStorage.getItem('pfs_high_streak') || '0';
      this.elements.menuBestStreak.textContent = streak;
    } catch (e) {}
  }

  incrementWinStreak() {
    try {
      let streak = parseInt(localStorage.getItem('pfs_high_streak') || '0', 10);
      streak++;
      localStorage.setItem('pfs_high_streak', streak.toString());
      this.elements.menuBestStreak.textContent = streak;
    } catch (e) {}
  }

  updateSoundUI() {
    const enabled = window.soundSystem ? window.soundSystem.enabled : true;
    this.elements.soundIcon.textContent = enabled ? '🔊' : '🔇';
    this.elements.menuSoundStatus.textContent = enabled ? 'ON' : 'OFF';
    this.elements.btnPauseSound.textContent = enabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF';
    this.elements.toggleSoundEffect.textContent = enabled ? 'ENABLED' : 'DISABLED';
    this.elements.toggleSoundEffect.classList.toggle('active', enabled);
  }
}

window.UIController = UIController;
