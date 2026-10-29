# report-snapshots Specification

## Purpose
TBD - 報告快照：保存組裝完成的報告全文（四類段落標記、版本與計算依據、獨立的 AI 欄位、6 個月期限與每人上限、每日作業清除、隨刪帳號與刪除報告範圍清除）。

## Requirements

### Requirement: 快照存組裝完成的全文
系統 SHALL 為每份已發布的報告儲存一份快照，含位置結論、各區塊的**當時全文**、所用系統、版本資訊、計算依據與產生時間。快照 MUST 存全文而不只存對固定內容的參照，使日後固定內容修改時，使用者看過的報告仍可原樣重現。

#### Scenario: 固定內容修改後仍可重現
- **WHEN** 報告產生後，來源的固定內容片段被修改
- **THEN** 讀取該快照得到的仍是產生當時的全文

#### Scenario: 快照含版本與依據
- **WHEN** 讀取一份快照
- **THEN** 含 `ontology`、`mapping`、`fragments`、`templates` 版本、各系統的 `basis` 與產生時間

### Requirement: AI 分析存放在獨立欄位，與基本報告並存
快照 SHALL 有獨立的 `ai` 欄位存放 AI 進階分析（含各段、`modelName`、`promptVersion`、`generatedAt`），尚未分析時為 null。寫入或替換 `ai` MUST NOT 改動規則產生的區塊、版本、計算依據、產生時間與到期時間；再次分析只替換 `ai`。「相同報告只保存一份」的判斷 MUST 只比較基本內容，不受 `ai` 影響。`ai` 只能加到本人、未到期的快照上。

#### Scenario: 基本內容不因 AI 分析而改變
- **WHEN** 為一份快照寫入 AI 分析
- **THEN** 基本區塊、版本、依據與時間都與寫入前相同，`ai` 欄位有內容

#### Scenario: 再次分析只替換 AI 欄位
- **WHEN** 同一份快照再寫入一次 AI 分析
- **THEN** 只有 `ai` 被換成新的，基本內容不變

#### Scenario: AI 分析不使報告變成另一份
- **WHEN** 報告已有 AI 分析，相同的基本報告再次要求保存
- **THEN** 回傳既有那一份，不新增

#### Scenario: 不能加到別人的或已到期的快照
- **WHEN** 對他人的、不存在的或已到期的快照寫入 AI 分析
- **THEN** 回傳找不到，不寫入

### Requirement: 每段標示內容種類與來源
快照的每一段 SHALL 標示種類（事實、系統解讀、AI 綜合推論、使用者自述其中之一）與來源（系統與原語彙，或軸端點與片段 ID）。種類必填。AI 綜合推論 MUST 能與規則推導區分，系統解讀 MUST 標明依據的系統。

#### Scenario: 缺種類被拒絕
- **WHEN** 寫入的段落沒有種類
- **THEN** 驗證失敗，快照不被儲存

#### Scenario: 與既有 AI 報告種類對應
- **WHEN** 把 AI 報告章節的 `evidenceKind` 轉成快照種類
- **THEN** `OBSERVED` 對應事實或系統解讀，`INFERRED` 對應 AI 綜合推論，既有文件不被修改

### Requirement: 時間性內容隨快照存入
系統 SHALL 把大運、流年與生命靈數流年數等時間性內容與其他內容一起存入快照，並標示產生日期；這些段落 MUST NOT 隨年份自動更新。

#### Scenario: 標示產生日期
- **WHEN** 快照含時間性段落
- **THEN** 該段標記為時間性並含產生日期

#### Scenario: 不自動更新
- **WHEN** 快照產生後經過一年再讀取
- **THEN** 時間性段落內容不變

### Requirement: 存取、期限與清除
快照 MUST 僅本人可讀，API 輸入輸出 MUST 通過 schema 驗證。快照 SHALL 有到期時間，由既有每日到期作業清除，MUST NOT 對此集合開 Firestore TTL。刪除帳號 MUST 清除其全部快照；使用者的刪除資料功能中的「報告」範圍 MUST 清除其全部快照（快照就是報告）；其他範圍 MUST NOT 動到快照；刪除 MUST NOT 影響其他使用者的快照。

#### Scenario: 只有本人能讀
- **WHEN** 另一位使用者以快照 ID 讀取
- **THEN** 回傳找不到，不洩漏存在與否

#### Scenario: 到期清除
- **WHEN** 快照超過到期時間且每日作業執行
- **THEN** 該快照被清除

#### Scenario: 刪帳號時清除
- **WHEN** 使用者刪除帳號
- **THEN** 其全部快照被清除，其他使用者的快照保留

### Requirement: 重複產生的處理
同一人對同一組系統重複產生報告時，系統 SHALL 保留每次的快照，每人快照總數上限為設定值，超過時 MUST 先刪除最舊的一份。

#### Scenario: 超過上限
- **WHEN** 使用者的快照數已達上限而再產生一份
- **THEN** 最舊的一份被刪除，新的被儲存
