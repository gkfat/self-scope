import type {
    HumanDesignResult, IncarnationCross,
} from '../schemas/firestore/humanDesign.schema';

/**
 * Fixed readings of the chart-level parts of a Human Design chart: type (with its strategy), inner authority, profile,
 * definition and the angle of the incarnation cross. Like the center, channel and gate readings they are the same for
 * everyone and written tentatively: they describe a tendency, never rank one type above another, and give no medical,
 * legal or financial advice.
 */
export type HumanDesignInterpretation = {
    summary: string;
    strengths: string;
    blindSpots: string;
    /** A question to think over, not an instruction */
    reflection: string;
};

export type HumanDesignTypeInterpretation = HumanDesignInterpretation & {
    /** What the type's strategy asks for, in plain words */
    strategy: string;
};

export const HUMAN_DESIGN_TYPE_INTERPRETATIONS: Readonly<Record<HumanDesignResult['type'], HumanDesignTypeInterpretation>> = {
    MANIFESTOR: {
        summary: '傳統說法裡，顯示者是少數能自己啟動事情的人，不需要等別人點頭就能開始。',
        strategy: '行動前先告知：在做會影響到身邊的人的事之前，先讓他們知道，可以減少阻力與誤會。',
        strengths: '主動開創、推動事情起步，不容易被外界的步調牽著走。',
        blindSpots: '一個人決定後直接行動，容易讓身邊的人措手不及；沒被告知的人可能覺得被忽略或被排除在外。',
        reflection: '最近一次你自己決定要做的事，身邊受影響的人事先知道嗎？',
    },
    GENERATOR: {
        summary: '傳統說法裡，生產者有持續的生命力，適合把能量投入真正有感覺的事，滿足感多半來自把事情做好。',
        strategy: '等待回應：先觀察眼前出現的人事物，感覺有回應再行動，而不是硬想出一件事去做。',
        strengths: '一旦投入就能長時間穩定產出，專注在喜歡的事情上時效率與成就感都很高。',
        blindSpots: '沒有回應也勉強答應，容易把能量花在不適合的事上，累積挫折與疲乏。',
        reflection: '你現在忙的事情裡，哪些是你有感覺才做的，哪些只是不好意思拒絕？',
    },
    MANIFESTING_GENERATOR: {
        summary: '傳統說法裡，顯示生產者兼有生產者的持續能量與快速行動的特質，常同時進行好幾件事，並且動作很快。',
        strategy: '等待回應、行動前先告知：先有回應再行動，行動前讓受影響的人知道。',
        strengths: '效率高、善於找到捷徑，能在多個興趣之間切換並快速上手。',
        blindSpots: '步調太快時容易跳過步驟或半途轉向，也可能忘了告知別人，讓身邊的人跟不上。',
        reflection: '你放下過哪些做到一半的事？那是真的不適合，還是只是速度太快？',
    },
    PROJECTOR: {
        summary: '傳統說法裡，投射者擅長看見別人與系統怎麼運作，天生適合引導、指點與協調，而不是靠自己的能量長時間硬撐。',
        strategy: '等待邀請：在重要的事情上，等別人看見並邀請你，你的建議才比較容易被接納。',
        strengths: '觀察細緻，能看出別人沒注意到的地方，擅長把人與資源安排得更順。',
        blindSpots: '在沒被邀請時主動給建議，可能不被接受；長時間工作後也容易累，需要比別人更多的休息。',
        reflection: '你最近被肯定的時候，是你主動說出來的，還是別人邀請你表達的？',
    },
    REFLECTOR: {
        summary: '傳統說法裡，反映者的九個中心都開放，像一面鏡子，容易反映出身邊的人與環境的狀態，也因此對所處環境特別敏感。',
        strategy: '等待一個月亮週期：重大決定先放一個週期（約 28 天），觀察自己在不同日子的感受再決定。',
        strengths: '能感受到團體與環境的整體氣氛，常能看出一個地方或一群人是否健康。',
        blindSpots: '容易把別人的狀態當成自己的，環境不合時消耗很快；急著決定時容易受當下的情緒影響。',
        reflection: '你的心情有多少是自己的，有多少是在不同的人身邊才出現的？',
    },
};

