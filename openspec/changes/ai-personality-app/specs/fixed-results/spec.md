## ADDED Requirements

### Requirement: 單項免費結果
系統 SHALL 讓使用者（含訪客）不扣點取得星座結果（依生日換算）、血型分析與 MBTI 結果；結果為固定內容，MUST NOT 呼叫 AI，且 MUST NOT 儲存（每次重新取得）。（FR-040、RULE-017、RULE-018）

#### Scenario: 取得星座結果
- **WHEN** 使用者提供有效生日
- **THEN** 系統回傳該星座的固定內容與免責說明，且不扣點

#### Scenario: 血型未知
- **WHEN** 請求血型為 UNKNOWN
- **THEN** 系統不提供血型分析（404）並提示可補填

#### Scenario: 內容讀取失敗
- **WHEN** 固定內容讀取失敗
- **THEN** 系統回傳明確錯誤，不以 AI 補足

### Requirement: 簡易 summary 組合規則
系統 SHALL 以「星座+MBTI」或「星座+MBTI+血型」作為 summary 組合鍵；缺少 MBTI 時 MUST NOT 提供 summary；血型為未知時 MUST 使用星座+MBTI 組合。（FR-006、RULE-002、RULE-003）

#### Scenario: 缺少 MBTI
- **WHEN** 使用者未提供 MBTI 要求 summary
- **THEN** 系統回傳 422 並引導先完成測驗

#### Scenario: 三項皆有
- **WHEN** 使用者星座、MBTI、血型皆有效
- **THEN** 系統使用星座+MBTI+血型組合

### Requirement: 取得 summary 的扣點
系統 SHALL 在已登入會員首次取得某組 summary 時扣 1 點；同一會員同一組合已取得時 MUST 直接回傳已存結果且 MUST NOT 再次扣點；扣點與建立紀錄 MUST 在同一交易內完成且冪等。（FR-038、FR-041、RULE-005、RULE-025）

#### Scenario: 首次取得
- **WHEN** 已登入且點數足夠的會員首次取得某組 summary
- **THEN** 系統扣 1 點、保存取得紀錄（3 個月）並回傳內容

#### Scenario: 重複取得
- **WHEN** 同一會員再次取得同一組合
- **THEN** 系統回傳已存結果，點數不變

#### Scenario: 點數不足
- **WHEN** 可用點數不足或已過期
- **THEN** 系統回傳 402 並引導購買點數

#### Scenario: 並行請求
- **WHEN** 同一請求被並行送出多次
- **THEN** 只扣一次點

### Requirement: 內容來源與免責
系統 MUST 從 Firestore 讀取已發布（PUBLISHED）的固定內容，且所有結果 MUST 附娛樂與自我探索性質的免責說明。（RULE-023、NFR-007）

#### Scenario: 內容未發布
- **WHEN** 對應固定內容狀態不是 PUBLISHED
- **THEN** 系統視為不存在，不對使用者顯示
