## Why

目前唯一的測驗是 16 型人格（MBTI 風格），結果是「你是哪一型」的二分類。大五人格以五個連續維度描述特質，能呈現「程度」而不是「非此即彼」，也是心理學界較常使用的模型。加入它可以讓使用者看到自己在每個特質上偏高還是偏低，並與已有的 MBTI 結果互相對照（例如 MBTI 說內向、大五外向性卻偏高），讓多個角度之間的「呼應與拉扯」更有內容可講，同時不需要 AI：題目與計分是固定的，結果文字事先寫好。

## What Changes

- 新增「大五人格」測驗（`/big-five`）：50 題，5 點量表，每個特質 10 題（含反向題），一次一頁，作答中可看進度，已作答與未作答的題目有明顯區別。
- 題目採用公有領域的 IPIP 50 題量表（Goldberg）的繁體中文自行翻譯版；不使用有版權的商業量表。
- 計分為固定規則：反向題反轉後取每個特質的平均，換算成 0–100 的「傾向強弱」，並分成低／中／高三級；**不稱為「百分位」或與他人比較**，只描述使用者自己在這個特質上的傾向。
- 新增結果頁：五個特質的分數條與各自的說明（開放性、盡責性、外向性、親和性、情緒敏感性），每個特質依等級顯示事先寫好的內容；附「怎麼看」的說明與免責聲明。
- **與 MBTI 對照**：若使用者已有 MBTI 結果，結果頁多一個區塊，用規則比對四組對應（外向性↔E/I、開放性↔S/N、親和性↔T/F、盡責性↔J/P），顯示「一致」或「有差異」並附事先寫好的說明。差異是洞見，不是錯誤。
- 結果保存：登入者保存 3 個月（與其他測驗結果一致），到期自動清除，刪帳號一併刪除；訪客的結果只留在這次瀏覽器的 session，登入後可選擇儲存。
- 新增固定內容類型 `BIGFIVE`：5 特質 × 3 等級共 15 筆，外加 MBTI 對照的 8 筆（4 組 × 一致／有差異），共 23 筆，事先寫好、不呼叫 AI。
- 入口：首頁維度區新增「大五人格」卡片、「自我分析報告」頁新增第六張卡片（有結果時亮起）。
- 不依賴 AI，不扣點，免費。

**不在本次範圍**：把大五放進多維度分析的組合（會讓組合內容倍增，另開 change 改為讀取時用規則產生）、HEXACO、各特質的細項（facets）、與常模比較的百分位、歷史趨勢、對外宣稱「精準測量」。

## Capabilities

### New Capabilities
- `big-five-test`: 大五人格測驗的題目與計分、結果的保存與到期、與 MBTI 的對照，以及 `BIGFIVE` 固定內容

### Modified Capabilities
<!-- 專案目前沒有已歸檔的主 specs（openspec/specs/ 為空）；固定內容類型新增 BIGFIVE、資料到期清除與刪帳號納入 bigFiveAttempts，寫在 big-five-test 的需求中 -->

## Impact

- **新增**：`app/pages/big-five.vue`（測驗）、`app/pages/analysis/big-five.vue`（結果）、`shared/constants/bigFive.ts`（題目與特質）、`shared/utils/bigFiveScoring.ts`、`shared/utils/bigFiveMbtiComparison.ts`、`shared/schemas/firestore/bigFive.schema.ts` 與 API schema、`server/services/bigFive.service.ts` 與 repository、`server/api/big-five/*`。
- **修改**：`shared/utils/fixedContentKeys.ts`（加入 `BIGFIVE`）、`server/utils/routeAccess.ts`、`openspec/analysis/render/api.yaml`、`server/services/dataExpiry.service.ts`、`scripts/provision-firebase.ts`、`server/services/deletion.service.ts`、首頁與 `/self-reports`。
- **內容**：新增 `content/fixed/big-five.json`（23 筆，需撰寫與匯入）。
- **依賴**：不新增套件。
- **刻意不動**：現有 MBTI 測驗的結構與 API（它的結果型別與計分都綁定 16 型），避免回歸風險。