export const HUMAN_DESIGN_AUTHORITY_INTERPRETATIONS: Readonly<Record<HumanDesignResult['authority'], HumanDesignInterpretation>> = {
    EMOTIONAL: {
        summary: '傳統說法裡，情緒權威的人，決定的依據是情緒的起伏：同一件事在不同時間會有不同的感覺，所以需要時間讓情緒穩定下來。',
        strengths: '給自己時間後做出的決定通常更踏實，也更能體會別人的感受。',
        blindSpots: '在情緒高點或低點時做決定，事後容易反悔；也可能因為想要立刻有答案而給自己壓力。',
        reflection: '最近一次大決定，你給自己過夜或更久的時間了嗎？',
    },
    SACRAL: {
        summary: '傳統說法裡，薦骨權威的人，是靠身體當下的「有感覺／沒感覺」來決定，像是一種不用想就知道的回應。',
        strengths: '回應直接而誠實，對自己有沒有能量投入通常很清楚。',
        blindSpots: '沒有被問到具體的是非題時，回應容易被思緒蓋過；腦袋想要的和身體的回應有時並不一致。',
        reflection: '你在回答是非題的當下，身體有什麼反應？那和你後來想到的答案一樣嗎？',
    },
    SPLENIC: {
        summary: '傳統說法裡，直覺權威的人，靠的是當下一閃而過的直覺：它很輕、只出現一次，不會反覆提醒。',
        strengths: '對危險、機會與人的狀態反應快，能在別人還在分析時就感覺到什麼。',
        blindSpots: '直覺很安靜，容易被擔心與思慮壓過；若事後才想起「我早就覺得不對」，往往是當時沒有聽。',
        reflection: '你有沒有過第一時間的感覺很清楚、但後來被自己說服的經驗？',
    },
    EGO: {
        summary: '傳統說法裡，意志力（心）權威的人，靠的是「我真正想要什麼、做不做得到」，決定與承諾的力量來自內心的意志。',
        strengths: '清楚自己想要的，一旦答應就會盡力做到，說話有分量。',
        blindSpots: '為了證明自己而答應不想做的事，容易過度消耗；也可能忽略休息，把意志當成唯一的動力。',
        reflection: '你最近答應的事，有幾件是你真心想要的，有幾件只是想證明什麼？',
    },
    SELF_PROJECTED: {
        summary: '傳統說法裡，自我投射權威的人，透過把想法說出口來聽見自己的真實想法：說著說著，答案就變得清楚。',
        strengths: '能透過表達整理自己的方向，也容易清楚說出自己認同的價值。',
        blindSpots: '只在腦中想而不說，容易一直繞圈；說出口的對象若不適合，也可能被帶偏。',
        reflection: '你有沒有一個可以放心把想法說出口、而不被打斷或評斷的人？',
    },
    MENTAL: {
        summary: '傳統說法裡，外在權威（沒有內在的情緒、薦骨、直覺或意志權威）的人，靠與信任的人討論，並在合適的環境裡，聽見自己的想法逐漸清楚。',
        strengths: '擅長把事情拿出來討論、從不同角度釐清，也很能感受環境是否適合自己。',
        blindSpots: '把別人的意見當成答案，或在不適合的環境下做決定，容易偏離自己的方向。',
        reflection: '你做決定前會找誰談？那個人的回應是在幫你聽見自己，還是在替你決定？',
    },
    LUNAR: {
        summary: '傳統說法裡，月亮週期權威是反映者獨有的：沒有固定的內在權威，需要等一個月亮週期，觀察自己在不同日子的感受，決定才會清楚。',
        strengths: '看事情會經過一整個週期的沉澱，比較不容易被一時的氣氛左右。',
        blindSpots: '想要立刻有答案時容易焦慮，也容易被周圍人的急迫感帶著走。',
        reflection: '你現在有沒有一件事，值得先放一個月再決定？',
    },
};

