/**
 * The 36 channels by name (traditional Chinese, English). Keyed by the two gates, lower number first.
 * Fixed vocabulary of the system, like the channel list itself: it does not depend on who is asking.
 */
export const CHANNEL_NAMES: Readonly<Record<string, { zh: string; en: string }>> = {
    '1-8': {
        zh: '靈感', en: 'Inspiration',
    },
    '2-14': {
        zh: '脈動', en: 'The Beat',
    },
    '3-60': {
        zh: '突變', en: 'Mutation',
    },
    '4-63': {
        zh: '邏輯', en: 'Logic',
    },
    '5-15': {
        zh: '節奏', en: 'Rhythm',
    },
    '6-59': {
        zh: '親密', en: 'Intimacy',
    },
    '7-31': {
        zh: '領導', en: 'The Alpha',
    },
    '9-52': {
        zh: '專注', en: 'Concentration',
    },
    '10-20': {
        zh: '覺醒', en: 'Awakening',
    },
    '10-34': {
        zh: '探索', en: 'Exploration',
    },
    '10-57': {
        zh: '完美形態', en: 'Perfected Form',
    },
    '11-56': {
        zh: '好奇', en: 'Curiosity',
    },
    '12-22': {
        zh: '開放', en: 'Openness',
    },
    '13-33': {
        zh: '浪子', en: 'The Prodigal',
    },
    '16-48': {
        zh: '波長', en: 'Wavelength',
    },
    '17-62': {
        zh: '接納', en: 'Acceptance',
    },
    '18-58': {
        zh: '評判', en: 'Judgment',
    },
    '19-49': {
        zh: '綜合', en: 'Synthesis',
    },
    '20-34': {
        zh: '魅力', en: 'Charisma',
    },
    '20-57': {
        zh: '腦波', en: 'Brainwave',
    },
    '21-45': {
        zh: '金錢', en: 'Money',
    },
    '23-43': {
        zh: '架構', en: 'Structuring',
    },
    '24-61': {
        zh: '覺察', en: 'Awareness',
    },
    '25-51': {
        zh: '發起', en: 'Initiation',
    },
    '26-44': {
        zh: '臣服', en: 'Surrender',
    },
    '27-50': {
        zh: '保存', en: 'Preservation',
    },
    '28-38': {
        zh: '掙扎', en: 'Struggle',
    },
    '29-46': {
        zh: '發現', en: 'Discovery',
    },
    '30-41': {
        zh: '認知', en: 'Recognition',
    },
    '32-54': {
        zh: '蛻變', en: 'Transformation',
    },
    '34-57': {
        zh: '力量', en: 'Power',
    },
    '35-36': {
        zh: '無常', en: 'Transitoriness',
    },
    '37-40': {
        zh: '社群', en: 'Community',
    },
    '39-55': {
        zh: '情緒', en: 'Emoting',
    },
    '42-53': {
        zh: '成熟', en: 'Maturation',
    },
    '47-64': {
        zh: '抽象', en: 'Abstraction',
    },
};
