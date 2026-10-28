import type { FragmentTable } from '../fragments';

/** Emotion and expression (C1 to C4): the six core objects. */
export const EMOTION_OBJECT_FRAGMENTS: FragmentTable = {
    'C1.A': {
        'object:self': '對自己的情緒變化很敏感，小事也可能在心裡停留一陣子。',
        'object:partner': '容易察覺對方的情緒起伏，也容易被對方的心情牽動。',
        'object:family': '家裡的氣氛有變化你很快就能感覺到，也容易放在心上。',
        'object:friend': '朋友心情不好時你通常最先察覺，也可能因此跟著低落。',
        'object:colleague': '對辦公室的氣氛與同事的情緒很敏感，也可能因此消耗心力。',
        'object:group': '進到群體裡容易感受到整體的氣氛，並受到它的影響。',
    },
    'C1.B': {
        'object:self': '面對壓力傾向保持冷靜，與情緒保持一點距離來處理事情。',
        'object:partner': '衝突時傾向先冷靜下來，對方有時會覺得你不夠投入情緒。',
        'object:family': '家裡有情緒激動的場面時，你常是比較能保持平靜的人。',
        'object:friend': '朋友情緒起伏時，你傾向穩穩地陪著，不被帶著走。',
        'object:colleague': '工作壓力大時傾向維持平穩，讓事情繼續推進。',
        'object:group': '群體氣氛緊張時，你可能是保持冷靜、穩住場面的人。',
    },
    'C2.A': {
        'object:self': '有想法或情緒時傾向說出來，表達是你整理自己的方式。',
        'object:partner': '傾向把心情與想法直接告訴對方，也喜歡與對方分享日常。',
        'object:family': '在家裡可能是帶動話題、讓氣氛熱絡的人。',
        'object:friend': '與朋友相處愛說愛笑，容易成為帶動氣氛的那一位。',
        'object:colleague': '工作中傾向主動發言與分享，容易讓討論熱絡起來。',
        'object:group': '在群體裡容易成為被注意到的人，也樂於帶動大家參與。',
    },
    'C2.B': {
        'object:self': '想法與感受傾向放在心裡，自己消化比說出來更自在。',
        'object:partner': '可能習慣用行動表達心意，較少把感受說出口，對方有時需要猜。',
        'object:family': '在家人面前話不多，關心常藏在行動而不是言語裡。',
        'object:friend': '與朋友相處安靜而穩，不太主動訴說自己的心事。',
        'object:colleague': '工作中傾向少說多做，用成果而不是言語表達想法。',
        'object:group': '在群體裡傾向安靜觀察，不太主動搶著發言。',
    },
    'C3.A': {
        'object:self': '對自己也傾向誠實面對，不太替自己找委婉的藉口。',
        'object:partner': '想說的話傾向直接說清楚，不喜歡讓對方猜，但有時聽起來比較直。',
        'object:family': '對家人說話直接，覺得把話講明白比悶在心裡好。',
        'object:friend': '與朋友相處有話直說，朋友多半知道你的立場在哪裡。',
        'object:colleague': '工作中傾向直接指出問題與想法，不太拐彎抹角。',
        'object:group': '在群體裡敢於說出別人不敢說的話，也可能讓氣氛變得緊張。',
    },
    'C3.B': {
        'object:self': '對自己的想法也會先斟酌用詞，不太想讓場面尷尬。',
        'object:partner': '說話前傾向先顧慮對方的感受，用溫和的方式表達不滿。',
        'object:family': '對家人傾向委婉說話，避免讓關係出現不必要的衝突。',
        'object:friend': '與朋友相處措辭圓融，不太讓人難堪，重要的話可能慢慢才說。',
        'object:colleague': '工作中傾向用委婉的方式提出意見，顧及對方的面子。',
        'object:group': '在群體裡傾向緩和氣氛，不喜歡直接點出尖銳的問題。',
    },
    'C4.A': {
        'object:self': '遇到挫折傾向往好處想，也能較快讓自己重新振作。',
        'object:partner': '與對方相處時傾向把重點放在好的一面，也願意帶來鼓勵。',
        'object:family': '家裡遇到難關時，你可能是提醒大家「會好起來」的人。',
        'object:friend': '朋友低潮時你傾向帶來信心與正面的看法。',
        'object:colleague': '工作中傾向相信事情能解決，用正面的態度帶動團隊。',
        'object:group': '在群體裡容易帶來輕鬆與希望的氣氛，也可能少提醒潛在的風險。',
    },
    'C4.B': {
        'object:self': '做事前傾向先想可能出的問題，並準備最壞的情況。',
        'object:partner': '對關係中可能的問題傾向早點留意，有時會擔心得比對方多。',
        'object:family': '家裡的事傾向先想到可能的風險，提醒大家做好準備。',
        'object:friend': '朋友要做冒險的事時，你可能先提醒他想想萬一的情況。',
        'object:colleague': '工作中傾向先找出可能的風險與漏洞，想好備案才安心。',
        'object:group': '在群體裡常是提出「如果出問題怎麼辦」的人。',
    },
};
