import type { SignalScenarioQuestion } from '../domain/types';

export const SIGNAL_QUESTIONS: readonly SignalScenarioQuestion[] = [
  {
    id: 'sig-01-horizontal-order',
    order: 1,
    category: 'horizontal-order',
    prompt:
      '你在沖繩那霸機場剛取車上路，前方橫排紅綠燈「最左側燈泡」亮起（色盲／強光下辨識位置）。請問在日本橫排號誌中，最左邊亮起代表什麼燈？',
    signalPhases: [{ durationMs: 3000, mainLight: 'green', activeArrows: [] }],
    auxiliarySign: 'none',
    contextActors: { oncomingCar: false, pedestrianCrossing: false },
    options: [
      { id: 'opt-a', label: '圓形紅燈（與台灣橫排一樣紅燈在左，必須停車）', intendedMove: 'stop-wait' },
      { id: 'opt-b', label: '圓形綠燈（日本橫排為「綠左、黃中、紅右」，可依規通行）', intendedMove: 'straight' },
      { id: 'opt-c', label: '左轉專用閃爍黃燈', intendedMove: 'left' },
    ],
    correctOptionId: 'opt-b',
    ruleExplanation:
      '台灣橫排紅綠燈是「紅燈在左、綠燈在右」，但日本法規標準是「綠（青）燈在左、紅燈在右」！強光逆光下看燈位時切勿用台灣順序判斷。',
  },
  {
    id: 'sig-02-red-no-left-turn',
    order: 2,
    category: 'red-no-turn',
    prompt:
      '你行駛在左側車道準備「左轉（順向小彎）」，前方號誌只亮起「圓形紅燈」，下方沒有任何箭頭燈，且橫向完全沒車。此時該怎麼做？',
    signalPhases: [{ durationMs: 3000, mainLight: 'red', activeArrows: [] }],
    auxiliarySign: 'none',
    contextActors: { oncomingCar: false, pedestrianCrossing: false },
    options: [
      { id: 'opt-a', label: '確認沒車沒行人後，慢慢紅燈左轉', intendedMove: 'left' },
      { id: 'opt-b', label: '在停止線前完全停車等候，日本純紅燈嚴禁任何方向轉彎', intendedMove: 'stop-wait' },
      { id: 'opt-c', label: '閃雙黃燈提醒後快速左轉通過', intendedMove: 'left' },
    ],
    correctOptionId: 'opt-b',
    ruleExplanation:
      '在日本只要主燈是圓形紅燈且沒有對應方向的「綠色箭頭燈」或左轉標誌，無論左轉或右轉都絕對禁止通行，必須完全停等綠燈。',
  },
  {
    id: 'sig-03-red-with-arrows',
    order: 3,
    category: 'arrow-signal',
    prompt:
      '日本繁忙十字路口常見上下兩排號誌：目前上排亮「圓形紅燈」，但下排同時亮起「左轉」與「直行」兩個綠色箭頭燈。你正位於直行車道準備直行，該如何判斷？',
    signalPhases: [
      { durationMs: 1400, mainLight: 'red', activeArrows: ['straight'] },
      { durationMs: 2200, mainLight: 'red', activeArrows: ['left', 'straight'] },
    ],
    auxiliarySign: 'none',
    contextActors: { oncomingCar: false, pedestrianCrossing: false },
    options: [
      { id: 'opt-a', label: '上排是紅燈所以全部不能動，繼續原地停等', intendedMove: 'stop-wait' },
      { id: 'opt-b', label: '綠色箭頭優先於主紅燈，可依箭頭方向直行或左轉（但不可右轉）', intendedMove: 'straight' },
      { id: 'opt-c', label: '既然亮了兩個綠箭頭，右轉也可以順便跟著轉', intendedMove: 'right' },
    ],
    correctOptionId: 'opt-b',
    ruleExplanation:
      '日本的「矢印式信号機（箭頭號誌）」優先級高於上方圓形紅燈！只要有指向你行進方向的綠色箭頭即可通行，未亮箭頭的右轉則仍屬紅燈禁行。',
  },
  {
    id: 'sig-04-right-arrow-phase',
    order: 4,
    category: 'arrow-signal',
    prompt:
      '你在多車道右轉專用道停等：號誌剛從「全綠燈 → 黃燈」切換為「上排紅燈 ＋ 下排右轉綠色箭頭亮起」（時差保護右轉）。對向來車已停下且斑馬線無行人，此時該怎麼做？',
    signalPhases: [
      { durationMs: 1100, mainLight: 'yellow', activeArrows: [] },
      { durationMs: 2600, mainLight: 'red', activeArrows: ['right'] },
    ],
    auxiliarySign: 'none',
    contextActors: { oncomingCar: false, pedestrianCrossing: false },
    options: [
      { id: 'opt-a', label: '趁右轉綠色箭頭亮起時，打右側方向燈、右轉大彎進入目標道路左側車道', intendedMove: 'right' },
      { id: 'opt-b', label: '因為上排變紅燈了，必須等到下次圓形綠燈才能右轉', intendedMove: 'stop-wait' },
      { id: 'opt-c', label: '直接切入目標道路最右側車道完成右轉', intendedMove: 'right' },
    ],
    correctOptionId: 'opt-a',
    ruleExplanation:
      '這是日本最標準的右轉保護時相（紅燈＋右轉綠箭頭）：對向直行車已被紅燈攔停，請把握時機右轉大彎切入目標道路的「左側車道」！',
  },
  {
    id: 'sig-05-all-three-arrows',
    order: 5,
    category: 'arrow-signal',
    prompt:
      '你在日本市區看到一個奇特景象：上排亮著「圓形紅燈」，下排卻同時亮起「左、直、右」三個綠色箭頭！為什麼不直接亮圓形綠燈？你準備左轉時要注意什麼？',
    signalPhases: [{ durationMs: 3000, mainLight: 'red', activeArrows: ['left', 'straight', 'right'] }],
    auxiliarySign: 'none',
    contextActors: { oncomingCar: false, pedestrianCrossing: false },
    options: [
      { id: 'opt-a', label: '代表號誌故障，應拒絕通過並倒車離開', intendedMove: 'stop-wait' },
      { id: 'opt-b', label: '代表我方三向皆受保護可通行（對向與橫向為紅燈），確認無滯留行人即可左轉入左側車道', intendedMove: 'left' },
      { id: 'opt-c', label: '只有公車與計程車可以走，租賃小客車禁止通行', intendedMove: 'stop-wait' },
    ],
    correctOptionId: 'opt-b',
    ruleExplanation:
      '日本時差式路口為了明確告訴駕駛「對向車已被紅燈擋住（與對向亦綠燈的圓形綠燈區隔）」，常出現「主紅燈＋三向綠箭頭全亮」，所有方向皆可安心依規通行！',
  },
  {
    id: 'sig-06-tomare-full-stop',
    order: 6,
    category: 'stop-sign',
    prompt:
      '行經日本住宅區無紅綠燈路口，路邊立有紅色倒三角形「止まれ（STOP）」標誌，地上有白色停止線，左右看起來完全沒車。你該如何通過？',
    signalPhases: [{ durationMs: 3000, mainLight: 'off', activeArrows: [] }],
    auxiliarySign: 'tomare',
    contextActors: { oncomingCar: false, pedestrianCrossing: false },
    options: [
      { id: 'opt-a', label: '時速降到 5 km/h 慢慢滑行左右張望通過即可', intendedMove: 'straight' },
      { id: 'opt-b', label: '車頭在白色停止線前「車輪完全靜止（0 km/h 停頓確認）」左右無車後再起步', intendedMove: 'stop-wait' },
      { id: 'opt-c', label: '按一聲喇叭提醒巷口後直接等速通過', intendedMove: 'straight' },
    ],
    correctOptionId: 'opt-b',
    ruleExplanation:
      '「一時不停止（止まれ未完全煞停）」是外國自駕旅客在日本最常被警察取締與發生巷口攔腰撞擊的原因！車輪必須在停止線前完全靜止，絕不可滑行帶過。',
  },
  {
    id: 'sig-07-green-right-turn-yield',
    order: 7,
    category: 'pedestrian-yield',
    prompt:
      '前方亮起「圓形綠燈」（無右轉專用箭頭），你打右側方向燈準備右轉，但對向車道正有一輛直行車快速駛近。此時誰有優先路權？',
    signalPhases: [{ durationMs: 3000, mainLight: 'green', activeArrows: [] }],
    auxiliarySign: 'none',
    contextActors: { oncomingCar: true, pedestrianCrossing: false },
    options: [
      { id: 'opt-a', label: '對向直行車與左轉車優先！我應在路口中央右轉待轉區停等，禮讓對向車通過後再轉', intendedMove: 'stop-wait' },
      { id: 'opt-b', label: '圓形綠燈代表右轉受保護，趁對向車到之前加速搶先切過去', intendedMove: 'right' },
      { id: 'opt-c', label: '閃遠光燈示意對向車讓路後直接右轉', intendedMove: 'right' },
    ],
    correctOptionId: 'opt-a',
    ruleExplanation:
      '日本警察廳統計外籍租車駕駛「右轉事故率是日本人的 2.4–2.7 倍」！圓形綠燈時對向也是綠燈，右轉大彎必須跨越對向車道，務必停等禮讓直行車與對向左轉車。',
  },
  {
    id: 'sig-08-left-turn-pedestrian',
    order: 8,
    category: 'pedestrian-yield',
    prompt:
      '前方圓形綠燈，你打右側方向燈準備左轉小彎進入橫向道路，此時左側斑馬線上正好有行人綠燈起步過馬路。你應該怎麼做？',
    signalPhases: [{ durationMs: 3000, mainLight: 'green', activeArrows: [] }],
    auxiliarySign: 'none',
    contextActors: { oncomingCar: false, pedestrianCrossing: true },
    options: [
      { id: 'opt-a', label: '趁行人剛踏上斑馬線距離還遠，加速從行人面前先轉過去', intendedMove: 'left' },
      { id: 'opt-b', label: '在斑馬線前完全停讓，等行人徹底通過車道後再緩慢左轉入左側車道', intendedMove: 'stop-wait' },
      { id: 'opt-c', label: '貼近行人背後慢慢滑過去以節省後車時間', intendedMove: 'left' },
    ],
    correctOptionId: 'opt-b',
    ruleExplanation:
      '日本對「横断歩道（斑馬線）行人優先」執法極為嚴厲！轉彎時只要斑馬線上有行人正在通行或準備通行，車輛就必須完全停讓，搶行將面臨重罰與高肇事風險。',
  },
  {
    id: 'sig-09-yellow-light-stop',
    order: 9,
    category: 'red-no-turn',
    prompt:
      '你距離路口停止線還有充足安全煞車距離，前方橫排號誌剛由左側綠燈切換為中央「圓形黃燈」。依日本道路交通法，黃燈的原則為何？',
    signalPhases: [
      { durationMs: 1100, mainLight: 'green', activeArrows: [] },
      { durationMs: 2500, mainLight: 'yellow', activeArrows: [] },
    ],
    auxiliarySign: 'none',
    contextActors: { oncomingCar: false, pedestrianCrossing: false },
    options: [
      { id: 'opt-a', label: '黃燈代表「加速通過」，踩油門衝過停止線', intendedMove: 'straight' },
      { id: 'opt-b', label: '黃燈原則上等同停止指示（除非已接近停止線急煞會造成追撞危險），應平穩減速停於停止線前', intendedMove: 'stop-wait' },
      { id: 'opt-c', label: '黃燈時僅禁止直行，但仍可自由右轉', intendedMove: 'right' },
    ],
    correctOptionId: 'opt-b',
    ruleExplanation:
      '在日本交通法規中，黃燈的法定意義是「停止（除非距離過近無法安全煞停）」，絕非加速搶黃燈！尤其後段緊接著可能是對向的右轉保護箭頭，搶黃燈極易對撞。',
  },
  {
    id: 'sig-10-tomare-pedestrian-combo',
    order: 10,
    category: 'stop-sign',
    prompt:
      '從日本便利商店停車場準備左轉駛入主幹道，出口立有「止まれ」標誌，且前方人行道有單車與行人接近。正確的起步順序為何？',
    signalPhases: [{ durationMs: 3000, mainLight: 'off', activeArrows: [] }],
    auxiliarySign: 'tomare',
    contextActors: { oncomingCar: false, pedestrianCrossing: true },
    options: [
      { id: 'opt-a', label: '直接開上人行道停下來等主幹道沒車再左轉', intendedMove: 'left' },
      { id: 'opt-b', label: '先打右側方向燈，在進入人行道／停止線前完全靜止禮讓行人與單車，再確認右側主幹道無來車後左轉進入左側車道', intendedMove: 'stop-wait' },
      { id: 'opt-c', label: '打左側撥桿後快速切進主幹道右側車道', intendedMove: 'left' },
    ],
    correctOptionId: 'opt-b',
    ruleExplanation:
      '日本由路外設施（超商、加油站）駛入道路時，必須在穿越人行道前「一旦停止」禮讓行人與腳踏車；且因靠左行駛，左轉匯入時第一波車流會從你的「右方」駛來！',
  },
];
