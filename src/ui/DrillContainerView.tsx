import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type {
  DrillAttemptSummary,
  DrivingDrillScenario,
  ExitLaneChoice,
  MistakeType,
  RenderMode,
  RuleMistakeRecord,
  SignalPhaseKeyframe,
} from '../domain/types';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { bindDrillInterruptionGuards } from '../platform/viewport-guard';
import { sharedAudioSynth } from '../platform/audio-synth';
import {
  clampSemiAssistedOffset,
  evaluateLeverInput,
  evaluateWarmupTurnChoice,
  toggleRightStalkDirection,
} from '../domain/lever-evaluator';
import {
  createStopSignMachine,
  stepStopSignMachine,
  type StopSignMachineState,
} from '../domain/stop-sign-evaluator';
import { evaluateUrbanIntersectionTurn } from '../domain/intersection-evaluator';
import { computeDrillAttemptSummary } from '../domain/diagnostic-scorer';
import type { DrillEngineController, DrillVisualState } from '../scene3d/DrillEngine';
import { Fallback2DView } from '../scene3d/Fallback2DView';
import { CockpitHud } from './CockpitHud';

interface DrillContainerViewProps {
  scenario: DrivingDrillScenario;
  previousAttempts: readonly DrillAttemptSummary[];
  telemetry: TelemetryClient;
  force2DFallback?: boolean;
  onRenderModeChange: (mode: RenderMode) => void;
  onComplete: (summary: DrillAttemptSummary) => void;
  onCancel: () => void;
}

