## ADDED Requirements

### Requirement: 各類資料保存期限
系統 SHALL 依下列期限強制保存：測驗作答與結果、簡易 summary、MBTI 欄位、人類圖結果 3 個月；詳細分析 6 個月；付款紀錄於帳號存續期間永久；訪客暫存 1 天；贈點紀錄 3 個月。期限 SHALL 以各筆產生時間起算。（FR-033、NFR-005、RULE-014、RULE-015、RULE-030）

#### Scenario: 設定到期時間
- **WHEN** 系統建立上述任一類紀錄
- **THEN** 紀錄帶有依其類別計算的到期時間

### Requirement: 排程清除到期資料
系統 SHALL 每日執行排程，刪除已到期的測驗結果、簡易 summary、MBTI 欄位、人類圖結果與詳細分析；排程 MUST 以 `CRON_SECRET` 驗證身分；付款紀錄 MUST NOT 被清除。（UC-017）

#### Scenario: 清除到期
- **WHEN** 排程執行且存在已到期紀錄
- **THEN** 系統刪除這些紀錄並記錄刪除數量，不含個人內容

#### Scenario: 單筆刪除失敗
- **WHEN** 某筆刪除失敗
- **THEN** 記錄錯誤並於下次排程重試，不影響其他筆

#### Scenario: 未授權的排程呼叫
- **WHEN** 請求未帶正確的 `CRON_SECRET`
- **THEN** 系統回傳 401

### Requirement: TTL 自動清除
系統 SHALL 以 Firestore TTL 清除訪客暫存與贈點紀錄。

#### Scenario: 贈點紀錄到期
- **WHEN** 贈點紀錄超過 3 個月
- **THEN** 紀錄被清除，該 Google 帳號重新註冊可再獲贈點

### Requirement: 日誌不含敏感內容
系統 MUST NOT 在日誌中寫入完整作答、報告或不必要的個人資料。（NFR-006）

#### Scenario: 排程日誌
- **WHEN** 排程完成
- **THEN** 日誌僅含計數與錯誤摘要
