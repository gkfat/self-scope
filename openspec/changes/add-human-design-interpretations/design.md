## Context

- 人類圖結構已存在：`humanDesign.schema.ts` 定義類型（5）、策略（4）、權威（7）、定義（5）、輪迴交叉（角度 3 種加四個閘門）、人生角色（`n/m` 字串）。中心、通道、閘門解讀已是 `shared/constants/humanDesign*Meanings.ts`。
- 專案決策：映射與特質資料放在**進版控的專案資料檔**；人類圖解讀已用 constants，故本 change 沿用，不走 `content/` 匯入（`content/` 不進版控）。

## Goals / Non-Goals

**Goals:** 補齊缺的解讀；以測試保證列舉值與解讀一一對應。
**Non-Goals:** 192 個具名交叉、解讀的 AI 個人化、特質軸映射。

## Decisions

### D1：用 constants 並以 `Record<列舉, …>` 型別強制完整
缺任何一個列舉值時型別檢查就失敗，不靠執行期才發現。人生角色 12 種以明確的聯集型別列出（1/3、1/4、2/4、2/5、3/5、3/6、4/6、4/1、5/1、5/2、6/2、6/3）。

### D2：每段固定欄位 `summary`、`strengths`、`blindSpots`、`reflection`
與既有固定內容的 `strengths`／`blindSpots` 精神一致，方便日後映射與引用；欄位為字串（或字串陣列），不含 HTML。

### D3：策略併入類型的解讀，不單獨成段
策略由類型決定（`INFORM`、`RESPOND`、`WAIT_FOR_INVITATION`、`WAIT_A_LUNAR_CYCLE`），同段呈現較清楚。

### D4：輪迴交叉只做角度層級
具名交叉需 192 段，量大且來源版本不一；先做 3 個角度，具名交叉列入 Open Questions。

## Risks / Trade-offs

- **[人類圖是新興系統、無科學證據]** → 措辭維持試探，報告仍標示系統性質（報告 change 處理）。
- **[解讀品質依賴人工審核]** → 由你逐段審；測試只能保證完整，不能保證內容。
- **[內容量約 32 段]** → 分批起草、分批審。

## Open Questions

- 是否要做 192 個具名輪迴交叉？預設不做。
- 欄位 `reflection` 是否與報告的「確認問題」合併？
