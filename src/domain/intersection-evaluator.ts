import type { ExitLaneChoice, MistakeType, SignalPhaseKeyframe } from './types';
import { canEnterIntersection } from './signal-evaluator';

export interface UrbanTurnEvaluationInput {
  intendedMove: 'left' | 'right';
  chosenExitLane: ExitLaneChoice;
  signalArmed: 'left' | 'right' | null;
  signalPhase: SignalPhaseKeyframe;
  oncomingCarConflict: boolean;
  pedestrianConflict: boolean;
}

export interface UrbanTurnEvaluationResult {
  passed: boolean;
  pauseForWrongWay: boolean;
  mistakes: MistakeType[];
  feedbackText: string;
}

export function evaluateUrbanIntersectionTurn(
  input: UrbanTurnEvaluationInput,
): UrbanTurnEvaluationResult {
  const mistakes: MistakeType[] = [];

  if (input.chosenExitLane === 'right-oncoming') {
    mistakes.push('wrong-way-lane');
    return {
      passed: false,
      pauseForWrongWay: true,
      mistakes,
      feedbackText:
        '🚨 逆向危險攔截！台灣左駕習慣切入右側車道，但在日本右駕必須記住「左小彎、右大彎」——轉彎後請務必駛入目標道路的【左側順向車道】！',
    };
  }

  const intersectionCheck = canEnterIntersection(
    input.signalPhase,
    'none',
    {
      oncomingCar: input.oncomingCarConflict,
      pedestrianCrossing: input.pedestrianConflict,
    },
    input.intendedMove,
    true,
  );

  if (!intersectionCheck.allowed && intersectionCheck.violationType) {
    mistakes.push(intersectionCheck.violationType);
    return {
      passed: false,
      pauseForWrongWay: false,
      mistakes,
      feedbackText: `⚠️ ${intersectionCheck.reason}`,
    };
  }

  if (input.signalArmed !== input.intendedMove) {
    mistakes.push('signal-violation');
    return {
      passed: false,
      pauseForWrongWay: false,
      mistakes,
      feedbackText: `⚠️ 轉彎前請先使用【右側撥桿】開啟${input.intendedMove === 'left' ? '左轉' : '右轉'}方向燈！`,
    };
  }

  return {
    passed: true,
    pauseForWrongWay: false,
    mistakes: [],
    feedbackText:
      input.intendedMove === 'right'
        ? '✅ 標準日本右轉大彎通過！已確認箭頭號誌、禮讓來車／行人並準確進入左側車道。'
        : '✅ 標準日本左轉小彎通過！已禮讓斑馬線行人並貼左駛入左側車道。',
  };
}
