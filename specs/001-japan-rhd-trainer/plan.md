# Implementation Plan: 台灣赴日自駕右駕認知與號誌演練工具 (Japan Right-Hand-Drive Pre-Trip Cognitive Trainer)

**Branch**: `001-japan-rhd-trainer` | **Date**: 2026-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-japan-rhd-trainer/spec.md`

## Summary

針對台灣左駕旅客前往日本租車自駕前的高風險認知痛點（外籍駕駛右轉事故率達本地駕駛 2.4–2.7 倍、台日橫排／上下兩排箭頭號誌混淆、紅倒三角「止まれ」完全靜止、右側方向燈與左側雨刷反向干擾），建置一款零安裝、3 秒內可啟動首屏的行動網頁／PWA 輕量演練工具。技術上採用 **TypeScript + Vite + Preact** 渲染極輕量首屏與 SVG 動態號誌問答（`< 50 KB` gzipped），並在背景延遲載入具名匯入（Tree-shaken）之 **Three.js WebGL2 風格化低多邊形第一人稱座艙模組**（含 WebGL1／簡化 2D 降級保護），搭配與 UI／3D 完全解耦之純確定性日本交通規則狀態機、本地 Canvas 2D 診斷卡生成、LINE／Facebook 內建瀏覽器四階分享與視窗防誤觸封裝，以及零個人識別資訊（Zero-PII）之匿名驗證埋點。

## Technical Context

**Language/Version**: TypeScript 5.x (ES2022 target), Node.js 24.x build toolchain
**Primary Dependencies**: Vite 6.x, Preact 10.x (~4 KB UI runtime), Three.js (named ESM imports, WebGL2 default), `vite-plugin-pwa` (Workbox static precache)
**Storage**: Browser `localStorage` wrapped in `SafeStorage` with automatic in-memory `Map` fallback for private/incognito WebViews; zero server database required for core app
**Testing**: Vitest 3.x (100% deterministic unit tests for `src/domain/` traffic-rule state machines & telemetry privacy filter) + Playwright (mobile viewport & simulated LINE/FB In-App Browser e2e smoke flows)
**Target Platform**: Mobile Safari (iOS), Mobile Chrome (Android), and LINE / Facebook / Instagram In-App Browsers (`WKWebView` & Android `WebView`), static edge hosting (Cloudflare Pages / GitHub Pages)
**Project Type**: Mobile-first client-side Web Application / PWA (zero custom backend server)
**Performance Goals**: Initial interactive quiz screen `< 3s` on standard 4G (`< 60 KB` gzipped entry bundle); 3D driving drills targeting `60 FPS` on mainstream smartphones (`< 60` draw calls, `< 25k` triangles, `pixelRatio <= 2`, lazy-loaded 3D chunk)
**Constraints**: Zero commercial mapping/routing/Street View API calls (`NT$0` variable map cost; per-visitor infra cost `<= NT$0.1`); no hand-rolled engine-less Raw WebGPU shaders; strict touch gesture lock (`overscroll-behavior: none`, `touch-action: none`, `--app-height` sync); full visual parity when device hardware mute switch is on; zero PII in telemetry
**Scale/Scope**: 2–3 week Small Appetite behavioral validation MVP — 4 core views (Landing/Disclaimer, 8–10 Dynamic Signal Quiz + Diagnostic Card, 3D Cockpit Drill View covering 1 Warmup Range + 2 Urban Drills, Hub/Summary with 2 Fake Door Preview Cards & Disclosed Travel Resources)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Gate Evaluation

| Constitution Principle / Constraint | Status | Enforcement in Plan |
|-------------------------------------|--------|---------------------|
| **I. Cognitive Transfer Over Visual Vanity** | PASS | 採用半輔助轉向容錯（不實作倒車入庫／S 型彎道自由物理），禁止無引擎手寫 Raw WebGPU，聚焦靠左參照、右方向燈／左雨刷陷阱、上下排矢印號誌、`止まれ` 停讓與多車道右轉禮讓。 |
| **II. Mobile Web / PWA First & Universal Compatibility** | PASS | 採免安裝靜態 Web/PWA，P1 問答以純 SVG/CSS 秒開（`< 3s`），3D 關卡以 Three.js WebGL2 延遲載入並內建 `webglcontextlost` 與簡化 2D 降級視圖，明確涵蓋 LINE/FB/IG 內建瀏覽器相容處理。 |
| **III. Zero Commercial Map API Marginal Cost** | PASS | 零第三方地圖或街景 API 依賴；所有問答與 3 個駕駛關卡皆為內建參數化模組，部署於免費／極低成本靜態邊緣 CDN（邊際成本 `<= NT$0.1`）。 |
| **IV. Behavioral Validation & Measurable Instrumentation** | PASS | 內建無 PII 匿名 `TelemetryClient`，完整對齊 `SC-001`–`SC-005` 之 30 天 Go/No-Go 計算事件；不串接正式金流，北海道與高速 ETC 嚴格維持 Fake Door 預告卡。 |
| **V. Traffic-Rule Correctness & Test-First Verification** | PASS | 所有日本交通規則判定與評分獨立於 `src/domain/` 純 TypeScript 模組，強制由 Vitest 單元測試 100% 驗證，且首屏強制顯示行前安全教育免責聲明。 |
| **Technical & Scope Constraints** | PASS | 嚴守 8–10 題問答＋1 熱身場＋2 市區微關卡（第 2 關分享解鎖）＋2 張預告卡＋合作資源揭露標籤，無範疇膨脹。 |

### Post-Phase 1 Re-Evaluation

經檢視 Phase 0（[research.md](./research.md)）與 Phase 1（[data-model.md](./data-model.md)、[contracts/telemetry-events.md](./contracts/telemetry-events.md)、[contracts/ui-share-and-iab.md](./contracts/ui-share-and-iab.md)、[quickstart.md](./quickstart.md)）所有設計產出：
- **PASS（無任何違規項）**：領域層完全零 DOM／零 Three.js 耦合；IAB 之 `navigator.share` 失效問題已由「LINE URL Scheme + Web Share + 剪貼簿複製 + Canvas PNG 長按儲存」四階降級契約解決；`100dvh` 高度跳動已由 `--app-height` 契約解決；匿名埋點已訂立嚴格白名單過濾契約。

## Project Structure

### Documentation (this feature)

```text
specs/001-japan-rhd-trainer/
├── spec.md              # 功能規格說明 (/speckit-specify 產出)
├── plan.md              # 本實作藍圖 (/speckit-plan 產出)
├── research.md          # Phase 0 技術與內建瀏覽器相容研究 (/speckit-plan 產出)
├── data-model.md        # Phase 1 領域實體與日本交通規則狀態機 (/speckit-plan 產出)
├── quickstart.md        # Phase 1 建置、測試與實機驗收指南 (/speckit-plan 產出)
├── contracts/           # Phase 1 介面與埋點契約 (/speckit-plan 產出)
│   ├── telemetry-events.md
│   └── ui-share-and-iab.md
├── checklists/          # 規格品質檢核表
│   └── requirements.md
└── tasks.md             # Phase 2 任務拆解清單 (將由 /speckit-tasks 產出)
```

### Source Code (repository root)

```text
index.html
package.json
tsconfig.json
vite.config.ts
vitest.config.ts
playwright.config.ts
public/
├── icons/                         # PWA 圖示與 manifest 靜態資源
└── og-preview.png                 # 貼入 LINE / FB 聊天室時顯示之連結預覽圖

