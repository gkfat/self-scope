# mbti-dimension-scores Specification

## Purpose
TBD - MBTI 四維分數：提交回應與測驗紀錄提供各維度的 score、maxScore 與 leaning，由作答與當時的測驗版本計算，不新增儲存欄位；結果頁以兩極刻度條顯示偏向與強弱。

## Requirements

### Requirement: MBTI 結果提供四維分數
系統 SHALL 在 MBTI 提交回應與測驗紀錄項目中，為每個維度提供 `score`（作答置中後的加總，正值偏向該維度的第一個字母）、`maxScore`（該維度最大可能的絕對分數）與 `leaning`（偏向的字母；總分為 0 時為該維度的 `tieBreak`）。分數 MUST 由作答與**作答當時的測驗版本**的計分規則計算，使用與型別判定相同的規則（`scoreDimensions`），因此 `leaning` 的字母串接 MUST 等於 `result` 的四字母型別。系統 MUST NOT 為此新增儲存欄位。

#### Scenario: 提交後取得四維分數
- **WHEN** 使用者提交完整合法的作答
- **THEN** 回應含四個維度的 `score`、`maxScore`、`leaning`，且各維度 `leaning` 串接後等於 `result`

#### Scenario: 測驗紀錄以當時版本計算
- **WHEN** 測驗在作答之後發布了新版本，使用者再讀取舊的紀錄
- **THEN** 分數以紀錄的 `testVersion` 計算，不受新版本影響

#### Scenario: 總分為零時依平手規則
- **WHEN** 某維度的作答加總為 0
- **THEN** 該維度 `score` 為 0，`leaning` 為該維度設定的 `tieBreak`，與 `result` 一致

#### Scenario: 版本資料遺失
- **WHEN** 紀錄的測驗版本已不存在而無法計算
- **THEN** 列表請求回傳找不到的錯誤，MUST NOT 猜測或回傳空分數

### Requirement: 前端顯示四維分數
MBTI 結果頁 SHALL 以兩極刻度條顯示四個維度：兩端標示兩種偏好，中線代表兩邊一樣多，圓點位置為使用者的偏向（`score` 相對於 `maxScore`），並以文字說明偏向與強弱。顯示 MUST NOT 改變現有的內容與版型順序。

#### Scenario: 顯示強弱
- **WHEN** 結果頁取得四維分數
- **THEN** 每個維度顯示偏向的字母與相對強弱
