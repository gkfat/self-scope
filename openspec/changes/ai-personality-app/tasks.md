## 1. 專案骨架與基礎設施

- [x] 1.1 建立 Nuxt 4（SPA、`ssr: false`）專案，設定 Vuetify、Vite、`nitro.preset: 'vercel'`、TypeScript strict；沿用 `gkbot-adventure-run` 的 `nuxt.config.ts`、`tsconfig.json`、`eslint.config.mjs`、`vitest.config.ts`、`vercel.json`（新增套件前先取得同意）
- [x] 1.2 建立 `config/config.ts`（環境變數讀取與驗證）與 `.env.example`（Firebase、`CRON_SECRET`、HMAC 密鑰、AI 與付款金鑰占位）
- [x] 1.3 移植 `server/utils/firebaseAdmin.ts`、`errorHandler.ts`、`logger.ts`，與 `shared/types/errors.ts`（AppError 系列）
- [x] 1.4 移植 `server/repositories/base.repository.ts` 與 `BaseService`
- [x] 1.5 建立 `firestore.rules`（全擋 client）、`firebase.json`、`.firebaserc`（新專案 ID）、`firestore.indexes.json` 初版
- [x] 1.6 設定 `.gitignore`，確認不納入 `.env` 與服務帳號金鑰（不得複製參考專案的 `.env`、`service_account.json`）
- [ ] 1.7 （進行中：Firestore 已建立、服務帳戶可用、規則已部署；尚缺 Authentication 啟用與 Google provider、索引與 TTL 權限、Vercel 設定）建立 Firebase 專案、啟用 Firestore 與 Authentication 的 Google provider、授權網域加入 Vercel 網域；建立 Vercel Pro 專案並設定環境變數

## 2. 認證與帳號

- [x] 2.1 實作 `server/utils/auth.ts`（`verifyAuthToken`、`requireAuth`、可選驗證）與 `server/middleware/auth.global.ts`，明列公開與可選驗證路徑
- [x] 2.2 實作前端 `app/plugins/firebase.client.ts`、`useAuth`（Google 登入）、`useApi`（Bearer 與 401 重試一次）
- [x] 2.3 定義 `shared/schemas/api/auth` 與 `shared/schemas/firestore/user`（Zod）
- [x] 2.4 實作 `POST /api/auth/login`：驗 ID token、首次登入建立 `users`、`pointAccount/main`、贈點批次與異動，並於同一 transaction 檢查 `welcomeGrants`（HMAC uid）
- [x] 2.5 實作 `welcomeGrants` 寫入與 TTL 欄位（3 個月）；撰寫單元測試：首次、並行首次、3 個月內再註冊不贈點、超過 3 個月再贈點
- [x] 2.6 實作 `GET`／`PUT /api/profile`（Zod 驗證、生日星座必填、血型與 MBTI 選填、城市代碼檢查、`mbtiExpiresAt`）
- [x] 2.7 實作 `DELETE /api/account/data`（`scopes` 必填）與 `DELETE /api/account`（recursive delete、保留 `welcomeGrants`、`aiUsageRecords` 清除 userId），並補測試

## 3. 訪客 session

- [x] 3.1 實作 `POST /api/guest-sessions`（≥128 bit 隨機 id、`expiresAt` = 1 天、建立頻率限制）與 TTL 政策設定
- [x] 3.2 實作 `PUT /api/guest-sessions/{id}/profile` 與訪客暫存結果寫入共用 service
- [x] 3.3 實作 `POST /api/guest-sessions/{id}/claim`（冪等、410 過期、寫入帳號後清除）與測試
- [x] 3.4 前端：訪客提示「未登入將不保留結果」元件與登入入口，並串接 claim 流程

## 4. 固定內容與單項結果

