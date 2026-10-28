import type { TraitAxis } from './schema';

/**
 * The 28 bipolar trait axes. An axis has two ends, A and B, which are two ways of being and neither is better: the
 * wording is neutral and each end says what it looks like when overdone.
 */
export const TRAIT_AXES: readonly TraitAxis[] = [
    {
        id: 'A1',
        group: 'THINKING',
        a: {
            name: '分析邏輯',
            description: '拆解事情，講求邏輯與客觀依據',
            overuse: '想太多、遲遲不動',
        },
        b: {
            name: '直覺感受',
            description: '憑整體感受與細微線索抓重點',
            overuse: '把感覺當事實',
        },
    },
    {
        id: 'A2',
        group: 'THINKING',
        a: {
            name: '自行判斷',
            description: '想法自己形成，不輕易隨大眾',
            overuse: '固執己見',
        },
        b: {
            name: '參考他人',
            description: '重視別人的意見與共識來校準',
            overuse: '失去自己的看法',
        },
    },
    {
        id: 'A3',
        group: 'THINKING',
        a: {
            name: '創新突破',
            description: '愛嘗試新做法、跳出框架',
            overuse: '點子多、完成少',
        },
        b: {
            name: '沿用經驗',
            description: '依靠驗證過的方法與經驗',
            overuse: '不願更新',
        },
    },
    {
        id: 'A4',
        group: 'THINKING',
        a: {
            name: '廣泛探索',
            description: '好奇多，愛接觸不同領域',
            overuse: '淺嘗即止',
        },
        b: {
            name: '專注深耕',
            description: '選定方向長期深入',
            overuse: '視野變窄',
        },
    },
    {
        id: 'A5',
        group: 'THINKING',
        a: {
            name: '重細節',
            description: '在意細節與品質',
            overuse: '完美主義、拖延',
        },
        b: {
            name: '重全局',
            description: '先看整體與方向',
            overuse: '忽略細節而出錯',
        },
    },
    {
        id: 'A6',
        group: 'THINKING',
        a: {
            name: '重美感形式',
            description: '在意美、風格與氛圍',
            overuse: '太在意外表與形象',
        },
        b: {
            name: '重實用功能',
            description: '在意好用、有效',
            overuse: '忽略感受與質感',
        },
    },
    {
        id: 'B1',
        group: 'ACTION',
        a: {
            name: '長遠規劃',
            description: '先排好長遠的方向與步驟',
            overuse: '計畫完整卻遲遲不開始',
        },
        b: {
            name: '活在當下',
            description: '依眼前的狀況隨機行動',
            overuse: '缺少預備、臨時才趕',
        },
    },
    {
        id: 'B2',
        group: 'ACTION',
        a: {
            name: '開創冒險',
            description: '勇於開始、願意承擔風險',
            overuse: '開頭熱情、收不了尾',
        },
        b: {
            name: '穩紮穩打',
            description: '先確認安全再前進',
            overuse: '錯過機會',
        },
    },
    {
        id: 'B3',
        group: 'ACTION',
        a: {
            name: '快速決斷',
            description: '很快做決定，不拖泥帶水',
            overuse: '少了諮詢與檢查',
        },
        b: {
            name: '審慎斟酌',
            description: '多方考量後才決定',
            overuse: '遲遲無法定案',
        },
    },
    {
        id: 'B4',
        group: 'ACTION',
        a: {
            name: '堅持不懈',
            description: '認定的事長時間堅持',
            overuse: '該停不停',
        },
        b: {
            name: '見機轉向',
            description: '看情況調整、轉彎',
            overuse: '缺乏定見',
        },
    },
    {
        id: 'B5',
        group: 'ACTION',
        a: {
            name: '條理秩序',
            description: '喜歡規則、流程與整理',
            overuse: '僵化、無法忍受失序',
        },
        b: {
            name: '自由隨性',
            description: '不愛被框住，保持彈性',
            overuse: '混亂、難以協作',
        },
    },
    {
        id: 'B6',
        group: 'ACTION',
        a: {
            name: '成果導向',
            description: '以結果與效率為重',
            overuse: '忽略感受',
        },
        b: {
            name: '過程導向',
            description: '重視過程、體驗與關係',
            overuse: '不夠看重結果',
        },
    },
    {
        id: 'C1',
        group: 'EMOTION',
        a: {
            name: '情緒細膩易感',
            description: '對情緒與氣氛敏感',
            overuse: '容易受影響而內耗',
        },
        b: {
            name: '情緒穩定抽離',
            description: '壓力下平穩，保持距離',
            overuse: '顯得冷淡、忽略感受',
        },
    },
    {
        id: 'C2',
        group: 'EMOTION',
        a: {
            name: '外放表達',
            description: '愛表達，感染並帶動他人',
            overuse: '話多、搶走焦點',
        },
        b: {
            name: '內斂含蓄',
            description: '想法放在心裡，少說多做',
            overuse: '心意讓人猜不到',
        },
    },
    {
        id: 'C3',
        group: 'EMOTION',
        a: {
            name: '直率坦白',
            description: '想到就說，不拐彎',
            overuse: '說得太直而傷人',
        },
        b: {
            name: '委婉圓融',
            description: '顧及對方感受，措辭圓融',
            overuse: '重要的事說不出口',
        },
    },
    {
        id: 'C4',
        group: 'EMOTION',
        a: {
            name: '樂觀正向',
            description: '看光明面，能自我調節',
            overuse: '低估風險',
        },
        b: {
            name: '審慎憂患',
            description: '先看風險，做最壞打算',
            overuse: '過度擔憂',
        },
    },
    {
        id: 'D1',
        group: 'RELATION',
        a: {
            name: '重情感連結',
            description: '以感受與關係為判斷依據',
            overuse: '被情緒帶著走',
        },
        b: {
            name: '重理性客觀',
            description: '以事實與公平為判斷依據',
            overuse: '忽略人的感受',
        },
    },
    {
        id: 'D2',
        group: 'RELATION',
        a: {
            name: '付出照顧',
            description: '習慣為別人付出',
            overuse: '付出過度、忽略自己',
        },
        b: {
            name: '保留自我',
            description: '先顧好自己的界線',
            overuse: '顯得疏離',
        },
    },
    {
        id: 'D3',
        group: 'RELATION',
        a: {
            name: '合作和諧',
            description: '重視團隊與和諧',
            overuse: '為求和諧壓下意見',
        },
        b: {
            name: '競爭爭取',
            description: '重視爭取與表現',
            overuse: '與人摩擦',
        },
    },
    {
        id: 'D4',
        group: 'RELATION',
        a: {
            name: '社交外向',
            description: '與人接觸時得到能量',
            overuse: '停留在表面',
        },
        b: {
            name: '獨處內向',
            description: '獨處時得到能量',
            overuse: '疏離、不求助',
        },
    },
    {
        id: 'D5',
        group: 'RELATION',
        a: {
            name: '領導主導',
            description: '習慣帶領、說服、做主',
            overuse: '強勢、主導過度',
        },
        b: {
            name: '配合支持',
            description: '習慣配合、輔助',
            overuse: '不表態',
        },
    },
    {
        id: 'D6',
        group: 'RELATION',
        a: {
            name: '包容接納',
            description: '接納差異，不計較',
            overuse: '界線不清',
        },
        b: {
            name: '堅守標準',
            description: '有明確的原則與要求',
            overuse: '苛求自己與他人',
        },
    },
    {
        id: 'E1',
        group: 'VALUE',
        a: {
            name: '追求穩定',
            description: '重視安穩與可預期',
            overuse: '抗拒改變',
        },
        b: {
            name: '追求變化',
            description: '重視新鮮與可能性',
            overuse: '不安定',
        },
    },
    {
        id: 'E2',
        group: 'VALUE',
        a: {
            name: '理想意義',
            description: '受價值與意義驅動',
            overuse: '與現實落差帶來挫折',
        },
        b: {
            name: '現實務實',
            description: '以可行與實際為先',
            overuse: '失去方向感',
        },
    },
    {
        id: 'E3',
        group: 'VALUE',
        a: {
            name: '自主獨立',
            description: '想自己決定，走自己的路',
            overuse: '難以配合',
        },
        b: {
            name: '歸屬依存',
            description: '需要群體與連結',
            overuse: '過度依賴他人認同',
        },
    },
    {
        id: 'E4',
        group: 'VALUE',
        a: {
            name: '成長進取',
            description: '想持續進步',
            overuse: '永不滿足',
        },
        b: {
            name: '知足安穩',
            description: '滿意現況，不求更多',
            overuse: '停滯',
        },
    },
    {
        id: 'E5',
        group: 'VALUE',
        a: {
            name: '重承諾長久',
            description: '重視長久與信守',
            overuse: '不易放手',
        },
        b: {
            name: '重自由流動',
            description: '保持彈性與自由',
            overuse: '難以長期投入',
        },
    },
    {
        id: 'E6',
        group: 'VALUE',
        a: {
            name: '承擔責任',
            description: '習慣把事情扛起來',
            overuse: '事事扛在身上',
        },
        b: {
            name: '輕鬆分擔',
            description: '放手，與人分擔',
            overuse: '把責任推開',
        },
    },
];
