const ROWS = 8;
const COLS = 8;

const INITIAL_GRID = [
    ["tn", "cn", "fn", "dn", "rn", "fn", "cn", "tn"],
    ["pn", "pn", "pn", "pn", "pn", "pn", "pn", "pn"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["pb", "pb", "pb", "pb", "pb", "pb", "pb", "pb"],
    ["tb", "cb", "fb", "db", "rb", "fb", "cb", "tb"]
];

class Board {
    constructor() {
        this.grid = INITIAL_GRID.map(row => [...row]);
        this.turn = 'b'; // 'b' = Blancs, 'n' = Noirs
        this.movedStatus = {
            "0,0": false, "0,4": false, "0,7": false, // Noirs
            "7,0": false, "7,4": false, "7,7": false  // Blancs
        };
        this.enPassantTarget = null; // Coordonnées {r, c} de la case cible
        this.halfMoveClock = 0;
        this.positionHistory = {};
        
        this.positionHistory[this.getPositionSignature()] = 1;
    }

    clone() {
        const newBoard = new Board();
        newBoard.loadState(this.getState());
        return newBoard;
    }

    getState() {
        return {
            grid: this.grid.map(row => [...row]),
            turn: this.turn,
            movedStatus: { ...this.movedStatus },
            enPassantTarget: this.enPassantTarget ? { ...this.enPassantTarget } : null,
            halfMoveClock: this.halfMoveClock,
            positionHistory: { ...this.positionHistory }
        };
    }

    loadState(state) {
        this.grid = state.grid.map(row => [...row]);
        this.turn = state.turn;
        this.movedStatus = { ...state.movedStatus };
        this.enPassantTarget = state.enPassantTarget ? { ...state.enPassantTarget } : null;
        this.halfMoveClock = state.halfMoveClock;
        this.positionHistory = { ...state.positionHistory };
    }


    getPositionSignature() {
        const boardStr = this.grid.map(row => row.map(p => p === "" ? "." : p).join("")).join("");
        const movedStr = Object.keys(this.movedStatus).sort().map(k => this.movedStatus[k] ? "1" : "0").join("");
        const epStr = this.enPassantTarget ? `${this.enPassantTarget.r},${this.enPassantTarget.c}` : "null";
        return `${boardStr}|${this.turn}|${movedStr}|${epStr}`;
    }

    isThreefoldRepetition() {
        const sig = this.getPositionSignature();
        return (this.positionHistory[sig] || 0) >= 3;
    }

    isInsufficientMaterial() {
        const whitePieces = [];
        const blackPieces = [];

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const p = this.grid[r][c];
                if (p !== "") {
                    if (p[1] === 'b') {
                        whitePieces.push(p[0]);
                    } else {
                        blackPieces.push(p[0]);
                    }
                }
            }
        }

        // Cas Roi contre Roi
        if (whitePieces.length === 1 && blackPieces.length === 1) {
            return true;
        }

        // Roi + Fou ou Roi + Cavalier contre Roi
        if (whitePieces.length <= 2 && blackPieces.length <= 2) {
            const hasWhiteMaterial = whitePieces.some(p => ['p', 't', 'd'].includes(p));
            const hasBlackMaterial = blackPieces.some(p => ['p', 't', 'd'].includes(p));
            if (!hasWhiteMaterial && !hasBlackMaterial) {
                return true;
            }
        }
        return false;
    }

    isFiftyMoveRule() {
        return this.halfMoveClock >= 100;
    }

    isStalemate(color) {
        if (this.isInCheck(color)) {
            return false;
        }

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const piece = this.grid[r][c];
                if (piece !== "" && piece[1] === color) {
                    if (this.getValidMovesInternal({r, c}).length > 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    getPiece(r, c) {
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            return this.grid[r][c];
        }
        return null;
    }

    getValidMoves(pos) {
        const validMoves = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const endPos = {r, c};
                if (this.isValidMove(pos, endPos)) {
                    if (!this.leavesKingInCheck(pos, endPos)) {
                        validMoves.push(endPos);
                    }
                }
            }
        }
        return validMoves;
    }

    leavesKingInCheck(start, end) {
        const piece = this.grid[start.r][start.c];
        const target = this.grid[end.r][end.c];
        const color = piece[1];

        // Simulation du coup
        this.grid[end.r][end.c] = piece;
        this.grid[start.r][start.c] = "";

        const inCheck = this.isInCheck(color);

        // Annulation
        this.grid[start.r][start.c] = piece;
        this.grid[end.r][end.c] = target;

        return inCheck;
    }

    isInCheck(color) {
        // 1. Trouver le roi
        let kingPos = null;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (this.grid[r][c] === `r${color}`) {
                    kingPos = {r, c};
                    break;
                }
            }
            if (kingPos) break;
        }
        if (!kingPos) return false;

        // 2. Vérifier si une pièce adverse l'attaque
        const enemyColor = color === 'b' ? 'n' : 'b';
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const piece = this.grid[r][c];
                if (piece !== "" && piece[1] === enemyColor) {
                    if (this.canAttack({r, c}, kingPos)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isCheckmate(color) {
        if (!this.isInCheck(color)) {
            return false;
        }

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const piece = this.grid[r][c];
                if (piece !== "" && piece[1] === color) {
                    const moves = this.getValidMovesInternal({r, c});
                    if (moves.length > 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    getValidMovesInternal(pos) {
        const moves = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const end = {r, c};
                if (this.isValidMoveInternal(pos, end)) {
                    if (!this.leavesKingInCheck(pos, end)) {
                        moves.push(end);
                    }
                }
            }
        }
        return moves;
    }

    isValidMoveInternal(start, end) {
        const piece = this.getPiece(start.r, start.c);
        const target = this.getPiece(end.r, end.c);

        if (!piece || (start.r === end.r && start.c === end.c)) return false;
        if (target !== "" && target[1] === piece[1]) return false;

        const type = piece[0];
        const color = piece[1];

        if (type === 't') return this.checkLinearMove(start, end);
        if (type === 'f') return this.checkDiagonalMove(start, end);
        if (type === 'd') return this.checkLinearMove(start, end) || this.checkDiagonalMove(start, end);
        if (type === 'c') {
            const dr = Math.abs(start.r - end.r);
            const dc = Math.abs(start.c - end.c);
            return (dr === 1 && dc === 2) || (dr === 2 && dc === 1);
        }
        if (type === 'r') {
            if (Math.abs(start.r - end.r) <= 1 && Math.abs(start.c - end.c) <= 1) return true;
            return this.checkCastling(start, end, color);
        }
        if (type === 'p') return this.checkPawnMove(start, end, color);

        return false;
    }

    canAttack(start, end) {
        const piece = this.grid[start.r][start.c];
        const target = this.grid[end.r][end.c];

        if (target !== "" && target[1] === piece[1]) return false;

        const type = piece[0];
        const color = piece[1];

        if (type === 't') return this.checkLinearMove(start, end);
        if (type === 'f') return this.checkDiagonalMove(start, end);
        if (type === 'd') return this.checkLinearMove(start, end) || this.checkDiagonalMove(start, end);
        if (type === 'c') {
            const dr = Math.abs(start.r - end.r);
            const dc = Math.abs(start.c - end.c);
            return (dr === 1 && dc === 2) || (dr === 2 && dc === 1);
        }
        if (type === 'r') return Math.abs(start.r - end.r) <= 1 && Math.abs(start.c - end.c) <= 1;
        if (type === 'p') {
            const dir = color === 'b' ? -1 : 1;
            return Math.abs(start.c - end.c) === 1 && end.r === start.r + dir;
        }
        return false;
    }

    isValidMove(start, end) {
        const piece = this.getPiece(start.r, start.c);
        if (!piece || piece[1] !== this.turn) return false;
        return this.isValidMoveInternal(start, end);
    }

    checkCastling(start, end, color) {
        if (start.r !== end.r || Math.abs(start.c - end.c) !== 2) return false;
        if (start.c !== 4) return false;
        
        const keyKing = `${start.r},4`;
        if (this.movedStatus[keyKing]) return false;
        if (this.isInCheck(color)) return false;

        if (end.c === 6) { // Petit roque
            const keyRook = `${start.r},7`;
            if (this.movedStatus[keyRook]) return false;
            const rookPiece = this.getPiece(start.r, 7);
            if (!rookPiece || rookPiece[0] !== 't' || rookPiece[1] !== color) return false;
            if (this.getPiece(start.r, 5) !== "" || this.getPiece(start.r, 6) !== "") return false;
            if (this.leavesKingInCheck(start, {r: start.r, c: 5})) return false;
            return true;
        }
        if (end.c === 2) { // Grand roque
            const keyRook = `${start.r},0`;
            if (this.movedStatus[keyRook]) return false;
            const rookPiece = this.getPiece(start.r, 0);
            if (!rookPiece || rookPiece[0] !== 't' || rookPiece[1] !== color) return false;
            if (this.getPiece(start.r, 1) !== "" || this.getPiece(start.r, 2) !== "" || this.getPiece(start.r, 3) !== "") return false;
            if (this.leavesKingInCheck(start, {r: start.r, c: 3})) return false;
            return true;
        }
        return false;
    }

    checkPawnMove(start, end, color) {
        const target = this.getPiece(end.r, end.c);
        const dir = color === 'b' ? -1 : 1;
        const startRow = color === 'b' ? 6 : 1;

        // Avancée simple
        if (start.c === end.c && target === "") {
            if (end.r === start.r + dir) return true;
            // Avancée double au départ
            if (start.r === startRow && end.r === start.r + 2 * dir && this.getPiece(start.r + dir, start.c) === "") {
                return true;
            }
        }

        // Capture normale ou en passant
        if (Math.abs(start.c - end.c) === 1 && end.r === start.r + dir) {
            if (target !== "" && target[1] !== color) return true;
            if (this.enPassantTarget && end.r === this.enPassantTarget.r && end.c === this.enPassantTarget.c) {
                return true;
            }
        }
        return false;
    }

    checkLinearMove(start, end) {
        if (start.r !== end.r && start.c !== end.c) return false;
        
        const dr = start.r === end.r ? 0 : (end.r > start.r ? 1 : -1);
        const dc = start.c === end.c ? 0 : (end.c > start.c ? 1 : -1);
        
        let currR = start.r + dr;
        let currC = start.c + dc;
        
        while (currR !== end.r || currC !== end.c) {
            if (this.getPiece(currR, currC) !== "") return false;
            currR += dr;
            currC += dc;
        }
        return true;
    }

    checkDiagonalMove(start, end) {
        if (Math.abs(start.r - end.r) !== Math.abs(start.c - end.c)) return false;
        
        const dr = end.r > start.r ? 1 : -1;
        const dc = end.c > start.c ? 1 : -1;
        
        let currR = start.r + dr;
        let currC = start.c + dc;
        
        while (currR !== end.r || currC !== end.c) {
            if (this.getPiece(currR, currC) !== "") return false;
            currR += dr;
            currC += dc;
        }
        return true;
    }

    movePiece(start, end, promotionChoice = 'd') {
        if (this.isValidMove(start, end) && !this.leavesKingInCheck(start, end)) {
            const piece = this.grid[start.r][start.c];
            const target = this.grid[end.r][end.c];
            
            const moveInfo = {
                success: true,
                piece: piece,
                start: start,
                end: end,
                capture: target !== "",
                castle: false,
                promotion: false,
                enPassant: false,
                check: false,
                checkmate: false,
                stalemate: false,
                draw: false,
                drawReason: ""
            };

            // Règle des 50 coups
            if (piece[0] === 'p' || target !== "") {
                this.halfMoveClock = 0;
            } else {
                this.halfMoveClock++;
            }

            let nextEnPassantTarget = null;

            // Grand ou Petit Roque
            if (piece[0] === 'r' && Math.abs(start.c - end.c) === 2) {
                moveInfo.castle = true;
                if (end.c > start.c) { // Petit roque
                    const rook = this.grid[start.r][7];
                    this.grid[start.r][5] = rook;
                    this.grid[start.r][7] = "";
                    this.movedStatus[`${start.r},7`] = true;
                } else { // Grand roque
                    const rook = this.grid[start.r][0];
                    this.grid[start.r][3] = rook;
                    this.grid[start.r][0] = "";
                    this.movedStatus[`${start.r},0`] = true;
                }
            }

            // Prise en passant
            if (piece[0] === 'p' && this.enPassantTarget && end.r === this.enPassantTarget.r && end.c === this.enPassantTarget.c) {
                moveInfo.capture = true;
                moveInfo.enPassant = true;
                const dir = piece[1] === 'b' ? -1 : 1;
                this.grid[end.r - dir][end.c] = ""; // Suppression du pion capturé
            }

            // Enregistre la cible en passant potentielle pour le prochain tour
            if (piece[0] === 'p' && Math.abs(start.r - end.r) === 2) {
                const dir = piece[1] === 'b' ? -1 : 1;
                nextEnPassantTarget = { r: start.r + dir, c: start.c };
            }

            // Déplacement logique
            this.grid[end.r][end.c] = piece;
            this.grid[start.r][start.c] = "";

            // Promotion de pion
            if (piece[0] === 'p') {
                if ((piece[1] === 'b' && end.r === 0) || (piece[1] === 'n' && end.r === 7)) {
                    moveInfo.promotion = true;
                    const choice = ['d', 't', 'f', 'c'].includes(promotionChoice) ? promotionChoice : 'd';
                    this.grid[end.r][end.c] = choice + piece[1];
                }
            }

            // Mise à jour de l'historique des roques
            this.enPassantTarget = nextEnPassantTarget;
            const startKey = `${start.r},${start.c}`;
            if (startKey in this.movedStatus) {
                this.movedStatus[startKey] = true;
            }
            const endKey = `${end.r},${end.c}`;
            if (endKey in this.movedStatus) {
                this.movedStatus[endKey] = true;
            }

            // Tour suivant
            this.turn = this.turn === 'b' ? 'n' : 'b';

            // États post-coup
            if (this.isInCheck(this.turn)) {
                moveInfo.check = true;
                if (this.isCheckmate(this.turn)) {
                    moveInfo.checkmate = true;
                }
            } else if (this.isStalemate(this.turn)) {
                moveInfo.stalemate = true;
                moveInfo.draw = true;
                moveInfo.drawReason = "pat";
            }

            // Enregistrement des signatures pour détection de répétitions triple
            const sig = this.getPositionSignature();
            this.positionHistory[sig] = (this.positionHistory[sig] || 0) + 1;

            if (this.isThreefoldRepetition()) {
                moveInfo.draw = true;
                moveInfo.drawReason = "repetition";
            } else if (this.isInsufficientMaterial()) {
                moveInfo.draw = true;
                moveInfo.drawReason = "materiel";
            } else if (this.isFiftyMoveRule()) {
                moveInfo.draw = true;
                moveInfo.drawReason = "50coups";
            }

            return moveInfo;
        }
        return null;
    }
}

const PIECE_VALUES = {
    'p': 100,
    'c': 320,
    'f': 330,
    't': 500,
    'd': 900,
    'r': 20000
};

// Mutable evaluation parameters for TD-learning
let EVAL_PARAMS = null;
const DEFAULT_EVAL_PARAMS = {
    bishopPairBonus: 30,
    pawnRimPenalty: 15,
    pawnDoubledPenalty: 15,
    pawnIsolatedPenalty: 15,
    pawnConnectedBonus: 5,
    pawnPassedBonusMultiplier: 10,
    pawnBlockadePenalty: 15,
    pawnForkBonus: 50,
    knightForkBonus: 40,
    rookTarraschBonus: 20,
    rook7thRankBonus: 25,
    rook7thRankTrappedKingBonus: 40,
    rookConnectedBonus: 15,
    badBishopPawnFactor: 8,
    undevelopedMinorPenalty: 15,
    queenEarlyPenalty: 20,
    knightOutpostBonus: 30,
    centerControlBonus: 5,
    defendedByPawnBonus: 10,
    openFileKingPenalty: 25,
    semiOpenFileKingPenalty: 15,
    castlingRightsBonus: 15,
    lostCastlingRightsPenalty: 25
};

async function initWeights() {
    if (EVAL_PARAMS) return;
    try {
        const db = await openDB();
        const record = await getRecord(db, "global_weights");
        if (record && record.weights) {
            EVAL_PARAMS = record.weights;
            console.log("[IA] Paramètres d'évaluation personnalisés chargés depuis IndexedDB.");
        } else {
            EVAL_PARAMS = { ...DEFAULT_EVAL_PARAMS };
        }
    } catch (e) {
        console.warn("[IA] Échec du chargement des poids depuis IndexedDB, utilisation des valeurs par défaut.", e);
        EVAL_PARAMS = { ...DEFAULT_EVAL_PARAMS };
    }
}

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
        const timer = setTimeout(() => reject(new Error("IndexedDB open timeout")), 500);
        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = function (e) {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: "signature" });
                }
            };
            request.onsuccess = function (e) {
                clearTimeout(timer);
                resolve(e.target.result);
            };
            request.onerror = function (e) {
                clearTimeout(timer);
                reject(e.target.error);
            };
        } catch (err) {
            clearTimeout(timer);
            reject(err);
        }
    });
}

