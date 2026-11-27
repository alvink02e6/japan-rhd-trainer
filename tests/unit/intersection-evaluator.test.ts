import { describe, expect, it } from 'vitest';
import { evaluateUrbanIntersectionTurn } from '../../src/domain/intersection-evaluator';
import { computeDrillAttemptSummary } from '../../src/domain/diagnostic-scorer';

describe('Urban Multi-Lane Intersection Evaluator & Repeat Error Reduction (US3)', () => {
  it('enforces arrow-signal priority, oncoming/pedestrian yield, and wrong-way right-oncoming intercept', () => {
    // 1. Red light + right green arrow, clear of pedestrians/cars, right turn into left-inbound -> PASS
    const passRes = evaluateUrbanIntersectionTurn({
      intendedMove: 'right',
      chosenExitLane: 'left-inbound',
      signalArmed: 'right',
      signalPhase: { durationMs: 3000, mainLight: 'red', activeArrows: ['right'] },
      oncomingCarConflict: false,
      pedestrianConflict: false,
    });
    expect(passRes.passed).toBe(true);
    expect(passRes.pauseForWrongWay).toBe(false);
    expect(passRes.mistakes).toEqual([]);

    // 2. Green light permissive right turn, oncoming straight car approaching -> yield-violation
    const yieldFail = evaluateUrbanIntersectionTurn({
      intendedMove: 'right',
      chosenExitLane: 'left-inbound',
      signalArmed: 'right',
      signalPhase: { durationMs: 3000, mainLight: 'green', activeArrows: [] },
      oncomingCarConflict: true,
      pedestrianConflict: false,
    });
    expect(yieldFail.passed).toBe(false);
    expect(yieldFail.mistakes).toContain('yield-violation');

    // 3. Turning into right-oncoming lane -> immediate wrong-way-lane pause-and-retry intercept
    const wrongWay = evaluateUrbanIntersectionTurn({
      intendedMove: 'right',
      chosenExitLane: 'right-oncoming',
      signalArmed: 'right',
      signalPhase: { durationMs: 3000, mainLight: 'red', activeArrows: ['right'] },
      oncomingCarConflict: false,
      pedestrianConflict: false,
    });
    expect(wrongWay.passed).toBe(false);
    expect(wrongWay.pauseForWrongWay).toBe(true);
    expect(wrongWay.mistakes).toContain('wrong-way-lane');
  });

  it('computes errorReductionPctVsFirst accurately including zero-division guard (perfect-maintained)', () => {
    // First attempt with 0 mistakes -> null
    const firstZero = computeDrillAttemptSummary('urban-drill-1', true, 50000, [], []);
    expect(firstZero.attemptNumber).toBe(1);
    expect(firstZero.errorReductionPctVsFirst).toBeNull();
    expect(firstZero.errorReductionState).toBe('first-attempt');

    // Second attempt also 0 mistakes -> 100 / perfect-maintained (no NaN or Infinity!)
    const secondZero = computeDrillAttemptSummary('urban-drill-1', true, 48000, [], [firstZero]);
    expect(secondZero.attemptNumber).toBe(2);
    expect(secondZero.errorReductionPctVsFirst).toBe(100);
    expect(secondZero.errorReductionState).toBe('perfect-maintained');

    // First attempt with 4 mistakes -> second attempt with 1 mistake -> 75% reduction
    const firstFour = computeDrillAttemptSummary(
      'urban-drill-2',
      true,
      65000,
      [
        { mistakeType: 'wiper-mistrigger', scenarioId: 'urban-drill-2', attemptNumber: 1, elapsedMs: 1000 },
        { mistakeType: 'tomare-rolling-stop', scenarioId: 'urban-drill-2', attemptNumber: 1, elapsedMs: 2000 },
        { mistakeType: 'wrong-way-lane', scenarioId: 'urban-drill-2', attemptNumber: 1, elapsedMs: 3000 },
        { mistakeType: 'yield-violation', scenarioId: 'urban-drill-2', attemptNumber: 1, elapsedMs: 4000 },
      ],
      [],
    );
    const secondOne = computeDrillAttemptSummary(
      'urban-drill-2',
      true,
      58000,
      [
        { mistakeType: 'wiper-mistrigger', scenarioId: 'urban-drill-2', attemptNumber: 2, elapsedMs: 1500 },
      ],
      [firstFour],
    );
    expect(secondOne.errorReductionPctVsFirst).toBe(75);
    expect(secondOne.errorReductionState).toBe('computed');
  });
});
