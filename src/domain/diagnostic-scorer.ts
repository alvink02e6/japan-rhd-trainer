import type {
  DiagnosticGrade,
  DrillAttemptSummary,
  DrillId,
  ErrorReductionState,
  MistakeType,
  QuizAnswerRecord,
  QuizSessionResult,
  ReadinessDiagnosticCard,
  RuleMistakeRecord,
  SignalCategory,
  SignalScenarioQuestion,
} from './types';

const CATEGORY_BLINDSPOT_LABELS: Record<SignalCategory, string> = {
  'horizontal-order': '日本橫排紅綠燈為「綠燈在左、紅燈在右」（與台灣左右相反）',
  'arrow-signal': '主燈紅燈＋下排綠箭頭（矢印式信号機）時，可依箭頭方向優先通行',
  'red-no-turn': '日本圓形紅燈且無箭頭時，全面禁止左轉或右轉，切勿搶快',
  'stop-sign': '紅倒三角「止まれ」必須在停止線前完全靜止滿 1 秒再開',
  'pedestrian-yield': '轉彎遇斑馬線行人或對向直行車，必須完全停讓（行人絕對優先）',
};

const MISTAKE_BLINDSPOT_LABELS: Record<MistakeType, string> = {
  'wiper-mistrigger': '轉彎習慣撥左桿誤觸雨刷！請記住「靠窗側（右手）才是方向燈」',
  'tomare-rolling-stop': '「止まれ」路口僅減速滑行未完全靜止，易遭開罰與側撞',
  'wrong-way-lane': '右轉習慣性切入右側逆向車道！務必記口訣「左小彎、右大彎入左道」',
  'signal-violation': '誤判日本上下排箭頭號誌或紅燈搶行，請先確認下排綠色箭頭方向',
  'yield-violation': '右轉未禮讓對向直行來車或斑馬線行人（日本外籍右轉事故高達 2.4–2.7 倍）',
};

export function createEmptyMistakeCounts(): Record<MistakeType, number> {
  return {
    'wiper-mistrigger': 0,
    'tomare-rolling-stop': 0,
    'wrong-way-lane': 0,
    'signal-violation': 0,
    'yield-violation': 0,
  };
}

export function scoreQuizSession(
  questions: readonly SignalScenarioQuestion[],
  answers: readonly QuizAnswerRecord[],
  durationMs: number,
  completedAt: string = new Date().toISOString(),
): QuizSessionResult {
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const weakSet = new Set<SignalCategory>();
  for (const ans of answers) {
    if (!ans.isCorrect) {
      weakSet.add(ans.category);
    }
  }

  return {
    totalQuestions: questions.length,
    correctCount,
    durationMs: Math.max(1, Math.round(durationMs)),
    weakCategories: Array.from(weakSet),
    answers: [...answers],
    completedAt,
  };
}

export function computeDrillAttemptSummary(
  scenarioId: DrillId,
  completed: boolean,
  durationMs: number,
  mistakes: readonly RuleMistakeRecord[],
  previousAttempts: readonly DrillAttemptSummary[],
  completedAt: string = new Date().toISOString(),
): DrillAttemptSummary {
  const scenarioHistory = previousAttempts.filter((a) => a.scenarioId === scenarioId);
  const attemptNumber = scenarioHistory.length + 1;
  const mistakesByType = createEmptyMistakeCounts();

  for (const m of mistakes) {
    mistakesByType[m.mistakeType] = (mistakesByType[m.mistakeType] ?? 0) + 1;
  }

  const totalMistakes = Object.values(mistakesByType).reduce((sum, count) => sum + count, 0);

  let errorReductionPctVsFirst: number | null = null;
  let errorReductionState: ErrorReductionState = 'first-attempt';

  if (attemptNumber >= 2) {
    const firstAttempt =
      scenarioHistory.find((a) => a.attemptNumber === 1) ?? scenarioHistory[0];
    const firstTotal = firstAttempt ? firstAttempt.totalMistakes : 0;

    if (firstTotal === 0) {
      if (totalMistakes === 0) {
        errorReductionPctVsFirst = 100;
        errorReductionState = 'perfect-maintained';
      } else {
        errorReductionPctVsFirst = 0;
        errorReductionState = 'computed';
      }
    } else {
      errorReductionPctVsFirst = Math.round(((firstTotal - totalMistakes) / firstTotal) * 100);
      errorReductionState = 'computed';
    }
  }

  return {
    scenarioId,
    attemptNumber,
    completed,
    durationMs: Math.max(1, Math.round(durationMs)),
    totalMistakes,
    mistakesByType,
    errorReductionPctVsFirst,
    errorReductionState,
    completedAt,
  };
}

