import { useEffect, useMemo, useState } from 'preact/hooks';
import type {
  AnonymousValidationSession,
  ConfidenceRating,
  DrillAttemptSummary,
  DrillId,
  QuizSessionResult,
  RenderMode,
} from '../domain/types';
import type { SafeStorageAdapter } from '../platform/safe-storage';
import { saveSession } from '../platform/safe-storage';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { sharedAudioSynth } from '../platform/audio-synth';
import { SIGNAL_QUESTIONS } from '../content/signal-questions';
import { DRILL_SCENARIOS } from '../content/drill-scenarios';
import { buildReadinessDiagnosticCard } from '../domain/diagnostic-scorer';
import {
  applyBuddyShareOutcome,
  recordFakeDoorIntentClick,
} from '../domain/unlock-manager';
import { DisclaimerModal } from './DisclaimerModal';
import { SignalQuizView } from './SignalQuizView';
import { DiagnosticCardView } from './DiagnosticCardView';
import { PreviewPacksPanel, ScenarioHubView } from './ScenarioHubView';
import { DrillContainerView } from './DrillContainerView';
import { DrillSummaryView } from './DrillSummaryView';

export type AppView = 'landing' | 'quiz' | 'diagnostic' | 'hub' | 'drill' | 'drill-summary';

export interface AppProps {
  storage: SafeStorageAdapter;
  initialSession: AnonymousValidationSession;
  urlEntryRef: 'direct' | 'buddy-share';
  telemetry: TelemetryClient;
  onRenderModeChange: (mode: RenderMode) => void;
}

