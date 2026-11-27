export type SignalCategory =
  | 'horizontal-order'
  | 'arrow-signal'
  | 'red-no-turn'
  | 'stop-sign'
  | 'pedestrian-yield';

export type ArrowDirection = 'left' | 'straight' | 'right';
export type MainLightState = 'green' | 'yellow' | 'red' | 'off';
export type AuxiliarySign = 'tomare' | 'one-way' | 'none';
export type IntendedMove = 'left' | 'straight' | 'right' | 'stop-wait';

export interface SignalPhaseKeyframe {
  durationMs: number;
  mainLight: MainLightState;
  activeArrows: ArrowDirection[];
}

export interface QuestionOption {
  id: string;
  label: string;
  intendedMove: IntendedMove;
  yieldsToPedestrianAndOncoming?: boolean;
}

export interface SignalScenarioQuestion {
  id: string;
  order: number;
  category: SignalCategory;
  prompt: string;
  signalPhases: SignalPhaseKeyframe[];
  auxiliarySign: AuxiliarySign;
  contextActors: {
    oncomingCar: boolean;
    pedestrianCrossing: boolean;
  };
  options: QuestionOption[];
  correctOptionId: string;
  ruleExplanation: string;
}

export type DrillId = 'warmup-range' | 'urban-drill-1' | 'urban-drill-2';
export type DrillTier = 'warmup' | 'urban-core' | 'urban-bonus';

export type CheckpointType =
  | 'keep-left-corridor'
  | 'left-turn-small'
  | 'right-turn-wide'
  | 'tomare-stop-line'
  | 'arrow-signal-right-turn';

export type ExitLaneChoice = 'left-inbound' | 'right-oncoming';

export interface DrillCheckpoint {
  id: string;
  type: CheckpointType;
  instruction: string;
  distanceMeters: number;
  signalPhases?: SignalPhaseKeyframe[];
  hasOncomingCar?: boolean;
  hasPedestrianCrossing?: boolean;
  requiresRightSignal: boolean;
  requiredExitLane?: 'left-inbound';
}

export interface SemiAssistBounds {
  maxLateralOffsetMeters: number;
  autoRecenterStrength: number;
}

export interface DrivingDrillScenario {
  id: DrillId;
  title: string;
  subtitle: string;
  tier: DrillTier;
  targetDurationSec: number;
  checkpoints: DrillCheckpoint[];
  semiAssistBounds: SemiAssistBounds;
}

export type MistakeType =
  | 'wiper-mistrigger'
  | 'tomare-rolling-stop'
  | 'wrong-way-lane'
  | 'signal-violation'
  | 'yield-violation';

export interface RuleMistakeRecord {
  mistakeType: MistakeType;
  scenarioId: string;
  checkpointId?: string;
  attemptNumber: number;
  elapsedMs: number;
}

export interface QuizAnswerRecord {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  category: SignalCategory;
}

export interface QuizSessionResult {
  totalQuestions: number;
  correctCount: number;
  durationMs: number;
  weakCategories: SignalCategory[];
  answers: QuizAnswerRecord[];
  completedAt: string;
}

export type ErrorReductionState = 'first-attempt' | 'perfect-maintained' | 'computed';

export interface DrillAttemptSummary {
  scenarioId: DrillId;
  attemptNumber: number;
  completed: boolean;
  durationMs: number;
  totalMistakes: number;
  mistakesByType: Record<MistakeType, number>;
  errorReductionPctVsFirst: number | null;
  errorReductionState: ErrorReductionState;
  completedAt: string;
}

export type DiagnosticGrade = 'S' | 'A' | 'B' | 'C';

export interface ReadinessDiagnosticCard {
  grade: DiagnosticGrade;
  headline: string;
  quizScoreText: string;
  topBlindSpots: string[];
  improvementBadge: string | null;
  shareText: string;
}

export type PackId = 'urban-drill-2' | 'hokkaido-snow-pack' | 'highway-etc-pack';

export interface ThemePackUnlockState {
  packId: PackId;
  accessMode: 'share-unlockable' | 'fake-door-preview';
  unlocked: boolean;
  displayedPriceLabel: string | null;
  intentClickedCount: number;
}

export type ConfidenceRating =
  | 'much-more-confident'
  | 'slightly-more-confident'
  | 'unchanged'
  | 'less-confident';

export interface AnonymousValidationSession {
  sessionId: string;
  disclaimerAcceptedAt: string | null;
  entryRef: 'direct' | 'buddy-share';
  quizResult: QuizSessionResult | null;
  drillAttempts: DrillAttemptSummary[];
  confidencePulse: ConfidenceRating | null;
  unlockStates: Record<PackId, ThemePackUnlockState>;
}

export type BrowserEnv = 'line-iab' | 'fb-iab' | 'ig-iab' | 'safari' | 'chrome' | 'other';
export type ViewportClass = 'compact' | 'standard' | 'wide';
export type RenderMode = 'webgl2' | 'webgl1' | 'fallback-2d';

export type TelemetryEventName =
  | 'app_first_interactive'
  | 'disclaimer_accepted'
  | 'quiz_started'
  | 'quiz_completed'
  | 'drill_started'
  | 'rule_mistake_logged'
  | 'drill_completed'
  | 'core_loop_completed'
  | 'confidence_pulse_submitted'
  | 'diagnostic_shared'
  | 'buddy_unlock_granted'
  | 'fake_door_clicked'
  | 'affiliate_resource_clicked'
  | 'render_degraded';

export interface TelemetryEnvelope {
  schemaVersion: '1.0';
  sessionId: string;
  eventName: TelemetryEventName;
  timestampIso: string;
  browserEnv: BrowserEnv;
  viewportClass: ViewportClass;
  renderMode: RenderMode;
  props: Record<string, string | number | boolean | null>;
}
