## Context

現有測驗流程（`tests/{testId}/versions/{v}`、`POST /api/tests/{id}/submissions`、`testAttempts`）的結果型別是 16 型之一（`mbtiTypeSchema`）、計分規則是二分類（`likert-dichotomies`）、固定內容取自 `MBTI`。大五人格是五個連續分數，結果型別、計分與內容都不同。固定內容、到期清除、刪除帳號、`member` middleware 等機制可以沿用。

## Goals / Non-Goals

**Goals:**
- 題目與計分是版本化的固定規則，可單元測試；結果文字事先寫好，不呼叫 AI（RULE-017）。
- 結果清楚說明「這是你自己在每個特質上的傾向」，不暗示診斷、不與他人比較。
- 與 MBTI 結果的對照由規則產生，不為每個組合預先存內容。
- 不改動現有 MBTI 測驗的程式與資料。

**Non-Goals:**
- 進入多維度分析的組合、HEXACO、facets、常模與百分位、歷史趨勢。

## Decisions

### 1. 題目與計分放在程式碼，不放資料庫

題目 50 題、特質對應、正反向與量表選項放在 `shared/constants/bigFive.ts`，附 `BIG_FIVE_VERSION`（例如 `ipip50-zh-v1`）；結果與紀錄保存所用版本。

- 為什麼：題目是公有領域量表的固定翻譯，不需要不經部署就修改；放程式碼可被測試、被型別檢查，也不必擴充現有 `tests` 集合與其 `likert-dichotomies` 結構。
- 替代方案：把題目放進 `tests/big-five/versions/*` 並把 `scoringRuleSchema` 改成可辨別聯集。可以沿用匯入腳本，但要同時改現有 schema、服務與前端的型別，風險落在已上線的 MBTI 流程上。
- 若將來需要不部署就改題目，再把定義搬到資料庫；因為計分函式是純函式、結果存了版本，搬移不影響舊紀錄。

### 2. 計分：反向題反轉、取平均、換算 0–100、分三級

- 5 點量表（1 非常不同意 … 5 非常同意）；反向題以 `6 - 作答` 反轉。
- 特質分數 = 該特質 10 題的平均，換算 `(平均 - 1) / 4 * 100`，四捨五入到整數。
- 等級：< 40 為低、40–60 為中、> 60 為高（常數集中在 `shared/constants/bigFive.ts`，可調整並有測試）。
- 計分在伺服器端重算：前端只送作答，伺服器驗證每題恰好一個 1–5 的值、再計分；前端顯示的分數以伺服器回傳為準。
- 為什麼不做百分位：沒有適用於台灣使用者的常模，對外說「前 X%」是不實的精準。結果文字只描述自己的傾向。

### 3. 與 MBTI 的對照：純函式，輸出「一致／有差異」

`compareWithMbti(scores, mbti)`：外向性對 E/I、開放性對 S/N（高 → N）、親和性對 T/F（高 → F）、盡責性對 J/P（高 → J）。大五等級為「中」時視為「居中」，不判定一致或差異；其餘高低與 MBTI 字母同向為「一致」，反向為「有差異」。每組對照取 `BIGFIVE` 的 8 筆固定內容之一。情緒敏感性在 MBTI 沒有對應，不參與。

- 為什麼用規則：只需 8 段文字，沒有組合爆炸，也不需要預先為每位使用者存結果。
- 風險：兩個模型本來就不是一一對應，「有差異」的說明要用「不同量表看的面向不完全相同」的語氣，不暗示其中一個是錯的。

### 4. 內容：新增固定內容類型 `BIGFIVE`

- 金鑰：特質內容 `<openness|conscientiousness|extraversion|agreeableness|neuroticism>_<low|mid|high>`（15 筆）；MBTI 對照 `compare_<ei|sn|tf|jp>_<match|differ>`（8 筆）。文件編號如 `BIGFIVE_openness_high`。
- body 沿用 `fixedContentBodySchema`：`title`、`summary`（這個等級是什麼樣子）、`strengths`、`blindSpots`、`loveStyle`／`workStyle`（關係與工作中的表現）、`growthAdvice`、`disclaimer`；其他選填欄位留空。
- `isValidContentKey`、`expectedFixedContentIds` 納入 `BIGFIVE`（新增 23 筆）。

