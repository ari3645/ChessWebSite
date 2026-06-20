import { Board } from './board.js';
import { ROWS, COLS } from './constants.js';

const PIECE_VALUES = {
    'p': 100,
    'c': 320,
    'f': 330,
    't': 500,
    'd': 900,
    'r': 20000
};

// Piece-Square Tables (PST) from White ('b') perspective
const PST = {
    p: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5,  5, 10, 25, 25, 10,  5,  5],
        [0,  0,  0, 20, 20,  0,  0,  0],
        [5, -5,-10,  0,  0,-10, -5,  5],
        [5, 10, 10,-20,-20, 10, 10,  5],
        [0,  0,  0,  0,  0,  0,  0,  0]
    ],
    c: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    f: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    t: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [0,  0,  0,  5,  5,  0,  0,  0]
    ],
    d: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [-5,  0,  5,  5,  5,  5,  0, -5],
        [0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  5,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    r: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [20, 20,  0,  0,  0,  0, 20, 20],
        [20, 30, 10,  0,  0, 10, 30, 20]
    ]
};

// --- CONFIGURATION INDEXEDDB ---
const DB_NAME = "ChessAI_DB";
const DB_VERSION = 1;
const STORE_NAME = "opening_book";

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = function (e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "signature" });
            }
        };
        request.onsuccess = function (e) {
            resolve(e.target.result);
        };
        request.onerror = function (e) {
            reject(e.target.error);
        };
    });
}

function getRecord(db, signature) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(signature);
        request.onsuccess = function (e) {
            resolve(e.target.result || null);
        };
        request.onerror = function (e) {
            reject(e.target.error);
        };
    });
}

function putRecord(db, record) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(record);
        request.onsuccess = function () {
            resolve();
        };
        request.onerror = function (e) {
            reject(e.target.error);
        };
    });
}

// Helper helper for center control
function attacksCenter(r, c, type, color, board) {
    if (type === 'p') {
        const attackRow = color === 'b' ? r - 1 : r + 1;
        if (attackRow === 3 || attackRow === 4) {
            if (c - 1 === 3 || c - 1 === 4 || c + 1 === 3 || c + 1 === 4) return true;
        }
        return false;
    }
    if (type === 'c') {
        for (const cr of [3, 4]) {
            for (const cc of [3, 4]) {
                if (Math.abs(r - cr) * Math.abs(c - cc) === 2) return true;
            }
        }
        return false;
    }
    if (type === 'f') {
        for (const cr of [3, 4]) {
            for (const cc of [3, 4]) {
                if (Math.abs(r - cr) === Math.abs(c - cc)) {
                    if (board.checkDiagonalMove({r, c}, {r: cr, c: cc})) return true;
                }
            }
        }
        return false;
    }
    return false;
}

