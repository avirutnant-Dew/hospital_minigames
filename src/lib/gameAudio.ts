// Audio utility for game sound effects using Web Audio API
class GameAudio {
  private audioContext: AudioContext | null = null;
  private oscillators: Map<string, OscillatorNode> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  // Play a beep sound with customizable frequency and duration
  playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  // Success sound - ascending tone
  playSuccess() {
    const ctx = this.getContext();
    [523, 659, 784].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.2), i * 100);
    });
  }

  // Error/wrong sound - descending buzzer
  playError() {
    this.playTone(200, 0.3, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.15), 150);
  }

  // Tap/click feedback
  playTap() {
    this.playTone(800, 0.05, 'sine', 0.1);
  }

  // UI click sound (alias for playTap)
  playUIClick() {
    this.playTone(600, 0.08, 'sine', 0.15);
  }

  // Heartbeat sound for Critical Sync
  playHeartbeat(fast: boolean = false) {
    const duration = fast ? 0.08 : 0.12;
    const gap = fast ? 80 : 120;
    
    this.playTone(80, duration, 'sine', 0.3);
    setTimeout(() => this.playTone(60, duration * 0.8, 'sine', 0.2), gap);
  }

  // Start continuous heartbeat
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  startHeartbeat(bpm: number = 80) {
    this.stopHeartbeat();
    const interval = (60 / bpm) * 1000;
    this.playHeartbeat(bpm > 100);
    this.heartbeatInterval = setInterval(() => {
      this.playHeartbeat(bpm > 100);
    }, interval);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Warning alarm for Code Blue
  playAlarm() {
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.25);
    oscillator.frequency.setValueAtTime(440, ctx.currentTime + 0.5);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.75);
    
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime + 0.9);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 1);
  }

  // Combo/multiplier activation sound
  playCombo() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'triangle', 0.15), i * 75);
    });
  }

  // Shield damage sound
  playShieldDamage() {
    this.playTone(150, 0.2, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(100, 0.15, 'sawtooth', 0.15), 100);
  }

  // Shield heal sound
  playShieldHeal() {
    this.playTone(400, 0.1, 'sine', 0.15);
    setTimeout(() => this.playTone(600, 0.15, 'sine', 0.15), 80);
  }

  // Hazard pop sound
  playHazardPop() {
    this.playTone(300, 0.05, 'square', 0.1);
    setTimeout(() => this.playTone(500, 0.08, 'sine', 0.15), 30);
  }

  // Victory fanfare
  playVictory() {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'triangle', 0.2), i * 120);
    });
  }

  // Game over sound
  playGameOver() {
    [392, 349, 330, 294].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.15), i * 200);
    });
  }

  // Countdown tick
  playTick() {
    this.playTone(1000, 0.05, 'sine', 0.1);
  }

  // Final countdown (last 5 seconds)
  playUrgentTick() {
    this.playTone(1200, 0.08, 'square', 0.15);
  }

  // Milestone celebration sound - triumphant fanfare
  playMilestoneFanfare() {
    const ctx = this.getContext();
    const notes = [
      { freq: 523, duration: 0.15 },
      { freq: 659, duration: 0.15 },
      { freq: 784, duration: 0.15 },
      { freq: 1047, duration: 0.3 },
      { freq: 1047, duration: 0.2 },
      { freq: 1319, duration: 0.4 },
    ];

    notes.forEach((note, i) => {
      const startTime = notes.slice(0, i).reduce((sum, n) => sum + n.duration, 0) * 1000;
      setTimeout(() => this.playTone(note.freq, note.duration, 'triangle', 0.25), startTime);
    });
  }

  // Combo streak sound - ascending with intensity
  playComboStreak(level: number = 1) {
    const baseFreq = 400;
    const notes = Array.from({ length: Math.min(level, 5) }, (_, i) => baseFreq + i * 100);
    
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.1, 'sine', 0.2), i * 60);
    });
  }

  // Team collective success - rich sound
  playTeamSuccess() {
    const ctx = this.getContext();
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator1.frequency.setValueAtTime(659, ctx.currentTime);
    oscillator2.frequency.setValueAtTime(523, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    oscillator1.start(ctx.currentTime);
    oscillator2.start(ctx.currentTime);
    oscillator1.stop(ctx.currentTime + 0.3);
    oscillator2.stop(ctx.currentTime + 0.3);

    // Follow with ascending notes
    setTimeout(() => {
      [784, 987, 1047].forEach((freq, i) => {
        setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.2), i * 100);
      });
    }, 300);
  }

  // Excitement pulse sound
  playExcitementPulse() {
    const pulses = [600, 700, 650, 800];
    pulses.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.12, 'sine', 0.15), i * 80);
    });
  }
}

export const gameAudio = new GameAudio();
