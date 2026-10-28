## ADDED Requirements

### Requirement: 片段以端點與情境值為鍵
系統 SHALL 以（特質軸端點 ID、情境值 ID）為鍵存放預寫片段；每個片段含 `text`（一句話，約 20 至 50 字；驗證上限為 8 至 60 字）與可選的 `confirmQuestion`。鍵 MUST 引用存在的端點與存在的情境值；不存在的引用 MUST 使驗證失敗。沒有對應片段時，取用函式 MUST 回傳 null，MUST NOT 以其他組合代替。

#### Scenario: 取得片段
- **WHEN** 查詢有片段的（端點、情境值）
- **THEN** 回傳該片段

#### Scenario: 沒有片段
- **WHEN** 查詢沒有片段的組合
- **THEN** 回傳 null，不由相近組合補上

#### Scenario: 引用不存在的端點
- **WHEN** 資料檔的鍵引用不存在的端點
- **THEN** 驗證失敗並指出該鍵

#### Scenario: 長度與格式
- **WHEN** 片段文字為空或過長（超過設定上限）
- **THEN** 驗證失敗

### Requirement: 時間片段的措辭規則
時間為「過去」的片段 MUST 附 `confirmQuestion`，且文字 MUST 為假設語氣，不得斷言使用者的經歷。時間為「未來」的片段 MUST 只談傾向與可準備的方向，MUST NOT 含事件預測的斷言用語。所有片段 MUST NOT 含醫療、法律或財務建議用語。違反者 MUST 使驗證失敗。

#### Scenario: 過去缺確認問題
- **WHEN** 過去片段沒有 `confirmQuestion`
- **THEN** 驗證失敗

#### Scenario: 過去斷言經歷
- **WHEN** 過去片段文字以斷言口吻描述使用者的經歷（不含假設語氣）
- **THEN** 驗證失敗

#### Scenario: 未來預測事件
- **WHEN** 未來片段含「一定會」「將會發生」等斷言用語
- **THEN** 驗證失敗

#### Scenario: 禁用領域
- **WHEN** 任何片段含醫療、法律或財務建議用語
- **THEN** 驗證失敗

### Requirement: 時間片段可由模板產生
系統 SHALL 允許時間值使用句型模板套用在對象或領域片段上，模板 MUST 同樣通過上述措辭規則；只有需要專屬說法的組合才有專屬時間片段。

#### Scenario: 模板套用
- **WHEN** 查詢某端點在「未來」的片段，而沒有專屬片段
- **THEN** 以模板與該端點的既有片段產生，並通過措辭規則

### Requirement: 分期覆蓋要求
系統 SHALL 檢查每個端點在對象值與領域值上的片段數量不低於設定下限；未達下限 MUST 使該期別的覆蓋檢查失敗並列出缺口。無意義的組合 MAY 留空，不要求填滿。

#### Scenario: 達到下限
- **WHEN** 每個端點在對象與領域上各至少有下限數量的片段
- **THEN** 覆蓋檢查通過

#### Scenario: 未達下限
- **WHEN** 某端點在對象值上的片段少於下限
- **THEN** 檢查失敗並列出該端點與缺少的數量

### Requirement: 片段版本
系統 SHALL 提供 `FRAGMENT_VERSION`，片段內容、模板或禁用清單改動 MUST 同步提高版本。

#### Scenario: 版本存在
- **WHEN** 讀取片段版本
- **THEN** 為非空字串
