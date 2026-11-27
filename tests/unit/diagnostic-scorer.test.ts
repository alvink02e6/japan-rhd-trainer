import { describe, expect, it } from 'vitest';
import {
  buildReadinessDiagnosticCard,
  computeDrillAttemptSummary,
  scoreQuizSession,
} from '../../src/domain/diagnostic-scorer';
import { SIGNAL_QUESTIONS } from '../../src/content/signal-questions';
import type { QuizAnswerRecord } from '../../src/domain/types';

describe('Quiz Scorer & ReadinessDiagnosticCard Grading (US1)', () => {
  it('awards S grade for >=90% quiz accuracy with zero wrong-way/signal violations', () => {
    const answers: QuizAnswerRecord[] = SIGNAL_QUESTIONS.map((q) => ({
      questionId: q.id,
      selectedOptionId: q.correctOptionId,
      isCorrect: true,
      category: q.category,
    }));

    const quizRes = scoreQuizSession(SIGNAL_QUESTIONS, answers, 55000);
    expect(quizRes.correctCount).toBe(SIGNAL_QUESTIONS.length);
    expect(quizRes.weakCategories).toEqual([]);

    const card = buildReadinessDiagnosticCard(
      quizRes,
      [],
      'https://example.com/?utm=<script>alert(1)</script>',
    );
    expect(card.grade).toBe('S');
    expect(card.topBlindSpots.length).toBeLessThanOrEqual(3);
    expect(card.shareText).toContain('https://example.com/?ref=buddy');
    expect(card.shareText).not.toContain('<script>');
  });

  it('caps grade at B or C when wrong-way-lane or signal-violation occurs, and limits topBlindSpots to max 3', () => {
    const answers: QuizAnswerRecord[] = SIGNAL_QUESTIONS.map((q, idx) => ({
      questionId: q.id,
      selectedOptionId: idx < 4 ? 'wrong-opt' : q.correctOptionId,
      isCorrect: idx >= 4,
      category: q.category,
    }));

    const quizRes = scoreQuizSession(SIGNAL_QUESTIONS, answers, 70000);
    expect(quizRes.weakCategories.length).toBeGreaterThan(0);

    const drillAttempt = computeDrillAttemptSummary(
      'urban-drill-1',
      true,
      62000,
      [
        {
          mistakeType: 'wrong-way-lane',
          scenarioId: 'urban-drill-1',
          attemptNumber: 1,
          elapsedMs: 12000,
        },
        {
          mistakeType: 'wiper-mistrigger',
          scenarioId: 'urban-drill-1',
          attemptNumber: 1,
          elapsedMs: 18000,
        },
      ],
      [],
    );

    const card = buildReadinessDiagnosticCard(quizRes, [drillAttempt], 'https://rhd.example.org');
    expect(['B', 'C']).toContain(card.grade);
    expect(card.topBlindSpots.length).toBeLessThanOrEqual(3);
    expect(card.topBlindSpots.length).toBeGreaterThan(0);
  });
});
