## Why

報告結構重新設計（`docs/trait-ontology-draft.md` 第 7 版，決策 22–24、27）要求**資料層保留足以支援分析的內容**：每個結論都要能追溯到「用什麼輸入、什麼方法、哪一版規則」算出。目前只有塔羅與盧恩記錄抽取規則版本（`drawVersion`）；八字、星盤、人類圖、生命靈數、瑪雅 Kin、星座運勢都是讀取時重算，**規則版本沒有寫進任何記錄**，日後規則一改，已發布的報告就無法說明當時是怎麼算的。MBTI 的四維分數已能算出（`scoreDimensions`），但只在 AI 報告的輸入裡出現，單維度的 MBTI 結果與測驗紀錄看不到。

這是後續「特質軸與映射」「報告結構與快照」兩個 change 的地基，先獨立做、獨立驗收。

## What Changes

- 新增共用的**計算依據（`basis`）**型別與 zod schema：系統、方法、規則版本、所用的輸入。
- 為各重算型系統建立**規則版本常數**與純函式 `buildBasis`：八字、星盤（本命）、人類圖、生命靈數、瑪雅 Kin、星座運勢、星座（太陽星座判定）；塔羅、盧恩沿用現有的抽取版本；MBTI 沿用測驗版本。
- AI 詳細報告文件新增**必填欄位** `basis`，寫入各維度的計算依據。
- MBTI 單維度結果與測驗紀錄新增**四維分數**（`score`、`maxScore`、`leaning`），由作答與該版測驗的計分規則計算，不新增儲存欄位。
- 不改現有報告的內容、點數與版型。

不在範圍內（另開 change）：星盤的宮位、宮主星、相位與出生時間／城市補填；28 條特質軸與映射；報告快照與多維度報告改版；使用者回饋層（已決定不做）。

## Capabilities

### New Capabilities
- `analysis-basis`: 每份報告的事實都附計算依據（輸入、方法、規則版本）；各系統有可追溯的規則版本常數；AI 詳細報告記錄所用的依據。
- `mbti-dimension-scores`: MBTI 結果與測驗紀錄提供四個維度的原始分數、最大可能分數與偏向。

### Modified Capabilities
<!-- 無：現有 spec 的需求不變，新增行為皆以新 capability 描述 -->

## Impact

- `shared/schemas/`：新增 `analysisBasis.schema.ts`；`firestore/detailedReport.schema.ts` 加可選 `basis`；`api/test.schema.ts` 的提交回應與紀錄項目加 `dimensions`。
- `shared/utils/`：新增 `analysisBasis.ts`（版本常數與 `buildBasis`）；沿用 `personalityScoring.ts` 的 `scoreDimensions`。
- `server/services/`：`test.service.ts` 回傳分數；`detailedReport.service.ts`（經 `server/ai/analysisInput.ts`）寫入 `basis`。
- 前端：MBTI 結果頁顯示四維分數（只顯示，不改版型）。
- 無新依賴。專案處於測試開發階段，**不考慮舊資料與舊結構**：不寫相容讀取、不做遷移；既有測試資料上線前清除。
