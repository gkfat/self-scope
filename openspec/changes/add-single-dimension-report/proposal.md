## Why

目前各系統的單維度結果頁只是固定內容的呈現，沒有統一的報告結構。重設後的報告（`docs/trait-ontology-draft.md`）要求每份單維度報告都依「位置結論 → 系統的事實與解讀 → 本系統的歸納（含影響地圖）→ 建議 → 依據與限制」走，先事實、後推論，並涵蓋時間、對象、生活領域三組情境。

## What Changes

- 新增**單維度報告組裝**：由規則加預寫片段產生，**免費、內容全部提供**，不呼叫 AI。
- 報告五個區塊加影響地圖：位置結論、系統的事實與解讀（用該系統原語彙）、本系統的歸納（映射到特質軸，每個面向附依據與過度時的樣子）、**影響地圖**（時間、對象、領域，**全部顯示**，無片段的格子不顯示）、建議與反思（含確認問題，只顯示不存答案）、依據與限制（系統性質標籤、規則版本）。
- **系統性質標籤**每份必顯示（MBTI 明說為自製問卷）。
- **時間性內容**：八字大運流年、生命靈數流年數依該系統事實並標明來源；其他系統的時間解讀標明「這是依特質作的推測」。
- **AI 進階分析**：使用者可花 **1 點數**取得 AI 解讀；失敗退點；結果寫入快照。
- **狀態系統**（塔羅、盧恩、星座運勢）的報告不含歸納與影響地圖，只含位置結論、事實與解讀、建議、依據與限制（見 Open Questions）。
- 組裝結果寫入快照（`add-report-snapshots`）。
- 分期上線：先星座，再其他系統（tasks 已拆）。

不在範圍：多維度報告；映射與片段的內容（前置 change）。

## Capabilities

### New Capabilities
- `single-dimension-report`: 單維度報告的結構、組裝規則、系統性質標籤、時間性內容、影響地圖與 AI 進階分析。

### Modified Capabilities
<!-- 既有各系統 spec（natal-chart、bazi-chart、maya-kin…）的需求不變；報告為新增行為 -->

## Impact

- `server/services/` 新增報告組裝服務；`server/api/` 新增報告與 AI 進階分析路由；`routeAccess.ts` 規則；點數扣除與退款沿用 `point.service.ts`。
- `server/ai/` 新增單維度進階分析的提示與品質檢查（沿用 `openaiProvider`、`waitUntil` 背景執行的做法）。
- 前端：各系統結果頁改用報告元件；影響地圖版面；確認問題顯示。
- 相依：`add-report-data-layer`、`add-natal-houses-aspects`、`add-human-design-interpretations`、`add-trait-ontology`、`add-trait-context-fragments`、`add-report-snapshots`。
- 與既有 `detailedReports`／`multiDimensionPricing` 的關係見 design。
