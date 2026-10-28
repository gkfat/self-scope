## 1. 計算依據的型別與版本常數

- [x] 1.1 新增 `shared/schemas/analysisBasis.schema.ts`：`ANALYSIS_SYSTEMS` 固定清單（ZODIAC、BAZI、NATAL_CHART、HUMAN_DESIGN、NUMEROLOGY、MAYA_KIN、HOROSCOPE、MBTI、TAROT、RUNE）、`analysisBasisSchema`（`system`、`method`、`ruleVersion` 非空、`inputs` 為扁平純量 record）與型別
- [x] 1.2 新增 `shared/utils/analysisBasis.ts`：`RULE_VERSIONS`（ZODIAC、BAZI、NATAL_CHART、HUMAN_DESIGN、NUMEROLOGY、MAYA_KIN、HOROSCOPE 各一個 `<system>-v1`）；塔羅、盧恩引用既有的 `TAROT_DRAW_VERSION`、`RUNE_DRAW_VERSION`
- [x] 1.3 在同檔實作各系統的 `buildBasis`（純函式、不含時間戳）；MBTI 以作答的 `testVersion` 作 `ruleVersion`
- [x] 1.4 單元測試：schema 合法與非法（未知系統、空版本）、同輸入同版本得到相同結果、塔羅與盧恩等於既有常數、MBTI 使用測驗版本、每個重算型系統都有非空版本
- [x] 1.5 在各系統的計算入口（八字、Kin、星盤、人類圖、生命靈數、運勢、太陽星座）加註解：行為改變時必須同步提高 `RULE_VERSIONS`

## 2. AI 詳細報告記錄計算依據

- [x] 2.1 確認 `detailedReportDocSchema` 對未知欄位的處理（回滾風險），結果寫入 design 的 Open Questions
- [x] 2.2 `detailedReport.schema.ts` 新增必填的 `basis: z.array(analysisBasisSchema)`
- [x] 2.3 `detailedReport.service.ts` 組 `input` 的同一處，依 `chosen` 維度建立 basis 並隨文件寫入；未選維度不建立
- [x] 2.4 測試：新報告的 `basis` 只含所選維度；`inputVersion`、章節與點數扣除不變（沿用既有測試並補斷言）；確認 log 不輸出 `inputs`

## 3. MBTI 四維分數

- [x] 3.1 `shared/schemas/api/test.schema.ts`：新增 `dimensionScoreSchema`（`score`、`maxScore`、`leaning`），提交回應與 `testAttemptItemSchema` 加 `dimensions`
- [x] 3.2 `test.service.ts`：`submit` 以 `scoreDimensions` 回傳分數；`listAttempts` 以各筆 `testVersion` 載入版本再算，同一版本一次請求只讀一次，版本不存在時拋 `NotFoundError`
- [x] 3.3 測試：各維度 `leaning` 串接等於 `result`；總分為 0 依 `tieBreak`；紀錄以當時的測驗版本計算；版本遺失時拋錯，不猜分數
- [x] 3.4 前端 MBTI 結果頁顯示四維偏向與強弱（只新增區塊，不改現有版型順序）

## 4. 驗證

- [x] 4.1 `pnpm lint`、`pnpm test`、`pnpm build` 通過；`pnpm check:bundle` 確認 client bundle 沒有洩漏 server secret
- [x] 4.2 實機確認：MBTI 結果頁顯示分數；新產生一份 AI 報告後文件含 `basis`（由你驗收；舊測試資料上線前清除）