// Evaluate the board position from the perspective of 'b' (white) vs 'n' (black)
function evaluateBoard(board, depth = 0, style = 'standard') {
    let score = 0;
    
    // Check game over states
    if (board.isInCheck('b') && board.isCheckmate('b')) return -99999 - depth;
    if (board.isInCheck('n') && board.isCheckmate('n')) return 99999 + depth;
    if (board.isStalemate('b') || board.isStalemate('n')) return 0;
    if (board.isInsufficientMaterial() || board.isFiftyMoveRule() || board.isThreefoldRepetition()) return 0;

    let whiteKing = null;
    let blackKing = null;
    let whiteQueenPos = null;
    let blackQueenPos = null;
    let whiteMaterial = 0;
    let blackMaterial = 0;
    
    let whiteBishops = 0;
    let blackBishops = 0;
    
    // Arrays to store piece positions for advanced evaluations
    const whiteBishopPositions = [];
    const blackBishopPositions = [];
    const whiteKnightPositions = [];
    const blackKnightPositions = [];
    const whiteRookPositions = [];
    const blackRookPositions = [];
    
    // Pour détecter les structures de pions
    const whitePawnCols = Array(8).fill(0);
    const blackPawnCols = Array(8).fill(0);
    const whitePawns = [];
    const blackPawns = [];
    
    // Listes de pièces majeures pour la proximité / le tropisme du Roi
    const whiteMajorPieces = [];
    const blackMajorPieces = [];

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const piece = board.grid[r][c];
            if (piece !== "") {
                const type = piece[0];
                const color = piece[1];
                let val = PIECE_VALUES[type] || 0;
                
                if (type === 'r') {
                    if (color === 'b') whiteKing = { r, c };
                    else blackKing = { r, c };
                } else {
                    if (color === 'b') {
                        whiteMaterial += val;
                        if (type === 'd') {
                            whiteQueenPos = { r, c };
                        }
                        if (type === 'f') {
                            whiteBishops++;
                            whiteBishopPositions.push({ r, c });
                        }
                        if (type === 'c') {
                            whiteKnightPositions.push({ r, c });
                            // Knights on the rim penalty
                            if (c === 0 || c === 7) score -= 15;
                        }
                        if (type === 't') {
                            whiteRookPositions.push({ r, c });
                        }
                        if (type === 'p') {
                            whitePawnCols[c]++;
                            whitePawns.push({ r, c });
                        } else {
                            whiteMajorPieces.push({ r, c, type });
                        }
                    } else {
                        blackMaterial += val;
                        if (type === 'd') {
                            blackQueenPos = { r, c };
                        }
                        if (type === 'f') {
                            blackBishops++;
                            blackBishopPositions.push({ r, c });
                        }
                        if (type === 'c') {
                            blackKnightPositions.push({ r, c });
                            // Knights on the rim penalty
                            if (c === 0 || c === 7) score += 15;
                        }
                        if (type === 't') {
                            blackRookPositions.push({ r, c });
                        }
                        if (type === 'p') {
                            blackPawnCols[c]++;
                            blackPawns.push({ r, c });
                        } else {
                            blackMajorPieces.push({ r, c, type });
                        }
                    }
                }
                
                // Add PST bonuses
                const pstArray = PST[type];
                if (pstArray) {
                    const rowIdx = color === 'b' ? r : 7 - r;
                    val += pstArray[rowIdx][c];
                }
                
                // Center control (pawns, knights, bishops)
                if (type === 'p' || type === 'c' || type === 'f') {
                    if (attacksCenter(r, c, type, color, board)) {
                        if (color === 'b') score += 5;
                        else score -= 5;
                    }
                }

                // Defended by Pawn support (non-pawn, non-king pieces)
                if (type !== 'p' && type !== 'r') {
                    let isDefendedByPawn = false;
                    if (color === 'b') {
                        if (r + 1 < 8) {
                            if ((c - 1 >= 0 && board.grid[r + 1][c - 1] === 'pb') || 
                                (c + 1 < 8 && board.grid[r + 1][c + 1] === 'pb')) {
                                isDefendedByPawn = true;
                            }
                        }
                    } else {
                        if (r - 1 >= 0) {
                            if ((c - 1 >= 0 && board.grid[r - 1][c - 1] === 'pn') || 
                                (c + 1 < 8 && board.grid[r - 1][c + 1] === 'pn')) {
                                isDefendedByPawn = true;
                            }
                        }
                    }
                    if (isDefendedByPawn) {
                        if (color === 'b') score += 10;
                        else score -= 10;
                    }
                }
                
                if (color === 'b') {
                    score += val;
                } else {
                    score -= val;
                }
            }
        }
    }

    // Pawn Center Duo
    if (board.grid[4][3] === 'pb' && board.grid[4][4] === 'pb') score += 20;
    if (board.grid[3][3] === 'pn' && board.grid[3][4] === 'pn') score -= 20;

    // 1. Bonus de la paire de Fous (Bishop Pair Bonus)
    if (whiteBishops >= 2) score += 30;
    if (blackBishops >= 2) score -= 30;

    // 2. Structure de pions (doublés, isolés, passés, connectés)
    // --- Pions Blancs ---
    for (const pawn of whitePawns) {
        const c = pawn.c;
        const r = pawn.r;
        
        // Pions doublés
        if (whitePawnCols[c] > 1) {
            score -= 15;
        }
        
        // Pions isolés
        const hasLeftPawn = c > 0 && whitePawnCols[c - 1] > 0;
        const hasRightPawn = c < 7 && whitePawnCols[c + 1] > 0;
        if (!hasLeftPawn && !hasRightPawn) {
            score -= 15;
        }
        
        // Pions connectés / protégés
        let isConnected = false;
        if (c > 0) {
            if (board.grid[r][c - 1] === 'pb' || (r + 1 < 8 && board.grid[r + 1][c - 1] === 'pb')) isConnected = true;
        }
        if (c < 7) {
            if (board.grid[r][c + 1] === 'pb' || (r + 1 < 8 && board.grid[r + 1][c + 1] === 'pb')) isConnected = true;
        }
        if (isConnected) {
            score += 5;
        }

        // Pions passés
        let isPassed = true;
        for (let nextR = r - 1; nextR >= 0; nextR--) {
            if (board.grid[nextR][c] === 'pn') { isPassed = false; break; }
            if (c > 0 && board.grid[nextR][c - 1] === 'pn') { isPassed = false; break; }
            if (c < 7 && board.grid[nextR][c + 1] === 'pn') { isPassed = false; break; }
        }
        if (isPassed) {
            let passVal = (7 - r) * 10;
            if (r - 1 >= 0 && board.grid[r - 1][c] !== "") {
                passVal -= 15;
            }
            score += passVal;
            
            // Rule: Rook behind passed pawn (Tarrasch rule)
            let rookBehind = false;
            for (let checkR = r + 1; checkR < 8; checkR++) {
                if (board.grid[checkR][c] === 'tb') { rookBehind = true; break; }
                if (board.grid[checkR][c] !== "") break; // Blocked by another piece
            }
            if (rookBehind) score += 20;
        }

        // Pawn forks
        let pawnForkTargets = 0;
        for (const dc of [-1, 1]) {
            const nr = r - 1;
            const nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const targetPiece = board.grid[nr][nc];
                if (targetPiece !== "" && targetPiece[1] === 'n') {
                    const targetType = targetPiece[0];
                    if (['c', 'f', 't', 'd', 'r'].includes(targetType)) {
                        pawnForkTargets++;
                    }
                }
            }
        }
        if (pawnForkTargets >= 2) score += 50;

        // Pawn Storm (Aggressive style only)
        if (style === 'aggressive' && blackKing) {
            if (blackKing.c >= 5 && c >= 5) {
                if (r <= 4) score += (5 - r) * 15;
            } else if (blackKing.c <= 2 && c <= 2) {
                if (r <= 4) score += (5 - r) * 15;
            }
        }
    }

    // --- Pions Noirs ---
    for (const pawn of blackPawns) {
        const c = pawn.c;
        const r = pawn.r;
        
        // Pions doublés
        if (blackPawnCols[c] > 1) {
            score += 15;
        }
        
        // Pions isolés
        const hasLeftPawn = c > 0 && blackPawnCols[c - 1] > 0;
        const hasRightPawn = c < 7 && blackPawnCols[c + 1] > 0;
        if (!hasLeftPawn && !hasRightPawn) {
            score += 15;
        }
        
        // Pions connectés
        let isConnected = false;
        if (c > 0) {
            if (board.grid[r][c - 1] === 'pn' || (r - 1 >= 0 && board.grid[r - 1][c - 1] === 'pn')) isConnected = true;
        }
        if (c < 7) {
            if (board.grid[r][c + 1] === 'pn' || (r - 1 >= 0 && board.grid[r - 1][c + 1] === 'pn')) isConnected = true;
        }
        if (isConnected) {
            score -= 5;
        }

        // Pions passés
        let isPassed = true;
        for (let nextR = r + 1; nextR < 8; nextR++) {
            if (board.grid[nextR][c] === 'pb') { isPassed = false; break; }
            if (c > 0 && board.grid[nextR][c - 1] === 'pb') { isPassed = false; break; }
            if (c < 7 && board.grid[nextR][c + 1] === 'pb') { isPassed = false; break; }
        }
        if (isPassed) {
            let passVal = r * 10;
            if (r + 1 < 8 && board.grid[r + 1][c] !== "") {
                passVal -= 15;
            }
            score -= passVal;

            // Rule: Rook behind passed pawn (Tarrasch rule)
            let rookBehind = false;
            for (let checkR = r - 1; checkR >= 0; checkR--) {
                if (board.grid[checkR][c] === 'tn') { rookBehind = true; break; }
                if (board.grid[checkR][c] !== "") break;
            }
            if (rookBehind) score -= 20;
        }

        // Pawn forks
        let pawnForkTargets = 0;
        for (const dc of [-1, 1]) {
            const nr = r + 1;
            const nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const targetPiece = board.grid[nr][nc];
                if (targetPiece !== "" && targetPiece[1] === 'b') {
                    const targetType = targetPiece[0];
                    if (['c', 'f', 't', 'd', 'r'].includes(targetType)) {
                        pawnForkTargets++;
                    }
                }
            }
        }
        if (pawnForkTargets >= 2) score -= 50;

        // Pawn Storm (Aggressive style only)
        if (style === 'aggressive' && whiteKing) {
            if (whiteKing.c >= 5 && c >= 5) {
                if (r >= 3) score -= (r - 2) * 15;
            } else if (whiteKing.c <= 2 && c <= 2) {
                if (r >= 3) score -= (r - 2) * 15;
            }
        }
    }

    // 3. Tours sur colonnes ouvertes / semi-ouvertes
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const piece = board.grid[r][c];
            if (piece === 'tb') { // Tour Blanche
                const hasFriendlyPawn = whitePawnCols[c] > 0;
                const hasEnemyPawn = blackPawnCols[c] > 0;
                if (!hasFriendlyPawn) {
                    score += !hasEnemyPawn ? 25 : 15;
                }
            } else if (piece === 'tn') { // Tour Noire
                const hasFriendlyPawn = blackPawnCols[c] > 0;
                const hasEnemyPawn = whitePawnCols[c] > 0;
                if (!hasFriendlyPawn) {
                    score -= !hasEnemyPawn ? 25 : 15;
                }
            }
        }
    }

    // Calculate non-pawn material to identify endgame
    const whiteNonPawnMaterial = whiteMaterial - (whitePawns.length * 100);
    const blackNonPawnMaterial = blackMaterial - (blackPawns.length * 100);
    const isEndgame = (whiteNonPawnMaterial + blackNonPawnMaterial) <= 1500;

    // Undeveloped Minor Pieces Penalty (Opening & Middlegame)
    if (!isEndgame) {
        let whiteUndeveloped = 0;
        if (board.grid[7][1] === 'cb') { score -= 15; whiteUndeveloped++; }
        if (board.grid[7][6] === 'cb') { score -= 15; whiteUndeveloped++; }
        if (board.grid[7][2] === 'fb') { score -= 15; whiteUndeveloped++; }
        if (board.grid[7][5] === 'fb') { score -= 15; whiteUndeveloped++; }

        let blackUndeveloped = 0;
        if (board.grid[0][1] === 'cn') { score += 15; blackUndeveloped++; }
        if (board.grid[0][6] === 'cn') { score += 15; blackUndeveloped++; }
        if (board.grid[0][2] === 'fn') { score += 15; blackUndeveloped++; }
        if (board.grid[0][5] === 'fn') { score += 15; blackUndeveloped++; }

        // Queen early development penalty
        if (whiteQueenPos && (whiteQueenPos.r !== 7 || whiteQueenPos.c !== 3) && whiteUndeveloped >= 2) {
            score -= 20;
        }
        if (blackQueenPos && (blackQueenPos.r !== 0 || blackQueenPos.c !== 3) && blackUndeveloped >= 2) {
            score += 20;
        }
    }

    // Knight forks
    const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const kp of whiteKnightPositions) {
        let targets = 0;
        for (const [dr, dc] of knightMoves) {
            const nr = kp.r + dr;
            const nc = kp.c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const targetPiece = board.grid[nr][nc];
                if (targetPiece !== "" && targetPiece[1] === 'n') {
                    if (['t', 'd', 'r', 'f', 'c'].includes(targetPiece[0])) {
                        targets++;
                    }
                }
            }
        }
        if (targets >= 2) score += 40;
    }
    for (const kp of blackKnightPositions) {
        let targets = 0;
        for (const [dr, dc] of knightMoves) {
            const nr = kp.r + dr;
            const nc = kp.c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const targetPiece = board.grid[nr][nc];
                if (targetPiece !== "" && targetPiece[1] === 'b') {
                    if (['t', 'd', 'r', 'f', 'c'].includes(targetPiece[0])) {
                        targets++;
                    }
                }
            }
        }
        if (targets >= 2) score -= 40;
    }

    // Knight Outposts
    for (const kp of whiteKnightPositions) {
        const r = kp.r;
        const c = kp.c;
        if (r >= 2 && r <= 4) {
            let defendedByPawn = false;
            if (r + 1 < 8) {
                if (c - 1 >= 0 && board.grid[r + 1][c - 1] === 'pb') defendedByPawn = true;
                if (c + 1 < 8 && board.grid[r + 1][c + 1] === 'pb') defendedByPawn = true;
            }
            if (defendedByPawn) {
                let canBeAttacked = false;
                for (const col of [c - 1, c + 1]) {
                    if (col >= 0 && col < 8) {
                        for (let row = 0; row < r; row++) {
                            if (board.grid[row][col] === 'pn') {
                                canBeAttacked = true;
                                break;
                            }
                        }
                    }
                    if (canBeAttacked) break;
                }
                if (!canBeAttacked) {
                    score += 30;
                }
            }
        }
    }
    for (const kp of blackKnightPositions) {
        const r = kp.r;
        const c = kp.c;
        if (r >= 3 && r <= 5) {
            let defendedByPawn = false;
            if (r - 1 >= 0) {
                if (c - 1 >= 0 && board.grid[r - 1][c - 1] === 'pn') defendedByPawn = true;
                if (c + 1 < 8 && board.grid[r - 1][c + 1] === 'pn') defendedByPawn = true;
            }
            if (defendedByPawn) {
                let canBeAttacked = false;
                for (const col of [c - 1, c + 1]) {
                    if (col >= 0 && col < 8) {
                        for (let row = r + 1; row < 8; row++) {
                            if (board.grid[row][col] === 'pb') {
                                canBeAttacked = true;
                                break;
                            }
                        }
                    }
                    if (canBeAttacked) break;
                }
                if (!canBeAttacked) {
                    score -= 30;
                }
            }
        }
    }

    // Rooks on 7th/2nd rank
    for (const rp of whiteRookPositions) {
        if (rp.r === 1) {
            if (blackKing && blackKing.r === 0) {
                score += 40;
            } else {
                score += 25;
            }
        }
    }
    for (const rp of blackRookPositions) {
        if (rp.r === 6) {
            if (whiteKing && whiteKing.r === 7) {
                score -= 40;
            } else {
                score -= 25;
            }
        }
    }

    // Connected Rooks Check
    // White Rooks
    if (whiteRookPositions.length >= 2) {
        let connected = false;
        for (let i = 0; i < whiteRookPositions.length; i++) {
            for (let j = i + 1; j < whiteRookPositions.length; j++) {
                const r1 = whiteRookPositions[i];
                const r2 = whiteRookPositions[j];
                if (r1.r === r2.r) {
                    const startC = Math.min(r1.c, r2.c);
                    const endC = Math.max(r1.c, r2.c);
                    let clear = true;
                    for (let checkC = startC + 1; checkC < endC; checkC++) {
                        if (board.grid[r1.r][checkC] !== "") { clear = false; break; }
                    }
                    if (clear) { connected = true; break; }
                } else if (r1.c === r2.c) {
                    const startR = Math.min(r1.r, r2.r);
                    const endR = Math.max(r1.r, r2.r);
                    let clear = true;
                    for (let checkR = startR + 1; checkR < endR; checkR++) {
                        if (board.grid[checkR][r1.c] !== "") { clear = false; break; }
                    }
                    if (clear) { connected = true; break; }
                }
            }
            if (connected) break;
        }
        if (connected) score += 15;
    }
    // Black Rooks
    if (blackRookPositions.length >= 2) {
        let connected = false;
        for (let i = 0; i < blackRookPositions.length; i++) {
            for (let j = i + 1; j < blackRookPositions.length; j++) {
                const r1 = blackRookPositions[i];
                const r2 = blackRookPositions[j];
                if (r1.r === r2.r) {
                    const startC = Math.min(r1.c, r2.c);
                    const endC = Math.max(r1.c, r2.c);
                    let clear = true;
                    for (let checkC = startC + 1; checkC < endC; checkC++) {
                        if (board.grid[r1.r][checkC] !== "") { clear = false; break; }
                    }
                    if (clear) { connected = true; break; }
                } else if (r1.c === r2.c) {
                    const startR = Math.min(r1.r, r2.r);
                    const endR = Math.max(r1.r, r2.r);
                    let clear = true;
                    for (let checkR = startR + 1; checkR < endR; checkR++) {
                        if (board.grid[checkR][r1.c] !== "") { clear = false; break; }
                    }
                    if (clear) { connected = true; break; }
                }
            }
            if (connected) break;
        }
        if (connected) score -= 15;
    }

    // Bad Bishops Penalty
    for (const bPos of whiteBishopPositions) {
        const bishopColor = (bPos.r + bPos.c) % 2;
        let sameColorPawns = 0;
        for (const p of whitePawns) {
            if ((p.r + p.c) % 2 === bishopColor) {
                sameColorPawns++;
            }
        }
        if (sameColorPawns >= 4) {
            score -= (sameColorPawns - 3) * 8;
        }
    }
    for (const bPos of blackBishopPositions) {
        const bishopColor = (bPos.r + bPos.c) % 2;
        let sameColorPawns = 0;
        for (const p of blackPawns) {
            if ((p.r + p.c) % 2 === bishopColor) {
                sameColorPawns++;
            }
        }
        if (sameColorPawns >= 4) {
            score += (sameColorPawns - 3) * 8;
        }
    }

    // 4. Sécurité des Rois (Roque, Tropisme, Bouclier de pions, Centralisation en fin de partie)
    if (whiteKing && blackKing) {
        const materialDiff = whiteMaterial - blackMaterial;

        if (isEndgame) {
            // Fin de partie : Les Rois doivent être actifs au centre ou faire du mop-up
            if (materialDiff > 200) {
                // Les Blancs gagnent, on pousse le Roi Noir dans le coin et on rapproche le Roi Blanc
                const blackKingDistFromCenter = Math.abs(blackKing.r - 3.5) + Math.abs(blackKing.c - 3.5);
                score += blackKingDistFromCenter * 10;
                
                const kingDist = Math.max(Math.abs(whiteKing.r - blackKing.r), Math.abs(whiteKing.c - blackKing.c));
                score += (14 - kingDist) * 5;
            } else if (materialDiff < -200) {
                // Les Noirs gagnent, on pousse le Roi Blanc dans le coin et on rapproche le Roi Noir
                const whiteKingDistFromCenter = Math.abs(whiteKing.r - 3.5) + Math.abs(whiteKing.c - 3.5);
                score -= whiteKingDistFromCenter * 10;
                
                const kingDist = Math.max(Math.abs(whiteKing.r - blackKing.r), Math.abs(whiteKing.c - blackKing.c));
                score -= (14 - kingDist) * 5;
            } else {
                // Fin de partie équilibrée : On centralise les deux Rois
                const whiteKingDist = Math.abs(whiteKing.r - 3.5) + Math.abs(whiteKing.c - 3.5);
                const blackKingDist = Math.abs(blackKing.r - 3.5) + Math.abs(blackKing.c - 3.5);
                score -= whiteKingDist * 10;
                score += blackKingDist * 10;
            }
        } else {
            // Milieu de partie : Sécurité et Roque
            
            // --- ROI BLANC ---
            const isWhiteCastled = whiteKing.r === 7 && (whiteKing.c === 6 || whiteKing.c === 2);
            if (isWhiteCastled) {
                score += 40;
                // Bouclier de pions
                const r = whiteKing.r;
                const c = whiteKing.c;
                // Ligne r-1 (juste devant)
                for (let dc = -1; dc <= 1; dc++) {
                    const nc = c + dc;
                    if (nc >= 0 && nc < 8 && board.grid[r - 1][nc] === 'pb') {
                        score += style === 'defensive' ? 20 : 10;
                    }
                }
                // Ligne r-2 (deux crans devant)
                if (r - 2 >= 0) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nc = c + dc;
                        if (nc >= 0 && nc < 8 && board.grid[r - 2][nc] === 'pb') {
                            score += style === 'defensive' ? 10 : 5;
                        }
                    }
                }
            } else {
                // Pas encore roqué
                const hasKingMoved = board.movedStatus["7,4"];
                if (!hasKingMoved) {
                    const canCastleKing = !board.movedStatus["7,7"];
                    const canCastleQueen = !board.movedStatus["7,0"];
                    if (canCastleKing || canCastleQueen) {
                        score += 15; // Bonus pour avoir les droits de roquer
                    } else {
                        score -= 25; // Pénalité si droits perdus
                    }
                } else {
                    score -= 25; // Pénalité si roi a bougé
                }
                
                // Bouclier de pions partiel si le Roi est sur sa rangée de départ
                if (whiteKing.r === 7) {
                    const c = whiteKing.c;
                    for (let dc = -1; dc <= 1; dc++) {
                        const nc = c + dc;
                        if (nc >= 0 && nc < 8 && board.grid[6][nc] === 'pb') {
                            score += 8;
                        }
                    }
                }
            }

            // White King Open/Semi-open Files Penalty (King exposed near open files)
            if (whiteKing && (isWhiteCastled || whiteKing.r === 7)) {
                const c = whiteKing.c;
                for (let dc = -1; dc <= 1; dc++) {
                    const col = c + dc;
                    if (col >= 0 && col < 8) {
                        if (whitePawnCols[col] === 0) {
                            if (blackPawnCols[col] === 0) {
                                score -= 25; // Open file next to King
                            } else {
                                score -= 15; // Semi-open file next to King
                            }
                        }
                    }
                }
            }
        }

        // --- ROI NOIR ---
            const isBlackCastled = blackKing.r === 0 && (blackKing.c === 6 || blackKing.c === 2);
            if (isBlackCastled) {
                score -= 40;
                // Bouclier de pions
                const r = blackKing.r;
                const c = blackKing.c;
                // Ligne r+1 (juste devant)
                for (let dc = -1; dc <= 1; dc++) {
                    const nc = c + dc;
                    if (nc >= 0 && nc < 8 && board.grid[r + 1][nc] === 'pn') {
                        score -= style === 'defensive' ? 20 : 10;
                    }
                }
                // Ligne r+2 (deux crans devant)
                if (r + 2 < 8) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nc = c + dc;
                        if (nc >= 0 && nc < 8 && board.grid[r + 2][nc] === 'pn') {
                            score -= style === 'defensive' ? 10 : 5;
                        }
                    }
                }
            } else {
                // Pas encore roqué
                const hasKingMoved = board.movedStatus["0,4"];
                if (!hasKingMoved) {
                    const canCastleKing = !board.movedStatus["0,7"];
                    const canCastleQueen = !board.movedStatus["0,0"];
                    if (canCastleKing || canCastleQueen) {
                        score -= 15;
                    } else {
                        score += 25;
                    }
                } else {
                    score += 25;
                }
                
                // Bouclier de pions partiel si le Roi est sur sa rangée de départ
                if (blackKing.r === 0) {
                    const c = blackKing.c;
                    for (let dc = -1; dc <= 1; dc++) {
                        const nc = c + dc;
                        if (nc >= 0 && nc < 8 && board.grid[1][nc] === 'pn') {
                            score -= 8;
                        }
                    }
                }
            }

            // Black King Open/Semi-open Files Penalty (King exposed near open files)
            if (blackKing && (isBlackCastled || blackKing.r === 0)) {
                const c = blackKing.c;
                for (let dc = -1; dc <= 1; dc++) {
                    const col = c + dc;
                    if (col >= 0 && col < 8) {
                        if (blackPawnCols[col] === 0) {
                            if (whitePawnCols[col] === 0) {
                                score += 25;
                            } else {
                                score += 15;
                            }
                        }
                    }
                }
            }

            // Tropisme / Proximité des pièces ennemies (seulement hors endgame)
            for (const p of blackMajorPieces) {
                const dist = Math.max(Math.abs(p.r - whiteKing.r), Math.abs(p.c - whiteKing.c));
                if (dist <= 3) {
                    const weight = p.type === 'd' ? 12 : 6;
                    score -= (4 - dist) * weight;
                }
            }
            for (const p of whiteMajorPieces) {
                const dist = Math.max(Math.abs(p.r - blackKing.r), Math.abs(p.c - blackKing.c));
                if (dist <= 3) {
                    const weight = p.type === 'd' ? 12 : 6;
                    score += (4 - dist) * weight;
                }
            }
        }
    }

    // Heuristiques de style de jeu (PvE/EvE)
    if (style === 'defensive') {
        if (whiteKing && whiteKing.r < 6) {
            score -= (6 - whiteKing.r) * 25;
        }
        if (blackKing && blackKing.r > 1) {
            score += (blackKing.r - 1) * 25;
        }
    } else if (style === 'aggressive') {
        // 1. Avancement des pièces vers l'avant (hors Rois)
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const piece = board.grid[r][c];
                if (piece !== "" && piece[0] !== 'r') {
                    const color = piece[1];
                    if (color === 'b') {
                        score += (7 - r) * 4;
                        if (blackKing) {
                            const dist = Math.max(Math.abs(r - blackKing.r), Math.abs(c - blackKing.c));
                            if (dist <= 3) score += (4 - dist) * 12;
                        }
                    } else {
                        score -= r * 4;
                        if (whiteKing) {
                            const dist = Math.max(Math.abs(r - whiteKing.r), Math.abs(c - whiteKing.c));
                            if (dist <= 3) score -= (4 - dist) * 12;
                        }
                    }
                }
            }
        }
    }

    return score;
}

