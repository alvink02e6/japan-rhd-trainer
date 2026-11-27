export interface AudioSynthController {
  unlockOnFirstGesture(): void;
  playSignalTick(): void;
  playWiperSqueak(): void;
  playWarningChime(): void;
  playPassChime(): void;
}

export function createAudioSynth(): AudioSynthController {
  let ctx: AudioContext | null = null;

  const ensureContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return null;
      try {
        ctx = new AudioCtor();
      } catch {
        return null;
      }
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  };

  const playTone = (
    freqStart: number,
    freqEnd: number,
    durationSec: number,
    type: OscillatorType,
    gainPeak = 0.12,
  ) => {
    try {
      const audio = ensureContext();
      if (!audio || audio.state !== 'running') return;
      const now = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, now);
      osc.frequency.linearRampToValueAtTime(freqEnd, now + durationSec);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(now);
      osc.stop(now + durationSec + 0.01);
    } catch {
      // Visual parity guarantees full usability when audio fails or device is muted
    }
  };

  return {
    unlockOnFirstGesture() {
      ensureContext();
    },
    playSignalTick() {
      playTone(920, 760, 0.055, 'triangle', 0.09);
    },
    playWiperSqueak() {
      playTone(340, 560, 0.18, 'sawtooth', 0.1);
      setTimeout(() => playTone(540, 310, 0.18, 'sawtooth', 0.09), 210);
    },
    playWarningChime() {
      playTone(260, 190, 0.25, 'square', 0.13);
    },
    playPassChime() {
      playTone(523.25, 659.25, 0.12, 'sine', 0.11);
      setTimeout(() => playTone(659.25, 783.99, 0.16, 'sine', 0.11), 120);
    },
  };
}

export const sharedAudioSynth = createAudioSynth();
