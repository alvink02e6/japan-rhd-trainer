# Idea Research: 移動端第一人稱日本右駕訓練工具 (Mobile First-Person Japan RHD Trainer)

- **Slug**: my-idea
- **Created**: 2026-11-13（Updated: 2026-11-24 補強外部客觀數據、競品盤點與技術查核）
- **Evidence confidence (overall)**: medium

## Users & Demand

- **台灣赴日旅遊基本盤龐大且持續成長**：依據日本政府觀光局（JNTO）統計，台灣訪日旅客 2024 年達 **6,044,316 人次**（年增約 43.8%），2025 年進一步成長至 **6,763,424 人次**（年增約 11.9%），穩居日本全球第 3 大客源市場；台灣旅客僅需「台灣駕照正本＋監理所日文譯本」即可在日合法租車自駕 — [source: JNTO 2024–2025 訪日外客統計 (web search summary)] (confidence: high)
- **外籍旅客在日自駕事故連年攀升，且「右轉」風險顯著倍增**：依據日本內閣府《交通安全白書》與警察廳統計，持國際駕照／外國駕照之外籍駕駛租車人身事故（第一當事人）件數由 2022 年 14 件、2023 年 120 件、2024 年 **171 件**，攀升至 2025 年 **212 件**（年增約 24%）；因不習慣「左側通行・右駕」，外籍駕駛於**「右轉時（右折時）」的事故比例約為日本本地駕駛的 2.4 至 2.7 倍**，沖繩那霸機場周邊亦為全日本外籍觀光客租車率最高區域之一 — [source: 日本內閣府《交通安全白書》／警察廳與國土交通省統計 (web search summary)] (confidence: high)
- **台日號誌規則存在明確認知落差**：台灣橫排紅綠燈為「紅燈在左、綠燈在右」，日本為「綠燈在左、紅燈在右」；此外日本常見**上下兩排矢印式信号機**（主燈紅燈＋下方亮起單向或多向綠色箭頭，依箭頭方向通行；若無箭頭則紅燈嚴禁任何方向轉彎）以及**紅倒三角「止まれ（STOP）」必須完全靜止**與嚴格行人優先執法，均為台灣赴日駕駛高頻混淆與違規痛點 — [source: 日本交通號誌宣導與台日差異報導 (web search summary)] (confidence: high)
- **旅遊自駕屬極低頻、出發前短期集中場景**：多數旅客一年僅出國自駕 1–2 次，集中於出發前數天準備；因此長週期訂閱制可行性低，且強制下載原生 App 存在高獲客阻力 — [source: ASSUMPTION] (confidence: medium)
- **一手產品轉換數據尚待上線實測**：雖有外部客觀市場與事故數據證實痛點真實存在，但目前尚未取得針對本工具「Mobile Web 完課率、旅伴分享解鎖率、進階關卡付費點擊意願」的一手行為實測數據（將於 2–3 週 Small Appetite MVP 上線後 30 天內收集） — [source: ASSUMPTION] (confidence: high)

## Prior Art

