## ADDED Requirements

### Requirement: 以 Dreamspell 曆法計算 Kin
系統 SHALL 依日期以 Dreamspell 曆法計算 Kin：結果為 1 至 260 的 Kin 編號、1 至 20 的圖騰與 1 至 13 的調性。2 月 29 日 MUST 不計入；輸入日期為 2 月 29 日時 MUST 沿用同年 2 月 28 日的 Kin。同一日期在任何入口（生日 Kin、今日 Kin）MUST 得到相同的 Kin。

#### Scenario: 已知日期的結果
- **WHEN** 以對照表上已知 Kin 的日期（含閏年前後與 1900 年代）計算
- **THEN** 得到與對照表相同的 Kin 編號、圖騰與調性

#### Scenario: 2 月 29 日沿用 2 月 28 日
- **WHEN** 輸入日期為閏年的 2 月 29 日
- **THEN** 結果與同年 2 月 28 日的 Kin 相同

#### Scenario: 跨過 2 月 29 日
- **WHEN** 計算閏年 2 月 28 日的下一天（3 月 1 日）
- **THEN** 其 Kin 編號比 2 月 28 日大 1（循環時 260 的下一個是 1），2 月 29 日不佔編號

#### Scenario: 圖騰與調性由編號決定
- **WHEN** 已知 Kin 編號
- **THEN** 圖騰為 `((編號 - 1) mod 20) + 1`，調性為 `((編號 - 1) mod 13) + 1`

### Requirement: 生日 Kin 免費公開、不儲存
系統 SHALL 提供 `GET /api/fixed-results/maya-kin?birthDate=`，依生日算出 Kin 並回傳 `KIN_BIRTH` 的固定內容。生日 MUST 為真實且不在未來的日期，否則 MUST 回 400。此 API MUST NOT 要求登入、MUST NOT 扣點、MUST NOT 呼叫 AI、MUST NOT 儲存任何資料。對應內容尚未發佈時 MUST 回 404。

#### Scenario: 取得生日 Kin
- **WHEN** 任何使用者（含訪客）以合法生日呼叫
- **THEN** 回傳 Kin 與該 Kin 的 `KIN_BIRTH` 內容，不寫入任何資料、不扣點

#### Scenario: 無效日期
- **WHEN** 生日不是真實日期或在未來
- **THEN** 回傳 400 與明確的驗證錯誤

#### Scenario: 內容尚未發佈
- **WHEN** 該 Kin 的 `KIN_BIRTH` 內容尚未發佈
- **THEN** 回傳 404，不退回任何預設內容也不呼叫 AI

### Requirement: 今日 Kin 每會員每日計算一次，計算即解鎖
系統 SHALL 讓已登入的會員在每個台北日期「計算」一次今日 Kin，計算即解鎖當天 Kin 的查看。第一次計算時，系統 MUST 在 `users/{uid}/kinUnlocks/{YYYY-MM-DD}` 建立當天紀錄（當日 Kin、解鎖時間、到期時間）；同一天之後的任何計算或查詢 MUST 回傳既有紀錄，MUST NOT 重新計算。計算 MUST NOT 扣點。解鎖後當天的查看次數 MUST NOT 受限。

#### Scenario: 第一次計算
- **WHEN** 已登入的會員當天第一次呼叫 `POST /api/kin/today`
- **THEN** 系統建立當天紀錄並回傳當日 Kin 與 `KIN_TODAY` 內容，不扣點

#### Scenario: 同一天再次計算
- **WHEN** 會員當天已解鎖，再次呼叫 `POST /api/kin/today`
- **THEN** 回傳既有紀錄的 Kin 與內容，不建立新紀錄

#### Scenario: 解鎖後反覆查看
- **WHEN** 會員當天已解鎖，多次呼叫 `GET /api/kin/today`
- **THEN** 每次都回傳當日 Kin 與內容，次數不受限

#### Scenario: 換裝置
- **WHEN** 會員在另一台裝置登入同一帳號並於同一個台北日期查詢
- **THEN** 看到已解鎖的同一個 Kin

#### Scenario: 並行計算
- **WHEN** 同一帳號同時送出兩個計算請求
- **THEN** 只建立一份紀錄，兩個請求都回傳相同的 Kin

