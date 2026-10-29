# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

self-scope：AI 個人特質分析 App（星座／血型／MBTI／生命靈數／Human Design 固定內容 + 16 型人格測驗 + OpenAI 詳細報告 + 點數與付款）。
Nuxt 4 SPA（`ssr: false`）+ Nitro server（Vercel preset）+ Firestore（僅經 firebase-admin 存取）+ Vuetify。使用 pnpm，Node 24（scripts 直接以 Node 內建 TypeScript 執行）。

## 常用指令

```bash
pnpm dev                      # 開發
pnpm build                    # 建置（Vercel preset）
pnpm lint                     # eslint --fix
pnpm test                     # vitest run（server/ shared/ app/ scripts/ 下的 *.test.ts）
pnpm vitest run server/services/point.service.test.ts   # 單一測試檔
pnpm vitest run -t "測試名稱"                           # 依名稱
pnpm check:bundle             # 確認 client bundle 沒有洩漏 server secret
pnpm content:import <file> [--dry-run]   # 匯入固定內容；另有 content:check / content:import-test / content:import-packages
pnpm firebase:provision       # 建立 Firestore 索引等
pnpm e2e:smoke
```

- ESLint 風格：4 空白縮排、單引號、分號、`comma-dangle: always-multiline`、`object-curly-newline`（2 個以上屬性就換行）、`array-element-newline`（3 個以上元素就換行）。
- 環境變數見 `.env.example`；本機服務帳戶放根目錄 `service_account.json`（production 不會讀，改用 `FIREBASE_SERVICE_ACCOUNT_KEY`）。部署／TTL／匯入步驟見 `docs/firebase-setup.md`。
- `content/`（固定內容、測驗題目 JSON）進版控，新增或修改後需重新匯入才生效。

## 架構

目錄分層：`app/`（前端）、`server/`（Nitro API）、`shared/`（前後端共用，被兩邊 import）、`config/`、`scripts/`（一次性匯入／維運腳本，共用 `scripts/lib`）。

### Server 分層（`server/`）
`api/*.ts`（route handler）→ `services/*.service.ts`（業務邏輯，繼承 `BaseService` 提供結構化 log）→ `repositories/*.repository.ts`（繼承 `BaseRepository`，唯一碰 Firestore 的地方）。

- Handler 慣例：`requireAuth(event)` → zod `safeParse` body/query（失敗拋 `ValidationError`）→ 呼叫 service → 用 response schema `parse` 回傳；整段 try/catch 後 `throw toH3Error(error)`。錯誤型別定義在 `shared/types/errors.ts`。
- 存取控制集中在 `server/utils/routeAccess.ts` 的 `RULES`（`public` / `optional` / `self` / `required`，**預設 required**），由 `server/middleware/auth.global.ts` 套用。新增 API 路徑必須檢查是否需要加規則（例如 guest 可用的路由為 `optional`，webhook／cron 為 `self`，由 handler 自行驗證簽章／`CRON_SECRET`）。
- `firestore.rules` 全擋 client，所有資料都經 server。時間欄位多為 epoch 毫秒數字；唯一例外是 `guestSessions`／`welcomeGrants`／`rateLimits` 的 `expiresAt` 用 Firestore Timestamp（啟用 TTL），其餘由每日 cron `/api/cron/data-expiry`（`vercel.json`）清除，**不要**對它們開 TTL。
- 專用模組：`server/ai/`（OpenAI provider、prompt、品質檢查；詳細報告在回應後以 `waitUntil` 背景執行，`maxDuration` 180s）、`server/humanDesign/` 與 `server/astrology/`（以 `astronomy-engine` 計算命盤）、`server/payment/`（provider 抽象；`dev` provider 僅限非 production）。
- 設定：`nuxt.config.ts` 的 `runtimeConfig` → `config/config.ts` 的 `getServerConfig()` / `requireServerSecret()`（缺 secret 必須明確拋錯，不可有預設值）／`getPublicConfig()`。

### Shared（`shared/`）
- `schemas/api/*`（request/response 的 zod schema）與 `schemas/firestore/*`（文件 schema）是前後端契約，API 輸入輸出都要過 schema。
- `utils/fixedContentKeys.ts` 定義固定內容的金鑰規則（單項與 2～4 維度組合）；`constants/`、`utils/` 含 Human Design 資料、命理計算、點數與多維度定價等純函式。

### Frontend（`app/`）
SPA；`composables/`（`useApi`、`useAuth`、`useGuestSession`、`usePoints` 等）封裝呼叫 API 與 Firebase client auth（`plugins/firebase.client.ts`），`middleware/member.ts` 保護會員頁。訪客以 guest session（`X-Guest-Session-Id`）使用，登入後可 claim。

### 測試
Vitest（node 環境），測試檔與原始碼同目錄。Firestore 以 `server/test-utils/fakeFirestore.ts`（記憶體 fake，支援 transaction 樂觀並行與 collection group query）取代，不需 emulator。

## OpenSpec 工作流

規格驅動開發：`openspec/changes/<change>/`（proposal / design / specs / tasks）為各功能的規劃，`openspec/analysis/*.yaml` 為系統分析產出（context、requirements、use cases、domain/api/data model、traceability）。使用 `opsx:*` skills 管理 change；實作前先讀對應 change 的 design 與 tasks。