function getRecord(db, signature) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("IndexedDB get timeout")), 500);
        try {
            const transaction = db.transaction([STORE_NAME], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(signature);
            request.onsuccess = function (e) {
                clearTimeout(timer);
                resolve(e.target.result || null);
            };
            request.onerror = function (e) {
                clearTimeout(timer);
                reject(e.target.error);
            };
        } catch (err) {
            clearTimeout(timer);
            reject(err);
        }
    });
}

function putRecord(db, record) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("IndexedDB put timeout")), 500);
        try {
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(record);
            request.onsuccess = function () {
                clearTimeout(timer);
                resolve();
            };
            request.onerror = function (e) {
                clearTimeout(timer);
                reject(e.target.error);
            };
        } catch (err) {
            clearTimeout(timer);
            reject(err);
        }
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
    const P = EVAL_PARAMS || DEFAULT_EVAL_PARAMS;
    let score = 0;

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
                            if (c === 0 || c === 7) score -= P.pawnRimPenalty;
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
                            if (c === 0 || c === 7) score += P.pawnRimPenalty;
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
                        if (color === 'b') score += P.centerControlBonus;
                        else score -= P.centerControlBonus;
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
                        if (color === 'b') score += P.defendedByPawnBonus;
                        else score -= P.defendedByPawnBonus;
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
    if (whiteBishops >= 2) score += P.bishopPairBonus;
    if (blackBishops >= 2) score -= P.bishopPairBonus;

    // 2. Structure de pions (doublés, isolés, passés, connectés)
    // --- Pions Blancs ---
    for (const pawn of whitePawns) {
        const c = pawn.c;
        const r = pawn.r;
        
        // Pions doublés
        if (whitePawnCols[c] > 1) {
            score -= P.pawnDoubledPenalty;
        }
        
        // Pions isolés
        const hasLeftPawn = c > 0 && whitePawnCols[c - 1] > 0;
        const hasRightPawn = c < 7 && whitePawnCols[c + 1] > 0;
        if (!hasLeftPawn && !hasRightPawn) {
            score -= P.pawnIsolatedPenalty;
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
            score += P.pawnConnectedBonus;
        }

        // Pions passés
        let isPassed = true;
        for (let nextR = r - 1; nextR >= 0; nextR--) {
            if (board.grid[nextR][c] === 'pn') { isPassed = false; break; }
            if (c > 0 && board.grid[nextR][c - 1] === 'pn') { isPassed = false; break; }
            if (c < 7 && board.grid[nextR][c + 1] === 'pn') { isPassed = false; break; }
        }
        if (isPassed) {
            let passVal = (7 - r) * P.pawnPassedBonusMultiplier;
            if (r - 1 >= 0 && board.grid[r - 1][c] !== "") {
                passVal -= P.pawnBlockadePenalty;
            }
            score += passVal;
            
            // Rule: Rook behind passed pawn (Tarrasch rule)
            let rookBehind = false;
            for (let checkR = r + 1; checkR < 8; checkR++) {
                if (board.grid[checkR][c] === 'tb') { rookBehind = true; break; }
                if (board.grid[checkR][c] !== "") break; // Blocked by another piece
            }
            if (rookBehind) score += P.rookTarraschBonus;
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
        if (pawnForkTargets >= 2) score += P.pawnForkBonus;

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
            score += P.pawnDoubledPenalty;
        }
        
        // Pions isolés
        const hasLeftPawn = c > 0 && blackPawnCols[c - 1] > 0;
        const hasRightPawn = c < 7 && blackPawnCols[c + 1] > 0;
        if (!hasLeftPawn && !hasRightPawn) {
            score += P.pawnIsolatedPenalty;
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
            score -= P.pawnConnectedBonus;
        }

        // Pions passés
        let isPassed = true;
        for (let nextR = r + 1; nextR < 8; nextR++) {
            if (board.grid[nextR][c] === 'pb') { isPassed = false; break; }
            if (c > 0 && board.grid[nextR][c - 1] === 'pb') { isPassed = false; break; }
            if (c < 7 && board.grid[nextR][c + 1] === 'pb') { isPassed = false; break; }
        }
        if (isPassed) {
            let passVal = r * P.pawnPassedBonusMultiplier;
            if (r + 1 < 8 && board.grid[r + 1][c] !== "") {
                passVal -= P.pawnBlockadePenalty;
            }
            score -= passVal;

            // Rule: Rook behind passed pawn (Tarrasch rule)
            let rookBehind = false;
            for (let checkR = r - 1; checkR >= 0; checkR--) {
                if (board.grid[checkR][c] === 'tn') { rookBehind = true; break; }
                if (board.grid[checkR][c] !== "") break;
            }
            if (rookBehind) score -= P.rookTarraschBonus;
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
        if (pawnForkTargets >= 2) score -= P.pawnForkBonus;

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
        if (board.grid[7][1] === 'cb') { score -= P.undevelopedMinorPenalty; whiteUndeveloped++; }
        if (board.grid[7][6] === 'cb') { score -= P.undevelopedMinorPenalty; whiteUndeveloped++; }
        if (board.grid[7][2] === 'fb') { score -= P.undevelopedMinorPenalty; whiteUndeveloped++; }
        if (board.grid[7][5] === 'fb') { score -= P.undevelopedMinorPenalty; whiteUndeveloped++; }

        let blackUndeveloped = 0;
        if (board.grid[0][1] === 'cn') { score += P.undevelopedMinorPenalty; blackUndeveloped++; }
        if (board.grid[0][6] === 'cn') { score += P.undevelopedMinorPenalty; blackUndeveloped++; }
        if (board.grid[0][2] === 'fn') { score += P.undevelopedMinorPenalty; blackUndeveloped++; }
        if (board.grid[0][5] === 'fn') { score += P.undevelopedMinorPenalty; blackUndeveloped++; }

        // Queen early development penalty
        if (whiteQueenPos && (whiteQueenPos.r !== 7 || whiteQueenPos.c !== 3) && whiteUndeveloped >= 2) {
            score -= P.queenEarlyPenalty;
        }
        if (blackQueenPos && (blackQueenPos.r !== 0 || blackQueenPos.c !== 3) && blackUndeveloped >= 2) {
            score += P.queenEarlyPenalty;
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
        if (targets >= 2) score += P.knightForkBonus;
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
        if (targets >= 2) score -= P.knightForkBonus;
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
                    score += P.knightOutpostBonus;
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
                    score -= P.knightOutpostBonus;
                }
            }
        }
    }

    // Rooks on 7th/2nd rank
    for (const rp of whiteRookPositions) {
        if (rp.r === 1) {
            if (blackKing && blackKing.r === 0) {
                score += P.rook7thRankTrappedKingBonus;
            } else {
                score += P.rook7thRankBonus;
            }
        }
    }
    for (const rp of blackRookPositions) {
        if (rp.r === 6) {
            if (whiteKing && whiteKing.r === 7) {
                score -= P.rook7thRankTrappedKingBonus;
            } else {
                score -= P.rook7thRankBonus;
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
        if (connected) score += P.rookConnectedBonus;
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
        if (connected) score -= P.rookConnectedBonus;
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
            score -= (sameColorPawns - 3) * P.badBishopPawnFactor;
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
            score += (sameColorPawns - 3) * P.badBishopPawnFactor;
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
                        score += P.castlingRightsBonus; // Bonus pour avoir les droits de roquer
                    } else {
                        score -= P.lostCastlingRightsPenalty; // Pénalité si droits perdus
                    }
                } else {
                    score -= P.lostCastlingRightsPenalty; // Pénalité si roi a bougé
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
                                score -= P.openFileKingPenalty; // Open file next to King
                            } else {
                                score -= P.semiOpenFileKingPenalty; // Semi-open file next to King
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
                        score -= P.castlingRightsBonus;
                    } else {
                        score += P.lostCastlingRightsPenalty;
                    }
                } else {
                    score += P.lostCastlingRightsPenalty;
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
                                score += P.openFileKingPenalty;
                            } else {
                                score += P.semiOpenFileKingPenalty;
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

let searchNodeCount = 0;
let searchTimeoutTriggered = false;

function checkTimeout(startTime, timeLimit) {
    searchNodeCount++;
    if (searchNodeCount % 64 === 0) {
        if (Date.now() - startTime >= timeLimit) {
            searchTimeoutTriggered = true;
            throw new Error('Timeout');
        }
    }
}

function minimax(board, depth, alpha, beta, isMaximizing, style, startTime, timeLimit) {
    checkTimeout(startTime, timeLimit);

    if (depth === 0) {
        return quiescence(board, alpha, beta, isMaximizing, style, startTime, timeLimit, 0);
    }
    
    if (board.isThreefoldRepetition() || board.isFiftyMoveRule() || board.isInsufficientMaterial()) {
        return 0;
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
        if (board.isInCheck(turn)) {
            return turn === 'b' ? (-99999 - depth) : (99999 + depth);
        }
        return 0;
    }

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
            const evaluation = minimax(nextBoard, depth - 1, alpha, beta, false, style, startTime, timeLimit);
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
            const evaluation = minimax(nextBoard, depth - 1, alpha, beta, true, style, startTime, timeLimit);
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) {
                break;
            }
        }
        return minEval;
    }
}