#### Scenario: 隔天重新計算
- **WHEN** 台北日期變成下一天，會員再次計算
- **THEN** 系統建立新一天的紀錄，Kin 依新日期計算

### Requirement: 未解鎖時不提供今日 Kin 內容
系統 MUST 在會員當天尚未解鎖時，使 `GET /api/kin/today` 只回傳 `{ date, unlocked: false }`，MUST NOT 回傳當日的 Kin 或內容。

#### Scenario: 尚未解鎖時查詢
- **WHEN** 會員當天尚未計算，呼叫 `GET /api/kin/today`
- **THEN** 回傳當天日期與 `unlocked: false`，不含 Kin 與內容

### Requirement: 今日 Kin 的日期由伺服器決定
系統 MUST 以伺服器時間換算台北日期（Asia/Taipei，00:00 換日），MUST NOT 接受客戶端傳入的日期或身分；身分 MUST 取自登入憑證。

#### Scenario: 客戶端無法指定日期或身分
- **WHEN** 請求帶有日期或使用者識別參數
- **THEN** 系統忽略它們，仍以伺服器的台北日期與登入憑證的帳號為準

#### Scenario: 台北午夜換日
- **WHEN** 台北時間由 23:59:59 進到 00:00:00
- **THEN** 今日日期變為下一天，原先的解鎖不適用於新的一天

### Requirement: 今日 Kin API 需登入
`GET` 與 `POST /api/kin/today` MUST 要求有效登入，未登入 MUST 回 401。回應 MUST 設為不可共用快取（private、no-store）。

#### Scenario: 未登入
- **WHEN** 未帶有效登入憑證呼叫任一今日 Kin 端點
- **THEN** 回傳 401，不寫入任何資料

### Requirement: 內容未發佈時不寫入解鎖紀錄
系統 MUST 在確認當日 Kin 的 `KIN_TODAY` 內容已發佈後才建立解鎖紀錄；內容尚未發佈時 MUST 回 404 且 MUST NOT 寫入紀錄，使會員當天的機會不被占用。

#### Scenario: 內容尚未發佈
- **WHEN** 會員計算今日 Kin，但當日 Kin 的內容尚未發佈
- **THEN** 回傳 404，且當天沒有任何解鎖紀錄，之後內容發佈後仍可計算

### Requirement: 瑪雅 Kin 固定內容
系統 SHALL 以兩種固定內容類型提供解讀：`KIN_BIRTH` 與 `KIN_TODAY`，金鑰皆為 Kin 編號 1 至 260，各 260 筆、共 520 筆；兩者分開撰寫、分開版本管理。內容 MUST 為事先寫好的固定內容，MUST NOT 呼叫 AI；匯入 MUST 沿用既有的格式驗證、版本與覆蓋檢查，覆蓋檢查 MUST 把兩個類型各 260 筆納入預期。

#### Scenario: 金鑰驗證
- **WHEN** 匯入金鑰為 `"0"`、`"261"` 或非數字的 `KIN_BIRTH` 或 `KIN_TODAY` 內容
- **THEN** 匯入驗證失敗並指出該金鑰不合法

#### Scenario: 覆蓋檢查
- **WHEN** 兩個類型的內容尚未全部匯入
- **THEN** 覆蓋檢查列出缺少的金鑰，直到各 260 筆都已匯入才視為完整

### Requirement: 今日 Kin 解鎖紀錄的保留與刪除
解鎖紀錄 MUST 保存 3 個月（以解鎖時間起算），到期後 MUST 由既有的每日清除排程刪除；刪除帳號時 MUST 一併刪除該使用者的全部解鎖紀錄。

#### Scenario: 到期清除
- **WHEN** 解鎖紀錄的到期時間已過，排程執行
- **THEN** 該紀錄被刪除

#### Scenario: 刪除帳號
- **WHEN** 使用者刪除帳號
- **THEN** 該使用者的所有解鎖紀錄一併被刪除

### Requirement: 瑪雅 Kin 內容的語氣與免責
瑪雅 Kin 的所有內容與頁面 MUST 附娛樂與自我反思的免責說明，MUST 使用「可能、傾向、今天可以試試」的語氣，MUST NOT 預測具體事件，也 MUST NOT 提供醫療、法律、財務建議。

#### Scenario: 結果頁免責說明
- **WHEN** 使用者查看生日 Kin 或今日 Kin
- **THEN** 頁面含免責說明，且內容通過語氣與禁語檢查

