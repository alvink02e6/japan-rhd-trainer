import type { ComponentChildren } from 'preact';
import type {
  ConfidenceRating,
  DrillAttemptSummary,
  DrillId,
  MistakeType,
} from '../domain/types';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { DISCLOSED_TRAVEL_RESOURCES } from '../content/preview-packs';

interface DrillSummaryViewProps {
  scenarioTitle: string;
  summary: DrillAttemptSummary;
  firstAttemptSummary: DrillAttemptSummary | null;
  confidencePulse: ConfidenceRating | null;
  telemetry: TelemetryClient;
  onSubmitConfidence: (rating: ConfidenceRating) => void;
  onReplayDrill: () => void;
  onNextDrill: (nextDrillId: DrillId) => void;
  onOpenHub: () => void;
  previewPacksSlot: ComponentChildren;
}

const MISTAKE_LABELS: Record<MistakeType, string> = {
  'wiper-mistrigger': '左側誤觸雨刷',
  'tomare-rolling-stop': '止まれ未完全靜止滿 1 秒',
  'wrong-way-lane': '轉彎誤入右側逆向車道',
  'signal-violation': '箭頭／紅綠燈或方向燈違規',
  'yield-violation': '未禮讓對向直行車或斑馬線行人',
};

const CONFIDENCE_OPTIONS: { value: ConfidenceRating; label: string }[] = [
  { value: 'much-more-confident', label: '🌟 非常有把握！清楚記住靠左與右手方向燈了' },
  { value: 'slightly-more-confident', label: '👍 比練習前更有把握，知道該注意哪些路口陷阱' },
  { value: 'unchanged', label: '😐 差不多，還想多練習幾次' },
  { value: 'less-confident', label: '😅 發現自己很容易逆向或刷雨刷，上路會更小心' },
];

export function DrillSummaryView({
  scenarioTitle,
  summary,
  firstAttemptSummary,
  confidencePulse,
  telemetry,
  onSubmitConfidence,
  onReplayDrill,
  onNextDrill,
  onOpenHub,
  previewPacksSlot,
}: DrillSummaryViewProps) {
  const isRepeat = summary.attemptNumber >= 2 && firstAttemptSummary !== null;

  return (
    <div class="app-shell" data-testid="drill-summary-view">
      <div class="card">
        <span class="badge badge-success" style={{ marginBottom: '8px' }}>
          實戰演練完成（第 {summary.attemptNumber} 次挑戰）
        </span>
        <h2 style={{ margin: '4px 0 8px', fontSize: '1.25rem' }}>{scenarioTitle}</h2>
        <div
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: summary.totalMistakes === 0 ? '#4ade80' : '#fbbf24',
            marginBottom: '12px',
          }}
          data-testid="summary-total-mistakes"
        >
          本次總失誤：{summary.totalMistakes} 次（耗時 {Math.max(1, Math.round(summary.durationMs / 1000))} 秒）
        </div>

        {/* First-Attempt vs Repeat-Attempt Error Reduction Comparison (FR-014, SC-003, Edge Case #6) */}
        {isRepeat && firstAttemptSummary && (
          <div
            class="alert-banner alert-pass"
            data-testid="repeat-improvement-banner"
            style={{ marginBottom: '12px' }}
          >
            {summary.errorReductionState === 'perfect-maintained'
              ? '🏆 維持零失誤完美表現！（首次 0 失誤 ➔ 本次 0 失誤）'
              : `📈 首次挑戰 ${firstAttemptSummary.totalMistakes} 次失誤 ➔ 本次 ${summary.totalMistakes} 次（錯誤變化：${
                  (summary.errorReductionPctVsFirst ?? 0) >= 0
                    ? `減少 ${summary.errorReductionPctVsFirst}%`
                    : `增加 ${Math.abs(summary.errorReductionPctVsFirst ?? 0)}%`
                }）`}
          </div>
        )}

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '14px',
          }}
        >
          {(Object.keys(MISTAKE_LABELS) as MistakeType[]).map((mType) => {
            const count = summary.mistakesByType[mType] ?? 0;
            return (
              <div
                key={mType}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.9rem',
                  color: count > 0 ? '#fca5a5' : 'var(--text-secondary)',
                }}
              >
                <span>{MISTAKE_LABELS[mType]}</span>
                <strong data-testid={`mistake-count-${mType}`}>{count} 次</strong>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {summary.scenarioId === 'warmup-range' && (
            <button
              type="button"
              class="touch-target btn-primary"
              data-testid="go-urban-drill-1-btn"
              onClick={() => onNextDrill('urban-drill-1')}
            >
              🚦 進入下一關：市區實戰第 1 關（止まれ＆箭頭右轉）
            </button>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              class="touch-target"
              data-testid="replay-drill-btn"
              onClick={onReplayDrill}
            >
              🔄 再練一次拼零失誤
            </button>
            <button
              type="button"
              class="touch-target"
              data-testid="summary-open-hub-btn"
              onClick={onOpenHub}
            >
              📋 關卡選單
            </button>
          </div>
        </div>
      </div>

      {/* 1-Question Post-Session Confidence Pulse (FR-014, SC-004) */}
      <div class="card" data-testid="confidence-pulse-card">
        <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem' }}>
          1 秒行前回饋：經過剛剛的演練，你對日本右駕與號誌更有把握嗎？
        </h3>
        <div class="option-list">
          {CONFIDENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              class={`touch-target option-btn ${confidencePulse === opt.value ? 'option-correct' : ''}`}
              data-testid={`confidence-opt-${opt.value}`}
              onClick={() => {
                onSubmitConfidence(opt.value);
                telemetry.track('confidence_pulse_submitted', { rating: opt.value });
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {confidencePulse && (
          <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#86efac' }} data-testid="confidence-saved-msg">
            ✅ 感謝回饋！已記錄你的行前準備度自評。
          </div>
        )}
      </div>

      {/* Fake Door Preview Packs + Buddy Share Unlock (FR-012 / Remediation U1) */}
      {previewPacksSlot}

      {/* Non-Intrusive Disclosed External Travel Resources (FR-013) */}
      <div class="card" data-testid="disclosed-resources-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>赴日自駕行前實用準備清單</h3>
          <span class="badge badge-info" data-testid="resource-disclosure-badge">
            合作推薦／外部資源
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {DISCLOSED_TRAVEL_RESOURCES.map((res) => (
            <a
              key={res.id}
              href={res.href}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`external-resource-${res.category}`}
              style={{
                display: 'block',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.55)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
              }}
              onClick={() => {
                telemetry.track('affiliate_resource_clicked', {
                  resourceCategory: res.category,
                });
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#7dd3fc', marginBottom: '3px' }}>
                {res.title} ↗
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {res.description}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
