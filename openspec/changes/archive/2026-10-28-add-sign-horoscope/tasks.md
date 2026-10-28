## 1. 行運盤與宮位計算

- [x] 1.1 為 `server/astrology/transitChart.ts`（已寫好：`taipeiMidnightUtc`、`computeBodyLongitudes`、`computeTransitChart`）與 `natalChart.ts` 匯出的 `bodyLongitude`／精確黃經寫測試：同日同結果、台北午夜換日邊界、以已知天文事件對照參考星曆（例如 2024-03-20 春分時太陽黃經約 0°）、既有本命盤輸出不變（回歸）
- [x] 1.2 新增 `shared/constants/horoscope.ts`：五顆天體（太陽、月亮、水星、金星、火星）與各自的面向名稱、`HOROSCOPE_ENTRY_ENABLED`（先 `false`）、內容金鑰 `<天體>_<宮位>`、宮位數量 12
- [x] 1.3 新增 `shared/utils/horoscope.ts`：純函式 `houseOf(userSignIndex, bodySignIndex)`（整宮制）與依太陽星座與行運盤算出五顆天體宮位的函式
- [x] 1.4 寫宮位測試：同星座為第 1 宮、下一個星座為第 2 宮、十二宮循環、十二個星座各自的第 1 與第 12 宮、五顆天體的宮位來自行運盤

## 2. 固定內容 `HOROSCOPE`

- [x] 2.1 `shared/utils/fixedContentKeys.ts`：加入 `HOROSCOPE` 類型、金鑰規則 `<SUN|MOON|MERCURY|VENUS|MARS>_<1–12>`、`isValidContentKey` 與 `expectedFixedContentIds`（新增 60 筆）
- [x] 2.2 更新相關測試（金鑰、覆蓋預期總數、匯入覆蓋檢查）
- [x] 2.3 確認匯入腳本能以 dry-run 驗證 `HOROSCOPE` 的範例列，不合法金鑰被拒絕

## 3. 服務與 API

- [x] 3.1 新增 `shared/schemas/api/horoscope.schema.ts`：`DailyHoroscopeResponse`（日期、星座、五顆天體的所在星座、宮位、面向與內容）
- [x] 3.2 新增 `server/services/horoscope.service.ts`：讀會員的太陽星座（沒有出生日期回 422 `PROFILE_REQUIRED`）、伺服器換算台北日期、算行運盤與宮位、讀 5 筆固定內容（任一筆未發佈回 404）；不寫入任何資料
- [x] 3.3 新增 `server/api/horoscope/daily.get.ts`：`requireAuth`、回應 schema `parse`、`toH3Error`、`Cache-Control: private, no-store`
- [x] 3.4 確認 `routeAccess` 對 `/api/horoscope/daily` 沿用預設需登入（補測試）；更新 `openspec/analysis/render/api.yaml` 與 `api-model.yaml`，確認 `server/api.routes.test.ts` 通過
- [x] 3.5 為服務寫測試：每個星座與已知日期的宮位、同日同結果、換日改變、沒有出生日期 422 且不寫入、內容未發佈 404、五筆內容對應正確、沒有扣點與紀錄

## 4. 前端

- [x] 4.1 新增 `app/composables/useDailyHoroscope.ts` 與 `app/components/fortune/HoroscopePanel.vue`：依面向五張卡片（月亮在最上）、做法說明、以當日 00:00 為準、免責；404 顯示準備中；沒有出生日期引導填寫
- [x] 4.2 `app/pages/fortune.vue`：新增第 4 張「星座運勢」入口卡片，直接顯示摘要，不計入「今天已揭曉」，網址 `#horoscope`
- [x] 4.3 `app/components/fortune/HomeEntry.vue`：多一行星座運勢；入口以 `HOROSCOPE_ENTRY_ENABLED` 旗標關閉
- [x] 4.4 跑 `pnpm exec eslint . --fix` 與 `nuxt prepare`，在瀏覽器確認：各星座、沒有出生日期、內容準備中、已揭曉進度不含星座運勢、窄螢幕與首頁一行

## 5. 內容

- [x] 5.1 撰寫 `content/fixed/horoscope.json`：5 顆天體 × 12 宮共 60 筆，語氣用「可能、傾向、今天可以試試」，不預測事件
- [x] 5.2 以 `pnpm content:import content/fixed/horoscope.json --dry-run` 驗證，審稿後改為 `PUBLISHED` 並匯入
- [x] 5.3 匯入後確認覆蓋檢查顯示 `HOROSCOPE` 60 筆完整，並實際查看至少兩個星座的今日運勢

## 6. 收尾

- [x] 6.1 `pnpm exec vitest run` 全部通過、`nuxt build` 成功
- [x] 6.2 開啟 `HOROSCOPE_ENTRY_ENABLED`