function quiescence(board, alpha, beta, isMaximizing, style, startTime, timeLimit, qDepth) {
    checkTimeout(startTime, timeLimit);

    const standPat = evaluateBoard(board, 0, style);
    
    // Stop search if game is drawn or max quiescence depth reached
    if (qDepth >= 3 || board.isThreefoldRepetition() || board.isFiftyMoveRule() || board.isInsufficientMaterial()) {
        return standPat;
    }

    if (isMaximizing) {
        if (standPat >= beta) {
            return standPat;
        }
        alpha = Math.max(alpha, standPat);
        
        const moves = getCaptureMoves(board);
        if (moves.length === 0) return standPat;

        // Sort captures: MVV-LVA simplified (captured piece value)
        moves.sort((a, b) => {
            const aVal = PIECE_VALUES[board.grid[a.end.r][a.end.c][0]] || 0;
            const bVal = PIECE_VALUES[board.grid[b.end.r][b.end.c][0]] || 0;
            return bVal - aVal;
        });

        for (const move of moves) {
            const nextBoard = board.clone();
            nextBoard.movePiece(move.start, move.end);
            const evaluation = quiescence(nextBoard, alpha, beta, false, style, startTime, timeLimit, qDepth + 1);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) {
                break;
            }
        }
        return alpha;
    } else {
        if (standPat <= alpha) {
            return standPat;
        }
        beta = Math.min(beta, standPat);

        const moves = getCaptureMoves(board);
        if (moves.length === 0) return standPat;

        moves.sort((a, b) => {
            const aVal = PIECE_VALUES[board.grid[a.end.r][a.end.c][0]] || 0;
            const bVal = PIECE_VALUES[board.grid[b.end.r][b.end.c][0]] || 0;
            return bVal - aVal;
        });

        for (const move of moves) {
            const nextBoard = board.clone();
            nextBoard.movePiece(move.start, move.end);
            const evaluation = quiescence(nextBoard, alpha, beta, true, style, startTime, timeLimit, qDepth + 1);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) {
                break;
            }
        }
        return beta;
    }
}

