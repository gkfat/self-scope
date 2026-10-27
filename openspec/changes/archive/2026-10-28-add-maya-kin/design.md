## Context

專案已有「固定內容」機制：事先寫好的內容存在 Firestore `fixedContents/{type}_{key}`，由 `FixedContentService.getPublished` 讀取，以 `pnpm content:import` 匯入並做版本與覆蓋檢查（`shared/utils/fixedContentKeys.ts` 的 `isValidContentKey`、`expectedFixedContentIds`）。單項固定結果（星座、血型、MBTI、生命靈數、八字）都是公開的 `GET /api/fixed-results/*`，不需登入、不儲存。會員資料放在 `users/{uid}` 的子集合，並有到期清除（`dataExpiry.service`，以 collection group 的 `expiresAt` 查詢）與刪除帳號（`deletion.service`）的機制。

`add-daily-tarot-draw` 已落地「每帳號每台北日期一次、以日期為文件編號、交易內不存在才建立」的做法；今日 Kin 的解鎖與它同形，只是沒有「抽」的步驟。每日塔羅與今日 Kin 在前端合併為同一頁「今日運勢」（`/fortune`）。

## Goals / Non-Goals

**Goals:**
- 同一日期在任何入口都得到同一個 Kin（生日與今日共用同一套計算）。
- 今日 Kin：每會員每台北日期可計算一次，解鎖後當天查看不限次數；並行請求只留下一筆紀錄。
- 生日 Kin 與今日 Kin 各 260 筆固定內容，分開撰寫，沿用匯入與覆蓋檢查。

**Non-Goals:**
- Kin 的關聯、波符、13 月亮曆月日對照、圖像、Kin 單獨的 AI 解讀、分享、訪客使用今日 Kin、區塊整併。

## Decisions

### 1. Kin 計算：以參考日期推算，跳過 2 月 29 日

Dreamspell 的 Kin 每天加一、滿 260 回到 1，且 **2 月 29 日不計入**。計算方式：取一個已知 Kin 的參考日期，算目標日期與參考日期之間的天數，**扣掉其間經過的 2 月 29 日數**，加上參考 Kin 後對 260 取餘。目標日期本身是 2 月 29 日時，改用同年 2 月 28 日。

- 圖騰 = `((kin - 1) mod 20) + 1`，調性 = `((kin - 1) mod 13) + 1`。
- 參考日期採 **1987-06-23 = Kin 1**，取自公開的 Dreamspell 對照表（yokai.jp 的年份對照），並以多個獨立的已知日期驗證（含跨越閏年、2/29 當天與 1900 年代出生）；驗證用的日期與期望值寫進測試，不憑記憶設定。獨立錨點：2012-12-21 = Kin 207（水晶的藍手），以本算法從參考日算出的結果與之相符。
- 驗證期望值取自該表的「年份與月份」基準值（Kin = 基準值 + 日，超過 260 減 260），不用它文字說明的「閏年 3 月加 1」規則：表內的數字（例如 2012：Feb 143、Mar 171、Apr 202）顯示 3 月不需再加，且該站的逐日頁面套用那條規則後會出現 3/31 與 4/1 同一個 Kin、2/29 自己有 Kin，與 2/29 不計入矛盾。
- 純函式，放在 `shared/utils/mayaKin.ts`，輸入 ISO 日期字串、輸出 `{ kinNumber, solarSeal, galacticTone }`，不依賴時區（輸入已是日期）。20 圖騰與 13 調性的名稱放 `shared/constants/mayaKin.ts`，完整名稱為「調性的顏色圖騰」，例如 Kin 207 是「水晶的藍手」。
- 為什麼：不需要查表或外部資料；2/29 規則集中在一處，生日與今日共用，不會出現兩邊結果不一致。
- 替代方案：預先產生 1900 至 2100 的日期對照表。查詢快，但資料量大、也多一份需要驗證的資料，沒有必要。

### 2. 今日 Kin 的日期與解鎖：沿用「日期即文件編號」

- 伺服器以 `Asia/Taipei` 換算今天的日期（00:00 換日），不接受客戶端傳入的日期。
- `POST /api/kin/today`：在交易內讀 `users/{uid}/kinUnlocks/{date}`，不存在才建立並回傳 Kin 與內容；已存在直接回傳，所以可安全重試與並行。**不扣點**。
- `GET /api/kin/today`：已解鎖回傳 Kin 與內容；未解鎖只回傳 `{ date, unlocked: false }`，**不洩漏今天的 Kin**（由日期可推算，但伺服器不主動給）。
- 紀錄內容：`kin`（當日 Kin 的快照）、`unlockedAt`、`expiresAt`（+3 個月）。查看次數不存、不限。
- 先讀固定內容、確認可交付，再寫入紀錄；內容未發佈回 404 且不寫入，與固定內容「先確認再交付」的做法相同。
- 替代方案：不存紀錄，只在前端記錄「已按過」。無法跨裝置、也無法限制每日一次，不符合「需要限量」的目的。

