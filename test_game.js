/**
 * Comprehensive Automated Headless Test Suite for Pixel Football Showdown
 */

// 1. Mock minimal DOM and Canvas environment for Node.js
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};

// Mock Web Audio Context
global.AudioContext = class {
  constructor() {
    this.currentTime = 0;
    this.destination = {};
    this.sampleRate = 44100;
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {}
      },
      connect: () => {}
    };
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {}
      },
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
  }
  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      Q: { setValueAtTime: () => {} },
      connect: () => {}
    };
  }
  createBufferSource() {
    return {
      buffer: null,
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
  }
  createBuffer(channels, length, rate) {
    return {
      getChannelData: () => new Float32Array(length)
    };
  }
};
global.document = {
  getElementById: (id) => {
    return {
      id: id,
      classList: {
        contains: () => false,
        add: () => {},
        remove: () => {},
        toggle: () => {}
      },
      style: {},
      textContent: '',
      innerHTML: '',
      value: '120',
      dataset: { color: '#1E88E5', dir: 'up' },
      addEventListener: () => {},
      getContext: () => ({
        clearRect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        closePath: () => {},
        arc: () => {},
        ellipse: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        fillText: () => {}
      })
    };
  },
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; }
};

global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);

// 2. Load Game Modules in dependency order
require('./js/audio.js');
require('./js/physics.js');
require('./js/ball.js');
require('./js/player.js');
require('./js/ai.js');
require('./js/controls.js');
require('./js/renderer.js');
require('./js/ui.js');
require('./js/game.js');

console.log('--- RUNNING PIXEL FOOTBALL SHOWDOWN TEST SUITE ---');

let passedTests = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
  passedTests++;
}

// TEST 1: Audio System Initialization & Synth Safe-guards
assert(window.soundSystem !== undefined, 'Audio singleton initialized');
assert(window.soundSystem.enabled === true, 'Audio enabled by default');
window.soundSystem.setEnabled(false);
assert(window.soundSystem.enabled === false, 'Audio mute toggle works');
window.soundSystem.setEnabled(true);
window.soundSystem.playKick(0.5);
window.soundSystem.playPostHit();
window.soundSystem.playWhistle('start');

// TEST 2: Physics Geometry & Distance Math
const geom = window.PITCH_GEOMETRY;
assert(geom.canvasWidth === 960 && geom.canvasHeight === 540, 'Canvas virtual resolution is 960x540');
assert(window.Physics.dist(0, 0, 3, 4) === 5, 'Distance formula calculates accurately');

// TEST 3: Circle Collision
const c1 = { x: 100, y: 100, radius: 10 };
const c2 = { x: 115, y: 100, radius: 10 };
const col = window.Physics.checkCircleCollision(c1, c2);
assert(col.collided === true && col.overlap === 5, 'Circle collision detected with correct overlap');

// TEST 4: Player Pitch Boundary Constraint
const testPlayer = new window.Player({ x: 10, y: 10, id: 'p1' });
window.Physics.constrainPlayerToPitch(testPlayer);
assert(testPlayer.x >= geom.pitchLeft && testPlayer.y >= geom.pitchTop, 'Player constrained to pitch boundaries');

// TEST 5: Ball Physics & Kicking
const ball = new window.Ball(480, 330);
assert(ball.x === 480 && ball.y === 330 && ball.z === 0, 'Ball initializes at pitch center');
ball.kick(1, 0, 10, 3, 'p1');
assert(ball.vx === 10 && ball.vz === 3 && ball.lastKickedBy === 'p1', 'Ball kick applies impulse and height');

// Simulate 30 frames of ball flight
for (let i = 0; i < 30; i++) {
  ball.update(1.0);
}
assert(ball.x > 550, 'Ball traverses pitch forward');
assert(ball.z >= 0, 'Ball stays on or above turf');

// TEST 6: Goal Detection
ball.reset(geom.pitchRight + 15, geom.centerY);
let goalScoredBy = null;
window.Physics.handleBallBoundariesAndGoals(
  ball,
  () => {},
  () => {},
  (team) => { goalScoredBy = team; }
);
assert(goalScoredBy === 'p1', 'Ball inside right goal correctly triggers P1 goal event');

// TEST 7: AI Decision Making
const p1 = new window.Player({ id: 'p1', x: 300, y: 330 });
const p2 = new window.Player({ id: 'p2', x: 600, y: 330 });
const ai = new window.FootballAI(p2, 'hard');
ball.reset(500, 330);
const aiDecision = ai.think(ball, p1);
assert(aiDecision !== null && typeof aiDecision.moveX === 'number', 'AI produces valid movement decision vector');

// TEST 8: Full Game Engine Kickoff & Scoring Simulation
const mockCanvas = document.getElementById('game-canvas');
mockCanvas.width = 960;
mockCanvas.height = 540;
const game = new window.Game(mockCanvas);
assert(game.state === 'MENU', 'Game starts in MENU state');

game.startMatch({
  mode: 'single',
  duration: 60,
  difficulty: 'medium',
  p1Name: 'BLUE',
  p2Name: 'WHITE'
});
assert(game.state === 'COUNTDOWN', 'Starting match sets COUNTDOWN state');

// Advance countdown
for (let i = 0; i < 200; i++) {
  game.update(1.0);
}
assert(game.state === 'PLAYING', 'Game transitions from COUNTDOWN to PLAYING');

// Trigger goal for P1
game.handleGoalScored('p1');
assert(game.score1 === 1, 'P1 score increments to 1');
assert(game.state === 'GOAL_CELEBRATION', 'State changes to GOAL_CELEBRATION');

// Advance past celebration
for (let i = 0; i < 170; i++) {
  game.update(1.0);
}
assert(game.state === 'COUNTDOWN', 'Game returns to COUNTDOWN for restart');

// Pause test
game.state = 'PLAYING';
game.togglePause();
assert(game.state === 'PAUSED', 'Game enters PAUSED state');
game.togglePause();
assert(game.state === 'PLAYING', 'Game resumes to PLAYING state');

// Finish match test
game.finishMatch();
assert(game.state === 'GAME_OVER', 'Game enters GAME_OVER state');

console.log(`\n🎉 ALL ${passedTests} TESTS PASSED SUCCESSFULLY!`);
process.exit(0);
