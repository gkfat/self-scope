/**
 * The longer reading of each card in the major arcana: what it stands for, what its picture shows, how it reads
 * upright and reversed, and how it can look in daily life. Fixed text, the same for everyone who draws the card,
 * written once and reviewed, never produced by AI (RULE-017). The wording is tentative and never predicts events.
 * The short daily message of a drawn card lives in the TAROT fixed contents; this file holds the rest.
 */
export type TarotOrientationReading = {
    /** How it can show in how you see and treat yourself */
    self: string;
    /** How it can show with other people */
    relationship: string;
    innerConflict: string;
    growthTask: string;
    /** Open questions to think about, 3 per orientation */
    reflections: string[];
};

export type TarotCardMeaning = {
    /** Core themes, as short keywords */
    themes: string[];
    symbols: {
        figure: string;
        colors: string;
        props: string;
        composition: string;
    };
    /** What the card can offer when it is used well */
    light: string;
    /** What it can turn into when overdone or ignored */
    shadow: string;
    traditional: string;
    modern: string;
    uprightCore: string;
    reversedCore: string;
    /** What changes between the two orientations */
    contrast: string;
    upright: TarotOrientationReading;
    reversed: TarotOrientationReading;
};

/** Indexed by card number, 0 (The Fool) to 21 (The World). */

