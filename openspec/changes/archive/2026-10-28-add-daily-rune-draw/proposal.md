## Why

每日塔羅（`add-daily-tarot-draw`）提供了「每天回來抽一次」的輕量互動。盧恩符文是同一類內容：抽一枚符文，得到今天的提示。它與塔羅的機制幾乎相同（每帳號每台北日期一次、結果由帳號與日期決定、固定內容、免費），所以在塔羅上線後，把共用的抽取機制抽出來，並加入盧恩作為第二個使用者。專案原則是第二個使用者出現時才抽共用機制，不預先設計，現在正是這個時機。

## What Changes

- 新增「每日盧恩」：併入「今日運勢」頁（`/fortune`），**需登入**。使用者從散落的 24 顆符石中點選一顆，翻出當天的一枚 **Elder Futhark** 符文（24 枚），含正位與逆位，顯示符文名稱、字形、關鍵字、今日訊息與建議。
- **逆位只適用於方向可辨識的符文**：15 枚（Fehu、Uruz、Thurisaz、Ansuz、Raidho、Kenaz、Wunjo、Perthro、Algiz、Tiwaz、Berkano、Ehwaz、Mannaz、Laguz、Othala）可抽到正位或逆位；9 枚上下旋轉 180° 後外觀不變的符文（Gebo、Hagalaz、Nauthiz、Isa、Jera、Eihwaz、Sowilo、Ingwaz、Dagaz）只有正位。不含空白符文。
- **每個帳號每天只能抽一次**：第一次抽取寫入 `users/{uid}/runeDraws/{台北日期}`，之後同一天一律回傳這份紀錄；符文由「帳號 + 日期」決定性地選出，保存 3 個月，刪除帳號時一併刪除。免費、不扣點。
- 新增固定內容類型 `RUNE`：24 枚正位 + 15 枚逆位 = **39 筆**，事先寫好、不呼叫 AI，沿用固定內容的匯入、版本與覆蓋檢查。
- 新增 API：`GET /api/rune/daily` 與 `POST /api/rune/daily`，皆需登入。
- **抽出每日抽取的共用機制**：把塔羅中與「抽什麼」無關的部分（決定性選取、台北日期、當日一次的交易建立、紀錄的到期與刪除）改成可由塔羅與盧恩共用，塔羅的對外行為**完全不變**。
- 盧恩成為「今日運勢」頁的第 3 張入口卡片，首頁「今日運勢」區塊多一行盧恩，舊網址 `/rune` 轉址；側邊選單維持單一「今日運勢」。入口由旗標控制。符文字形先以 Unicode 符文字元排版，不做插畫。
- 內容標示為娛樂與自我反思參考，不預測未來、不給醫療／法律／財務建議。

**不在本次範圍**：空白符文、其他符文系統（Younger Futhark、Anglo-Saxon）、多符文牌陣、抽取歷史頁、重抽、AI 解讀、分享圖片、「此刻／今日」區塊整併（`add-today-section`）。

## Capabilities

### New Capabilities
- `daily-rune`: 每日抽符（每帳號每日一次）的規則與紀錄、逆位規則、`RUNE` 固定內容、需登入的 API、抽符頁與入口

### Modified Capabilities
<!-- 專案目前沒有已歸檔的主 specs（openspec/specs/ 為空）；塔羅抽出共用機制屬實作重構，對外行為不變，不改 daily-tarot 的需求 -->

## Impact

- **前置**：`add-daily-tarot-draw` 必須先實作完成，本 change 在其程式碼之上重構。
- **新增**：`shared/constants/runes.ts`（24 枚符文與是否可逆）、`shared/utils/rune.ts`、`shared/schemas/firestore/runeDraw.schema.ts`（或共用的抽取紀錄 schema）、`server/api/rune/daily.get.ts` 與 `daily.post.ts`、`app/components/fortune/RunePanel.vue`、`app/components/rune/`（符石與散落）、`app/composables/useDailyRune.ts`、`shared/utils/dailyDraw.ts`、`server/services/dailyDraw.engine.ts`。
- **重構（行為不變）**：塔羅的抽取、紀錄與服務邏輯抽成共用的每日抽取模組（決定性選取、當日一次的建立、repository／service 骨架），由塔羅與盧恩各自設定集合名稱、符號數量、內容類型與可逆規則。
- **修改**：`shared/utils/fixedContentKeys.ts`（加入 `RUNE`）、`server/utils/routeAccess.ts`、`openspec/analysis/render/api.yaml`、`server/services/dataExpiry.service.ts` 與 `scripts/provision-firebase.ts`（`runeDraws`）、`server/services/deletion.service.ts`、首頁與側邊選單。
- **內容**：新增 `content/fixed/rune.json`（39 筆，需撰寫與匯入）。
- **依賴**：不新增套件。
- **費用**：每位使用者每天最多 1 次寫入，在免費額度內。
