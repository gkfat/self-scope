## ADDED Requirements

### Requirement: 產生分享卡
系統 SHALL 依單項結果、簡易 summary 或人類圖產生分享卡內容（標題與摘要文字），分享卡 MUST NOT 含不必要的個人資料。（FR-010、RULE-026）

#### Scenario: 產生成功
- **WHEN** 使用者要求分享某個結果
- **THEN** 系統回傳不含生日、出生地或 email 的分享卡內容

#### Scenario: 結果不存在
- **WHEN** 要求分享的結果不存在或已到期
- **THEN** 系統回傳 404

### Requirement: 分享失敗處理
系統 SHALL 在分享卡產生或分享失敗時顯示明確錯誤並允許重試。

#### Scenario: 產生失敗
- **WHEN** 分享卡產生失敗
- **THEN** 前端提示錯誤並可重試，不影響點數與資料
