# Contract: Mobile Cockpit UI, Share Fallback & In-App Browser Surface

**Feature**: `001-japan-rhd-trainer`
**References**: [spec.md](../spec.md) (`FR-001`–`FR-013`, `Edge Cases`), [research.md](../research.md) (`R3`, `R4`, `R5`)

本契約規範使用者互動介面之公開 URL 參數、第一人稱座艙觸控佈局約束、四階分享降級行為及社群內建瀏覽器（LINE／Facebook／Instagram IAB）相容保證。

---

## 1. 公開 URL 與邀請連結契約（URL Routing & Query Contract）

應用程式為單頁靜態網站（無需伺服器端動態路由，所有狀態透過頂層視圖狀態或 Hash 管理，確保任何靜態主機重整不發生 `404`）：

| URL 模式 | 用途與解析行為 |
|----------|----------------|
| `/` | 標準入口：若 `disclaimerAcceptedAt === null` 顯示首頁與行前安全免責確認；已確認則可直接進入號誌問答或關卡選單。 |
| `/?ref=buddy` | 旅伴挑戰邀請入口：記錄匿名 `entryRef = 'buddy-share'`，首頁頂部顯示非侵入式歡迎橫幅（「你的旅伴邀請你一起測試赴日右駕存活率！」），其餘安全免責與練習流程與 `/` 一致。 |

- **安全規則**：解析 URL Query 時僅讀取白名單列舉值（`ref === 'buddy'`），嚴禁將任意 URL 參數直接插入畫面文字或診斷卡以防範反射型腳本注入（XSS）。

---

## 2. 第一人稱右駕座艙觸控與視覺契約（Cockpit HUD Contract）

在所有立體駕駛關卡（`warmup-range`、`urban-drill-1`、`urban-drill-2`）及簡化 2D 降級視圖中，畫面必須同時滿足以下版面與回饋不變量（Invariants）：

1. **視窗高度與安全區**：根容器高度綁定 `--app-height`（由 `window.visualViewport` / `window.innerHeight` 即時同步），底部控制列預留 `max(12px, env(safe-area-inset-bottom))`，確保不被 LINE／FB IAB 底部工具列裁切。
2. **固定空間參照**：畫面下半部呈現右側駕駛座方向盤與左前引擎蓋邊界標記（Left-Hood Spatial Guide），搭配道路左側引導線（`FR-005`）。
3. **左右撥桿反向對稱佈局（`FR-006`）**：
   - **左側觸控區（雨刷撥桿陷阱）**：點擊或撥動時，前擋風玻璃立即執行雨刷來回乾刷動畫＋頂部警示橫幅「按到雨刷了！日本右駕方向燈在右邊」＋合成摩擦音效（若音訊已解鎖），同時向領域層送出 `lever: 'left'`。
   - **右側觸控區（方向燈撥桿）**：支援切換「左方向燈／右方向燈／關閉」，觸發時儀表方向燈圖示同步閃爍＋頂部狀態提示＋滴答音效，向領域層送出 `lever: 'right'`。
4. **半輔助行駛與決策控制（`FR-007`）**：
   - 提供直覺的「加速前進／按住煞停（完全靜止計時顯示）」與路口接近時清晰的「轉入左側順向車道 vs 右側車道」轉向選擇控制；最小觸控目標尺寸不得小於 `48px × 48px`。
5. **全域防誤觸與背景暫停（`FR-010`）**：
   - 練習中容器強制 `touch-action: none; overscroll-behavior: none; user-select: none;`。
   - 當觸發 `document.hidden === true`、`window.blur` 或直橫向旋轉時，狀態立即轉為 `Paused` 並顯示「練習已暫停 — 點擊繼續」遮罩。

---

## 3. 診斷卡與旅伴解鎖四階分享降級契約（Share Fallback Contract）

無論在「診斷卡分享（`FR-004`）」或「分享給同行旅伴免費解鎖市區第 2 關（`FR-009`、`FR-012`）」，分享元件必須同時提供明確不卡關的路徑：

1. **主要按鈕 A —「傳送到 LINE 群組挑戰旅伴」**：開啟 `https://line.me/R/share?text=${encodeURIComponent(shareTextWithBuddyUrl)}`；觸發後即視為完成分享動作。
2. **主要按鈕 B —「系統分享／複製挑戰連結」**：
   - 若 `typeof navigator.share === 'function'`，呼叫 `navigator.share({ title, text, url })`；
   - 若拋出 `AbortError`（使用者主動關閉面板），保留原畫面且**不授予**旅伴解鎖；
   - 若 `navigator.share` 不存在或拋出其他例外（如 LINE/FB IAB `NotAllowedError`），自動無縫執行 `navigator.clipboard.writeText(shareTextWithBuddyUrl)`（含隱藏文字框備援），顯示「挑戰文案與連結已複製！快貼到旅遊群組吧」並授予旅伴解鎖資格。
3. **視覺卡片保存**：診斷卡以本地 Canvas 2D 產生之 `<img src="data:image/png;base64,...">` 呈現於結算畫面，附註「可長按圖片儲存診斷卡」，繞過 IAB 封鎖 `<a download>` 的限制。

---

## 4. Fake Door 預告卡與合作資源揭露契約（Validation & Disclosure Contract）

1. **Fake Door 進階預告卡（`FR-012`）**：
   - 卡片清楚標示主題名稱（「北海道冬季雪地與縱排號誌實戰包」、「日本高速公路匝道匯入與 ETC 包」）與預計單次解鎖參考資訊。
   - 點擊後立即開啟輕量說明對話框，顯示：「感謝回饋！此進階主題包目前正在統計需求與籌備中，**本次不會收取任何費用**。你可以先透過分享給同行旅伴免費解鎖『市區實戰第 2 關』！」並發送 `fake_door_clicked` 事件。
2. **外部旅遊資源揭露（`FR-013`）**：
   - 僅置於結算頁下方非干擾區塊，標題旁必須固定顯示顯眼的「合作推薦／外部資源」標籤，所有連結必須帶 `target="_blank" rel="noopener noreferrer"`，嚴禁在問答或駕駛中途彈出遮擋。
