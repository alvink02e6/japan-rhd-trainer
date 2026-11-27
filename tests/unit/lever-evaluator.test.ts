import { describe, expect, it } from 'vitest';
import {
  clampSemiAssistedOffset,
  evaluateLeverInput,
  evaluateWarmupTurnChoice,
  toggleRightStalkDirection,
} from '../../src/domain/lever-evaluator';

describe('Lever Reflex & Semi-Assisted Corridor Evaluator (US2 + T053)', () => {
  it('triggers wiper-mistrigger without arming turn signal when left stalk is pressed', () => {
    const leftRes = evaluateLeverInput('left', 'right');
    expect(leftRes.triggeredWiper).toBe(true);
    expect(leftRes.mistakeType).toBe('wiper-mistrigger');
    expect(leftRes.signalArmed).toBeNull();
  });

  it('supports explicit right-stalk switching between left, right, and null (off) per UI contract §2.3', () => {
    const armLeft = toggleRightStalkDirection(null, 'left');
    expect(armLeft.signalArmed).toBe('left');
    expect(armLeft.triggeredWiper).toBe(false);

    const switchToRight = toggleRightStalkDirection(armLeft.signalArmed, 'right');
    expect(switchToRight.signalArmed).toBe('right');

    const toggleOff = toggleRightStalkDirection(switchToRight.signalArmed, 'right');
    expect(toggleOff.signalArmed).toBeNull();
    expect(toggleOff.feedbackText).toContain('關閉');
  });

  it('clamps lateral offset within maxLateralOffsetMeters and gently recenters toward left-lane center', () => {
    const bounds = { maxLateralOffsetMeters: 1.2, autoRecenterStrength: 0.8 };
    const clamped = clampSemiAssistedOffset(1.0, 0.9, 0.1, bounds);
    expect(clamped.clampedOffsetMeters).toBe(1.2);
    expect(clamped.nearBoundary).toBe(true);

    const recentered = clampSemiAssistedOffset(0.8, 0, 0.5, bounds);
    expect(recentered.clampedOffsetMeters).toBeLessThan(0.8);
    expect(recentered.clampedOffsetMeters).toBeGreaterThanOrEqual(0);
  });

  it('rejects mismatched turn-signal direction as well as right-oncoming wrong-way lane', () => {
    const wrongSignalDir = evaluateWarmupTurnChoice('right', 'left', 'left-inbound');
    expect(wrongSignalDir.passed).toBe(false);
    expect(wrongSignalDir.mistakeType).toBe('signal-violation');

    const wrongLane = evaluateWarmupTurnChoice('right', 'right', 'right-oncoming');
    expect(wrongLane.passed).toBe(false);
    expect(wrongLane.mistakeType).toBe('wrong-way-lane');

    const cleanPass = evaluateWarmupTurnChoice('right', 'right', 'left-inbound');
    expect(cleanPass.passed).toBe(true);
    expect(cleanPass.mistakeType).toBeNull();
  });
});
