## 1. 抽牌規則與牌的資料

- [ ] 1.1 新增 `shared/constants/tarot.ts`：22 張大阿爾克那的序號、羅馬數字、中文名、英文名與選填的 `illustration`（預設 null）
- [ ] 1.2 新增 `shared/utils/tarot.ts`：`taipeiDateKey(now)` 與純函式 `drawDailyCard(uid, dateKey)`（SHA-256，版本字串 `tarot-v1`），輸出牌序號與正逆位
- [ ] 1.3 為 `drawDailyCard` 與 `taipeiDateKey` 寫單元測試：同輸入一致、換日／換帳號可不同、台北午夜換日邊界、22 張牌與正逆位在大量帳號下都會出現

## 2. 固定內容類型 TAROT

- [ ] 2.1 `shared/utils/fixedContentKeys.ts`：加入 `TAROT` 類型、金鑰規則 `<0–21>_<upright|reversed>`、`isValidContentKey` 與 `expectedFixedContentIds`（新增 44 筆）
- [ ] 2.2 更新相關測試（金鑰、覆蓋預期總數、匯入覆蓋檢查）
- [ ] 2.3 確認匯入腳本（`pnpm content:import`）能以 dry-run 驗證 `TAROT` 的範例列

## 3. 翻牌紀錄與 API

- [ ] 3.1 新增 `shared/schemas/firestore/tarot.schema.ts`：`users/{uid}/tarotDraws/{date}` 的文件（cardIndex、orientation、drawnAt、expiresAt、drawVersion）
- [ ] 3.2 新增 `server/repositories/tarot.repository.ts` 與 `server/services/tarot.service.ts`：`getToday(uid)`；`draw(uid)` 先讀內容確認可交付，再於交易中「不存在才建立」，已存在直接回傳
- [ ] 3.3 新增 `server/api/tarot/daily.get.ts` 與 `daily.post.ts`：`requireAuth`、回應 Zod 驗證、`Cache-Control: private, no-store`、內容未發佈回 404 且不寫入
- [ ] 3.4 `server/utils/routeAccess.ts` 登記為需登入；更新 `openspec/analysis/render/api.yaml`，並確認 `server/api.routes.test.ts` 通過
- [ ] 3.5 為服務與端點寫測試：首次翻牌、同日重複、並行請求只建立一份、隔天重新抽、內容未發佈不寫入、未登入 401

## 4. 保留與刪除

- [ ] 4.1 `scripts/provision-firebase.ts` 的 `EXPIRY_QUERY_GROUPS` 加入 `tarotDraws`；`dataExpiry.service` 的到期清除納入 `tarotDraws`，並補測試
- [ ] 4.2 `deletion.service` 刪除帳號時移除該使用者的 `tarotDraws`，並補測試

## 5. 前端

- [ ] 5.1 新增牌面元件（牌背、牌面、逆位旋轉、翻牌動畫、`prefers-reduced-motion`、選填插畫、無插畫時文字排版）
- [ ] 5.2 新增 `app/pages/tarot.vue`：`member` middleware、載入時 GET、點擊 POST 翻牌、已翻過直接顯示、跨日重新查詢、404 顯示準備中；內容沿用 `FixedResultView` 風格
- [ ] 5.3 首頁新增獨立的「每日塔羅」區塊：已登入未翻／已翻兩種狀態，未登入顯示說明與「立即登入」，與四張維度卡視覺分開
- [ ] 5.4 側邊選單在「自我分析報告」之後新增「每日塔羅」
- [ ] 5.5 跑 `pnpm exec eslint . --fix` 與 `nuxt prepare`，在瀏覽器確認牌背、翻牌、逆位、已翻過、未登入導回、窄螢幕與首頁區塊

## 6. 內容撰寫與匯入

- [ ] 6.1 撰寫 `content/fixed/tarot.json`：22 張 × 正逆位共 44 筆，語氣用「可能、傾向、今天可以試試」，不預測具體事件
- [ ] 6.2 以 `pnpm content:import content/fixed/tarot.json --dry-run` 驗證，審稿後改為 `PUBLISHED` 並匯入
- [ ] 6.3 執行 `scripts/provision-firebase.ts` 建立 `tarotDraws` 的索引例外
- [ ] 6.4 匯入後確認覆蓋檢查顯示 `TAROT` 44 筆完整，並實際翻出正位與逆位各至少一次

## 7. 收尾

- [ ] 7.1 `pnpm exec vitest run` 全部通過、`nuxt build` 成功
- [ ] 7.2 開啟首頁區塊與選單項目的旗標
