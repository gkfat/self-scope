/**
 * Preset birth-place list (FR-002, CTX-ASM-006).
 * Coordinates are approximate city centers; time zones are IANA names so that
 * historical offsets (including daylight saving) come from the tz database.
 */
export type City = {
    code: string;
    /** Chinese name shown first; the English name is shown in brackets and is searchable too. */
    name: string;
    nameEn: string;
    lat: number;
    lng: number;
    timeZone: string;
};

const taiwan = (code: string, name: string, nameEn: string, lat: number, lng: number): City => ({
    code, name, nameEn, lat, lng, timeZone: 'Asia/Taipei',
});

const abroad = (code: string, name: string, nameEn: string, lat: number, lng: number, timeZone: string): City => ({
    code, name, nameEn, lat, lng, timeZone,
});

export const CITIES: readonly City[] = [
    taiwan('tw-taipei', '台北市', 'Taipei', 25.033, 121.5654),
    taiwan('tw-new-taipei', '新北市', 'New Taipei', 25.012, 121.465),
    taiwan('tw-taoyuan', '桃園市', 'Taoyuan', 24.9936, 121.301),
    taiwan('tw-taichung', '台中市', 'Taichung', 24.1477, 120.6736),
    taiwan('tw-tainan', '台南市', 'Tainan', 22.9999, 120.227),
    taiwan('tw-kaohsiung', '高雄市', 'Kaohsiung', 22.6273, 120.3014),
    taiwan('tw-keelung', '基隆市', 'Keelung', 25.1276, 121.7392),
    taiwan('tw-hsinchu-city', '新竹市', 'Hsinchu City', 24.8138, 120.9675),
    taiwan('tw-hsinchu-county', '新竹縣', 'Hsinchu County', 24.8387, 121.0177),
    taiwan('tw-miaoli', '苗栗縣', 'Miaoli County', 24.5602, 120.8214),
    taiwan('tw-changhua', '彰化縣', 'Changhua County', 24.0518, 120.5161),
    taiwan('tw-nantou', '南投縣', 'Nantou County', 23.9609, 120.9719),
    taiwan('tw-yunlin', '雲林縣', 'Yunlin County', 23.7092, 120.4313),
    taiwan('tw-chiayi-city', '嘉義市', 'Chiayi City', 23.4801, 120.4491),
    taiwan('tw-chiayi-county', '嘉義縣', 'Chiayi County', 23.459, 120.333),
    taiwan('tw-pingtung', '屏東縣', 'Pingtung County', 22.6762, 120.4928),
    taiwan('tw-yilan', '宜蘭縣', 'Yilan County', 24.7021, 121.7378),
    taiwan('tw-hualien', '花蓮縣', 'Hualien County', 23.9872, 121.6015),
    taiwan('tw-taitung', '台東縣', 'Taitung County', 22.7583, 121.1444),
    taiwan('tw-penghu', '澎湖縣', 'Penghu County', 23.5711, 119.5793),
    taiwan('tw-kinmen', '金門縣', 'Kinmen County', 24.4493, 118.3767),
    taiwan('tw-lienchiang', '連江縣', 'Lienchiang County (Matsu)', 26.16, 119.95),
    {
        code: 'hk-hong-kong', name: '香港', nameEn: 'Hong Kong', lat: 22.3193, lng: 114.1694, timeZone: 'Asia/Hong_Kong',
    },
    {
        code: 'cn-shanghai', name: '上海', nameEn: 'Shanghai', lat: 31.2304, lng: 121.4737, timeZone: 'Asia/Shanghai',
    },
    {
        code: 'cn-beijing', name: '北京', nameEn: 'Beijing', lat: 39.9042, lng: 116.4074, timeZone: 'Asia/Shanghai',
    },
    {
        code: 'jp-tokyo', name: '東京', nameEn: 'Tokyo', lat: 35.6762, lng: 139.6503, timeZone: 'Asia/Tokyo',
    },
    {
        code: 'kr-seoul', name: '首爾', nameEn: 'Seoul', lat: 37.5665, lng: 126.978, timeZone: 'Asia/Seoul',
    },
    {
        code: 'sg-singapore', name: '新加坡', nameEn: 'Singapore', lat: 1.3521, lng: 103.8198, timeZone: 'Asia/Singapore',
    },
    {
        code: 'my-kuala-lumpur', name: '吉隆坡', nameEn: 'Kuala Lumpur', lat: 3.139, lng: 101.6869, timeZone: 'Asia/Kuala_Lumpur',
    },
    {
        code: 'th-bangkok', name: '曼谷', nameEn: 'Bangkok', lat: 13.7563, lng: 100.5018, timeZone: 'Asia/Bangkok',
    },
    {
        code: 'gb-london', name: '倫敦', nameEn: 'London', lat: 51.5072, lng: -0.1276, timeZone: 'Europe/London',
    },
    {
        code: 'us-new-york', name: '紐約', nameEn: 'New York', lat: 40.7128, lng: -74.006, timeZone: 'America/New_York',
    },
    {
        code: 'us-los-angeles', name: '洛杉磯', nameEn: 'Los Angeles', lat: 34.0522, lng: -118.2437, timeZone: 'America/Los_Angeles',
    },
    {
        code: 'ca-vancouver', name: '溫哥華', nameEn: 'Vancouver', lat: 49.2827, lng: -123.1207, timeZone: 'America/Vancouver',
    },
    {
        code: 'ca-toronto', name: '多倫多', nameEn: 'Toronto', lat: 43.6532, lng: -79.3832, timeZone: 'America/Toronto',
    },
    {
        code: 'au-sydney', name: '雪梨', nameEn: 'Sydney', lat: -33.8688, lng: 151.2093, timeZone: 'Australia/Sydney',
    },
    abroad('cn-guangzhou', '廣州', 'Guangzhou', 23.1291, 113.2644, 'Asia/Shanghai'),
    abroad('cn-shenzhen', '深圳', 'Shenzhen', 22.5431, 114.0579, 'Asia/Shanghai'),
    abroad('cn-chengdu', '成都', 'Chengdu', 30.5728, 104.0668, 'Asia/Shanghai'),
    abroad('cn-chongqing', '重慶', 'Chongqing', 29.563, 106.5516, 'Asia/Shanghai'),
    abroad('cn-hangzhou', '杭州', 'Hangzhou', 30.2741, 120.1551, 'Asia/Shanghai'),
    abroad('cn-nanjing', '南京', 'Nanjing', 32.0603, 118.7969, 'Asia/Shanghai'),
    abroad('cn-wuhan', '武漢', 'Wuhan', 30.5928, 114.3055, 'Asia/Shanghai'),
    abroad('cn-xian', '西安', 'Xi\'an', 34.3416, 108.9398, 'Asia/Shanghai'),
    abroad('mo-macau', '澳門', 'Macau', 22.1987, 113.5439, 'Asia/Macau'),
    abroad('jp-osaka', '大阪', 'Osaka', 34.6937, 135.5023, 'Asia/Tokyo'),
    abroad('jp-kyoto', '京都', 'Kyoto', 35.0116, 135.7681, 'Asia/Tokyo'),
    abroad('jp-nagoya', '名古屋', 'Nagoya', 35.1815, 136.9066, 'Asia/Tokyo'),
    abroad('jp-fukuoka', '福岡', 'Fukuoka', 33.5904, 130.4017, 'Asia/Tokyo'),
    abroad('jp-sapporo', '札幌', 'Sapporo', 43.0618, 141.3545, 'Asia/Tokyo'),
    abroad('kr-busan', '釜山', 'Busan', 35.1796, 129.0756, 'Asia/Seoul'),
    abroad('vn-hanoi', '河內', 'Hanoi', 21.0278, 105.8342, 'Asia/Ho_Chi_Minh'),
    abroad('vn-ho-chi-minh', '胡志明市', 'Ho Chi Minh City', 10.8231, 106.6297, 'Asia/Ho_Chi_Minh'),
    abroad('id-jakarta', '雅加達', 'Jakarta', -6.2088, 106.8456, 'Asia/Jakarta'),
    abroad('ph-manila', '馬尼拉', 'Manila', 14.5995, 120.9842, 'Asia/Manila'),
    abroad('my-penang', '檳城', 'Penang', 5.4141, 100.3288, 'Asia/Kuala_Lumpur'),
    abroad('kh-phnom-penh', '金邊', 'Phnom Penh', 11.5564, 104.9282, 'Asia/Phnom_Penh'),
    abroad('mm-yangon', '仰光', 'Yangon', 16.8409, 96.1735, 'Asia/Yangon'),
    abroad('in-new-delhi', '新德里', 'New Delhi', 28.6139, 77.209, 'Asia/Kolkata'),
    abroad('in-mumbai', '孟買', 'Mumbai', 19.076, 72.8777, 'Asia/Kolkata'),
    abroad('ae-dubai', '杜拜', 'Dubai', 25.2048, 55.2708, 'Asia/Dubai'),
    abroad('tr-istanbul', '伊斯坦堡', 'Istanbul', 41.0082, 28.9784, 'Europe/Istanbul'),
    abroad('il-tel-aviv', '特拉維夫', 'Tel Aviv', 32.0853, 34.7818, 'Asia/Jerusalem'),
    abroad('fr-paris', '巴黎', 'Paris', 48.8566, 2.3522, 'Europe/Paris'),
    abroad('es-madrid', '馬德里', 'Madrid', 40.4168, -3.7038, 'Europe/Madrid'),
    abroad('es-barcelona', '巴塞隆納', 'Barcelona', 41.3874, 2.1686, 'Europe/Madrid'),
    abroad('de-berlin', '柏林', 'Berlin', 52.52, 13.405, 'Europe/Berlin'),
    abroad('it-rome', '羅馬', 'Rome', 41.9028, 12.4964, 'Europe/Rome'),
    abroad('it-milan', '米蘭', 'Milan', 45.4642, 9.19, 'Europe/Rome'),
    abroad('nl-amsterdam', '阿姆斯特丹', 'Amsterdam', 52.3676, 4.9041, 'Europe/Amsterdam'),
    abroad('be-brussels', '布魯塞爾', 'Brussels', 50.8503, 4.3517, 'Europe/Brussels'),
    abroad('ch-zurich', '蘇黎世', 'Zurich', 47.3769, 8.5417, 'Europe/Zurich'),
    abroad('at-vienna', '維也納', 'Vienna', 48.2082, 16.3738, 'Europe/Vienna'),
    abroad('se-stockholm', '斯德哥爾摩', 'Stockholm', 59.3293, 18.0686, 'Europe/Stockholm'),
    abroad('pt-lisbon', '里斯本', 'Lisbon', 38.7223, -9.1393, 'Europe/Lisbon'),
    abroad('ie-dublin', '都柏林', 'Dublin', 53.3498, -6.2603, 'Europe/Dublin'),
    abroad('ru-moscow', '莫斯科', 'Moscow', 55.7558, 37.6173, 'Europe/Moscow'),
    abroad('us-san-francisco', '舊金山', 'San Francisco', 37.7749, -122.4194, 'America/Los_Angeles'),
    abroad('us-seattle', '西雅圖', 'Seattle', 47.6062, -122.3321, 'America/Los_Angeles'),
    abroad('us-chicago', '芝加哥', 'Chicago', 41.8781, -87.6298, 'America/Chicago'),
    abroad('us-houston', '休士頓', 'Houston', 29.7604, -95.3698, 'America/Chicago'),
    abroad('us-denver', '丹佛', 'Denver', 39.7392, -104.9903, 'America/Denver'),
    abroad('us-boston', '波士頓', 'Boston', 42.3601, -71.0589, 'America/New_York'),
    abroad('us-washington-dc', '華盛頓特區', 'Washington, D.C.', 38.9072, -77.0369, 'America/New_York'),
    abroad('us-miami', '邁阿密', 'Miami', 25.7617, -80.1918, 'America/New_York'),
    abroad('us-honolulu', '檀香山', 'Honolulu', 21.3069, -157.8583, 'Pacific/Honolulu'),
    abroad('ca-montreal', '蒙特婁', 'Montreal', 45.5019, -73.5674, 'America/Toronto'),
    abroad('mx-mexico-city', '墨西哥城', 'Mexico City', 19.4326, -99.1332, 'America/Mexico_City'),
    abroad('br-sao-paulo', '聖保羅', 'São Paulo', -23.5505, -46.6333, 'America/Sao_Paulo'),
    abroad('ar-buenos-aires', '布宜諾斯艾利斯', 'Buenos Aires', -34.6037, -58.3816, 'America/Argentina/Buenos_Aires'),
    abroad('au-melbourne', '墨爾本', 'Melbourne', -37.8136, 144.9631, 'Australia/Melbourne'),
    abroad('au-brisbane', '布里斯本', 'Brisbane', -27.4698, 153.0251, 'Australia/Brisbane'),
    abroad('au-perth', '伯斯', 'Perth', -31.9505, 115.8605, 'Australia/Perth'),
    abroad('nz-auckland', '奧克蘭', 'Auckland', -36.8485, 174.7633, 'Pacific/Auckland'),
    abroad('eg-cairo', '開羅', 'Cairo', 30.0444, 31.2357, 'Africa/Cairo'),
    abroad('za-johannesburg', '約翰尼斯堡', 'Johannesburg', -26.2041, 28.0473, 'Africa/Johannesburg'),
];

const CITY_BY_CODE = new Map(CITIES.map((city) => [city.code, city]));

export const CITY_CODES = CITIES.map((city) => city.code);

export function findCity(code: string): City | undefined {
    return CITY_BY_CODE.get(code);
}

/** "巴黎 (Paris)": what members see and search. */
export function cityLabel(city: City): string {
    return `${city.name} (${city.nameEn})`;
}
