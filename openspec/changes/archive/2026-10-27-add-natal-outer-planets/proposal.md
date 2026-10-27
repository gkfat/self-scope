## Why

進階星座分析的本命盤目前只有日、月、水、金、火、木、土與上升。即時星象需要拿「今日行運盤」對「本命盤」找相位，行運的長期主題多半來自天王、海王、冥王，本命盤沒有這三顆就無法比對。本命盤本身也因此更完整。這是即時星象報告（`add-transit-report`）的前置，且改動小、可獨立上線，所以先做。

## What Changes

- 本命盤計算加入**天王、海王、冥王**的星座與度數（共十顆天體加上升）；既有七顆與上升的結果**不變**。
- `POST /api/zodiac/natal-chart` 的回應 `bodies` 多出 `URANUS`、`NEPTUNE`、`PLUTO` 三個欄位，皆為必填。
- 進階星座分析頁多顯示一組「世代與長期主題」卡片（天王、海王、冥王），附事先寫好的固定解讀：3 顆 × 12 星座 = 36 筆，不呼叫 AI。
- 三顆外行星各留在同一星座數年到十數年，同世代的人落點相同，文案以「世代的共同背景」而非個人特質來寫。
- 內容明確標示為娛樂與自我反思參考，不預測未來、不給醫療／法律／財務建議。

**不在本次範圍**：行運盤與相位計算（`add-transit-report`）、月交點、小行星、宮位、本命盤的儲存（仍為固定計算、不儲存）。

## Capabilities

### New Capabilities
- `natal-chart`: 本命盤的計算範圍（十顆天體與上升）、回應形狀與外行星的固定解讀

### Modified Capabilities
<!-- 專案目前沒有已歸檔的主 specs（openspec/specs/ 為空）；既有本命盤行為寫在本 change 的 natal-chart 需求中 -->

## Impact

- **修改**：`shared/constants/natal.ts`（`NATAL_BODIES`）、`server/astrology/natalChart.ts`（`bodyLongitude` 的行星對照）、`shared/schemas/api/natalChart.schema.ts`、`shared/constants/natalLabels.ts`、`shared/constants/natalPlacementMeanings.ts`、`app/pages/analysis/zodiac/[sign].vue`、`openspec/analysis/render/api.yaml`。
- **測試**：`server/astrology/natalChart.test.ts`、`server/services/natalChart.service.test.ts`、`shared/constants/natalPlacementMeanings.test.ts`。
- **資料**：不新增集合；本命盤為固定計算且不儲存，沒有資料遷移。
- **依賴**：不新增套件；`astronomy-engine` 與 `planetLongitude` 已支援這三顆（人類圖計算已在使用）。
- **內容**：36 筆新文案，需撰寫與審稿。
- **下游**：`add-transit-report` 依賴此 change。
