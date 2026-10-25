## ADDED Requirements

### Requirement: Google 登入
系統 SHALL 允許使用者以 Google 帳號登入，後端 MUST 驗證 Firebase ID token；未登入者 MUST 仍可使用公開功能（測驗與單項結果）。（FR-001）

#### Scenario: 登入成功
- **WHEN** 使用者完成 Google 授權並送出有效 ID token
- **THEN** 系統回傳登入成功與使用者資訊

#### Scenario: token 無效或過期
- **WHEN** 請求帶有無效或過期的 ID token
- **THEN** 系統回傳 401 與明確錯誤，且不寫入任何資料

### Requirement: 首次登入建立帳號與贈點
系統 SHALL 在使用者首次登入時建立帳號與點數帳戶並發放 3 點贈點；贈點 MUST 每帳號僅發放一次。（FR-037）

#### Scenario: 首次登入
- **WHEN** 某 Google 帳號首次登入且無未到期的贈點紀錄
- **THEN** 系統建立帳號、點數帳戶、3 點贈點批次與贈點紀錄，並在同一交易內完成

#### Scenario: 重送或並行的首次登入
- **WHEN** 同一帳號的首次登入請求被並行或重複送出
- **THEN** 贈點僅發放一次，其餘請求回傳既有帳號

### Requirement: 刪帳號後短期內不再贈點
系統 SHALL 在同一 Google 帳號於上次領取贈點後 3 個月內刪除帳號再註冊時不再發放贈點；贈點紀錄 MUST 在 3 個月後到期。（FR-037、RULE-031）

#### Scenario: 3 個月內重新註冊
- **WHEN** 已刪帳號的 Google 帳號在上次贈點後 3 個月內重新登入
- **THEN** 系統建立全新帳號但不發放贈點

#### Scenario: 超過 3 個月重新註冊
- **WHEN** 已刪帳號的 Google 帳號在贈點紀錄到期後重新登入
- **THEN** 系統建立全新帳號並發放 3 點贈點

### Requirement: 贈點紀錄僅用於避免重複贈點
系統 MUST 以伺服器密鑰對 Google 帳號 uid 做 HMAC 雜湊後儲存贈點紀錄，且 MUST NOT 將該紀錄用於避免重複贈點以外的用途。

#### Scenario: 儲存贈點紀錄
- **WHEN** 系統發放贈點
- **THEN** 紀錄僅含雜湊值、發放時間與到期時間，不含原始 uid 或 email

### Requirement: 刪除帳號
系統 SHALL 允許使用者刪除帳號；刪除時 MUST 移除該使用者的全部紀錄（個人資料、測驗結果、summary、詳細分析、人類圖、點數、付款），僅保留贈點紀錄；AI 用量紀錄 SHALL 保留但清除 userId；同一 Google 帳號再次登入 MUST 視為全新帳號且不繼承任何歷史紀錄。（FR-023、RULE-024、RULE-029）

#### Scenario: 刪除帳號成功
- **WHEN** 已登入使用者確認刪除帳號
- **THEN** 系統刪除其全部紀錄並登出，僅保留贈點紀錄與去識別化的 AI 用量紀錄

#### Scenario: 刪除失敗
- **WHEN** 刪除過程部分失敗
- **THEN** 系統回報明確錯誤且可重試，不留下半刪除的帳號狀態

#### Scenario: 未用點數
- **WHEN** 使用者刪除帳號時仍有未用點數
- **THEN** 系統事先警示點數將失效且不退款

### Requirement: 刪除指定資料
系統 SHALL 允許使用者刪除指定範圍的資料（測驗結果、summary、報告、人類圖），請求 MUST 明列範圍，且 MUST NOT 影響點數與付款。（FR-023）

#### Scenario: 刪除所選範圍
- **WHEN** 使用者選擇僅刪除「報告」
- **THEN** 系統只刪除詳細分析，其餘資料、點數與付款紀錄不變

#### Scenario: 未指定範圍
- **WHEN** 請求未列出任何範圍
- **THEN** 系統回傳 400 且不刪除任何資料

### Requirement: 預設需登入
系統 SHALL 預設要求所有 API 具備有效身分，僅明確列為公開或可選驗證的端點除外。（NFR-003）

#### Scenario: 未授權存取受保護端點
- **WHEN** 未帶 token 的請求呼叫需登入的端點
- **THEN** 系統回傳 401