### 1. 地圖與街景模擬前例（說明為何 MVP 放棄「全球任意真實路線」）
- `terryds/google-street-view-driving-simulator`（Web 端 Google Street View 駕駛模擬器）— README 明確指出：**「因 Google Maps API 費用過高，目前已關閉公開線上 Demo，使用者需自行申請計費 API Key」**，證實商業街景在低頻免費／低客單產品上單位經濟效益不成立 — [source: https://github.com/terryds/google-street-view-driving-simulator] (confidence: high)
- `Guillar1/GoogleStreetViewDrivingSimulator`（Python + OpenCV 街景縮時影片）— 僅為單向固定軌跡播放，無法互動練習右駕車道選擇或逆向回饋 — [source: https://github.com/Guillar1/GoogleStreetViewDrivingSimulator] (confidence: high)
- `StrandedKitty/streets-gl`（WebGL2 即時 OpenStreetMap 3D 渲染引擎，1,120+ Stars）— 官方文件標明流暢體驗通常需要現代獨立顯示卡（discrete GPU），凸顯行動端即時渲染任意 OSM 城市的硬體瓶頸 — [source: https://github.com/StrandedKitty/streets-gl] (confidence: high)
- `a-b-street/abstreet`（8,190+ Stars）與 `Dreitser/OpenStreetMap-Open-Road` — 雖能由 OSM 推導車道與左行拓樸，但全球鄉郊 OSM 車道標記完整度不一且缺乏真實地標外觀 — [source: https://github.com/a-b-street/abstreet] (confidence: high)
- `carla-simulator/carla`（14,600+ Stars）— 依賴 Unreal Engine 與預建 OpenDRIVE 地圖，不適用行動端輕量工具 — [source: https://github.com/carla-simulator/carla] (confidence: high)

### 2. 新增參考技術與體驗前例（2026-11-24 查核）
- `Noniv/abyssal-garden`（2,885 Stars，96 KB 單檔純手寫 Raw WebGPU 海底漫遊）與衍生城市專案 `J-o-h-n-M/afterglow-city`（126 KB 單檔 Raw WebGPU 飛越城市）— 展現極致零貼圖、零引擎程序化渲染能力，但官方 README 實測明載：**低階手機（Samsung Galaxy A16）在 Low 畫質 670×372 僅約 20 FPS，且觸控支援仍為實驗性**；此外 Raw WGSL Shader 欠缺交通規則狀態機、物理碰撞與跨裝置 WebGL2 向下相容，對獨立團隊而言屬高度工程維護風險，**不建議作為 MVP 實作架構** — [source: https://github.com/Noniv/abyssal-garden]；[source: https://github.com/J-o-h-n-M/afterglow-city] (confidence: high)
- **Steam *Left! Left! LEFT!*（Stellux Interactive）** — 雙人非對稱合作拉力遊戲，採風格化低多邊形第一人稱車艙視角，核心樂趣為「駕駛視角受限＋副駕持平板看小地圖報路」。此設計啟發兩大洞察：(1) 風格化低負擔座艙比雜亂街景更利於聚焦號誌與車道；(2) 自駕旅遊多為情侶／親友同行，「副駕報路／行前挑戰旅伴」具備原生社群分享裂變潛力 — [source: Steam *Left! Left! LEFT!* 產品資訊 (web search summary)] (confidence: high)

### 3. 既有行動 App 競品盤點（2026-11-24 查核）
- **靠左行駛模擬器（Left Hand Drive / Right Hand Drive Simulator，App Store / Google Play）**：3D 開放世界右駕練習 App，但為通用多國設定、需下載原生 App，缺乏台灣 vs 日本差異號誌（矢印式信号機、止まれ）與針對性認知微關卡 — [source: App Store / Google Play 搜尋摘要 (web search summary)] (confidence: medium)
- **Car Sim Japan / Driving Zone: Japan（Google Play）**：日本街道背景之賽車／自由駕駛遊戲，偏向娛樂操控而非交通規則與右駕決策訓練 — [source: Google Play 搜尋摘要 (web search summary)] (confidence: medium)
- **Japan Driver Master（Google Play）**：聚焦日本外國駕照轉換（Gaimen Kirikae）之雙語靜態筆試題庫，缺乏第一人稱動態路況與左右撥桿反射演練 — [source: Google Play 搜尋摘要 (web search summary)] (confidence: medium)

## Market & Context

- **使用者現有的替代方案（Alternatives）**：
  1. 觀看 YouTube、部落格或 JAF 靜態 PDF 的「日本自駕教學／交通標誌整理」——被動吸收、缺乏主動決策與反向撥桿刺激 — [source: JAF 宣導與自駕教學概況 (web search summary)] (confidence: high)
  2. 使用 Google Maps Street View 手動查看取車點與重點路口——無法模擬右駕車道選擇與逆向錯誤回饋 — [source: ASSUMPTION] (confidence: high)
  3. 下載既有原生右駕模擬 App 或駕訓題庫 App——下載阻力高，且「純題庫」與「純開車遊戲」彼此割裂，未針對台灣旅客高頻失誤整合 — [source: App Store / Google Play 搜尋摘要 (web search summary)] (confidence: medium)
- **不作為的代價（Cost of doing nothing）**：台灣赴日自駕旅客在取車初期與面對日本多車道右轉大彎、上下排箭頭紅綠燈及「止まれ」路口時，仍須承擔高於日本本地駕駛 2.4–2.7 倍的右轉事故風險與高度旅遊焦慮 — [source: 日本內閣府《交通安全白書》／警察廳統計 (web search summary)] (confidence: high)

## Data & Constraints

- **行動端 WebGPU 與 WebGL2 相容性邊界**：行動端 WebGPU 已於 **iOS 26+ Safari** 與 **Android 12+ 相容 GPU（Adreno/Mali 等）Chrome** 預設啟用（全球瀏覽器覆蓋約 ~89%），但舊 OS 版本與部分行動晶片（如特定低階或 blocklist GPU）仍須依賴 **WebGL2 fallback**。故 Mobile Web 產品應以標準 Web 3D 引擎（如 Three.js 預設 WebGL2）確保全機型覆蓋與 LINE／FB 內建瀏覽器穩定運行 — [source: WebGPU Mobile Support 2025–2026 技術摘要 (web search summary)] (confidence: high)
- **商業地圖 API 與原生 App 平台抽成限制**：
  - 商業街景 API 按量計費會摧毀低頻旅遊工具的單位經濟效益（見 `terryds/google-street-view-driving-simulator`）；改用模組化固定日本實戰情境可將圖資變動成本壓至 **零**。
  - 原生 App 上架面臨 Apple US$99/年費、Guideline 4.2 退件風險、15%–30% IAP 抽成與高下載流失率；Web 端直接導入小額信用卡金流亦面臨高放棄率與稅務負擔。
- **行動端觸控與認知遷移限制**：6 吋觸控螢幕無法還原實體方向盤阻尼與踏板深度；過度追求自由物理微操只會增加操作挫敗感，訓練設計必須聚焦於可遷移的**空間參照系、號誌路權判斷、轉彎目標車道選擇與左右撥桿（方向燈 vs 雨刷）反射** — [source: ASSUMPTION] (confidence: high)

## Evidence Against the Idea

- **純靠「IAP 解鎖虛擬地圖」的單位營收天花板偏低**：工具型 App 的 IAP 轉換率常態僅 1%–3%；若免費的動態號誌問答與駕訓場已消除多數行前焦慮，旅客對付費解鎖額外虛擬地圖的意願可能更低。因此必須以 Fake Door 實測付費意願，並同步保留高客單日本租車／旅平險／網卡聯盟導購（Affiliate）作為替代商業回收引擎 — [source: ASSUMPTION] (confidence: medium)
- **社群冷啟動與低頻使用挑戰**：自駕旅遊屬一年 1–2 次的極低頻需求，若沒有內建可分享的社交觸發點（如「赴日右駕翻車診斷書」貼入同行 LINE 群組挑戰旅伴），將缺乏自然增長飛輪 — [source: ASSUMPTION] (confidence: high)
- **行動端 In-App Browser 效能與相容性風險**：台灣旅遊流量大量來自 LINE 與 Facebook 內建瀏覽器，其 WebGL2 效能、全螢幕手勢與音訊自動播放限制比獨立 Safari/Chrome 更嚴格，須在實作期列為核心測試項目 — [source: ASSUMPTION] (confidence: high)

## Gaps & Open Questions

- [NEEDS CLARIFICATION: 上線 30 天內在實際台灣自駕社群（LINE 群組、FB 社團、Threads）的真實行為驗證數據：首套體驗完課率能否 ≥ 50%、重複練習失誤率下降能否 ≥ 40%、進階地圖 Fake Door 點擊／分享解鎖率能否 ≥ 10%？（列為 MVP 上線後的實驗驗證目標，而非上線前阻塞）]
- [NEEDS CLARIFICATION: 實際測試 LINE / Facebook / IG 行動內建瀏覽器載入風格化 3D 場景的實測 FPS 與載入時間是否符合 3 秒進入首屏標準（將於 `/speckit-plan` 技術驗證階段實測）]

## Sources

- https://github.com/terryds/google-street-view-driving-simulator (host: github.com, policy: allowlisted)
- https://github.com/Guillar1/GoogleStreetViewDrivingSimulator (host: github.com, policy: allowlisted)
- https://github.com/Dreitser/OpenStreetMap-Open-Road (host: github.com, policy: allowlisted)
- https://github.com/StrandedKitty/streets-gl (host: github.com, policy: allowlisted)
- https://github.com/a-b-street/abstreet (host: github.com, policy: allowlisted)
- https://github.com/carla-simulator/carla (host: github.com, policy: allowlisted)
- https://github.com/Noniv/abyssal-garden (host: github.com, policy: allowlisted)
- https://github.com/J-o-h-n-M/afterglow-city (host: github.com, policy: allowlisted)
- JNTO 2024–2025 訪日外客統計、日本內閣府《交通安全白書》／警察廳外籍租車事故統計、WebGPU 行動支援報告、Steam *Left! Left! LEFT!* 與 App Store / Google Play 競品資訊（皆經由 2026-11-24 Web Search 摘要查核，未直接抓取非白名單主機頁面）
