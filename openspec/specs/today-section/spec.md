# today-section Specification

## Purpose
TBD - 首頁與側邊選單以單一「今日運勢」入口呈現各項每日內容（塔羅、瑪雅 Kin、盧恩符文、星座運勢）；原規劃的總覽頁 `/today`、`GET /api/today` 彙整端點與集中清單未實作，由 `/fortune` 頁取代（見封存的 add-today-section）。

## Requirements

### Requirement: 首頁與選單以單一入口呈現每日內容
系統 SHALL 在首頁以單一「今日運勢」區塊、在側邊選單以單一「今日運勢」項目呈現各項每日內容（塔羅、瑪雅 Kin、盧恩符文、星座運勢），MUST NOT 為各項另設獨立的首頁區塊或選單項目。訪客 MUST 只看到說明與「立即登入」，MUST NOT 載入任何抽取或結果內容。尚未啟用的項目 MUST NOT 顯示。

#### Scenario: 單一首頁區塊與單一選單項目
- **WHEN** 已登入使用者開啟首頁與側邊選單
- **THEN** 首頁只有一個「今日運勢」區塊，側邊選單只有一個「今日運勢」項目，已啟用的項目各一行

#### Scenario: 訪客
- **WHEN** 未登入的訪客開啟首頁
- **THEN** 區塊只顯示說明與「立即登入」，不載入任何結果內容