function minimax(board, depth, alpha, beta, isMaximizing, style = 'standard') {
    if (depth === 0 || board.isThreefoldRepetition() || board.isFiftyMoveRule() || board.isInsufficientMaterial()) {
        return evaluateBoard(board, depth, style);
    }

    const turn = board.turn;
    const pieces = [];

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const piece = board.grid[r][c];
            if (piece !== "" && piece[1] === turn) {
                pieces.push({ r, c });
            }
        }
    }

    const moves = [];
    for (const p of pieces) {
        const validEnds = board.getValidMoves(p);
        for (const end of validEnds) {
            moves.push({ start: p, end });
        }
    }

    if (moves.length === 0) {
        return evaluateBoard(board, depth, style);
    }

    // Tri des coups pour optimiser l'élagage alpha-beta (captures d'abord)
    moves.sort((a, b) => {
        const aCap = board.grid[a.end.r][a.end.c] !== "" ? 1 : 0;
        const bCap = board.grid[b.end.r][b.end.c] !== "" ? 1 : 0;
        return bCap - aCap;
    });

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const nextBoard = board.clone();
            nextBoard.movePiece(move.start, move.end);
            const evaluation = minimax(nextBoard, depth - 1, alpha, beta, false, style);
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) {
                break;
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const nextBoard = board.clone();
            nextBoard.movePiece(move.start, move.end);
            const evaluation = minimax(nextBoard, depth - 1, alpha, beta, true, style);
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) {
                break;
            }
        }
        return minEval;
    }
}