- [x] 4.1 定義 `fixedContents` 的 Zod schema、決定性文件 ID 規則與狀態（DRAFT／REVIEWED／PUBLISHED）
- [x] 4.2 實作內容匯入腳本（JSON／CSV、schema 驗證、版本遞增、錯誤列回報）與覆蓋檢查腳本（960 種 summary 與單項內容）
- [ ] 4.3 準備約 20 組代表性 summary 與單項內容試讀資料並匯入測試環境（草稿已寫入 `content/fixed/` 並以 DRAFT 匯入；待你審閱修改後，把 `status` 改為 `PUBLISHED` 再匯入）
- [x] 4.4 實作 `GET /api/fixed-results/zodiac`、`GET /api/fixed-results/blood-types/{bloodType}`（不扣點、不儲存、僅 PUBLISHED、附免責說明）
- [x] 4.5 建立星座與預設城市清單（代碼、經緯度、IANA 時區）靜態資料與前端選單

## 5. 16 型人格測驗

- [x] 5.1 撰寫自有題庫與評分規則（對外名稱「16 型人格」），匯入 `tests` 與 `tests/{id}/versions`
- [x] 5.2 實作 `GET /api/tests`、`GET /api/tests/{id}`（不含評分資訊）
- [x] 5.3 實作 `POST /api/tests/{id}/submissions`：後端計分、版本記錄、登入者保存（3 個月）、訪客暫存、`responseTimeConsent` 處理
- [x] 5.4 實作 `GET /api/test-attempts`，並補計分與版本的單元測試
- [x] 5.5 前端：測驗頁、結果頁（含免責說明與訪客提示）

## 6. 點數系統

- [x] 6.1 定義點數相關 Zod schema 與 repository（`pointAccount`、`pointBatches`、`pointTransactions`）
- [x] 6.2 實作 `PointService`：批次選取（先到期先扣、無限期最後）、transaction 內扣點與決定性異動 ID、餘額不為負、返還
- [x] 6.3 實作 `GET /api/points`、`GET /api/points/transactions`（游標分頁）
- [x] 6.4 並行與冪等測試：同一請求並行多次只扣一次、跨批次扣點、過期批次不計入、失敗返還只返一次
- [x] 6.5 前端：點數餘額、效期與異動紀錄頁

## 7. 多維度分析報告

- [x] 7.1 實作 `POST /api/summaries`：登入必要、組合鍵決策（缺 MBTI 回 422、血型未知用星座+MBTI）、已取得不扣點、扣 1 點與建立 `summaries/{組合}` 同一 transaction、`Idempotency-Key`
- [x] 7.2 實作 `GET /api/summaries`、`GET /api/summaries/{id}`（不扣點、僅未到期）
- [x] 7.3 前端：summary 取得流程（點數不足導向購買、重複取得提示）與結果頁
- [x] 7.4 撰寫整合測試覆蓋：首次、重複、點數不足、訪客、缺 MBTI、並行

## 8. 人類圖

