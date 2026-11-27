# Concept: 台灣→日本自駕情境化右駕認知訓練 PWA (Taiwan-to-Japan RHD Cognitive Trainer PWA)

- **Slug**: my-idea
- **Created**: 2026-11-18（Updated: 2026-11-24 via `/grill-me` 定案）
- **Recommended option**: Option A — 混合情境化日本實戰 × 認知決策優先 PWA 精實切片 (Hybrid Japan Scenario & Cognitive-First PWA Slice)

## Options

### Option A — 混合情境化日本實戰 × 認知決策優先 PWA 精實切片 (Hybrid Japan Scenario & Cognitive-First PWA Slice)
- **Sketch**: 針對台灣左駕旅客赴日自駕，推出免下載、點擊連結 3 秒即可啟動的 **Mobile Web / PWA** 輕量工具，採風格化低多邊形第一人稱右駕座艙（借鏡 *Left! Left! LEFT!* 清晰視覺）與成熟 Web 3D 引擎（預設廣泛相容之 WebGL2，不手寫底層 Raw WebGPU）。MVP 採 3 段式精實體驗：(1) **日本差異號誌動態問答**（8–10 題涵蓋橫排左綠右紅、上下兩排矢印式信号機變化、紅燈嚴禁轉彎與止まれ紅倒三角，完成後產出可貼至同行 LINE 群組的「赴日右駕存活／翻車診斷卡」）；(2) **3D 駕訓熱身場**（採認知決策優先的半輔助轉向容錯，專注建立靠左車道距離感與「右側方向燈／左側誤刷雨刷」反向反射）；(3) **1–2 個日本典型市區高風險實戰微關卡**（直擊日本統計 2.4–2.7 倍高風險的多車道右轉大彎＋矢印號誌＋止まれ與行人禮讓）。其餘高話題情境（如北海道雪地縱排號誌、高速公路 ETC／匝道匯入）於 MVP 先以鎖定卡片進行 **Fake Door 付費意願測試 ＋ 分享給同行旅伴免費解鎖**，並搭配高相關日本租車／旅平險資訊進行聯盟導購測試，零商業地圖 API 成本、零前期金流串接負擔。
- **Appetite**: small（2–3 週精實 3D 驗證切片，作為上線 30 天行為驗證實驗）
- **Trade-offs**:
  - **優勢（Wins）**：徹底消除商業街景計費風險（邊際成本 ≤ NT$0.1/訪客）、避開手寫 Raw WebGPU 低階手機 20 FPS 與相容性陷阱、移除原生 App 下載阻力與蘋果審核固定成本；精準對齊台灣赴日 676 萬人次市場與 2.4–2.7 倍右轉高風險痛點，並內建「旅伴分享診斷卡」解決低頻工具的零成本冷啟動問題。
  - **犧牲（Sacrifices）**：MVP 不支援匯入使用者個人任意導航路線，亦不提供全手動自由擬真物理方向盤操控；Web 端暫不直接收取真錢，付費意願初期以 Fake Door 點擊行為代理量測。
- **Rabbit holes**:
  - 試圖在 MVP 階段就把沖繩、北海道雪地、首都高交流道與雙人即時連線副駕模式全部做完，導致 2–3 週預算爆表。
  - 陷入追求真實物理引擎手感或寫實城市建築貼圖，分散了「靠左定位、撥桿反轉、號誌判讀、右轉大彎」四大認知反射的打磨品質。
  - 忽略 LINE / Facebook 行動內建瀏覽器的 WebGL2 效能、觸控手勢攔截與靜音自動播放限制。

### Option B — 原生 App 優先 ＋ 完整雙平台 IAP 駕駛模擬器 (Native App + Full IAP Driving Simulator)
- **Sketch**: 使用跨平台原生遊戲引擎（Unity / Godot 4）開發 iOS 與 Android 原生 App，提供完整自由物理方向盤操控之駕訓場科目、日本差異號誌問答，以及透過 Apple / Google 一鍵內購（IAP）解鎖沖繩、北海道、高速交流道等完整虛擬城市地圖。
- **Appetite**: medium 至 large（1–3 個月以上，含雙平台上架、審核與 IAP 整合）
- **Trade-offs**:
  - **優勢（Wins）**：原生 3D 幀率最穩、支援離線遊玩，且 Apple Pay / Google Play 一鍵 IAP 結帳轉換摩擦最低。
  - **犧牲（Sacrifices）**：對一年僅自駕 1–2 次的極低頻旅遊場景而言，要求旅客下載 50–200 MB 原生 App 的獲客阻力極高；獨立團隊須承擔開發者年費、App Store Guideline 4.2 退件風險與 15%–30% 平台抽成，且在尚未驗證「旅客是否真願為虛擬地圖付費」前即背負過高沈沒成本。
