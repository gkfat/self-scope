## ADDED Requirements

### Requirement: 生成前置條件與扣點
系統 SHALL 在使用者已登入、已具備星座與 MBTI 結果（血型與人類圖選填）且可用點數 ≥ 5 時，扣 5 點並開始生成詳細分析。（FR-016、FR-014、RULE-006、RULE-033）

#### Scenario: 條件齊備
- **WHEN** 條件齊備的使用者要求生成
- **THEN** 系統在同一交易內扣 5 點並建立狀態為 GENERATING 的報告，回傳 202

#### Scenario: 缺少 MBTI
- **WHEN** 使用者缺少 MBTI 結果
- **THEN** 系統回傳 422，不扣點

#### Scenario: 點數不足
- **WHEN** 可用點數少於 5
- **THEN** 系統回傳 402，不建立報告

### Requirement: 非同步生成與逾時
系統 SHALL 以非同步方式生成報告並提供狀態輪詢；單次生成逾時為 120 秒，逾時或失敗 MUST 將狀態設為 FAILED 並返還點數。（NFR-009、NFR-011、RULE-010）

#### Scenario: 輪詢狀態
- **WHEN** 使用者查詢生成中的報告
- **THEN** 系統回傳狀態，內容在完成前為空

#### Scenario: AI 逾時
- **WHEN** 生成超過 120 秒
- **THEN** 狀態為 FAILED、返還點數並回傳明確失敗原因

#### Scenario: 並行重複請求
- **WHEN** 同一 Idempotency-Key 被重複送出
- **THEN** 只建立一份報告、只扣一次點

### Requirement: 報告內容與品質
系統 SHALL 使報告包含八個章節（概況、行為模式、交叉觀察、優勢與盲點、感情與溝通、工作與決策、成長行動、依據與限制），重要結論 MUST 附資料依據並區分「直接觀察」與「AI 推測」；結果衝突時 MUST 指出差異；輸出 MUST NOT 含診斷式內容並附免責說明。AI 輸出 MUST 經 schema 驗證，不合格視為失敗。（FR-017、RULE-020、NFR-007、NFR-013）

#### Scenario: 完整輸出
- **WHEN** AI 回傳符合 schema 的內容
- **THEN** 系統保存章節、模型名稱、提示詞版本與輸入版本

#### Scenario: 輸出不合格
- **WHEN** 輸出缺章節或含診斷式內容
- **THEN** 視為失敗、返還點數、不交付

### Requirement: 保存與查看
系統 SHALL 將完成的報告保存 6 個月；查看已生成報告時 MUST 讀取已存內容，MUST NOT 呼叫 AI 或扣點；僅擁有者可存取。（FR-018、FR-021、RULE-019、RULE-030）

#### Scenario: 擁有者查看
- **WHEN** 擁有者查看未到期報告
- **THEN** 系統回傳已存內容，不扣點

#### Scenario: 非擁有者
- **WHEN** 其他使用者請求該報告
- **THEN** 系統回傳 403

### Requirement: 重新生成
系統 SHALL 在使用者要求重新分析時，對已生成過的組合再扣 5 點並新增一份報告，舊報告 MUST 保留。（FR-020、RULE-006）

#### Scenario: 重新生成成功
- **WHEN** 使用者對既有報告要求重新生成且點數足夠
- **THEN** 系統新增報告、扣 5 點，舊報告不變

#### Scenario: 重新生成失敗
- **WHEN** 新報告生成失敗
- **THEN** 返還 5 點，原報告不受影響

### Requirement: 用量記錄與限制
系統 SHALL 記錄每次 AI 呼叫的模型、輸入與輸出 Token 與預估成本，並限制生成頻率、單次 Token 上限與使用額度；AI 金鑰 MUST 僅存於伺服器。（FR-022、RULE-022、NFR-002、NFR-008）

#### Scenario: 記錄用量
- **WHEN** AI 呼叫完成
- **THEN** 系統寫入用量紀錄

#### Scenario: 超過限制
- **WHEN** 生成頻率或額度超過限制
- **THEN** 系統回傳 429
