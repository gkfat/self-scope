import type { Center } from './humanDesign';

/**
 * Drawing data for the bodygraph: the traditional layout with the Head at the top,
 * the Spleen and Solar Plexus on either side, and the Root at the bottom. Pure data, so it can be tested
 * without rendering anything.
 */
/** The drawing area, cropped to the chart so the figure fills its box. */
export const CHART_VIEWBOX = {
    x: 50, y: 10, width: 380, height: 655,
};

export const CENTER_POLYGONS: Readonly<Record<Center, string>> = {
    HEAD: '240,20 205,90 275,90',
    AJNA: '205,120 275,120 240,185',
    THROAT: '205,228 275,228 275,298 205,298',
    G: '240,325 300,380 240,435 180,380',
    HEART: '335,338 372,396 298,396',
    SACRAL: '205,470 275,470 275,540 205,540',
    SPLEEN: '66,440 66,540 140,490',
    SOLAR_PLEXUS: '414,440 414,540 340,490',
    ROOT: '205,585 275,585 275,655 205,655',
};

/** Fill of a defined center, as in the traditional chart. */
export const CENTER_COLORS: Readonly<Record<Center, string>> = {
    HEAD: '#f4d96b',
    AJNA: '#7fb77e',
    THROAT: '#a8693d',
    G: '#f4d96b',
    HEART: '#e0574b',
    SACRAL: '#e0574b',
    SPLEEN: '#a8693d',
    SOLAR_PLEXUS: '#a8693d',
    ROOT: '#a8693d',
};

export const GATE_POSITIONS: Readonly<Record<number, readonly [number, number]>> = {
    // Head
    64: [222, 80], 61: [240, 80], 63: [258, 80],
    // Ajna
    47: [214, 128], 24: [240, 128], 4: [266, 128], 17: [229, 150], 43: [240, 166], 11: [251, 150],
    // Throat
    62: [218, 236], 23: [240, 236], 56: [262, 236],
    16: [212, 252], 20: [212, 274],
    35: [269, 252], 12: [269, 266], 45: [269, 280],
    31: [220, 290], 8: [240, 290], 33: [258, 290],
    // G
    1: [240, 333], 7: [218, 350], 13: [262, 350], 10: [190, 380], 25: [290, 380], 15: [218, 410], 46: [262, 410], 2: [240, 427],
    // Heart
    21: [335, 352], 51: [321, 372], 26: [314, 388], 40: [356, 388],
    // Sacral
    5: [218, 477], 14: [240, 477], 29: [262, 477], 34: [211, 494], 27: [211, 516], 59: [269, 505],
    42: [218, 533], 3: [240, 533], 9: [262, 533],
    // Spleen
    48: [84, 458], 57: [102, 468], 44: [118, 479], 50: [130, 490], 32: [118, 501], 28: [102, 512], 18: [84, 522],
    // Solar Plexus
    36: [396, 458], 22: [378, 468], 37: [362, 479], 6: [350, 490], 49: [362, 501], 55: [378, 512], 30: [396, 522],
    // Root
    53: [218, 593], 60: [240, 593], 52: [262, 593],
    54: [212, 609], 38: [212, 623], 58: [212, 637],
    19: [268, 609], 39: [268, 623], 41: [268, 637],
};

/**
 * Channels that would run through a center or another channel are bent: the value is the control point of a
 * quadratic curve between the two gates. Every other channel is a straight line.
 */
export const CHANNEL_CURVES: Readonly<Record<string, readonly [number, number]>> = {
    '20-34': [140, 380],
    '34-57': [150, 455],
    '26-44': [240, 455],
    '35-36': [430, 290],
    '12-22': [390, 330],
};
