## Why

新的報告由預寫片段與規則組裝而成，固定內容日後會修改，要讓使用者看過的報告穩定重現，必須存**組裝完成的全文**（決策 11）；時間性內容（大運、流年、流年數）也要存入快照（決策 12）。目前沒有通用的快照：`summaries` 只存組合鍵與內容參照（無內容全文），AI 報告有自己的文件與 `evidenceKind`。

## What Changes

- 新增**報告快照**文件：每份已發布的報告存位置結論、當時算出的事實、各區塊的**當時全文**，每段標**種類**、各來源與版本、`basis` 與產生時間。
- **四種內容種類**：事實、系統解讀、AI 綜合推論、使用者自述（目前無來源，保留列舉）。與現有 AI 報告的 `evidenceKind`（OBSERVED、INFERRED）建立對應，不改動既有文件。
- 時間性內容隨快照存入並標註產生日期，**不隨年份自動更新**。
- 到期與刪除：沿用既有期限慣例與清除機制（到期 cron 與刪除帳號），並納入刪除測試。
- 存取：僅本人可讀；API 輸出過 zod；經 repository 存取 Firestore。

不在範圍：快照的內容如何產生（單／多維度報告 change）；為既有 `summaries` 與 `detailedReports` 補快照。

## Capabilities

### New Capabilities
- `report-snapshots`: 報告快照的結構、內容種類標記、保存期限、存取與清除。

### Modified Capabilities
<!-- 無：既有 summaries 與 detailedReports 不變 -->

## Impact

- `shared/schemas/firestore/` 與 `shared/schemas/api/` 新增快照 schema；`server/repositories/reportSnapshot.repository.ts`、`server/services/reportSnapshot.service.ts`；`server/api/` 新增讀取與列表路由。
- `server/utils/routeAccess.ts` 檢查新路由的規則（預設 required）。
- `deletion.service.ts`、`dataExpiry.service.ts` 與其測試、`firestore` 索引（`firebase:provision`）可能需更新。
- 相依：`add-report-data-layer`（`basis`）、`add-trait-ontology` 與 `add-trait-context-fragments`（版本字串）。
