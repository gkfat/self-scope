## 1. 契約

- [x] 1.1 `shared/schemas/firestore/reportSnapshot.schema.ts`：快照文件、區塊、段落（`text`、`kind`、`sources`、`timeSensitive`）、版本欄位；四種種類列舉
- [x] 1.2 `shared/schemas/api/` 新增讀取與列表的回應 schema
- [x] 1.3 `evidenceKind` 到快照種類的對應函式與測試（不修改既有 schema）

## 2. 儲存與服務

- [x] 2.1 `reportSnapshot.repository.ts`（繼承 `BaseRepository`）：寫入、讀取、列表、刪最舊
- [x] 2.2 `reportSnapshot.service.ts`（繼承 `BaseService`）：驗證後寫入、上限處理、結構化 log（不輸出全文）
- [x] 2.3 `server/api/` 新增讀取與列表路由：`requireAuth`、zod 驗證、`toH3Error`；檢查 `routeAccess.ts` 規則（預設 required）
- [x] 2.4 `firebase:provision` 補需要的索引（如依產生時間排序），並更新 `docs/firebase-setup.md`

## 3. 到期與刪除

- [x] 3.1 `dataExpiry.service.ts` 加入新集合（不開 TTL）並補測試
- [x] 3.2 `deletion.service.ts` 刪帳號與刪資料範圍涵蓋快照，補測試（保留其他使用者）
- [x] 3.3 測試：只有本人可讀、到期清除、上限、缺種類被拒

## 4. 驗證

- [x] 4.1 `pnpm lint`、`pnpm test`、`pnpm build` 通過
- [x] 4.2 確認 `check:bundle` 未洩漏 server secret