function getCaptureMoves(board) {
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
    const captureMoves = [];
    for (const p of pieces) {
        const validEnds = board.getValidMoves(p);
        for (const end of validEnds) {
            const isNormalCapture = board.grid[end.r][end.c] !== "";
            const isEnPassant = board.enPassantTarget && end.r === board.enPassantTarget.r && end.c === board.enPassantTarget.c && board.grid[p.r][p.c][0] === 'p';
            if (isNormalCapture || isEnPassant) {
                captureMoves.push({ start: p, end });
            }
        }
    }
    return captureMoves;
}

function findBestMoveAtDepth(board, depth, style, record, startTime, timeLimit, previousBestMove) {
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

    // Sort moves to maximize alpha-beta pruning speed:
    // 1. Previous best move (PV move) goes first!
    // 2. Capture moves
    // 3. Normal moves
    moves.sort((a, b) => {
        if (previousBestMove) {
            const aIsPrev = (a.start.r === previousBestMove.start.r && a.start.c === previousBestMove.start.c &&
                             a.end.r === previousBestMove.end.r && a.end.c === previousBestMove.end.c);
            const bIsPrev = (b.start.r === previousBestMove.start.r && b.start.c === previousBestMove.start.c &&
                             b.end.r === previousBestMove.end.r && b.end.c === previousBestMove.end.c);
            if (aIsPrev) return -1;
            if (bIsPrev) return 1;
        }
        
        const aCap = board.grid[a.end.r][a.end.c] !== "" ? 1 : 0;
        const bCap = board.grid[b.end.r][b.end.c] !== "" ? 1 : 0;
        if (aCap !== bCap) return bCap - aCap;
        
        return 0;
    });

    for (const move of moves) {
        checkTimeout(startTime, timeLimit);

        const nextBoard = board.clone();
        nextBoard.movePiece(move.start, move.end);
        
        const noise = (Math.random() - 0.5) * 6; // noise to avoid playing identical games

        const moveKey = `${move.start.r},${move.start.c}-${move.end.r},${move.end.c}`;
        let qBonus = 0;
        if (record && record.moves && record.moves[moveKey]) {
            qBonus = record.moves[moveKey].q * 150;
        }

        let val = minimax(nextBoard, depth - 1, -Infinity, Infinity, !isMaximizing, style, startTime, timeLimit) + noise;
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
        
        const maxPlies = Math.min(gameHistory.length, 24);
        const tasks = [];
        for (let t = 0; t < maxPlies; t++) {
            const historyEntry = gameHistory[t];
            const boardState = historyEntry.boardState;
            const move = { start: historyEntry.start, end: historyEntry.end };
            
            const tempBoard = new Board();
            tempBoard.loadState(boardState);
            const signature = tempBoard.getPositionSignature();
            const moveKey = `${move.start.r},${move.start.c}-${move.end.r},${move.end.c}`;
            
            const activeColor = boardState.turn;
            let reward = 0;
            if (result === activeColor) {
                reward = 1.0;
            } else if (result !== null) {
                reward = -1.0;
            } else {
                reward = 0.0;
            }
            
            const discountedReward = reward * Math.pow(discountFactor, maxPlies - 1 - t);
            tasks.push({ signature, moveKey, discountedReward });
        }

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

        // Appliquer TD-Learning pour ajuster dynamiquement les paramètres positionnels
        await adjustWeights(gameHistory, result);

    } catch (e) {
        console.error("Erreur lors de l'apprentissage de l'IA :", e);
    }
}

