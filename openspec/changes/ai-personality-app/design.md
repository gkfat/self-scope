## Context

- 全新專案（greenfield）。計畫書 `ai_personality_app_plan.md` 與分析產出 `openspec/analysis/` 為上游；本設計以 `data-model.yaml`、`api-model.yaml`、`domain-model.yaml` 為準。
- 技術棧已定：Nuxt 4（SPA、`ssr: false`）、Vue、Vuetify、Vite，部署 Vercel（Pro）；資料庫 Firestore，僅由 Nitro 伺服器端以 firebase-admin 存取；登入為 Firebase Auth 的 Google provider。
- 參考專案 `gkbot-adventure-run`：`server/utils/firebaseAdmin.ts`、`auth.ts`、`middleware/auth.global.ts`、`repositories/base.repository.ts`、`shared/` 的 Zod schema、`firestore.rules` 全擋、`vercel.json` 的 Cron。
- 利害關係人：單人開發與營運；外部：付款服務、AI 模型供應商（皆未選定）。

## Goals / Non-Goals

**Goals:**
- 用最少元件完成第一版端到端流程：訪客測驗 → 登入保存 → 點數 → summary → AI 詳細分析。
- 點數、付款與報告生成具備原子性與冪等，使用者不會被重複扣點。
- 資料保留與刪除規則（1 天／3 個月／6 個月／帳號存續）由系統強制，不靠人工。
- 固定內容資料驅動，更新免重新部署。

**Non-Goals:**
- 智力測驗、專題測驗、訂閱、歷史比較、AI 對話。
- 到期通知、報告書 PDF 寄送、產品指標計數、後台 API（皆 MVP 後）。
- 不做地理編碼 API、不做即時推播。

## Decisions

### D1. 伺服器分層與驗證
沿用參考專案：`server/api`（H3 handler）→ `services`（業務邏輯）→ `repositories`（Firestore）。請求與回應以 Zod schema 定義於 `shared/schemas/api/`，Firestore 文件 schema 於 `shared/schemas/firestore/`，OpenAPI 由同一批 schema 產生（對應 `render/api.yaml`）。
- 替代方案：client 直連 Firestore 並以 security rules 控管。否決：點數、扣點、付款權限無法安全放在 client；與使用者要求「Firestore 只由 Nuxt 處理」一致。
- `firestore.rules` 全擋；所有存取走 Admin SDK。

### D2. 認證與端點分類
- 預設所有 `/api/*` 需 Firebase ID token（Bearer），沿用 `auth.global.ts`。
- 公開（無需 token）：`/auth/login`（自行驗 token）、`/guest-sessions` 建立、固定單項結果、`/tests` 列表與題目、`/human-design/calculations`（可帶訪客 header）。
- 可選驗證（Bearer 或 `X-Guest-Session-Id` 或皆無）：測驗送出、人類圖計算、分享卡。
- 其餘（summary、詳細分析、點數、付款、帳號）一律需登入。付款 webhook 以簽章驗證，cron 以 `CRON_SECRET` 驗證，兩者不走 Firebase auth。

### D3. Firestore 資料模型（摘要，細節見 `data-model.yaml`）
- `users/{uid}` 為根，其下子集合：`testAttempts`、`summaries`、`detailedReports`、`pointAccount/main`、`pointBatches`、`pointTransactions`、`payments`、`humanDesign/main`。刪帳號以 recursive delete 一次移除。
- 頂層：`guestSessions`（TTL 1 天）、`tests/{id}/versions`、`fixedContents`、`pointPackages`、`aiUsageRecords`、`welcomeGrants`（TTL 3 個月）。
- 以決定性文件 ID 取代唯一約束：`fixedContents/{type}_{key}`、`summaries/{組合}`、`pointTransactions/{操作}`、`welcomeGrants/{HMAC(uid)}`。
- 替代方案：關聯式資料庫（計畫書原建議 PostgreSQL）。否決：使用者已指定 Firebase；子集合對「依使用者整批刪除」很合適。