src/
├── main.tsx                       # 首屏輕量入口（掛載 Preact、同步 --app-height、解析 ?ref=buddy）
├── styles/
│   └── global.css                 # 行動端安全區、IAB touch-action/overscroll 鎖定與高對比主題樣式
├── content/                       # 靜態模組化題庫與關卡參數（零商業地圖 API）
│   ├── signal-questions.ts        # 8–10 題台日差異動態號誌題庫定義
│   ├── drill-scenarios.ts         # 駕訓熱身場 + 市區實戰第 1、2 關節點與時序設定
│   └── preview-packs.ts           # 北海道雪地、高速 ETC 預告卡與合作揭露外部資源清單
├── domain/                        # 純確定性日本交通規則與計分邏輯（零 DOM / 零 Three.js 依賴）
│   ├── types.ts                   # 核心實體與狀態機型別定義
│   ├── signal-evaluator.ts        # 橫排綠左紅右、上下排矢印式信号機與純紅燈禁轉判定
│   ├── stop-sign-evaluator.ts     # 「止まれ」停止線前車速 <=0.2 km/h 滿 1000ms 狀態機
│   ├── intersection-evaluator.ts  # 多車道右轉對向車／行人禮讓與左側目標車道 vs 逆向判定
│   ├── lever-evaluator.ts         # 右側方向燈 vs 左側雨刷誤觸判定
│   ├── diagnostic-scorer.ts       # 存活評級 (S–C)、易錯盲點摘要與重複挑戰錯誤下降率計算
│   └── unlock-manager.ts          # 旅伴分享解鎖與 Fake Door 點擊狀態轉換
├── platform/                      # 行動瀏覽器與 LINE/FB In-App Browser 相容封裝層
│   ├── iab-detect.ts              # 偵測 LINE / FB / IG IAB 環境旗標（不外傳原始 UA）
│   ├── viewport-guard.ts          # visualViewport --app-height 同步、手勢攔截與背景自動暫停
│   ├── safe-storage.ts            # localStorage 安全讀寫與無痕模式記憶體自動降級
│   ├── audio-synth.ts             # Web Audio API 首次觸控解鎖與方向燈／雨刷／警示合成音
│   ├── share-client.ts            # 四階分享降級（LINE URL -> Web Share -> Clipboard）
│   └── diagnostic-canvas.ts       # 原生 Canvas 2D 繪製個人化診斷卡 PNG Data URL
├── telemetry/                     # 零個資匿名行為驗證埋點模組
│   └── telemetry-client.ts        # 白名單欄位過濾器 + sendBeacon / fetch keepalive 發送器
├── ui/                            # 輕量首屏與互動介面元件（首屏載入，不含 Three.js）
│   ├── App.tsx                    # 頂層流程狀態切換與背景預載 3D 分塊觸發器
│   ├── DisclaimerModal.tsx        # 行前安全教育免責聲明確認視圖
│   ├── SignalQuizView.tsx         # SVG 動態日本號誌渲染器與 8–10 題即時解析視圖
│   ├── DiagnosticCardView.tsx     # 診斷卡展示、長按存圖與群組挑戰分享區
│   ├── ScenarioHubView.tsx        # 關卡選單、Fake Door 預告卡與旅伴解鎖入口
│   ├── DrillContainerView.tsx     # 動態 import() 載入 scene3d 或切換簡化 2D 降級視圖、暫停遮罩
│   ├── CockpitHud.tsx             # 左右撥桿按鈕、雨刷乾刷視覺覆蓋層、無音訊高對比警示橫幅
│   └── DrillSummaryView.tsx       # 失誤細項、首次 vs 重複進步對照、1 題信心自評與合作揭露資源區
└── scene3d/                       # 延遲載入之 Three.js WebGL2 第一人稱右駕模組（獨立打包分塊）
    ├── DrillEngine.ts             # WebGL2 初始化、pixelRatio<=2、contextlost 處理與固定時間步迴圈
    ├── RightSeatCockpit.ts        # 第一人稱右駕座艙、左前車頭空間參考線與 3D 雨刷擺動呈現
    ├── RoadBuilder.ts             # 參數化低多邊形道路、標線、止まれ標誌與上下排號誌燈 InstancedMesh
    ├── TrafficActors.ts           # 對向直行車與斑馬線行人排程移動模組
    └── Fallback2DView.tsx         # WebGL 不可用或極低幀率時之無縫高對比簡化決策視圖