// --- TEMPORAL DIFFERENCE LEARNING : AJUSTEMENT DYNAMIQUE DES PARAMÈTRES POSITIONNELS ---
async function adjustWeights(gameHistory, result) {
    try {
        const db = await openDB();
        let record = await getRecord(db, "global_weights");
        let weights = record ? record.weights : { ...DEFAULT_EVAL_PARAMS };
        
        const lr = 0.05;
        const outcome = result === 'b' ? 1.0 : (result === 'n' ? -1.0 : 0.0);
        
        if (outcome === 0) {
            // Decay weights back to default slowly to avoid excessive drift on draws
            for (const key in weights) {
                weights[key] = weights[key] + 0.02 * (DEFAULT_EVAL_PARAMS[key] - weights[key]);
            }
        } else {
            const startPly = Math.max(0, gameHistory.length - 40);
            const endPly = gameHistory.length;
            
            for (let t = startPly; t < endPly; t++) {
                const boardState = gameHistory[t].boardState;
                const tempBoard = new Board();
                tempBoard.loadState(boardState);
                
                const features = extractFeatures(tempBoard);
                
                const adjustBonus = (key, whiteVal, blackVal) => {
                    const diff = whiteVal - blackVal;
                    weights[key] += lr * diff * outcome * 0.1;
                    weights[key] = Math.max(DEFAULT_EVAL_PARAMS[key] * 0.5, Math.min(DEFAULT_EVAL_PARAMS[key] * 1.5, weights[key]));
                };
                
                const adjustPenalty = (key, whiteVal, blackVal) => {
                    const diff = whiteVal - blackVal;
                    weights[key] -= lr * diff * outcome * 0.1;
                    weights[key] = Math.max(DEFAULT_EVAL_PARAMS[key] * 0.5, Math.min(DEFAULT_EVAL_PARAMS[key] * 1.5, weights[key]));
                };
                
                adjustBonus('bishopPairBonus', features.whiteBishops >= 2 ? 1 : 0, features.blackBishops >= 2 ? 1 : 0);
                adjustBonus('pawnConnectedBonus', features.whiteConnectedPawns, features.blackConnectedPawns);
                adjustBonus('pawnPassedBonusMultiplier', features.whitePassedPawns, features.blackPassedPawns);
                adjustBonus('pawnForkBonus', features.whitePawnForks, features.blackPawnForks);
                adjustBonus('knightForkBonus', features.whiteKnightForks, features.blackKnightForks);
                adjustBonus('rookTarraschBonus', features.whiteRookTarrasch, features.blackRookTarrasch);
                adjustBonus('rook7thRankBonus', features.whiteRook7th, features.blackRook7th);
                adjustBonus('rookConnectedBonus', features.whiteRooksConnected ? 1 : 0, features.blackRooksConnected ? 1 : 0);
                adjustBonus('knightOutpostBonus', features.whiteKnightOutposts, features.blackKnightOutposts);
                adjustBonus('centerControlBonus', features.whiteCenterControl, features.blackCenterControl);
                adjustBonus('defendedByPawnBonus', features.whiteDefendedByPawn, features.blackDefendedByPawn);
                adjustBonus('castlingRightsBonus', features.whiteCastlingRights ? 1 : 0, features.blackCastlingRights ? 1 : 0);
                
                adjustPenalty('pawnDoubledPenalty', features.whiteDoubledPawns, features.blackDoubledPawns);
                adjustPenalty('pawnIsolatedPenalty', features.whiteIsolatedPawns, features.blackIsolatedPawns);
                adjustPenalty('pawnBlockadePenalty', features.whiteBlockadedPassed, features.blackBlockadedPassed);
                adjustPenalty('badBishopPawnFactor', features.whiteBadBishopPawns, features.blackBadBishopPawns);
                adjustPenalty('undevelopedMinorPenalty', features.whiteUndevelopedMinors, features.blackUndevelopedMinors);
                adjustPenalty('queenEarlyPenalty', features.whiteEarlyQueen ? 1 : 0, features.blackEarlyQueen ? 1 : 0);
                adjustPenalty('openFileKingPenalty', features.whiteKingOpenFiles, features.blackKingOpenFiles);
                adjustPenalty('semiOpenFileKingPenalty', features.whiteKingSemiOpenFiles, features.blackKingSemiOpenFiles);
                adjustPenalty('lostCastlingRightsPenalty', features.whiteLostCastlingRights ? 1 : 0, features.blackLostCastlingRights ? 1 : 0);
            }
        }
        
        await putRecord(db, { signature: "global_weights", weights });
        EVAL_PARAMS = weights;
        console.log("[IA] Apprentissage TD-learning appliqué avec succès aux paramètres positionnels.");
    } catch (e) {
        console.error("Erreur lors de l'ajustement TD-Learning :", e);
    }
}

