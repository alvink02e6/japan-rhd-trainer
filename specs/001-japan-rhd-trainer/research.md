# Technical Research: 台灣赴日自駕右駕認知與號誌演練工具 (`001-japan-rhd-trainer`)

**Date**: 2026-11-27
**Feature**: [spec.md](./spec.md)
**Constitution Reference**: `.specify/memory/constitution.md` (v1.0.0)

本文件彙整 Phase 0 技術研究與架構決策，解決行動端首屏 3 秒啟動（`SC-001`）、LINE／Facebook／Instagram 內建瀏覽器相容性（`FR-001`、`FR-010`、`SC-006`）、WebGL2 低多邊形 60 FPS 渲染（憲章原則 II）、以及零個人識別資訊埋點與零商業地圖成本（`FR-015`、`SC-007`）之所有技術細節。

---

## R1. 前端建置工具與輕量 UI 執行期

- **Decision**: 採用 **TypeScript 5.x + Vite 6.x + Preact 10.x + `vite-plugin-pwa`**，搭配路由／畫面階段分塊載入（Code Splitting）。
- **Rationale**:
  - 憲章原則 II 與 `SC-001` 要求在一般 4G 行動網路下 **3 秒內進入首屏並可作答第一題動態號誌問答**。
  - Preact 核心僅約 **~4 KB gzipped**，卻能提供元件化狀態管理來處理免責聲明彈窗、8–10 題動態號誌切換、關卡 HUD、結算頁與 Fake Door 預告卡，讓首屏核心套件（含首套題庫與 SVG 號誌渲染）壓縮後控制在 **< 50 KB gzipped**。
  - `vite-plugin-pwa` 透過靜態資源預快取（Workbox generateSW），讓使用者在機場候機室或弱網環境再次開啟練習時具備秒開與離線重玩能力。
- **Alternatives considered**:
  - **React 19**：執行期約 ~45 KB gzipped，對僅有 4 個主要視圖的輕量工具而言首屏負擔偏重。
  - **純手寫 Vanilla DOM**：雖零框架體積，但在管理多步驟問答狀態、失誤統計對照表與彈窗焦點切換時容易產生狀態不同步錯誤。

---

## R2. 3D 渲染引擎、分塊載入與風格化低多邊形策略

- **Decision**: 採用 **Three.js（具名匯入 Tree-shaking，強制預設 `WebGL2` 搭配 `WebGL1` / 2D 降級保護）**，且將 3D 模組獨立為**延遲載入分塊（Lazy Chunk）**；場景幾採程式碼組合之風格化低多邊形（Procedural / Parametric Low-Poly Meshes），零外部大型 `.glb` 或高解析貼圖依賴。
- **Rationale**:
  - **首屏解耦**：P1「台日差異動態號誌問答」完全以輕量 **SVG + CSS 動畫** 呈現燈號與箭頭變化，首屏完全不載入 Three.js；當使用者閱讀免責聲明與作答第 1–3 題時，背景預先下載（Idle Preload）3D 駕駛模組分塊，兼顧 `<3s` 首屏與零等待進入 P2 熱身場。
  - **行動端 60 FPS 預算控制**：
    1. 僅使用具名匯入（`import { WebGLRenderer, Scene, PerspectiveCamera, InstancedMesh, ... } from 'three'`）並搭配 `MeshLambertMaterial` / `MeshBasicMaterial` 頂點著色，禁用即時陰影（Real-time Shadows）與高耗能後處理（Bloom/SSAO）。
    2. 透過 `InstancedMesh` 繪製道路標線、護欄與街廓建築塊體，確保單幀 Draw Calls **< 60**、總三角面數 **< 25,000**。
    3. 強制限制像素比 `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`，避免高階手機 3x/4x Retina 螢幕造成 4 倍片段著色器負載。
  - **符合憲章原則 I & II**：明確排除手寫零引擎 Raw WebGPU / WGSL（避免中低階手機 20 FPS 與舊版 iOS/Android 不支援風險）。
- **Alternatives considered**:
  - **Babylon.js**：功能完整但核心套件體積明顯大於具名匯入之 Three.js，不利於行動社群連結快速載入。
  - **Raw WebGPU（`Abyssal Garden` 模式）**：已於評估階段實證中低階手機效能不佳、舊系統無支援且難以維護交通規則碰撞邏輯，依憲章原則 I 明令禁止。

---

## R3. LINE / Facebook / Instagram 內建瀏覽器（In-App Browser）相容與防誤觸設計

