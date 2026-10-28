## Why

單維度星盤報告要顯示宮位、宮主星與主要相位（報告重設決策 24）：分析人格時，這些關係比單列十顆天體的落座更有用。目前本命盤只回傳上升與十顆天體的星座與度數；且出生時間與城市在個人資料中是可選欄位，沒填的使用者只能看太陽星座。

## What Changes

- 本命盤計算新增：**宮位**（含各天體落入第幾宮）、**宮主星**（各宮宮首星座的守護星）、**主要相位**（合、六分、四分、三分、對分）與**容許度**；保留精確黃經以供計算。
- 相位與宮位以**精確黃經**計算，不由取整後的度數推回。
- 缺出生時間或城市時：現有 API 本來就要求出生日期、時間與城市三者齊全（缺一回 400，維持不變），所以**不會**以預設值猜測宮位；星座分析頁原本就有補填入口，本 change 把文字更新為涵蓋宮位、宮主星與相位，個人資料頁也補上說明（決策 4：要使用者補填）。
- 既有天體與上升的結果、星座運勢（整宮制，從太陽星座起算）**完全不變**。
- 重用既有的 `placementFromLongitude`、`computeNatalLongitudes`、`ascendantLongitude`。

不在範圍：宮位解讀文字（由後續報告 change 與映射處理）、行運相位、Placidus 等象限制宮位（見 Open Questions）。

## Capabilities

### New Capabilities
- `natal-houses-aspects`: 本命盤的宮位、宮主星、主要相位與容許度；缺出生時間或城市時的行為與補填提示。

### Modified Capabilities
<!-- 既有 natal-chart 的需求不變：回應只新增欄位 -->

## Impact

- `server/astrology/`：新增宮位、宮主星、相位的純函式；`natalChart.service.ts` 與 `shared/schemas/api/natalChart.schema.ts` 回應新增欄位。
- `shared/constants/`：新增守護星對照與相位定義（角度、預設容許度）。
- 前端：星座分析頁的補填入口文字與宮位、宮主星、相位的顯示；個人資料頁的說明。
- 依賴：無新套件。相依 change：`add-report-data-layer`（規則版本 `NATAL_CHART`）。