function extractFeatures(board) {
    let whiteKing = null;
    let blackKing = null;
    let whiteQueenPos = null;
    let blackQueenPos = null;
    let whiteMaterial = 0;
    let blackMaterial = 0;
    let whiteBishops = 0;
    let blackBishops = 0;
    
    const whiteBishopPositions = [];
    const blackBishopPositions = [];
    const whiteKnightPositions = [];
    const blackKnightPositions = [];
    const whiteRookPositions = [];
    const blackRookPositions = [];
    
    const whitePawnCols = Array(8).fill(0);
    const blackPawnCols = Array(8).fill(0);
    const whitePawns = [];
    const blackPawns = [];

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
                        if (type === 'd') whiteQueenPos = { r, c };
                        if (type === 'f') { whiteBishops++; whiteBishopPositions.push({ r, c }); }
                        if (type === 'c') whiteKnightPositions.push({ r, c });
                        if (type === 't') whiteRookPositions.push({ r, c });
                        if (type === 'p') { whitePawnCols[c]++; whitePawns.push({ r, c }); }
                    } else {
                        blackMaterial += val;
                        if (type === 'd') blackQueenPos = { r, c };
                        if (type === 'f') { blackBishops++; blackBishopPositions.push({ r, c }); }
                        if (type === 'c') blackKnightPositions.push({ r, c });
                        if (type === 't') blackRookPositions.push({ r, c });
                        if (type === 'p') { blackPawnCols[c]++; blackPawns.push({ r, c }); }
                    }
                }
            }
        }
    }

    const whiteNonPawnMaterial = whiteMaterial - (whitePawns.length * 100);
    const blackNonPawnMaterial = blackMaterial - (blackPawns.length * 100);
    const isEndgame = (whiteNonPawnMaterial + blackNonPawnMaterial) <= 1500;

    const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    const f = {
        whiteBishops, blackBishops,
        whiteConnectedPawns: 0, blackConnectedPawns: 0,
        whitePassedPawns: 0, blackPassedPawns: 0,
        whitePawnForks: 0, blackPawnForks: 0,
        whiteKnightForks: 0, blackKnightForks: 0,
        whiteRookTarrasch: 0, blackRookTarrasch: 0,
        whiteRook7th: 0, blackRook7th: 0,
        whiteRooksConnected: false, blackRooksConnected: false,
        whiteKnightOutposts: 0, blackKnightOutposts: 0,
        whiteCenterControl: 0, blackCenterControl: 0,
        whiteDefendedByPawn: 0, blackDefendedByPawn: 0,
        whiteCastlingRights: false, blackCastlingRights: false,
        whiteLostCastlingRights: false, blackLostCastlingRights: false,
        
        whiteDoubledPawns: 0, blackDoubledPawns: 0,
        whiteIsolatedPawns: 0, blackIsolatedPawns: 0,
        whiteBlockadedPassed: 0, blackBlockadedPassed: 0,
        whiteBadBishopPawns: 0, blackBadBishopPawns: 0,
        whiteUndevelopedMinors: 0, blackUndevelopedMinors: 0,
        whiteEarlyQueen: false, blackEarlyQueen: false,
        whiteKingOpenFiles: 0, blackKingOpenFiles: 0,
        whiteKingSemiOpenFiles: 0, blackKingSemiOpenFiles: 0
    };

    for (const pawn of whitePawns) {
        const c = pawn.c;
        const r = pawn.r;
        if (whitePawnCols[c] > 1) f.whiteDoubledPawns++;
        if ((c === 0 || whitePawnCols[c - 1] === 0) && (c === 7 || whitePawnCols[c + 1] === 0)) f.whiteIsolatedPawns++;
        
        let isConnected = false;
        if (c > 0 && (board.grid[r][c - 1] === 'pb' || (r + 1 < 8 && board.grid[r + 1][c - 1] === 'pb'))) isConnected = true;
        if (c < 7 && (board.grid[r][c + 1] === 'pb' || (r + 1 < 8 && board.grid[r + 1][c + 1] === 'pb'))) isConnected = true;
        if (isConnected) f.whiteConnectedPawns++;

        let isPassed = true;
        for (let nextR = r - 1; nextR >= 0; nextR--) {
            if (board.grid[nextR][c] === 'pn' || (c > 0 && board.grid[nextR][c - 1] === 'pn') || (c < 7 && board.grid[nextR][c + 1] === 'pn')) {
                isPassed = false; break;
            }
        }
        if (isPassed) {
            f.whitePassedPawns++;
            if (r - 1 >= 0 && board.grid[r - 1][c] !== "") f.whiteBlockadedPassed++;
            for (let checkR = r + 1; checkR < 8; checkR++) {
                if (board.grid[checkR][c] === 'tb') { f.whiteRookTarrasch++; break; }
                if (board.grid[checkR][c] !== "") break;
            }
        }

        let targets = 0;
        for (const dc of [-1, 1]) {
            const nr = r - 1;
            const nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const tp = board.grid[nr][nc];
                if (tp !== "" && tp[1] === 'n' && ['c', 'f', 't', 'd', 'r'].includes(tp[0])) targets++;
            }
        }
        if (targets >= 2) f.whitePawnForks++;
    }

    for (const pawn of blackPawns) {
        const c = pawn.c;
        const r = pawn.r;
        if (blackPawnCols[c] > 1) f.blackDoubledPawns++;
        if ((c === 0 || blackPawnCols[c - 1] === 0) && (c === 7 || blackPawnCols[c + 1] === 0)) f.blackIsolatedPawns++;
        
        let isConnected = false;
        if (c > 0 && (board.grid[r][c - 1] === 'pn' || (r - 1 >= 0 && board.grid[r - 1][c - 1] === 'pn'))) isConnected = true;
        if (c < 7 && (board.grid[r][c + 1] === 'pn' || (r - 1 >= 0 && board.grid[r - 1][c + 1] === 'pn'))) isConnected = true;
        if (isConnected) f.blackConnectedPawns++;

        let isPassed = true;
        for (let nextR = r + 1; nextR < 8; nextR++) {
            if (board.grid[nextR][c] === 'pb' || (c > 0 && board.grid[nextR][c - 1] === 'pb') || (c < 7 && board.grid[nextR][c + 1] === 'pb')) {
                isPassed = false; break;
            }
        }
        if (isPassed) {
            f.blackPassedPawns++;
            if (r + 1 < 8 && board.grid[r + 1][c] !== "") f.blackBlockadedPassed++;
            for (let checkR = r - 1; checkR >= 0; checkR--) {
                if (board.grid[checkR][c] === 'tn') { f.blackRookTarrasch++; break; }
                if (board.grid[checkR][c] !== "") break;
            }
        }

        let targets = 0;
        for (const dc of [-1, 1]) {
            const nr = r + 1;
            const nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const tp = board.grid[nr][nc];
                if (tp !== "" && tp[1] === 'b' && ['c', 'f', 't', 'd', 'r'].includes(tp[0])) targets++;
            }
        }
        if (targets >= 2) f.blackPawnForks++;
    }

    for (const kp of whiteKnightPositions) {
        let targets = 0;
        for (const [dr, dc] of knightMoves) {
            const nr = kp.r + dr;
            const nc = kp.c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const tp = board.grid[nr][nc];
                if (tp !== "" && tp[1] === 'n' && ['t', 'd', 'r', 'f', 'c'].includes(tp[0])) targets++;
            }
        }
        if (targets >= 2) f.whiteKnightForks++;

        if (kp.r >= 2 && kp.r <= 4) {
            let defended = false;
            if (kp.r + 1 < 8) {
                if (kp.c - 1 >= 0 && board.grid[kp.r + 1][kp.c - 1] === 'pb') defended = true;
                if (kp.c + 1 < 8 && board.grid[kp.r + 1][kp.c + 1] === 'pb') defended = true;
            }
            if (defended) {
                let attacked = false;
                for (const col of [kp.c - 1, kp.c + 1]) {
                    if (col >= 0 && col < 8) {
                        for (let row = 0; row < kp.r; row++) {
                            if (board.grid[row][col] === 'pn') { attacked = true; break; }
                        }
                    }
                    if (attacked) break;
                }
                if (!attacked) f.whiteKnightOutposts++;
            }
        }
    }

    for (const kp of blackKnightPositions) {
        let targets = 0;
        for (const [dr, dc] of knightMoves) {
            const nr = kp.r + dr;
            const nc = kp.c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const tp = board.grid[nr][nc];
                if (tp !== "" && tp[1] === 'b' && ['t', 'd', 'r', 'f', 'c'].includes(tp[0])) targets++;
            }
        }
        if (targets >= 2) f.blackKnightForks++;

        if (kp.r >= 3 && kp.r <= 5) {
            let defended = false;
            if (kp.r - 1 >= 0) {
                if (kp.c - 1 >= 0 && board.grid[kp.r - 1][kp.c - 1] === 'pn') defended = true;
                if (kp.c + 1 < 8 && board.grid[kp.r - 1][kp.c + 1] === 'pn') defended = true;
            }
            if (defended) {
                let attacked = false;
                for (const col of [kp.c - 1, kp.c + 1]) {
                    if (col >= 0 && col < 8) {
                        for (let row = kp.r + 1; row < 8; row++) {
                            if (board.grid[row][col] === 'pb') { attacked = true; break; }
                        }
                    }
                    if (attacked) break;
                }
                if (!attacked) f.blackKnightOutposts++;
            }
        }
    }

    for (const rp of whiteRookPositions) {
        if (rp.r === 1) f.whiteRook7th++;
    }
    for (const rp of blackRookPositions) {
        if (rp.r === 6) f.blackRook7th++;
    }

    if (whiteRookPositions.length >= 2) {
        let connected = false;
        for (let i = 0; i < whiteRookPositions.length; i++) {
            for (let j = i + 1; j < whiteRookPositions.length; j++) {
                const r1 = whiteRookPositions[i];
                const r2 = whiteRookPositions[j];
                if (r1.r === r2.r) {
                    let clear = true;
                    for (let checkC = Math.min(r1.c, r2.c) + 1; checkC < Math.max(r1.c, r2.c); checkC++) {
                        if (board.grid[r1.r][checkC] !== "") { clear = false; break; }
                    }
                    if (clear) { connected = true; break; }
                } else if (r1.c === r2.c) {
                    let clear = true;
                    for (let checkR = Math.min(r1.r, r2.r) + 1; checkR < Math.max(r1.r, r2.r); checkR++) {
                        if (board.grid[checkR][r1.c] !== "") { clear = false; break; }
                    }
                    if (clear) { connected = true; break; }
                }
            }
            if (connected) break;
        }
        f.whiteRooksConnected = connected;
    }
    if (blackRookPositions.length >= 2) {
        let connected = false;
        for (let i = 0; i < blackRookPositions.length; i++) {
            for (let j = i + 1; j < blackRookPositions.length; j++) {
                const r1 = blackRookPositions[i];
                const r2 = blackRookPositions[j];
                if (r1.r === r2.r) {
                    let clear = true;
                    for (let checkC = Math.min(r1.c, r2.c) + 1; checkC < Math.max(r1.c, r2.c); checkC++) {
                        if (board.grid[r1.r][checkC] !== "") { clear = false; break; }
                    }
                    if (clear) { connected = true; break; }
                } else if (r1.c === r2.c) {
                    let clear = true;
                    for (let checkR = Math.min(r1.r, r2.r) + 1; checkR < Math.max(r1.r, r2.r); checkR++) {
                        if (board.grid[checkR][r1.c] !== "") { clear = false; break; }
                    }
                    if (clear) { connected = true; break; }
                }
            }
            if (connected) break;
        }
        f.blackRooksConnected = connected;
    }

    for (const bPos of whiteBishopPositions) {
        const bishopColor = (bPos.r + bPos.c) % 2;
        let count = 0;
        for (const p of whitePawns) {
            if ((p.r + p.c) % 2 === bishopColor) count++;
        }
        if (count >= 4) f.whiteBadBishopPawns += (count - 3);
    }
    for (const bPos of blackBishopPositions) {
        const bishopColor = (bPos.r + bPos.c) % 2;
        let count = 0;
        for (const p of blackPawns) {
            if ((p.r + p.c) % 2 === bishopColor) count++;
        }
        if (count >= 4) f.blackBadBishopPawns += (count - 3);
    }

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const piece = board.grid[r][c];
            if (piece !== "") {
                const type = piece[0];
                const color = piece[1];
                if (type === 'p' || type === 'c' || type === 'f') {
                    if (attacksCenter(r, c, type, color, board)) {
                        if (color === 'b') f.whiteCenterControl++;
                        else f.blackCenterControl++;
                    }
                }
                
                if (type !== 'p' && type !== 'r') {
                    let defended = false;
                    if (color === 'b') {
                        if (r + 1 < 8) {
                            if ((c - 1 >= 0 && board.grid[r + 1][c - 1] === 'pb') || (c + 1 < 8 && board.grid[r + 1][c + 1] === 'pb')) defended = true;
                        }
                    } else {
                        if (r - 1 >= 0) {
                            if ((c - 1 >= 0 && board.grid[r - 1][c - 1] === 'pn') || (c + 1 < 8 && board.grid[r - 1][c + 1] === 'pn')) defended = true;
                        }
                    }
                    if (defended) {
                        if (color === 'b') f.whiteDefendedByPawn++;
                        else f.blackDefendedByPawn++;
                    }
                }
            }
        }
    }

    if (board.grid[7][1] === 'cb') f.whiteUndevelopedMinors++;
    if (board.grid[7][6] === 'cb') f.whiteUndevelopedMinors++;
    if (board.grid[7][2] === 'fb') f.whiteUndevelopedMinors++;
    if (board.grid[7][5] === 'fb') f.whiteUndevelopedMinors++;

    if (board.grid[0][1] === 'cn') f.blackUndevelopedMinors++;
    if (board.grid[0][6] === 'cn') f.blackUndevelopedMinors++;
    if (board.grid[0][2] === 'fn') f.blackUndevelopedMinors++;
    if (board.grid[0][5] === 'fn') f.blackUndevelopedMinors++;

    if (whiteQueenPos && (whiteQueenPos.r !== 7 || whiteQueenPos.c !== 3) && f.whiteUndevelopedMinors >= 2) f.whiteEarlyQueen = true;
    if (blackQueenPos && (blackQueenPos.r !== 0 || blackQueenPos.c !== 3) && f.blackUndevelopedMinors >= 2) f.blackEarlyQueen = true;

    if (!isEndgame) {
        const isWhiteCastled = whiteKing && whiteKing.r === 7 && (whiteKing.c === 6 || whiteKing.c === 2);
        if (!isWhiteCastled && whiteKing) {
            const hasMoved = board.movedStatus["7,4"];
            if (!hasMoved) {
                const canK = !board.movedStatus["7,7"];
                const canQ = !board.movedStatus["7,0"];
                if (canK || canQ) f.whiteCastlingRights = true;
                else f.whiteLostCastlingRights = true;
            } else {
                f.whiteLostCastlingRights = true;
            }
        }
        
        const isBlackCastled = blackKing && blackKing.r === 0 && (blackKing.c === 6 || blackKing.c === 2);
        if (!isBlackCastled && blackKing) {
            const hasMoved = board.movedStatus["0,4"];
            if (!hasMoved) {
                const canK = !board.movedStatus["0,7"];
                const canQ = !board.movedStatus["0,0"];
                if (canK || canQ) f.blackCastlingRights = true;
                else f.blackLostCastlingRights = true;
            } else {
                f.blackLostCastlingRights = true;
            }
        }

        if (whiteKing && (isWhiteCastled || whiteKing.r === 7)) {
            for (let dc = -1; dc <= 1; dc++) {
                const col = whiteKing.c + dc;
                if (col >= 0 && col < 8) {
                    if (whitePawnCols[col] === 0) {
                        if (blackPawnCols[col] === 0) f.whiteKingOpenFiles++;
                        else f.whiteKingSemiOpenFiles++;
                    }
                }
            }
        }
        if (blackKing && (isBlackCastled || blackKing.r === 0)) {
            for (let dc = -1; dc <= 1; dc++) {
                const col = blackKing.c + dc;
                if (col >= 0 && col < 8) {
                    if (blackPawnCols[col] === 0) {
                        if (whitePawnCols[col] === 0) f.blackKingOpenFiles++;
                        else f.blackKingSemiOpenFiles++;
                    }
                }
            }
        }
    }

    return f;
}

