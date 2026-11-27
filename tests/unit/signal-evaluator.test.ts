import { describe, expect, it } from 'vitest';
import {
  canEnterIntersection,
  evaluateQuizAnswer,
  validateQuestionBank,
} from '../../src/domain/signal-evaluator';
import { SIGNAL_QUESTIONS } from '../../src/content/signal-questions';

describe('Japanese Traffic Signal Rule Evaluator (US1)', () => {
  it('allows movement matching lower green arrow even when main light is red (矢印式信号機)', () => {
    const phase = { durationMs: 3000, mainLight: 'red' as const, activeArrows: ['left', 'straight'] as const };
    const leftRes = canEnterIntersection(
      { ...phase, activeArrows: [...phase.activeArrows] },
      'none',
      { oncomingCar: false, pedestrianCrossing: false },
      'left',
    );
    expect(leftRes.allowed).toBe(true);
    expect(leftRes.violationType).toBeNull();

    const rightRes = canEnterIntersection(
      { ...phase, activeArrows: [...phase.activeArrows] },
      'none',
      { oncomingCar: false, pedestrianCrossing: false },
      'right',
    );
    expect(rightRes.allowed).toBe(false);
    expect(rightRes.violationType).toBe('signal-violation');
  });

  it('strictly forbids all turns on pure red light with no green arrows', () => {
    const pureRed = { durationMs: 4000, mainLight: 'red' as const, activeArrows: [] };
    for (const move of ['left', 'straight', 'right'] as const) {
      const res = canEnterIntersection(
        pureRed,
        'none',
        { oncomingCar: false, pedestrianCrossing: false },
        move,
      );
      expect(res.allowed).toBe(false);
      expect(res.violationType).toBe('signal-violation');
    }

    const waitRes = canEnterIntersection(
      pureRed,
      'none',
      { oncomingCar: false, pedestrianCrossing: false },
      'stop-wait',
    );
    expect(waitRes.allowed).toBe(true);
  });

  it('requires full stop on 止まれ (tomare) auxiliary sign and yielding to pedestrians / oncoming cars', () => {
    const unsignalized = { durationMs: 3000, mainLight: 'off' as const, activeArrows: [] };
    const rollingRes = canEnterIntersection(
      unsignalized,
      'tomare',
      { oncomingCar: false, pedestrianCrossing: false },
      'left',
      false,
    );
    expect(rollingRes.allowed).toBe(false);
    expect(rollingRes.violationType).toBe('tomare-rolling-stop');

    const greenLight = { durationMs: 3000, mainLight: 'green' as const, activeArrows: [] };
    const pedConflict = canEnterIntersection(
      greenLight,
      'none',
      { oncomingCar: false, pedestrianCrossing: true },
      'left',
    );
    expect(pedConflict.allowed).toBe(false);
    expect(pedConflict.violationType).toBe('yield-violation');

    const oncomingConflict = canEnterIntersection(
      greenLight,
      'none',
      { oncomingCar: true, pedestrianCrossing: false },
      'right',
    );
    expect(oncomingConflict.allowed).toBe(false);
    expect(oncomingConflict.violationType).toBe('yield-violation');
  });

  it('validates the curated SIGNAL_QUESTIONS bank invariants (8..10 items, ID regex, all 5 categories)', () => {
    const check = validateQuestionBank(SIGNAL_QUESTIONS);
    expect(check.errors).toEqual([]);
    expect(check.valid).toBe(true);
    expect(SIGNAL_QUESTIONS.length).toBeGreaterThanOrEqual(8);
    expect(SIGNAL_QUESTIONS.length).toBeLessThanOrEqual(10);

    const first = SIGNAL_QUESTIONS[0];
    const correctRecord = evaluateQuizAnswer(first, first.correctOptionId);
    expect(correctRecord.isCorrect).toBe(true);
  });
});