export const TAROT_CARD_MEANINGS: readonly TarotCardMeaning[] = [
    {
        themes: [
            '新開始',
            '自由',
            '信任',
            '冒險',
        ], symbols: {
            figure: '年輕旅人抬頭望天，腳邊就是懸崖邊緣', colors: '明亮的黃色天空與白色太陽，象徵樂觀與純粹', props: '白玫瑰、掛在肩上木杖末端的行囊、跳躍的小白狗', composition: '人物走在懸崖邊、遠方有群山，像是一步之遙的起點', 
        }, light: '願意嘗試、保持好奇、不被過去綁住', shadow: '忽略風險、缺少準備、把一切看得太輕', traditional: '象徵生命旅程的起點，代表純真、冒險與跳進未知', modern: '可以理解為『允許自己從零開始』，也提醒開始前看看腳下', uprightCore: '帶著信任踏出第一步，擁抱未知與可能', reversedCore: '因準備不足或猶豫而遲遲無法出發，或過於衝動', contrast: '正位偏向開放與出發，逆位偏向不安或魯莽，兩者都在問你『準備好了多少』', upright: {
            self: '你可能更願意相信直覺，接受自己還在摸索的狀態。', relationship: '你傾向對新的相遇保持開放，也不急著定義關係。', innerConflict: '想自由出發，又擔心踩空，兩股力量互相拉扯。', growthTask: '練習在『先試試看』與『先看清楚』之間找到平衡。', reflections: [
                '如果不怕失敗，我今天最想嘗試什麼？',
                '哪一步其實已經可以開始了？',
                '我在等什麼才肯出發？',
            ], 
        }, reversed: {
            self: '你可能對自己的選擇有些懷疑，或衝動後才開始擔心。', relationship: '你傾向在關係裡忽冷忽熱，或不太確定自己要什麼。', innerConflict: '想往前卻又怕出錯，結果原地打轉。', growthTask: '練習把大的未知拆成小步驟，先做功課再出發。', reflections: [
                '我的擔心有多少是真實的，有多少是想像？',
                '若先做一點準備，我會更安心嗎？',
                '我是在逃避什麼，還是在追求什麼？',
            ], 
        }, 
    },
    {
        themes: [
            '行動',
            '資源',
            '專注',
            '創造',
        ], symbols: {
            figure: '站在桌前的人，一手指向天、一手指向地', colors: '紅色長袍與白色內衣，象徵熱情與純粹，背景是明亮的黃色', props: '桌上的杖、杯、劍、幣四種元素，腰間的咬尾蛇腰帶，頭上的無限符號', composition: '玫瑰與百合環繞，代表欲望與純真並存', 
        }, light: '善用手邊資源、把想法落實、清楚表達', shadow: '分心、言行不一、過度包裝自己', traditional: '象徵意志與創造力，代表把想法化為現實的能力', modern: '可以理解為『你擁有的比想像的多』，重點在於如何運用', uprightCore: '有意識地運用資源與能力，把想法變成行動', reversedCore: '能力沒有被好好發揮，或把才華用在分散的地方', contrast: '正位是專注與落實，逆位是分散與猶豫，差別在於是否聚焦', upright: {
            self: '你可能對自己的能力有所感覺，願意主動出手。', relationship: '你傾向主動表達，讓對方知道你的想法。', innerConflict: '想展現自己，又擔心被看穿不夠好。', growthTask: '練習把點子收斂成一個可以完成的小目標。', reflections: [
                '我現有的資源有哪些還沒用上？',
                '我想做的事，第一步是什麼？',
                '我說的與做的是否一致？',
            ], 
        }, reversed: {
            self: '你可能覺得力氣散掉，或懷疑自己的能力。', relationship: '你傾向說得多做得少，或讓人覺得不夠可靠。', innerConflict: '想證明自己，又怕做不好而過度包裝。', growthTask: '練習只選一件事做完，不同時開太多線。', reflections: [
                '哪件事是我現在真正想完成的？',
                '我是否為了好看，而說得比做得多？',
                '我可以放掉哪一件分散注意力的事？',
            ], 
        }, 
    },
    {
        themes: [
            '直覺',
            '內省',
            '神祕',
            '等待',
        ], symbols: {
            figure: '坐在黑白兩柱之間的女性，神情安靜', colors: '藍色長袍象徵平靜與深度，黑白柱象徵對立的並存', props: '手中寫著 TORA 的卷軸、腳下的新月、胸前的十字、頭上的月相冠', composition: '背後是繡著石榴與棕櫚的帷幕，兩側是黑柱 B 與白柱 J，像是尚未揭開的內在世界', 
        }, light: '傾聽內在、善於觀察、不急著下結論', shadow: '把話藏在心裡、過度被動、與人保持距離', traditional: '象徵直覺與潛意識，代表沉靜與尚未顯露的智慧', modern: '可以理解為『答案未必在外面』，先靜下來聽自己', uprightCore: '相信直覺，在安靜中累積洞察', reversedCore: '忽略內在聲音，或隱藏了真正的想法', contrast: '正位是靜心聆聽，逆位是壓抑或忽視，差別在於是否願意面對自己的感受', upright: {
            self: '你可能更信任自己的感覺，也享受獨處的時刻。', relationship: '你傾向不急著表態，重視默契與深層的了解。', innerConflict: '想保持神祕與安全，又渴望被真正理解。', growthTask: '練習把內在的感受用簡單的話說出口。', reflections: [
                '我現在真正的感覺是什麼？',
                '有哪些直覺我一直沒有理會？',
                '我願意讓誰多了解我一點？',
            ], 
        }, reversed: {
            self: '你可能不太確定自己真正的想法，或習慣把心事壓下。', relationship: '你傾向把話藏著，讓對方只能猜。', innerConflict: '想被理解，卻又不說出口。', growthTask: '練習每天留一點時間，寫下當下的感受。', reflections: [
                '我在隱藏什麼，是為了保護自己嗎？',
                '我是否太在意別人的意見？',
                '如果說出真話，最壞的情況是什麼？',
            ], 
        }, 
    },
    {
        themes: [
            '滋養',
            '豐盛',
            '感受',
            '創造',
        ], symbols: {
            figure: '坐在柔軟靠墊上的女性，姿態放鬆而溫暖', colors: '綠色的自然與金黃的麥田，象徵生長與豐收', props: '成熟的麥田、金星符號的盾牌、頭上的十二星冠、手持的權杖', composition: '背景有樹林與流水，像是生命力充沛的花園', 
        }, light: '懂得照顧、享受生活、富有創造力', shadow: '過度付出、依賴他人的認可、忽略自己的需要', traditional: '象徵母性與豐盛，代表滋養、創造與感官的享受', modern: '可以理解為『好好照顧自己，也照顧身邊的事物』', uprightCore: '以溫暖與耐心滋養自己與周遭，享受豐盛', reversedCore: '過度消耗自己，或過於依賴他人的肯定', contrast: '正位是滋養與豐盛，逆位是耗竭或過度依賴，差別在於是否也照顧到自己', upright: {
            self: '你可能更重視感受，願意慢慢培養美好的事物。', relationship: '你傾向用陪伴與細節表達關心。', innerConflict: '想照顧所有人，又累積了沒說出口的疲憊。', growthTask: '練習在給予之前，先確認自己是否有餘裕。', reflections: [
                '我今天如何好好照顧自己？',
                '我給予別人的，也有留給自己嗎？',
                '什麼事物讓我真正感到滋養？',
            ], 
        }, reversed: {
            self: '你可能覺得被消耗，或不太懂得讓自己休息。', relationship: '你傾向用付出換取安心，擔心不被需要。', innerConflict: '想被愛又不好意思開口要求。', growthTask: '練習清楚說出自己的需要，也學會說不。', reflections: [
                '我是因為想做，還是怕被拒絕才付出？',
                '我最近有哪些需要被忽略了？',
                '我可以向誰尋求一點支持？',
            ], 
        }, 
    },
    {
        themes: [
            '秩序',
            '責任',
            '界線',
            '穩定',
        ], symbols: {
            figure: '坐在石製王座上的長者，姿態穩重', colors: '紅色長袍象徵意志與行動，橘色背景象徵權威與熱情', props: '手持安卡形的權杖與寶珠、王座扶手上的羊頭裝飾、鎧甲', composition: '背景是荒蕪的山，像是靠自己建立起的穩固基礎', 
        }, light: '有條理、能承擔、懂得建立規則', shadow: '過度控制、固執、不願傾聽', traditional: '象徵權威與結構，代表秩序、責任與領導', modern: '可以理解為『為自己的生活建立可靠的架構』', uprightCore: '以清楚的規則與責任，穩定地建立與維護', reversedCore: '過於僵化或想掌控一切，或缺乏秩序與紀律', contrast: '正位是穩定的結構，逆位是僵化或失序，差別在於是否保有彈性', upright: {
            self: '你可能更重視穩定與規劃，願意承擔責任。', relationship: '你傾向用可靠與承諾表達重視。', innerConflict: '想維持掌控，又擔心別人不照著走。', growthTask: '練習在堅持原則之外，也留一點彈性。', reflections: [
                '我需要為哪一件事設下清楚的界線？',
                '我想掌控的，是真的需要還是出於不安？',
                '我的規則還適合現在的我嗎？',
            ], 
        }, reversed: {
            self: '你可能對自己或他人太嚴格，或覺得失去掌控。', relationship: '你傾向強硬或過度保護，讓對方喘不過氣。', innerConflict: '想要安全感，卻用控制的方式表達。', growthTask: '練習放手一件小事，觀察結果是否仍可接受。', reflections: [
                '我為什麼這麼想控制這件事？',
                '我可以信任誰多承擔一點？',
                '我的堅持，有沒有讓別人難以靠近？',
            ], 
        }, 
    },
    {
        themes: [
            '傳統',
            '信念',
            '學習',
            '共同價值',
        ], symbols: {
            figure: '坐在兩根柱子之間的教宗，面前有兩位信徒', colors: '紅色長袍象徵信念與熱誠，白色與金色象徵神聖與秩序', props: '三重冠、頂端為三重十字的權杖、腳邊交叉的鑰匙、信徒衣上的花飾', composition: '人物居中、兩側對稱，營造莊重且有秩序的氛圍', 
        }, light: '向有經驗的人學習、重視共同價值、願意傳承', shadow: '盲從規範、不願變通、把自己的標準強加給人', traditional: '象徵傳統與制度，代表信仰、師承與共同的價值', modern: '可以理解為『從既有的智慧中尋找指引』，同時分辨什麼適合自己', uprightCore: '從既有的知識、規範或師長經驗中尋找指引', reversedCore: '質疑既有制度、重新審視信念，或過度抗拒規範', contrast: '正位是借助傳統的力量，逆位是重新檢視或打破，差別在於是否經過自己的思考', upright: {
            self: '你可能更願意向有經驗的人請益，重視共同的原則。', relationship: '你傾向重視穩定的承諾與彼此認同的價值。', innerConflict: '想遵守規範，又渴望走自己的路。', growthTask: '練習分辨哪些規則適合你，哪些只是習慣。', reflections: [
                '我一直遵守的規則，理由是什麼？',
                '誰是我願意請教的人？',
                '哪些價值是我真正認同的？',
            ], 
        }, reversed: {
            self: '你可能覺得被既定的框架束縛，想走自己的路。', relationship: '你傾向不想被既有模式定義，有時也因此與人疏遠。', innerConflict: '想獨立思考，又擔心被群體排除。', growthTask: '練習在反對之前，先理解規則背後的用意。', reflections: [
                '我是真的不同意，還是只是想反抗？',
                '這個規範有沒有可以借用的部分？',
                '我想建立的是什麼樣的原則？',
            ], 
        }, 
    },
    {
        themes: [
            '關係',
            '選擇',
            '契合',
            '誠實',
        ], symbols: {
            figure: '一男一女並立在天使之下', colors: '天使的紅色翅膀象徵祝福與熱情，明亮的天空與太陽象徵坦率', props: '背後的知識樹與生命樹、蛇與果實', composition: '兩人對稱站立，天使在上方居中照看，兩人之間遠處有一座山，像是在做一個重要的選擇', 
        }, light: '真誠相待、價值契合、勇於選擇', shadow: '猶豫不決、受誘惑牽動、把決定交給別人', traditional: '象徵愛與抉擇，代表關係、價值觀與真誠的連結', modern: '可以理解為『依自己的價值做選擇』，不只是浪漫的愛', uprightCore: '依據真實的價值做出選擇，建立真誠的連結', reversedCore: '在關係或選擇上失衡、猶豫，或與價值觀有衝突', contrast: '正位是和諧與有意識的選擇，逆位是失衡與迴避，差別在於是否面對自己的真實想法', upright: {
            self: '你可能更在意關係的真誠，也面對著一個選擇。', relationship: '你傾向坦誠相對，重視彼此價值是否契合。', innerConflict: '想要兩全，卻必須取捨。', growthTask: '練習清楚說出自己在乎的事，再做選擇。', reflections: [
                '我真正在乎的三件事是什麼？',
                '這個選擇符合我的價值嗎？',
                '我對重要的人說出真話了嗎？',
            ], 
        }, reversed: {
            self: '你可能在關係中感到失衡，或遲遲無法做決定。', relationship: '你傾向各說各話，或把心事藏著。', innerConflict: '想靠近又想保持距離，內心拉扯。', growthTask: '練習先釐清自己要什麼，再與對方溝通。', reflections: [
                '我迴避的是選擇，還是選擇的後果？',
                '我與對方的期待有哪裡不同？',
                '我是否把決定的責任丟給別人？',
            ], 
        }, 
    },
    {
        themes: [
            '決心',
            '前進',
            '自律',
            '勝利',
        ], symbols: {
            figure: '站在戰車上的戰士，神情堅定向前', colors: '藍色星空篷頂象徵理想，戰士的盔甲象徵意志', props: '一黑一白的斯芬克斯、肩上的月亮、頭上的星冠', composition: '戰車停在城市前的河邊，像是將要出發', 
        }, light: '目標明確、意志堅定、能整合不同力量', shadow: '急於求成、忽略身旁的人、動力過猛而失控', traditional: '象徵意志力與勝利，代表克服阻礙、控制方向', modern: '可以理解為『讓不同的力量朝同一個方向』', uprightCore: '整合內在的力量，有方向地前進', reversedCore: '方向不明、動力不足，或力量互相拉扯', contrast: '正位是掌控方向，逆位是失去方向，差別在於是否讓不同的力量一致', upright: {
            self: '你可能有明確的目標，願意為它努力。', relationship: '你傾向積極行動，也需要留意對方的步調。', innerConflict: '想快速前進，又擔心失控。', growthTask: '練習把目標拆成今天能完成的一步。', reflections: [
                '我真正想去的方向是什麼？',
                '我的努力有沒有讓身邊的人跟不上？',
                '哪個力量在拉住我？',
            ], 
        }, reversed: {
            self: '你可能覺得動力不足，或方向不明確。', relationship: '你傾向各走各的，或在爭執中耗損。', innerConflict: '想往前，卻被內心兩種聲音拉扯。', growthTask: '練習暫停一下，確認自己真正想前往的地方。', reflections: [
                '我現在是在硬撐嗎？',
                '我是否同時追著太多目標？',
                '什麼讓我失去了方向？',
            ], 
        }, 
    },
    {
        themes: [
            '勇氣',
            '耐心',
            '溫柔堅定',
            '自信',
        ], symbols: {
            figure: '一位女子輕柔地撫摸獅子的頭', colors: '白色長袍象徵純淨，背景的黃色象徵勇氣與光', props: '頭上的無限符號、花環、順從的獅子', composition: '人物與獅子親密互動，像是用溫柔化解了力量', 
        }, light: '以耐心面對挑戰、能溫和且堅定、有內在的勇氣', shadow: '壓抑情緒、對自己過度嚴苛、缺乏信心', traditional: '象徵內在的力量，代表以柔克剛與自我掌控', modern: '可以理解為『真正的力量未必是強硬，而是穩定與包容』', uprightCore: '以耐心與溫柔駕馭本能與情緒', reversedCore: '對自己缺乏信心，或情緒起伏而難以平穩', contrast: '正位是溫和的力量，逆位是自我懷疑，差別在於是否信任自己', upright: {
            self: '你可能擁有溫柔而堅定的力量，能穩住自己。', relationship: '你傾向用包容與耐心化解摩擦。', innerConflict: '想表現堅強，又不想壓抑真實的感受。', growthTask: '練習在情緒浮現時，先深呼吸再回應。', reflections: [
                '我如何在不強硬的情況下堅持自己？',
                '哪個情緒我一直在壓抑？',
                '我可以對自己多一點耐心嗎？',
            ], 
        }, reversed: {
            self: '你可能對自己沒有太多把握，容易疲憊。', relationship: '你傾向敏感、容易受傷，或情緒起伏較大。', innerConflict: '想堅強，卻又覺得自己不夠好。', growthTask: '練習用對待朋友的語氣，對待自己。', reflections: [
                '我對自己有哪些過度嚴格的要求？',
                '是什麼讓我失去了信心？',
                '我可以做什麼小事來安撫自己？',
            ], 
        }, 
    },
    {
        themes: [
            '獨處',
            '思考',
            '指引',
            '智慧',
        ], symbols: {
            figure: '站在山頂的老者，提著燈、拄著杖', colors: '灰色長袍與灰藍色背景，象徵沉靜與內省', props: '手中的六角星燈、手杖', composition: '雪山頂上的孤身一人，高舉著燈火，像是為後來的人指路', 
        }, light: '善於沉澱、尋找內在答案、不隨波逐流', shadow: '孤立自己、逃避人群、過度自我封閉', traditional: '象徵內省與智慧，代表獨處與尋求真理', modern: '可以理解為『暫時遠離喧囂，看清自己的方向』', uprightCore: '在獨處中思考與整理，找到內在的指引', reversedCore: '過度孤立或逃避，也可能在迷惘中找不到出口', contrast: '正位是有意識的沉澱，逆位是孤立或逃避，差別在於是否仍與世界保持連結', upright: {
            self: '你可能需要一些獨處的時間來整理想法。', relationship: '你傾向需要自己的空間，說清楚能讓人安心。', innerConflict: '想獨處，又擔心被忽略。', growthTask: '練習安排固定的靜心時間，並讓親近的人知道。', reflections: [
                '我現在最需要想清楚的是什麼？',
                '獨處時，我得到了什麼？',
                '我的燈照亮了哪一段路？',
            ], 
        }, reversed: {
            self: '你可能把自己關得太緊，不太想與人接觸。', relationship: '你傾向退縮不談，讓關係變得疏遠。', innerConflict: '想被理解，卻不想開口。', growthTask: '練習主動向信任的人傳達一句近況。', reflections: [
                '我是需要獨處，還是在逃避？',
                '我已經多久沒有與人好好聊聊？',
                '誰是我可以放心求助的人？',
            ], 
        }, 
    },
    {
        themes: [
            '轉變',
            '流動',
            '循環',
            '機會',
        ], symbols: {
            figure: '一個巨大的輪盤，周圍有各種象徵的生物', colors: '藍色天空與橙色輪盤，象徵變動與能量', props: '輪上的字母、頂端手持劍的斯芬克斯、下降的蛇、上升的阿努比斯、四角帶翼的人、鷹、牛、獅', composition: '輪盤居中，上下起伏，像是生命的循環', 
        }, light: '順應變化、把握時機、保持彈性', shadow: '把一切歸給運氣、抗拒改變、無法接受起伏', traditional: '象徵命運與循環，代表變化、時機與因果', modern: '可以理解為『事情有起有落』，重點在於如何調整自己', uprightCore: '感受事情的流動，順勢而為', reversedCore: '覺得事情不如預期，或抗拒改變', contrast: '正位是順應循環，逆位是抗拒或不順，差別在於面對變化的態度', upright: {
            self: '你可能感受到事情正在轉變，需要保持彈性。', relationship: '你傾向在關係中迎來新的節奏。', innerConflict: '想掌握一切，又知道有些事無法掌控。', growthTask: '練習接受變化，把力氣放在能做的事上。', reflections: [
                '哪些事是我能掌握的？',
                '這次變動帶來什麼新的機會？',
                '我該如何調整自己的步調？',
            ], 
        }, reversed: {
            self: '你可能覺得事情不順，或被打亂了節奏。', relationship: '你傾向在變動中感到不安，需要與人談談。', innerConflict: '想抓緊舊的狀態，卻無法阻止改變。', growthTask: '練習先從最小的可控制的事開始調整。', reflections: [
                '我抗拒的是改變，還是改變的過程？',
                '我可以放下什麼，來減輕壓力？',
                '這段時間我學到了什麼？',
            ], 
        }, 
    },
    {
        themes: [
            '公平',
            '誠實',
            '責任',
            '平衡',
        ], symbols: {
            figure: '坐在王座上的人，一手持劍、一手持天秤', colors: '紅色長袍象徵意志，紫色帷幕象徵智慧與公正', props: '右手的劍、左手的天秤、頭上的冠', composition: '人物端正居中，身後是帷幕、兩側是石柱，左右對稱，像是在做出公正的判斷', 
        }, light: '客觀看待、誠實面對、願意負責', shadow: '過度批判、逃避責任、只看對自己有利的一面', traditional: '象徵公平與因果，代表真相、責任與理性的判斷', modern: '可以理解為『為自己的選擇負責，用事實看事情』', uprightCore: '以公平與誠實面對自己與他人，為選擇負責', reversedCore: '覺得不被公平對待，或逃避承擔責任', contrast: '正位是誠實且客觀，逆位是偏見或逃避，差別在於是否願意面對全貌', upright: {
            self: '你可能需要更客觀地看待眼前的事。', relationship: '你傾向公平地看待彼此，願意坦誠討論。', innerConflict: '想要公正，又牽涉到私人的情感。', growthTask: '練習把事實與感受分開來看。', reflections: [
                '這件事的事實是什麼？',
                '我需要為哪個決定負責？',
                '從對方的角度，這件事是怎樣的？',
            ], 
        }, reversed: {
            self: '你可能覺得不被公平對待，或帶著偏見看事情。', relationship: '你傾向各執一詞，難以溝通。', innerConflict: '想要公正，卻只看見對自己有利的部分。', growthTask: '練習先聽完對方的說法，再回應。', reflections: [
                '我是否只看見自己想看的部分？',
                '有什麼是我一直逃避面對的？',
                '我可以如何做得更公平？',
            ], 
        }, 
    },
    {
        themes: [
            '暫停',
            '換位',
            '放下',
            '新視角',
        ], symbols: {
            figure: '一個人倒吊在T形的樹上，一腳被綁住', colors: '紅色褲子象徵身體與熱情，藍色上衣象徵思想，頭後的光環象徵領悟', props: 'T形的樹、頭部周圍的光環、被綁住的一腳、交叉成四字形的另一腿', composition: '人物倒吊，神情卻平靜，像是自願暫停', 
        }, light: '願意暫停、換個角度、接受等待', shadow: '停滯不前、拖延、為了不犧牲而僵持', traditional: '象徵犧牲與等待，代表放下既有的觀點', modern: '可以理解為『停下來，用不同的角度看事情』', uprightCore: '暫時停下，從新的角度重新理解', reversedCore: '卡住或拖延，不願放手而白白耗費力氣', contrast: '正位是自願的暫停，逆位是被動的停滯，差別在於是否真心願意放下', upright: {
            self: '你可能需要暫停一下，用不同的角度看事情。', relationship: '你傾向放下堅持，站在對方的立場想想。', innerConflict: '想往前，又覺得需要等待。', growthTask: '練習把急事放一晚，隔天再看。', reflections: [
                '如果換個角度，我會怎麼看這件事？',
                '我願意放下哪個堅持？',
                '等待對我有什麼意義？',
            ], 
        }, reversed: {
            self: '你可能覺得停滯，或在拖延某個決定。', relationship: '你傾向在關係中僵持，各不退讓。', innerConflict: '想前進，卻不願犧牲任何東西。', growthTask: '練習決定一件拖延的小事，不論結果先做出選擇。', reflections: [
                '我在等什麼，它會自己出現嗎？',
                '我可以讓步的是什麼？',
                '停在原地，對我有什麼好處與代價？',
            ], 
        }, 
    },
    {
        themes: [
            '結束',
            '轉換',
            '放下',
            '重生',
        ], symbols: {
            figure: '一具騎著白馬的骷髏騎士，手持黑色旗幟', colors: '黑色盔甲與旗幟象徵終結，白馬象徵純淨，遠方的日出象徵新的開始', props: '旗幟上的白玫瑰、倒下的國王、合掌的主教、跪著的孩童與少女、遠處的兩座塔', composition: '日出在兩塔之間，象徵結束後仍有新的光', 
        }, light: '放下不需要的、接受轉變、騰出空間', shadow: '抗拒結束、緊抓過去、停留在不捨中', traditional: '象徵結束與更新，代表轉化而非字面上的死亡', modern: '可以理解為『一個階段結束，另一個階段才能開始』', uprightCore: '接受結束，為新的階段騰出空間', reversedCore: '抗拒改變、緊抓過去，或在轉換期感到停滯', contrast: '正位是主動放下，逆位是執著不放，差別在於是否願意接受結束', upright: {
            self: '你可能正走到一個階段的尾聲，需要整理與告別。', relationship: '你傾向重新檢視關係中的模式。', innerConflict: '想放下，又對過去有所不捨。', growthTask: '練習為結束的事寫下感謝，然後前進。', reflections: [
                '我可以放下什麼？',
                '結束之後，我想要什麼樣的開始？',
                '我從這個階段學到了什麼？',
            ], 
        }, reversed: {
            self: '你可能對改變感到抗拒，或不願面對結束。', relationship: '你傾向對舊的模式放不下。', innerConflict: '想改變，又害怕失去。', growthTask: '練習允許自己有不捨，同時一步一步向前。', reflections: [
                '我執著的是什麼？',
                '不放手，對我有什麼代價？',
                '如果放下了，我會得到什麼空間？',
            ], 
        }, 
    },
    {
        themes: [
            '平衡',
            '調和',
            '耐心',
            '整合',
        ], symbols: {
            figure: '一位天使一腳踩在水中、一腳踩在地上，把水在兩個杯子間倒來倒去', colors: '紅紫色的翅膀與白色長袍，遠方山頭的金色光芒象徵希望', props: '兩個杯子、額頭的太陽符號、胸前方框內的三角形、岸邊的鳶尾花', composition: '小路通向遠方的光，像是需要一步步慢慢走', 
        }, light: '懂得拿捏分寸、耐心調和、保持平衡', shadow: '過度或極端、急躁、失去節奏', traditional: '象徵調和與節制，代表在對立之間找到中道', modern: '可以理解為『不急、不過度，慢慢找到適合的比例』', uprightCore: '耐心調和不同的需求，保持平衡', reversedCore: '失去平衡，過度投入或極端行事', contrast: '正位是平衡與調和，逆位是過度或失衡，差別在於是否維持分寸', upright: {
            self: '你可能懂得慢慢來，在不同需求之間取得平衡。', relationship: '你傾向溫和溝通，找到彼此舒服的節奏。', innerConflict: '想兼顧各方，又怕顧此失彼。', growthTask: '練習為行程留一點空白，給自己緩衝。', reflections: [
                '我的生活哪個部分最失衡？',
                '我可以調整什麼讓自己更舒服？',
                '我是否給了自己足夠的耐心？',
            ], 
        }, reversed: {
            self: '你可能做事過量或太極端，容易疲累。', relationship: '你傾向忽冷忽熱，難以維持穩定。', innerConflict: '想平衡，卻不斷往某一端傾斜。', growthTask: '練習減少一件事，找回自己的節奏。', reflections: [
                '我在哪件事上用力過度？',
                '我什麼時候最需要休息？',
                '我可以如何重新分配精力？',
            ], 
        }, 
    },
    {
        themes: [
            '束縛',
            '慾望',
            '依賴',
            '覺察',
        ], symbols: {
            figure: '一個山羊頭的惡魔站在高台上，下方有被鏈條鬆鬆繫著的一男一女', colors: '黑色背景象徵未知與壓抑，紅色火炬象徵慾望', props: '倒置的五芒星、火炬、頸上的鏈條', composition: '鏈條鬆鬆地套在頸上，常被解讀為束縛多半來自自己的認定', 
        }, light: '看見自己被什麼綁住、承認慾望、重新選擇', shadow: '沉溺習慣、把『沒辦法』當藉口、依賴某件事', traditional: '象徵束縛與慾望，代表物質、習慣與被困住的感覺', modern: '可以理解為『看見自己的鏈條，其實有機會鬆開』', uprightCore: '覺察被什麼束縛，如習慣、慾望或不安', reversedCore: '開始鬆開舊有的依賴，過程中可能掙扎', contrast: '正位是看見束縛，逆位是開始鬆綁，差別在於是否已經採取行動', upright: {
            self: '你可能發現自己被某個習慣或想法牽制。', relationship: '你傾向被強烈的吸引或依賴牽動。', innerConflict: '想擺脫，又捨不得其中的好處。', growthTask: '練習先觀察，不急著批判自己。', reflections: [
                '我被什麼綁住了，它帶給我什麼好處？',
                '這條鏈條是真的鎖死，還是我認為鎖死？',
                '我可以先鬆開哪一小步？',
            ], 
        }, reversed: {
            self: '你可能開始想擺脫舊的依賴，卻覺得吃力。', relationship: '你傾向重新檢視不健康的牽絆。', innerConflict: '想自由，又怕失去熟悉的安全感。', growthTask: '練習一次只減少一點，慢慢調整就好。', reflections: [
                '我想擺脫的是什麼？',
                '我需要什麼支持才能前進？',
                '沒有它，我會成為什麼樣的人？',
            ], 
        }, 
    },
    {
        themes: [
            '突變',
            '覺醒',
            '破除',
            '重建',
        ], symbols: {
            figure: '一座高塔被閃電擊中，有人從塔上墜落', colors: '黑色夜空象徵未知，黃色與紅色的火焰象徵突然的衝擊', props: '閃電、被擊落的皇冠、塔窗的火焰、空中的黃色火點', composition: '塔頂被閃電擊落，兩人從塔上墜落，塔立在岩石上，像是不穩的結構被迫瓦解', 
        }, light: '及早看清不穩的部分、願意重新建立', shadow: '害怕變動、迴避問題、把衝擊視為打擊', traditional: '象徵突如其來的變動，代表舊有結構的瓦解', modern: '可以理解為『不牢靠的東西倒下後，才能重建更穩的』', uprightCore: '面對突發的變動，原有的想法被打破', reversedCore: '延後面對問題，或仍在消化先前的衝擊', contrast: '正位是正面迎向變動，逆位是迴避或餘波，差別在於是否面對', upright: {
            self: '你可能面臨一個打破原有認知的時刻。', relationship: '你傾向在關係中看見真實的樣子。', innerConflict: '想維持穩定，又知道某些事不得不改變。', growthTask: '練習檢視哪些假設其實不夠牢固。', reflections: [
                '哪個我以為穩固的想法被動搖了？',
                '這個變動帶來什麼新的可能？',
                '我需要先重建哪一塊？',
            ], 
        }, reversed: {
            self: '你可能一直不想面對某個隱憂。', relationship: '你傾向壓著不安，不願談。', innerConflict: '想避開衝擊，卻讓問題悄悄累積。', growthTask: '練習處理一件拖延已久的小麻煩。', reflections: [
                '我在避免面對什麼？',
                '若現在處理，會比之後更好嗎？',
                '我需要什麼才有勇氣面對？',
            ], 
        }, 
    },
    {
        themes: [
            '希望',
            '療癒',
            '信心',
            '寧靜',
        ], symbols: {
            figure: '一位裸身的女子跪在水邊，把水倒入池中與土地', colors: '淡藍色的天空、金黃色的大星與白色的小星，象徵希望與平靜', props: '一顆八角大星與七顆小星、兩個水壺、樹上停著的鳥', composition: '一膝跪在地上、一腳踏在水中，像是連結內在與現實', 
        }, light: '懷抱希望、願意修復、保持平靜', shadow: '只是等待、缺乏行動、容易失望', traditional: '象徵希望與療癒，代表在困難之後重新獲得信心', modern: '可以理解為『慢慢好轉，持續照顧自己』', uprightCore: '帶著平靜與希望，慢慢修復', reversedCore: '對未來缺乏信心，或感到疲倦', contrast: '正位是帶著希望前進，逆位是失去信心，差別在於是否還相信會好轉', upright: {
            self: '你可能感受到希望，正在慢慢恢復。', relationship: '你傾向以溫柔與信任對待彼此。', innerConflict: '想相信未來，又擔心再次受傷。', growthTask: '練習為自己寫下一個小小的心願。', reflections: [
                '什麼讓我感到有希望？',
                '我今天可以為自己做什麼修復的事？',
                '我想要的未來是什麼樣子？',
            ], 
        }, reversed: {
            self: '你可能覺得疲倦，對未來沒什麼把握。', relationship: '你傾向對關係缺乏信心。', innerConflict: '想要希望，卻被失望牽著走。', growthTask: '練習記下三件最近順利的小事。', reflections: [
                '我是什麼時候開始失去信心的？',
                '有哪些進展其實已經發生？',
                '我需要什麼來恢復力氣？',
            ], 
        }, 
    },
    {
        themes: [
            '敏感',
            '不確定',
            '潛意識',
            '想像',
        ], symbols: {
            figure: '夜空中的月亮下，有一隻狗、一隻狼與從水中爬出的龍蝦', colors: '淡藍色的天空與黃色的月亮，下方是原野與水池，象徵神祕與情緒', props: '月亮與落下的黃色水滴、兩座塔、小徑、水池', composition: '小路通往遠方的兩座塔，像是穿過迷霧前進', 
        }, light: '細膩感受、探索內在、不急下結論', shadow: '把想像當成事實、被不安放大、難以看清', traditional: '象徵潛意識與不確定，代表夢、情緒與尚未看清的事', modern: '可以理解為『有些事還不明朗，先觀察而不急著決定』', uprightCore: '感受細膩，有些事還不明朗', reversedCore: '漸漸看清迷霧，或仍被焦慮影響', contrast: '正位是在不確定中觀察，逆位是釐清或被焦慮牽動，差別在於分辨感覺與事實', upright: {
            self: '你可能情緒敏感，感覺到一些尚未明朗的事。', relationship: '你傾向多想，向對方確認會比猜測更踏實。', innerConflict: '想看清楚，又怕看到不想面對的。', growthTask: '練習把擔心寫下來，分成已知與猜測。', reflections: [
                '我的擔心有多少是已經發生的？',
                '我的直覺在告訴我什麼？',
                '我可以向誰確認一下？',
            ], 
        }, reversed: {
            self: '你可能開始看清先前的迷惘，或仍然焦慮。', relationship: '你傾向說出心裡的恐懼，慢慢說就好。', innerConflict: '想擺脫不安，又不太確定從哪裡開始。', growthTask: '練習早點休息，把難決定的事留到明天。', reflections: [
                '我是否把想像當成事實？',
                '哪件事我其實已經有答案？',
                '什麼能讓我感到安心？',
            ], 
        }, 
    },
    {
        themes: [
            '活力',
            '喜悅',
            '坦率',
            '成就',
        ], symbols: {
            figure: '一個孩子騎著白馬，背後是大太陽', colors: '明亮的黃色與橘色，象徵溫暖與活力', props: '向日葵、紅色旗幟、白馬、磚牆', composition: '孩子張開雙臂，毫無保留，像是自在地迎向光', 
        }, light: '活力充沛、坦率表達、樂於分享', shadow: '過度樂觀、忽略細節、需要被肯定', traditional: '象徵喜悅與成功，代表明朗、自信與生命力', modern: '可以理解為『光明正大、單純地享受當下』', uprightCore: '明朗而有活力，坦率地表達與分享', reversedCore: '熱情稍減，或高興之餘仍有些保留', contrast: '正位是明朗與自信，逆位是低落或保留，差別在於是否願意展現自己', upright: {
            self: '你可能感到明朗，願意與人分享好心情。', relationship: '你傾向熱情開朗，直接表達喜歡與感謝。', innerConflict: '想高興地展現，又怕顯得太張揚。', growthTask: '練習在享受成果時，也留意還需要準備的部分。', reflections: [
                '什麼讓我感到單純的開心？',
                '我想與誰分享這份好心情？',
                '我的成果值得被肯定嗎？',
            ], 
        }, reversed: {
            self: '你可能覺得熱情不足，或缺乏自信。', relationship: '你傾向表達不夠直接，有所保留。', innerConflict: '想開心，卻因擔心落差而放不開。', growthTask: '練習做一件讓自己覺得開心的小事。', reflections: [
                '我為什麼不太敢展現自己？',
                '我的期待是不是太滿了？',
                '什麼小事能讓我提起精神？',
            ], 
        }, 
    },
    {
        themes: [
            '覺醒',
            '回顧',
            '原諒',
            '重新出發',
        ], symbols: {
            figure: '天使在雲端吹響號角，下方的人從棺木中起身', colors: '藍天與灰色的人群，象徵召喚與重生', props: '號角與繪有紅十字的旗幟、棺木、遠方的雪山', composition: '人們面向天使、舉起雙手，像是回應一個召喚', 
        }, light: '誠實回顧、願意原諒、決定新方向', shadow: '過度自責、反覆檢討、逃避決定', traditional: '象徵覺醒與召喚，代表回顧過去並重新出發', modern: '可以理解為『聽見內在的召喚，做出屬於自己的決定』', uprightCore: '回顧與覺醒，決定如何往前', reversedCore: '自我批判，或遲遲不願面對該做的決定', contrast: '正位是覺醒並行動，逆位是自責或逃避，差別在於是否願意原諒並前進', upright: {
            self: '你可能在回顧過去，思考下一步。', relationship: '你傾向重新看待關係，願意原諒或坦白。', innerConflict: '想重新出發，又放不下過去的錯。', growthTask: '練習寫下這段時間學到的事。', reflections: [
                '我從過去學到了什麼？',
                '我願意原諒自己哪件事？',
                '我聽見的召喚是什麼？',
            ], 
        }, reversed: {
            self: '你可能反覆檢討過去，難以專注眼前。', relationship: '你傾向被舊事纏住，難以往前。', innerConflict: '想重新開始，又怕做錯決定。', growthTask: '練習區分已經結束的事與仍需處理的事。', reflections: [
                '我是因為怕做錯而遲遲不決嗎？',
                '哪些事已經可以放下？',
                '我可以如何對自己溫柔一點？',
            ], 
        }, 
    },
    {
        themes: [
            '完成',
            '圓滿',
            '整合',
            '新階段',
        ], symbols: {
            figure: '一位舞者在花環中，周圍有四個象徵的生物', colors: '紫色的緞帶象徵智慧，綠色月桂花環象徵成功與生命', props: '月桂花環、兩根魔杖、四角的人、鷹、牛、獅', composition: '舞者位居中央，被花環環繞，像是完整的一圈', 
        }, light: '有完成感、整合經驗、感謝一路的幫助', shadow: '過早鬆懈、收尾不完整、停在舒適區', traditional: '象徵圓滿與完成，代表一段旅程的結束與整合', modern: '可以理解為『完成之後，再準備下一個起點』', uprightCore: '完成一個階段，感受圓滿與整合', reversedCore: '差一點就完成，或對收尾感到不捨', contrast: '正位是圓滿收尾，逆位是尚未完成，差別在於是否願意做最後一步', upright: {
            self: '你可能正完成一件事，感受到整合。', relationship: '你傾向感到安定與滿足，適合珍惜相處。', innerConflict: '想享受完成，又在思考下一步。', growthTask: '練習為完成的事給自己一個肯定。', reflections: [
                '我完成了什麼值得肯定的事？',
                '這段旅程帶給我什麼？',
                '接下來我想要什麼新的開始？',
            ], 
        }, reversed: {
            self: '你可能覺得差一步就完成，卻提不起勁。', relationship: '你傾向某個階段還沒有真正收尾。', innerConflict: '想結束，又不捨得告別。', growthTask: '練習找出一件做了九成的事，把它完成。', reflections: [
                '什麼讓我遲遲沒有收尾？',
                '我在不捨什麼？',
                '做完最後一步，我會得到什麼？',
            ], 
        }, 
    },
];