export function DrillContainerView({
  scenario,
  previousAttempts,
  telemetry,
  force2DFallback = false,
  onRenderModeChange,
  onComplete,
  onCancel,
}: DrillContainerViewProps) {
  const attemptNumber =
    previousAttempts.filter((a) => a.scenarioId === scenario.id).length + 1;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<DrillEngineController | null>(null);

  const [use2DFallback, setUse2DFallback] = useState<boolean>(force2DFallback);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [wrongWayModalText, setWrongWayModalText] = useState<string | null>(null);

  const [cpIdx, setCpIdx] = useState<number>(0);
  const [distanceMeters, setDistanceMeters] = useState<number>(
    scenario.checkpoints[0]?.distanceMeters ?? 36,
  );
  const [speedKmh, setSpeedKmh] = useState<number>(22);
  const [isBraking, setIsBraking] = useState<boolean>(false);
  const [lateralOffset, setLateralOffset] = useState<number>(0);
  const [signalArmed, setSignalArmed] = useState<'left' | 'right' | null>(null);
  const [wiperActive, setWiperActive] = useState<boolean>(false);
  const [stopState, setStopState] = useState<StopSignMachineState>(() => createStopSignMachine());
  const [cpElapsedMs, setCpElapsedMs] = useState<number>(0);
  const [totalElapsedMs, setTotalElapsedMs] = useState<number>(0);
  const [banner, setBanner] = useState<{
    tone: 'wiper' | 'danger' | 'pass' | 'info';
    text: string;
  } | null>(null);

  // Mutable simulation & idempotency guard refs (T055: zero side effects inside state updaters)
  const simRef = useRef({
    cpIdx: 0,
    distanceMeters: scenario.checkpoints[0]?.distanceMeters ?? 36,
    speedKmh: 22,
    isBraking: false,
    lateralOffset: 0,
    stopState: createStopSignMachine(),
    cpElapsedMs: 0,
    totalElapsedMs: 0,
    advancedCpSet: new Set<number>(),
    loggedRollingStopCpSet: new Set<number>(),
  });

  const mistakesRef = useRef<RuleMistakeRecord[]>([]);
  const completedRef = useRef<boolean>(false);

  const currentCp = scenario.checkpoints[cpIdx] ?? scenario.checkpoints[0];

  const showBanner = (
    tone: 'wiper' | 'danger' | 'pass' | 'info',
    text: string,
    durationMs = 2600,
  ) => {
    setBanner({ tone, text });
    setTimeout(() => {
      setBanner((prev) => (prev?.text === text ? null : prev));
    }, durationMs);
  };

  const logMistake = (mistakeType: MistakeType, checkpointId?: string) => {
    const record: RuleMistakeRecord = {
      mistakeType,
      scenarioId: scenario.id,
      checkpointId,
      attemptNumber,
      elapsedMs: Math.round(simRef.current.totalElapsedMs),
    };
    mistakesRef.current.push(record);
    telemetry.track('rule_mistake_logged', {
      scenarioId: scenario.id,
      attemptNumber,
      mistakeType,
    });
  };

  useEffect(() => {
    telemetry.track('drill_started', {
      scenarioId: scenario.id,
      attemptNumber,
    });
  }, [scenario.id, attemptNumber, telemetry]);

  // Bind LINE/FB IAB interruption & multi-touch guards synchronously before first paint (FR-010)
  useLayoutEffect(() => {
    return bindDrillInterruptionGuards(rootRef.current, () => {
      if (!completedRef.current) {
        setIsPaused(true);
      }
    });
  }, []);

  // Dynamically load Three.js WebGL2 engine chunk (Code-Splitting per R2 / SC-001)
  useEffect(() => {
    if (force2DFallback || use2DFallback) {
      onRenderModeChange('fallback-2d');
      return;
    }

    let cancelled = false;
    let resizeHandler: (() => void) | null = null;

    import('../scene3d/DrillEngine')
      .then(({ createDrillEngine }) => {
        if (cancelled || !stageRef.current) return;
        const ctrl = createDrillEngine(stageRef.current, {
          onRenderModeResolved: (mode) => onRenderModeChange(mode),
          onDegradeTo2D: (reason) => {
            telemetry.track('render_degraded', { reason });
            setUse2DFallback(true);
          },
        });
        if (!ctrl) {
          setUse2DFallback(true);
          return;
        }
        engineRef.current = ctrl;
        resizeHandler = () => ctrl.resize();
        window.addEventListener('resize', resizeHandler, { passive: true });
      })
      .catch(() => {
        if (!cancelled) {
          onRenderModeChange('fallback-2d');
          telemetry.track('render_degraded', { reason: 'webgl-unavailable' });
          setUse2DFallback(true);
        }
      });

    return () => {
      cancelled = true;
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [force2DFallback, use2DFallback, onRenderModeChange, telemetry]);

  const resolveTrafficSnapshot = (elapsedInCpMs: number): {
    signalPhase: SignalPhaseKeyframe | null;
    oncomingCarConflict: boolean;
    pedestrianConflict: boolean;
    actorCycleProgress: number;
  } => {
    let signalPhase: SignalPhaseKeyframe | null = null;
    if (currentCp.signalPhases && currentCp.signalPhases.length > 0) {
      const totalCycle = currentCp.signalPhases.reduce((s, p) => s + p.durationMs, 0);
      let rem = elapsedInCpMs % Math.max(1, totalCycle);
      signalPhase = currentCp.signalPhases[0];
      for (const p of currentCp.signalPhases) {
        if (rem < p.durationMs) {
          signalPhase = p;
          break;
        }
        rem -= p.durationMs;
      }
    }

    const cycleMs = 6000;
    const mod = elapsedInCpMs % cycleMs;
    const actorCycleProgress = Math.min(1, mod / 2600);

    const pedestrianConflict = Boolean(currentCp.hasPedestrianCrossing && mod < 2400);
    const oncomingCarConflict = Boolean(
      currentCp.hasOncomingCar &&
        (!signalPhase || signalPhase.mainLight === 'green') &&
        mod < 2800,
    );

    return {
      signalPhase,
      oncomingCarConflict,
      pedestrianConflict,
      actorCycleProgress,
    };
  };

  const advanceOrFinishCheckpoint = (fromCpIndex: number) => {
    if (simRef.current.advancedCpSet.has(fromCpIndex) || completedRef.current) {
      return;
    }
    simRef.current.advancedCpSet.add(fromCpIndex);

    if (fromCpIndex + 1 < scenario.checkpoints.length) {
      const nextIdx = fromCpIndex + 1;
      const nextCp = scenario.checkpoints[nextIdx];
      const freshStop = createStopSignMachine();

      simRef.current.cpIdx = nextIdx;
      simRef.current.distanceMeters = nextCp.distanceMeters;
      simRef.current.speedKmh = 22;
      simRef.current.isBraking = false;
      simRef.current.stopState = freshStop;
      simRef.current.cpElapsedMs = 0;

      setCpIdx(nextIdx);
      setDistanceMeters(nextCp.distanceMeters);
      setSignalArmed(null);
      setIsBraking(false);
      setSpeedKmh(22);
      setStopState(freshStop);
      setCpElapsedMs(0);
    } else {
      completedRef.current = true;
      const summary = computeDrillAttemptSummary(
        scenario.id,
        true,
        Math.max(1000, simRef.current.totalElapsedMs),
        mistakesRef.current,
        previousAttempts,
      );
      telemetry.track('drill_completed', {
        scenarioId: scenario.id,
        attemptNumber: summary.attemptNumber,
        durationMs: summary.durationMs,
        totalMistakes: summary.totalMistakes,
        errorReductionPctVsFirst: summary.errorReductionPctVsFirst,
      });
      onComplete(summary);
    }
  };

  // Deterministic Simulation Loop outside state updaters (T055)
  useEffect(() => {
    if (isPaused || wrongWayModalText !== null || completedRef.current) return;

    let rafId = 0;
    let lastTs = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const tick = (now: number) => {
      if (completedRef.current) return;

      const rawDeltaMs = Math.min(80, Math.max(0, now - lastTs));
      lastTs = now;
      const deltaSec = rawDeltaMs / 1000;

      const sim = simRef.current;
      const activeIdx = sim.cpIdx;
      const activeCp = scenario.checkpoints[activeIdx] ?? scenario.checkpoints[0];
      const isTurnCp =
        activeCp.type === 'left-turn-small' ||
        activeCp.type === 'right-turn-wide' ||
        activeCp.type === 'arrow-signal-right-turn';

      sim.totalElapsedMs += rawDeltaMs;
      sim.cpElapsedMs += rawDeltaMs;

      if (sim.isBraking) {
        sim.speedKmh = 0;
      } else if (isTurnCp && sim.distanceMeters <= 2.5) {
        sim.speedKmh = 0;
      } else {
        sim.speedKmh = Math.min(28, sim.speedKmh + 26 * deltaSec);
      }

      sim.lateralOffset = clampSemiAssistedOffset(
        sim.lateralOffset,
        0,
        deltaSec,
        scenario.semiAssistBounds,
      ).clampedOffsetMeters;

      let nextDist = sim.distanceMeters - (sim.speedKmh / 3.6) * deltaSec;
      if (isTurnCp && nextDist < 2.2) {
        nextDist = 2.2;
      }
      sim.distanceMeters = nextDist;

      if (activeCp.type === 'tomare-stop-line') {
        const prevStop = sim.stopState;
        const updatedStop = stepStopSignMachine(prevStop, {
          distanceToStopLineMeters: nextDist,
          speedKmh: sim.speedKmh,
          deltaMs: rawDeltaMs,
        });
        sim.stopState = updatedStop;
        setStopState(updatedStop);

        if (prevStop.phase !== 'FullStopValidated' && updatedStop.phase === 'FullStopValidated') {
          sharedAudioSynth.playPassChime();
        }
        if (
          updatedStop.phase === 'ViolationRollingStop' &&
          !sim.loggedRollingStopCpSet.has(activeIdx)
        ) {
          sim.loggedRollingStopCpSet.add(activeIdx);
          sharedAudioSynth.playWarningChime();
          logMistake('tomare-rolling-stop', activeCp.id);
          showBanner(
            'danger',
            '⚠️ 止まれ未完全靜止滿 1 秒！（一時不停止違規，下次請於線前煞停 0 km/h）',
          );
        }

        if (nextDist < -2.2) {
          advanceOrFinishCheckpoint(activeIdx);
          return;
        }
      } else if (activeCp.type === 'keep-left-corridor' && nextDist <= 0) {
        sharedAudioSynth.playPassChime();
        showBanner('pass', '✅ 靠左車道空間感穩定！準備進入路口方向燈演練');
        advanceOrFinishCheckpoint(activeIdx);
        return;
      }

      setTotalElapsedMs(sim.totalElapsedMs);
      setCpElapsedMs(sim.cpElapsedMs);
      setSpeedKmh(sim.speedKmh);
      setLateralOffset(sim.lateralOffset);
      setDistanceMeters(sim.distanceMeters);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused, wrongWayModalText, cpIdx, scenario]);

  const trafficSnap = resolveTrafficSnapshot(cpElapsedMs);
  const visualState: DrillVisualState = {
    distanceToStopLineMeters: Math.max(-2, distanceMeters),
    lateralOffsetMeters: lateralOffset,
    wiperActive,
    signalArmed,
    checkpointType: currentCp.type,
    signalPhase: trafficSnap.signalPhase,
    oncomingCarActive: trafficSnap.oncomingCarConflict,
    pedestrianActive: trafficSnap.pedestrianConflict,
    actorCycleProgress: trafficSnap.actorCycleProgress,
    elapsedSec: totalElapsedMs / 1000,
  };

  useEffect(() => {
    engineRef.current?.renderFrame(visualState);
  });

  const handlePressLeftStalk = () => {
    const res = evaluateLeverInput('left');
    setWiperActive(true);
    sharedAudioSynth.playWiperSqueak();
    logMistake('wiper-mistrigger', currentCp.id);
    showBanner('wiper', res.feedbackText, 2600);
    setTimeout(() => setWiperActive(false), 1200);
  };

  const handleToggleRightStalk = (direction: 'left' | 'right') => {
    const res = toggleRightStalkDirection(signalArmed, direction);
    setSignalArmed(res.signalArmed);
    sharedAudioSynth.playSignalTick();
    showBanner('info', res.feedbackText, 1800);
  };

  const handleSetDriving = (driving: boolean) => {
    const braking = !driving;
    simRef.current.isBraking = braking;
    if (braking) {
      simRef.current.speedKmh = 0;
      setSpeedKmh(0);
    }
    setIsBraking(braking);
  };

  const handleNudgeLateral = (delta: number) => {
    const next = clampSemiAssistedOffset(
      simRef.current.lateralOffset,
      delta,
      0.05,
      scenario.semiAssistBounds,
    ).clampedOffsetMeters;
    simRef.current.lateralOffset = next;
    setLateralOffset(next);
  };

  const handleSelectExitLane = (lane: ExitLaneChoice) => {
    const intendedMove: 'left' | 'right' =
      currentCp.type === 'left-turn-small' ? 'left' : 'right';

    if (scenario.tier === 'warmup') {
      const warmupRes = evaluateWarmupTurnChoice(signalArmed, intendedMove, lane);
      if (!warmupRes.passed && warmupRes.mistakeType) {
        sharedAudioSynth.playWarningChime();
        logMistake(warmupRes.mistakeType, currentCp.id);
        if (warmupRes.mistakeType === 'wrong-way-lane') {
          setWrongWayModalText(warmupRes.feedbackText);
        } else {
          showBanner('danger', warmupRes.feedbackText, 2800);
        }
        return;
      }
      sharedAudioSynth.playPassChime();
      showBanner('pass', warmupRes.feedbackText, 1800);
      advanceOrFinishCheckpoint(cpIdx);
      return;
    }

    const activeSignal: SignalPhaseKeyframe = trafficSnap.signalPhase ?? {
      durationMs: 3000,
      mainLight: 'green',
      activeArrows: [],
    };
    const urbanRes = evaluateUrbanIntersectionTurn({
      intendedMove,
      chosenExitLane: lane,
      signalArmed,
      signalPhase: activeSignal,
      oncomingCarConflict: trafficSnap.oncomingCarConflict,
      pedestrianConflict: trafficSnap.pedestrianConflict,
    });

    if (!urbanRes.passed) {
      sharedAudioSynth.playWarningChime();
      for (const m of urbanRes.mistakes) {
        logMistake(m, currentCp.id);
      }
      if (urbanRes.pauseForWrongWay) {
        setWrongWayModalText(urbanRes.feedbackText);
      } else {
        showBanner('danger', urbanRes.feedbackText, 2800);
      }
      return;
    }

    sharedAudioSynth.playPassChime();
    showBanner('pass', urbanRes.feedbackText, 1800);
    advanceOrFinishCheckpoint(cpIdx);
  };

  const atTurnDecisionZone =
    (currentCp.type === 'left-turn-small' ||
      currentCp.type === 'right-turn-wide' ||
      currentCp.type === 'arrow-signal-right-turn') &&
    distanceMeters <= 12;

  return (
    <div class="drill-lock" ref={rootRef} data-testid="drill-container-view">
      <div class="cockpit-stage" ref={stageRef}>
        {use2DFallback && <Fallback2DView visualState={visualState} />}
      </div>

      <CockpitHud
        checkpointIndex={cpIdx}
        totalCheckpoints={scenario.checkpoints.length}
        instruction={currentCp.instruction}
        checkpointType={currentCp.type}
        distanceMeters={distanceMeters}
        speedKmh={speedKmh}
        isBraking={isBraking}
        signalArmed={signalArmed}
        wiperActive={wiperActive}
        banner={banner}
        stopState={stopState}
        signalPhase={trafficSnap.signalPhase}
        oncomingCarConflict={trafficSnap.oncomingCarConflict}
        pedestrianConflict={trafficSnap.pedestrianConflict}
        atTurnDecisionZone={atTurnDecisionZone}
        onPressLeftStalk={handlePressLeftStalk}
        onToggleRightStalk={handleToggleRightStalk}
        onSetDriving={handleSetDriving}
        onNudgeLateral={handleNudgeLateral}
        onSelectExitLane={handleSelectExitLane}
        onExitDrill={onCancel}
      />

      {/* Automatic Interruption Pause Overlay (FR-010) */}
      {isPaused && !wrongWayModalText && (
        <div class="modal-backdrop" data-testid="drill-pause-overlay">
          <div class="modal-panel" style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px' }}>⏸️ 練習已自動暫停</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              偵測到視窗切換或螢幕旋轉，已為你保留當前路口進度與計時。
            </p>
            <button
              type="button"
              class="touch-target btn-primary"
              data-testid="resume-drill-btn"
              style={{ width: '100%' }}
              onClick={() => setIsPaused(false)}
            >
              繼續練習
            </button>
          </div>
        </div>
      )}

      {/* Wrong-Way Trajectory Comparison Intercept Modal (FR-009d) */}
      {wrongWayModalText && (
        <div class="modal-backdrop" data-testid="wrong-way-modal">
          <div class="modal-panel">
            <span class="badge badge-danger" style={{ marginBottom: '8px' }}>
              逆向行駛危險攔截
            </span>
            <h3 style={{ margin: '4px 0 10px', fontSize: '1.2rem' }}>
              你剛剛切進了「右側對向車道」！
            </h3>
            <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {wrongWayModalText}
            </p>
            <div
              style={{
                background: '#0f172a',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '14px',
                fontSize: '0.88rem',
                lineHeight: 1.6,
              }}
            >
              <div style={{ color: '#f87171' }}>❌ 台灣慣性：右轉切近側右道（在日本會迎頭對撞！）</div>
              <div style={{ color: '#4ade80', fontWeight: 700 }}>
                ✅ 日本正解：左轉貼左小彎、右轉跨過中心進【左側順向車道】
              </div>
            </div>
            <button
              type="button"
              class="touch-target btn-primary"
              data-testid="retry-checkpoint-btn"
              style={{ width: '100%' }}
              onClick={() => {
                simRef.current.distanceMeters = 4.5;
                simRef.current.isBraking = true;
                simRef.current.speedKmh = 0;
                setWrongWayModalText(null);
                setDistanceMeters(4.5);
                setIsBraking(true);
                setSpeedKmh(0);
              }}
            >
              🔄 我記住了，重新通過此路口
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
