export type StopSignPhase =
  | 'Idle'
  | 'Approaching'
  | 'StoppedAtLine'
  | 'FullStopValidated'
  | 'ViolationRollingStop'
  | 'Cleared';

export interface StopSignMachineState {
  phase: StopSignPhase;
  stoppedDurationMs: number;
  emittedMistake: 'tomare-rolling-stop' | null;
}

export interface StopSignStepInput {
  distanceToStopLineMeters: number;
  speedKmh: number;
  deltaMs: number;
}

export const TOMARE_DETECTION_ZONE_METERS = 15;
export const TOMARE_STOP_LINE_WINDOW_METERS = 4;
export const TOMARE_STOP_SPEED_THRESHOLD_KMH = 0.2;
export const TOMARE_EARLY_ACCEL_RESET_KMH = 0.5;
export const TOMARE_REQUIRED_STOP_MS = 1000;

export function createStopSignMachine(): StopSignMachineState {
  return {
    phase: 'Idle',
    stoppedDurationMs: 0,
    emittedMistake: null,
  };
}

export function stepStopSignMachine(
  prev: StopSignMachineState,
  input: StopSignStepInput,
): StopSignMachineState {
  if (prev.phase === 'Cleared' || prev.phase === 'ViolationRollingStop') {
    return prev;
  }

  const { distanceToStopLineMeters: dist, speedKmh, deltaMs } = input;

  // Crossed stop line (< 0m)
  if (dist < 0) {
    if (prev.phase === 'FullStopValidated') {
      return {
        phase: 'Cleared',
        stoppedDurationMs: prev.stoppedDurationMs,
        emittedMistake: null,
      };
    }
    return {
      phase: 'ViolationRollingStop',
      stoppedDurationMs: prev.stoppedDurationMs,
      emittedMistake: 'tomare-rolling-stop',
    };
  }

  // Outside 15m detection zone
  if (dist > TOMARE_DETECTION_ZONE_METERS) {
    return prev;
  }

  // Already validated full stop and still behind line -> stay FullStopValidated until crossing
  if (prev.phase === 'FullStopValidated') {
    return prev;
  }

  // Inside 0..4m stop window at <= 0.2 km/h
  if (dist >= 0 && dist <= TOMARE_STOP_LINE_WINDOW_METERS && speedKmh <= TOMARE_STOP_SPEED_THRESHOLD_KMH) {
    const accumulated = prev.stoppedDurationMs + Math.max(0, deltaMs);
    if (accumulated >= TOMARE_REQUIRED_STOP_MS) {
      return {
        phase: 'FullStopValidated',
        stoppedDurationMs: accumulated,
        emittedMistake: null,
      };
    }
    return {
      phase: 'StoppedAtLine',
      stoppedDurationMs: accumulated,
      emittedMistake: null,
    };
  }

  // If previously StoppedAtLine (< 1000ms) and re-accelerated > 0.5 km/h -> reset!
  if (prev.phase === 'StoppedAtLine' && speedKmh > TOMARE_EARLY_ACCEL_RESET_KMH) {
    return {
      phase: 'Approaching',
      stoppedDurationMs: 0,
      emittedMistake: null,
    };
  }

  return {
    phase: prev.phase === 'Idle' ? 'Approaching' : prev.phase,
    stoppedDurationMs: prev.phase === 'StoppedAtLine' ? prev.stoppedDurationMs : 0,
    emittedMistake: null,
  };
}
