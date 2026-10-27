## ADDED Requirements

### Requirement: 匯入腳本維護固定內容
系統 SHALL 提供匯入腳本，將固定內容（多維度分析報告、單項結果）由 JSON 或 CSV 寫入 Firestore，更新內容 MUST NOT 需要重新部署。（FR-008、NFR-012）

#### Scenario: 匯入新內容
- **WHEN** 維護者執行匯入腳本
- **THEN** 內容寫入 Firestore，版本遞增

#### Scenario: 格式無效
- **WHEN** 匯入檔不符合 schema
- **THEN** 腳本拒絕並指出錯誤列，不寫入任何內容

### Requirement: 組合唯一與審核發布
系統 SHALL 以決定性的文件 ID 保證組合唯一，內容狀態依序為 DRAFT、REVIEWED、PUBLISHED，僅 PUBLISHED 可供使用者讀取。（FR-008、RULE-021）

#### Scenario: 重複組合
- **WHEN** 匯入已存在的組合
- **THEN** 視為同一份內容的更新，不產生第二份

#### Scenario: 未審核內容
- **WHEN** 內容狀態為 DRAFT
- **THEN** 使用者端讀不到該內容

### Requirement: 覆蓋完整性檢查
系統 SHALL 提供檢查，核對 960 種多維度分析報告 組合（星座×MBTI 192、星座×MBTI×血型 768）與單項內容是否皆已發布，並列出缺漏。（FR-009、RULE-003）

#### Scenario: 有缺漏
- **WHEN** 檢查發現某組合未發布
- **THEN** 輸出缺漏組合清單

#### Scenario: 完整
- **WHEN** 所有組合皆已發布
- **THEN** 檢查回報完整