/** The twelve profiles a chart can have: the line of the conscious Sun over the line of the unconscious Sun. */
export const HUMAN_DESIGN_PROFILES = [
    '1/3',
    '1/4',
    '2/4',
    '2/5',
    '3/5',
    '3/6',
    '4/6',
    '4/1',
    '5/1',
    '5/2',
    '6/2',
    '6/3',
] as const;

export type HumanDesignProfile = typeof HUMAN_DESIGN_PROFILES[number];

/** The traditional Chinese names of the six lines (Investigator, Hermit, Martyr, Opportunist, Heretic, Role Model); a profile is the pair of two of them. */
export const HUMAN_DESIGN_LINE_NAMES: Readonly<Record<number, string>> = {
    1: '探究者',
    2: '隱士',
    3: '烈士',
    4: '機會主義者',
    5: '異端者',
    6: '人生典範',
};

export type HumanDesignProfileInterpretation = HumanDesignInterpretation & {
    /** The pair of line names, e.g. 探究者／烈士 */
    name: string;
};

export const HUMAN_DESIGN_PROFILE_INTERPRETATIONS: Readonly<Record<HumanDesignProfile, HumanDesignProfileInterpretation>> = {
    '1/3': {
        name: '探究者／烈士',
        summary: '傳統說法裡，1/3 先把基礎打穩，再從親身嘗試與犯錯中學到最扎實的東西。（3 爻傳統稱「烈士」，指的是親身驗證，不是犧牲。）',
        strengths: '做事前會先查清楚；碰到失敗也能把它當成資料，學得很深。',
        blindSpots: '準備不夠時會不安；多次試誤之後也可能對自己太嚴苛。',
        reflection: '你最近一次失敗，學到了什麼？',
    },
    '1/4': {
        name: '探究者／機會主義者',
        summary: '傳統說法裡，1/4 靠扎實的研究立足，再透過身邊熟悉的人把所學傳出去。（4 爻傳統稱「機會主義者」，指的是機會多半來自身邊的人際，不是貶義。）',
        strengths: '見解有根據，說出口時容易被身邊的人信任。',
        blindSpots: '需要先確定懂了才敢表達，也可能只在熟悉的圈子裡施展。',
        reflection: '你想說的事，有哪些其實已經準備好，只是還沒對人說？',
    },
    '2/4': {
        name: '隱士／機會主義者',
        summary: '傳統說法裡，2/4 有自然流露的天賦，喜歡獨處，也需要被身邊的人看見才能發揮。（4 爻傳統稱「機會主義者」，指的是機會多半來自身邊的人際，不是貶義。）',
        strengths: '不費力就會的事特別多，熟人的圈子能把這些才能帶出來。',
        blindSpots: '想獨處與需要被邀請之間常拉扯，也可能不知道自己的天賦有多特別。',
        reflection: '別人常稱讚你、而你覺得「這沒什麼」的事是什麼？',
    },
    '2/5': {
        name: '隱士／異端者',
        summary: '傳統說法裡，2/5 有自然的才能，也容易被別人期待成能解決問題的人。',
        strengths: '才能與實用性兼具，在關鍵時刻能提出別人需要的辦法。',
        blindSpots: '被期待的壓力很重時，會想躲起來；期待落空時也容易被誤解。',
        reflection: '哪些期待是你願意回應的，哪些只是別人放在你身上的？',
    },
    '3/5': {
        name: '烈士／異端者',
        summary: '傳統說法裡，3/5 透過一次次嘗試找出什麼行得通，並把有用的經驗整理給別人。（3 爻傳統稱「烈士」，指的是親身驗證，不是犧牲。）',
        strengths: '實戰經驗豐富、懂得變通，能提出經過考驗的辦法。',
        blindSpots: '多次不順時容易自責，也容易被期待一次就做對。',
        reflection: '你從哪次失敗裡找到了現在最常用的方法？',
    },
    '3/6': {
        name: '烈士／人生典範',
        summary: '傳統說法裡，3/6 的人生像分成幾個階段：先大量嘗試，再逐漸沉澱，最後成為別人可以參考的樣子。（3 爻傳統稱「烈士」，指的是親身驗證，不是犧牲。）',
        strengths: '經驗豐富，隨著時間會越來越有見地，也越來越穩。',
        blindSpots: '早期的波折可能讓人覺得自己一直在重來；也可能用太高的標準要求自己當榜樣。',
        reflection: '回頭看，哪些曾經的繞路後來成為了你的資產？',
    },
    '4/6': {
        name: '機會主義者／人生典範',
        summary: '傳統說法裡，4/6 靠與人的關係累積機會與信任，並隨著經驗成為身邊人可參考的人。（4 爻傳統稱「機會主義者」，指的是機會多半來自身邊的人際，不是貶義。）',
        strengths: '人緣與可信度並重，長期關係是他們最大的支持。',
        blindSpots: '太在意關係的穩定，也可能不敢表態；對自己或他人的期待可能偏理想化。',
        reflection: '你身邊哪些關係最能讓你成為自己想成為的人？',
    },
    '4/1': {
        name: '機會主義者／探究者',
        summary: '傳統說法裡，4/1 以紮實的內在基礎為本，透過一小群熟悉的人建立長久的影響。（4 爻傳統稱「機會主義者」，指的是機會多半來自身邊的人際，不是貶義。）',
        strengths: '立場穩定，重視深度與長久的關係。',
        blindSpots: '一旦認定就不容易改變看法，也可能不太適應圈子之外的環境。',
        reflection: '你的看法有哪些是研究過後的結論，哪些只是習慣？',
    },
    '5/1': {
        name: '異端者／探究者',
        summary: '傳統說法裡，5/1 常被期待提供辦法，並靠扎實的研究支撐這份期待。',
        strengths: '能把複雜的問題整理成別人可以用的方向，答案有根據。',
        blindSpots: '期待太高時壓力大，也可能被當成萬能的人。',
        reflection: '當別人期待你有答案時，你有多少是真的準備好了？',
    },
    '5/2': {
        name: '異端者／隱士',
        summary: '傳統說法裡，5/2 有自然的才能，也被別人寄予期待，但本人常想躲起來，等被真正需要時才現身。',
        strengths: '在需要時能快速提出有用的方案，天賦自然不費力。',
        blindSpots: '被打擾或被誤解時容易退縮，也可能不知道自己什麼時候才算準備好。',
        reflection: '你什麼時候最願意被請出來幫忙，什麼時候想躲起來？',
    },
    '6/2': {
        name: '人生典範／隱士',
        summary: '傳統說法裡，6/2 在人生的後半段逐漸成為可參考的樣子，同時保有獨處與自然流露的天賦。',
        strengths: '以身作則、與人保持適度的距離，隨年紀增長會越來越安穩。',
        blindSpots: '太像觀眾而不參與，也可能對自己和別人的標準過高。',
        reflection: '你現在是在參與，還是在旁邊看？是你的選擇嗎？',
    },
    '6/3': {
        name: '人生典範／烈士',
        summary: '傳統說法裡，6/3 一邊親身嘗試、一邊累積經驗，並逐漸成為別人眼中可靠的參考。（3 爻傳統稱「烈士」，指的是親身驗證，不是犧牲。）',
        strengths: '實際經歷多、說話有分量，對人生有深入的體會。',
        blindSpots: '早年的變動可能讓人沒有安全感；對自己也可能不太寬容。',
        reflection: '哪些經歷是你想留給別人參考的？',
    },
};