- [x] 8.1 技術驗證：選定天文曆計算庫（確認支援月交點、授權可商用），用已知命盤抽樣驗證結果；新增套件前先取得同意
- [x] 8.2 實作人類圖計算 service（輸入城市代碼與出生時間、輸出類型、能量中心、人生角色、內在權威、策略、定義與通道、閘門）與單元測試
- [x] 8.3 實作 `POST /api/human-design/calculations`（訪客暫存／登入者儲存、輸入摘要、3 個月到期）與 `GET /api/human-design`，並擴充 `GuestSessionService.claim` 將訪客暫存的人類圖存入帳號，以及讓 `ShareCardService` 支援 `HUMAN_DESIGN`
- [x] 8.4 前端：人類圖輸入與結果頁（含免責說明）
- [x] 8.5 前端：人類圖圖形（SVG Bodygraph，九個中心、36 條通道、64 個閘門，人格黑／設計紅／兩者皆有），版面座標與圖形模型有單元測試
- [x] 14.1 UI 改版第一階段：共用版型與導覽（手機底部四分頁、桌面頂端導覽、點數標籤）、單一品牌色主題、「我的資料」頁（訪客存 session、會員存帳號）、探索首頁（四層進度與下一步）、合成分析入口頁；訪客資料讀取 API 與進度計算有測試
- [ ] 14.2 UI 改版第二階段（進行中：首頁填寫區與星座／血型分析頁 `/analysis/zodiac/{sign}`、`/analysis/blood/{type}` 已完成；待辦：測驗、人類圖、多維度分析報告、詳細分析、點數與購買頁改用統一元件與「花點數」確認面板）
- [x] 14.4 星座分析內容擴充為三層（快速認識、深入理解、成長練習）：內容 schema 新增深層動機、日常情境、人際盲點、優勢過度使用、成長練習（皆為選填，舊內容仍有效）；結果頁改為三層展開；天蠍座已寫入示範內容，其餘 11 星座待審閱後撰寫
- [x] 14.5 首頁分析等級：四張維度卡順序為星座、血型、人類圖、MBTI；填寫區新增出生時間與出生城市；只填日期解鎖簡易星座分析，加填時間與城市解鎖進階星座分析（固定結果，免費，內容待規劃，目前為示意按鈕）；需搭配當下時間的即時星象分析為點數解鎖（內容與點數待規劃，目前為示意按鈕）
- [x] 14.6 人類圖報告頁：橫幅、概覽小卡、通道卡（名稱、閘門、連接的中心、固定的一句說明）與「還沒成對的閘門」；36 條通道名稱與說明為固定內容（`shared/constants/humanDesignChannels.ts`、`humanDesignChannelMeanings.ts`），待審閱；64 個閘門的名稱與說明見 `humanDesignGates.ts`，待審閱
- [x] 14.7 人類圖報告頁：能量中心與通道拆為兩張卡；有定義的中心以 outlined 小卡呈現並附簡短意義（`humanDesignCenterMeanings.ts`）；「已連接的通道」與「未連接的通道」對照（每列最多 3 欄）；頁面下方新增常見問題（算法、黑紅意義、閘門／通道／中心關係、完整與不完整通道、定義與開放中心、各項名詞、出生時間與地點、與其他網站差異、準確性）
- [x] 14.8 星座報告頁 `/analysis/zodiac/{sign}`：與人類圖報告同版型（橫幅、第二列星座名）；下方「星座分析」三層內容與「進階星盤」兩張 outlined 卡；進階星盤依出生時間與城市算出太陽、月亮、水星、金星、火星、木星、土星與上升的星座（`POST /api/zodiac/natal-chart`，固定計算，已用愛因斯坦星盤核對）；未填時間與城市時顯示模糊骨架與填寫提示；首頁兩個星座按鈕導向同頁；此頁不放分享、其他維度、登入提示。各星座落點說明（8 個位置 × 12 星座共 96 段，`natalPlacementMeanings.ts`）待審閱；結果檢視不使用折疊面板，以 outlined 卡片分組
- [ ] 14.3 UI 改版第三階段：結果到期倒數提醒、登入後自動保存的提示、空狀態與錯誤文案、手機寬度檢查

## 9. 付款

- [x] 9.1 定義付款供應商介面（建立 checkout、驗證 webhook、取得事件 ID），並提供僅限非 production 的 dev 供應商供本機驗證
- [ ] 9.7 選定付款供應商後，實作對應的 `PaymentProvider`（建立 checkout、webhook 驗簽）並於 `server/payment/index.ts` 註冊
- [x] 9.2 實作 `GET /api/point-packages`、匯入點數方案資料（價格待量測成本後決定）
- [x] 9.3 實作 `POST /api/payments`（需 `acceptDigitalContentTerms` 與 `termsVersion`、記錄同意）與 `GET /api/payments`
- [x] 9.4 實作 `POST /api/payments/webhook`：驗簽、`processedEventIds` 冪等、成功事件於同一 transaction 建立購買批次與異動、失敗事件不入帳
- [x] 9.5 測試：簽章無效、重複事件、無法對應使用者、付款失敗
- [x] 9.6 前端：購買頁（用途、價格、無退款說明與同意勾選）

