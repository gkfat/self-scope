## ADDED Requirements

### Requirement: 點數方案
系統 SHALL 從資料列出可購買的點數方案（點數、價格），價格 MUST 可不重新部署而調整。（FR-011）

#### Scenario: 列出方案
- **WHEN** 使用者開啟購買頁
- **THEN** 系統回傳啟用中的方案

### Requirement: 同意與無退款告知
系統 SHALL 在建立付款前說明點數用途、價格與不提供退款，並 MUST 要求使用者勾選「同意立即提供數位內容、放棄解約」，同意時間與條款版本 MUST 隨付款紀錄保存。（FR-011、FR-013、RULE-012）

#### Scenario: 已同意
- **WHEN** 請求帶 `acceptDigitalContentTerms=true` 與條款版本
- **THEN** 系統建立付款流程並保存同意時間與版本

#### Scenario: 未同意
- **WHEN** 請求未同意
- **THEN** 系統回傳 400，不建立付款

### Requirement: Webhook 驗簽與冪等入帳
系統 SHALL 在接收付款事件時先驗證簽章，並以事件 ID 冪等處理；成功事件 MUST 在同一交易內建立購買批次與異動。（FR-012、RULE-011、NFR-004）

#### Scenario: 簽章無效
- **WHEN** webhook 簽章驗證失敗
- **THEN** 系統拒絕並記錄安全事件，不入帳

#### Scenario: 重複事件
- **WHEN** 相同事件 ID 被再次送達
- **THEN** 系統回應成功但不重複入帳

#### Scenario: 無法對應使用者
- **WHEN** 事件無法對應到使用者或付款
- **THEN** 系統記錄並通知營運處理，不遺失付款紀錄

### Requirement: 付款失敗
系統 SHALL 在付款失敗時不入帳並保留失敗狀態，使用者可重試。（FR-013）

#### Scenario: 付款失敗
- **WHEN** 付款服務回報失敗
- **THEN** 付款狀態為 FAILED，點數餘額不變

### Requirement: 付款紀錄保存
系統 SHALL 在帳號存續期間永久保存付款紀錄，不受測驗結果保留期限影響；刪除帳號時 MUST 一併移除。（FR-043、RULE-015）

#### Scenario: 保留期限
- **WHEN** 排程清除到期資料
- **THEN** 付款紀錄不被清除

### Requirement: 付款服務抽象
系統 SHALL 以介面封裝付款服務，金鑰 MUST 僅存於伺服器，付款供應商的選擇不得影響上層邏輯。（NFR-002）

#### Scenario: 金鑰保護
- **WHEN** 前端建置完成
- **THEN** 前端產物中不含任何付款或 AI 秘密金鑰