export const HUMAN_DESIGN_DEFINITION_INTERPRETATIONS: Readonly<Record<HumanDesignResult['definition'], HumanDesignInterpretation>> = {
    NONE: {
        summary: '傳統說法裡，沒有任何中心被通道連起來，只有反映者會是這種狀態：每個中心都開放，整體像一面鏡子。',
        strengths: '對環境與他人的狀態很敏感，能從不同的位置看見全貌。',
        blindSpots: '容易把外界的狀態誤認成自己的，需要刻意留時間讓自己回到原本的狀態。',
        reflection: '你有沒有固定的地方或時間，可以讓自己回到原本的樣子？',
    },
    SINGLE: {
        summary: '傳統說法裡，單一定義是所有已定義的中心連成一塊，內在像是一個完整的迴路，運作起來比較自給自足。',
        strengths: '想法與行動的步調比較一致，不太需要靠別人補足自己。',
        blindSpots: '自己的方式很順，也可能不容易理解別人為何需要不同的節奏。',
        reflection: '你習慣獨立完成的事，是真的獨自最適合，還是沒想過找人幫忙？',
    },
    SPLIT: {
        summary: '傳統說法裡，二分定義是已定義的中心分成兩塊，中間有空隙，傳統上認為需要透過人或環境把兩塊接起來。',
        strengths: '在與人互動時，能把原本分開的想法與能力連起來。',
        blindSpots: '獨自一人時，容易覺得有一部分不完整；也可能因此特別在意誰能幫自己「接上」。',
        reflection: '哪些人或場合，讓你覺得自己更完整？',
    },
    TRIPLE_SPLIT: {
        summary: '傳統說法裡，三分定義是已定義的中心分成三塊，需要多種人與環境的刺激來接起各個部分。',
        strengths: '能與不同類型的人合作，並從多種場合汲取靈感。',
        blindSpots: '需要的刺激多，容易覺得時間不夠用，也容易被分散。',
        reflection: '你最近有多少時間是留給自己想接觸的人與場合的？',
    },
    QUADRUPLE_SPLIT: {
        summary: '傳統說法裡，四分定義是已定義的中心分成四塊，較為少見，需要較長的時間與多樣的環境才能逐步連起來。',
        strengths: '能在不同的圈子與角色之間自在往返，視野寬。',
        blindSpots: '需要較長時間才能整合自己的步調，過程中可能覺得自己很難被理解。',
        reflection: '你給自己整合的時間夠嗎？有沒有被催著要立刻有答案？',
    },
};

