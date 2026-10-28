## Context

- 報告結構重設（`docs/trait-ontology-draft.md` 第 7 版）定了五層資料；本 change 只做**第 3 層「計算依據」**與 MBTI 的原始分數。第 1、2、4 層已存在；第 5 層（使用者回饋）已決定不做。
- 現況（已讀程式確認）：
  - 只有塔羅、盧恩有規則版本：`TAROT_DRAW_VERSION = 'tarot-v1'`、`RUNE_DRAW_VERSION = 'rune-v1'`，寫在每筆抽取紀錄的 `drawVersion`。
  - 八字、本命星盤、人類圖、生命靈數、瑪雅 Kin、星座運勢、太陽星座判定皆在讀取時由輸入重算，**沒有任何規則版本**。
  - AI 詳細報告文件（`detailedReports`）存 `input`（`analysisInputSchema`，含 `inputVersion` 雜湊）、`promptVersion`、`modelName`，但**不存各維度的計算規則版本**。
  - `scoreDimensions` 已能算 MBTI 四維 `score`／`maxScore`／`leaning`，目前只被 `server/ai/analysisInput.ts` 用；測驗提交回應與 `testAttempts` 的結果只有四字母型別。
  - 測驗版本是不可變的：作答依提交時的 `testVersion` 計分（`TestService.submit`），版本含 `scoringRule`。
- 約束：不新增依賴；Firestore 只經 repository；時間欄位為 epoch 毫秒；schema 為前後端契約（輸入輸出都過 zod）；缺 secret 要明確拋錯（本 change 不涉及）。

## Goals / Non-Goals

**Goals:**
- 每個重算型系統有一個明確、可追溯的規則版本，並有單一入口 `buildBasis` 產生 basis。
- 新產生的 AI 詳細報告記錄所選維度的 basis。
- MBTI 結果與測驗紀錄回傳四維分數，不新增儲存欄位。

**Non-Goals:**
- 星盤的宮位、宮主星、相位，以及出生時間／城市補填（另開 change）。
- 28 條特質軸、映射檔、報告快照、多維度改版、計費調整。
- 舊資料的相容與遷移：專案處於測試開發階段，既有資料上線前清除，不為它寫任何相容程式。
- 把規則版本做成可由使用者選擇或可回溯重算的機制（目前只記錄，不保存多版本實作）。

## Decisions

### D1：`basis` 是小型、純資料的結構，由純函式建立
`AnalysisBasis = { system, method, ruleVersion, inputs }`，放在 `shared/schemas/analysisBasis.schema.ts`（zod），建立函式放 `shared/utils/analysisBasis.ts`。
- 理由：前後端共用契約；純函式可單元測試；`system` 用固定清單避免拼字漂移。
- 替代：每個系統各自定義 basis 形狀 → 報告端要為每個系統寫分支，且無法統一驗證；否決。
- `inputs` 是 `Record<string, string | number | boolean | null>`，只放扁平的純量，不放巢狀物件與自由文字，與 `analysisInput` 「不含自由文字」一致。

### D2：規則版本是**手動維護的字串常數**，與行為改變一起改
格式 `<system>-v<N>`（例如 `bazi-v1`），集中在 `shared/utils/analysisBasis.ts` 的 `RULE_VERSIONS`。塔羅、盧恩不另建常數，直接引用既有的 `TAROT_DRAW_VERSION`、`RUNE_DRAW_VERSION`。
- 理由：簡單、明確；規則行為（八字節氣切月、Kin 的 2/29 處理、人類圖的行星對應等）本來就由人決定何時算「改變」。
- 替代：以程式碼雜湊自動產生 → 重構也會改版本、無法表達「行為沒變」；否決。
- 風險由測試緩解：為每個系統放一組**已知輸入的回歸測試**（沿用既有的 Kin、八字對照測試），改行為時測試失敗會提醒同步改版本（見 Risks）。

### D3：MBTI 分數讀取時重算，不存
提交回應直接回傳 `scoreDimensions` 結果；`GET test-attempts` 逐筆以該筆的 `testVersion` 載入版本再算（同一 `testId + testVersion` 在一次請求內快取，避免重複讀取）。
- 理由：測驗版本不可變，所以重算結果恆定；不需新欄位。
- 替代：提交時把分數存進 `testAttempts` → 多一份可能與作答不一致的資料；否決。
- 版本讀不到視為資料錯誤，直接拋 `NotFoundError`，不猜測分數。

### D4：AI 報告的 `basis` 是必填欄位
`detailedReportDocSchema` 新增 `basis: z.array(analysisBasisSchema)`，在 `detailedReport.service.ts` 組好 `input` 的同一處，依 `chosen` 的維度建立，隨文件建立時寫入。
- 理由：不改 `inputVersion` 的雜湊內容（雜湊只含 facts，`basis` 另放），所以重複報告的辨識、冪等與點數都不受影響。
- 替代：把 `basis` 放進 `analysisInput` → 會改雜湊，使既有「相同資料」的判定失效；否決。
- 保存期限與刪除沿用文件本身（6 個月；刪帳號時整個 `detailedReports` 被清除），不需新的清除程式。

### D5：basis 的 `inputs` 存所用的輸入值，與報告同壽命
例如八字存 `birthDate`、`birthTime`、`birthPlace`（有的話）；生命靈數存 `birthDate`；Kin 存 `birthDate`。
- 理由：使用者之後可能修改個人資料，要重現「當時」的結果必須有當時的輸入。
- 風險：這是個資，但它本來就存在使用者資料與報告輸入中；保存期限與刪除機制和該報告文件相同，不新增保存位置。

### D6：只為「被報告選用的維度」建立 basis
`REPORT_DIMENSIONS` 目前不含本命星盤與星座運勢；這兩者的版本常數與 `buildBasis` 先建立並測試（後續的報告 change 會用到），但本 change 不改其現有流程。

## Risks / Trade-offs

- **[版本常數忘了跟著規則改]** → 每個系統的回歸測試以已知輸入釘住輸出；`tasks.md` 把「改規則必須同步改版本」寫進 `analysis-basis` spec 與 code 註解；日後 code review 時檢查。
- **[`GET test-attempts` 變慢，因為每筆都要載入版本]** → 列表上限 50 筆；同一版本在一次請求內只讀一次；紀錄實際上最多少數幾個版本。
- **[basis 含出生資料，擴大個資的出現位置]** → 只放在已有同樣資料的報告文件內，期限與刪除相同；不放 log（現有 log 不輸出 `inputs`，新增程式碼也不得記錄）。

## Migration Plan

- 無遷移：專案處於測試開發階段，既有的測試資料（含沒有 `basis` 的報告）上線前清除。

## Open Questions

- 版本字串的初始值（`*-v1`）是否要對應目前已發布的行為即可，不回溯舊行為——預設是；若你想把某系統的現況記為 v2，請指定。