### Requirement: 瑪雅 Kin 可作為多維度分析的維度
系統 SHALL 讓已登入的會員在多維度分析選擇「瑪雅 Kin」作為其中一個維度。選到時該分析 MUST 為 AI 生成（寫好的多維度摘要不涵蓋 Kin），基礎價 MUST 為 1 點並依既有的多維度定價公式計價，總價上限不變。交給模型的事實 MUST 只含 Kin 編號、名稱、圖騰與調性的名稱與關鍵字，MUST NOT 含出生日期；提示詞 MUST 限制為性格傾向、MUST NOT 預測具體事件。會員沒有出生日期時 MUST 回 422 並要求先填寫，MUST NOT 扣點。組合紀錄 SHALL 記下 Kin 編號。

#### Scenario: 選擇瑪雅 Kin
- **WHEN** 有出生日期的會員選擇「星座」與「瑪雅 Kin」建立多維度分析
- **THEN** 以 AI 生成並扣 3 點，模型收到該出生日期的 Kin 事實，報告的組合紀錄含 Kin 編號

#### Scenario: 不含出生日期
- **WHEN** 檢查交給模型的 Kin 事實
- **THEN** 其中沒有出生日期，只有 Kin 編號、名稱、圖騰與調性

#### Scenario: 缺少出生日期
- **WHEN** 沒有出生日期的會員選擇瑪雅 Kin 建立多維度分析
- **THEN** 回 422，要求先填寫出生日期，不扣點、不呼叫 AI

#### Scenario: 未選擇瑪雅 Kin
- **WHEN** 多維度分析沒有選擇瑪雅 Kin
- **THEN** 模型收不到任何 Kin 事實

#### Scenario: 入口關閉
- **WHEN** 瑪雅 Kin 的入口旗標關閉
- **THEN** 多維度分析的維度選項不出現瑪雅 Kin，已含 Kin 的舊報告仍可查看

### Requirement: 頁面與入口
系統 SHALL 提供「今日運勢」頁（`/fortune`，需登入，未登入導回首頁），頁面先以一列兩欄的入口卡片分別標示「塔羅」與「瑪雅 Kin」（只有入口，MUST NOT 以分頁切換）；點擊其中一張 MUST 在同一頁顯示該項的內容並提供返回入口，網址以 `#tarot`、`#kin` 標示所開啟的項目；並提供生日 Kin 頁（`/analysis/maya-kin`）。首頁與「自我分析報告」頁的命理與象徵系統 SHALL 各新增「瑪雅 Kin」卡片（需出生日期，完成後顯示 Kin 名稱），首頁今日入口與側邊選單 SHALL 與每日塔羅共用「今日運勢」。瑪雅 Kin 的入口（今日運勢的 Kin 卡片、首頁卡片、首頁今日 Kin 行）MUST 可由旗標關閉，關閉時 MUST NOT 顯示。生日 Kin 沒有出生日期時 MUST 引導使用者去填寫。

#### Scenario: 未登入進入今日運勢頁
- **WHEN** 未登入的使用者開啟 `/fortune`
- **THEN** 導回首頁

#### Scenario: 舊網址轉址
- **WHEN** 使用者開啟 `/kin`
- **THEN** 轉到 `/fortune#kin`，直接顯示今日 Kin 的內容

#### Scenario: 入口卡片
- **WHEN** 已登入的使用者開啟今日運勢頁
- **THEN** 看到一列兩欄、標示為「塔羅」與「瑪雅 Kin」的入口卡片，此時不顯示任何一項的內容

#### Scenario: 點擊入口
- **WHEN** 使用者點擊「瑪雅 Kin」入口卡片
- **THEN** 同一頁顯示今日 Kin 的內容與返回入口的按鈕，網址為 `#kin`；返回後回到兩張入口卡片

#### Scenario: 入口關閉
- **WHEN** 瑪雅 Kin 的入口旗標關閉
- **THEN** 今日運勢頁不出現「瑪雅 Kin」入口，首頁不出現瑪雅 Kin 卡片與今日 Kin 行

#### Scenario: 缺少出生日期
- **WHEN** 使用者尚未填寫出生日期就進入生日 Kin 頁
- **THEN** 頁面顯示需要出生日期的說明與前往填寫的按鈕，不呼叫計算 API