- **Decision**: 實作三層 **In-App Browser (IAB) 防護機制**：(1) JavaScript 動態視窗高度同步 `--app-height`、(2) 練習期間全域手勢鎖定 CSS 與事件攔截、(3) `webglcontextlost` / 低效能自動降級保護。
- **Rationale**:
  - **視窗高度跳動（`100dvh` 缺陷）**：LINE 與 Facebook 內建瀏覽器（iOS `WKWebView` 與 Android `WebView`）的頂部標題列與底部工具列在滑動時會動態伸縮，舊版 Android WebView 對 `100dvh` 解析不穩，iOS `WKWebView` 亦可能將底部按鈕遮擋於工具列後。透過監聽 `window.visualViewport?. resize` 與 `window.innerHeight` 即時寫入 `--app-height` CSS 變數，並預留 `env(safe-area-inset-bottom)`，可確保左右撥桿按鈕永遠完整可見（`Edge Case #3`）。
  - **防下拉重整與縮放（`FR-010`、`Edge Case #1`）**：於主動練習容器套用 `overscroll-behavior: none; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;`，並在撥桿／煞車觸控區攔截多點縮放預設行為；同時監聽 `document.visibilitychange` 與 `window.blur`，切換視窗或接聽電話時自動暫停關卡狀態機與車流計時（`Edge Case #5`）。
  - **WebGL Context 遺失與降級（`Edge Case #4`）**：iOS `WKWebView` 在記憶體吃緊時可能觸發 `webglcontextlost`。必須註冊 `canvas.addEventListener('webglcontextlost', e => e.preventDefault())` 與自動重建機制；若裝置完全無法建立 WebGL2/WebGL1 Context 或連續 2 秒幀率低於 15 FPS，自動切換為**高對比 2D 俯視／第一人稱簡化決策視圖**，確保使用者絕不遇到白畫面死機且能 100% 完課（`SC-006`）。
- **Alternatives considered**:
  - **強制彈窗要求使用者「以外部 Safari/Chrome 開啟」**：每多一次跳轉將流失大量社群點擊訪客，違背零摩擦體驗目標；僅在偵測到嚴重 WebGL 異常時作為輔助提示，不作為強制阻擋。

---

## R4. 「赴日右駕存活／翻車診斷卡」生成與多層級分享降級架構

- **Decision**: 使用原生 **HTML5 Canvas 2D API** 本地即時繪製個人化診斷卡圖片（輸出 `PNG Data URL / Blob`），並實作**四階分享降級鏈（LINE Deep Share URL → Web Share API → 剪貼簿複製挑戰文案 → 長按圖片儲存）**。
- **Rationale**:
  - **IAB 內 `navigator.share` 失效問題**：實測顯示 LINE 與 Facebook 的 iOS `WKWebView` 及 Android `WebView` 常未實作或封鎖 `navigator.share`（回傳 `undefined` 或拋出 `NotAllowedError`），且許多 IAB 會阻擋 `<a download>` 屬性下載檔案。
  - **四階無縫方案**：
    1. **「一鍵傳送到 LINE 群組」專屬按鈕**：使用官方 `https://line.me/R/share?text=...` URL Scheme 帶入個人分數、最高頻失誤（例如：「我在日本右駕模擬器誤刷了 3 次雨刷！」）與挑戰連結，在 LINE IAB 與外部瀏覽器皆可穩定喚起好友／群組選擇器。
    2. **系統原生分享按鈕**：當 `typeof navigator.share === 'function'` 時呼叫 `navigator.share({ title, text, url })`，並妥善捕捉 `AbortError`（使用者取消不視為失敗）與 `NotAllowedError`（自動轉入第 3 階）。
    3. **一鍵複製挑戰連結與文案**：呼叫 `navigator.clipboard.writeText(...)`（附隱藏 `<textarea>` `execCommand('copy')` 相容備援）並顯示「已複製！可直接貼上群組挑戰旅伴」提示。
    4. **長按儲存診斷卡圖片**：將 Canvas 產生的 PNG 直接渲染為畫面上的 `<img>` 元素，支援 iOS/Android 內建瀏覽器原生「長按圖片 → 儲存至相簿」。
  - **零伺服器圖片渲染成本**：全數於使用者手機瀏覽器本地合成，伺服器成本為 `0`（符合 `SC-007`）。
- **Alternatives considered**:
  - **`html2canvas` 第三方套件**：體積約 ~40 KB gzipped 且在 iOS WebKit 常有字型偏移與 SVG 渲染空白問題；直接使用原生 Canvas 2D API 繪製固定版面卡片僅需 ~150 行程式碼、零外部依賴且像素級精準。

