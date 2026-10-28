# analysis-basis Specification

## Purpose
TBD - 計算依據（basis）：每份報告的事實附系統、方法、規則版本與所用輸入；各重算型系統有手動維護的規則版本常數；AI 詳細報告為所選且有計算的維度記錄 basis。

## Requirements

### Requirement: 計算依據的結構
系統 SHALL 以共用的 zod schema 定義**計算依據（basis）**：`system`（所屬系統）、`method`（方法名稱）、`ruleVersion`（規則版本字串）、`inputs`（計算所用的輸入，只含計算必需的欄位）。`system` MUST 取自固定清單：ZODIAC、BAZI、NATAL_CHART、HUMAN_DESIGN、NUMEROLOGY、MAYA_KIN、HOROSCOPE、MBTI、TAROT、RUNE。`ruleVersion` MUST 為非空字串。`inputs` MUST NOT 含自由文字（與現有 AI 輸入「不含使用者自由文字」的規則一致）。

#### Scenario: 合法的依據
- **WHEN** 以固定清單內的系統、非空的方法與規則版本建立 basis
- **THEN** 通過 schema 驗證

#### Scenario: 未知系統或空版本
- **WHEN** `system` 不在固定清單，或 `ruleVersion` 為空字串
- **THEN** 驗證失敗並回報明確的錯誤

### Requirement: 各重算型系統有規則版本常數
系統 SHALL 為八字、本命星盤、人類圖、生命靈數、瑪雅 Kin、星座運勢、太陽星座判定各定義一個規則版本常數，並以純函式 `buildBasis` 由該系統的輸入產生 basis。塔羅與盧恩 MUST 沿用現有的抽取版本（`tarot-v1`、`rune-v1`）；MBTI 的 `ruleVersion` MUST 為作答時的測驗版本（`testVersion`）。同一輸入與同一版規則 MUST 得到相同的 basis（純函式、不含時間戳）。規則的行為改變時（例如節氣切月方式、Kin 的 2/29 處理）MUST 同時提高該系統的版本常數。

#### Scenario: 同輸入同版本得到相同依據
- **WHEN** 以相同的輸入與規則版本兩次呼叫 `buildBasis`
- **THEN** 兩次結果完全相同

#### Scenario: 塔羅與盧恩沿用現有版本
- **WHEN** 為塔羅或盧恩建立 basis
- **THEN** `ruleVersion` 等於現有的 `TAROT_DRAW_VERSION` 或 `RUNE_DRAW_VERSION`，不另建第二份常數

#### Scenario: MBTI 使用測驗版本
- **WHEN** 為一次 MBTI 作答建立 basis
- **THEN** `ruleVersion` 等於該次作答的 `testVersion`

#### Scenario: 每個重算型系統都有版本
- **WHEN** 列舉所有重算型系統
- **THEN** 每一個都有非空的規則版本常數，沒有系統缺少版本

### Requirement: AI 詳細報告記錄計算依據
系統 SHALL 在新產生的 AI 詳細報告文件中，為報告所選且**有計算**的維度寫入一筆 basis（`basis` 為必填欄位）。血型是使用者自填的事實、沒有計算，MUST NOT 產生 basis；MBTI 只有在報告實際用到最近一次測驗（有 `testVersion`）時才產生。未被選擇的維度 MUST NOT 產生 basis。`basis` 的保存期限與刪除機制 MUST 與該報告文件相同（6 個月、刪帳號時一併刪除）。本系統處於測試開發階段，MUST NOT 為沒有 `basis` 的舊報告寫相容讀取或補寫程式。

#### Scenario: 新報告寫入所選維度的依據
- **WHEN** 會員產生包含星座、八字與瑪雅 Kin 的報告
- **THEN** 報告文件的 `basis` 含這三個維度各一筆，且不含其他維度

#### Scenario: 血型不產生依據
- **WHEN** 報告包含血型與八字
- **THEN** `basis` 只含八字，不含血型

#### Scenario: 隨報告刪除
- **WHEN** 報告因到期或刪帳號被清除
- **THEN** 其 `basis` 一併消失，不留下殘存紀錄

#### Scenario: 依據不影響報告內容與點數
- **WHEN** 寫入 `basis`
- **THEN** 報告的 `inputVersion`、章節內容與點數扣除與先前相同
