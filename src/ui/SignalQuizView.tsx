import { useEffect, useState } from 'preact/hooks';
import type {
  QuizAnswerRecord,
  QuizSessionResult,
  SignalPhaseKeyframe,
  SignalScenarioQuestion,
} from '../domain/types';
import { evaluateQuizAnswer } from '../domain/signal-evaluator';
import { scoreQuizSession } from '../domain/diagnostic-scorer';
import { sharedAudioSynth } from '../platform/audio-synth';

interface SignalQuizViewProps {
  questions: readonly SignalScenarioQuestion[];
  onComplete: (result: QuizSessionResult) => void;
  onBackHome: () => void;
}

function JapaneseSignalSvg({
  phase,
  auxiliarySign,
  oncomingCar,
  pedestrianCrossing,
}: {
  phase: SignalPhaseKeyframe;
  auxiliarySign: SignalScenarioQuestion['auxiliarySign'];
  oncomingCar: boolean;
  pedestrianCrossing: boolean;
}) {
  const isGreen = phase.mainLight === 'green';
  const isYellow = phase.mainLight === 'yellow';
  const isRed = phase.mainLight === 'red';
  const hasArrow = (dir: 'left' | 'straight' | 'right') => phase.activeArrows.includes(dir);

  return (
    <div
      style={{
        background: '#0b1220',
        borderRadius: '14px',
        padding: '12px',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <svg
        viewBox="0 0 360 190"
        width="100%"
        height="175"
        role="img"
        aria-label="日本交通號誌動態示意圖"
      >
        {/* Sky & road backdrop */}
        <rect x="0" y="0" width="360" height="190" rx="10" fill="#0f172a" />

        {phase.mainLight !== 'off' ? (
          <g transform="translate(75, 14)">
            {/* Top row label: 日本橫排 左綠・中黃・右紅 */}
            <rect
              x="0"
              y="0"
              width="210"
              height="68"
              rx="34"
              fill="#1e293b"
              stroke="#64748b"
              stroke-width="3"
            />
            {/* Left: Green (青) */}
            <circle
              cx="42"
              cy="34"
              r="21"
              fill={isGreen ? '#10b981' : '#1e293b'}
              stroke="#0f172a"
              stroke-width="2"
            />
            {isGreen && <circle cx="42" cy="34" r="25" fill="none" stroke="#34d399" stroke-width="2" />}
            {/* Middle: Yellow */}
            <circle
              cx="105"
              cy="34"
              r="21"
              fill={isYellow ? '#f59e0b' : '#1e293b'}
              stroke="#0f172a"
              stroke-width="2"
            />
            {/* Right: Red */}
            <circle
              cx="168"
              cy="34"
              r="21"
              fill={isRed ? '#ef4444' : '#1e293b'}
              stroke="#0f172a"
              stroke-width="2"
            />
            {isRed && <circle cx="168" cy="34" r="25" fill="none" stroke="#f87171" stroke-width="2" />}

            {/* Lower row: 矢印式信号機 (Arrow Signal Row) */}
            <rect
              x="18"
              y="76"
              width="174"
              height="52"
              rx="14"
              fill="#111827"
              stroke="#475569"
              stroke-width="2"
            />
            {/* Left Arrow */}
            <text
              x="46"
              y="111"
              text-anchor="middle"
              font-size="28"
              font-weight="bold"
              fill={hasArrow('left') ? '#22c55e' : '#334155'}
            >
              ←
            </text>
            {/* Straight Arrow */}
            <text
              x="105"
              y="111"
              text-anchor="middle"
              font-size="28"
              font-weight="bold"
              fill={hasArrow('straight') ? '#22c55e' : '#334155'}
            >
              ↑
            </text>
            {/* Right Arrow */}
            <text
              x="164"
              y="111"
              text-anchor="middle"
              font-size="28"
              font-weight="bold"
              fill={hasArrow('right') ? '#22c55e' : '#334155'}
            >
              →
            </text>
          </g>
        ) : (
          <text
            x="180"
            y="62"
            text-anchor="middle"
            fill="#94a3b8"
            font-size="16"
            font-weight="bold"
          >
            （無紅綠燈號誌路口）
          </text>
        )}

        {/* Red inverted triangle 止まれ sign when present */}
        {auxiliarySign === 'tomare' && (
          <g transform="translate(14, 22)">
            <polygon
              points="4,4 68,4 36,60"
              fill="#dc2626"
              stroke="#ffffff"
              stroke-width="3"
            />
            <text
              x="36"
              y="24"
              text-anchor="middle"
              fill="#ffffff"
              font-size="12"
              font-weight="bold"
            >
              止まれ
            </text>
            <text x="36" y="38" text-anchor="middle" fill="#ffffff" font-size="9">
              STOP
            </text>
          </g>
        )}

        {/* Context actor badges inside scene */}
        {oncomingCar && (
          <g transform="translate(16, 152)">
            <rect width="154" height="26" rx="6" fill="#7c2d12" stroke="#fb923c" />
            <text x="77" y="18" text-anchor="middle" fill="#ffedd5" font-size="12" font-weight="bold">
              ⚠️ 對向直行車接近中
            </text>
          </g>
        )}
        {pedestrianCrossing && (
          <g transform="translate(186, 152)">
            <rect width="158" height="26" rx="6" fill="#1e3a8a" stroke="#60a5fa" />
            <text x="79" y="18" text-anchor="middle" fill="#dbeafe" font-size="12" font-weight="bold">
              🚶 斑馬線有行人通行
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export function SignalQuizView({ questions, onComplete, onBackHome }: SignalQuizViewProps) {
  const [startMs] = useState(() => Date.now());
  const [index, setIndex] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QuizAnswerRecord[]>([]);

  const currentQ = questions[index];

  useEffect(() => {
    setPhaseIdx(0);
    if (!currentQ || currentQ.signalPhases.length <= 1) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const scheduleNext = (idx: number) => {
      const dur = currentQ.signalPhases[idx]?.durationMs ?? 1500;
      timer = setTimeout(() => {
        if (!active) return;
        const next = (idx + 1) % currentQ.signalPhases.length;
        setPhaseIdx(next);
        scheduleNext(next);
      }, dur);
    };

    scheduleNext(0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentQ]);

  if (!currentQ) return null;

  const activePhase = currentQ.signalPhases[phaseIdx] ?? currentQ.signalPhases[0];
  const answered = selectedId !== null;
  const isCorrect = selectedId === currentQ.correctOptionId;

  const handleSelectOption = (optionId: string) => {
    if (answered) return;
    setSelectedId(optionId);
    const record = evaluateQuizAnswer(currentQ, optionId);
    if (record.isCorrect) {
      sharedAudioSynth.playPassChime();
    } else {
      sharedAudioSynth.playWarningChime();
    }
    setAnswers((prev) => [...prev, record]);
  };

  const handleNext = () => {
    if (index + 1 < questions.length) {
      setSelectedId(null);
      setIndex((i) => i + 1);
    } else {
      const result = scoreQuizSession(questions, answers, Date.now() - startMs);
      onComplete(result);
    }
  };

  return (
    <div class="app-shell" data-testid="signal-quiz-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span class="badge badge-info" data-testid="quiz-progress">
          台日差異號誌第 {index + 1} / {questions.length} 題
        </span>
        <button
          type="button"
          class="touch-target"
          style={{ padding: '6px 12px', minHeight: '40px', fontSize: '0.85rem' }}
          onClick={onBackHome}
        >
          返回選單
        </button>
      </div>

      <JapaneseSignalSvg
        phase={activePhase}
        auxiliarySign={currentQ.auxiliarySign}
        oncomingCar={currentQ.contextActors.oncomingCar}
        pedestrianCrossing={currentQ.contextActors.pedestrianCrossing}
      />

      <div class="card">
        <p style={{ margin: '0 0 14px', fontSize: '1.02rem', lineHeight: 1.55, fontWeight: 600 }}>
          {currentQ.prompt}
        </p>

        <div class="option-list">
          {currentQ.options.map((opt) => {
            let extraClass = '';
            if (answered) {
              if (opt.id === currentQ.correctOptionId) extraClass = 'option-correct';
              else if (opt.id === selectedId) extraClass = 'option-wrong';
            }
            return (
              <button
                key={opt.id}
                type="button"
                class={`touch-target option-btn ${extraClass}`}
                data-testid={`quiz-option-${opt.id}`}
                disabled={answered}
                onClick={() => handleSelectOption(opt.id)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            data-testid="quiz-feedback"
            style={{
              marginTop: '14px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: isCorrect ? 'rgba(22, 163, 74, 0.18)' : 'rgba(220, 38, 38, 0.2)',
              border: `1px solid ${isCorrect ? '#22c55e' : '#ef4444'}`,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>
              {isCorrect ? '✅ 判斷正確！' : '❌ 小心！這是台灣人赴日常見違規陷阱'}
            </div>
            <div style={{ fontSize: '0.92rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              {currentQ.ruleExplanation}
            </div>
            <button
              type="button"
              class="touch-target btn-primary"
              data-testid="quiz-next-btn"
              style={{ width: '100%', marginTop: '12px' }}
              onClick={handleNext}
            >
              {index + 1 < questions.length ? '下一題 →' : '查看我的赴日右駕存活診斷卡 →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
