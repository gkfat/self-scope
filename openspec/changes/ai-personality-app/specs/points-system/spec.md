## ADDED Requirements

### Requirement: 點數批次與效期
系統 SHALL 以批次管理點數：註冊贈點 3 點，有效期 90 天；購買的點數為無限期；過期點數 MUST NOT 可用於扣抵。（FR-037、FR-042、RULE-008、RULE-009）

#### Scenario: 贈點效期
- **WHEN** 系統發放註冊贈點
- **THEN** 批次的到期時間為建立後 90 天

#### Scenario: 購買點數
- **WHEN** 付款成功入帳
- **THEN** 批次無到期時間

#### Scenario: 過期點數
- **WHEN** 贈點批次已過期
- **THEN** 該批剩餘點數不計入可用餘額

### Requirement: 扣抵順序與餘額
系統 SHALL 依先到期先扣、無限期批次最後的順序扣點；可用餘額 MUST 由未過期批次加總得出，餘額 MUST NOT 為負。（FR-042、RULE-007）

#### Scenario: 跨批次扣點
- **WHEN** 扣點金額超過最早到期批次的剩餘點數
- **THEN** 系統依序扣自後續批次並在異動中記錄分配

#### Scenario: 餘額不足
- **WHEN** 可用點數少於所需
- **THEN** 系統拒絕並回傳 402，不扣任何點數

### Requirement: 原子且冪等的扣點
系統 MUST 在同一 transaction 內完成扣點、批次更新與異動寫入，並以決定性的異動 ID 達成冪等。（FR-038、NFR-017）

#### Scenario: 重送相同請求
- **WHEN** 相同操作被重送
- **THEN** 只產生一筆異動、只扣一次

#### Scenario: 交易失敗
- **WHEN** transaction 中途失敗
- **THEN** 批次與異動皆不變

### Requirement: 失敗返還
系統 SHALL 在詳細分析生成失敗時返還已扣的點數並寫入 REFUND 異動。（FR-019、RULE-010）

#### Scenario: 生成失敗
- **WHEN** 詳細分析狀態變為 FAILED
- **THEN** 系統返還該次扣除的點數，且僅返還一次

### Requirement: 查詢餘額與異動
系統 SHALL 讓已登入使用者查詢可用餘額、各批效期與異動紀錄。（FR-014、FR-039）

#### Scenario: 查詢餘額
- **WHEN** 使用者開啟點數頁
- **THEN** 系統回傳可用餘額與各批次效期

#### Scenario: 無異動
- **WHEN** 使用者沒有任何異動
- **THEN** 系統回傳空清單
