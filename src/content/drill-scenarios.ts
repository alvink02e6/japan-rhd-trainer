import type { DrillId, DrivingDrillScenario } from '../domain/types';

export const DRILL_SCENARIOS: Record<DrillId, DrivingDrillScenario> = {
  'warmup-range': {
    id: 'warmup-range',
    title: '駕訓熱身場：靠左空間感＆左右撥桿反射',
    subtitle: '無車流壓力！適應右側駕駛座視角、右手方向燈（小心左手雨刷陷阱）與左小彎／右大彎',
    tier: 'warmup',
    targetDurationSec: 60,
    semiAssistBounds: {
      maxLateralOffsetMeters: 1.2,
      autoRecenterStrength: 0.65,
    },
    checkpoints: [
      {
        id: 'wp-1-keep-left',
        type: 'keep-left-corridor',
        instruction:
          '熱身 1/3：觀察左前引擎蓋黃色導引標記，按住「加速前進」維持在道路【左側車道】行駛。',
        distanceMeters: 36,
        requiresRightSignal: false,
      },
      {
        id: 'wp-2-left-turn',
        type: 'left-turn-small',
        instruction:
          '熱身 2/3：前方路口準備【左轉小彎】！請先點按「右側方向燈」（別按到左邊雨刷！），再選擇轉入左側順向車道。',
        distanceMeters: 42,
        requiresRightSignal: true,
        requiredExitLane: 'left-inbound',
      },
      {
        id: 'wp-3-right-turn',
        type: 'right-turn-wide',
        instruction:
          '熱身 3/3：前方路口準備【右轉大彎】！請用右手開啟右轉方向燈，跨越路口中心轉入目標道路【左側順向車道】。',
        distanceMeters: 46,
        requiresRightSignal: true,
        requiredExitLane: 'left-inbound',
      },
    ],
  },
  'urban-drill-1': {
    id: 'urban-drill-1',
    title: '市區實戰第 1 關：止まれ停讓＆多車道箭頭右轉',
    subtitle: '日本外籍右轉事故率高達 2.4–2.7 倍！連續挑戰巷口止まれ完全靜止 1 秒、左轉讓行人與時差箭頭右轉大彎',
    tier: 'urban-core',
    targetDurationSec: 75,
    semiAssistBounds: {
      maxLateralOffsetMeters: 1.1,
      autoRecenterStrength: 0.6,
    },
    checkpoints: [
      {
        id: 'ud1-1-tomare',
        type: 'tomare-stop-line',
        instruction:
          '實戰 1/3：前方住宅巷口有紅倒三角「止まれ」！請在停止線前 0–4m 按住煞車【完全靜止滿 1.0 秒】後再起步通過。',
        distanceMeters: 38,
        requiresRightSignal: false,
      },
      {
        id: 'ud1-2-pedestrian-left',
        type: 'left-turn-small',
        instruction:
          '實戰 2/3：綠燈準備【左轉小彎】，注意左側斑馬線有行人正在過馬路！請先打右側方向燈、煞停等行人通過後再左轉入左道。',
        distanceMeters: 44,
        signalPhases: [{ durationMs: 4000, mainLight: 'green', activeArrows: [] }],
        hasOncomingCar: false,
        hasPedestrianCrossing: true,
        requiresRightSignal: true,
        requiredExitLane: 'left-inbound',
      },
      {
        id: 'ud1-3-arrow-right',
        type: 'arrow-signal-right-turn',
        instruction:
          '實戰 3/3：多車道十字路口準備【右轉大彎】！先用右手打右轉方向燈，等對向直行車通過且下排「右轉綠箭頭」亮起時，切入目標【左側順向車道】。',
        distanceMeters: 48,
        signalPhases: [
          { durationMs: 3200, mainLight: 'green', activeArrows: [] },
          { durationMs: 4200, mainLight: 'red', activeArrows: ['right'] },
        ],
        hasOncomingCar: true,
        hasPedestrianCrossing: false,
        requiresRightSignal: true,
        requiredExitLane: 'left-inbound',
      },
    ],
  },
  'urban-drill-2': {
    id: 'urban-drill-2',
    title: '市區實戰第 2 關（旅伴解鎖）：複合車流待轉＆超商匯入',
    subtitle: '進階高壓考驗：超商出口止まれ禮讓行人、無保護綠燈右轉待轉與時差箭頭精準判讀',
    tier: 'urban-bonus',
    targetDurationSec: 85,
    semiAssistBounds: {
      maxLateralOffsetMeters: 1.0,
      autoRecenterStrength: 0.55,
    },
    checkpoints: [
      {
        id: 'ud2-1-tomare-exit',
        type: 'tomare-stop-line',
        instruction:
          '進階 1/3：從便利商店出口駛入幹道，前方有「止まれ」停止線！務必在線前完全煞停滿 1.0 秒確認左右無車再前進。',
        distanceMeters: 36,
        requiresRightSignal: false,
      },
      {
        id: 'ud2-2-unprotected-right',
        type: 'arrow-signal-right-turn',
        instruction:
          '進階 2/3：幹道圓形綠燈【右轉大彎】，對向直行車與斑馬線行人同時出現！請打右側方向燈、完全禮讓淨空後轉入【左側順向車道】。',
        distanceMeters: 46,
        signalPhases: [
          { durationMs: 3500, mainLight: 'green', activeArrows: [] },
          { durationMs: 4000, mainLight: 'red', activeArrows: ['right'] },
        ],
        hasOncomingCar: true,
        hasPedestrianCrossing: true,
        requiresRightSignal: true,
        requiredExitLane: 'left-inbound',
      },
      {
        id: 'ud2-3-final-arrow-right',
        type: 'arrow-signal-right-turn',
        instruction:
          '進階 3/3：終點前大型時差式號誌路口！純紅燈時嚴禁搶轉，待下排「右轉綠箭頭」亮起後右轉大彎進入左側車道！',
        distanceMeters: 46,
        signalPhases: [
          { durationMs: 3000, mainLight: 'red', activeArrows: ['straight'] },
          { durationMs: 4200, mainLight: 'red', activeArrows: ['right'] },
        ],
        hasOncomingCar: false,
        hasPedestrianCrossing: false,
        requiresRightSignal: true,
        requiredExitLane: 'left-inbound',
      },
    ],
  },
};

export const DRILL_SCENARIO_LIST: readonly DrivingDrillScenario[] = [
  DRILL_SCENARIOS['warmup-range'],
  DRILL_SCENARIOS['urban-drill-1'],
  DRILL_SCENARIOS['urban-drill-2'],
];
