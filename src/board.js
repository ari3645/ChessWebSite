import { ROWS, COLS, INITIAL_GRID } from './constants.js';

export class Board {
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
