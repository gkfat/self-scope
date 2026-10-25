## ADDED Requirements

### Requirement: 測驗清單與題目
系統 SHALL 提供可用測驗清單與含版本的題目與選項；題目回應 MUST NOT 含評分規則。對外名稱 SHALL 為「16 型人格」，題目 MUST 為自行撰寫。（FR-003、CTX-CON-015）

#### Scenario: 取得題目
- **WHEN** 使用者開啟測驗
- **THEN** 系統回傳題目、選項與測驗版本，不含評分資訊

#### Scenario: 測驗不存在
- **WHEN** 請求不存在的 testId
- **THEN** 系統回傳 404

### Requirement: 後端計分
系統 SHALL 由後端依評分規則計算 16 型結果，並 MUST 以送出當下的測驗版本計分且記錄所用版本；此計算 MUST NOT 呼叫 AI。（FR-004、RULE-027）

#### Scenario: 送出作答
- **WHEN** 使用者送出完整作答
- **THEN** 系統回傳 MBTI 結果與對應固定內容與免責說明

#### Scenario: 作答不完整
- **WHEN** 作答缺少題目或選項無效
- **THEN** 系統回傳 400 並指出缺漏題目

#### Scenario: 版本更新
- **WHEN** 使用者作答期間測驗已發布新版本
- **THEN** 系統以請求中的版本計分並記錄該版本

### Requirement: 登入者保存結果
系統 SHALL 在使用者已登入時保存測驗版本、作答與結果，保存 3 個月；訪客 SHALL 僅暫存於 session。（FR-005、RULE-014、RULE-016）

#### Scenario: 登入者送出
- **WHEN** 已登入使用者送出作答
- **THEN** 系統保存作答與結果並設定 3 個月後到期

#### Scenario: 保存失敗
- **WHEN** 計分成功但保存失敗
- **THEN** 系統仍回傳結果並提示保存失敗，可重試

### Requirement: 作答時間蒐集需告知
系統 MUST 僅在使用者已被告知並同意時才記錄每題作答時間。（FR-024 的前置規則）

#### Scenario: 未同意
- **WHEN** 請求未帶同意旗標
- **THEN** 系統不記錄 responseTime

### Requirement: 列出我的測驗結果
系統 SHALL 讓已登入使用者查看自己未到期的測驗結果。（FR-005）

#### Scenario: 查看列表
- **WHEN** 已登入使用者開啟個人中心
- **THEN** 系統只回傳該使用者未到期的紀錄
