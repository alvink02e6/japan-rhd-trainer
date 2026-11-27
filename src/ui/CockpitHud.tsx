import type { CheckpointType, ExitLaneChoice, SignalPhaseKeyframe } from '../domain/types';
import type { StopSignMachineState } from '../domain/stop-sign-evaluator';

export interface CockpitHudProps {
  checkpointIndex: number;
  totalCheckpoints: number;
  instruction: string;
  checkpointType: CheckpointType;
  distanceMeters: number;
  speedKmh: number;
  isBraking: boolean;
  signalArmed: 'left' | 'right' | null;
  wiperActive: boolean;
  banner: { tone: 'wiper' | 'danger' | 'pass' | 'info'; text: string } | null;
  stopState: StopSignMachineState;
  signalPhase: SignalPhaseKeyframe | null;
  oncomingCarConflict: boolean;
  pedestrianConflict: boolean;
  atTurnDecisionZone: boolean;
  onPressLeftStalk: () => void;
  onToggleRightStalk: (direction: 'left' | 'right') => void;
  onSetDriving: (driving: boolean) => void;
  onNudgeLateral: (deltaMeters: number) => void;
  onSelectExitLane: (lane: ExitLaneChoice) => void;
  onExitDrill: () => void;
}

export function CockpitHud({
  checkpointIndex,
  totalCheckpoints,
  instruction,
  checkpointType,
  distanceMeters,
  speedKmh,
  isBraking,
  signalArmed,
  wiperActive,
  banner,
  stopState,
  signalPhase,
  oncomingCarConflict,
  pedestrianConflict,
  atTurnDecisionZone,
  onPressLeftStalk,
  onToggleRightStalk,
  onSetDriving,
  onNudgeLateral,
  onSelectExitLane,
  onExitDrill,
}: CockpitHudProps) {
  const isTurnCheckpoint =
    checkpointType === 'left-turn-small' ||
    checkpointType === 'right-turn-wide' ||
    checkpointType === 'arrow-signal-right-turn';
  const expectedTurnDir = checkpointType === 'left-turn-small' ? 'left' : 'right';

  return (
    <>
      {/* Top Instruction & Silent-Mode Visual Parity Alert Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          right: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 15,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'auto',
          }}
        >
          <span class="badge badge-info" data-testid="drill-checkpoint-badge">
            關卡節點 {checkpointIndex + 1} / {totalCheckpoints}｜距路口 {Math.max(0, Math.round(distanceMeters))}m｜
            {Math.round(speedKmh)} km/h
          </span>
          <button
            type="button"
            class="touch-target"
            style={{ minHeight: '38px', padding: '4px 10px', fontSize: '0.8rem' }}
            onClick={onExitDrill}
          >
            離開
          </button>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            borderRadius: '10px',
            padding: '8px 11px',
            fontSize: '0.86rem',
            lineHeight: 1.4,
            color: '#f1f5f9',
          }}
          data-testid="drill-instruction"
        >
          {instruction}
        </div>

        {/* Live Signal / Actor Status Strip for Silent & Small-Screen Clarity */}
        {(signalPhase || oncomingCarConflict || pedestrianConflict) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {signalPhase && signalPhase.mainLight !== 'off' && (
              <span class="badge badge-warn" data-testid="hud-signal-status">
                號誌：
                {signalPhase.mainLight === 'green'
                  ? '🟢 圓形綠燈'
                  : signalPhase.mainLight === 'yellow'
                    ? '🟡 黃燈'
                    : '🔴 圓形紅燈'}
                {signalPhase.activeArrows.length > 0
                  ? ` ＋ 下排綠箭頭 [${signalPhase.activeArrows
                      .map((a) => (a === 'left' ? '←左' : a === 'straight' ? '↑直' : '→右'))
                      .join(' ')}]`
                  : '（無箭頭）'}
              </span>
            )}
            {oncomingCarConflict && (
              <span class="badge badge-danger" data-testid="hud-oncoming-badge">
                🚗 對向直行車通過中（請停等禮讓）
              </span>
            )}
            {pedestrianConflict && (
              <span class="badge badge-danger" data-testid="hud-pedestrian-badge">
                🚶 斑馬線有行人通行中（請停等禮讓）
              </span>
            )}
          </div>
        )}

        {/* 止まれ 1.0s Full-Stop Progress Indicator */}
        {checkpointType === 'tomare-stop-line' && distanceMeters <= 15 && (
          <div
            class={`alert-banner ${stopState.phase === 'FullStopValidated' ? 'alert-pass' : 'alert-info'}`}
            data-testid="tomare-timer-banner"
          >
            {stopState.phase === 'FullStopValidated'
              ? '✅ 已完成「止まれ」完全靜止 1.0 秒！請按「巡航前進」安全通過'
              : `🛑 止まれ停止線前（0–4m）：已完全靜止 ${(stopState.stoppedDurationMs / 1000).toFixed(1)} / 1.0 秒`}
          </div>
        )}

        {/* Synchronized High-Contrast Silent-Mode Feedback Banner (FR-011) */}
        {banner && (
          <div
            class={`alert-banner alert-${banner.tone}`}
            data-testid={`hud-banner-${banner.tone}`}
            role="status"
          >
            {banner.text}
          </div>
        )}
      </div>

      {/* Windshield Wiper Sweep Overlay (guarantees visible wiper trap even in 2D / mute mode!) */}
      {wiperActive && (
        <div
          data-testid="wiper-visual-overlay"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12 }}
        >
          <div class="wiper-blade-overlay" style={{ left: '34%' }} />
          <div class="wiper-blade-overlay" style={{ left: '66%' }} />
        </div>
      )}

      {/* Bottom Right-Hand-Drive Cockpit Controls */}
      <div class="cockpit-controls">
        {/* Turn Target-Lane Decision Bar when at intersection */}
        {isTurnCheckpoint && atTurnDecisionZone && (
          <div
            data-testid="turn-decision-panel"
            style={{
              background: 'rgba(30, 41, 59, 0.96)',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              borderRadius: '12px',
              padding: '8px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            <button
              type="button"
              class="touch-target btn-primary"
              data-testid="turn-left-inbound-btn"
              style={{ fontSize: '0.86rem', padding: '10px 8px' }}
              onClick={() => onSelectExitLane('left-inbound')}
            >
              {expectedTurnDir === 'left'
                ? '↰ 左轉小彎 ➔ 駛入【左側車道】'
                : '↱ 右轉大彎 ➔ 駛入【左側車道】'}
            </button>
            <button
              type="button"
              class="touch-target"
              data-testid="turn-right-oncoming-btn"
              style={{ fontSize: '0.86rem', padding: '10px 8px' }}
              onClick={() => onSelectExitLane('right-oncoming')}
            >
              {expectedTurnDir === 'left'
                ? '↰ 左轉切入【右側車道】'
                : '↱ 右轉切入【右側車道】'}
            </button>
          </div>
        )}

        {/* Semi-assisted corridor gentle lane-position nudge row (for keep-left feel) */}
        {checkpointType === 'keep-left-corridor' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              class="touch-target"
              style={{ minHeight: '42px', fontSize: '0.84rem', padding: '6px 10px' }}
              onClick={() => onNudgeLateral(-0.35)}
            >
              ◀ 微調靠左緣（對齊黃色車頭標）
            </button>
            <button
              type="button"
              class="touch-target"
              style={{ minHeight: '42px', fontSize: '0.84rem', padding: '6px 10px' }}
              onClick={() => onNudgeLateral(0.35)}
            >
              微調偏右 ▶
            </button>
          </div>
        )}

        {/* Core RHD Stalk & Pedal Row: Left Stalk (Wiper Trap!) | Drive/Brake | Right Stalk (Turn Signal!) */}
        <div class="stalk-row">
          <button
            type="button"
            class="touch-target"
            data-testid="left-wiper-stalk"
            style={{ flexDirection: 'column', gap: '2px', padding: '8px 6px', fontSize: '0.84rem' }}
            onClick={onPressLeftStalk}
          >
            <span>🕹️ 左側撥桿</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>方向盤左邊</span>
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              type="button"
              class={`touch-target ${!isBraking ? 'btn-primary' : ''}`}
              data-testid="drive-pedal-btn"
              style={{ padding: '8px 6px', fontSize: '0.85rem' }}
              onClick={() => onSetDriving(true)}
            >
              🚗 巡航前進
            </button>
            <button
              type="button"
              class={`touch-target ${isBraking ? 'btn-danger' : ''}`}
              data-testid="brake-pedal-btn"
              style={{ padding: '8px 6px', fontSize: '0.85rem' }}
              onClick={() => onSetDriving(false)}
            >
              🛑 煞車靜止
            </button>
          </div>

          <div
            data-testid="right-signal-stalk"
            style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
          >
            <button
              type="button"
              class={`touch-target ${signalArmed === 'left' ? 'btn-line' : ''}`}
              data-testid="right-stalk-left-btn"
              style={{ minHeight: '48px', padding: '6px 6px', fontSize: '0.78rem' }}
              onClick={() => onToggleRightStalk('left')}
            >
              {signalArmed === 'left' ? '🟢 左燈閃爍（點此關）' : '🕹️ 右桿：打左轉燈'}
            </button>
            <button
              type="button"
              class={`touch-target ${signalArmed === 'right' ? 'btn-line' : ''}`}
              data-testid="right-stalk-right-btn"
              style={{ minHeight: '48px', padding: '6px 6px', fontSize: '0.78rem' }}
              onClick={() => onToggleRightStalk('right')}
            >
              {signalArmed === 'right' ? '🟢 右燈閃爍（點此關）' : '🕹️ 右桿：打右轉燈'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
