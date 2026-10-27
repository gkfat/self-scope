## Context

`add-daily-tarot-draw` 實作完成後，專案有：決定性的 `drawDailyCard(uid, dateKey)`（SHA-256 `uid|dateKey|tarot-v1`）、台北日期換算、`users/{uid}/tarotDraws/{date}` 的「不存在才建立」交易、`TarotService`／`TarotRepository`、`TAROT` 固定內容、到期清除與刪帳號的處理。

盧恩與塔羅的差別只有：符號數量（24 對 22）、逆位規則（9 枚對稱符文不可逆）、內容類型與頁面。其餘都相同。專案原則是「第二個使用者出現時才抽共用機制」，現在盧恩就是第二個。

## Goals / Non-Goals

**Goals:**
- 盧恩的行為與塔羅一致：每帳號每台北日期一次、並行不重複、跨裝置一致、內容未發佈時不佔用機會。
- 抽出塔羅與盧恩共用的部分，塔羅的對外行為與既有測試**完全不變**。
- 逆位規則明確且可測試：9 枚對稱符文永遠是正位。

**Non-Goals:**
- 空白符文、其他符文系統、牌陣、歷史頁、重抽、AI 解讀。
- 為尚不存在的第三個抽取型預留彈性（只抽出現有兩者共有的部分）。

## Decisions

### 1. 共用機制：以「設定」區分，不做繼承層級

抽出一個每日抽取模組，把兩者共有的行為集中，差異以設定物件傳入：

- **設定**：`collection`（`tarotDraws`／`runeDraws`）、`contentType`（`TAROT`／`RUNE`）、`symbolCount`（22／24）、`drawVersion`（`tarot-v1`／`rune-v1`）、`isReversible(symbolIndex)`（塔羅恆為真；盧恩查表）。
- **共用**：決定性選取（雜湊 → 符號序號與方位位元）、「先讀內容確認可交付，再於交易中不存在才建立」、`getToday`、紀錄的 `expiresAt` 與到期清除、刪帳號。
- 塔羅與盧恩各自只留薄薄一層：設定、內容金鑰組合、API 路由。
- 實際分成兩塊：`shared/utils/dailyDraw.ts` 的 `pickDailySymbol(rule, uid, dateKey)`（純函式，`rule` 為符號數量、版本字串與 `isReversible`），以及 `server/services/dailyDraw.engine.ts` 的 `DailyDrawEngine`（設定 `contentType`、`drawVersion`、`retentionMonths`、`pick`、`contentKey`，加上紀錄與文件互轉的 `toDocument`／`fromDocument`）。紀錄在引擎內一律以 `symbolIndex` 表示；塔羅的儲存文件仍用原有的 `cardIndex` 欄位名，由它自己的 `toDocument`／`fromDocument` 對應，所以資料格式不變。
- 為什麼用設定而不用基底類別繼承：差異都是資料（名稱與數量），不是行為；設定物件最直白，也最不會讓下一個人猜「哪個行為被覆寫了」。
- 替代方案：把兩個集合合併成單一 `dailyDraws`（加 `drawType` 欄位）。需要資料遷移與重寫到期清除索引，且塔羅已依 `tarotDraws` 設計與上線，不值得；維持兩個集合、共用程式碼即可。
- 塔羅的決定性結果**不得改變**：雜湊輸入字串、取位元組的方式與 `tarot-v1` 版本維持原樣；以既有的單元測試（固定輸入得固定輸出）作為回歸。

### 2. 盧恩的決定性選取與逆位規則

`drawDailyRune(uid, dateKey)`：SHA-256 `uid|dateKey|rune-v1`，前 4 位元組 `% 24` 為符文序號，下一個位元組最低位決定方位；**若該符文不可逆，方位強制為正位**。

- 先取方位位元、再套用可逆規則，而不是先判斷可逆再決定要不要取位元，使雜湊的使用方式固定，不因符文不同而改變。
- 符文的序號與名稱依標準 Elder Futhark 順序（Fehu 至 Othala）。9 枚不可逆符文的清單寫在 `shared/constants/runes.ts` 的 `reversible: false`，由單元測試鎖定。
- 版本字串 `rune-v1` 寫進雜湊與紀錄，日後換規則不會與舊紀錄混淆。
- 紀錄讀回時以 schema 驗證：對稱符文的逆位紀錄視為不合法而拒絕。

### 3. 固定內容：新增 `RUNE` 類型，39 筆

