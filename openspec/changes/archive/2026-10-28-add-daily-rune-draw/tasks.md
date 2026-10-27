## 1. 抽出共用的每日抽取機制（塔羅行為不變）

- [x] 1.1 在重構前，先以塔羅現有實作記錄一組固定輸入（帳號、日期）的輸出，寫成回歸測試，確認通過
- [x] 1.2 抽出共用模組：決定性選取（雜湊 → 符號序號與方位位元）、當日一次的「不存在才建立」交易、`getToday`、紀錄的 `expiresAt`；差異以設定傳入（集合名稱、內容類型、符號數量、規則版本、`isReversible`）
- [x] 1.3 把塔羅改為使用共用模組，雜湊輸入字串與 `tarot-v1` 版本不動
- [x] 1.4 塔羅既有的單元、服務與端點測試全部通過（不修改、不移除），回歸測試通過

## 2. 盧恩資料與抽取規則

- [x] 2.1 新增 `shared/constants/runes.ts`：標準 Elder Futhark 順序的 24 枚（序號 0–23、名稱、Unicode 字形、`reversible`）；Gebo、Hagalaz、Nauthiz、Isa、Jera、Eihwaz、Sowilo、Ingwaz、Dagaz 為 `false`，其餘 15 枚為 `true`
- [x] 2.2 新增 `shared/utils/rune.ts`：`drawDailyRune(uid, dateKey)`（版本字串 `rune-v1`；先取方位位元再套用可逆規則，不可逆者強制正位）
- [x] 2.3 寫單元測試：同輸入一致、換日或換帳號可不同、24 枚都會出現、9 枚對稱符文在大量輸入下從不為逆位、15 枚可逆符文兩種方位都出現、常數的 9 與 15 枚清單被鎖定

## 3. 固定內容類型 RUNE

- [x] 3.1 `shared/utils/fixedContentKeys.ts`：加入 `RUNE` 類型、金鑰規則 `<0–23>_<upright|reversed>`（對稱符文的 `_reversed` 不合法）、`isValidContentKey` 與 `expectedFixedContentIds`（新增 39 筆）
- [x] 3.2 更新相關測試（金鑰、覆蓋預期總數、匯入覆蓋檢查）
- [x] 3.3 確認匯入腳本能以 dry-run 驗證 `RUNE` 的範例列

## 4. 抽符紀錄與 API

- [x] 4.1 新增 `runeDraws` 的紀錄 schema（`users/{uid}/runeDraws/{date}`：symbolIndex、orientation、drawVersion、drawnAt、expiresAt），沿用共用的紀錄形狀
- [x] 4.2 新增 `RuneService` 與 `RuneRepository`（薄層：設定共用模組）；先讀內容確認可交付，再於交易中不存在才建立
- [x] 4.3 新增 `server/api/rune/daily.get.ts` 與 `daily.post.ts`：`requireAuth`、回應 schema `parse`、`Cache-Control: private, no-store`、內容未發佈回 404 且不寫入
- [x] 4.4 確認 `routeAccess` 對 `/api/rune/daily` 沿用預設需登入；更新 `openspec/analysis/render/api.yaml` 並確認 `server/api.routes.test.ts` 通過
- [x] 4.5 為服務與端點寫測試：首次抽符、同日重複、並行只建立一份、隔天重新抽、對稱符文永遠正位、內容未發佈不寫入、未登入 401

## 5. 保留與刪除

- [x] 5.1 `scripts/provision-firebase.ts` 的 `EXPIRY_QUERY_GROUPS` 加入 `runeDraws`；`dataExpiry.service` 到期清除納入 `runeDraws`，補測試
- [x] 5.2 `deletion.service` 刪除帳號時移除該使用者的 `runeDraws`，補測試

## 6. 前端

- [x] 6.1 新增符石元件（`components/rune/Stone.vue`：背面、字形與名稱、逆位字形旋轉 180°、翻開動畫、`prefers-reduced-motion`、選填插畫、無插畫時以 Unicode 字形排版）與散落元件（`Scatter.vue`：24 顆背面相同的符石散落、各自略微位移與傾斜）
- [x] 6.2 新增盧恩面板（`components/fortune/RunePanel.vue`）與 `useDailyRune`：載入時 GET、點選符石 POST、已抽過直接顯示、跨日重新查詢、404 顯示準備中；`/fortune` 的第 3 張入口卡片，`/rune` 轉址到 `/fortune#rune`
- [x] 6.3 首頁「今日運勢」區塊多一行盧恩（已登入未抽、已抽、未登入三種狀態）；選單維持單一「今日運勢」；入口以 `RUNE_ENTRY_ENABLED` 旗標控制
- [x] 6.4 跑 `pnpm exec eslint . --fix` 與 `nuxt prepare`，在瀏覽器確認：符文背面、翻開、正位與逆位（逆位須是可逆符文）、已抽過、未登入導回、窄螢幕與首頁入口

## 7. 內容撰寫與匯入

- [x] 7.1 撰寫 `content/fixed/rune.json`：24 筆正位 + 15 筆逆位共 39 筆，語氣用「可能、傾向、今天可以試試」，逆位寫成「需要留意的面向」，不預測事件
- [x] 7.2 以 `pnpm content:import content/fixed/rune.json --dry-run` 驗證，審稿後改為 `PUBLISHED` 並匯入
- [x] 7.3 執行 `scripts/provision-firebase.ts` 建立 `runeDraws` 的索引例外
- [x] 7.4 匯入後確認覆蓋檢查顯示 `RUNE` 39 筆完整，並實際抽出正位與逆位各至少一次

## 8. 收尾

- [x] 8.1 `pnpm exec vitest run` 全部通過、`nuxt build` 成功
- [x] 8.2 開啟首頁入口與選單項目的旗標
