## ADDED Requirements

### Requirement: 訪客暫存 session
系統 SHALL 為未登入訪客建立以不可猜測的隨機 session id 識別的暫存 session，存於 Firestore，TTL 為 1 天，且 MUST NOT 與任何帳號關聯。（FR-032、RULE-016）

#### Scenario: 建立 session
- **WHEN** 訪客首次開始測驗
- **THEN** 系統建立 session 並回傳 sessionId 與到期時間

#### Scenario: 建立頻率過高
- **WHEN** 同一來源在短時間內大量建立 session
- **THEN** 系統回傳 429 並拒絕建立

### Requirement: 訪客結果暫存
系統 SHALL 在訪客帶有效 session id 時暫存其個人資料與當次測驗結果，到期後自動清除。

#### Scenario: 暫存測驗結果
- **WHEN** 訪客帶 `X-Guest-Session-Id` 送出測驗作答
- **THEN** 系統顯示結果並將其暫存於該 session，不寫入任何帳號

#### Scenario: session 到期
- **WHEN** session 的 `expiresAt` 已過
- **THEN** 暫存資料由 TTL 清除，之後存取回傳不存在

### Requirement: 未登入不保留提示
系統 MUST 在訪客看到結果時明確提示「未登入將不保留結果」並提供 Google 登入入口。（FR-032）

#### Scenario: 結果頁提示
- **WHEN** 訪客完成測驗並看到結果
- **THEN** 結果頁顯示未登入不保留的提示與登入按鈕

### Requirement: 登入後存入當次結果
系統 SHALL 在訪客當次選擇登入時，依 session id 將暫存結果寫入其帳號並清除暫存；寫入 MUST 冪等。（FR-032）

#### Scenario: 登入並保存
- **WHEN** 訪客登入後呼叫 claim 且 session 未過期
- **THEN** 結果寫入帳號、暫存被清除，並回傳保存的筆數

#### Scenario: session 已過期
- **WHEN** claim 時 session 已過期或不存在
- **THEN** 系統回傳 410，並引導使用者重新測驗

#### Scenario: 重複 claim
- **WHEN** 同一 session 被重複 claim
- **THEN** 不產生重複紀錄

### Requirement: 訪客限制
系統 MUST NOT 讓訪客取得多維度分析報告 或詳細分析，使用點數前 MUST 已登入。（FR-038、RULE-004）

#### Scenario: 訪客要求 summary
- **WHEN** 未登入請求取得 summary
- **THEN** 系統回傳 401 並引導登入
