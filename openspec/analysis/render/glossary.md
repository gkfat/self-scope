# 名詞對照表（Entity ／ Firestore 集合 ／ API 路徑）

> 由 analysis-validator 依 domain-model、data-model、api-model 產生；命名不改，以此表對照。

| Entity | 中文 | Firestore 集合 | API 路徑 |
|---|---|---|---|
| User（ENT-001） | 使用者帳號 | users | DELETE /account<br/>DELETE /account/data<br/>GET /cron/data-expiry<br/>GET /profile<br/>POST /auth/login<br/>POST /guest-sessions/{sessionId}/claim<br/>… |
| GuestSession（ENT-002） | 訪客暫存 | guestSessions | POST /guest-sessions<br/>POST /guest-sessions/{sessionId}/claim<br/>POST /human-design/calculations<br/>POST /tests/{testId}/submissions<br/>PUT /guest-sessions/{sessionId}/profile |
| Test（ENT-003） | 測驗定義 | tests, testVersions | GET /tests<br/>GET /tests/{testId}<br/>POST /tests/{testId}/submissions |
| TestAttempt（ENT-004） | 測驗作答紀錄 | testAttempts | DELETE /account<br/>DELETE /account/data<br/>GET /cron/data-expiry<br/>GET /test-attempts<br/>POST /guest-sessions/{sessionId}/claim<br/>POST /tests/{testId}/submissions |
| FixedContent（ENT-005） | 固定內容 | fixedContents | GET /admin/fixed-contents<br/>GET /admin/fixed-contents/coverage<br/>GET /fixed-results/blood-types/{bloodType}<br/>GET /fixed-results/zodiac<br/>POST /admin/fixed-contents/{contentType}/{key}/publication<br/>POST /summaries<br/>… |
| MemberSummary（ENT-006） | 會員多維度分析報告 | summaries | DELETE /account<br/>DELETE /account/data<br/>GET /cron/data-expiry<br/>GET /summaries<br/>GET /summaries/{summaryId}<br/>POST /summaries |
| DetailedReport（ENT-007） | 詳細分析報告 | detailedReports | DELETE /account<br/>DELETE /account/data<br/>GET /cron/data-expiry<br/>GET /detailed-reports<br/>GET /detailed-reports/{reportId}<br/>POST /detailed-reports<br/>… |
| PointAccount（ENT-008） | 點數帳戶 | pointAccount | DELETE /account<br/>GET /points<br/>GET /points/transactions<br/>POST /auth/login<br/>POST /detailed-reports<br/>POST /detailed-reports/{reportId}/downloads<br/>… |
| PointBatch（ENT-009） | 點數批次 | pointBatches, pointPackages | DELETE /account<br/>GET /point-packages<br/>GET /points<br/>GET /points/transactions<br/>POST /auth/login<br/>POST /detailed-reports<br/>… |
| PointTransaction（ENT-010） | 點數異動 | pointTransactions | DELETE /account<br/>GET /points<br/>GET /points/transactions<br/>POST /auth/login<br/>POST /detailed-reports<br/>POST /detailed-reports/{reportId}/downloads<br/>… |
| Payment（ENT-011） | 付款紀錄 | payments | DELETE /account<br/>GET /payments<br/>POST /payments<br/>POST /payments/webhook |
| AiUsageRecord（ENT-012） | AI 用量紀錄 | aiUsageRecords | GET /admin/ai-usage<br/>POST /detailed-reports |
| HumanDesignChart（ENT-014） | 人類圖結果 | humanDesign | DELETE /account<br/>DELETE /account/data<br/>GET /cron/data-expiry<br/>GET /human-design<br/>POST /human-design/calculations |
| WelcomeGrantRecord（ENT-016） | 贈點紀錄 | welcomeGrants | POST /auth/login |
| DailyMetric（ENT-017） | 每日指標 | metricsDaily | GET /admin/metrics |