function findBestMove(board, depth, style, record) {
    const turn = board.turn;
    const isMaximizing = turn === 'b';
    let bestMove = null;
    let bestValue = isMaximizing ? -Infinity : Infinity;

    const pieces = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const piece = board.grid[r][c];
            if (piece !== "" && piece[1] === turn) {
                pieces.push({ r, c });
            }
        }
    }

    const moves = [];
    for (const p of pieces) {
        const validEnds = board.getValidMoves(p);
        for (const end of validEnds) {
            moves.push({ start: p, end });
        }
    }

    if (moves.length === 0) {
        return { bestMove: null, bestValue: evaluateBoard(board, depth, style) };
    }

    moves.sort((a, b) => {
        const aCap = board.grid[a.end.r][a.end.c] !== "" ? 1 : 0;
        const bCap = board.grid[b.end.r][b.end.c] !== "" ? 1 : 0;
        return bCap - aCap;
    });

    for (const move of moves) {
        const nextBoard = board.clone();
        nextBoard.movePiece(move.start, move.end);
        
        // Ajouter un petit bruit aléatoire (de -6 à +6 centipions) pour introduire de la variété
        // dans les ouvertures et éviter que l'IA ne joue toujours la même partie.
        const noise = (Math.random() - 0.5) * 12;

        // Intégrer les Q-values apprises sous forme de bonus/malus à l'évaluation minimax brute.
        const moveKey = `${move.start.r},${move.start.c}-${move.end.r},${move.end.c}`;
        let qBonus = 0;
        if (record && record.moves && record.moves[moveKey]) {
            // Un Q-value de +1.0 vaut +150 centipions de bonus.
            // Un Q-value de -1.0 vaut -150 centipions de malus.
            qBonus = record.moves[moveKey].q * 150;
        }

        let val = minimax(nextBoard, depth - 1, -Infinity, Infinity, !isMaximizing, style) + noise;
        if (isMaximizing) {
            val += qBonus;
        } else {
            val -= qBonus;
        }
        
        if (isMaximizing) {
            if (val > bestValue) {
                bestValue = val;
                bestMove = move;
            }
        } else {
            if (val < bestValue) {
                bestValue = val;
                bestMove = move;
            }
        }
    }

    return { bestMove, bestValue };
}