---

## R5. 行動端音訊解鎖與完全靜音對等回饋（Silent-Mode Parity）

- **Decision**: 使用原生 **Web Audio API 程序化合成輕量音效**（方向燈滴答聲、雨刷乾刷摩擦聲、違規警示音、過關提示音），於使用者點擊「確認免責聲明並開始」首次觸控事件中解鎖 `AudioContext`，並強制所有聲音事件綁定高對比視覺動畫橫幅。
- **Rationale**:
  - 零外部 `.mp3/.wav` 音檔下載請求，減少網路延遲並避免行動瀏覽器 `<audio>` 標籤預載入限制。
  - iOS 實體靜音鍵開啟時，即使 `AudioContext` 為 `running` 也不會發出聲音（且網頁無法偵測硬體靜音鍵狀態）。因此依 `FR-011`，每次觸發雨刷乾刷、方向燈或逆向警示時，座艙前擋風玻璃必須同步播放明確的雨刷擺動動畫、儀表方向燈閃爍與頂部高對比警示橫幅，確保靜音下 100% 等效傳達。
- **Alternatives considered**:
  - **Howler.js + 外部音效檔**：增加額外套件體積與 HTTP 請求，對僅需 4 種短促提示音的工具屬過度設計。

---

## R6. 零個資匿名行為埋點與本機安全儲存（SafeStorage）

- **Decision**:
  1. **本機儲存**：封裝 `SafeStorage` 介面，優先讀寫 `window.localStorage`（命名空間 `jrhd_v1_*`），並以 `try/catch` 自動降級至記憶體 `Map`（處理無痕模式或儲存空間受限之 `Edge Case #5`）。
  2. **匿名遙測（Telemetry）**：實作無狀態 `TelemetryClient`，嚴格透過白名單 Schema 過濾欄位（僅允許匿名隨機工作階段 ID、事件名稱、關卡 ID、數值計數與布林狀態，禁止收集 IP、姓名、Email、GPS 或完整 User-Agent 指紋），透過 `navigator.sendBeacon`（備援 `fetch(..., { keepalive: true })`）非同步送往可透過環境變數設定之靜態友善匿名收集端點（預設相容 Cloudflare Workers 免費層 / PostHog 匿名事件匯入；未設定端點時自動降級為本地彙總與開發除錯日誌，絕不阻塞 UI）。
- **Rationale**:
  - 完全符合憲章原則 III（每訪客邊際成本 `≤ NT$0.1`；Cloudflare Pages + Workers 免費額度每日可承受 10 萬次請求，初期成本為 `$0`）與憲章原則 IV、`FR-015`（零註冊、零 PII、完整支援上線 30 天四大 Go/No-Go 指標計算）。
- **Alternatives considered**:
  - **自建後端伺服器＋關聯式資料庫（PostgreSQL/Express）**：需負擔固定月費與維運成本，違反憲章靜態邊緣託管與 `≤ NT$0.1` 原則。
  - **Google Analytics 4 (GA4) 預設腳本**：腳本體積較大、易被行動端追蹤阻擋器攔截，且預設收集較多裝置識別資訊；自訂輕量 Beacon 結構更乾淨可控。

---

## R7. 測試與品質驗證架構（對齊憲章原則 V）

- **Decision**: 採用 **Vitest 3.x** 執行純領域交通規則邏輯單元測試（目標覆蓋率 100% 分支決策），搭配 **Playwright** 進行行動端 Viewport 與模擬 LINE/FB In-App Browser User-Agent 之端對端關鍵路徑（P1–P4）自動化驗證。
- **Rationale**:
  - 憲章原則 V 強制規定所有日本交通規則狀態機（上下排箭頭號誌、純紅燈禁轉、`止まれ` 完全靜止滿 1 秒、多車道右轉禮讓與左側目標車道判定、左右撥桿映射）必須獨立於 3D 渲染與 UI 之外，以確定性純函式／狀態機實作並通過 100% 單元測試。
  - Vitest 與 Vite 共用設定，毫秒級執行純 TypeScript 測試；Playwright 則可在無頭瀏覽器中驗證觸控手勢鎖定、免責聲明、診斷卡生成與旅伴分享解鎖流程。
- **Alternatives considered**:
  - **Jest**：在原生 ESM + Vite TypeScript 專案中需額外轉譯設定，速度與整合度不如 Vitest。
