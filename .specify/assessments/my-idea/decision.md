# Decision: 台灣→日本自駕情境化右駕認知訓練 PWA (Taiwan-to-Japan RHD Cognitive Trainer PWA)

- **Slug**: my-idea
- **Decided**: 2026-11-24（修訂自 2026-11-19 `needs-clarification` 初判）
- **Verdict**: go
- **Artifacts reviewed**: intake.md, research.md, problem.md, concept.md

## Scorecard

| Criterion | Rating | Justification |
|-----------|--------|---------------|
| Problem validity | strong | JNTO 統計台灣訪日旅客 2024 年 604 萬、2025 年達 676 萬人次（全球第 3 大來源），且日本內閣府／警察廳官方數據證實外籍租車人身事故連年上升（2023 年 120 件 → 2025 年 212 件），外籍駕駛「右轉時」事故比例為日本本地駕駛的 2.4–2.7 倍；搭配台日上下排箭頭號誌與止まれ規則差異，問題真實且具迫切性（`research.md`、`problem.md`）。 |
| Evidence strength | adequate | 市場規模（JNTO）、高風險事故特徵（日本警察廳／國土交通省）、競品版圖（原生 App 割裂於純題庫與通用遊戲，缺免下載台灣專屬 PWA），以及技術成本與效能邊界（`terryds/google-street-view-driving-simulator`、`streets-gl`、`Noniv/abyssal-garden`、`J-o-h-n-M/afterglow-city`）均已取得客觀外部數據與查核依據。**誠實保留限制**：本產品自身的一手使用者行為轉換數據尚未取得，故明確定調為「2–3 週 Small Appetite 行為驗證實驗」，以 30 天實測數據作為 Phase 2 投資閘門。 |
| Value vs. inaction | adequate | 相較於現有被動看靜態街景／影片或下載高阻力通用外國駕駛 App，免下載 3–5 分鐘「動態日本差異號誌問答 ＋ 認知決策優先右駕微關卡」直擊 2.4–2.7 倍高風險右轉與撥桿反向陷阱，且零商業地圖 API 邊際成本，淨價值明顯優於不作為（`problem.md`、`concept.md`）。 |
| Feasibility / appetite | strong | 已透過 `/grill-me` 明確收斂為 `small` appetite（2–3 週精實 3D 切片），主動剔除「全球任意路線即時轉換」、「手寫零引擎 Raw WebGPU」與「MVP 前期雙平台 Native IAP／金流串接」三大工程黑洞，改採 Mobile Web / PWA ＋ 標準 Web 3D 引擎（WebGL2 預設），可行性高且範疇清晰（`concept.md`）。 |
| Strategic fit | adequate | 獨立團隊／個人免費輕量工具起手、零邊際圖資成本、採「Fake Door 付費意願測試 ＋ 旅伴分享解鎖 ＋ 高客單旅遊聯盟導購測試」的精實商業驗證架構，高度契合獨立開發資源約束與保留未來擴展之目標（註：專案技術憲章 `.specify/memory/constitution.md` 仍為預設範本，建議於 `/speckit-specify` 前先執行 `/speckit-constitution` 補齊工程紀律）。 |
| Risk posture | adequate | 原本致命的商業街景 API 爆費、Raw WebGPU 低階手機 20 FPS／相容缺口、Native App 下載摩擦與 Web 刷卡放棄率、以及 3D 範圍膨脹風險皆已被 Option A 設計明確緩解；剩餘可控風險（LINE/FB 內建瀏覽器 WebGL2 效能、冷啟動自然擴散率）已納入 30 天量化驗證指標與技術預檢範圍。 |

## Verdict & Rationale

本次裁決由 `2026-11-19` 的 `needs-clarification` 正式升級為 **`go`**。

先前阻塞的四大問題已於 `2026-11-24` 透過 `/grill-me` 策略對齊與外部客觀數據檢索全數解開：(1) 首發市場明確鎖定「台灣左駕 → 日本右駕」並由 JNTO（676 萬人次）與日本警察廳（外籍租車右轉事故率為日籍 2.4–2.7 倍）證實痛點真實性（Problem validity: `strong`）；(2) 放棄高風險的全球任意路線與手寫 Raw WebGPU，收斂為 2–3 週 `small` appetite 的 Mobile Web / PWA 認知訓練精實切片（Feasibility / appetite: `strong`）；(3) 商業與驗證策略定案為零金流 Fake Door ＋ 旅伴分享解鎖 ＋ 旅遊聯盟導購測試，並設定清晰的 30 天量化門檻（Strategic fit / Risk posture: `adequate`）。雖然仍缺乏本產品自身的一手行為數據，但在客觀外部證據已達 `adequate` 且投入上限嚴格鎖定於 2–3 週輕量網頁探針的前提下，進入 `/speckit-specify` 並儘速上線獲取真實行為數據（避免問卷 Mom Test 偏差）是最符合第一性原理的理性決策。

