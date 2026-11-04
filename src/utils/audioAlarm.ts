/**
 * Web Audio API synthesizer for continuous alarm sounds and task completion chimes
 */

type RingtoneType = 'gentle_chime' | 'digital_pulse' | 'radar_beep' | 'zen_bell';

class AudioManager {
  private audioCtx: AudioContext | null = null;
  private isAlarmRinging: boolean = false;
  private alarmTimerId: number | null = null;
  private currentVolume: number = 0.8;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play a single completion chime
  playSuccessChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        
        gain.gain.setValueAtTime(0, now + i * 0.07);
        gain.gain.linearRampToValueAtTime(0.18, now + i * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.38);
      });
    } catch {
      // Audio context might be blocked until user interaction
    }
  }

  // Play one cycle of the selected ringtone
  private playRingtoneBurst(type: RingtoneType, volume: number = 0.8) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(Math.min(Math.max(volume, 0.1), 1.0), now);
      masterGain.connect(ctx.destination);

      if (type === 'digital_pulse') {
        // Fast dual beeps (Beep-Beep ... Beep-Beep)
        [0, 0.16, 0.42, 0.58].forEach((timeOffset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(880, now + timeOffset); // A5
          
          gain.gain.setValueAtTime(0.001, now + timeOffset);
          gain.gain.linearRampToValueAtTime(0.3, now + timeOffset + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.11);
          
          osc.connect(gain);
          gain.connect(masterGain);
          
          osc.start(now + timeOffset);
          osc.stop(now + timeOffset + 0.12);
        });
      } else if (type === 'gentle_chime') {
        // Harmonious marimba chord progression
        const chord = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);
          
          gain.gain.setValueAtTime(0.001, now + idx * 0.09);
          gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.09 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.8);
          
          osc.connect(gain);
          gain.connect(masterGain);
          
          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 0.85);
        });
      } else if (type === 'radar_beep') {
        // Escalating sonar wave
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.28);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.52);
      } else {
        // 'zen_bell' - deep bell with rich low harmonics
        [329.63, 659.25, 987.77].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          
          const amp = idx === 0 ? 0.35 : 0.15;
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(amp, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
          
          osc.connect(gain);
          gain.connect(masterGain);
          
          osc.start(now);
          osc.stop(now + 1.25);
        });
      }
    } catch {
      // Audio playback safety catch
    }
  }

  // Start continuous alarm loop until explicitly stopped
  startContinuousAlarm(type: RingtoneType = 'gentle_chime', volume: number = 0.8) {
    if (this.isAlarmRinging) return;
    this.isAlarmRinging = true;
    this.currentVolume = volume;

    // Play first burst immediately
    this.playRingtoneBurst(type, volume);

    // Loop interval based on ringtone type
    const intervalMs = type === 'digital_pulse' ? 1400 : 2000;
    
    this.alarmTimerId = window.setInterval(() => {
      if (!this.isAlarmRinging) {
        this.stopAlarm();
        return;
      }
      this.playRingtoneBurst(type, this.currentVolume);
    }, intervalMs);
  }

  // Preview one burst for ringtone selector in settings
  previewRingtone(type: RingtoneType, volume: number = 0.8) {
    this.stopAlarm();
    this.playRingtoneBurst(type, volume);
  }

  // Stop the continuous alarm
  stopAlarm() {
    this.isAlarmRinging = false;
    if (this.alarmTimerId !== null) {
      clearInterval(this.alarmTimerId);
      this.alarmTimerId = null;
    }
  }

  getIsRinging(): boolean {
    return this.isAlarmRinging;
  }
}

export const audioManager = new AudioManager();
