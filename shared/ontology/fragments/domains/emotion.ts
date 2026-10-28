import type { FragmentTable } from '../fragments';

/** Emotion and expression (C1 to C4): the six core domains (how people get along, growth, work, leisure, interests, conduct). */
export const EMOTION_DOMAIN_FRAGMENTS: FragmentTable = {
    'C1.A': {
        'domain:interaction': '與人互動時很在意氣氛與對方的感受，也容易被語氣影響心情。',
        'domain:growth': '成長時傾向留意自己的情緒變化，從感受中理解自己。',
        'domain:work': '工作中對同事的情緒與氛圍很敏感，也可能因此消耗心力。',
        'domain:leisure': '選擇娛樂時重視情感共鳴，容易被音樂、電影或故事打動。',
        'domain:interest': '在興趣上容易投入感情，作品常帶著自己的心情。',
        'domain:conduct': '處事傾向體貼他人感受，也容易把別人的情緒放在心上。',
    },
    'C1.B': {
        'domain:interaction': '與人互動時傾向保持平穩，不太被對方的情緒帶著走。',
        'domain:growth': '面對挫折傾向冷靜分析，與情緒保持一點距離。',
        'domain:work': '工作壓力大時傾向維持穩定的節奏，不輕易被情緒影響判斷。',
        'domain:leisure': '休閒傾向理性選擇，不太被氣氛左右花費或決定。',
        'domain:interest': '在興趣上投入但不過度情緒化，遇到瓶頸也能沉著面對。',
        'domain:conduct': '處事傾向冷靜客觀，情緒不會輕易影響決定。',
    },
    'C2.A': {
        'domain:interaction': '與人交流時愛說話、愛分享，容易讓氣氛熱絡起來。',
        'domain:growth': '成長時傾向把想法說出來、寫出來，透過表達整理自己。',
        'domain:work': '工作中樂於發言與簡報，也容易帶動大家參與討論。',
        'domain:leisure': '休閒喜歡熱鬧的場合，愛分享與表現自己。',
        'domain:interest': '在興趣上喜歡展示作品、分享心得，也樂於教別人。',
        'domain:conduct': '處事傾向把想法說清楚，不太把話悶在心裡。',
    },
    'C2.B': {
        'domain:interaction': '與人互動時話不多，傾向聆聽與觀察，心意可能藏在行動裡。',
        'domain:growth': '成長傾向自己默默消化與調整，不太對外表達進展。',
        'domain:work': '工作中傾向少說多做，用成果代替言語表達。',
        'domain:leisure': '休閒傾向安靜地享受，不太需要分享給別人。',
        'domain:interest': '在興趣上傾向低調投入，不太主動展示成果。',
        'domain:conduct': '處事含蓄內斂，想法常放在心裡，不輕易流露。',
    },
    'C3.A': {
        'domain:interaction': '與人溝通傾向有話直說，不太拐彎抹角。',
        'domain:growth': '成長時傾向誠實面對自己的缺點，直接說出需要改進的地方。',
        'domain:work': '工作中傾向直接指出問題，也希望別人給出坦白的回饋。',
        'domain:leisure': '休閒時說話坦率，不太掩飾自己的喜好與不喜歡。',
        'domain:interest': '在興趣上直接表達喜惡，也不太迎合主流評價。',
        'domain:conduct': '處事傾向坦率誠實，覺得把話說開比較輕鬆。',
    },
    'C3.B': {
        'domain:interaction': '與人溝通傾向先顧及對方的感受，用溫和的方式表達意見。',
        'domain:growth': '成長時傾向用溫和的方式提醒自己，對自己也不太苛刻。',
        'domain:work': '工作中傾向用委婉的方式提出意見，避免讓對方難堪。',
        'domain:leisure': '休閒時傾向配合大家，不太表達強烈的反對。',
        'domain:interest': '在興趣上對別人的作品傾向給予鼓勵，批評也說得溫和。',
        'domain:conduct': '處事傾向留餘地，凡事不把話說絕。',
    },
    'C4.A': {
        'domain:interaction': '與人交談傾向帶來正面的想法，也容易感染周圍的人。',
        'domain:growth': '面對失敗傾向把它看成學習機會，也能較快重新出發。',
        'domain:work': '工作中傾向相信問題能解決，用正面的態度面對挑戰。',
        'domain:leisure': '休閒時容易感到快樂與知足，也樂於享受小事。',
        'domain:interest': '在興趣上傾向相信自己會越來越進步，也能享受過程中的樂趣。',
        'domain:conduct': '處事傾向往好的方向想，相信事情會有轉機。',
    },
    'C4.B': {
        'domain:interaction': '與人往來傾向先看可能的問題，也會提醒對方留意風險。',
        'domain:growth': '成長時傾向先想到可能的失敗，並準備好備案。',
        'domain:work': '工作中傾向預先找出風險與漏洞，想好最壞的情況。',
        'domain:leisure': '休閒時也會想到可能的意外，出遊前傾向先確認各種狀況。',
        'domain:interest': '在興趣上投入之前傾向先評估風險與成本。',
        'domain:conduct': '處事傾向未雨綢繆，寧可準備多一點也不想措手不及。',
    },
};
