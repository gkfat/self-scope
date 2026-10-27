## 1. Kin 計算與台北日期工具

- [x] 1.1 新增 `shared/constants/mayaKin.ts`：20 個圖騰與 13 個調性的編號與中文名稱（譯名先統一）
- [x] 1.2 新增 `shared/utils/mayaKin.ts`：純函式 `kinOf(isoDate)`（參考日期推算、扣除經過的 2/29、2/29 沿用 2/28），輸出 `{ kinNumber, solarSeal, galacticTone }`
- [x] 1.3 為 `kinOf` 寫單元測試：至少 5 個取自公開 Dreamspell 對照表的獨立已知日期（含閏年前後、2/29 當天、1900 年代）、跨 2/29 的連續性、260 循環邊界、圖騰與調性公式
- [x] 1.4 `shared/utils/time.ts` 新增 `taipeiDateKey(now)`（Asia/Taipei，00:00 換日）與測試；塔羅先落地時放在 `shared/utils/tarot.ts`，已移到 `time.ts`，塔羅改為引用

## 2. 固定內容類型

- [x] 2.1 `shared/utils/fixedContentKeys.ts`：加入 `KIN_BIRTH`、`KIN_TODAY` 類型、金鑰規則（`"1"` 至 `"260"`）、`isValidContentKey` 與 `expectedFixedContentIds`（各新增 260 筆）
- [x] 2.2 更新相關測試（金鑰、覆蓋預期總數、匯入覆蓋檢查）
- [x] 2.3 確認匯入腳本能以 dry-run 驗證 `KIN_BIRTH` 與 `KIN_TODAY` 的範例列

## 3. 生日 Kin API

- [x] 3.1 新增 request／response schema（`shared/schemas/api/`）：`birthDate` 為真實且不在未來的日期；回應為 `{ kin, content }`
- [x] 3.2 新增 `server/api/fixed-results/maya-kin.get.ts`：zod 驗證 query、`kinOf`、`FixedContentService.getPublished('KIN_BIRTH', …)`、response schema `parse`、`toH3Error`；確認 `routeAccess` 既有的 `^/api/fixed-results/.+` 公開規則涵蓋
- [x] 3.3 為端點寫測試：合法生日、無效日期 400、2/29 沿用 2/28、內容未發佈 404、不寫入任何資料

## 4. 今日 Kin 解鎖紀錄與 API

- [x] 4.1 新增 `shared/schemas/firestore/kinUnlock.schema.ts`：`users/{uid}/kinUnlocks/{date}`（kin、unlockedAt、expiresAt）
- [x] 4.2 新增 `server/repositories/kinUnlock.repository.ts` 與 `server/services/kinUnlock.service.ts`：`getToday(uid)`（未解鎖不含 Kin）；`unlock(uid)` 先讀 `KIN_TODAY` 內容確認可交付，再於交易中「不存在才建立」，已存在直接回傳，不扣點
- [x] 4.3 新增 `server/api/kin/today.get.ts` 與 `today.post.ts`：`requireAuth`、response schema `parse`、`Cache-Control: private, no-store`、內容未發佈回 404 且不寫入
- [x] 4.4 確認 `routeAccess` 對 `/api/kin/today` 沿用預設需登入；更新 `openspec/analysis/render/api.yaml` 並確認 `server/api.routes.test.ts` 通過
- [x] 4.5 為服務與端點寫測試：首次解鎖、同日重複、並行只建立一份、解鎖後反覆查看、未解鎖不含 Kin、隔天重新計算、內容未發佈不寫入、未登入 401、客戶端傳入日期被忽略

## 5. 保留與刪除

- [x] 5.1 `scripts/provision-firebase.ts` 的 `EXPIRY_QUERY_GROUPS` 加入 `kinUnlocks`；`dataExpiry.service` 到期清除納入 `kinUnlocks`，補測試
- [x] 5.2 `deletion.service` 刪除帳號時移除該使用者的 `kinUnlocks`，補測試

## 6. 前端

- [x] 6.1 今日 Kin 面板（`app/components/fortune/KinPanel.vue`）與 `useKinToday`：載入時 GET、未解鎖顯示「計算今日 Kin」、點擊 POST、已解鎖直接顯示、跨午夜重新查詢、404 顯示準備中；使用於今日運勢頁（見 6.5）
- [x] 6.2 新增 `app/pages/analysis/maya-kin.vue`：沿用生命靈數頁版型，由生日取得；沒有生日時引導填寫
- [x] 6.3 首頁命理與象徵系統新增「瑪雅 Kin」卡片；首頁今日 Kin 入口併入「今日運勢」區塊，側邊選單為單一「今日運勢」項目；入口以 `KIN_ENTRY_ENABLED` 旗標關閉
- [x] 6.4 跑 `pnpm exec eslint . --fix` 與 `nuxt prepare`，在瀏覽器確認：生日 Kin、今日 Kin 解鎖前後、跨午夜、未登入導回、窄螢幕
- [x] 6.5 今日塔羅與今日 Kin 合併為 `/fortune`（`app/pages/fortune.vue`、`components/fortune/TarotPanel.vue`、`KinPanel.vue`、`HomeEntry.vue`）：一列兩欄的入口卡片（塔羅、瑪雅 Kin），點擊後在同頁顯示各自面板與返回按鈕、開啟項目放在網址 hash、`/tarot` 與 `/kin` 轉為 `/fortune#tarot`、`#kin`、選單與首頁入口合併
- [x] 6.6 自我分析報告頁（`app/pages/self-reports.vue`）新增「瑪雅 Kin」卡片；各卡片改為統一的簡潔配色（單一主色、無漸層）
- [x] 6.7 多維度分析新增 `MAYA_KIN` 維度：schema、定價（基礎價 1 點、含 Kin 即為 AI 生成）、`explorationProgress`、`server/mayaKin/reportFacts.ts`、AI 輸入與提示詞、`detailedReport.service`、報告頁維度選項與組合顯示，並補測試

## 7. 內容撰寫與匯入

- [x] 7.1 撰寫 `content/fixed/maya-kin-birth.json`：260 筆，寫「你的本質」，語氣用「可能、傾向」，不預測事件
- [x] 7.2 撰寫 `content/fixed/maya-kin-today.json`：260 筆，寫「今天的能量」與可以留意的事，與生日 Kin 分開撰寫
- [x] 7.3 以 `pnpm content:import <file> --dry-run` 驗證兩個檔案，審稿後改為 `PUBLISHED` 並匯入
- [x] 7.4 執行 `scripts/provision-firebase.ts` 建立 `kinUnlocks` 的索引例外
- [x] 7.5 確認覆蓋檢查顯示兩類各 260 筆完整，並實際解鎖今日 Kin 與查看生日 Kin 各一次

## 8. 收尾

- [x] 8.1 `pnpm exec vitest run` 全部通過、`nuxt build` 成功
- [x] 8.2 開啟首頁入口與選單項目的旗標