### 3. 固定內容：兩個新類型，金鑰為 Kin 編號

- `KIN_BIRTH` 與 `KIN_TODAY`，金鑰為 `"1"` 至 `"260"`，文件編號例如 `KIN_BIRTH_1`、`KIN_TODAY_260`；`isValidContentKey` 與 `expectedFixedContentIds` 各加入 260 筆。
- body 沿用 `fixedContentBodySchema`，欄位意義各自重新詮釋：`title` 為 Kin 名稱（例如「紅色的月亮」之類的組合名）、`summary` 為本質或今日訊息、`strengths` 為關鍵字、`growthAdvice` 為建議，並含 `disclaimer`。今日 Kin 側重「今天可以留意的事」，生日 Kin 側重「恆定的特質」。
- 為什麼分開兩個類型：兩者語氣與用途不同（已確認各寫一份）；分開才能各自版本管理、各自覆蓋檢查，且內容尚未寫完時可以先上線其中一個。
- 替代方案：單一 `KIN` 類型共用一份。寫作量減半，但今日與生日的語氣會互相遷就；已決定不採用。
- 撰寫方式：520 筆內容由「20 個圖騰素材 × 13 個調性素材」組成固定文字（生日版與今日版用不同的素材與句型各組一次），每一筆都不同，但句型相近，不是逐篇獨立手寫；圖騰與調性素材先審稿，其餘由它們決定。

### 4. API 與存取規則

- `GET /api/fixed-results/maya-kin?birthDate=YYYY-MM-DD`：公開（既有 `^/api/fixed-results/.+` 規則已涵蓋），回傳 `{ kin, content }`；日期須為真實且不在未來的日期，否則 400。
- `GET`／`POST /api/kin/today`：不需新增規則，沿用 `routeAccess` 的預設 `required`；handler 仍用 `requireAuth` 取得 uid。回應設 `Cache-Control: private, no-store`；形狀為 `KinTodayState`（`unlocked: false` 只有 `date`；`unlocked: true` 另含 `kin` 與 `content`）。
- 生日 Kin 的計算與取內容放在 `MayaKinService`，今日 Kin 的解鎖放在 `KinUnlockService`，handler 只做驗證與回應。
- 生日 Kin 的「是否須登入」沿用單項免費結果（公開）；若之後決定要登入，只需在 `routeAccess` 調整，不影響計算。

### 5. 共用的台北日期工具

「換算台北日期」`taipeiDateKey(now)` 放在 `shared/utils/time.ts`。`add-daily-tarot-draw` 先落地時放在 `shared/utils/tarot.ts`；本 change 把它移到 `shared/utils/time.ts`（測試一併移動），塔羅與今日 Kin 都從那裡引用，不重複實作。

### 6. 前端

- **今日運勢頁（`/fortune`，`member` middleware）**：每日塔羅與今日 Kin 合併為同一頁，先以一列兩欄的入口卡片分別標示「塔羅」與「瑪雅 Kin」（只有入口，不使用分頁，也不預先載入內容）；點擊後在同一頁顯示該項的獨立面板（`components/fortune/TarotPanel.vue`、`KinPanel.vue`）與返回按鈕。開啟的項目放在網址的 hash（`#tarot`、`#kin`），所以瀏覽器的上一頁、重新整理、首頁連結與舊網址 `/tarot`、`/kin`（轉址到 `/fortune#tarot`、`/fortune#kin`）都能直接開到對應內容。
- 今日 Kin 面板：未解鎖只顯示「計算今日 Kin」按鈕（不另加說明文字）；點擊呼叫 `POST`；已解鎖載入時直接顯示 Kin 名稱、圖騰與調性、今日關鍵字、今天可以留意的事與今天可以試試。跨過台北午夜時重新查詢並回到未解鎖。
- 生日 Kin 頁（`/analysis/maya-kin`）：由個人資料的生日取得，沿用生命靈數頁的版型；沒填生日時引導去填寫。
- 圖騰與調性先以文字與編號呈現（`components/kin/Badge.vue`），預留圖像欄位，本次不做圖。
- 首頁新增「瑪雅 Kin」小卡片（命理系統）；今日 Kin 的首頁入口與每日塔羅合併為同一個「今日運勢」區塊（`components/fortune/HomeEntry.vue`，每個開啟的部分各一行），側邊選單為單一「今日運勢」項目。
- **旗標**：入口由 `shared/constants/mayaKin.ts` 的 `KIN_ENTRY_ENABLED`（code 常數，沿用 `BAZI_ENTRY_ENABLED` 的做法）控制；關閉時 `/fortune` 不出現 Kin 入口、首頁不出現 Kin 卡片與今日 Kin 行。入口之後由 `add-today-section` 收進「此刻／今日」區塊。

