## ADDED Requirements

### Requirement: 必填與選填欄位
系統 SHALL 要求使用者提供生日與星座（星座可由生日帶入）；血型（A／B／O／AB／不知道）、MBTI、出生時間與出生地點 SHALL 為選填。（FR-002、RULE-001）

#### Scenario: 缺少必填欄位
- **WHEN** 請求缺少生日或星座
- **THEN** 系統回傳 400 並指出缺漏欄位

#### Scenario: 只填必填欄位
- **WHEN** 使用者只提供生日與星座
- **THEN** 系統接受並可提供星座單項結果

### Requirement: 血型未知不計入
系統 MUST 在血型為「不知道」時不計入分析與組合鍵。（RULE-002）

#### Scenario: 血型未知取得 summary
- **WHEN** 血型為 UNKNOWN 的使用者取得 summary
- **THEN** 系統使用星座+MBTI 組合

### Requirement: 出生地點採預設城市清單
系統 SHALL 讓使用者從預設城市清單選擇出生地點，清單 MUST 含經緯度與 IANA 時區。

#### Scenario: 選擇城市
- **WHEN** 使用者選擇清單中的城市
- **THEN** 系統儲存城市代碼，不要求輸入自由文字

#### Scenario: 代碼不在清單
- **WHEN** 請求帶有不存在的城市代碼
- **THEN** 系統回傳 400

### Requirement: 後端驗證輸入
系統 MUST 在後端以 schema 驗證所有個人資料欄位格式與範圍，不得信任前端驗證。（NFR-001）

#### Scenario: 無效日期
- **WHEN** 生日為不存在的日期
- **THEN** 系統回傳 400

### Requirement: 登入者保存與 MBTI 效期
系統 SHALL 在使用者已登入時保存個人資料；MBTI 欄位 MUST 於設定後 3 個月到期並被清除。（FR-002、RULE-014）

#### Scenario: MBTI 到期
- **WHEN** MBTI 欄位已超過 3 個月
- **THEN** 排程清除該欄位，之後取得 summary 需重新提供 MBTI
