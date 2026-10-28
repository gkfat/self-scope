## ADDED Requirements

### Requirement: 洞見規則的結構
洞見規則 SHALL 含 `id`、`type`、`when`、`requiresIndependentSources` 與 `template`。`type` MUST 為收斂、張力、軸間交互、盲區、情境差異、對象落差、時間延伸之一。`when` MUST 為對軸端點與來源條件的宣告式描述，MUST NOT 為任意程式碼。規則 `id` MUST 唯一。

#### Scenario: 合法規則
- **WHEN** 規則含全部欄位且 `type` 在清單內
- **THEN** 通過驗證

#### Scenario: 未知類型
- **WHEN** 規則的 `type` 不在清單內
- **THEN** 驗證失敗

#### Scenario: id 重複
- **WHEN** 兩條規則 `id` 相同
- **THEN** 驗證失敗

### Requirement: 規則引用的端點必須存在
規則的 `when` 引用的軸端點 MUST 存在於特質本體；不存在的引用 MUST 使驗證失敗。

#### Scenario: 引用不存在的端點
- **WHEN** 規則引用不存在的端點
- **THEN** 驗證失敗並指出規則

### Requirement: 觸發判斷
系統 SHALL 依使用者的映射結果判斷哪些規則觸發。`requiresIndependentSources` 為真的規則，只有當支持來源屬於至少兩個不同 `sourceGroup` 時才觸發。

#### Scenario: 需要獨立來源
- **WHEN** 支持來源皆為同一 `sourceGroup`
- **THEN** 需要獨立來源的規則不觸發

#### Scenario: 張力觸發
- **WHEN** 兩個獨立來源分別偏向同一軸的相反端
- **THEN** 該軸的張力規則觸發

### Requirement: 規模與版本
規則庫第一版 SHALL 含約 30 至 60 條規則，涵蓋七種類型各數條；系統 MUST 提供 `INSIGHT_RULES_VERSION`，規則改動 MUST 同步提高版本。每條規則 MUST 附至少一個範例輸入輸出測試。

#### Scenario: 每條規則有測試
- **WHEN** 檢查規則庫
- **THEN** 每條規則都有對應的範例測試

#### Scenario: 版本存在
- **WHEN** 讀取規則庫版本
- **THEN** 為非空字串