// --- REINFORCEMENT LEARNING : Q-LEARNING SUR L'OUVERTURE ---
async function learnFromGame(gameHistory, result) {
    try {
        const db = await openDB();
        const learningRate = 0.2;
        const discountFactor = 0.9;
        
        // On apprend uniquement sur l'ouverture / milieu de jeu précoce (les 24 premiers plis / 12 coups)
        const maxPlies = Math.min(gameHistory.length, 24);

        // Précalculer toutes les tâches pour passer le minimum de temps dans la transaction IndexedDB
        const tasks = [];
        for (let t = 0; t < maxPlies; t++) {
            const historyEntry = gameHistory[t];
            const boardState = historyEntry.boardState;
            const move = { start: historyEntry.start, end: historyEntry.end };
            
            // Recréer le plateau pour obtenir la signature de cette position
            const tempBoard = new Board();
            tempBoard.loadState(boardState);
            const signature = tempBoard.getPositionSignature();
            const moveKey = `${move.start.r},${move.start.c}-${move.end.r},${move.end.c}`;
            
            // Déterminer la récompense pour le joueur dont c'était le tour
            const activeColor = boardState.turn; // 'b' ou 'n'
            let reward = 0;
            if (result === activeColor) {
                reward = 1.0; // Victoire
            } else if (result !== null) {
                reward = -1.0; // Défaite
            } else {
                reward = 0.0; // Match nul
            }
            
            // Appliquer l'escompte temporel (les coups les plus récents sont plus directement responsables)
            const discountedReward = reward * Math.pow(discountFactor, maxPlies - 1 - t);
            tasks.push({ signature, moveKey, discountedReward });
        }

        // Ouvrir une seule transaction pour toutes les lectures et écritures
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        for (const task of tasks) {
            const record = await new Promise((resolve, reject) => {
                const req = store.get(task.signature);
                req.onsuccess = (e) => resolve(e.target.result || null);
                req.onerror = (e) => reject(e.target.error);
            });

            let updatedRecord = record;
            if (!updatedRecord) {
                updatedRecord = {
                    signature: task.signature,
                    moves: {}
                };
            }

            if (!updatedRecord.moves[task.moveKey]) {
                updatedRecord.moves[task.moveKey] = { q: 0.0, count: 0 };
            }

            // Formule de mise à jour Q-learning simple
            const qData = updatedRecord.moves[task.moveKey];
            qData.q = qData.q + learningRate * (task.discountedReward - qData.q);
            qData.count += 1;

            await new Promise((resolve, reject) => {
                const req = store.put(updatedRecord);
                req.onsuccess = () => resolve();
                req.onerror = (e) => reject(e.target.error);
            });
        }

        await new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = (e) => reject(e.target.error);
        });

        console.log(`[IA] L'IA a appris de la partie (${maxPlies} demi-coups enregistrés dans le livre via une transaction unique).`);
    } catch (e) {
        console.error("Erreur lors de l'apprentissage de l'IA :", e);
    }
}