function sanitizeBuddyShareUrl(rawBaseUrl?: string): string {
  const fallback = 'https://japan-rhd-trainer.pages.dev/?ref=buddy';
  if (!rawBaseUrl) {
    if (typeof window !== 'undefined' && window.location?.origin) {
      try {
        const u = new URL(window.location.pathname || '/', window.location.origin);
        u.search = '?ref=buddy';
        u.hash = '';
        return u.toString();
      } catch {
        return fallback;
      }
    }
    return fallback;
  }

  try {
    const parsed = new URL(rawBaseUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return fallback;
    }
    parsed.search = '?ref=buddy';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return fallback;
  }
}

export function buildReadinessDiagnosticCard(
  quizResult: QuizSessionResult,
  drillAttempts: readonly DrillAttemptSummary[],
  rawBaseUrl?: string,
): ReadinessDiagnosticCard {
  const accuracy =
    quizResult.totalQuestions > 0 ? quizResult.correctCount / quizResult.totalQuestions : 0;

  const latestByScenario = new Map<DrillId, DrillAttemptSummary>();
  for (const att of drillAttempts) {
    latestByScenario.set(att.scenarioId, att);
  }
  const latestDrills = Array.from(latestByScenario.values());

  const totalWipers = latestDrills.reduce(
    (s, d) => s + (d.mistakesByType['wiper-mistrigger'] ?? 0),
    0,
  );
  const hasCriticalSafetyViolation = latestDrills.some(
    (d) =>
      (d.mistakesByType['wrong-way-lane'] ?? 0) > 0 ||
      (d.mistakesByType['signal-violation'] ?? 0) > 0,
  );
  const totalLatestMistakes = latestDrills.reduce((s, d) => s + d.totalMistakes, 0);

  let grade: DiagnosticGrade;
  if (hasCriticalSafetyViolation) {
    grade = accuracy >= 0.8 ? 'B' : 'C';
  } else if (accuracy >= 0.9 && totalLatestMistakes === 0) {
    grade = 'S';
  } else if (accuracy >= 0.8 && totalLatestMistakes <= 1) {
    grade = 'A';
  } else if (accuracy >= 0.6) {
    grade = 'B';
  } else {
    grade = 'C';
  }

  let headline: string;
  if (grade === 'S') {
    headline = '沖繩／北海道右駕穩健老司機';
  } else if (totalWipers >= 2) {
    headline = `日本擋風玻璃清潔隊長（誤刷 ${totalWipers} 次雨刷）`;
  } else if (grade === 'A') {
    headline = '赴日右駕高分準駕駛';
  } else if (grade === 'B') {
    headline = '右駕反射熱身中・上路首小時請慢行';
  } else {
    headline = '高風險右駕警報・出發前務必再練一輪！';
  }

  const blindSpots: string[] = [];
  for (const d of latestDrills) {
    for (const [mType, count] of Object.entries(d.mistakesByType) as [MistakeType, number][]) {
      if (count > 0) {
        const label = MISTAKE_BLINDSPOT_LABELS[mType];
        if (!blindSpots.includes(label)) {
          blindSpots.push(label);
        }
      }
    }
  }
  for (const cat of quizResult.weakCategories) {
    const label = CATEGORY_BLINDSPOT_LABELS[cat];
    if (!blindSpots.includes(label)) {
      blindSpots.push(label);
    }
  }

  if (blindSpots.length === 0) {
    blindSpots.push('取車前 30 分鐘請默念「靠左行駛、左轉小彎、右轉大彎、右手打方向燈」');
    blindSpots.push('日本斑馬線行人具絕對優先權，轉彎與「止まれ」路口務必完全煞停確認');
  }

  const topBlindSpots = blindSpots.slice(0, 3);

  const improvedAttempt = [...drillAttempts]
    .reverse()
    .find((d) => d.attemptNumber >= 2 && d.errorReductionPctVsFirst !== null);
  let improvementBadge: string | null = null;
  if (improvedAttempt) {
    if (improvedAttempt.errorReductionState === 'perfect-maintained') {
      improvementBadge = '重複演練維持零失誤完美表現';
    } else if (
      improvedAttempt.errorReductionPctVsFirst !== null &&
      improvedAttempt.errorReductionPctVsFirst > 0
    ) {
      improvementBadge = `二次實戰失誤減少 ${improvedAttempt.errorReductionPctVsFirst}%`;
    }
  }

  const quizScoreText = `${quizResult.correctCount} / ${quizResult.totalQuestions} 題正確`;
  const shareUrl = sanitizeBuddyShareUrl(rawBaseUrl);
  const shareText = `【赴日右駕存活診斷：${grade} 級｜${headline}】我的日本差異號誌答對 ${quizScoreText}！出發去日本租車自駕前，花 3 分鐘測看看你會不會狂刷雨刷或右轉逆向 👉 ${shareUrl}`;

  return {
    grade,
    headline,
    quizScoreText,
    topBlindSpots,
    improvementBadge,
    shareText,
  };
}
