## ADDED Requirements

### Requirement: 人類圖計算
系統 SHALL 在使用者提供生日、出生時間與出生地點時計算人類圖，結果包含 5 種能量類型之一、9 大能量中心、12 種人生角色之一、內在權威、策略、定義與通道、64 個閘門；此計算 MUST NOT 呼叫 AI。（FR-036、RULE-013、RULE-017）

#### Scenario: 資料齊備
- **WHEN** 使用者提供完整出生資料
- **THEN** 系統回傳人類圖固定結果與免責說明

#### Scenario: 缺出生時間或地點
- **WHEN** 缺少出生時間或出生地點
- **THEN** 系統不產生人類圖並提示補填

#### Scenario: 城市不在清單
- **WHEN** 出生地代碼不在預設城市清單
- **THEN** 系統回傳 400 並請使用者改選

### Requirement: 儲存與保存期限
系統 SHALL 為已登入使用者儲存人類圖結果並保存 3 個月，訪客 SHALL 僅暫存於 session；結果 MUST 以輸入摘要判斷是否過時，MUST NOT 另存原始出生時間與地點。（RULE-028、RULE-014）

#### Scenario: 登入者計算
- **WHEN** 已登入使用者完成計算
- **THEN** 系統儲存結果與輸入摘要並設定到期時間

#### Scenario: 出生資料變更
- **WHEN** 使用者修改出生資料後再次檢視
- **THEN** 系統依摘要不符重新計算

### Requirement: 單獨檢視免費
系統 SHALL 讓使用者單獨檢視人類圖結果且 MUST NOT 扣點。（FR-036）

#### Scenario: 讀取已儲存結果
- **WHEN** 已登入使用者讀取已儲存的人類圖
- **THEN** 系統回傳結果，不重新計算也不扣點

#### Scenario: 尚未計算
- **WHEN** 使用者尚無已儲存的人類圖
- **THEN** 系統回傳 404
