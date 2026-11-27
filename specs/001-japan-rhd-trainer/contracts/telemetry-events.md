# Contract: Anonymous Telemetry & 30-Day Validation Schema

**Feature**: `001-japan-rhd-trainer`
**References**: [spec.md](../spec.md) (`FR-014`, `FR-015`, `SC-001`–`SC-007`), [data-model.md](../data-model.md)

本契約定義前端向匿名統計端點（或本地開發驗證緩衝區）發送之事件格式、嚴格隱私過濾規則與 30 天 Go/No-Go 指標計算公式。

---

## 1. 傳輸與隱私邊界（Transport & Privacy Contract）

- **傳輸機制**：優先使用 `navigator.sendBeacon(VITE_TELEMETRY_ENDPOINT, JSON.stringify(envelope))`；若瀏覽器不支援或回傳 `false`，降級為 `fetch(VITE_TELEMETRY_ENDPOINT, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } })`。若 `VITE_TELEMETRY_ENDPOINT` 未設定，僅寫入記憶體除錯佇列，不得拋出執行期錯誤或阻斷畫面。
- **零個資（Zero-PII）強制白名單**：
  - **允許欄位**：`schemaVersion`、`sessionId`（隨機 UUID v4）、`eventName`、`timestampIso`、`viewportClass`（`'compact' | 'standard' | 'wide'`）、`browserEnv`（`'line-iab' | 'fb-iab' | 'ig-iab' | 'safari' | 'chrome' | 'other'`，僅由特徵旗標分類，不傳送原始 `navigator.userAgent` 字串）、`renderMode`（`'webgl2' | 'webgl1' | 'fallback-2d'`）與下方定義之結構化 `props`。
  - **嚴禁欄位**：姓名、Email、電話、精準或粗略地理位置、原始 IP、Cookie ID、剪貼簿內容或自由輸入文字。單元測試必須驗證任何未列於白名單之屬性在序列化前即被剔除。

---

## 2. 事件封包格式（Event Envelope）

```json
{
  "schemaVersion": "1.0",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "eventName": "drill_completed",
  "timestampIso": "2026-11-27T03:15:00.000Z",
  "browserEnv": "line-iab",
  "viewportClass": "standard",
  "renderMode": "webgl2",
  "props": {}
}
```

### 支援事件清單與 `props` 契約

| `eventName` | 觸發時機 | `props` 必填欄位與型別 | 對應需求／指標 |
|-------------|----------|------------------------|----------------|
| `app_first_interactive` | 首頁載入完成且免責按鈕可點擊 | `{ loadDurationMs: number, entryRef: 'direct' \| 'buddy-share' }` | `SC-001` |
| `disclaimer_accepted` | 使用者確認行前安全免責聲明 | `{}` | `FR-002` |
| `quiz_started` | 進入第 1 題號誌問答 | `{ totalQuestions: number }` | `SC-002` |
| `quiz_completed` | 完成全部 8–10 題問答 | `{ totalQuestions: number, correctCount: number, durationMs: number, grade: 'S' \| 'A' \| 'B' \| 'C' }` | `FR-004`, `SC-002` |
| `drill_started` | 進入任一駕駛關卡 | `{ scenarioId: 'warmup-range' \| 'urban-drill-1' \| 'urban-drill-2', attemptNumber: number }` | `FR-008`, `FR-009` |
| `rule_mistake_logged` | 駕駛關卡中觸發任一規則失誤 | `{ scenarioId: string, attemptNumber: number, mistakeType: 'wiper-mistrigger' \| 'tomare-rolling-stop' \| 'wrong-way-lane' \| 'signal-violation' \| 'yield-violation' }` | `FR-006`, `FR-009`, `SC-003` |
| `drill_completed` | 完成任一駕駛關卡 | `{ scenarioId: string, attemptNumber: number, durationMs: number, totalMistakes: number, errorReductionPctVsFirst: number \| null }` | `FR-014`, `SC-002`, `SC-003` |
| `core_loop_completed` | 同一工作階段完成「問答＋駕訓熱身場」 | `{ totalCoreDurationMs: number }` | `SC-002` |
| `confidence_pulse_submitted` | 提交完課後 1 題信心自評 | `{ rating: 'much-more-confident' \| 'slightly-more-confident' \| 'unchanged' \| 'less-confident' }` | `FR-014`, `SC-004` |
| `diagnostic_shared` | 點擊診斷卡分享或傳送至 LINE | `{ channel: 'line-url' \| 'web-share' \| 'clipboard' \| 'image-save', context: 'diagnostic-card' \| 'buddy-unlock' }` | `FR-004`, `FR-012`, `SC-005` |
| `buddy_unlock_granted` | 完成旅伴分享並解鎖 `urban-drill-2` | `{ packId: 'urban-drill-2' }` | `FR-009`, `SC-005` |
| `fake_door_clicked` | 點擊進階預告主題包表達意願 | `{ packId: 'hokkaido-snow-pack' \| 'highway-etc-pack' }` | `FR-012`, `SC-005` |
| `affiliate_resource_clicked` | 點擊已揭露之外部自駕準備資源 | `{ resourceCategory: 'car-rental' \| 'insurance-guide' \| 'checklist' }` | `FR-013` |
| `render_degraded` | WebGL 異常或低幀率切換為簡化視圖 | `{ reason: 'webgl-unavailable' \| 'context-lost' \| 'low-fps' }` | `SC-006` |

---

## 3. 30 天行為驗證實驗 Go/No-Go 計算公式

1. **首屏啟動速度（`SC-001`）**：`P95(app_first_interactive.loadDurationMs) <= 3000`。
2. **首套完課率（`SC-002`）**：`UniqueSessions(core_loop_completed) / UniqueSessions(disclaimer_accepted) >= 0.50`，且 `Median(totalCoreDurationMs)` 介於 `180000..300000` 毫秒（3–5 分鐘）。
3. **重複挑戰關鍵錯誤下降率（`SC-003`）**：針對擁有 `attemptNumber >= 2` 之 `drill_completed` 工作階段，`Mean(errorReductionPctVsFirst) >= 40`。
4. **行前信心提升率（`SC-004`）**：`Count(rating IN ['much-more-confident', 'slightly-more-confident']) / Count(confidence_pulse_submitted) >= 0.75`。
5. **進階需求與旅伴分享解鎖率（`SC-005`）**：`UniqueSessions(fake_door_clicked OR buddy_unlock_granted) / UniqueSessions(core_loop_completed) >= 0.10`。
