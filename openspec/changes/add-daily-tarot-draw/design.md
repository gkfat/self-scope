## Context

專案已有「固定內容」機制：事先寫好的內容存在 Firestore `fixedContents/{type}_{key}`，由 `FixedContentService.getPublished` 讀取，並以 `pnpm content:import` 匯入、版本管理（`shared/utils/fixedContentKeys.ts`）。會員資料放在 `users/{uid}` 底下的子集合，並有到期清除（`dataExpiry.service`，以 collection-group 的 `expiresAt` 查詢）與刪除帳號（`deletion.service`）的機制。需要登入的頁面使用 `member` middleware，未登入導回首頁。

每日塔羅要的是「每天有一張、一個帳號一天只能翻一次、免費」的輕量互動。

## Goals / Non-Goals

**Goals:**
- 每個帳號每個台北日期只能翻一次；翻過後任何時間、任何裝置看到的都是同一張。
- 並行請求（雙擊、兩個分頁同時翻）不會寫出兩份不同的結果。
- 內容事先寫好，不呼叫 AI（RULE-017），沿用既有匯入與覆蓋檢查。
- 紀錄有保留期限，並隨刪帳號一起刪除。

**Non-Goals:**
- 訪客抽牌、小阿爾克那、牌陣、歷史頁、重抽、AI 解牌、分享圖片、牌面插畫（之後補）。

## Decisions

### 1. 每日一次：以「日期」為文件編號，用交易建立

翻牌時在 `users/{uid}/tarotDraws/{YYYY-MM-DD}` 以交易「不存在才建立」：已存在就直接回傳既有紀錄，不存在才計算並寫入。文件編號就是台北日期，所以「一天一次」由 Firestore 的唯一編號保證，不需要另外的計數或鎖。

- 紀錄內容：`cardIndex`、`orientation`、`drawnAt`、`expiresAt`、`drawVersion`。牌的資料在寫入當下就存成快照，之後換抽牌規則也不會改到已抽出的結果。
- 替代方案：不存，只靠決定性函式重算。優點是零寫入；缺點是無法表達「已翻開」（跨裝置）與日後的歷史，也無法在規則改版時保留過去結果。因為已決定要限制「每天只能翻一次」，需要記錄，故存。

### 2. 抽牌仍是「帳號 + 日期」的決定性純函式

`drawDailyCard(uid, dateKey)`：SHA-256 `uid|dateKey|tarot-v1` 前 4 位元組 `% 22` 為牌，下一個位元組最低位為正逆位。放在 `shared/utils/tarot.ts`，可單元測試。

- 為什麼不用隨機數：決定性讓交易重試、並行請求都得到相同的結果，也方便測試與稽核。
- 版本字串 `tarot-v1` 寫進雜湊與紀錄，將來換規則（例如加入小阿爾克那）不會與舊紀錄混在一起。

### 3. 日期由伺服器以 Asia/Taipei 計算

伺服器以 `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' })` 取得 `YYYY-MM-DD`，不接受客戶端傳入的日期。回應帶 `date`；頁面開著跨過午夜時，前端重新查詢並回到牌背。

### 4. 內容：新增固定內容類型 `TAROT`，沿用現有 body 欄位

- 金鑰：`<牌序 0–21>_<upright|reversed>`，文件編號 `TAROT_0_upright`，共 44 筆；`isValidContentKey` 與 `expectedFixedContentIds` 加入 `TAROT`。
- body 沿用 `fixedContentBodySchema`：`title` 牌名與方位、`summary` 今日訊息、`strengths` 關鍵字、`blindSpots` 要留意的面向、`loveStyle`／`workStyle` 感情與工作提示、`growthAdvice` 今日建議、`disclaimer` 免責聲明。
- 替代方案：獨立的 `tarotCards` 集合與 schema。彈性較大，但要重寫匯入與覆蓋檢查，對 44 筆內容不划算。

### 5. API：需登入的 `GET` 與 `POST /api/tarot/daily`