### 5. 結果保存：新的子集合 `bigFiveAttempts`，到期清除

`users/{uid}/bigFiveAttempts/{attemptId}`：版本、作答、五個分數、完成時間、`expiresAt`（3 個月）。每次完成新增一筆；結果頁讀最新一筆。比照 `testAttempts` 加入 `EXPIRY_QUERY_GROUPS`（`scripts/provision-firebase.ts`）與到期清除，並在 `deletion.service` 刪帳號時移除。

- 替代方案：只存最新一份、每次覆蓋。更省，但無法在不改結構的情況下做歷史；而到期機制已就緒，沿用「每次一筆」較一致。

### 6. API：`POST /api/big-five/results`（選用登入）與 `GET /api/big-five/results/latest`（需登入）

- `POST`：Zod 驗證 `{ version, answers: [{ questionId, value }] }`；驗證每題恰好一次、值為 1–5；伺服器計分並回傳 `{ scores, levels, content, comparison, persisted }`。已登入者寫入 `bigFiveAttempts`；訪客只回傳結果（不寫入）。內容未發佈時回 404 且不寫入（先確認可交付再保存，同 MBTI）。
- `GET latest`：回傳最新未到期的結果（含內容與對照），無則 404。
- 路由登記到 `openspec/analysis/render/api.yaml`；訪客的 `POST` 設為公開。
- 訪客結果：前端放 `sessionStorage`（同 MBTI 的做法），登入後頁面顯示「儲存這次結果」，以保留的作答重新送出一次。

### 7. 前端

- `/big-five`：重用 MBTI 測驗頁的版型與已作答／未作答樣式；分頁、進度、送出。
- `/analysis/big-five`：五個特質的分數條（顯示等級與「你自己的傾向」文字）、每個特質的內容卡片、MBTI 對照區塊（無 MBTI 時顯示邀請去做測驗）、免責與「怎麼看」。
- 首頁維度區新增卡片；`/self-reports` 新增第六張卡片，有結果才亮起，並納入 `useExploration` 的進度判斷（不改變多維度分析的可選維度）。

## Risks / Trade-offs

- [使用者把結果當成診斷或「精準測量」] → 文字用「傾向」，標示為自我探索參考；結果頁固定放說明「分數只描述你在這個量表上的自我回答，不與他人比較，也不是診斷」。
- [翻譯題目的語意與信度] → 先以 IPIP 公開題目的忠實翻譯上線，標示為「參考版」；列入未解問題，上線後再檢視。
- [情緒敏感性的內容容易被讀成心理疾病] → 不使用診斷用語，只描述「對壓力的反應傾向」，並避免談到任何疾病、情緒障礙或治療。
- [與 MBTI 的差異讓使用者困惑] → 說明兩個量表看的面向不同，差異是了解自己的線索。
- [`BIGFIVE` 納入覆蓋預期後，內容未匯入前覆蓋檢查未完成] → 匯入 23 筆後即完整。
- [50 題對行動裝置使用者偏長] → 每頁 5 題、顯示進度，並允許離開前自動暫存於 `sessionStorage`，回來可繼續。

## Migration Plan

1. 合併程式（題目與計分、API、頁面），首頁與 `/self-reports` 的入口以旗標關閉。
2. 執行 `scripts/provision-firebase.ts` 建立 `bigFiveAttempts` 的索引例外。
3. 撰寫 `content/fixed/big-five.json`（23 筆，先 DRAFT 審稿），改為 `PUBLISHED` 後匯入。
4. 確認覆蓋檢查完整、在瀏覽器完成一次測驗並看到結果與 MBTI 對照後，開啟入口。
5. 回滾：關閉旗標；紀錄會隨到期清除，不需要資料遷移。

## Open Questions

- 題目是否要請有心理學背景的人審閱翻譯？
- 低／中／高的切點（40／60）是否合適，或改用三等分？
- 之後是否要把大五放進多維度分析？建議另開 change，並改為「讀取時以規則產生」，避免內容組合爆炸。
- 結果頁是否要用雷達圖？目前規劃為分數條，較容易在手機上閱讀。