- **Rabbit holes**:
  - 在沒有自然流量與驗證數據前即耗費數週處理雙平台憑證、隱私合規、IAP 驗證與多機型打包除錯。

### Option C — 任意真實路線匯入模擬 ／ 純 Raw WebGPU 程序化路線 (Arbitrary Real-Route Import or Raw WebGPU Procedural)
- **Sketch**: 保留最初構想「輸入任意日本起訖點即產生該真實路線第一人稱駕駛模擬」（透過商業街景 API 或 OpenStreetMap 向量即時建模），或仿效 `Noniv/abyssal-garden` 以無引擎手寫 Raw WebGPU / WGSL Shader 程序化繪製整座城市街道與高速公路。
- **Appetite**: large（數月以上，且具高度不可控技術與財務風險）
- **Trade-offs**:
  - **優勢（Wins）**：若成功達成，個人化真實路線差異化或單檔極致輕量體積最具技術話題性。
  - **犧牲（Sacrifices）**：商業街景已被 `terryds/google-street-view-driving-simulator` 證實單位成本過高而無法維持公開服務；OSM 全城即時 3D 在行動端效能受限且鄉郊車道標籤缺失；Raw WebGPU（如 `Abyssal Garden`）實測低階手機僅 ~20 FPS 且難以維護複雜交通號誌狀態機與碰撞邏輯，對獨立團隊屬於高風險工程陷阱。
- **Rabbit holes**:
  - 耗費數月修補開放圖資缺失車道與高架拓樸，或手寫底層圖形引擎與處理各品牌手機 GPU 驅動崩潰。

## Recommendation

正式採用 **Option A — 混合情境化日本實戰 × 認知決策優先 PWA 精實切片**（於 `2026-11-24` `/grill-me` 訪談定案）。

理由如下：
1. **精準擊中經官方數據證實的最高風險痛點**：直接鎖定台灣赴日 676 萬人次剛需市場，將訓練核心對準外籍駕駛高出 2.4–2.7 倍的「右轉大彎事故」、台日「上下排箭頭號誌／橫排反序」與「左側誤撥雨刷」三大真實痛點。
2. **將獨立團隊的風險與成本壓至最低**：以 2–3 週 `small` appetite、零商業地圖 API 費用、零前期金流與上架開銷，把 MVP 本身打造成極低摩擦的行動網頁行為驗證探針。
3. **保留清晰的 Phase 2 擴張階梯**：若 30 天實測達標，後續可依數據證據平滑演進至 (a) 進階北海道／高速 ETC 主題包付費解鎖或打包 Native App IAP、(b) 高毛利日本租車／旅平險聯盟分潤，或 (c) 借鏡 *Left! Left! LEFT!* 推出「旅伴雙人副駕報路模式」。

## Out of Scope (for the recommended option)

- MVP 不支援匯入任意全球或日本個人導航路線（亦不串接任何按量計費之商業街景或地圖路由 API）。
- MVP 不採用手寫零引擎 Raw WebGPU / WGSL Shader 路線（`Abyssal Garden` 僅作為靈感參考，不納為實作技術）。
- MVP 不上架 iOS App Store / Google Play 原生 App，亦不串接正式 Web 金流結帳系統（改以 Fake Door 意願測試＋旅伴分享解鎖）。
- MVP 不實作北海道雪地、高速公路 ETC 實戰場景與即時雙人連線副駕模式（北海道與高速 ETC 於 MVP 僅作為 Fake Door 鎖定卡片驗證需求；雙人即時副駕模式列為 Phase 2 選配）。
- 不實作全手動擬真賽車物理、倒車入庫／S 型彎道等低遷移效益之微操科目，不取代正式駕訓考照，亦不作為行車中即時導航工具（繼承自 `problem.md` Non-Goals）。

## Assumptions to Validate

- **3–5 分鐘微切片的完課與學習遷移效果**：在行動瀏覽器上透過「動態差異號誌問答＋半輔助 3D 駕訓熱身與市區右轉實戰」，能讓 ≥ 50% 使用者完成首套體驗，並使重複演練關鍵失誤率下降 ≥ 40%。
- **社群冷啟動與旅伴擴散假設**：「赴日右駕翻車診斷卡」與「分享旅伴解鎖」機制能在台灣日本自駕社團／LINE 群組中驅動自然擴散，且 Fake Door／分享解鎖率達 ≥ 10%。
- **行動端內建瀏覽器流暢度假設**：風格化低多邊形 WebGL2 3D 場景在主流手機之 Safari、Chrome 以及 LINE / Facebook 內建瀏覽器中皆可於 3 秒內進入首屏並維持流暢可操作幀率。
- **商業回收路徑選擇假設**：透過上線 30 天之 Fake Door 點擊率與旅遊聯盟連結點擊率比較，能客觀判斷 Phase 2 應優先投資「付費地圖解鎖（Web／Native IAP）」還是「高客單租車／保險聯盟分潤與 B2B2C 合作」。
