## Why

市面上的星座、血型、MBTI 測驗多半只給通用的娛樂文案，缺少依使用者實際資料交叉分析的內容，也不保存使用者的探索歷程。本專案要做一個多維度人格探索 Web App：免費提供固定結果引流，以點數制銷售 AI 詳細分析，驗證「個人化分析願意付費」這個假設。分析階段（`openspec/analysis/`）已收斂，現在進入第一版（MVP）的 proposal。

## What Changes

- 新增 Nuxt 4（SPA）+ Vuetify 的 Web App，部署於 Vercel；伺服端為 Nitro server routes，Firestore 僅由伺服器端以 firebase-admin 存取（client 只用 Firebase Auth 取得 ID token）。
- 新增 Google 登入與訪客模式：訪客可測驗與看固定結果，結果以 session id 暫存於 Firestore（TTL 1 天）；登入後才保存；訪客不可取得 summary。
- 新增個人資料輸入：生日與星座必填，血型、MBTI、出生時間與出生地點（預設城市清單）選填。
- 新增單項免費結果（星座、血型分析、MBTI）與 16 型人格測驗（自行撰寫題目，對外不使用 MBTI 商標）。
- 新增簡易 summary：星座×MBTI（192）與星座×MBTI×血型（768）共 960 種預先寫好的固定內容，存於 Firestore，取得時扣 1 點。
- 新增人類圖固定計算（出生時間與地點齊備才可算），已登入者儲存結果，單獨檢視免費。
- 新增點數系統：註冊贈 3 點（贈點 90 天效期）、購買點數（無限期）、先到期先扣、異動紀錄、扣點冪等與原子性。
- 新增付款：購買點數、webhook 驗簽與冪等入帳、「同意立即提供數位內容、放棄解約」勾選與留存、無退款。
- 新增 AI 詳細分析：扣 5 點後非同步生成（逾時 120 秒視為失敗並返還點數）、八章節含依據與不確定性標示、保存 6 個月、舊報告保留的重新生成（再扣 5 點）、AI 用量記錄與限制。
- 新增資料保留與刪除：測驗結果、summary、MBTI、人類圖 3 個月；詳細分析 6 個月；付款紀錄帳號存續期間永久；刪帳號移除全部紀錄，僅保留贈點紀錄（HMAC 雜湊，3 個月，僅用於避免重複贈點）。
- 新增結果分享卡與固定內容的匯入腳本與版本管理。

**不在本次範圍（MVP 後）**：智力／認知測驗、專題測驗、訂閱、歷史比較、AI 對話（FR-027 至 FR-031）；到期通知（FR-035）；詳細分析報告書 PDF 寄送 email（FR-034）；作答時間蒐集（FR-024）；產品指標每日計數（FR-026）；後台 API（API-031 至 API-036）。

## Capabilities

### New Capabilities
- `account-auth`: Google 登入、帳號建立、刪除資料與刪除帳號、贈點紀錄防重複贈點
- `guest-session`: 訪客暫存 session（TTL 1 天）與登入後將當次結果存入帳號
- `profile-input`: 生日、星座、血型、MBTI、出生時間與預設城市清單的輸入與驗證
- `personality-test`: 16 型人格測驗的題目、版本、後端計分與結果保存
- `fixed-results`: 星座、血型、MBTI 單項免費結果與簡易 summary 的查詢，固定內容存於 Firestore
- `human-design`: 人類圖固定計算、儲存與單獨檢視
- `points-system`: 點數帳戶、贈點、扣抵順序、效期、異動紀錄、原子與冪等
- `payments`: 點數購買、同意勾選、付款 webhook 驗簽與冪等入帳、付款紀錄
- `detailed-analysis`: AI 詳細分析的生成、非同步狀態、保存、查看、重新生成與用量限制
- `data-retention`: 到期資料排程清除與各類資料的保存期限
- `result-sharing`: 結果分享卡
- `fixed-content-management`: 固定內容的匯入腳本、版本與組合覆蓋檢查

### Modified Capabilities
<!-- 專案目前沒有既有 specs（openspec/specs/ 為空），無修改項 -->

## Impact

- **新程式碼**：整個應用程式（`app/`、`server/`、`shared/`、`config/`），以 `gkbot-adventure-run` 的 Nuxt、firebase-admin、Zod、api／services／repositories 分層為參考。
- **基礎設施**：新建 Firebase 專案（Firestore、Authentication 的 Google provider）、Vercel Pro 專案與環境變數、Vercel Cron（到期清除）。Firestore 規則全擋 client，另需 TTL 政策（訪客暫存、贈點紀錄）與複合索引。
- **外部服務**：付款服務與 AI 模型供應商尚未選定；MVP 內不需要 email 服務。
- **依賴**：沿用參考專案的套件組合；任何新增套件（含 PDF、計算庫）須先取得同意。
- **法規與風險**：個資（出生資料、Google 帳號雜湊）、數位內容無退款的同意機制、MBTI 商標，均須在上線前由法務確認；人類圖計算庫（月交點支援與授權）需先做技術驗證。
- **追溯來源**：`openspec/analysis/`（context、requirements、use-cases、domain-model、api-model、data-model、traceability）。
