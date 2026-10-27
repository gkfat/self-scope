## Context

本命盤是固定計算：`NatalChartService.calculate` 把出生日期、時間與預設城市換成 UTC 時刻，呼叫 `computeNatalChart`，回傳上升與 `NATAL_BODIES` 內每顆天體的星座與度數，不呼叫 AI、不儲存。`NATAL_BODIES` 目前是日、月、水、金、火、木、土。

`bodyLongitude` 對日、月各有專用公式，其餘行星經 `planetLongitude(Astronomy.Body, time)` 計算；這個函式已被人類圖（`server/humanDesign/ephemeris.ts`）用來算天王、海王、冥王，結果有參考測試。前端 `app/pages/analysis/zodiac/[sign].vue` 以 `NATAL_GROUPS` 分組顯示卡片，每張卡的解讀來自 `NATAL_PLACEMENT_MEANINGS[key][sign]`，目前是 8 個位置 × 12 星座。

## Goals / Non-Goals

**Goals:**
- 本命盤多回傳天王、海王、冥王三顆，既有七顆與上升的結果完全不變。
- 進階星座分析頁顯示這三顆，並附事先寫好的固定解讀（36 筆）。
- 讓 `add-transit-report` 之後能用同一份天體清單算本命盤與行運盤。

**Non-Goals:**
- 行運盤與相位計算（`add-transit-report`）。
- 月交點、凱龍星、小行星、宮位、相位圖。
- 儲存本命盤；維持固定計算。

## Decisions

### 1. 擴充 `NATAL_BODIES`，不另開外行星清單

在 `NATAL_BODIES` 末尾加入 `URANUS`、`NEPTUNE`、`PLUTO`，`bodyLongitude` 的 `BODY_OF` 對照多三筆。`computeNatalChart` 以 `NATAL_BODIES.map` 產生 `bodies`，所以計算端不需其他改動。

- 為什麼：回應形狀、解讀表、標籤表、行運盤之後都以同一份清單為準，單一來源最不容易漂移。
- 替代方案：另開 `OUTER_BODIES`。可以不動既有型別，但 `Record<NatalBody, …>` 會分成兩處，行運盤也要合併兩份清單，得不償失。
- 順序：既有七顆的順序不變，三顆接在後面，不影響任何依賴順序的程式碼。

### 2. 回應 schema 三個欄位皆必填

`natalChartResponseSchema.bodies` 加入 `URANUS`、`NEPTUNE`、`PLUTO`，與其他天體一樣必填。

- 為什麼：本命盤不儲存、每次重算，沒有舊資料需要相容；前後端同一個版本部署，必填最單純，也讓缺值在 `parse` 時直接失敗而不是靜默漏掉。
- 風險見下方「前後端部署不同步」。

### 3. 外行星的解讀以「世代背景」寫，獨立成一組卡片

- `NATAL_LABELS` 加入三顆的名稱與一句角色說明；`NATAL_GROUPS` 新增第四組「世代與長期主題」，`keys: ['URANUS', 'NEPTUNE', 'PLUTO']`。
- `NATAL_PLACEMENT_MEANINGS` 加入三個位置 × 12 星座，共 36 筆，沿用既有的長度（20 至 100 字）與禁語規則（不寫診斷或保證）。
- 為什麼獨立一組：三顆外行星在同一星座停留 7 年（天王）、約 14 年（海王）、12 至 30 年（冥王），同世代的人落點相同。放進「個人特質」的卡片會讓使用者誤以為是自己獨有的特質。分組標題與說明直接交代這是世代共同的背景。
- 替代方案：併入「機會與責任」。分組少改一處，但語意混在一起。

### 4. 測試

- 計算：用已有參考的名人命盤（既有的愛因斯坦測試）補上天王、海王、冥王的期望值；以另一組跨星座邊界的日期確認度數取整與換座；確認既有七顆與上升的結果與改動前一致（回歸）。
- 服務：回應通過 `natalChartResponseSchema`，含十顆天體。
- 內容：解讀表涵蓋 11 個位置 × 12 星座，長度與禁語測試沿用。

## Risks / Trade-offs

- [前後端部署不同步，舊前端收到新欄位或新前端收到舊回應] → 同一個 Vercel 部署，Nuxt SPA 與 Nitro 一起發佈；zod `parse` 缺欄位會明確報錯，不會靜默顯示空卡片。
- [天王、海王、冥王的黃經與參考星曆有落差] → 以人類圖已驗證的 `planetLongitude` 計算；新增與參考盤比對的測試，度數取整後一致才算通過（NFR-022 的容許誤差仍待定，先以整數度數為準）。
- [36 筆文案撰寫與審稿的工作量] → 字數短（20 至 100 字）、以世代背景為主，同一顆行星在 12 星座間用語結構一致，便於審稿。
- [外行星解讀被讀成個人特質或預言] → 分組標題說明是世代共同背景；沿用禁語測試；內容附免責說明。

## Migration Plan

1. 合併程式（`NATAL_BODIES`、schema、標籤、解讀表、頁面）。
2. 解讀文案隨程式合併（是程式內的常數，不經固定內容匯入，沿用現有 `NATAL_PLACEMENT_MEANINGS` 的做法）。
3. 在瀏覽器確認進階星座分析頁顯示十顆天體與四組卡片。
4. 回滾：還原程式即可；本命盤不儲存，沒有資料需要處理。

## Open Questions

- 外行星度數的容許誤差（NFR-022）要用多少？目前只以整數度數與參考盤一致為準。
