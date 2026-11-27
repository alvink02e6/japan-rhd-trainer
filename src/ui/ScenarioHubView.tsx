import { useState } from 'preact/hooks';
import type { DrillId, PackId, ThemePackUnlockState } from '../domain/types';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { DRILL_SCENARIO_LIST } from '../content/drill-scenarios';
import { FAKE_DOOR_PREVIEW_PACKS, type FakeDoorPackMeta } from '../content/preview-packs';
import {
  triggerLineGroupShare,
  triggerSystemOrClipboardShare,
} from '../platform/share-client';

interface PreviewPacksPanelProps {
  unlockStates: Record<PackId, ThemePackUnlockState>;
  shareInviteText: string;
  telemetry: TelemetryClient;
  onBuddyShareCompleted: () => void;
  onFakeDoorClicked: (packId: 'hokkaido-snow-pack' | 'highway-etc-pack') => void;
  onStartBonusDrill?: () => void;
}

export function PreviewPacksPanel({
  unlockStates,
  shareInviteText,
  telemetry,
  onBuddyShareCompleted,
  onFakeDoorClicked,
  onStartBonusDrill,
}: PreviewPacksPanelProps) {
  const [activeFakeDoor, setActiveFakeDoor] = useState<FakeDoorPackMeta | null>(null);
  const [shareStatusMsg, setShareStatusMsg] = useState<string | null>(null);

  const bonusUnlocked = unlockStates['urban-drill-2'].unlocked;

  const handleBuddyLineUnlock = () => {
    const res = triggerLineGroupShare(shareInviteText, 'buddy-unlock', telemetry);
    if (res.completed) {
      onBuddyShareCompleted();
    }
    setShareStatusMsg(res.message);
  };

  const handleBuddySystemUnlock = async () => {
    const res = await triggerSystemOrClipboardShare(
      '邀請同行旅伴一起練日本右駕',
      shareInviteText,
      'buddy-unlock',
      telemetry,
    );
    if (res.completed) {
      onBuddyShareCompleted();
    }
    setShareStatusMsg(res.message);
  };

  const handleFakeDoorClick = (pack: FakeDoorPackMeta) => {
    onFakeDoorClicked(pack.packId);
    telemetry.track('fake_door_clicked', { packId: pack.packId });
    setActiveFakeDoor(pack);
  };

  return (
    <div class="card" data-testid="preview-packs-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span class="badge badge-warn">旅伴裂變解鎖＆進階主題預告</span>
      </div>

      {/* Share-to-Unlock Bonus Urban Drill 2 Card */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.72)',
          border: `1px solid ${bonusUnlocked ? '#22c55e' : 'rgba(56, 189, 248, 0.4)'}`,
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '12px',
        }}
        data-testid="bonus-drill-unlock-card"
      >
        <div style={{ fontWeight: 700, marginBottom: '4px' }}>
          {bonusUnlocked ? '🔓 已解鎖：' : '🔒 免費解鎖：'}市區實戰第 2 關（超商出口止まれ＆無保護綠燈待轉）
        </div>
        <p style={{ margin: '0 0 10px', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          自駕最怕副駕報錯路或換手緊張！將演練連結分享給同行旅伴，立即免費解鎖進階複合車流關卡。
        </p>

        {bonusUnlocked ? (
          onStartBonusDrill && (
            <button
              type="button"
              class="touch-target btn-primary"
              data-testid="play-unlocked-urban2-btn"
              style={{ width: '100%' }}
              onClick={onStartBonusDrill}
            >
              🚗 立即挑戰「市區實戰第 2 關」
            </button>
          )
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              class="touch-target btn-line"
              data-testid="unlock-via-line-btn"
              style={{ fontSize: '0.85rem', padding: '10px 8px' }}
              onClick={handleBuddyLineUnlock}
            >
              💬 LINE 傳給旅伴解鎖
            </button>
            <button
              type="button"
              class="touch-target"
              data-testid="unlock-via-share-btn"
              style={{ fontSize: '0.85rem', padding: '10px 8px' }}
              onClick={handleBuddySystemUnlock}
            >
              🔗 分享／複製連結解鎖
            </button>
          </div>
        )}

        {shareStatusMsg && (
          <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#7dd3fc' }} data-testid="unlock-share-msg">
            {shareStatusMsg}
          </div>
        )}
      </div>

      {/* Fake Door Upcoming Theme Packs (Zero Charge!) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {FAKE_DOOR_PREVIEW_PACKS.map((pack) => (
          <div
            key={pack.packId}
            style={{
              background: 'rgba(15, 23, 42, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '12px',
            }}
            data-testid={`fake-door-card-${pack.packId}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <span class="badge badge-info">{pack.badgeLabel}</span>
              <span style={{ fontSize: '0.8rem', color: '#fcd34d', fontWeight: 700 }}>
                {pack.displayedPriceLabel}
              </span>
            </div>
            <h4 style={{ margin: '8px 0 4px', fontSize: '1rem' }}>{pack.title}</h4>
            <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {pack.description}
            </p>
            <button
              type="button"
              class="touch-target"
              data-testid={`fake-door-btn-${pack.packId}`}
              style={{ width: '100%', fontSize: '0.88rem' }}
              onClick={() => handleFakeDoorClick(pack)}
            >
              🙋 我下一趟會去，想解鎖此實戰主題
            </button>
          </div>
        ))}
      </div>

      {activeFakeDoor && (
        <div class="modal-backdrop" data-testid="fake-door-modal">
          <div class="modal-panel">
            <span class="badge badge-warn" style={{ marginBottom: '8px' }}>
              籌備需求統計中（免付費）
            </span>
            <h3 style={{ margin: '4px 0 10px', fontSize: '1.18rem' }}>{activeFakeDoor.title}</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {activeFakeDoor.zeroChargeNotice}
            </p>
            <button
              type="button"
              class="touch-target btn-primary"
              data-testid="close-fake-door-modal-btn"
              style={{ width: '100%' }}
              onClick={() => setActiveFakeDoor(null)}
            >
              知道了，謝謝！
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ScenarioHubViewProps {
  unlockStates: Record<PackId, ThemePackUnlockState>;
  shareInviteText: string;
  telemetry: TelemetryClient;
  onStartQuiz: () => void;
  onStartDrill: (drillId: DrillId) => void;
  onBuddyShareCompleted: () => void;
  onFakeDoorClicked: (packId: 'hokkaido-snow-pack' | 'highway-etc-pack') => void;
  onBackHome: () => void;
}

export function ScenarioHubView({
  unlockStates,
  shareInviteText,
  telemetry,
  onStartQuiz,
  onStartDrill,
  onBuddyShareCompleted,
  onFakeDoorClicked,
  onBackHome,
}: ScenarioHubViewProps) {
  const bonusUnlocked = unlockStates['urban-drill-2'].unlocked;

  return (
    <div class="app-shell" data-testid="scenario-hub-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>日本右駕實戰關卡中心</h2>
        <button
          type="button"
          class="touch-target"
          style={{ minHeight: '40px', padding: '6px 12px', fontSize: '0.85rem' }}
          onClick={onBackHome}
        >
          回首頁
        </button>
      </div>

      <div class="card">
        <span class="badge badge-success" style={{ marginBottom: '8px' }}>
          免費開放演練
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              borderRadius: '12px',
              padding: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>
              🚦 台日差異動態號誌問答（10 題＋存活診斷卡）
            </div>
            <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              橫排綠左紅右、上下兩排矢印式信号機、純紅燈禁轉與止まれ規則快篩。
            </p>
            <button
              type="button"
              class="touch-target"
              style={{ width: '100%' }}
              onClick={onStartQuiz}
            >
              進入號誌動態測驗
            </button>
          </div>

          {DRILL_SCENARIO_LIST.filter((d) => d.tier !== 'urban-bonus').map((drill) => (
            <div
              key={drill.id}
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid rgba(56, 189, 248, 0.28)',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>🚗 {drill.title}</div>
              <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {drill.subtitle}（約 {drill.targetDurationSec} 秒）
              </p>
              <button
                type="button"
                class="touch-target btn-primary"
                data-testid={`hub-start-${drill.id}`}
                style={{ width: '100%' }}
                onClick={() => onStartDrill(drill.id)}
              >
                開始演練
              </button>
            </div>
          ))}
        </div>
      </div>

      <PreviewPacksPanel
        unlockStates={unlockStates}
        shareInviteText={shareInviteText}
        telemetry={telemetry}
        onBuddyShareCompleted={onBuddyShareCompleted}
        onFakeDoorClicked={onFakeDoorClicked}
        onStartBonusDrill={bonusUnlocked ? () => onStartDrill('urban-drill-2') : undefined}
      />
    </div>
  );
}
