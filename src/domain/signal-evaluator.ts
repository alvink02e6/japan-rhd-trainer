import type {
  AuxiliarySign,
  IntendedMove,
  MistakeType,
  QuizAnswerRecord,
  SignalCategory,
  SignalPhaseKeyframe,
  SignalScenarioQuestion,
} from './types';

const REQUIRED_CATEGORIES: readonly SignalCategory[] = [
  'horizontal-order',
  'arrow-signal',
  'red-no-turn',
  'stop-sign',
  'pedestrian-yield',
];

const QUESTION_ID_REGEX = /^sig-\d{2}-[a-z0-9-]+$/;

export interface IntersectionEvaluation {
  allowed: boolean;
  requiresYieldWait: boolean;
  violationType: MistakeType | null;
  reason: string;
}

export function canEnterIntersection(
  phase: SignalPhaseKeyframe,
  auxiliarySign: AuxiliarySign,
  contextActors: { oncomingCar: boolean; pedestrianCrossing: boolean },
  intendedMove: IntendedMove,
  hasCompletedFullStop = true,
): IntersectionEvaluation {
  if (intendedMove === 'stop-wait') {
    return {
      allowed: true,
      requiresYieldWait: false,
      violationType: null,
      reason: '於停止線前安全停等，符合日本防禦駕駛與路權規定。',
    };
  }

  if (auxiliarySign === 'tomare' && !hasCompletedFullStop) {
    return {
      allowed: false,
      requiresYieldWait: false,
      violationType: 'tomare-rolling-stop',
      reason: '遇到紅倒三角「止まれ」標誌，必須於停止線前完全靜止並確認左右來車！',
    };
  }

  let lightAllowsMove = false;
  if (phase.mainLight === 'green') {
    lightAllowsMove = true;
  } else if (phase.mainLight === 'yellow') {
    lightAllowsMove = false;
  } else if (phase.mainLight === 'red') {
    lightAllowsMove = phase.activeArrows.includes(intendedMove);
  } else if (phase.mainLight === 'off') {
    lightAllowsMove = true;
  }

  if (!lightAllowsMove) {
    return {
      allowed: false,
      requiresYieldWait: false,
      violationType: 'signal-violation',
      reason:
        phase.mainLight === 'red' && phase.activeArrows.length === 0
          ? '日本紅燈且無綠色箭頭時，嚴禁任何方向通行（含左轉與右轉）！'
          : '當前號誌未開放此方向通行，請依綠色箭頭或綠燈指示行駛。',
    };
  }

  if (
    contextActors.pedestrianCrossing &&
    (intendedMove === 'left' || intendedMove === 'right' || phase.mainLight === 'off')
  ) {
    return {
      allowed: false,
      requiresYieldWait: true,
      violationType: 'yield-violation',
      reason: '日本嚴格執法「行人絕對優先」，轉彎時斑馬線有行人必須完全停讓！',
    };
  }

  if (intendedMove === 'right' && contextActors.oncomingCar) {
    return {
      allowed: false,
      requiresYieldWait: true,
      violationType: 'yield-violation',
      reason: '右轉跨線大彎時對向有直行來車，直行車優先，必須停等禮讓！',
    };
  }

  return {
    allowed: true,
    requiresYieldWait: false,
    violationType: null,
    reason: '符合日本號誌與路權規則，可安全進入目標左側車道。',
  };
}

export function evaluateQuizAnswer(
  question: SignalScenarioQuestion,
  selectedOptionId: string,
): QuizAnswerRecord {
  return {
    questionId: question.id,
    selectedOptionId,
    isCorrect: question.correctOptionId === selectedOptionId,
    category: question.category,
  };
}

export function validateQuestionBank(questions: readonly SignalScenarioQuestion[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (questions.length < 8 || questions.length > 10) {
    errors.push(`Question count must be between 8 and 10, got ${questions.length}`);
  }

  const seenIds = new Set<string>();
  const presentCategories = new Set<SignalCategory>();

  questions.forEach((q, idx) => {
    if (!QUESTION_ID_REGEX.test(q.id)) {
      errors.push(`Invalid question id format: ${q.id}`);
    }
    if (seenIds.has(q.id)) {
      errors.push(`Duplicate question id: ${q.id}`);
    }
    seenIds.add(q.id);

    if (q.order !== idx + 1) {
      errors.push(`Question ${q.id} order must be ${idx + 1}, got ${q.order}`);
    }

    presentCategories.add(q.category);

    if (q.options.length < 3 || q.options.length > 4) {
      errors.push(`Question ${q.id} must have 3..4 options, got ${q.options.length}`);
    }

    const optionIds = q.options.map((o) => o.id);
    if (!optionIds.includes(q.correctOptionId)) {
      errors.push(`Question ${q.id} correctOptionId ${q.correctOptionId} missing from options`);
    }

    if (q.signalPhases.length < 1) {
      errors.push(`Question ${q.id} must have at least 1 signalPhase`);
    }
  });

  for (const cat of REQUIRED_CATEGORIES) {
    if (!presentCategories.has(cat)) {
      errors.push(`Missing required signal category: ${cat}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