## 10. AI 詳細分析

- [x] 10.1 技術驗證：決定回應後繼續執行的背景機制（Vercel 函式、外部佇列或前端分段觸發），並驗證 120 秒逾時與 `maxDuration` 設定
- [x] 10.2 定義 AI service 介面、提示詞版本、輸入正規化（`AnalysisInput`）與輸出 Zod schema（八章節、`evidenceKind`、免責說明）
- [x] 10.3 實作 `POST /api/detailed-reports`：前置條件檢查（星座與 MBTI）、transaction 內扣 5 點與建立 GENERATING 報告、回 202、`Idempotency-Key`、頻率與額度限制
- [x] 10.4 實作生成流程：呼叫 AI、驗證輸出、寫入結果與 `expiresAt`（6 個月）、記錄 `aiUsageRecords`；失敗或逾時寫入 FAILED 並返還點數
- [x] 10.5 實作 `GET /api/detailed-reports`、`GET /api/detailed-reports/{id}`（僅擁有者、不扣點）、`POST /api/detailed-reports/{id}/regenerations`（再扣 5 點、舊報告保留）
- [ ] 10.6 建立固定測試案例檢查報告品質（矛盾、重複、刻板化、過度自信、診斷式內容），作為驗收任務
- [x] 10.7 前端：生成頁（點數確認、輪詢狀態、失敗提示）與報告頁

## 11. 資料保留與排程

- [x] 11.1 實作 `GET /api/cron/data-expiry`（`CRON_SECRET` 驗證），清除到期的測驗結果、summary、MBTI 欄位、人類圖（3 個月）與詳細分析（6 個月），不動付款紀錄
- [x] 11.2 設定 collection group 的 `expiresAt` 複合索引、`vercel.json` 的 Cron 排程，以及 `guestSessions`、`welcomeGrants` 與 `rateLimits` 的 TTL 政策（索引與 Cron 已在程式碼中設定；TTL 政策須由有權限者依 `docs/firebase-setup.md` 在 Firebase 啟用）
- [x] 11.3 測試：到期刪除、單筆失敗重試、未授權呼叫、日誌不含個人內容

## 12. 分享與個人中心

- [x] 12.1 實作 `POST /api/share-cards`（不含不必要個資、結果不存在回 404）與前端分享入口
- [x] 12.2 前端個人中心：測驗結果、summary、報告、點數與付款狀態、各項到期時間、資料管理與刪除入口

## 13. 驗證與上線

- [x] 13.1 以測試比對實作路由與規格（`server/api.routes.test.ts`：每個已實作路由都必須在 `openspec/analysis/render/api.yaml` 中，且未實作者僅限尚未建置的能力）
- [ ] 13.5 （選用）由 Zod schema 產生 `/api/openapi.json`；需新增 `@asteasolutions/zod-to-openapi`，須先取得同意
- [ ] 13.2 （已完成：訪客測驗、登入、claim、點數、summary、購買與 webhook、分享、刪資料、刪帳號、再註冊，共 52 項，見 `pnpm e2e:smoke`；尚缺詳細分析生成與重新生成，待第 10 組完成）完成端到端流程驗證：訪客測驗 → 登入保存 → 取得 summary → 購買點數 → 生成詳細分析 → 重新生成 → 刪除帳號
- [x] 13.3 檢查前端產物不含任何秘密金鑰、日誌不含敏感內容、`firestore.rules` 擋 client
- [ ] 13.4 上線前確認事項：法務（無退款同意機制、MBTI 商標與題庫、贈點雜湊紀錄隱私揭露）、Vercel 方案條款、點數定價（量測單份 AI 報告成本）
