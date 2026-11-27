export interface FakeDoorPackMeta {
  packId: 'hokkaido-snow-pack' | 'highway-etc-pack';
  title: string;
  badgeLabel: string;
  displayedPriceLabel: string;
  description: string;
  zeroChargeNotice: string;
}

export interface ExternalTravelResource {
  id: string;
  category: 'car-rental' | 'insurance-guide' | 'checklist';
  title: string;
  description: string;
  href: string;
}

export const FAKE_DOOR_PREVIEW_PACKS: readonly FakeDoorPackMeta[] = [
  {
    packId: 'hokkaido-snow-pack',
    title: '北海道冬季雪地＆縱排號誌實戰包',
    badgeLabel: '進階主題預告',
    displayedPriceLabel: '預計單次解鎖方案 NT$90',
    description:
      '涵蓋北海道防積雪「縱排紅綠燈（上紅下綠）」、路邊紅白矢羽根路寬標示、結冰黑冰煞車距離與暴風雪視線演練。',
    zeroChargeNotice:
      '感謝回饋！此進階主題包尚在籌備統計需求中，本次不會收取任何費用。你可以先透過「分享給同行旅伴」免費解鎖【市區實戰第 2 關】！',
  },
  {
    packId: 'highway-etc-pack',
    title: '日本高速公路匝道匯入＆ETC 收費站實戰包',
    badgeLabel: '進階主題預告',
    displayedPriceLabel: '預計單次解鎖方案 NT$90',
    description:
      '涵蓋日本自動車道「右側加速車道匯入左側主線」、「ETC 專用紫牌 vs 一般人工車道」辨識與內側超車道駛離規範。',
    zeroChargeNotice:
      '感謝回饋！此進階主題包尚在籌備統計需求中，本次不會收取任何費用。你可以先透過「分享給同行旅伴」免費解鎖【市區實戰第 2 關】！',
  },
];

export const DISCLOSED_TRAVEL_RESOURCES: readonly ExternalTravelResource[] = [
  {
    id: 'res-jaf-rules',
    category: 'checklist',
    title: '日本自動車聯盟 (JAF) 外國人交通安全多語指南',
    description: '出發前必存：官方交通標誌一覽、緊急事故報警（110／119）與道路救援流程。',
    href: 'https://english.jaf.or.jp/safe-driving/traffic-rules-in-japan',
  },
  {
    id: 'res-noc-insurance',
    category: 'insurance-guide',
    title: '日本租車保險 CDW vs NOC（營業損失賠償）行前檢核要點',
    description: '取車櫃檯簽約前確認免責補償（CDW）與安心全險（NOC + 道路救援輪胎保障）差異。',
    href: 'https://www.japan.travel/tw/plan/getting-around/cars/',
  },
  {
    id: 'res-rental-compare',
    category: 'car-rental',
    title: '日本全國租車中文預約與右駕車款指南',
    description: '比較那霸、新千歲、福岡等機場取還車方案與 ETC 卡租借預約注意事項。',
    href: 'https://www.visit-okinawa.jp/plan-your-trip/getting-around-okinawa?lang=zh-hant',
  },
];