async function runSearch(board, maxDepth, style, useLearning) {
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
            console.log(`[Worker] Coup non trouvé dans le livre d'ouvertures. Début recherche Minimax brute force...`);
            const startTime = Date.now();
            const timeLimit = 4500; // 4.5 seconds safety limit
            
            searchNodeCount = 0;
            searchTimeoutTriggered = false;
            
            let previousBestMove = null;
            let lastCompletedBestMove = null;
            let lastCompletedBestValue = 0;
            
            for (let d = 1; d <= (maxDepth || 3); d++) {
                try {
                    console.log(`[Worker] Minimax Profondeur ${d} en cours...`);
                    const result = findBestMoveAtDepth(board, d, style, record, startTime, timeLimit, previousBestMove);
                    if (result && !searchTimeoutTriggered) {
                        lastCompletedBestMove = result.bestMove;
                        lastCompletedBestValue = result.bestValue;
                        previousBestMove = result.bestMove; // use as PV move in next iteration
                        console.log(`[Worker] Profondeur ${d} terminée. Meilleur coup: ${lastCompletedBestMove ? `${lastCompletedBestMove.start.r},${lastCompletedBestMove.start.c}-${lastCompletedBestMove.end.r},${lastCompletedBestMove.end.c}` : 'aucun'}, val: ${lastCompletedBestValue}`);
                    }
                } catch (err) {
                    if (err.message === 'Timeout') {
                        console.log(`[IA] Iterative Deepening interrompu par limite de temps à la profondeur ${d}.`);
                        break;
                    } else {
                        console.error(`[Worker] Erreur à la profondeur ${d} :`, err);
                        throw err;
                    }
                }
            }
            
            bestMove = lastCompletedBestMove;
            bestValue = lastCompletedBestValue;
            
            if (!bestMove) {
                // Fallback de sécurité au cas où la profondeur 1 a expiré ou a échoué
                const pieces = [];
                for (let r = 0; r < ROWS; r++) {
                    for (let c = 0; c < COLS; c++) {
                        const piece = board.grid[r][c];
                        if (piece !== "" && piece[1] === turn) {
                            pieces.push({ r, c });
                        }
                    }
                }
                const fallbackMoves = [];
                for (const p of pieces) {
                    const validEnds = board.getValidMoves(p);
                    for (const end of validEnds) {
                        fallbackMoves.push({ start: p, end });
                    }
                }
                if (fallbackMoves.length > 0) {
                    bestMove = fallbackMoves[Math.floor(Math.random() * fallbackMoves.length)];
                    bestValue = evaluateBoard(board, 0, style);
                    console.log(`[IA] Recherche interrompue prématurément, repli de sécurité sur un coup aléatoire : ${bestMove.start.r},${bestMove.start.c}-${bestMove.end.r},${bestMove.end.c}`);
                }
            }
        }
        
        self.postMessage({ type: 'searchResult', success: true, bestMove, evaluation: bestValue });
    } catch (error) {
        self.postMessage({ type: 'searchResult', success: false, error: error.message });
    }
}