### D4. 點數一致性
扣點、建立 summary／報告、寫入異動必須在同一個 Firestore transaction 內完成。冪等靠決定性 ID：`pointTransactions/summary_{組合}_{取得時間}`（含取得時間，過期後再買同一組合才是新的一次扣點）、`report_{reportId}`、`refund_{reportId}`、`download_{reportId}_{序號}`（後者 MVP 後）。可用餘額不存欄位，由「未過期且有剩餘」的批次加總；失敗返還時若原批次已過期，點數改放入新的不過期 `REFUND` 批次，避免使用者因時間差損失點數；扣抵順序先到期先扣、無限期批次最後；`remaining` 不得為負。
- 替代方案：在 `pointAccount` 存餘額欄位。否決：贈點過期是隨時間發生、無寫入，欄位會過時。

### D5. AI 詳細分析：非同步與逾時
`POST /detailed-reports` 在 transaction 內扣 5 點並建立狀態 `GENERATING` 的報告後回 202；背景工作呼叫 AI、驗證輸出、寫入結果；前端以 `GET /detailed-reports/{id}` 輪詢。單次逾時 120 秒，失敗或逾時寫入 `FAILED` 並返還點數。AI 輸出以 Zod 驗證（八章節、`evidenceKind`、免責說明），不合格視為失敗。AI 供應商以 service 介面封裝，金鑰只在伺服器。
- 背景執行機制是本設計的主要未知（見 Open Questions）：預期使用 Vercel 函式在回應後繼續執行的機制，需先做技術驗證；若不可行，改用外部佇列或讓前端分段觸發。
- 替代方案：同步等待。否決：前端長時間等待與連線中斷風險高，且浪費使用者等待。

### D6. 訪客 session
`POST /guest-sessions` 以密碼學安全隨機值（≥128 bit）產生 sessionId，存 `guestSessions`（`expiresAt = 建立後 1 天`，Firestore TTL）。訪客結果寫入該文件；登入後呼叫 `claim` 以 session id 取出並寫入帳號；claim 成功即清除暫存資料，但保留一個只含 `claimedBy` 的墓碑文件直到 TTL，讓重送的 claim 冪等、並擋下他人認領。建立頻率以 Firestore 固定視窗計數（`rateLimits/{key}_{windowStart}`，`expiresAt` 為 TTL 欄位，IP 以 HMAC 雜湊後才當鍵）限制，每 IP 每小時 20 個 session。
- 替代方案：純 client 暫存（localStorage）。否決：使用者要求以 session id 暫存於 Firestore。

### D7. 人類圖
固定計算、不呼叫 AI。出生地點採靜態預設城市清單（代碼、經緯度、IANA 時區），不串外部地理編碼。天文曆計算庫尚未選定，列為第一個技術驗證項目（需支援月交點、授權可商用）。結果存 `users/{uid}/humanDesign/main`（3 個月），輸入以摘要比對是否過時，不另存原始出生時間與地點（只在 `users.birthData`）。

### D8. 固定內容
`fixedContents` 由匯入腳本（JSON／CSV）寫入，審核用 Git，狀態 `DRAFT → REVIEWED → PUBLISHED`；僅 `PUBLISHED` 對使用者可見。內容存放與發布不需重新部署。覆蓋檢查腳本核對 960 種 summary 組合（192 + 768）與單項內容。