### 7. 多維度分析與自我分析報告頁

- **自我分析報告頁**：命理與象徵系統新增「瑪雅 Kin」卡片（需出生日期，完成後顯示 Kin 名稱），受 `KIN_ENTRY_ENABLED` 控制。
- **多維度分析新增維度 `MAYA_KIN`**（`REPORT_DIMENSIONS` 第 7 個）：
  - 只能走 AI 生成：寫好的多維度摘要只涵蓋星座、MBTI、血型、生命靈數（已有 14320 種組合），加上 Kin 會再乘 260，無法事先寫完。所以 `isGeneratedAnalysis` 在含 Kin 時為真，與人類圖、八字相同；維度數的權重在 5 個以上維持不變，總價上限 30 點不變。
  - 基礎價 1 點（與同樣只由出生日期算出的生命靈數相同）。例如星座加 Kin 為 (1 + 1) × 1 × 1.5 = 3 點。
  - 給模型的事實（`server/mayaKin/reportFacts.ts`）：Kin 編號、全名、圖騰與調性的名稱、英文名與關鍵字；MUST NOT 含出生日期。提示詞說明這是娛樂性的輔助角度，只談性格傾向，不談吉凶或預測具體事件。
  - 需要出生日期；沒有時回 422 `PROFILE_REQUIRED`。組合紀錄新增 `kinNumber`（舊報告沒有，預設 null）。
  - 報告頁的維度選項受 `KIN_ENTRY_ENABLED` 控制；已含 Kin 的舊報告仍完整顯示。
- 為什麼先不放進預設勾選：預設仍從不需 AI 的寫好內容維度（最便宜）開始，Kin 需自行勾選。

## Risks / Trade-offs

- [Kin 算錯，生日與今日全部跟著錯] → 以公開對照表的多個獨立日期驗證（含閏年與 2/29），期望值寫進測試；計算只有一處。
- [520 筆內容撰寫與審稿的工作量大] → 兩個類型分開版本與覆蓋檢查，可先上線生日 Kin 或今日 Kin；內容未寫完時入口與選單項目以旗標關閉，API 對缺內容回 404。內容由素材組合而成（見決策 3），審稿重點放在 20 份圖騰素材與 13 份調性素材。
- [組合式文字讀起來句型相近] → 生日版與今日版用不同素材與句型，每筆摘要都不同；不宣稱是逐篇獨立撰寫。
- [Kin 被讀成預言] → 內容統一用「可能、傾向、今天可以試試」的語氣並附免責聲明；不談健康、法律、財務。
- [今日 Kin 可由日期自行推算，「解鎖」其實擋不住有心人] → 這裡的「限量」是產品上的每日一次體驗，不是安全邊界；伺服器不主動洩漏未解鎖的 Kin，但不宣稱無法推算。
- [與塔羅共用到期清除、索引例外與刪帳號程式碼] → 塔羅已先落地，本 change 只是在同一處再加一個集合名稱 `kinUnlocks`。
- [Kin 讓多維度分析多了一種必須由 AI 生成的組合，成本與提示詞品質要觀察] → 基礎價 1 點、仍受 30 點上限；提示詞明確限制語氣；報告仍經既有的品質檢查。
- [使用者在午夜附近解鎖] → 日期以伺服器當下的台北日期為準，回應的 `date` 明確標示。

## Migration Plan

1. 合併程式（Kin 計算、`KIN_BIRTH`／`KIN_TODAY` 類型、API、頁面）；首頁入口、今日運勢的 Kin 入口與選單項目先以旗標 `KIN_ENTRY_ENABLED` 關閉。
2. 執行 `scripts/provision-firebase.ts`，建立 `kinUnlocks` 的 `expiresAt` 索引例外。
3. 撰寫並審稿 `content/fixed/maya-kin-birth.json` 與 `maya-kin-today.json`（各 260 筆，先 DRAFT），改為 `PUBLISHED` 後匯入。
4. 確認覆蓋檢查顯示兩類各 260 筆完整，在瀏覽器確認生日 Kin、今日 Kin 解鎖與已解鎖狀態後，開啟入口與選單。
5. 回滾：關閉旗標即可；解鎖紀錄會隨到期清除，不需要資料遷移。

## Open Questions

- 譯名已採常見的 Dreamspell 中文譯名：圖騰為紅龍、白風、藍夜、黃種子、紅蛇、白世界橋、藍手、黃星星、紅月、白狗、藍猴、黃人、紅天行者、白巫師、藍鷹、黃戰士、紅地球、白鏡、藍風暴、黃太陽；調性為磁性、月亮、電力、自我存在、超頻、韻律、共振、銀河星系、太陽、行星、光譜、水晶、宇宙。若要改採其他譯名，只需調整 `shared/constants/mayaKin.ts`，內容文案需對應修訂。
- 生日 Kin 是否之後要對訪客限制（目前公開）？
