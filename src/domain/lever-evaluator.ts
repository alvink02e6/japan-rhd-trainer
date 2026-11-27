import type { ExitLaneChoice, MistakeType, SemiAssistBounds } from './types';

export interface LeverEvaluationResult {
  triggeredWiper: boolean;
  mistakeType: 'wiper-mistrigger' | null;
  signalArmed: 'left' | 'right' | null;
  feedbackText: string;
}

export function evaluateLeverInput(
  side: 'left' | 'right',
  nextSignal: 'left' | 'right' | null = 'right',
): LeverEvaluationResult {
  if (side === 'left') {
    return {
      triggeredWiper: true,
      mistakeType: 'wiper-mistrigger',
      signalArmed: null,
      feedbackText: '⚠️ 按到雨刷了！日本右駕「方向燈在右邊（靠窗側）」，左邊是雨刷！',
    };
  }

  if (nextSignal === null) {
    return {
      triggeredWiper: false,
      mistakeType: null,
      signalArmed: null,
      feedbackText: '已關閉右側方向燈撥桿。',
    };
  }

  return {
    triggeredWiper: false,
    mistakeType: null,
    signalArmed: nextSignal,
    feedbackText:
      nextSignal === 'left'
        ? '✅ 已用右手開啟【左轉方向燈】（準備貼左小彎）'
        : '✅ 已用右手開啟【右轉方向燈】（準備跨線大彎入左道）',
  };
}

export function toggleRightStalkDirection(
  currentSignal: 'left' | 'right' | null,
  selectedDirection: 'left' | 'right',
): LeverEvaluationResult {
  const next = currentSignal === selectedDirection ? null : selectedDirection;
  return evaluateLeverInput('right', next);
}

export function clampSemiAssistedOffset(
  currentOffsetMeters: number,
  steerDeltaMeters: number,
  deltaSec: number,
  bounds: SemiAssistBounds,
): { clampedOffsetMeters: number; nearBoundary: boolean } {
  let next = currentOffsetMeters + steerDeltaMeters;

  if (steerDeltaMeters === 0 && Math.abs(next) > 0.01) {
    const pull = bounds.autoRecenterStrength * deltaSec;
    if (next > 0) {
      next = Math.max(0, next - pull);
    } else {
      next = Math.min(0, next + pull);
    }
  }

  const limit = Math.max(0.3, bounds.maxLateralOffsetMeters);
  const clamped = Math.max(-limit, Math.min(limit, next));
  const nearBoundary = Math.abs(clamped) >= limit * 0.85;

  return {
    clampedOffsetMeters: Number(clamped.toFixed(4)),
    nearBoundary,
  };
}

export function evaluateWarmupTurnChoice(
  signalArmed: 'left' | 'right' | null,
  requiredDirection: 'left' | 'right',
  chosenExitLane: ExitLaneChoice,
): {
  passed: boolean;
  mistakeType: MistakeType | null;
  feedbackText: string;
} {
  if (chosenExitLane === 'right-oncoming') {
    return {
      passed: false,
      mistakeType: 'wrong-way-lane',
      feedbackText:
        '🚨 逆向危險！你習慣性切進了右側對向車道！日本靠左行駛，轉彎後務必進入【左側順向車道】。',
    };
  }

  if (signalArmed !== requiredDirection) {
    return {
      passed: false,
      mistakeType: 'signal-violation',
      feedbackText:
        signalArmed === null
          ? `轉彎前請先用【右側撥桿】開啟${requiredDirection === 'left' ? '左轉' : '右轉'}方向燈！`
          : `方向燈打反了！本路口應開啟【${requiredDirection === 'left' ? '左轉' : '右轉'}方向燈】。`,
    };
  }

  return {
    passed: true,
    mistakeType: null,
    feedbackText:
      requiredDirection === 'left'
        ? '✅ 完美完成「右手方向燈＋左轉貼左小彎」！'
        : '✅ 完美完成「右手方向燈＋右轉大彎進入左側車道」！',
  };
}