export const HUMAN_DESIGN_CROSS_ANGLE_INTERPRETATIONS: Readonly<Record<IncarnationCross['angle'], HumanDesignInterpretation>> = {
    RIGHT_ANGLE: {
        summary: '傳統說法裡，右角度的輪迴交叉著重在個人的人生路徑與成長，主題偏向「我自己要怎麼活出來」。',
        strengths: '重視自己的方向，專注在個人的成長與使命。',
        blindSpots: '容易把重心放在自己，對身邊的人如何參與其中沒有那麼敏銳。',
        reflection: '你現在的人生方向，有多少是你自己選的？',
    },
    JUXTAPOSITION: {
        summary: '傳統說法裡，並置的輪迴交叉混合了個人與群體的主題，常被形容為把看似不相干的元素整合在一起。',
        strengths: '能把不同面向的經驗與角色串在一起，看見它們之間的關聯。',
        blindSpots: '個人與群體的主題交織時，容易分不清哪些是自己的方向，哪些是在回應別人。',
        reflection: '你現在的生活裡，有哪些看似無關的事，其實可以連在一起？',
    },
    LEFT_ANGLE: {
        summary: '傳統說法裡，左角度的輪迴交叉著重在關係與互動，主題偏向「與人一起、對他人的影響」。',
        strengths: '擅長在關係中發揮作用，也容易在與他人的互動裡找到方向。',
        blindSpots: '太專注在別人身上，可能忽略自己的需要。',
        reflection: '你在關係裡付出的，有多少也是你自己想要的？',
    },
};