- `GET`：回傳 `{ date, drawn: false }` 或 `{ date, drawn: true, card, content }`，不寫入，頁面載入時使用。
- `POST`：翻牌；交易建立當天紀錄並回傳 `{ date, drawn: true, card, content }`。已翻過再呼叫，回傳既有結果且不重新計算，所以可安全重試。
- 皆由 `requireAuth` 取得 uid；不接受客戶端傳入身分或日期。回應設 `Cache-Control: private, no-store`。
- 內容尚未發佈時回 404，且**不寫入紀錄**（先讀內容、確認可交付再寫入，與固定內容先確認再扣點的做法相同）。
- 兩個端點都登記到 `openspec/analysis/render/api.yaml`。

### 6. 保留與刪除

- `expiresAt = drawnAt + 3 個月`，與其他探索結果的保存期限一致（RULE-014）。
- `scripts/provision-firebase.ts` 的 `EXPIRY_QUERY_GROUPS` 加入 `tarotDraws`（collection-group 的 `expiresAt` 索引例外）；`dataExpiry.service` 的到期清除納入 `tarotDraws`。
- `deletion.service` 刪除帳號時移除該使用者的 `tarotDraws`。

### 7. 前端

- `/tarot` 使用 `member` middleware；未登入導回首頁。
- 頁面：Banner、牌背（尚未翻）→ 點擊呼叫 `POST` → 翻牌動畫 → 內容（沿用 `FixedResultView` 風格）；已翻過則載入時直接顯示牌面。逆位以牌面旋轉呈現，文字保持正向。動畫遵守 `prefers-reduced-motion`。
- **插畫預留**：牌面元件接受選填的 `illustration` 圖片來源，`shared/constants/tarot.ts` 每張牌有 `illustration: null` 欄位；有圖時顯示圖，沒有就用羅馬數字與牌名排版。之後補圖只需放圖並填欄位。
- **首頁**：新增獨立區塊（位於四張維度卡與「現在就填寫」之間或之後，與維度卡視覺分開）。已登入：今天還沒翻顯示「翻今天的牌」，已翻顯示今天的牌名與方位並連到 `/tarot`；未登入：顯示說明與「立即登入」按鈕，不載入任何牌的內容。
- **側邊選單**：在「自我分析報告」之後新增「每日塔羅」項目。

## Risks / Trade-offs

- [內容尚未匯入時玩家看到 404] → 頁面顯示「今天的內容還在準備中」，且不寫入紀錄、不佔用當天機會；首頁區塊與選單項目在內容匯入後再開。
- [塔羅容易被讀成預言] → 內容統一用「可能、傾向、今天可以試試」的語氣並附免責聲明；不寫具體事件預測，也不談健康、法律、財務；逆位寫成「需要留意的面向」，不寫成壞牌。
- [並行翻牌] → 交易內先讀後寫、以日期為文件編號，後到的請求讀到既有紀錄直接回傳。
- [`TAROT` 納入覆蓋預期後，內容未匯入前覆蓋檢查未完成] → 與其他內容類型相同，匯入 44 筆即完整。
- [使用者在午夜附近翻牌] → 日期以伺服器翻牌當下的台北日期為準，回應的 `date` 明確標示。

## Migration Plan

1. 合併程式（含 `TAROT` 類型、API、頁面），首頁區塊與選單項目先以旗標關閉。
2. 執行 `scripts/provision-firebase.ts`，建立 `tarotDraws` 的 `expiresAt` 索引例外。
3. 撰寫 `content/fixed/tarot.json`（44 筆，先 DRAFT 審稿），改為 `PUBLISHED` 後匯入。
4. 確認覆蓋檢查完整、在瀏覽器翻出正位與逆位後，開啟首頁區塊與選單項目。
5. 回滾：關閉旗標即可；紀錄會隨到期清除，不需要資料遷移。

## Open Questions

- 插畫來源：公版牌面（例如 1909 年的經典牌組）、委託繪製或 AI 生成？授權與風格需要先決定。
- 首頁區塊的確切位置（四張維度卡之後，或「分析得更深入一點」之後）。
- 是否要在日後加入「抽牌歷史」頁？資料已保存 3 個月，加頁面不需要遷移。
