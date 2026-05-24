// Audio manager for Neon Hockey VR — enhanced with countdown, shield, button sounds
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientPad: OscillatorNode | null = null;
  private ambientLfo: OscillatorNode | null = null;
  private masterVol = 0.7;
  private sfxVol = 0.8;
  private musicVol = 0.3;

  private ensure() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.masterVol;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVol;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVol;
    this.musicGain.connect(this.masterGain);

    this.startAmbient();
  }

  private startAmbient() {
    if (!this.ctx || !this.musicGain) return;

    // Bass drone
    this.ambientOsc = this.ctx.createOscillator();
    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.value = 55;
    const bassGain = this.ctx.createGain();
    bassGain.gain.value = 0.08;
    this.ambientOsc.connect(bassGain);
    bassGain.connect(this.musicGain);
    this.ambientOsc.start();

    // Pad
    this.ambientPad = this.ctx.createOscillator();
    this.ambientPad.type = 'triangle';
    this.ambientPad.frequency.value = 110;
    const padGain = this.ctx.createGain();
    padGain.gain.value = 0.04;

    // LFO for pad
    this.ambientLfo = this.ctx.createOscillator();
    this.ambientLfo.type = 'sine';
    this.ambientLfo.frequency.value = 0.3;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 10;
    this.ambientLfo.connect(lfoGain);
    lfoGain.connect(this.ambientPad.frequency);
    this.ambientLfo.start();

    this.ambientPad.connect(padGain);
    padGain.connect(this.musicGain);
    this.ambientPad.start();

    // High-frequency shimmer
    const shimmer = this.ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.value = 4400;
    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.value = 0.008;
    const shimmerLfo = this.ctx.createOscillator();
    shimmerLfo.type = 'sine';
    shimmerLfo.frequency.value = 0.15;
    const shimmerLfoGain = this.ctx.createGain();
    shimmerLfoGain.gain.value = 0.006;
    shimmerLfo.connect(shimmerLfoGain);
    shimmerLfoGain.connect(shimmerGain.gain);
    shimmerLfo.start();
    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.musicGain);
    shimmer.start();
  }

  adjustVolume(type: string, delta: number) {
    if (type === 'master') {
      this.masterVol = Math.max(0, Math.min(1, this.masterVol + delta));
      if (this.masterGain) this.masterGain.gain.value = this.masterVol;
    } else if (type === 'sfx') {
      this.sfxVol = Math.max(0, Math.min(1, this.sfxVol + delta));
      if (this.sfxGain) this.sfxGain.gain.value = this.sfxVol;
    } else if (type === 'music') {
      this.musicVol = Math.max(0, Math.min(1, this.musicVol + delta));
      if (this.musicGain) this.musicGain.gain.value = this.musicVol;
    }
  }

  private playSFX(freq: number, type: OscillatorType, duration: number, vol = 0.3, detune = 0) {
    this.ensure();
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private playNoise(duration: number, vol = 0.2, highpass = 2000) {
    this.ensure();
    if (!this.ctx || !this.sfxGain) return;
    const bufSize = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = highpass;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start();
  }

  playMalletHit(intensity: number) {
    const vol = 0.2 + intensity * 0.4;
    this.playSFX(800 + intensity * 600, 'square', 0.08, vol);
    this.playNoise(0.06, vol * 0.5, 3000);
  }

  playWallHit() {
    this.playSFX(300, 'triangle', 0.1, 0.15);
    this.playNoise(0.04, 0.1, 4000);
  }

  playGoalScored() {
    this.ensure();
    if (!this.ctx || !this.sfxGain) return;
    // Goal horn — two-note blast
    this.playSFX(220, 'sawtooth', 0.5, 0.35);
    this.playSFX(330, 'sawtooth', 0.5, 0.3, 5);
    // Then celebratory arpeggio
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playSFX(freq, 'sawtooth', 0.3, 0.2), 200 + i * 80);
    });
    this.playNoise(0.3, 0.12, 2000);
  }

  playGoalConceded() {
    const notes = [400, 300, 200, 150];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playSFX(freq, 'sawtooth', 0.4, 0.2), i * 100);
    });
  }

  playGameStart() {
    this.ensure();
    this.playSFX(440, 'sine', 0.15, 0.3);
    setTimeout(() => this.playSFX(554, 'sine', 0.15, 0.3), 100);
    setTimeout(() => this.playSFX(659, 'sine', 0.3, 0.35), 200);
  }

  playGameEnd(won: boolean) {
    if (won) {
      [523, 659, 784, 1047].forEach((f, i) => {
        setTimeout(() => this.playSFX(f, 'sine', 0.4, 0.3), i * 120);
      });
    } else {
      [400, 350, 300, 200].forEach((f, i) => {
        setTimeout(() => this.playSFX(f, 'triangle', 0.5, 0.2), i * 150);
      });
    }
  }

  playPowerUp() {
    this.playSFX(800, 'sine', 0.1, 0.3);
    setTimeout(() => this.playSFX(1200, 'sine', 0.15, 0.3), 80);
    setTimeout(() => this.playSFX(1600, 'sine', 0.2, 0.25), 160);
  }

  playAchievement() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      setTimeout(() => this.playSFX(f, 'sine', 0.3, 0.2), i * 60);
    });
  }

  playButtonClick() {
    this.ensure();
    this.playSFX(600, 'sine', 0.06, 0.15);
  }

  playCountdownTick() {
    this.ensure();
    this.playSFX(880, 'sine', 0.15, 0.25);
    setTimeout(() => this.playSFX(440, 'sine', 0.05, 0.1), 100);
  }

  playShieldBlock() {
    this.ensure();
    // Metallic shield block
    this.playSFX(200, 'square', 0.15, 0.3);
    this.playSFX(600, 'sawtooth', 0.1, 0.2);
    this.playNoise(0.12, 0.2, 1500);
  }

  playPowerUpExpiring() {
    this.ensure();
    // Warning beep
    this.playSFX(440, 'square', 0.08, 0.15);
  }
}
