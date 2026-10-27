## 1. 計算與回應形狀

- [x] 1.1 `shared/constants/natal.ts`：`NATAL_BODIES` 末尾加入 `URANUS`、`NEPTUNE`、`PLUTO`（既有七顆順序不變）
- [x] 1.2 `server/astrology/natalChart.ts`：`BODY_OF` 加入三顆的 `Astronomy.Body` 對照；確認 `computeNatalChart` 回傳十顆天體
- [x] 1.3 `shared/schemas/api/natalChart.schema.ts`：`natalChartResponseSchema.bodies` 加入三個必填欄位
- [x] 1.4 補計算測試（`server/astrology/natalChart.test.ts`）：既有參考盤（愛因斯坦）加上天王、海王、冥王的期望值；七顆天體與上升維持原結果（回歸）；跨星座邊界的度數取整
- [x] 1.5 補服務測試（`server/services/natalChart.service.test.ts`）：回應含十顆天體且通過 response schema；請求驗證行為不變

## 2. 固定解讀內容

- [x] 2.1 `shared/constants/natalLabels.ts`：加入天王、海王、冥王的名稱與角色說明；`NATAL_GROUPS` 新增「世代與長期主題」一組，說明這是同世代共同的背景
- [x] 2.2 `shared/constants/natalPlacementMeanings.ts`：撰寫天王、海王、冥王 × 12 星座共 36 筆解讀，以世代背景為主，語氣用「可能、傾向」，不預測事件
- [x] 2.3 更新 `natalPlacementMeanings.test.ts` 的涵蓋範圍（11 個位置 × 12 星座），長度 20 至 100 字與禁語檢查沿用

## 3. 前端

- [x] 3.1 `app/pages/analysis/zodiac/[sign].vue`：確認 `placementOf` 與卡片分組能顯示新一組，窄螢幕版面不破
- [x] 3.2 在瀏覽器確認：十顆天體與四組卡片、既有七顆與上升的顯示不變、外行星說明文字出現

## 4. 文件與收尾

- [x] 4.1 `openspec/analysis/render/api.yaml` 與 `api-model.yaml` 的 `NatalChart` schema 已含三顆外行星（分析階段已更新，確認與實作一致）
- [x] 4.2 跑 `pnpm exec eslint . --fix`、`pnpm exec vitest run`、`nuxt prepare` 與 `pnpm build`，全部通過
