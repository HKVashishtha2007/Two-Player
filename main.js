/**
 * Pixel Football Showdown - Application Entry Point
 * Initializes game instance, canvas scaling, audio unlock on user gesture.
 */

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Game canvas element not found!');
    return;
  }

  // Instantiate master game engine
  const game = new Game(canvas);
  window.gameInstance = game;

  // Unlock Web Audio API on first user gesture
  const unlockAudio = () => {
    if (window.soundSystem) {
      window.soundSystem.ensureContext();
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };

  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);

  // Responsive canvas resizing maintaining 16:9 pixel crisp ratio
  function handleResize() {
    const wrapper = document.getElementById('game-wrapper');
    if (!wrapper) return;

    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const targetAspect = 16 / 9;
    const winAspect = winW / winH;

    let targetW, targetH;
    if (winAspect > targetAspect) {
      targetH = winH;
      targetW = winH * targetAspect;
    } else {
      targetW = winW;
      targetH = winW / targetAspect;
    }

    canvas.style.width = `${Math.floor(targetW)}px`;
    canvas.style.height = `${Math.floor(targetH)}px`;

    const uiLayer = document.getElementById('ui-layer');
    if (uiLayer) {
      uiLayer.style.width = `${Math.floor(targetW)}px`;
      uiLayer.style.height = `${Math.floor(targetH)}px`;
    }
  }

  window.addEventListener('resize', handleResize);
  handleResize();

  console.log('⚽ Pixel Football Showdown initialized successfully!');
});