## If needs-clarification

N/A（先前於 `2026-11-19` 列出之 4 項阻塞問題皆已於 `2026-11-24` 釐清並補齊客觀證據與決策定案。）

## If go — Handoff to `/speckit-specify`

- **Problem**: 習慣左駕的台灣旅客在赴日本（沖繩、北海道等）自駕前，缺乏能在手機瀏覽器免下載、3–5 分鐘內針對日本高風險差異（右轉大彎 2.4–2.7 倍事故風險、橫排左綠右紅與上下兩排矢印式信号機、止まれ紅倒三角、右側方向燈／左側雨刷反向操作）進行主動式認知決策演練的輕量工具。
- **Chosen approach**: **Option A — 混合情境化日本實戰 × 認知決策優先 PWA 精實切片**（Mobile Web / PWA ＋ 標準 Web 3D 引擎 WebGL2 預設 ＋ 風格化低多邊形第一人稱右駕座艙 ＋ 半輔助轉向容錯操控）。
- **In scope / out of scope**:
  - **In scope (MVP, Small Appetite 2–3 週)**：
    1. **日本差異號誌動態問答模組**（8–10 題動態號誌變化題，涵蓋橫排左綠右紅、紅燈＋下排單／多向綠色箭頭、紅燈禁轉、止まれ紅倒三角；結束產出可分享至 LINE／社群之「赴日右駕存活／翻車診斷卡」）。
    2. **3D 第一人稱駕訓熱身場**（右駕座艙視角、左側車身距離參考、半輔助轉向容錯、強制右側方向燈操作／誤觸左側啟動雨刷乾刷回饋）。
    3. **1–2 個日本典型市區高風險實戰微關卡**（多車道右轉大彎＋矢印號誌＋對向直行車／斑馬線行人禮讓＋止まれ完全靜止判定）。
    4. **零金流驗證與增長機制**：北海道雪地／高速 ETC 進階主題包先以鎖定卡片執行 Fake Door 付費意願埋點 ＋ 「分享給同行旅伴解鎖」機制 ＋ 非侵入式日本自駕行前資源／租車聯盟導購點擊量測。
    5. **事件埋點與完課後 1 題信心自評**（用於 30 天驗證期檢核）。
  - **Out of scope (MVP 嚴格排除)**：
    - 匯入任意個人規劃導航路線或串接任何按量計費之商業街景／地圖 API。
    - 手寫無引擎 Raw WebGPU / WGSL Shader（不採 `Abyssal Garden` 技術實作）。
    - 上架 iOS / Android 原生 App Store、串接真實 Web 金流結帳。
    - 實作北海道雪地、高速 ETC 實戰場景與即時雙人連線副駕模式（留作 Phase 2 擴展）。
    - 全手動擬真賽車物理、倒車入庫／S 型彎道微操，以及實際行車中之即時導航功能。
- **Success metrics（上線 30 天行為驗證實驗門檻）**:
  - 首套體驗完課率 ≥ **50%**（單次體驗 3–5 分鐘）。
  - 重複練習者關鍵右駕決策錯誤率較初次下降 ≥ **40%**。
  - 進階地圖 Fake Door 點擊或旅伴分享解鎖率 ≥ **10%**。
  - 完課後自評信心提升比例 ≥ **75%**。
  - 單一訪客邊際基礎設施成本 **≤ NT$0.1**（零商業地圖 API 費用）。
- **Carried-forward open questions**:
  - [NEEDS CLARIFICATION: 實際於 LINE / Facebook / IG 行動內建瀏覽器中載入風格化 WebGL2 3D 場景的首屏時間與幀率底線（將於 `/speckit-plan` 技術驗證期實測確認）。]
  - [NEEDS CLARIFICATION: 上線 30 天實測後，依據 Fake Door 付費點擊率與旅遊聯盟連結點擊率，決策 Phase 2 優先投入「Native App / Web 付費解鎖進階地圖包」抑或「高客單租車／保險聯盟分潤＋旅伴雙人副駕模式」。]
  - **前置建議**：進入 `/speckit-specify` 前，建議先執行 `/speckit-constitution` 確立本專案之行動效能底線（如 WebGL2 預設相容、LINE/FB In-App Browser 必測）、零邊際 API 成本原則與可驗證埋點紀律。
