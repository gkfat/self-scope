## Why

瑪雅曆的 Kin 是「命理與象徵系統」裡很受歡迎、而且完全由日期決定的項目：給定一個日期就能算出圖騰與調性，不需要 AI。它有兩種自然的用法：**生日 Kin**是個人恆定的特質，適合放進命理系統與星座、生命靈數並列；**今日 Kin**是當天的能量，屬於「此刻／今日」這類有時效性、讓使用者每天回來的內容。兩者共用同一套計算，所以放在同一個 change。

## What Changes

- 新增**瑪雅 Kin 計算**，採 **Dreamspell** 曆法（13 月亮曆）：2 月 29 日不計入，出生或查詢於 2 月 29 日者沿用 2 月 28 日的 Kin。每個 Kin 由 1 至 260 的編號、20 個圖騰之一、13 個調性之一組成。
- 新增**生日 Kin**（命理系統）：由生日算出，顯示圖騰、調性與事先寫好的固定解讀。免費、免登入、不儲存，沿用單項免費結果的做法。首頁「命理與象徵系統」新增「瑪雅 Kin」小卡片，需要出生日期。
- 新增**今日 Kin**（此刻／今日）：**需登入**。每個會員每個台北日期可「計算」一次，計算即解鎖當天的 Kin 內容，**不扣點**；解鎖後當天可不限次數查看。以 `users/{uid}/kinUnlocks/{台北日期}` 記錄當日已解鎖，保存 3 個月，到期自動清除，刪除帳號時一併刪除。
- 新增固定內容類型 `KIN_BIRTH` 與 `KIN_TODAY`，各 **260 筆**（共 520 筆），**分開撰寫**：生日 Kin 寫「你的本質」，今日 Kin 寫「今天的能量」。沿用固定內容的匯入、版本與覆蓋檢查，不呼叫 AI。
- 新增 API：`GET /api/fixed-results/maya-kin`（生日 Kin，公開）、`GET /api/kin/today` 與 `POST /api/kin/today`（今日 Kin，需登入）。
- 今日 Kin 與每日塔羅合併為一頁「今日運勢」（`/fortune`，需登入），頁面先以兩張入口卡片標示塔羅與瑪雅 Kin，點擊後在同一頁進入各自內容；新增生日 Kin 頁（`/analysis/maya-kin`）。首頁新增「瑪雅 Kin」卡片，首頁今日入口與側邊選單與塔羅共用「今日運勢」。入口由旗標控制。
- **瑪雅 Kin 也出現在「自我分析報告」頁**（命理與象徵系統的卡片，需出生日期），並成為**多維度分析的第 7 個可選維度**：選到就是 AI 生成（寫好的摘要不涵蓋 Kin）、基礎價 1 點，給模型的只有 Kin 的編號、名稱、圖騰與調性。
- 內容標示為娛樂與自我反思參考，不預測未來、不給醫療／法律／財務建議。

**不在本次範圍**：Kin 的關聯（導引、類似、對立、隱藏）、波符（Wavespell）與 13 月亮曆的月日對照、圖騰圖像、Kin 單獨的 AI 解讀、分享圖片、「此刻／今日」區塊的整併（`add-today-section`）。

## Capabilities

### New Capabilities
- `maya-kin`: Dreamspell Kin 計算規則、`KIN_BIRTH` 與 `KIN_TODAY` 固定內容、生日 Kin 與今日 Kin 的 API、每日解鎖紀錄與頁面入口

### Modified Capabilities
<!-- 專案目前沒有已歸檔的主 specs（openspec/specs/ 為空）；固定內容新增兩種類型、資料到期清除與刪帳號納入 kinUnlocks，寫在 maya-kin 的需求中 -->

## Impact

- **新增**：`shared/constants/mayaKin.ts`（20 圖騰、13 調性的名稱）、`shared/utils/mayaKin.ts`（Kin 計算）、`shared/schemas/firestore/kinUnlock.schema.ts`、`server/repositories/kinUnlock.repository.ts`、`server/services/kinUnlock.service.ts`、`server/api/kin/today.get.ts` 與 `today.post.ts`、`server/api/fixed-results/maya-kin.get.ts`、`server/services/mayaKin.service.ts`、`server/mayaKin/reportFacts.ts`、`shared/schemas/api/mayaKin.schema.ts`、`app/pages/fortune.vue`、`app/components/fortune/`、`app/components/kin/Badge.vue`、`app/composables/useKinToday.ts`、`app/pages/analysis/maya-kin.vue`。
- **修改**：`shared/utils/fixedContentKeys.ts`（加入 `KIN_BIRTH`、`KIN_TODAY` 與金鑰規則、覆蓋預期）、`server/utils/routeAccess.ts`（確認既有公開規則涵蓋生日 Kin；今日 Kin 沿用預設需登入）、`server/services/dataExpiry.service.ts` 與 `scripts/provision-firebase.ts`（`kinUnlocks` 到期清除與索引例外）、`server/services/deletion.service.ts`、首頁與側邊選單、`app/pages/self-reports.vue`、多維度分析（`shared/schemas/**/detailedReport.schema.ts`、`shared/utils/multiDimensionPricing.ts`、`shared/utils/explorationProgress.ts`、`server/ai/analysisInput.ts`、`server/ai/prompt.ts`、`server/services/detailedReport.service.ts`、`app/utils/reportDimensions.ts`、`app/pages/report/index.vue`）、`openspec/analysis/render/api.yaml`。
- **內容**：新增 `content/fixed/maya-kin-birth.json` 與 `maya-kin-today.json`（各 260 筆，需撰寫與審稿並匯入）。這是本 change 最大的工作量。
- **依賴**：不新增套件；Kin 以日期運算得出。
- **與其他 change 的關係**：台北日期換算與「每日一次、以日期為文件編號」的做法與 `add-daily-tarot-draw` 相同；塔羅先落地，`taipeiDateKey` 已移到 `shared/utils/time.ts` 共用。每日塔羅的頁面、首頁區塊與選單入口隨之併入「今日運勢」（`/fortune`）。`add-today-section` 之後把「今日運勢」收進「此刻／今日」區塊。
- **費用**：今日 Kin 每位使用者每天最多 1 次寫入，在免費額度內。
