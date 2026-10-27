## Why

首頁目前的分析都是「做一次就看完」，使用者沒有理由每天回來。每日一張塔羅牌是低門檻、免費、每天都有新內容的輕量互動，可以提高回訪率，也成為登入的一個具體理由（需要登入才能翻牌）。

## What Changes

- 新增「每日塔羅」頁（`/tarot`）：**需登入**。使用者點擊牌背翻牌，翻開當天的一張大阿爾克那（22 張），含正位／逆位，顯示牌名、關鍵字、今日訊息與建議。
- **每個帳號每天只能翻一次**：第一次翻牌時寫入當天的紀錄（`users/{uid}/tarotDraws/{台北日期}`），之後同一天一律回傳這份紀錄；日期以台北時間（UTC+8）換日。
- 牌由「帳號 + 日期」決定性地選出，同一天不會因為重試或換裝置而不同；紀錄保存 3 個月，到期自動清除，刪除帳號時一併刪除。
- 免費、不扣點。
- 新增固定內容類型 `TAROT`：22 張牌 × 正逆位共 44 筆，事先寫好、不呼叫 AI，沿用固定內容的匯入、版本與覆蓋檢查。
- 新增 API：`GET /api/tarot/daily`（今天是否已翻、已翻則含牌與內容）與 `POST /api/tarot/daily`（翻牌；已翻過則回傳既有結果）。皆需登入。
- 首頁新增**獨立的「每日塔羅」區塊**（與四張維度卡分開）：已登入顯示「翻今天的牌」或今天的牌；未登入顯示登入的提示與按鈕。
- 側邊選單新增「每日塔羅」項目。
- 翻開後的解讀分為今日主題、關鍵字、可以留意的地方（感情、工作、自我、人際）、今天可以試試，以及以卡片呈現的「進一步閱讀」（正逆位對照、光明面與陰影面、內在衝突與成長課題、反思問題、牌面象徵、傳統牌義與現代詮釋）；進一步閱讀為 22 張牌的固定文字。
- 牌面先以文字與符號排版，**之後會補插畫**：牌面元件預留插畫欄位，本次不做。
- 內容明確標示為娛樂與自我反思參考，不預測未來、不給醫療／法律／財務建議。

**不在本次範圍**：小阿爾克那（56 張）、牌陣、抽牌歷史頁、以點數重抽、AI 解牌、分享圖片、與多維度分析結合、牌面插畫。

## Capabilities

### New Capabilities
- `daily-tarot`: 每日抽牌（每帳號每日一次）的規則與紀錄、`TAROT` 固定內容、需登入的 API、抽牌頁與首頁／選單入口

### Modified Capabilities
<!-- 專案目前沒有已歸檔的主 specs（openspec/specs/ 為空）；固定內容類型新增 TAROT、資料到期清除與刪帳號納入 tarotDraws，寫在 daily-tarot 的需求中 -->

## Impact

- **新增**：`app/pages/tarot.vue`、牌面元件、首頁區塊、`server/api/tarot/daily.get.ts` 與 `daily.post.ts`、`server/services/tarot.service.ts`、`server/repositories/tarot.repository.ts`、`shared/utils/tarot.ts`、`shared/constants/tarot.ts`、`shared/schemas/firestore/tarot.schema.ts`、`shared/schemas/api/tarot.schema.ts`、`shared/constants/tarotMeanings.ts`（進階解讀，22 張）、`app/composables/useDailyTarot.ts`、`app/components/tarot/`（牌面與進一步閱讀）。
- **修改**：`shared/utils/fixedContentKeys.ts`（加入 `TAROT`）、`server/utils/routeAccess.ts`、`openspec/analysis/render/api.yaml`、`server/services/dataExpiry.service.ts`（含 cron 結果的 `deletedTarotDraws`）與 `scripts/provision-firebase.ts`（到期清除與索引例外）、`server/services/deletion.service.ts`（刪帳號）、側邊選單與首頁。
- **內容**：新增 `content/fixed/tarot.json`（44 筆，需撰寫與匯入）。
- **依賴**：不新增套件。
- **費用**：每位使用者每天最多 1 次寫入、少量讀取，在免費額度內。