export function App({
  storage,
  initialSession,
  urlEntryRef,
  telemetry,
  onRenderModeChange,
}: AppProps) {
  const [session, setSession] = useState<AnonymousValidationSession>(initialSession);
  const [view, setView] = useState<AppView>('landing');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [activeDrillId, setActiveDrillId] = useState<DrillId>('warmup-range');
  const [latestDrillSummary, setLatestDrillSummary] = useState<DrillAttemptSummary | null>(null);
  const [coreLoopTracked, setCoreLoopTracked] = useState<boolean>(false);

  const force2DFromQuery = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      return new URLSearchParams(window.location.search).get('render') === '2d';
    } catch {
      return false;
    }
  }, []);

  const updateSession = (
    updater: (prev: AnonymousValidationSession) => AnonymousValidationSession,
  ) => {
    setSession((prev) => {
      const next = updater(prev);
      saveSession(storage, next);
      return next;
    });
  };

  // Idle background preload hook for lazy 3D scene module while user takes Signal Quiz
  useEffect(() => {
    if (view !== 'quiz') return;
    const timer = setTimeout(() => {
      import('../scene3d/DrillEngine').catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [view]);

  const requireDisclaimerThen = (action: () => void) => {
    if (session.disclaimerAcceptedAt) {
      sharedAudioSynth.unlockOnFirstGesture();
      action();
    } else {
      setPendingAction(() => action);
    }
  };

  const handleAcceptDisclaimer = () => {
    sharedAudioSynth.unlockOnFirstGesture();
    const nowIso = new Date().toISOString();
    updateSession((prev) => ({ ...prev, disclaimerAcceptedAt: nowIso }));
    telemetry.track('disclaimer_accepted');
    const next = pendingAction;
    setPendingAction(null);
    if (next) next();
  };

  const startQuiz = () => {
    requireDisclaimerThen(() => {
      telemetry.track('quiz_started', { totalQuestions: SIGNAL_QUESTIONS.length });
      setView('quiz');
    });
  };

  const startDrill = (drillId: DrillId) => {
    requireDisclaimerThen(() => {
      setActiveDrillId(drillId);
      setView('drill');
    });
  };

  const openHub = () => {
    requireDisclaimerThen(() => {
      setView('hub');
    });
  };

  const handleQuizComplete = (result: QuizSessionResult) => {
    const card = buildReadinessDiagnosticCard(result, session.drillAttempts);
    updateSession((prev) => ({ ...prev, quizResult: result }));
    telemetry.track('quiz_completed', {
      totalQuestions: result.totalQuestions,
      correctCount: result.correctCount,
      durationMs: result.durationMs,
      grade: card.grade,
    });
    setView('diagnostic');
  };

  const handleDrillComplete = (summary: DrillAttemptSummary) => {
    setLatestDrillSummary(summary);
    const nextAttempts = [...session.drillAttempts, summary];
    updateSession((prev) => ({ ...prev, drillAttempts: nextAttempts }));

    // Emit core_loop_completed once both Quiz and Warmup Range are completed in session (SC-002)
    if (
      !coreLoopTracked &&
      session.quizResult !== null &&
      (summary.scenarioId === 'warmup-range' ||
        nextAttempts.some((a) => a.scenarioId === 'warmup-range'))
    ) {
      setCoreLoopTracked(true);
      telemetry.track('core_loop_completed', {
        totalCoreDurationMs: session.quizResult.durationMs + summary.durationMs,
      });
    }

    setView('drill-summary');
  };

  const handleBuddyShareCompleted = () => {
    updateSession((prev) => {
      const res = applyBuddyShareOutcome(prev.unlockStates, { completed: true });
      if (res.unlockedNow) {
        telemetry.track('buddy_unlock_granted', { packId: 'urban-drill-2' });
      }
      return { ...prev, unlockStates: res.nextStates };
    });
  };

  const handleFakeDoorClicked = (packId: 'hokkaido-snow-pack' | 'highway-etc-pack') => {
    updateSession((prev) => ({
      ...prev,
      unlockStates: recordFakeDoorIntentClick(prev.unlockStates, packId),
    }));
  };

  const handleSubmitConfidence = (rating: ConfidenceRating) => {
    updateSession((prev) => ({ ...prev, confidencePulse: rating }));
  };

  const defaultInviteUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}${window.location.pathname}?ref=buddy`
      : 'https://japan-rhd-trainer.pages.dev/?ref=buddy';
  const buddyInviteText = `我們去日本自駕前先花 3 分鐘練一下這個！測看看日本上下兩排箭頭紅綠燈跟右駕方向燈（小心別一直刷雨刷🤣）👉 ${defaultInviteUrl}`;

  const sharedPreviewPanel = (
    <PreviewPacksPanel
      unlockStates={session.unlockStates}
      shareInviteText={buddyInviteText}
      telemetry={telemetry}
      onBuddyShareCompleted={handleBuddyShareCompleted}
      onFakeDoorClicked={handleFakeDoorClicked}
      onStartBonusDrill={
        session.unlockStates['urban-drill-2'].unlocked
          ? () => startDrill('urban-drill-2')
          : undefined
      }
    />
  );

  const activeScenario = DRILL_SCENARIOS[activeDrillId];
  const firstAttemptForActive =
    session.drillAttempts.find(
      (a) => a.scenarioId === activeDrillId && a.attemptNumber === 1,
    ) ?? null;

  return (
    <>
      {pendingAction && (
        <DisclaimerModal
          onAccept={handleAcceptDisclaimer}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {view === 'landing' && (
        <div class="app-shell" data-testid="landing-view">
          {(urlEntryRef === 'buddy-share' || session.entryRef === 'buddy-share') && (
            <div class="buddy-banner" data-testid="buddy-welcome-banner">
              🎌 <strong>你的旅伴邀請你一起測試赴日右駕存活率！</strong> 出發前花 3 分鐘看看誰才是真正的右駕神隊友。
            </div>
          )}

          <div class="card">
            <span class="badge badge-info" style={{ marginBottom: '10px' }}>
              免下載・台灣赴日自駕專用
            </span>
            <h1 style={{ margin: '4px 0 10px', fontSize: '1.48rem', lineHeight: 1.35 }}>
              日本右駕行前認知＆差異號誌實戰演練
            </h1>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              日本官方統計外籍租車「右轉事故率是本地人的 2.4–2.7 倍」！出發前 3–5 分鐘，搞懂上下兩排箭頭紅綠燈、止まれ完全靜止，並親手體驗右駕「右手打方向燈、左手誤刷雨刷」的肌肉記憶挑戰。
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                class="touch-target btn-primary"
                data-testid="start-quiz-btn"
                onClick={startQuiz}
              >
                🚦 第 1 步：開始台日差異動態號誌測驗（10 題）
              </button>
              <button
                type="button"
                class="touch-target"
                data-testid="start-warmup-direct-btn"
                onClick={() => startDrill('warmup-range')}
              >
                🚗 直接進入第一人稱右駕熱身場
              </button>
              <button
                type="button"
                class="touch-target"
                data-testid="open-hub-btn"
                onClick={openHub}
              >
                📋 瀏覽全部實戰關卡＆進階主題
              </button>
            </div>
          </div>

          <div class="card" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            💡 支援手機瀏覽器及 LINE／Facebook 內建瀏覽器直接開啟；不需註冊、不蒐集個人識別資料。
          </div>
        </div>
      )}

      {view === 'quiz' && (
        <SignalQuizView
          questions={SIGNAL_QUESTIONS}
          onComplete={handleQuizComplete}
          onBackHome={() => setView('landing')}
        />
      )}

      {view === 'diagnostic' && session.quizResult && (
        <DiagnosticCardView
          card={buildReadinessDiagnosticCard(session.quizResult, session.drillAttempts)}
          telemetry={telemetry}
          onStartWarmupDrill={() => startDrill('warmup-range')}
          onOpenHub={() => setView('hub')}
          onRetakeQuiz={startQuiz}
          previewPacksSlot={sharedPreviewPanel}
        />
      )}

      {view === 'hub' && (
        <ScenarioHubView
          unlockStates={session.unlockStates}
          shareInviteText={buddyInviteText}
          telemetry={telemetry}
          onStartQuiz={startQuiz}
          onStartDrill={startDrill}
          onBuddyShareCompleted={handleBuddyShareCompleted}
          onFakeDoorClicked={handleFakeDoorClicked}
          onBackHome={() => setView('landing')}
        />
      )}

      {view === 'drill' && (
        <DrillContainerView
          key={`${activeDrillId}-${session.drillAttempts.length}`}
          scenario={activeScenario}
          previousAttempts={session.drillAttempts}
          telemetry={telemetry}
          force2DFallback={force2DFromQuery}
          onRenderModeChange={onRenderModeChange}
          onComplete={handleDrillComplete}
          onCancel={() => setView('hub')}
        />
      )}

      {view === 'drill-summary' && latestDrillSummary && (
        <DrillSummaryView
          scenarioTitle={DRILL_SCENARIOS[latestDrillSummary.scenarioId].title}
          summary={latestDrillSummary}
          firstAttemptSummary={firstAttemptForActive}
          confidencePulse={session.confidencePulse}
          telemetry={telemetry}
          onSubmitConfidence={handleSubmitConfidence}
          onReplayDrill={() => startDrill(latestDrillSummary.scenarioId)}
          onNextDrill={(nextId) => startDrill(nextId)}
          onOpenHub={() => setView('hub')}
          previewPacksSlot={sharedPreviewPanel}
        />
      )}
    </>
  );
}