### D9. 保留與刪除
- 每日一次 Vercel Cron（`GET /cron/data-expiry`，`CRON_SECRET`）清除到期的 `testAttempts`、`summaries`、MBTI 欄位、`humanDesign`（3 個月）與 `detailedReports`（6 個月），以 collection group 的 `expiresAt` 索引查詢；單筆失敗記錄並下次重試。
- Firestore TTL 僅用於 `guestSessions` 與 `welcomeGrants`。
- 刪帳號：recursive delete `users/{uid}`；`aiUsageRecords` 保留並清除 userId；`welcomeGrants` 保留；最後刪除 Firebase Auth user（使 Google 帳號與 email 不再留在 Firebase）。贈點雜湊以 Google 帳號 id（ID token 的 `firebase.identities['google.com']`）計算，不用 Firebase uid，因為 Auth user 被刪除後再登入會得到新的 uid，若以 uid 為鍵會繞過防重複贈點。
- TTL 欄位（`guestSessions.expiresAt`、`welcomeGrants.expiresAt`）必須存 Firestore Timestamp（Date），其餘時間欄位為 epoch 毫秒；TTL 清除有延遲，程式判斷時以時間比較為準，不只看文件是否存在。

### D10. 付款
付款供應商以介面封裝（建立 checkout、驗證 webhook、取得事件 ID）。建立付款前要求 `acceptDigitalContentTerms=true` 與 `termsVersion`，同意時間與版本隨付款紀錄保存。webhook 先驗簽，再以 `payments/{id}.processedEventIds` 判斷重複，成功事件在同一 transaction 內建立購買批次與異動。

### D11. 前端
Vuetify 頁面：首頁、測驗、結果、點數與購買、個人中心、詳細分析。登入狀態以 composable 管理（沿用 `useAuth`、`useApi` 模式：附 Bearer、401 時刷新 token 重試一次）。訪客頁面需明確顯示「未登入將不保留結果」。不新增狀態管理套件。

## Risks / Trade-offs

- [AI 背景執行機制不確定] → 先做技術驗證；備案為外部佇列或前端分段觸發；任何新增依賴先取得同意。
- [人類圖計算庫（月交點、授權）與準確度] → 列為 Phase 3 早期技術驗證；預設城市清單降低時區誤差，但仍須對照官方教材與已知命盤抽樣驗證。
- [Firestore transaction 競爭（同一使用者並行扣點）] → 決定性文件 ID 讓並行請求收斂為一次；transaction 失敗自動重試；補並行測試。
- [固定內容 960 份的品質與重複度] → 先小量試讀再擴大；匯入時做重複度檢查。
- [刪帳號後的贈點紀錄仍含 Google 帳號雜湊] → 僅用於避免重複贈點、HMAC 加密鑰、隱私政策載明，並待法務確認。
- [「無退款」是否足以排除解約權] → 付款前勾選同意並留存；上線前由法務確認。
- [MBTI 商標] → 對外用「16 型人格」、自行撰寫題目；法務確認。
- [Vercel Hobby 限非商業使用] → 營運使用 Pro；上線前核對官方條款。
- [訪客濫用 session 建立] → 建立端點限流。

## Migration Plan

全新專案，無資料遷移。部署順序：
1. 建立 Firebase 專案（Firestore、Authentication 的 Google provider、授權網域加入 Vercel 網域）。
2. 部署 `firestore.rules`（全擋）、`firestore.indexes.json`（複合與 collection group 索引）、設定 TTL 政策（`guestSessions.expiresAt`、`welcomeGrants.expiresAt`）。
3. 建立 Vercel Pro 專案與環境變數（Firebase 服務帳號、`NUXT_PUBLIC_FIREBASE_*`、`CRON_SECRET`、HMAC 密鑰、AI 與付款金鑰）。
4. 匯入測驗定義與固定內容（先匯入試讀的約 20 組，再擴大）。
5. 於測試環境完成端到端驗證後上線。
回滾：Vercel 還原上一版部署；Firestore 為追加式結構，向後相容。

## Open Questions

- AI 詳細分析的背景執行機制（回應後繼續執行 vs 外部佇列）。
- 付款服務與 AI 模型供應商的選擇。
- 人類圖計算庫與預設城市清單的範圍。
- 點數實際售價（待量測單份 AI 報告成本）。
- 法務確認：無退款同意機制、MBTI 商標、贈點雜湊紀錄的隱私揭露。
- `DELETE /account/data` 與「刪帳號移除全部」的界線已定，但 UI 文案待設計。
