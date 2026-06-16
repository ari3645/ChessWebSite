export const ROWS = 8;
export const COLS = 8;

export const INITIAL_GRID = [
    ["tn", "cn", "fn", "dn", "rn", "fn", "cn", "tn"],
    ["pn", "pn", "pn", "pn", "pn", "pn", "pn", "pn"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["pb", "pb", "pb", "pb", "pb", "pb", "pb", "pb"],
    ["tb", "cb", "fb", "db", "rb", "fb", "cb", "tb"]
];

export const PIECE_NAMES = {
    't': 'Tour',
    'c': 'Cavalier',
    'f': 'Fou',
    'd': 'Dame',
    'r': 'Roi',
    'p': 'Pion'
};

export const PIECE_SYMBOLS = {
    't': 'T',
    'c': 'C',
    'f': 'F',
    'd': 'D',
    'r': 'R',
    'p': ''
};

export const PIECE_SVGS = {
    p: (color) => `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="${color === 'b' ? '#FFFFFF' : '#1E293B'}" stroke="${color === 'b' ? '#1E293B' : '#FFFFFF'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-.83.62-1.41 1.61-1.41 2.72v3.75h11v-3.75c0-1.11-.58-2.1-1.41-2.72 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"/><path d="M22.5 30c2.76 0 5 2.24 5 5H17.5c0-2.76 2.24-5 5-5z"/></g></svg>`,
    t: (color) => `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="${color === 'b' ? '#FFFFFF' : '#1E293B'}" stroke="${color === 'b' ? '#1E293B' : '#FFFFFF'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zm3-3h21v-4H12v4zm2.25-4h16.5l1.25-17H13l1.25 17zM12 9v4h4V9h-4zm7 0v4h3V9h-3zm6 0v4h3V9h-3zm6 0v4h4V9h-4zM11.5 13h22v-4h-22v4z"/><path d="M14 29.5h17v-13H14v13z" fill="${color === 'b' ? '#F1F5F9' : '#1E293B'}" stroke="none"/></g></svg>`,
    c: (color) => `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="${color === 'b' ? '#FFFFFF' : '#1E293B'}" stroke="${color === 'b' ? '#1E293B' : '#FFFFFF'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 22,10 C 22,10 19,11 16,15 C 13,19 13,23 13,23 C 13,23 14,20 18,20 C 18,20 17,21 15,24 C 13,27 13,31 15,31 C 15,31 15,29 18,28 C 18,28 17,29 17,31 C 17,33 19,36 24,36 C 29,36 29,33 29,31 C 29,30 30,32 32,32 C 34,32 35,30 35,28 C 35,26 33,23 31,21 C 29,19 26,13 22,10 z"/><path d="M 9,39 L 36,39 C 36,39 38.5,39 38.5,36.5 C 38.5,34 36,34 36,34 L 9,34 C 9,34 6.5,34 6.5,36.5 C 6.5,39 9,39 9,39 z"/><path d="M 33,28.5 C 33,28.5 35,29.5 36,27 C 37,24.5 35.5,24 35.5,24 C 35.5,24 37,22.5 35.5,20.5 C 34,18.5 32,19.6 32,19.6 C 32,19.6 32.5,16.5 30,15.5 C 27.5,14.5 25.5,16.5 25.5,16.5 C 25.5,16.5 25,12 21.5,12 C 18,12 18,14.5 18,14.5 C 18,14.5 15.5,14 14,16 C 12.5,18 13.5,20.5 13.5,20.5 C 13.5,20.5 11,22 11,25 C 11,28 13.5,29 13.5,29 C 13.5,29 11.5,31 13.5,33 C 15.5,35 18,34.5 18,34.5 C 18,34.5 22,38.5 28,38.5 C 34,38.5 35.5,34 35.5,34 C 35.5,34 38,34 38,31.5 C 38,29 35.5,29.5 33,28.5 z"/><path d="M 11.5,30 C 15,29 18,29 18,29" fill="none" stroke="${color === 'b' ? '#1E293B' : '#FFFFFF'}"/><path d="M 11.5,30 C 11.5,30 12,28 15,28 C 18,28 18.5,30 18.5,30 C 18.5,30 19,28 22,28 C 25,28 25.5,30 25.5,30 C 25.5,30 26,28 29,28 C 32,28 32.5,30 32.5,30" fill="none" stroke="${color === 'b' ? '#1E293B' : '#FFFFFF'}"/><circle cx="20" cy="23" r="1.5" fill="${color === 'b' ? '#000000' : '#FFFFFF'}" stroke="none"/></g></svg>`,
    f: (color) => `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="${color === 'b' ? '#FFFFFF' : '#1E293B'}" stroke="${color === 'b' ? '#1E293B' : '#FFFFFF'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,36 C 9,36 22.5,37 22.5,37 C 22.5,37 36,36 36,36 C 36,36 37.5,39 37.5,39 C 37.5,39 7.5,39 7.5,39 C 7.5,39 9,36 9,36 z"/><path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 32.5,29.5 32.5,18 22.5,13 C 12.5,18 12.5,29.5 15,32 z"/><path d="M 17,16.5 L 28,16.5" fill="none" stroke="${color === 'b' ? '#1E293B' : '#FFFFFF'}"/><path d="M 22.5,14 L 22.5,22" fill="none" stroke="${color === 'b' ? '#1E293B' : '#FFFFFF'}"/><circle cx="22.5" cy="12" r="1.5" fill="${color === 'b' ? '#FFFFFF' : '#1E293B'}" stroke="${color === 'b' ? '#1E293B' : '#FFFFFF'}"/></g></svg>`,
    d: (color) => `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="${color === 'b' ? '#FFFFFF' : '#1E293B'}" stroke="${color === 'b' ? '#1E293B' : '#FFFFFF'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,26 C 17.5,24.5 27.5,24.5 36,26 L 38,14 L 31,26 L 22.5,14 L 14,26 L 7,14 L 9,26 z"/><path d="M 9,36 C 9,36 22.5,37 22.5,37 C 22.5,37 36,36 36,36 C 36,36 37.5,39 37.5,39 C 37.5,39 7.5,39 7.5,39 C 7.5,39 9,36 9,36 z"/><path d="M 11.5,30 C 15,29 30,29 33.5,30 L 33.5,34 L 11.5,34 L 11.5,30 z"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="8" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/></g></svg>`,
    r: (color) => `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="${color === 'b' ? '#FFFFFF' : '#1E293B'}" stroke="${color === 'b' ? '#1E293B' : '#FFFFFF'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 8.5,14 C 11.5,13.5 33.5,13.5 36.5,14 L 38,28 L 7,28 L 8.5,14 z"/><path d="M 9,36 C 9,36 22.5,37 22.5,37 C 22.5,37 36,36 36,36 C 36,36 37.5,39 37.5,39 C 37.5,39 7.5,39 7.5,39 C 7.5,39 9,36 9,36 z"/><path d="M 11.5,30 C 15,29 30,29 33.5,30 L 33.5,34 L 11.5,34 L 11.5,30 z"/><path d="M 22.5,9 C 22.5,9 25,12 25,14 C 25,16 22.5,17 22.5,17 C 22.5,17 20,16 20,14 C 20,12 22.5,9 22.5,9 z"/><path d="M 22.5,6 L 22.5,12" fill="none" stroke="${color === 'b' ? '#1E293B' : '#FFFFFF'}"/><path d="M 19.5,9 L 25.5,9" fill="none" stroke="${color === 'b' ? '#1E293B' : '#FFFFFF'}"/></g></svg>`
};
