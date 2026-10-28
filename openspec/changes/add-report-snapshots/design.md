## Context

- 現況：`users/{uid}/summaries` 存 `combinationKey` 與 `contentRef`、`contentVersion`，**不存全文**，保存 3 個月；`detailedReports` 存 `input`、章節（含 `evidence`、`evidenceKind`）、`modelName`、`promptVersion`，保存 6 個月；測驗紀錄 3 個月；人類圖 3 個月。到期由每日 cron `/api/cron/data-expiry` 清除，`welcomeGrants`／`guestSessions`／`rateLimits` 才用 Firestore TTL（**不要對其他集合開 TTL**）。
- 時間欄位多為 epoch 毫秒；Firestore 只經 firebase-admin 與 repository；API 輸入輸出皆過 zod。
- 已決定：存全文；時間性內容進快照；使用者回饋層不做；四類標記沿用並擴充 `evidenceKind`。

## Goals / Non-Goals

**Goals:** 通用快照結構；內容種類標記；可追溯的版本；到期與刪除與既有機制一致。
**Non-Goals:** 內容產生、前端報告頁、既有文件遷移。

## Decisions

### D1：新集合 `users/{uid}/reportSnapshots/{id}`
一份報告一個文件。理由：與既有集合（`summaries`、`detailedReports`）同層、刪帳號時整個 `users/{uid}` 子集合由既有清除程式涵蓋（需加進刪除清單並測試）。替代：塞進 `detailedReports` → 兩種報告性質不同（免費規則組裝 vs AI）；否決。

### D2：結構
`{ kind: 'SINGLE' | 'MULTI', systems[], position（位置結論）, blocks[], versions, basis[], generatedAt, expiresAt, aiAugmented }`。`blocks[]` 每塊含 `key`、`title`、`segments[]`；`segments[]` 每段含 `text`（全文）、`kind`（四類）、`sources`（系統、原語彙、片段或軸端點 ID）、`timeSensitive`（布林）。文件大小為數 KB 至十數 KB，遠低於 Firestore 單文件上限。

### D3：種類與既有 `evidenceKind` 的對應
`OBSERVED` ↔ 事實／系統解讀；`INFERRED` ↔ AI 綜合推論。對應函式在 shared，**不修改**既有 `evidenceKindSchema`。使用者自述列舉保留但目前不產生。

### D4：版本欄位集中為 `versions`
`ontology`、`mapping`、`fragments`、`templates`、`prompt`（AI）與各系統 `basis`，使任一段文字可追溯到產生它的版本。

### D5：保存期限
單維度與多維度快照預設沿用 **6 個月**（與 AI 報告一致，因為使用者為其付出點數或可能再讀）；到期由既有 data-expiry cron 清除（加入新集合，不開 TTL）。

### D6：時間性內容標記與不更新
`timeSensitive: true` 的段落保留產生日期；顯示時註明「依 <日期> 產生」。理由：決策 12（存快照）。

## Risks / Trade-offs

- **[儲存量增加]** → 每份數 KB；期限 6 個月；以 `firebase:provision` 檢查索引需求。
- **[快照存全文含個人化推論]** → 僅本人可讀；刪帳號整批清除；log 不輸出全文。
- **[遺漏清除路徑]** → 在 `deletion.service.test.ts` 與 `dataExpiry.service.test.ts` 加案例（沿用 tarot／kin／rune 的做法）。
- **[版本欄位不一致]** → schema 要求必填並有測試。

## Open Questions

- 單維度快照保存 6 個月是否合適？若免費單維度快照量很大，可改 3 個月。
- 同一人同一系統重複產生，是否保留多份或覆蓋？預設保留每次，上限 20 份，超過刪最舊。
- 是否提供使用者主動刪除單份快照？預設提供（沿用既有 `deleteData` 的範圍機制）。
