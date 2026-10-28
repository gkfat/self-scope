## Why

「今日運勢」目前有塔羅、瑪雅 Kin、盧恩三種，都是抽或算一次的小儀式；使用者還想看「今天的星空對我這個星座意味著什麼」，也就是常見的星座運勢。這個需求只需要出生日期（太陽星座），不必出生時間與城市，也不必 AI：把今天的星盤放在使用者的星座上看，組成事先寫好的固定內容，免費、每天都不同。它也取代 `add-transit-report`（付費 AI 個人化報告）當前最小可用的那一步；那份報告成本與價格尚未定，先暫緩，之後作為深度版。

## What Changes

- 新增**星座運勢**，放在「今日運勢」頁作為第 4 張入口卡片：**需登入**，免費，不扣點，不呼叫 AI，不儲存任何紀錄。
- 以**會員已存的出生日期所對應的太陽星座為第 1 宮（整宮制）**，看**今日（台北當日 00:00）**的太陽、月亮、水星、金星、火星各落在使用者的第幾宮（1 至 12），每一顆對應一個生活面向：
  - 月亮 → 今日心情與節奏（每天最有感，約 2.5 天換一次星座）
  - 太陽 → 這段時間的主題
  - 水星 → 溝通與思考
  - 金星 → 感情與人際
  - 火星 → 行動與精力
- 新增固定內容類型 `HOROSCOPE`：5 顆天體 × 12 宮 = **60 筆**，事先寫好、沿用固定內容的匯入、版本與覆蓋檢查。語氣用「可能、傾向、今天可以試試」，不預測具體事件。
- 新增 API：`GET /api/horoscope/daily`，需登入。日期由伺服器換算（台北日期），太陽星座取自會員的個人資料，不接受客戶端傳入的日期或星座。沒有出生日期時回 422 並引導填寫。
- 今日運勢頁的星座運勢卡片**直接顯示結果摘要**（今天的月亮在你的第幾宮與其主題），點擊進入完整內容；它不是「抽或算一次」的項目，所以不計入「今天已揭曉 X／N」。首頁「今日運勢」區塊多一行星座運勢。入口由旗標控制。
- **重用**行運盤計算：台北當日 00:00 的十顆天體精確黃經（`server/astrology/transitChart.ts`，原為 `add-transit-report` 的任務 1.2，改在這裡先落地）。
- 內容標示為娛樂與自我反思參考，不預測未來、不給醫療／法律／財務建議。

**不在本次範圍**：用出生時間與城市的個人化本命盤與相位（`add-transit-report`）、AI 生成、付費、木星以外的慢速行星（木、土、天王、海王、冥王）、宮位制的選擇（只用整宮制）、歷史紀錄、分享圖片、訪客使用。

## Capabilities

### New Capabilities
- `sign-horoscope`: 以太陽星座為第 1 宮看今日星盤的宮位計算、`HOROSCOPE` 固定內容、需登入的 API 與今日運勢頁的卡片

### Modified Capabilities
<!-- 無：今日運勢頁其他項目的需求（塔羅、瑪雅 Kin、盧恩）不變，只是頁面多一張卡片；卡片行為寫在 sign-horoscope 的需求中 -->

## Impact

- **新增**：`shared/constants/horoscope.ts`（天體、面向與宮位的名稱、內容金鑰）、`shared/utils/horoscope.ts`（宮位計算）、`shared/schemas/api/horoscope.schema.ts`、`server/services/horoscope.service.ts`、`server/api/horoscope/daily.get.ts`、`app/components/fortune/HoroscopePanel.vue`、`app/composables/useDailyHoroscope.ts`。
- **已寫好、在此落地**：`server/astrology/transitChart.ts`（`taipeiMidnightUtc`、`computeBodyLongitudes`、`computeTransitChart`）、`server/astrology/natalChart.ts` 匯出 `bodyLongitude` 與精確黃經。
- **修改**：`shared/utils/fixedContentKeys.ts`（加入 `HOROSCOPE`、覆蓋預期新增 60 筆）、`openspec/analysis/render/api.yaml` 與 `api-model.yaml`、`app/pages/fortune.vue`、`app/components/fortune/HomeEntry.vue`。
- **內容**：新增 `content/fixed/horoscope.json`（60 筆，需撰寫與匯入）。
- **資料**：不新增集合、不儲存、無到期清除、無刪帳號處理。
- **依賴**：不新增套件；`astronomy-engine` 已足夠。
- **與其他 change 的關係**：`add-transit-report` 暫緩；它的相位計算（`aspects.ts`、`shared/constants/transit.ts`）已寫好但本 change 用不到，留給它。之後 `add-today-section` 把今日運勢收進「此刻／今日」。
- **費用**：無（固定計算與固定內容）。
