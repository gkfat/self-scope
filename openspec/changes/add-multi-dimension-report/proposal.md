## Why

多維度報告要找出單一系統看不到的東西：不同系統的位置並列、軸向地圖、跨系統的洞見（收斂、張力、軸間交互、盲區、情境差異、對象落差、時間延伸）與影響地圖。目前的多維度分析靠 14320 種預寫組合摘要與 AI 自己找關聯，無法擴充到更多維度，也難稽核。

## What Changes

- 新增**多維度報告組裝**（區塊 0 至 8）：標題與性質標籤、座標（各系統位置結論並列）、各系統重點事實、軸向地圖（標示來源是否獨立）、洞見、影響地圖、當下對照、建議與反思、依據與限制。
- 新增**洞見規則庫**（約 30 至 60 條組合規則；我起草、你審）：規則由軸端點的組合與來源條件觸發，說明文字取自規則庫，由 AI 針對這個人改寫。
- **計費**：多維度一律用點數付費，AI 解讀費用已含在內；不再有免費的多維度報告。
- **獨立性**：同源（`sourceGroup`）的系統說相似的話，不算多次驗證；報告標明；不顯示信心或強度數字。
- **取代**：專案處於測試開發階段，不考慮舊資料與舊結構；既有 14320 組合摘要與既有多維度 AI 報告由新報告取代並移除，不並存。
- 組裝結果寫入快照；至少兩個系統；塔羅、盧恩、運勢只用於「當下對照」。

不在範圍：單維度報告；內容資料（映射、片段）。

## Capabilities

### New Capabilities
- `multi-dimension-report`: 多維度報告的區塊結構、組裝、獨立性規則、計費與失敗處理。
- `insight-rules`: 洞見規則庫的結構、觸發條件、類型、驗證與規模。

### Modified Capabilities
<!-- 既有 summaries 與 detailedReports 由新報告取代（見 What Changes） -->

## Impact

- `server/services/` 新增多維度報告服務；`server/api/` 新增路由；`routeAccess.ts` 規則；點數扣除與退款沿用 `point.service.ts`；`shared/utils/multiDimensionPricing.ts` 擴充新報告的價目。
- `shared/ontology/insightRules/`（資料與驗證）；`server/ai/` 新增改寫洞見與建議的提示與品質檢查。
- 前端：多維度選擇與結果頁（座標、軸向地圖、洞見、影響地圖）。
- 相依：`add-single-dimension-report` 之前置全部 change，以及 `add-report-snapshots`。