tests/
├── unit/                          # Vitest 單元測試（強制 100% 驗證規則正確性與零個資白名單）
│   ├── signal-evaluator.test.ts
│   ├── stop-sign-evaluator.test.ts
│   ├── intersection-evaluator.test.ts
│   ├── diagnostic-scorer.test.ts
│   ├── lever-evaluator.test.ts
│   ├── unlock-and-storage.test.ts
│   └── telemetry-privacy.test.ts
└── e2e/                           # Playwright 行動端與模擬 IAB 關鍵旅程測試
    ├── quiz-and-diagnostic.spec.ts
    └── drill-and-unlock.spec.ts
```

**Structure Decision**: 採用單一前端靜態專案架構（Single Mobile-First Web/PWA Project），明確劃分 `src/domain/`（純交通規則核心）、`src/platform/`（LINE/FB 內建瀏覽器與裝置相容層）、`src/ui/`（`< 50 KB` 秒開首屏與號誌問答層）與 `src/scene3d/`（延遲載入之 Three.js WebGL2 駕駛場景層），不引入多餘的後端服務目錄，完全符合憲章之極簡與零邊際成本要求。

## Complexity Tracking

> 本實作計畫完全通過 `Constitution Check` 所有原則與範疇限制，**無任何憲章違規項目需要豁免說明**。
