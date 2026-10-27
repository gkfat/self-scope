# Requirements（AI 多維度人格探索 App）

> 來源：`ai_personality_app_plan.md` + user 補充（Nuxt / Vue / Vuetify / Vite、Vercel、Firestore、Google 登入、點數制、人類圖）
> 真相檔：`openspec/analysis/requirements.yaml`、`context.yaml`（本檔由 yaml 產生）
> 更新：2026-10-25

MVP = 計畫書 §15 第一版範圍（含 user 補充）。Phase 對應 §11 Phase 1-5。

## Functional Requirements

| ID | 標題 | 描述 | Priority | Phase | MVP | Context |
|---|---|---|---|---|---|---|
| FR-001 | Google 登入 | 系統 SHALL 允許使用者以 Google 帳號登入，使儲存的測驗紀錄與報告歸屬於該帳號；MUST NOT 要求登入才能完成測驗與查看固定報告。 | must | 1 | ✔ | CTX-ACTOR-001, CTX-EXT-006, CTX-ASM-004 |
| FR-002 | 生日、星座與選填血型／MBTI／出生時間地點 | 系統 SHALL 要求使用者提供生日與星座（皆必填，星座可由生日帶入）；血型（A/B/O/AB/不知道）、MBTI、出生時間與出生地點為選填（出生地點從預設城市清單選擇，含經緯度與時區）。血型選「不知道」時 MUST 不計入分析。 | must | 1 | ✔ | CTX-ACTOR-001, CTX-ASM-005, CTX-ASM-006, CTX-CON-006 |
| FR-003 | 測驗清單與題目取得 | 系統 SHALL 提供可用測驗清單，並依測驗 ID 回傳含版本的題目與選項。 | must | 1 | ✔ | CTX-ACTOR-001 |
| FR-004 | 16 型人格（MBTI）測驗作答與評分（選填） | 系統 SHALL 允許使用者（含未登入訪客）選擇完成 16 型人格（MBTI）測驗（對外名稱用「16 型人格」、題目自行撰寫，見 CTX-CON-015），並 MUST 由後端依評分規則計算 16 型結果；此計算與 summary 內容皆為事先定義，MUST NOT 呼叫 AI、不消耗 token。 | must | 1 | ✔ | CTX-ACTOR-001, CTX-CON-001, CTX-CON-007, CTX-ASM-008 |
| FR-005 | 測驗紀錄保存 | 系統 SHALL 在使用者已登入時，將每次測驗的版本、起訖時間、分數、結果與每題作答保存至 Firebase，並允許使用者查看自己的測驗歷史；測驗結果保存 3 個月（見 FR-033）。 | must | 2 | ✔ | CTX-ACTOR-001, CTX-ACTOR-002, CTX-CON-006, CTX-EXT-005, CTX-EXT-006 |
| FR-006 | 多維度分析報告 查詢 | 系統 SHALL 在已登入使用者扣點後，依「星座+MBTI」或「星座+MBTI+血型」組合從 Firestore 查詢對應的事先算好的多維度分析報告；血型「不知道」時 MUST 使用星座+MBTI 組合。查詢 MUST NOT 呼叫 AI API。 | must | 1 | ✔ | CTX-ACTOR-001, CTX-CON-005, CTX-CON-007, CTX-EXT-005, CTX-ASM-005, CTX-ASM-010, CTX-CON-014 |
| FR-007 | 固定報告內容呈現 | 系統 SHALL 在結果頁顯示類型名稱、摘要、優勢、盲點、感情/工作/溝通風格、成長建議與娛樂性免責說明。 | must | 1 | ✔ | CTX-ACTOR-001, CTX-CON-001 |
| FR-008 | 固定報告內容版本管理 | 系統 SHALL 為每份固定報告記錄 content_version，並 SHALL 支援在不重新部署後端的情況下更新內容；組合 (zodiac, blood_type, mbti_type) MUST 唯一。 | must | 2 | ✔ | CTX-ACTOR-003, CTX-CON-005, CTX-CON-004, CTX-EXT-005 |
| FR-009 | 多維度分析報告 組合覆蓋完整性 | 系統 SHALL 使所有合法組合都有可查詢的多維度分析報告：星座×MBTI 192 種，以及星座×MBTI×血型 768 種（共 960 種），且組合與內容 MUST 存放於 Firestore。 | must | 2 | ✔ | CTX-ACTOR-003, CTX-ASM-005, CTX-EXT-005, CTX-CON-005 |
| FR-010 | 結果分享卡 | 系統 SHALL 依固定結果產生可分享的結果卡，並提供分享入口。 | should | 2 | ✔ | CTX-ACTOR-001, CTX-EXT-003 |
| FR-011 | 點數購買流程 | 系統 SHALL 在點數不足時引導使用者購買點數，說明點數用途、價格與不退款，要求使用者勾選「同意立即提供數位內容、放棄解約」並記錄同意時間與條款版本，之後 SHALL 建立付款流程。 | must | 4 | ✔ | CTX-ACTOR-001, CTX-EXT-001, CTX-ASM-002, CTX-CON-014, CTX-CON-011 |
| FR-012 | 付款事件處理 | 系統 SHALL 接收付款服務 webhook，MUST 驗證簽章，並 MUST 以冪等方式處理重複事件後為使用者加點。 | must | 4 | ✔ | CTX-EXT-001, CTX-CON-003, CTX-CON-014 |
| FR-013 | 付款失敗處理與無退款告知 | 系統 SHALL 處理付款失敗狀態並據此更新使用者權限；系統不提供退款機制，付款前 SHALL 明確告知，並 SHALL 要求使用者勾選「同意立即提供數位內容、放棄解約」且記錄同意時間與條款版本。 | should | 4 | ✔ | CTX-EXT-001, CTX-ACTOR-004, CTX-CON-011 |
| FR-014 | 後端點數與權限驗證 | 系統 SHALL 在後端驗證使用者已登入且點數餘額足夠後才允許取得 summary 或生成／重新生成詳細分析，並 SHALL 提供查詢目前點數餘額的介面。 | must | 4 | ✔ | CTX-ACTOR-002, CTX-CON-003, CTX-CON-014 |
| FR-015 | 測驗資料正規化 | 系統 SHALL 將使用者的標籤、測驗分數、實際答案與作答紀錄整理為可供 AI 使用的正規化分析資料，並保留資料版本。 | must | 3 | ✔ | CTX-ACTOR-002, CTX-CON-009 |
| FR-016 | AI 深度報告生成 | 系統 SHALL 在已具備星座與 MBTI 結果（血型、人類圖選填）、點數餘額足夠（5 點）並扣點後呼叫 AI 供應商，依正規化資料生成包含八個建議章節（概況、行為模式、交叉觀察、優勢與盲點、感情與溝通、工作與決策、成長行動、依據與限制）的報告。 | must | 3 | ✔ | CTX-ACTOR-002, CTX-EXT-002, CTX-CON-009 |
| FR-017 | AI 報告依據與不確定性標示 | 系統 SHALL 使 AI 報告對重要結論附上資料依據、區分「測驗直接觀察」與「AI 推測」，在測驗結果衝突時指出差異與可能解釋，並對證據不足處使用不確定語氣。 | must | 3 | ✔ | CTX-CON-001, CTX-CON-009, CTX-EXT-002 |
| FR-018 | AI 報告保存與重複查看 | 系統 SHALL 保存已生成報告及其模型名稱、提示詞版本、輸入資料版本與生成時間；再次查看時 MUST 讀取已保存內容，MUST NOT 重新呼叫 AI。 | must | 3 | ✔ | CTX-ACTOR-002, CTX-CON-007 |
| FR-019 | 生成狀態與失敗處理 | 系統 SHALL 記錄報告生成狀態，並在逾時或失敗時依重試策略處理且向使用者回報明確錯誤；生成失敗 MUST NOT 造成點數被扣除（已扣者須返還），也不得無故重複扣點。 | must | 3 | ✔ | CTX-ACTOR-002, CTX-EXT-002, CTX-CON-007, CTX-CON-014 |
| FR-020 | 詳細分析重新生成 | 系統 SHALL 在使用者要求重新分析或新增資料時重新生成詳細分析；若該會員已生成過該組合的詳細分析，重新生成 MUST 扣 5 點，且 MUST 保留舊報告。 | should | 4 | ✔ | CTX-ACTOR-002, CTX-CON-007, CTX-CON-014, CTX-CON-011 |
| FR-021 | AI 報告存取控制 | 系統 SHALL 在每個報告 API 驗證請求者為該報告的擁有者，否則 MUST 拒絕存取。 | must | 3 | ✔ | CTX-ACTOR-002, CTX-CON-003, CTX-CON-006 |
| FR-022 | AI 用量記錄與限制 | 系統 SHALL 記錄每次 AI 呼叫的模型、輸入/輸出 Token 與預估成本，並 SHALL 限制生成頻率、單次 Token 上限與使用額度。 | must | 3 | ✔ | CTX-ACTOR-004, CTX-CON-007 |
| FR-023 | 資料刪除與帳號刪除 | 系統 SHALL 允許使用者刪除自己的測驗資料與 AI 報告，並 SHALL 允許使用者刪除帳號；刪除帳號時 MUST 移除該使用者的全部紀錄（個人資料、測驗結果、summary、詳細分析、人類圖、點數、付款），僅保留贈點紀錄；同一 Google 帳號再次登入 MUST 視為全新帳號，不繼承任何歷史紀錄；隱私政策 MUST 載明保留的贈點紀錄。 | must | 1 | ✔ | CTX-ACTOR-001, CTX-ACTOR-002, CTX-CON-006, CTX-CON-012, CTX-EXT-005, CTX-EXT-006, CTX-ASM-011 |
| FR-024 | 作答時間蒐集告知 | 系統 SHALL 僅在已告知使用者的前提下蒐集每題作答時間（response_time_ms）。 | should | 3 | ✘ | CTX-ACTOR-001, CTX-CON-006 |
| FR-025 | 個人中心 | 系統 SHALL 提供個人中心，顯示測驗歷史、報告歷史、付費狀態與資料管理入口。 | should | 2 | ✔ | CTX-ACTOR-001, CTX-ACTOR-002 |
| FR-026 | 產品指標每日計數 | 系統 SHALL 在伺服器端以每日計數彙總測驗完成、summary 取得、報告生成成功／失敗、付款完成與分享卡產生，計數 MUST NOT 含個人資料。 | should | 3 | ✘ | CTX-ACTOR-004 |
| FR-027 | 智力／認知測驗 | 系統 SHALL 提供智力／認知測驗，獨立呈現正確率、題型表現、作答時間與題目難度，且 MUST NOT 宣稱為正式 IQ。 | could | 5 | ✘ | CTX-ACTOR-001, CTX-CON-002, CTX-CON-008 |
| FR-028 | 延伸專題測驗 | 系統 SHALL 以既有測驗框架新增感情、職涯、溝通等專題測驗，並可納入 AI 報告。 | could | 5 | ✘ | CTX-ACTOR-001, CTX-CON-008 |
| FR-029 | 會員訂閱 | 系統 SHALL 提供月/年訂閱方案，含每期 AI 報告額度與更多測驗類型。 | could | 5 | ✘ | CTX-ACTOR-002, CTX-EXT-001, CTX-ASM-002, CTX-CON-008 |
| FR-030 | 歷史結果比較 | 系統 SHALL 讓付費使用者比較不同時間的測驗結果與報告。 | could | 5 | ✘ | CTX-ACTOR-002, CTX-CON-008 |
| FR-031 | AI 對話式人格探索 | 系統 MAY 提供 AI 對話式人格探索作為會員功能（是否推出待評估）。 | could | 5 | ✘ | CTX-ACTOR-002, CTX-EXT-002, CTX-CON-008 |
| FR-032 | 訪客使用與登入後儲存 | 系統 SHALL 允許未登入訪客完成測驗並查看結果；訪客當次結果 SHALL 以 session id 暫存於 Firestore，TTL 為 1 天，且 MUST NOT 與任何帳號關聯或永久保存；訪客當次選擇登入時，SHALL 依 session id 將暫存結果存入其帳號；app 內 MUST 明確提示「未登入將不保留結果」並引導 Google 登入。已登入使用者的結果 SHALL 保留。使用點數（取得 summary 或詳細分析）前 MUST 已登入。 | must | 1 | ✔ | CTX-ACTOR-001, CTX-EXT-006, CTX-EXT-005, CTX-ASM-004, CTX-ASM-008 |
| FR-033 | 資料到期刪除 | 系統 SHALL 在會員的測驗作答與結果、多維度分析報告、MBTI 欄位與人類圖結果滿 3 個月後、詳細分析滿 6 個月後（各以產生時間點起算）自動刪除；付款紀錄 MUST NOT 因保留期限被刪除。 | must | 2 | ✔ | CTX-CON-012, CTX-CON-006, CTX-EXT-005, CTX-ACTOR-001, CTX-ACTOR-002 |
| FR-034 | 詳細分析報告書下載（寄送 email） | 系統 SHALL 讓使用者在報告到期前消耗 1 點，將詳細分析報告書以 PDF 寄送至其 email；若該報告已下載過，系統 MUST 提醒並經使用者確認後才重複扣點與寄送。 | should | 4 | ✘ | CTX-ACTOR-002, CTX-CON-012, CTX-CON-014, CTX-EXT-007 |
| FR-035 | 資料到期前通知 | 系統 SHALL 以 email 在會員的測驗結果、多維度分析報告、人類圖與詳細分析到期前 14 天與 3 天各通知一次；同一使用者同時有多筆到期時合併為一封。 | should | 5 | ✘ | CTX-ACTOR-001, CTX-CON-012, CTX-EXT-007 |
| FR-036 | 人類圖計算 | 系統 SHALL 在使用者提供出生時間與出生地點時計算人類圖（固定結果，MUST NOT 呼叫 AI），結果包含 5 種能量類型之一、9 大能量中心、12 種人生角色組合之一、內在權威、策略、定義與通道、64 個閘門；未提供出生時間與地點時 MUST NOT 產生人類圖；已登入使用者計算出的人類圖結果 SHALL 儲存於其帳號（訪客僅暫存於 session，TTL 1 天），且 SHALL 可單獨檢視且不扣點，不需先生成詳細分析。人類圖納入詳細分析的輸入，不屬多維度分析報告 的組合。 | must | 3 | ✔ | CTX-ACTOR-001, CTX-ASM-006, CTX-CON-007 |
| FR-037 | 點數帳戶與註冊贈點 | 系統 SHALL 為每個新建立的帳號建立點數帳戶，並 SHALL 贈送 3 點；贈點 MUST 每帳號僅發放一次；同一 Google 帳號於上次贈點後 3 個月內刪帳號再註冊 MUST NOT 再次發放（以贈點紀錄判斷）；贈點紀錄僅用於避免重複贈點，不作他用。 | must | 3 | ✔ | CTX-ACTOR-001, CTX-CON-014, CTX-EXT-006, CTX-EXT-005 |
| FR-038 | 點數扣抵 | 系統 SHALL 於會員首次取得某組多維度分析報告 時扣 1 點、生成詳細分析時扣 5 點、下載報告書時每次扣 1 點（重複下載再扣）；餘額不足時 MUST 拒絕並引導購點；扣點與結果交付 MUST 一致；訪客 MUST NOT 可取得多維度分析報告。 | must | 3 | ✔ | CTX-ACTOR-001, CTX-ACTOR-002, CTX-CON-014, CTX-ASM-010 |
| FR-039 | 點數異動紀錄 | 系統 SHALL 記錄每次點數發放、購買、扣除與返還，使用者可查看自己的點數紀錄。 | must | 3 | ✔ | CTX-ACTOR-002, CTX-CON-014 |
| FR-040 | 單項免費結果 | 系統 SHALL 允許使用者（含訪客）不扣點取得單項結果：依生日取得星座結果、依血型取得血型分析、完成 MBTI 測驗取得 MBTI 結果；結果皆為固定內容，MUST NOT 呼叫 AI，且 MUST NOT 儲存（每次重新取得）。 | must | 1 | ✔ | CTX-ACTOR-001, CTX-CON-007, CTX-CON-014, CTX-EXT-005, CTX-ASM-010 |
| FR-041 | 避免重複扣點 | 系統 SHALL 對同一會員已生成過的多維度分析報告 組合直接回傳已存結果且 MUST NOT 再次扣點；重複點擊或並行請求 MUST NOT 造成重複扣點。 | must | 3 | ✔ | CTX-ACTOR-002, CTX-CON-014, CTX-EXT-005 |
| FR-042 | 點數有效期 | 系統 SHALL 為點數設定有效期：購買的點數為無限期，贈點有效期 90 天；過期點數 MUST NOT 可用於扣抵；扣抵順序為先到期先扣、無限期批次最後。 | must | 3 | ✔ | CTX-ACTOR-001, CTX-ACTOR-002, CTX-CON-014 |
| FR-043 | 付款紀錄保存 | 系統 SHALL 在帳號存續期間永久保存付款紀錄，不受測驗結果保留期限影響；使用者刪除帳號時 SHALL 一併移除付款紀錄。 | must | 4 | ✔ | CTX-CON-012, CTX-EXT-001, CTX-ACTOR-004 |

