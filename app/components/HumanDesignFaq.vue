<template>
    <v-card class="mb-4">
        <v-card-title>常見問題</v-card-title>
        <v-card-subtitle class="text-wrap">
            想知道怎麼看這張圖、每個部分代表什麼，可以從這裡開始。
        </v-card-subtitle>
        <v-card-text>
            <v-expansion-panels
                variant="accordion"
                multiple
            >
                <v-expansion-panel
                    v-for="item in items"
                    :key="item.question"
                >
                    <v-expansion-panel-title>{{ item.question }}</v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <p
                            v-for="paragraph in item.paragraphs"
                            :key="paragraph"
                            class="mb-3"
                        >
                            {{ paragraph }}
                        </p>

                        <v-row
                            v-if="item.flow"
                            dense
                            class="mb-2"
                        >
                            <v-col
                                v-for="(step, index) in item.flow"
                                :key="step.title"
                                cols="12"
                                sm="4"
                            >
                                <v-card
                                    variant="outlined"
                                    height="100%"
                                >
                                    <v-card-text>
                                        <div class="text-caption text-medium-emphasis">
                                            第 {{ index + 1 }} 步
                                        </div>
                                        <div class="text-subtitle-2">
                                            {{ step.title }}
                                        </div>
                                        <div class="text-body-2">
                                            {{ step.text }}
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <ul
                            v-if="item.points"
                            class="pl-5 mb-2"
                        >
                            <li
                                v-for="point in item.points"
                                :key="point"
                            >
                                {{ point }}
                            </li>
                        </ul>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
        </v-card-text>
    </v-card>
</template>

<script lang="ts" setup>
type FaqItem = {
    question: string;
    paragraphs: string[];
    /** Three connected steps, drawn as small cards */
    flow?: Array<{ title: string; text: string }>;
    points?: string[];
};