async function runSearch(board, depth, style, useLearning) {
    try {
        let bestMove = null;
        let record = null;
        let bestValue = 0;
        const turn = board.turn;
        const isMaximizing = turn === 'b';
        
        if (useLearning) {
            try {
                const db = await openDB();
                const currentSignature = board.getPositionSignature();
                record = await getRecord(db, currentSignature);
                
                if (record && record.moves) {
                    // Trouver tous nos coups légaux pour s'assurer que le coup appris est toujours valide
                    const validMoves = [];
                    const pieces = [];
                    for (let r = 0; r < ROWS; r++) {
                        for (let c = 0; c < COLS; c++) {
                            const piece = board.grid[r][c];
                            if (piece !== "" && piece[1] === board.turn) {
                                pieces.push({ r, c });
                            }
                        }
                    }
                    
                    for (const p of pieces) {
                        const ends = board.getValidMoves(p);
                        for (const end of ends) {
                            validMoves.push({ start: p, end, key: `${p.r},${p.c}-${end.r},${end.c}` });
                        }
                    }
                    
                    let bestLearnedMove = null;
                    let bestQ = -Infinity;
                    
                    for (const m of validMoves) {
                        const mData = record.moves[m.key];
                        if (mData && mData.q > bestQ) {
                            bestQ = mData.q;
                            bestLearnedMove = m;
                        }
                    }
                    
                    // Si on a un bon coup connu (Q > 0.05) et selon le taux d'exploitation de 85%
                    if (bestLearnedMove && bestQ > 0.05 && Math.random() < 0.85) {
                        console.log(`[IA] Coup joué du livre d'ouvertures (Q-value: ${bestQ.toFixed(2)}): ${bestLearnedMove.key}`);
                        bestMove = { start: bestLearnedMove.start, end: bestLearnedMove.end };
                        bestValue = isMaximizing ? (bestQ * 150) : -(bestQ * 150);
                    }
                }
            } catch (err) {
                console.warn("Livre d'ouvertures inaccessible, repli sur Minimax brute force :", err);
            }
        }
        
        if (!bestMove) {
            const searchResult = findBestMove(board, depth || 3, style, record);
            if (searchResult) {
                bestMove = searchResult.bestMove;
                bestValue = searchResult.bestValue;
            }
        }
        
        self.postMessage({ type: 'searchResult', success: true, bestMove, evaluation: bestValue });
    } catch (error) {
        self.postMessage({ type: 'searchResult', success: false, error: error.message });
    }
}

self.onmessage = async function (e) {
    const { type, boardState, depth, style, useLearning, gameHistory, result } = e.data;
    
    if (type === 'ping') {
        self.postMessage({ type: 'pong' });
        return;
    }
    
    if (type === 'search') {
        try {
            const board = new Board();
            board.loadState(boardState);
            await runSearch(board, depth, style, useLearning);
        } catch (error) {
            self.postMessage({ type: 'searchResult', success: false, error: error.message });
        }
    }
    
    if (type === 'learn') {
        try {
            await learnFromGame(gameHistory, result);
            self.postMessage({ type: 'learnComplete', success: true });
        } catch (error) {
            console.error("Erreur lors du traitement de l'apprentissage :", error);
            self.postMessage({ type: 'learnComplete', success: false, error: error.message });
        }
    }
};
