import { describe, expect, it } from 'vitest';
import {
  createStopSignMachine,
  stepStopSignMachine,
} from '../../src/domain/stop-sign-evaluator';

describe('止まれ (Tomare) Full-Stop State Machine (US3)', () => {
  it('validates full stop only when speed <= 0.2 km/h within 0..4m of stop line for >= 1000ms', () => {
    let state = createStopSignMachine();
    expect(state.phase).toBe('Idle');

    // Enter 15m detection zone at 25 km/h
    state = stepStopSignMachine(state, { distanceToStopLineMeters: 12, speedKmh: 25, deltaMs: 200 });
    expect(state.phase).toBe('Approaching');

    // Stop at 2.1m before stop line at 0.1 km/h for 600ms + 500ms = 1100ms
    state = stepStopSignMachine(state, { distanceToStopLineMeters: 2.1, speedKmh: 0.1, deltaMs: 600 });
    expect(state.phase).toBe('StoppedAtLine');
    expect(state.stoppedDurationMs).toBe(600);

    state = stepStopSignMachine(state, { distanceToStopLineMeters: 2.1, speedKmh: 0.0, deltaMs: 500 });
    expect(state.phase).toBe('FullStopValidated');

    // Accelerate and cross stop line safely
    state = stepStopSignMachine(state, { distanceToStopLineMeters: -1.0, speedKmh: 15, deltaMs: 300 });
    expect(state.phase).toBe('Cleared');
    expect(state.emittedMistake).toBeNull();
  });

  it('resets to Approaching on early acceleration (> 0.5 km/h before 1000ms) and flags ViolationRollingStop on crossing', () => {
    let state = createStopSignMachine();
    state = stepStopSignMachine(state, { distanceToStopLineMeters: 3.0, speedKmh: 0.0, deltaMs: 700 });
    expect(state.phase).toBe('StoppedAtLine');

    // Re-accelerate at 700ms (< 1000ms) above 0.5 km/h
    state = stepStopSignMachine(state, { distanceToStopLineMeters: 2.5, speedKmh: 4.0, deltaMs: 200 });
    expect(state.phase).toBe('Approaching');
    expect(state.stoppedDurationMs).toBe(0);

    // Cross stop line without completing 1000ms full stop
    state = stepStopSignMachine(state, { distanceToStopLineMeters: -0.5, speedKmh: 12.0, deltaMs: 200 });
    expect(state.phase).toBe('ViolationRollingStop');
    expect(state.emittedMistake).toBe('tomare-rolling-stop');
  });
});
