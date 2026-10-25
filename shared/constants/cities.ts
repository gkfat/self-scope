/**
 * Preset birth-place list (FR-002, CTX-ASM-006).
 * Coordinates are approximate city centers; time zones are IANA names so that
 * historical offsets (including daylight saving) come from the tz database.
 */
export type City = {
    code: string;
    name: string;
    lat: number;
    lng: number;
    timeZone: string;
};

const taiwan = (code: string, name: string, lat: number, lng: number): City => ({
    code, name, lat, lng, timeZone: 'Asia/Taipei',
});

export const CITIES: readonly City[] = [
    taiwan('tw-taipei', '台北市', 25.033, 121.5654),
    taiwan('tw-new-taipei', '新北市', 25.012, 121.465),
    taiwan('tw-taoyuan', '桃園市', 24.9936, 121.301),
    taiwan('tw-taichung', '台中市', 24.1477, 120.6736),
    taiwan('tw-tainan', '台南市', 22.9999, 120.227),
    taiwan('tw-kaohsiung', '高雄市', 22.6273, 120.3014),
    taiwan('tw-keelung', '基隆市', 25.1276, 121.7392),
    taiwan('tw-hsinchu-city', '新竹市', 24.8138, 120.9675),
    taiwan('tw-hsinchu-county', '新竹縣', 24.8387, 121.0177),
    taiwan('tw-miaoli', '苗栗縣', 24.5602, 120.8214),
    taiwan('tw-changhua', '彰化縣', 24.0518, 120.5161),
    taiwan('tw-nantou', '南投縣', 23.9609, 120.9719),
    taiwan('tw-yunlin', '雲林縣', 23.7092, 120.4313),
    taiwan('tw-chiayi-city', '嘉義市', 23.4801, 120.4491),
    taiwan('tw-chiayi-county', '嘉義縣', 23.459, 120.333),
    taiwan('tw-pingtung', '屏東縣', 22.6762, 120.4928),
    taiwan('tw-yilan', '宜蘭縣', 24.7021, 121.7378),
    taiwan('tw-hualien', '花蓮縣', 23.9872, 121.6015),
    taiwan('tw-taitung', '台東縣', 22.7583, 121.1444),
    taiwan('tw-penghu', '澎湖縣', 23.5711, 119.5793),
    taiwan('tw-kinmen', '金門縣', 24.4493, 118.3767),
    taiwan('tw-lienchiang', '連江縣', 26.16, 119.95),
    {
        code: 'hk-hong-kong', name: '香港', lat: 22.3193, lng: 114.1694, timeZone: 'Asia/Hong_Kong',
    },
    {
        code: 'cn-shanghai', name: '上海', lat: 31.2304, lng: 121.4737, timeZone: 'Asia/Shanghai',
    },
    {
        code: 'cn-beijing', name: '北京', lat: 39.9042, lng: 116.4074, timeZone: 'Asia/Shanghai',
    },
    {
        code: 'jp-tokyo', name: '東京', lat: 35.6762, lng: 139.6503, timeZone: 'Asia/Tokyo',
    },
    {
        code: 'kr-seoul', name: '首爾', lat: 37.5665, lng: 126.978, timeZone: 'Asia/Seoul',
    },
    {
        code: 'sg-singapore', name: '新加坡', lat: 1.3521, lng: 103.8198, timeZone: 'Asia/Singapore',
    },
    {
        code: 'my-kuala-lumpur', name: '吉隆坡', lat: 3.139, lng: 101.6869, timeZone: 'Asia/Kuala_Lumpur',
    },
    {
        code: 'th-bangkok', name: '曼谷', lat: 13.7563, lng: 100.5018, timeZone: 'Asia/Bangkok',
    },
    {
        code: 'gb-london', name: '倫敦', lat: 51.5072, lng: -0.1276, timeZone: 'Europe/London',
    },
    {
        code: 'us-new-york', name: '紐約', lat: 40.7128, lng: -74.006, timeZone: 'America/New_York',
    },
    {
        code: 'us-los-angeles', name: '洛杉磯', lat: 34.0522, lng: -118.2437, timeZone: 'America/Los_Angeles',
    },
    {
        code: 'ca-vancouver', name: '溫哥華', lat: 49.2827, lng: -123.1207, timeZone: 'America/Vancouver',
    },
    {
        code: 'ca-toronto', name: '多倫多', lat: 43.6532, lng: -79.3832, timeZone: 'America/Toronto',
    },
    {
        code: 'au-sydney', name: '雪梨', lat: -33.8688, lng: 151.2093, timeZone: 'Australia/Sydney',
    },
];

const CITY_BY_CODE = new Map(CITIES.map((city) => [city.code, city]));

export const CITY_CODES = CITIES.map((city) => city.code);

export function findCity(code: string): City | undefined {
    return CITY_BY_CODE.get(code);
}