## Non-Functional Requirements

| ID | 類別 | 標題 | Metric | Priority | Context |
|---|---|---|---|---|---|
| NFR-001 | security | 外部輸入驗證 | 所有 API 皆有 schema 驗證；未通過者回傳明確錯誤 | must | CTX-CON-003 |
| NFR-002 | security | 秘密與金鑰保護 | 前端 bundle 中 0 個秘密金鑰 | must | CTX-CON-003, CTX-EXT-001, CTX-EXT-002 |
| NFR-003 | security | 授權與存取控制 | 未授權存取一律被拒絕（需以測試驗證） | must | CTX-CON-003, CTX-ACTOR-002, CTX-EXT-005, CTX-EXT-006 |
| NFR-004 | security | Webhook 可靠性 | 同一事件重送 N 次，最終狀態與送一次相同 | must | CTX-EXT-001 |
| NFR-005 | privacy | 資料最小化與保留 | 測驗結果、多維度分析報告、MBTI、人類圖保留 3 個月；詳細分析保留 6 個月；付款紀錄於帳號存續期間永久保存；刪除帳號時移除全部紀錄（贈點紀錄保留 3 個月）；訪客暫存結果 TTL 1 天 | must | CTX-CON-006, CTX-CON-012 |
| NFR-006 | privacy | 日誌敏感資料 | 日誌抽樣檢查 0 筆完整答案/報告內容 | must | CTX-CON-006 |
| NFR-007 | compliance | 結果免責與內容合規 | 100% 結果頁含免責說明；固定測試案例中 0 筆診斷式輸出 | must | CTX-CON-001, CTX-CON-002 |
| NFR-008 | cost | AI 成本控管 | 未量化，需與相關人確認（單份報告成本上限、Token 上限） | must | CTX-CON-007, CTX-ACTOR-004 |
| NFR-009 | performance | AI 報告生成時間 | 單次生成逾時 120 秒（Vercel 函式 maxDuration），逾時視為失敗並返還點數；p95 等待時間待上線量測 | must | CTX-EXT-002, CTX-ACTOR-002, CTX-CON-010, CTX-EXT-004 |
| NFR-010 | performance | 固定報告查詢效能 | 未量化，需與相關人確認（例如 p95 延遲） | should | CTX-CON-004, CTX-CON-007 |
| NFR-011 | reliability | AI 供應商故障容忍 | 未量化，需與相關人確認（可用性目標 SLA） | must | CTX-EXT-001, CTX-EXT-002 |
| NFR-012 | maintainability | 內容與測驗資料驅動 | 新增一份報告內容或一種測驗無需修改核心程式碼 | must | CTX-CON-005, CTX-CON-008, CTX-CON-010 |
| NFR-013 | quality | AI 報告品質驗證 | 未量化，需與相關人確認（通過準則） | should | CTX-CON-009, CTX-EXT-002 |
| NFR-014 | content-quality | 固定報告文案差異度 | 未量化，需與相關人確認（重複度門檻、審核通過率） | should | CTX-ACTOR-003, CTX-CON-005 |
| NFR-015 | observability | 指標與可追蹤性 | 每份 AI 報告 100% 記錄上述三項欄位 | should | CTX-ACTOR-004, CTX-EXT-002 |
| ~~NFR-016~~ | security | 已廢止：前端計算結果不可信 | user 更正為後端計算固定結果，前端計算結果不可信的前提不再成立 | — | — |
| NFR-017 | reliability | 點數一致性與防重複 | 並行 N 次扣點請求，餘額變動與成功次數一致；贈點每帳號 1 次 | must | CTX-CON-014, CTX-EXT-005, CTX-EXT-001 |

## 待確認（已採納建議，以下為尚待落實或需外部確認）

- 點數實際價格：上線前量測單份 AI 報告成本後決定（FR-011）
- 人類圖：計算庫是否支援月交點與授權、欄位定義須對照官方教材、預設城市清單範圍（FR-036）
- 多維度分析報告 內容：約 20 組試讀後再擴到 960（FR-009）
- 法務確認：「無退款」勾選同意是否足以排除解約權、MBTI 商標與題庫、贈點雜湊紀錄的隱私政策（CTX-CON-011、CTX-CON-015、FR-037）
- Vercel 方案：確認 Hobby 非商業使用限制，營運用 Pro（CTX-CON-010）
- Email 寄送服務供應商與 PDF 產生庫（FR-034）
- AI 生成 p95 等待時間：上線後量測（NFR-009）
- 到期通知（Phase 5）、後台 API 與事件檢視（MVP 後）
- 計畫書 §7 資料表設計已改寫為 Firestore 資料模型（data-model.yaml）
