/**
 * Pixel Football Showdown - Audio System
 * High-quality 8-bit / 16-bit procedural retro sound synthesizer using Web Audio API.
 * No external audio files or dependencies required.
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterVolume = 0.75;
    this.masterGain = null;
    this.noiseBuffer = null;

    // Load persisted settings
    try {
      const savedMute = localStorage.getItem('pfs_sound_enabled');
      if (savedMute !== null) {
        this.enabled = savedMute === 'true';
      }
      const savedVol = localStorage.getItem('pfs_master_volume');
      if (savedVol !== null) {
        this.masterVolume = parseFloat(savedVol);
      }
    } catch (e) {
      console.warn('LocalStorage not accessible for audio settings');
    }
  }

  /**
   * Initializes the AudioContext after first user gesture
   */
  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.enabled ? this.masterVolume : 0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Create pre-rendered white noise buffer for turf slides, net rustles, and crowd cheering
      this.noiseBuffer = this._createNoiseBuffer(2.0);
    } catch (e) {
      console.error('Web Audio API not supported on this browser:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _createNoiseBuffer(seconds) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  setEnabled(val) {
    this.enabled = !!val;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.enabled ? this.masterVolume : 0, this.ctx.currentTime);
    }
    try {
      localStorage.setItem('pfs_sound_enabled', this.enabled.toString());
    } catch (e) {}
  }

  setVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && this.enabled) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
    try {
      localStorage.setItem('pfs_master_volume', this.masterVolume.toString());
    } catch (e) {}
  }

  /**
   * Ball Kick Sound
   * @param {number} chargeRatio - 0 (light tap) to 1 (max rocket power)
   */
  playKick(chargeRatio = 0) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Deep punchy body
    const startFreq = 160 + chargeRatio * 120;
    const endFreq = 40;
    const duration = 0.12 + chargeRatio * 0.14;

    osc.type = chargeRatio > 0.5 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

    gain.gain.setValueAtTime(0.8 + chargeRatio * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration);

    // If power shot, add laser-like swoosh punch
    if (chargeRatio > 0.35 && this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 + chargeRatio * 1500, t);
      filter.frequency.exponentialRampToValueAtTime(150, t + duration);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.4 * chargeRatio, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + duration);
    }
  }

  /**
   * Ball Bounce on turf or fence
   */
  playBounce(intensity = 1.0) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

    const vol = Math.min(0.5, 0.2 + intensity * 0.3);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * Goalpost Hit Sound - Bright metallic chime/ping
   */
  playPostHit() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [880, 1320, 2200].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const dur = 0.35 - idx * 0.08;
      gain.gain.setValueAtTime(0.35 / (idx + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + dur);
    });
  }

  /**
   * Goal Net Swish Sound
   */
  playNet() {
    if (!this.enabled || !this.noiseBuffer) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.3);
  }

  /**
   * Referee Whistle
   * @param {'start' | 'goal' | 'fulltime'} type
   */
  playWhistle(type = 'start') {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const blasts = type === 'fulltime' ? [0, 0.22, 0.48] : [0];
    const duration = type === 'fulltime' ? 0.18 : 0.45;

    blasts.forEach((delay) => {
      const t = this.ctx.currentTime + delay;

      // Two slightly detuned oscillators for realistic whistle beats
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator(); // vibrato/trill
      const lfoGain = this.ctx.createGain();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(2500, t);
      osc2.frequency.setValueAtTime(2800, t);

      // 28Hz modulation gives the pea whistle flutter
      lfo.frequency.setValueAtTime(28, t);
      lfoGain.gain.setValueAtTime(80, t);
      lfo.connect(osc1.frequency);
      lfo.connect(osc2.frequency);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      lfo.start(t);
      osc1.start(t);
      osc2.start(t);

      lfo.stop(t + duration);
      osc1.stop(t + duration);
      osc2.stop(t + duration);
    });
  }

  /**
   * Goal Celebration: Air Horn + Chiptune Arpeggio + Crowd Roar
   */
  playGoal() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    // 1. Air Horn fanfare
    const t = this.ctx.currentTime;
    const hornNotes = [466.16, 587.33, 698.46]; // Bb4, D5, F5 chord
    hornNotes.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.setValueAtTime(0.18, t + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.7);
    });

    // 2. Crowd Cheer
    this.playCrowdCheer(1.8);
  }

  /**
   * Crowd Cheering Roar
   */
  playCrowdCheer(duration = 1.5) {
    if (!this.enabled || !this.noiseBuffer) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.Q.setValueAtTime(1.2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + duration);
  }

  /**
   * UI Click / Beep
   */
  playClick() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.setValueAtTime(900, t + 0.03);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * Victory Fanfare Arpeggio
   */
  playFanfare() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C major arpeggio
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      const dur = idx === notes.length - 1 ? 0.6 : 0.12;
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + dur);
    });
  }
}

// Global audio singleton
window.soundSystem = new SoundSystem();