- 金鑰 `<序號 0–23>_<upright|reversed>`，文件編號例如 `RUNE_0_upright`；逆位只對 15 枚可逆符文合法，對稱符文的 `_reversed` 金鑰視為**不合法**，`isValidContentKey` 會拒絕。
- 筆數：24 + 15 = 39；`expectedFixedContentIds` 加入這 39 筆。
- 符文名稱用英文原名加中文字義（例如 Fehu 牲畜與財富），不另訂中文譯名。Kenaz 的原始日耳曼語重建字義有爭議，沿用占卜通行的「火炬」；Perthro 字義不確定，標為「常解為骰杯與命運」。
- body 沿用 `fixedContentBodySchema`：`title` 符文名與方位、`summary` 今日訊息、`strengths` 關鍵字、`blindSpots` 需留意的面向、`growthAdvice` 今日建議、`disclaimer` 免責。逆位寫成「需要留意的面向」，不寫成壞符。

### 4. API 與存取規則

與塔羅同形：`GET`／`POST /api/rune/daily`，`requireAuth`，回應為 `DailyRuneState`（`drawn: false` 只有 `date`；`drawn: true` 另含 `rune`（序號、名稱、字形、字義、方位、插畫來源）與 `content`），`Cache-Control: private, no-store`。內容未發佈回 404 且不寫入。路由由 `routeAccess` 的預設規則（需登入）涵蓋，並補進 `api.yaml`。

### 5. 前端

- **今日運勢頁（`/fortune`）的第 3 張入口卡片**：盧恩與塔羅、瑪雅 Kin 同在今日運勢頁，先以入口卡片（三張時一列三欄）呈現，點擊後在同一頁顯示符文內容（`components/fortune/RunePanel.vue`）與返回按鈕，網址為 `#rune`。舊的 `/rune` 轉址到 `/fortune#rune`。
- **抽符畫面**：24 顆符石全部背面朝上散落在畫面上（`components/rune/Scatter.vue`），各自略微位移與傾斜（固定的偽隨機）、彼此不相碰；點選任一顆後其餘淡出、換成大符石翻開，顯示字形、名稱、字義與今日內容。**點哪一顆結果都相同**（符文由帳號與日期決定），所以散落的符石背面全部相同、不顯示各自的字形。
- 逆位以字形旋轉 180° 呈現，文字保持正向（`components/rune/Stone.vue`）；遵守 `prefers-reduced-motion`。符文字形使用 Unicode 符文字元（ᚠ ᚢ ᚦ …），沒有插畫時以字形與名稱排版；預留插畫欄位。
- **首頁**：「今日運勢」區塊（與塔羅、瑪雅 Kin 共用，`components/fortune/HomeEntry.vue`）多一行盧恩：已登入顯示抽取狀態或今天的符文，未登入顯示說明與「立即登入」，不載入內容。側邊選單維持單一「今日運勢」，不另開「每日盧恩」。
- **旗標**：入口由 `shared/constants/runes.ts` 的 `RUNE_ENTRY_ENABLED`（code 常數，沿用 `BAZI_ENTRY_ENABLED` 的做法）控制；關閉時 `/fortune` 不出現盧恩卡片、首頁不出現盧恩行。

## Risks / Trade-offs

- [重構動到已上線的塔羅，造成行為改變] → 塔羅既有測試全數保留作為回歸；雜湊輸入與版本字串不動；重構與盧恩分成不同的任務群組，先重構並確認塔羅測試全綠，再加盧恩。
- [對稱符文清單有誤，使某枚符文錯誤地出現逆位或缺少逆位] → 清單來自已確認的 9 與 15 枚（user 提供），寫在單一常數並以測試鎖定；內容匯入時 `_reversed` 金鑰的合法性由同一份常數判定。
- [符文被讀成預言] → 內容用「可能、傾向、今天可以試試」的語氣並附免責聲明；不談健康、法律、財務。
- [內容 39 筆撰寫與審稿] → 量不大，可與塔羅內容一起審稿。
- [與 `add-today-section` 的入口重疊] → 盧恩已併入「今日運勢」頁，之後由 `add-today-section` 把該頁收進「此刻／今日」。

## Migration Plan

1. 先重構：把塔羅改為使用共用機制，確認塔羅測試與行為完全不變。
2. 加入盧恩（常數、選取、`RUNE` 類型、API、今日運勢頁的盧恩面板）；入口先以旗標 `RUNE_ENTRY_ENABLED` 關閉。
3. 執行 `scripts/provision-firebase.ts`，建立 `runeDraws` 的 `expiresAt` 索引例外。
4. 撰寫 `content/fixed/rune.json`（39 筆，先 DRAFT 審稿），改為 `PUBLISHED` 後匯入，確認覆蓋檢查完整，並實際抽出正位與逆位各一次。
5. 把 `RUNE_ENTRY_ENABLED` 改為 `true`。回滾：關閉旗標；紀錄隨到期清除，不需資料遷移；共用機制的重構因行為不變，不需回滾。

## Open Questions

- 符文名稱已採英文原名加中文字義，不另訂中文譯名；若之後要改用中文譯名，調整 `shared/constants/runes.ts` 並同步修訂內容文案。
