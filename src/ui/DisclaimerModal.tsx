interface DisclaimerModalProps {
  onAccept: () => void;
  onCancel?: () => void;
}

export function DisclaimerModal({ onAccept, onCancel }: DisclaimerModalProps) {
  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
      <div class="modal-panel" data-testid="disclaimer-modal">
        <span class="badge badge-warn" style={{ marginBottom: '10px' }}>
          行前安全教育免責聲明
        </span>
        <h2 id="disclaimer-title" style={{ margin: '4px 0 12px', fontSize: '1.25rem' }}>
          開始演練前請先確認
        </h2>
        <ul
          style={{
            margin: '0 0 18px',
            paddingLeft: '20px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            fontSize: '0.95rem',
          }}
        >
          <li>
            <strong>僅供行前安全教育練習</strong>：本工具旨在協助台灣旅客出發前熟悉日本「靠左行駛、右側方向燈與差異號誌」直覺。
          </li>
          <li>
            <strong>不取代正式駕訓與當地法規認證</strong>：實際上路請以日本最新道路交通法、現場號誌標線與租車公司指引為準。
          </li>
          <li>
            <strong>嚴禁於實際駕駛車輛時操作</strong>：請僅於出發前或安全靜止環境下使用，切勿作為行車即時導航工具。
          </li>
        </ul>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            class="touch-target btn-primary"
            data-testid="accept-disclaimer-btn"
            onClick={onAccept}
          >
            我已了解，開始行前演練
          </button>
          {onCancel && (
            <button type="button" class="touch-target" onClick={onCancel}>
              稍後再看
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
