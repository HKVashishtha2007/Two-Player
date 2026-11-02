/**
 * Pixel Football Showdown - Core Game Engine
 * Orchestrates loop, physics, state transitions, scoring, and AI coordination.
 */

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.controls = new Controls();
    this.ui = new UIController(this);

    // Game states: 'MENU' | 'COUNTDOWN' | 'PLAYING' | 'GOAL_CELEBRATION' | 'PAUSED' | 'GAME_OVER'
    this.state = 'MENU';
    this.previousState = 'MENU';

    // Entities
    this.player1 = null;
    this.player2 = null;
    this.ball = new Ball(480, 330);
    this.ai = null;

    // Match Configuration & Tracking
    this.config = {
      mode: 'single', // 'single' or 'two'
      duration: 120, // seconds (0 for practice)
      difficulty: 'medium',
      gameSpeed: 1.0,
      p1Color: '#1E88E5',
      p2Color: '#F5F5F5',
      p1Name: 'BLUE',
      p2Name: 'WHITE'
    };

    this.score1 = 0;
    this.score2 = 0;
    this.timeRemaining = 120; // seconds
    this.countdownTimer = 0;
    this.goalCelebrationTimer = 0;

    // Loop timing with fixed timestep
    this.lastTime = performance.now();
    this.accumulatedTime = 0;
    this.fixedStep = 1000 / 60; // 60 FPS

    // Wire global controls
    this.controls.onPauseToggle = () => this.togglePause();
    this.controls.onSoundToggle = () => {
      window.soundSystem.setEnabled(!window.soundSystem.enabled);
      this.ui.updateSoundUI();
    };

    // Initialize default players for menu background exhibition
    this.initEntities();

    // Start engine loop
    requestAnimationFrame((t) => this.loop(t));
  }

  initEntities() {
    this.player1 = new Player({
      id: 'p1',
      name: this.config.p1Name,
      isHuman: true,
      x: 320,
      y: 330,
      primaryColor: this.config.p1Color,
      secondaryColor: '#FFFFFF',
      hairStyle: 'spiky',
      number: 10
    });

    const isP2Human = this.config.mode === 'two';
    this.player2 = new Player({
      id: 'p2',
      name: this.config.p2Name,
      isHuman: isP2Human,
      x: 640,
      y: 330,
      primaryColor: this.config.p2Color,
      secondaryColor: '#FFFFFF',
      hairStyle: 'headband',
      number: 7
    });

    if (!isP2Human) {
      this.ai = new FootballAI(this.player2, this.config.difficulty);
    } else {
      this.ai = null;
    }

    this.ball.reset(480, 330);
  }

  startMatch(customConfig = {}) {
    this.config = { ...this.config, ...customConfig };

    this.score1 = 0;
    this.score2 = 0;
    this.timeRemaining = this.config.duration > 0 ? this.config.duration : -1;

    // Apply speed multipliers
    this.initEntities();
    this.player1.speedMultiplier = this.config.gameSpeed;
    this.player2.speedMultiplier = this.config.gameSpeed;

    if (this.ai) {
      this.ai.applyDifficulty(this.config.difficulty);
    }

    this.ui.updateHUD(this.score1, this.score2, this.timeRemaining);
    this.beginKickoff(true);
  }

  stopMatch() {
    this.state = 'MENU';
    this.initEntities();
  }

  beginKickoff(isFirstKickoff = false) {
    this.ball.reset(480, 330);
    this.player1.reset(330, 330);
    this.player2.reset(630, 330);

    this.state = 'COUNTDOWN';
    this.countdownTimer = 180; // 3 seconds at 60 FPS

    if (isFirstKickoff) {
      this.ui.showBanner('3', 'GET READY...', 900);
      setTimeout(() => {
        if (this.state === 'COUNTDOWN') this.ui.showBanner('2', 'SET...', 900);
      }, 1000);
      setTimeout(() => {
        if (this.state === 'COUNTDOWN') this.ui.showBanner('1', 'FOCUS!', 900);
      }, 2000);
    } else {
      this.ui.showBanner('READY...', 'KICKOFF RESTART', 1000);
    }
  }

  togglePause() {
    if (this.state === 'MENU' || this.state === 'GAME_OVER') return;

    if (this.state === 'PAUSED') {
      this.state = this.previousState;
      this.ui.hidePauseModal();
    } else {
      this.previousState = this.state;
      this.state = 'PAUSED';
      this.ui.showPauseModal();
    }
  }

  handleGoalScored(scorerTeam) {
    if (this.state === 'GOAL_CELEBRATION' || this.state === 'GAME_OVER') return;

    this.state = 'GOAL_CELEBRATION';
    this.goalCelebrationTimer = 160; // ~2.6 seconds

    let teamName = '';
    if (scorerTeam === 'p1') {
      this.score1++;
      teamName = `${this.config.p1Name} SCORED!`;
      this.player1.celebrationTimer = 150;
      this.player2.celebrationTimer = 0;
    } else {
      this.score2++;
      teamName = `${this.config.p2Name} SCORED!`;
      this.player2.celebrationTimer = 150;
      this.player1.celebrationTimer = 0;
    }

    this.ui.updateHUD(this.score1, this.score2, this.timeRemaining);
    this.ui.showBanner('GOAL!', teamName, 2200);

    // Audio & Visual juice
    if (window.soundSystem) {
      window.soundSystem.playGoal();
      window.soundSystem.playWhistle('goal');
    }
    this.renderer.triggerScreenShake(9, 20);
    this.renderer.spawnConfetti(120);
  }

  onPostHit(px, py) {
    if (window.soundSystem) window.soundSystem.playPostHit();
    this.renderer.triggerScreenShake(4, 8);
    this.renderer.spawnSparks(px, py, 15);
  }

  onNetHit() {
    if (window.soundSystem) window.soundSystem.playNet();
    this.renderer.leftNetVibrate = 15;
    this.renderer.rightNetVibrate = 15;
  }

  finishMatch() {
    this.state = 'GAME_OVER';

    if (window.soundSystem) {
      window.soundSystem.playWhistle('fulltime');
      window.soundSystem.playFanfare();
    }

    let winnerText = "IT'S A DRAW!";
    let isP1Winner = false;
    if (this.score1 > this.score2) {
      winnerText = `${this.config.p1Name} TEAM WINS! 🏆`;
      isP1Winner = true;
    } else if (this.score2 > this.score1) {
      winnerText = `${this.config.p2Name} TEAM WINS! 🏆`;
    }

    this.ui.showBanner('FULL TIME!', winnerText, 2500);
    this.renderer.spawnConfetti(180);

    setTimeout(() => {
      this.ui.showResultsModal({
        winnerText: winnerText,
        isP1Winner: isP1Winner,
        p1Name: this.config.p1Name,
        p2Name: this.config.p2Name,
        score1: this.score1,
        score2: this.score2,
        p1Stats: this.player1.stats,
        p2Stats: this.player2.stats
      });
    }, 1800);
  }

  /**
   * Fixed Timestep Update
   */
  update(dt = 1) {
    // 1. Menu Exhibition state: gentle ball movement
    if (this.state === 'MENU') {
      if (Math.abs(this.ball.vx) < 0.2 && Math.abs(this.ball.vy) < 0.2) {
        this.ball.vx = (Math.random() - 0.5) * 3;
        this.ball.vy = (Math.random() - 0.5) * 2;
      }
      this.ball.update(dt);
      Physics.handleBallBoundariesAndGoals(
        this.ball,
        (x, y) => this.onPostHit(x, y),
        () => this.onNetHit(),
        null
      );
      return;
    }

    // 2. Countdown State
    if (this.state === 'COUNTDOWN') {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.state = 'PLAYING';
        this.ui.showBanner('PLAY!', 'KICK OFF!', 700);
        if (window.soundSystem) window.soundSystem.playWhistle('start');
      }
      return;
    }

    // 3. Goal Celebration State
    if (this.state === 'GOAL_CELEBRATION') {
      this.goalCelebrationTimer -= dt;
      this.ball.update(dt);
      this.player1.update({ moveX: 0, moveY: 0, kick: false, sprint: false }, dt, this.ball);
      this.player2.update({ moveX: 0, moveY: 0, kick: false, sprint: false }, dt, this.ball);

      if (this.goalCelebrationTimer <= 0) {
        this.beginKickoff(false);
      }
      return;
    }

    // 4. Paused or Game Over
    if (this.state === 'PAUSED' || this.state === 'GAME_OVER') {
      return;
    }

    // 5. Active Playing State
    // Decrement match clock
    if (this.timeRemaining > 0) {
      this.timeRemaining -= dt / 60;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.ui.updateHUD(this.score1, this.score2, 0);
        this.finishMatch();
        return;
      }
      this.ui.updateHUD(this.score1, this.score2, this.timeRemaining);
    }

    // Fetch Inputs
    const p1Input = this.controls.getP1Input();
    let p2Input;
    if (this.player2.isHuman) {
      p2Input = this.controls.getP2Input();
    } else if (this.ai) {
      p2Input = this.ai.think(this.ball, this.player1);
    } else {
      p2Input = { moveX: 0, moveY: 0, kick: false, sprint: false };
    }

    // Update Players
    this.player1.update(p1Input, dt, this.ball);
    this.player2.update(p2Input, dt, this.ball);

    // Update Ball Physics
    this.ball.update(dt);

    // Player vs Player collision response
    const pCol = Physics.checkCircleCollision(
      { x: this.player1.x, y: this.player1.y, radius: this.player1.radius },
      { x: this.player2.x, y: this.player2.y, radius: this.player2.radius }
    );
    if (pCol.collided) {
      const halfOverlap = pCol.overlap / 2;
      this.player1.x -= pCol.normalX * halfOverlap;
      this.player1.y -= pCol.normalY * halfOverlap;
      this.player2.x += pCol.normalX * halfOverlap;
      this.player2.y += pCol.normalY * halfOverlap;
    }

    // Handle Ball vs Pitch Boundaries, Fence, Goalposts, and Nets
    Physics.handleBallBoundariesAndGoals(
      this.ball,
      (px, py) => this.onPostHit(px, py),
      () => this.onNetHit(),
      (team) => this.handleGoalScored(team)
    );
  }

  /**
   * Main Animation Loop
   */
  loop(currentTime) {
    const elapsed = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Prevent spiral of death on tab switch
    this.accumulatedTime += Math.min(elapsed, 100);

    while (this.accumulatedTime >= this.fixedStep) {
      this.update(1.0);
      this.accumulatedTime -= this.fixedStep;
    }

    // Render current frame
    this.renderer.render({
      player1: this.player1,
      player2: this.player2,
      ball: this.ball
    });

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.Game = Game;
