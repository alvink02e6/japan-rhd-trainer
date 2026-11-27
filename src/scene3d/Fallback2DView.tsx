import type { DrillVisualState } from './DrillEngine';

interface Fallback2DViewProps {
  visualState: DrillVisualState;
}

export function Fallback2DView({ visualState }: Fallback2DViewProps) {
  const {
    distanceToStopLineMeters,
    lateralOffsetMeters,
    signalArmed,
    checkpointType,
    signalPhase,
    oncomingCarActive,
    pedestrianActive,
  } = visualState;

  const carX = 112 + lateralOffsetMeters * 22;
  const clampedDist = Math.max(0, Math.min(45, distanceToStopLineMeters));
  const stopLineY = 78 + (1 - clampedDist / 45) * 125;

  return (
    <div
      data-testid="fallback-2d-view"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b1220',
        padding: '8px',
      }}
    >
      <span class="badge badge-info" style={{ marginBottom: '6px', fontSize: '0.72rem' }}>
        高對比簡化座艙視圖（全機型流暢相容模式）
      </span>
      <svg
        viewBox="0 0 320 260"
        width="100%"
        height="100%"
        style={{ maxHeight: '290px' }}
        role="img"
        aria-label="日本右駕道路簡化演練視圖"
      >
        <rect width="320" height="260" rx="12" fill="#0f172a" />

        {/* Cross-street */}
        <rect x="16" y="42" width="288" height="58" fill="#334155" />
        {/* North-South two-lane road (Left =順向 x:72..160, Right =對向 x:160..248) */}
        <rect x="72" y="0" width="176" height="260" fill="#334155" />
        <line x1="160" y1="0" x2="160" y2="42" stroke="#f59e0b" stroke-width="3" />
        <line x1="160" y1="100" x2="160" y2="260" stroke="#f59e0b" stroke-width="3" />

        {/* Left-lane target highlight */}
        <text x="115" y="28" text-anchor="middle" fill="#38bdf8" font-size="11" font-weight="bold">
          左側順向道
        </text>
        <text x="205" y="28" text-anchor="middle" fill="#f87171" font-size="11" font-weight="bold">
          右側對向道
        </text>

        {/* Stop line on LEFT lane */}
        <line
          x1="74"
          y1={stopLineY}
          x2="158"
          y2={stopLineY}
          stroke="#ffffff"
          stroke-width="5"
        />

        {/* 止まれ sign when active */}
        {checkpointType === 'tomare-stop-line' && (
          <g transform={`translate(22, ${Math.max(48, stopLineY - 22)})`}>
            <polygon points="0,0 42,0 21,36" fill="#dc2626" stroke="#ffffff" stroke-width="2" />
            <text x="21" y="14" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="bold">
              止まれ
            </text>
          </g>
        )}

        {/* Two-row Japanese signal indicator when active */}
        {signalPhase && signalPhase.mainLight !== 'off' && (
          <g transform="translate(20, 8)">
            <rect width="84" height="36" rx="6" fill="#1e293b" stroke="#64748b" />
            <circle
              cx="18"
              cy="12"
              r="7"
              fill={signalPhase.mainLight === 'green' ? '#10b981' : '#334155'}
            />
            <circle
              cx="42"
              cy="12"
              r="7"
              fill={signalPhase.mainLight === 'yellow' ? '#f59e0b' : '#334155'}
            />
            <circle
              cx="66"
              cy="12"
              r="7"
              fill={signalPhase.mainLight === 'red' ? '#ef4444' : '#334155'}
            />
            <text
              x="22"
              y="31"
              text-anchor="middle"
              font-size="12"
              font-weight="bold"
              fill={signalPhase.activeArrows.includes('left') ? '#22c55e' : '#475569'}
            >
              ←
            </text>
            <text
              x="42"
              y="31"
              text-anchor="middle"
              font-size="12"
              font-weight="bold"
              fill={signalPhase.activeArrows.includes('straight') ? '#22c55e' : '#475569'}
            >
              ↑
            </text>
            <text
              x="62"
              y="31"
              text-anchor="middle"
              font-size="12"
              font-weight="bold"
              fill={signalPhase.activeArrows.includes('right') ? '#22c55e' : '#475569'}
            >
              →
            </text>
          </g>
        )}

        {/* Oncoming car in right lane */}
        {oncomingCarActive && (
          <g transform="translate(188, 48)">
            <rect width="32" height="48" rx="6" fill="#f97316" stroke="#ffedd5" stroke-width="2" />
            <text x="16" y="28" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="bold">
              對向車
            </text>
          </g>
        )}

        {/* Crosswalk pedestrian */}
        {pedestrianActive && (
          <g transform="translate(82, 86)">
            <rect width="70" height="22" rx="6" fill="#1d4ed8" stroke="#93c5fd" />
            <text x="35" y="15" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold">
              🚶 行人通過中
            </text>
          </g>
        )}

        {/* Player RHD Car with explicit RIGHT-seat steering icon & LEFT-hood yellow corner marker */}
        <g transform={`translate(${carX - 22}, 196)`}>
          <rect width="44" height="56" rx="8" fill="#0284c7" stroke="#e0f2fe" stroke-width="2" />
          {/* Left-hood yellow reference dot */}
          <circle cx="5" cy="6" r="4" fill="#facc15" />
          {/* Right-seat driver steering wheel */}
          <circle cx="31" cy="24" r="7" fill="none" stroke="#f8fafc" stroke-width="2.5" />
          {signalArmed === 'left' && <circle cx="4" cy="14" r="5" fill="#22c55e" />}
          {signalArmed === 'right' && <circle cx="40" cy="14" r="5" fill="#22c55e" />}
          <text x="22" y="47" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="bold">
            右駕自車
          </text>
        </g>
      </svg>
    </div>
  );
}
