## ADDED Requirements

### Requirement: 映射條目的結構與來源
系統 SHALL 為每個系統提供映射檔，條目含 `system`、`term`（該系統真實存在的原語彙）、`axisEnd`（指向既有的軸端點）、`method`（`structural` 或 `keyword`）。條目 MUST NOT 帶強度或信心數字。`term` MUST 能對應該系統的列舉或常數；不存在的原語彙或不存在的端點 MUST 使驗證失敗。

#### Scenario: 合法條目
- **WHEN** 映射條目引用存在的原語彙與存在的軸端點
- **THEN** 通過驗證

#### Scenario: 引用不存在的端點
- **WHEN** 條目的 `axisEnd` 不在 28 條軸內
- **THEN** 驗證失敗並指出該條目

#### Scenario: 不存在的原語彙
- **WHEN** `term` 不是該系統的任何列舉值
- **THEN** 驗證失敗

#### Scenario: 不接受強度
- **WHEN** 條目含強度或信心欄位
- **THEN** 驗證失敗

### Requirement: 映射方式依系統而定
MBTI、人類圖與八字的映射 MUST 使用結構式規則（人類圖細到類型、權威、中心定義與通道）；星座、血型、生命靈數、瑪雅 Kin 使用關鍵字式。八字十神語句 MUST NOT 被映射，只作為事實呈現。

#### Scenario: 人類圖含通道
- **WHEN** 檢查人類圖映射
- **THEN** 含類型、權威、中心定義與通道層級的條目

#### Scenario: 十神語句不映射
- **WHEN** 檢查八字映射
- **THEN** 沒有以十神語句為 `term` 的條目

### Requirement: 狀態系統不進穩定特質
塔羅、盧恩、星座運勢的條目 MUST 標為 `state`，且 MUST NOT 出現在穩定特質的映射中。

#### Scenario: 混用被拒絕
- **WHEN** 將塔羅條目放進穩定特質映射
- **THEN** 驗證失敗

### Requirement: 每個端點都有來源
28 條軸共 56 個端點，每一個 MUST 至少有一條映射來源；沒有來源的端點 MUST 以結構式映射補上，驗證 MUST 列出仍無來源的端點。

#### Scenario: 無來源端點被列出
- **WHEN** 某端點沒有任何映射
- **THEN** 覆蓋率檢查失敗並列出該端點

### Requirement: 覆蓋率檢查
系統 SHALL 提供覆蓋率檢查，回報各系統的關鍵字被映射的比例與各端點的來源數；整體覆蓋率低於設定下限時 MUST 失敗。

#### Scenario: 覆蓋率達標
- **WHEN** 覆蓋率不低於下限
- **THEN** 檢查通過並輸出各系統報表

#### Scenario: 覆蓋率不足
- **WHEN** 覆蓋率低於下限
- **THEN** 檢查失敗並列出未映射的關鍵字

### Requirement: 來源群組與版本
映射 SHALL 標示 `sourceGroup`，同一傳統的系統共用一組，以便報告不把同源的重複當成獨立佐證。系統 MUST 提供 `MAPPING_VERSION`，映射內容改動 MUST 同步提高版本。

#### Scenario: 同源標記
- **WHEN** 查詢星座與星座運勢的來源群組
- **THEN** 兩者屬同一群組
