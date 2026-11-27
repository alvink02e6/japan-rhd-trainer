import { useMemo, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { ReadinessDiagnosticCard } from '../domain/types';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { renderDiagnosticCardDataUrl } from '../platform/diagnostic-canvas';
import {
  triggerLineGroupShare,
  triggerSystemOrClipboardShare,
} from '../platform/share-client';

interface DiagnosticCardViewProps {
  card: ReadinessDiagnosticCard;
  telemetry: TelemetryClient;
  onStartWarmupDrill: () => void;
  onOpenHub: () => void;
  onRetakeQuiz: () => void;
  previewPacksSlot?: ComponentChildren;
}

export function DiagnosticCardView({
  card,
  telemetry,
  onStartWarmupDrill,
  onOpenHub,
  onRetakeQuiz,
  previewPacksSlot,
}: DiagnosticCardViewProps) {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const imageDataUrl = useMemo(() => renderDiagnosticCardDataUrl(card), [card]);

  const handleLineShare = () => {
    const res = triggerLineGroupShare(card.shareText, 'diagnostic-card', telemetry);
    setShareFeedback(res.message);
  };

  const handleSystemShare = async () => {
    const res = await triggerSystemOrClipboardShare(
      '日本右駕行前存活診斷卡',
      card.shareText,
      'diagnostic-card',
      telemetry,
    );
    setShareFeedback(res.message);
  };

  return (
    <div class="app-shell" data-testid="diagnostic-card-view">
      <div class="card" style={{ textAlign: 'center' }}>
        <span class="badge badge-info" style={{ marginBottom: '8px' }}>
          行前號誌診斷完成
        </span>
        <h2 style={{ margin: '4px 0 8px', fontSize: '1.3rem' }}>
          存活評級 <span data-testid="diagnostic-grade">{card.grade}</span>｜{card.headline}
        </h2>
        <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          可長按下方診斷卡圖片儲存至手機相簿，或直接傳到旅遊群組考考你的同行駕駛／副駕！
        </p>

        <img
          src={imageDataUrl}
          alt={`赴日右駕存活診斷卡 ${card.grade} 級`}
          data-testid="diagnostic-card-image"
          onContextMenu={() => {
            telemetry.track('diagnostic_shared', {
              channel: 'image-save',
              context: 'diagnostic-card',
            });
          }}
          style={{
            width: '100%',
            maxWidth: '380px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.16)',
            display: 'block',
            margin: '0 auto 14px',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            class="touch-target btn-line"
            data-testid="share-line-btn"
            onClick={handleLineShare}
          >
            💬 一鍵傳送到 LINE 群組挑戰旅伴
          </button>
          <button
            type="button"
            class="touch-target"
            data-testid="share-copy-btn"
            onClick={handleSystemShare}
          >
            🔗 系統分享／複製挑戰文案與連結
          </button>
        </div>

        {shareFeedback && (
          <div
            class="alert-banner alert-info"
            data-testid="share-feedback-banner"
            style={{ marginTop: '12px' }}
          >
            {shareFeedback}
          </div>
        )}
      </div>

      <div class="card">
        <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>
          下一步：進入第一人稱右駕座艙演練（約 2 分鐘）
        </h3>
        <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          看懂號誌只是第一步！實際坐進右側駕駛座，體驗「右手打方向燈、左手誤觸雨刷」與日本多車道右轉大彎。
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            class="touch-target btn-primary"
            data-testid="go-warmup-drill-btn"
            onClick={onStartWarmupDrill}
          >
            🚗 立即進入「3D 駕訓熱身場」
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button type="button" class="touch-target" onClick={onOpenHub}>
              📋 實戰關卡選單
            </button>
            <button type="button" class="touch-target" onClick={onRetakeQuiz}>
              🔄 重測號誌問答
            </button>
          </div>
        </div>
      </div>

      {previewPacksSlot}
    </div>
  );
}
