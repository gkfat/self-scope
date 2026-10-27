## 1. 題目與計分

- [ ] 1.1 新增 `shared/constants/bigFive.ts`：5 個特質、50 題（IPIP 50 題的繁體中文自行翻譯，標示正反向與所屬特質）、5 點量表選項、`BIG_FIVE_VERSION`、等級切點常數
- [ ] 1.2 新增 `shared/utils/bigFiveScoring.ts`：作答驗證（每題一次、1–5、無未知題）、反向題反轉、平均、0–100 換算、三級判定
- [ ] 1.3 單元測試：全高、全中、反向題反轉、等級切點邊界（39／40／60／61）、缺題／重複／越界／未知題的錯誤

## 2. 與 MBTI 的對照

- [ ] 2.1 新增 `shared/utils/bigFiveMbtiComparison.ts`：`compareWithMbti(scores, mbti)` 輸出四組的一致／有差異／居中
- [ ] 2.2 單元測試：四組各自的一致、有差異、居中，以及 MBTI 為空時的結果

## 3. 固定內容類型 BIGFIVE

- [ ] 3.1 `shared/utils/fixedContentKeys.ts`：加入 `BIGFIVE`、金鑰規則（15 筆特質內容 + 8 筆對照）、`isValidContentKey` 與 `expectedFixedContentIds`
- [ ] 3.2 更新相關測試（金鑰、覆蓋預期總數、匯入覆蓋檢查）
- [ ] 3.3 確認 `pnpm content:import` 能以 dry-run 驗證 `BIGFIVE` 範例列

## 4. 結果保存與 API

- [ ] 4.1 新增 `shared/schemas/firestore/bigFive.schema.ts` 與 `shared/schemas/api/bigFive.schema.ts`（請求、回應、紀錄文件）
- [ ] 4.2 新增 `server/repositories/bigFive.repository.ts` 與 `server/services/bigFive.service.ts`：計分、讀取內容（先確認可交付）、登入者寫入 `bigFiveAttempts`、取最新未到期結果
- [ ] 4.3 新增 `server/api/big-five/results.post.ts`（訪客可用、登入者保存）與 `results/latest.get.ts`（需登入）；內容未發佈回 404 且不寫入
- [ ] 4.4 `server/utils/routeAccess.ts` 登記；更新 `openspec/analysis/render/api.yaml`，確認 `server/api.routes.test.ts` 通過
- [ ] 4.5 服務與端點測試：登入者保存、訪客不寫入、作答不合法、內容未發佈不寫入、取最新與到期過濾

## 5. 保留與刪除

- [ ] 5.1 `scripts/provision-firebase.ts` 的 `EXPIRY_QUERY_GROUPS` 加入 `bigFiveAttempts`；`dataExpiry.service` 納入到期清除，補測試
- [ ] 5.2 `deletion.service` 刪帳號時移除 `bigFiveAttempts`，補測試

## 6. 前端

- [ ] 6.1 新增 `app/pages/big-five.vue`：分頁題目、進度、已作答／未作答樣式、未答完不可送出、作答暫存於 `sessionStorage`
- [ ] 6.2 新增 `app/pages/analysis/big-five.vue`：五個特質分數條與等級、各特質內容、MBTI 對照區塊（無 MBTI 時邀請測驗）、「怎麼看」說明與免責；訪客結果放 `sessionStorage` 並提供登入後儲存
- [ ] 6.3 首頁維度區新增「大五人格」卡片、`/self-reports` 新增第六張卡片，並在 `useExploration` 的進度中加入大五人格的完成狀態（不改變多維度分析可選維度）
- [ ] 6.4 跑 `pnpm exec eslint . --fix` 與 `nuxt prepare`，在瀏覽器確認測驗頁、結果頁、無 MBTI、訪客、窄螢幕與卡片亮起

## 7. 內容撰寫與匯入

- [ ] 7.1 撰寫 `content/fixed/big-five.json`：5 特質 × 低／中／高共 15 筆，加上與 MBTI 對照 8 筆；情緒敏感性用「對壓力的反應傾向」描述，不使用診斷用語
- [ ] 7.2 以 `pnpm content:import content/fixed/big-five.json --dry-run` 驗證，審稿後改為 `PUBLISHED` 並匯入
- [ ] 7.3 執行 `scripts/provision-firebase.ts` 建立 `bigFiveAttempts` 的索引例外
- [ ] 7.4 匯入後確認覆蓋檢查顯示 `BIGFIVE` 23 筆完整，並完成一次實際測驗

## 8. 收尾

- [ ] 8.1 `pnpm exec vitest run` 全部通過、`nuxt build` 成功
- [ ] 8.2 開啟首頁與 `/self-reports` 的入口旗標