self.onmessage = async function (e) {
    const { type, boardState, depth, style, useLearning, gameHistory, result } = e.data;
    console.log(`[Worker] Message reçu de type "${type}". Style: ${style}, Profondeur: ${depth}, Apprentissage: ${useLearning}`);
    
    try {
        console.log("[Worker] Initialisation des poids...");
        await initWeights();
        console.log("[Worker] Poids initialisés avec succès. EVAL_PARAMS est chargé.");
    } catch (err) {
        console.error("[Worker] Erreur lors de initWeights :", err);
    }
    
    if (type === 'ping') {
        self.postMessage({ type: 'pong' });
        return;
    }
    
    if (type === 'search') {
        try {
            console.log("[Worker] Démarrage de la recherche...");
            const board = new Board();
            board.loadState(boardState);
            console.log("[Worker] État du plateau chargé avec succès. turn =", board.turn);
            await runSearch(board, depth, style, useLearning);
        } catch (error) {
            console.error("[Worker] Erreur fatale dans runSearch :", error);
            self.postMessage({ type: 'searchResult', success: false, error: error.message });
        }
    }
    
    if (type === 'learn') {
        try {
            console.log("[Worker] Démarrage de l'apprentissage post-partie...");
            await learnFromGame(gameHistory, result);
            self.postMessage({ type: 'learnComplete', success: true });
        } catch (error) {
            console.error("Erreur lors du traitement de l'apprentissage :", error);
            self.postMessage({ type: 'learnComplete', success: false, error: error.message });
        }
    }
};
