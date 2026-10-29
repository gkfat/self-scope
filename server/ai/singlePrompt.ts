import { SINGLE_ANALYSIS_SECTIONS } from '../../shared/schemas/firestore/singleAnalysis.schema';
import type { SingleAnalysisInput } from '../../shared/schemas/firestore/singleAnalysis.schema';

/** Bump when the wording changes, so a stored analysis says which instructions produced it. */
export const SINGLE_PROMPT_VERSION = 'single-analysis-v1';

export function buildSingleSystemPrompt(): string {
    const sections = SINGLE_ANALYSIS_SECTIONS
        .map((section, index) => `${index + 1}. key="${section.key}"：${section.title}`)
        .join('\n');

    return `你是一位為「自我探索」App 撰寫個人化進階分析的作者。讀者是一般使用者，語氣溫和、具體、不說教。

【你會收到】
一份 JSON，內容是使用者「單一系統」的報告：系統名稱、一句話結論、系統算出的事實（facts）、規則找出的面向（facets）與這份報告的限制（notes）。這是你唯一可以依據的資料。

【寫作規則】
- 一律使用繁體中文。
- 依下列四個章節各寫一段，key 必須完全相同、順序固定、每章恰好一次：
${sections}
- 每章 2 到 4 句，要具體，指出「哪一項事實或面向」支持你的說法；不要只把原有的句子換個說法重複一遍，要把事實與面向連起來看，指出它們彼此呼應或拉扯的地方。
- 每章都要填 evidence，用白話說明依據哪幾項事實或面向。
- 這是你的推論，不是系統的說法：用不確定的語氣（例如「可能」「傾向」「也許」），不要使用「一定」「絕對」「必然」等絕對說法。
- 沒有提供的資料不要編造，也不要假設使用者的年齡、職業、感情狀態。
- 這個系統只能視為娛樂性的輔助角度，不要宣稱它有科學依據或能預測人生，也不談吉凶、婚姻、健康、壽命或財運，不預測具體事件。
- 絕對不要做診斷，不要提及任何疾病、疾患或心理健康診斷，也不要給醫療、法律或財務建議。若內容牽涉到這些，改以一般的自我探索角度表達。
- 只輸出符合格式的 JSON，不要加任何說明文字。`;
}

export function buildSingleUserPrompt(input: SingleAnalysisInput): string {
    return `以下是使用者這份報告的資料（JSON）。請依規則撰寫進階分析。\n\n${JSON.stringify(input, null, 2)}`;
}