/** Fixed explanations of how the chart is built and read; the same for everyone. */
const items: FaqItem[] = [
    {
        question: '這張圖是怎麼算出來的？',
        paragraphs: [
            '用你的出生日期、時間與地點，算出兩個時刻 13 個天體（太陽、地球、月亮、南北月交點與八大行星）的位置：一個是你出生的那一刻，另一個是出生前約 88 天（太陽往回走 88 度）的那一刻。',
            '每個位置會對應到 64 個閘門之一，再細分成 6 條線。整個過程由固定的公式與天文曆算出，同樣的資料每次都會得到同樣的結果。',
        ],
    },
    {
        question: '圖上的黑色、紅色代表什麼？',
        paragraphs: ['這張圖把兩個時刻的結果疊在一起看：'],
        points: [
            '黑色：出生當下的天體位置，稱為「人格」，通常被說成比較能意識到的部分。',
            '紅色：出生前約 88 天的位置，稱為「設計」，通常被說成比較不自覺的部分。',
            '紅圈黑框、黑紅相間：同一個閘門兩個時刻都有。',
            '通道的兩半各自依自己那一端閘門的來源上色。',
        ],
    },
    {
        question: '閘門、通道、能量中心是什麼關係？',
        paragraphs: ['三者是同一套計算的不同層級，由下往上一層一層判斷：'],
        flow: [
            {
                title: '閘門啟動', text: '天體位置對應到哪些閘門，黑色或紅色的圓點就是有啟動的閘門。',
            },
            {
                title: '通道判定', text: '看每條通道兩端的閘門是不是都啟動：兩端都有是「完整通道」，只有一端是「不完整」。',
            },
            {
                title: '中心定義', text: '被完整通道連接到的能量中心，就成為「有定義」，在圖上會有顏色。',
            },
        ],
    },
    {
        question: '完整通道和不完整通道有什麼不同？',
        paragraphs: [
            '一條通道有兩個端點，每個端點是一個閘門。兩端的閘門都啟動，這條通道就成立，並且會讓兩端所屬的能量中心都成為有定義。',
            '只有一端啟動的，通常稱為「懸掛閘門」。例如你有閘門 34、但沒有閘門 20，那麼 34–20「魅力」通道就不完整：',
        ],
        points: [
            '閘門 34 仍然是啟動的，它的特質依然存在。',
            '但不能因此就說 34–20 是完整的通道。',
            '也不能只憑一個懸掛閘門，就把兩端的能量中心判定為有定義。',
            '報告裡「已連接的通道」與「未連接的通道」，就是這兩種情況的對照。',
        ],
    },
    {
        question: '有定義和開放的能量中心有什麼差別？',
        paragraphs: [
            '有顏色的中心是「有定義」：它是你比較穩定、一致的能量來源。白色的中心是「開放」：比較彈性，也比較容易受身邊的人與環境影響。',
            '兩者沒有好壞。有定義代表穩定，開放代表有彈性、能感受環境，重點是知道哪些是自己固定的樣子，哪些是被外界帶來的。',
        ],
    },
    {
        question: '類型、策略、內在權威、人生角色、定義、人生十字各是什麼？',
        paragraphs: ['橫幅與概覽裡的六個項目，都是從上面的結果進一步整理出來的：'],
        points: [
            '類型：依哪些中心有定義、彼此怎麼連接，分成顯示者、生產者、顯示生產者、投射者、反映者五種。',
            '策略：這個類型比較順的做事方式，例如「等待回應」或「等待邀請」。',
            '內在權威：你做決定時比較可靠的依據，例如情緒、薦骨或直覺。',
            '人生角色：兩個數字，來自出生當下與設計時刻的太陽所在的線，例如 2/4。',
            '定義：有定義的中心連成了幾群，分單一、二分、三分、四分。',
            '人生十字：由兩個時刻的太陽與地球所在的四個閘門組成，常被當作一個人的人生主題。',
        ],
    },
    {
        question: '閘門後面的 .1 到 .6（線）是什麼？',
        paragraphs: [
            '每個閘門再分成 6 條「線」，標籤「太陽 28.2」的意思，是太陽落在閘門 28 的第 2 線。同一個閘門的主題相同，線則是主題裡更細的 6 種表現方式，由 1 到 6 大致從打基礎、往外發展，走到成熟：',
        ],
        points: [
            '1 線（探究者）：重視基礎與安全感，傾向先研究清楚、打好底再行動。',
            '2 線（隱士）：天賦自然流露，需要獨處的時間，也常在被邀請時才發揮。',
            '3 線（實驗者）：透過嘗試與犯錯來學習，在變動中找到真正適合自己的。',
            '4 線（交際者）：重視關係與人脈，常藉由身邊的人讓事情推進。',
            '5 線（實踐者）：容易被期待提出解決辦法，也常被別人投射期望。',
            '6 線（榜樣）：經歷嘗試、抽離觀察、回到生活的幾個階段，傾向成為別人的參考。',
            '概覽裡的「人生角色」，例如 2/4，就是由出生當下與設計時刻的太陽所在的線組成：第一個數字是人格的太陽線，第二個數字是設計的太陽線。',
        ],
    },
    {
        question: '為什麼出生時間差幾分鐘，結果也可能不同？',
        paragraphs: [
            '月亮一小時大約移動半度，而一條「線」只有不到 1 度寬，所以差一兩小時就可能換線，在邊界附近甚至換閘門，進而改變通道、中心與人生角色。',
            '另外，夏令時間調整的那一天，同一個鐘面時間可能出現兩次，也可能不存在，這時要特別確認時間。',
        ],
    },
    {
        question: '為什麼需要出生地點？',
        paragraphs: [
            '地點用來決定出生時的當地時區與當時是否有夏令時間，才能把你填的當地時間換算成世界標準時間。天體位置本身用的是世界標準時間，所以城市選同時區的鄰近城市，結果通常相同。',
        ],
    },
    {
        question: '為什麼和別的網站算出來不一樣？',
        paragraphs: [
            '最常見的原因是出生時間或時區不同：夏令時間、歷史上時區的變動、含糊的時間，各網站處理的方式不一定相同。其次是填寫的時間差了幾分鐘，剛好跨過邊界。',
            '遇到不同時，先確認出生時間與出生城市是否一致。',
        ],
    },
    {
        question: '這是科學嗎？結果準確嗎？',
        paragraphs: [
            '天體位置與閘門的對應是精確、固定的計算；但「這些結構代表什麼」屬於一套自我探索的詮釋，並不是經過科學驗證的結論，也不是心理、醫療或任何專業建議。',
            '把它當作觀察自己、思考自己的一個角度就好，不用拿它決定重要的事。',
        ],
    },
];
</script>
