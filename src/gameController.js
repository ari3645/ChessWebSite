import { ROWS, COLS, PIECE_SYMBOLS, PIECE_SVGS } from './constants.js';
import { Board } from './board.js';
import { SoundManager } from './soundManager.js';

export class GameController {
    constructor() {
        this.soundManager = new SoundManager();
        this.state = "MENU";
        this.board = null;
        
        // Joueurs et Scores
        this.player1Name = "Joueur 1";
        this.player2Name = "Joueur 2";
        this.scoreP1 = 0.0;
        this.scoreP2 = 0.0;
        this.p1IsWhite = true; // Si P1 est blanc (si faux, P1 est noir)
        
        // Temps
        this.selectedTimeLimit = 600; // secondes (10 min)
        this.selectedIncrement = 15;  // secondes
        this.timeP1 = null; // ms
        this.timeP2 = null; // ms
        this.timerInterval = null;
        this.lastTickTime = 0;
        
        // Sélection
        this.selectedSq = null;
        this.validMoves = [];
        this.autoRotate = false;
        
        // Promotion en attente
        this.waitingPromotionMove = null; // {start, end}
        
        // Historique complet
        this.moveHistory = []; // Liste des coups joués en notation algébrique
        
        // Liaison des événements DOM
        this.bindEvents();
        this.updateView();
    }

    bindEvents() {
        // Boutons de nettoyage du menu
        document.getElementById('btn-clear-p1').addEventListener('click', () => {
            document.getElementById('player1-name').value = "";
            document.getElementById('player1-name').focus();
        });
        document.getElementById('btn-clear-p2').addEventListener('click', () => {
            document.getElementById('player2-name').value = "";
            document.getElementById('player2-name').focus();
        });

        // Sélecteur de temps
        const timeBtns = document.querySelectorAll('.time-btn');
        timeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                timeBtns.forEach(b => b.classList.remove('active'));
                const targetBtn = e.currentTarget;
                targetBtn.classList.add('active');
                
                const time = targetBtn.getAttribute('data-time');
                const inc = targetBtn.getAttribute('data-inc');
                
                this.selectedTimeLimit = time === "null" ? null : parseInt(time);
                this.selectedIncrement = inc === "null" ? null : parseInt(inc);
            });
        });

        // Switch des sons
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.soundManager.enabled = e.target.checked;
        });

        // Bouton jouer du menu
        document.getElementById('btn-play').addEventListener('click', () => {
            const p1 = document.getElementById('player1-name').value.trim();
            const p2 = document.getElementById('player2-name').value.trim();

            if (p1 === "" || p2 === "") {
                alert("Veuillez saisir un nom pour chaque joueur !");
                return;
            }
            if (p1.toLowerCase() === p2.toLowerCase()) {
                alert("Les joueurs doivent avoir des noms différents !");
                return;
            }

            this.player1Name = p1;
            this.player2Name = p2;
            
            // Lancer le jeu
            this.scoreP1 = 0.0;
            this.scoreP2 = 0.0;
            this.p1IsWhite = true;
            this.startGame();
        });

        // Options en jeu
        document.getElementById('btn-rotate').addEventListener('click', () => {
            this.autoRotate = !this.autoRotate;
            document.getElementById('rotate-label').textContent = this.autoRotate ? "Rotation Auto : ON" : "Rotation Auto : OFF";
            this.renderBoard();
        });

        document.getElementById('btn-resign').addEventListener('click', () => {
            if (this.state !== "PLAYING") return;
            if (confirm("Êtes-vous sûr de vouloir abandonner la partie ?")) {
                const winnerColor = this.board.turn === 'b' ? 'n' : 'b';
                this.endGame(winnerColor, "abandon");
            }
        });

        document.getElementById('btn-draw').addEventListener('click', () => {
            if (this.state !== "PLAYING") return;
            
            const activePlayerName = this.getActivePlayerName();
            const oppPlayerName = this.getOpponentPlayerName();
            
            document.getElementById('draw-offer-text').textContent = `${activePlayerName} propose le match nul à ${oppPlayerName}. Acceptez-vous ?`;
            document.getElementById('draw-offer-overlay').classList.add('active');
        });

        document.getElementById('btn-accept-draw').addEventListener('click', () => {
            document.getElementById('draw-offer-overlay').classList.remove('active');
            this.endGame(null, "accord");
        });

        document.getElementById('btn-refuse-draw').addEventListener('click', () => {
            document.getElementById('draw-offer-overlay').classList.remove('active');
        });

        // Option Rejouer de l'overlay Game Over
        document.getElementById('btn-replay').addEventListener('click', () => {
            document.getElementById('game-over-overlay').classList.remove('active');
            // On inverse les couleurs pour la revanche !
            this.p1IsWhite = !this.p1IsWhite;
            this.startGame();
        });

        // Retour au menu principal
        document.getElementById('btn-back-menu').addEventListener('click', () => {
            document.getElementById('game-over-overlay').classList.remove('active');
            this.state = "MENU";
            this.updateView();
        });

        // Promotion Options
        const promoOptions = document.querySelectorAll('.promo-option');
        promoOptions.forEach(opt => {
            opt.addEventListener('click', (e) => {
                const choice = e.currentTarget.getAttribute('data-piece');
                this.executePromotion(choice);
            });
        });

        document.getElementById('btn-cancel-promotion').addEventListener('click', () => {
            this.cancelPromotion();
        });
    }

    startGame() {
        this.board = new Board();
        this.selectedSq = null;
        this.validMoves = [];
        this.moveHistory = [];
        
        // Initialiser les chronomètres
        if (this.selectedTimeLimit !== null) {
            this.timeP1 = this.selectedTimeLimit * 1000;
            this.timeP2 = this.selectedTimeLimit * 1000;
        } else {
            this.timeP1 = null;
            this.timeP2 = null;
        }
        
        this.state = "PLAYING";
        this.lastTickTime = Date.now();
        this.startTimer();
        this.updateView();
        this.soundManager.initAudioContext();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        if (this.selectedTimeLimit !== null) {
            this.timerInterval = setInterval(() => {
                if (this.state !== "PLAYING") return;
                
                const now = Date.now();
                const dt = now - this.lastTickTime;
                this.lastTickTime = now;
                
                // Déduire le temps du joueur actif
                const isP1Active = (this.board.turn === 'b' && this.p1IsWhite) || (this.board.turn === 'n' && !this.p1IsWhite);
                
                if (isP1Active) {
                    this.timeP1 = Math.max(0, this.timeP1 - dt);
                    if (this.timeP1 <= 0) {
                        this.endGame(this.p1IsWhite ? 'n' : 'b', "temps");
                    }
                } else {
                    this.timeP2 = Math.max(0, this.timeP2 - dt);
                    if (this.timeP2 <= 0) {
                        this.endGame(this.p1IsWhite ? 'b' : 'n', "temps");
                    }
                }
                
                this.renderTimers();
            }, 100);
        }
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateView() {
        // Gérer l'affichage des sections principales
        const menu = document.getElementById('menu-view');
        const game = document.getElementById('game-view');

        if (this.state === "MENU") {
            this.stopTimer();
            menu.classList.add('active');
            game.classList.remove('active');
        } else {
            menu.classList.remove('active');
            game.classList.add('active');
            this.renderLayout();
            this.renderBoard();
            this.renderTimers();
            this.renderHistory();
        }
    }

    renderLayout() {
        // Noms et scores dans la barre du haut/bas
        const p1Name = this.player1Name;
        const p2Name = this.player2Name;
        const score1 = this.scoreP1.toFixed(1);
        const score2 = this.scoreP2.toFixed(1);

        // Assigner les éléments selon les couleurs courantes
        const whiteName = this.p1IsWhite ? p1Name : p2Name;
        const whiteScore = this.p1IsWhite ? score1 : score2;
        const blackName = this.p1IsWhite ? p2Name : p1Name;
        const blackScore = this.p1IsWhite ? score2 : score1;

        // Détecter qui est en haut et qui est en bas selon qui a le trait ou la rotation
        const isBlackTurn = this.board.turn === 'n';
        const shouldRotate = this.autoRotate && isBlackTurn;

        const currIndicator = document.getElementById('curr-color-indicator');
        const currName = document.getElementById('curr-name-display');
        const currScore = document.getElementById('curr-score-display');
        
        const oppIndicator = document.getElementById('opp-color-indicator');
        const oppName = document.getElementById('opp-name-display');
        const oppScore = document.getElementById('opp-score-display');

        if (shouldRotate) {
            // Vue inversée : Les noirs en bas
            currIndicator.className = "player-color-dot black-dot";
            currName.textContent = blackName;
            currScore.textContent = `(${blackScore})`;

            oppIndicator.className = "player-color-dot white-dot";
            oppName.textContent = whiteName;
            oppScore.textContent = `(${whiteScore})`;
        } else {
            // Vue standard : Les blancs en bas
            currIndicator.className = "player-color-dot white-dot";
            currName.textContent = whiteName;
            currScore.textContent = `(${whiteScore})`;

            oppIndicator.className = "player-color-dot black-dot";
            oppName.textContent = blackName;
            oppScore.textContent = `(${blackScore})`;
        }

        this.updateIndicators();
    }

    updateIndicators() {
        const turnDisplay = document.getElementById('turn-display');
        const activeName = this.getActivePlayerName();
        turnDisplay.textContent = `Trait aux ${this.board.turn === 'b' ? 'Blancs' : 'Noirs'} (${activeName})`;
        
        // Activer la bordure lumineuse sur le chronomètre du joueur actif
        const isBlackTurn = this.board.turn === 'n';
        const shouldRotate = this.autoRotate && isBlackTurn;

        const currTimerEl = document.getElementById('curr-timer');
        const oppTimerEl = document.getElementById('opp-timer');

        if (isBlackTurn) {
            if (shouldRotate) {
                currTimerEl.classList.add('active');
                oppTimerEl.classList.remove('active');
            } else {
                currTimerEl.classList.remove('active');
                oppTimerEl.classList.add('active');
            }
        } else {
            if (shouldRotate) {
                currTimerEl.classList.remove('active');
                oppTimerEl.classList.add('active');
            } else {
                currTimerEl.classList.add('active');
                oppTimerEl.classList.remove('active');
            }
        }
    }

    renderTimers() {
        const isBlackTurn = this.board.turn === 'n';
        const shouldRotate = this.autoRotate && isBlackTurn;

        const currTimerEl = document.getElementById('curr-timer');
        const oppTimerEl = document.getElementById('opp-timer');

        if (this.selectedTimeLimit === null) {
            currTimerEl.textContent = "Amical";
            oppTimerEl.textContent = "Amical";
            return;
        }

        const whiteTime = this.p1IsWhite ? this.timeP1 : this.timeP2;
        const blackTime = this.p1IsWhite ? this.timeP2 : this.timeP1;

        const formatTime = (ms) => {
            const totalSec = Math.ceil(ms / 1000);
            const m = Math.floor(totalSec / 60);
            const s = totalSec % 60;
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        const tCurr = shouldRotate ? blackTime : whiteTime;
        const tOpp = shouldRotate ? whiteTime : blackTime;

        currTimerEl.textContent = formatTime(tCurr);
        oppTimerEl.textContent = formatTime(tOpp);

        // Alerte temps faible (< 15 secondes)
        if (tCurr < 15000) {
            currTimerEl.classList.add('low-time');
        } else {
            currTimerEl.classList.remove('low-time');
        }

        if (tOpp < 15000) {
            oppTimerEl.classList.add('low-time');
        } else {
            oppTimerEl.classList.remove('low-time');
        }
    }

    renderBoard() {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = "";

        const isBlackTurn = this.board.turn === 'n';
        const shouldRotate = this.autoRotate && isBlackTurn;

        // Détection de la case du Roi en échec
        let checkSquare = null;
        if (this.board.isInCheck(this.board.turn)) {
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (this.board.grid[r][c] === `r${this.board.turn}`) {
                        checkSquare = { r, c };
                        break;
                    }
                }
                if (checkSquare) break;
            }
        }

        // Dernier coup joué à mettre en surbrillance
        let lastMoveStart = null;
        let lastMoveEnd = null;
        if (this.moveHistory.length > 0) {
            const lastMoveObj = this.moveHistory[this.moveHistory.length - 1];
            if (lastMoveObj.start && lastMoveObj.end) {
                lastMoveStart = lastMoveObj.start;
                lastMoveEnd = lastMoveObj.end;
            }
        }

        // Parcours du plateau de jeu (inversé si rotation activée)
        for (let ri = 0; ri < ROWS; ri++) {
            for (let ci = 0; ci < COLS; ci++) {
                const r = shouldRotate ? 7 - ri : ri;
                const c = shouldRotate ? 7 - ci : ci;

                const piece = this.board.grid[r][c];
                const squareEl = document.createElement('div');
                squareEl.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
                squareEl.dataset.row = r;
                squareEl.dataset.col = c;

                // Application des états de surbrillance
                if (this.selectedSq && this.selectedSq.r === r && this.selectedSq.c === c) {
                    squareEl.classList.add('selected');
                }

                if (checkSquare && checkSquare.r === r && checkSquare.c === c) {
                    squareEl.classList.add('in-check');
                }

                if ((lastMoveStart && lastMoveStart.r === r && lastMoveStart.c === c) || 
                    (lastMoveEnd && lastMoveEnd.r === r && lastMoveEnd.c === c)) {
                    squareEl.classList.add('last-move');
                }

                // Insertion de la pièce
                if (piece !== "") {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = "piece";
                    if (this.selectedSq && this.selectedSq.r === r && this.selectedSq.c === c) {
                        pieceEl.classList.add('selected-piece');
                    }
                    pieceEl.innerHTML = PIECE_SVGS[piece[0]](piece[1]);
                    squareEl.appendChild(pieceEl);
                }

                // Affichage des aides de mouvement
                const isHint = this.validMoves.some(m => m.r === r && m.c === c);
                if (isHint) {
                    const hasPiece = piece !== "";
                    const isEnPassant = this.board.enPassantTarget && 
                                      r === this.board.enPassantTarget.r && 
                                      c === this.board.enPassantTarget.c &&
                                      this.board.grid[startPieceRow(this.selectedSq)][this.selectedSq.c][0] === 'p';
                    
                    if (hasPiece || isEnPassant) {
                        const capHint = document.createElement('div');
                        capHint.className = "capture-hint";
                        squareEl.appendChild(capHint);
                    } else {
                        const moveHint = document.createElement('div');
                        moveHint.className = "move-hint";
                        squareEl.appendChild(moveHint);
                    }
                }

                // Événement clic
                squareEl.addEventListener('click', () => this.handleSquareClick(r, c));

                boardEl.appendChild(squareEl);
            }
        }

        function startPieceRow(sq) { return sq ? sq.r : 0; }
    }

    handleSquareClick(r, c) {
        if (this.state !== "PLAYING") return;

        const piece = this.board.getPiece(r, c);

        if (this.selectedSq) {
            const isTargetInMoves = this.validMoves.some(m => m.r === r && m.c === c);

            if (isTargetInMoves) {
                // Vérifier si promotion
                const activePiece = this.board.grid[this.selectedSq.r][this.selectedSq.c];
                const isPawn = activePiece[0] === 'p';
                const isPromoRow = (activePiece[1] === 'b' && r === 0) || (activePiece[1] === 'n' && r === 7);

                if (isPawn && isPromoRow) {
                    this.openPromotionModal(this.selectedSq, {r, c}, activePiece[1]);
                    return;
                }

                this.executeMove(this.selectedSq, {r, c});
            } else {
                // Cliquer sur une autre pièce alliée change la sélection
                if (piece !== "" && piece[1] === this.board.turn) {
                    this.selectedSq = { r, c };
                    this.validMoves = this.board.getValidMoves(this.selectedSq);
                } else {
                    // Clic dans le vide annule la sélection
                    this.selectedSq = null;
                    this.validMoves = [];
                }
                this.renderBoard();
            }
        } else {
            // Sélection initiale
            if (piece !== "" && piece[1] === this.board.turn) {
                this.selectedSq = { r, c };
                this.validMoves = this.board.getValidMoves(this.selectedSq);
                this.renderBoard();
            }
        }
    }

    executeMove(start, end, promotionChoice = 'd') {
        const piece = this.board.grid[start.r][start.c];
        const isCapture = this.board.grid[end.r][end.c] !== "" || 
            (piece[0] === 'p' && this.board.enPassantTarget && end.r === this.board.enPassantTarget.r && end.c === this.board.enPassantTarget.c);
        
        // Générer la notation algébrique avant d'appliquer le coup
        const notation = this.getAlgebraicNotation(start, end, piece, isCapture, promotionChoice);

        // Appliquer le coup dans le moteur
        const moveInfo = this.board.movePiece(start, end, promotionChoice);

        if (moveInfo && moveInfo.success) {
            // Enregistrer l'historique
            moveInfo.notation = notation;
            this.moveHistory.push({
                notation: notation,
                start: start,
                end: end
            });

            // Sons en fonction des actions
            if (moveInfo.checkmate) {
                this.soundManager.play('game_over');
            } else if (moveInfo.check) {
                this.soundManager.play('check');
            } else if (moveInfo.castle) {
                this.soundManager.play('castle');
            } else if (moveInfo.capture) {
                this.soundManager.play('capture');
            } else {
                this.soundManager.play('move');
            }

            // Gestion de l'incrément de temps
            if (this.selectedTimeLimit !== null && this.selectedIncrement > 0) {
                const isP1JustPlayed = (this.board.turn === 'n' && this.p1IsWhite) || (this.board.turn === 'b' && !this.p1IsWhite);
                if (isP1JustPlayed) {
                    this.timeP1 += this.selectedIncrement * 1000;
                } else {
                    this.timeP2 += this.selectedIncrement * 1000;
                }
            }

            // Reset sélection
            this.selectedSq = null;
            this.validMoves = [];
            
            // Sync du temps de base
            this.lastTickTime = Date.now();

            if (moveInfo.checkmate) {
                const winnerColor = this.board.turn === 'b' ? 'n' : 'b';
                this.endGame(winnerColor, "mat");
            } else if (moveInfo.draw) {
                this.endGame(null, moveInfo.drawReason);
            } else {
                this.renderLayout();
                this.renderBoard();
                this.renderTimers();
                this.renderHistory();
            }
        }
    }

    getAlgebraicNotation(start, end, piece, isCapture, promoChoice) {
        const type = piece[0];
        
        // Cas du Roque
        if (type === 'r' && Math.abs(start.c - end.c) === 2) {
            return end.c > start.c ? "O-O" : "O-O-O";
        }

        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

        const pieceSymbol = PIECE_SYMBOLS[type];
        const endSquare = `${files[end.c]}${ranks[end.r]}`;

        let notation = "";

        if (type === 'p') {
            if (isCapture) {
                notation += files[start.c] + "x";
            }
            notation += endSquare;
            if ((piece[1] === 'b' && end.r === 0) || (piece[1] === 'n' && end.r === 7)) {
                notation += "=" + PIECE_SYMBOLS[promoChoice];
            }
        } else {
            notation += pieceSymbol;
            notation += this.getDisambiguation(start, end, type, piece[1]);
            if (isCapture) {
                notation += "x";
            }
            notation += endSquare;
        }

        // Les suffixes '+' et '#' seront ajoutés après avoir validé l'état du coup
        // On effectue une simulation rapide pour le suffixe
        const originalTarget = this.board.grid[end.r][end.c];
        let epSquare = null;
        let epPiece = "";
        const isEp = type === 'p' && this.board.enPassantTarget && end.r === this.board.enPassantTarget.r && end.c === this.board.enPassantTarget.c;
        if (isEp) {
            const dir = piece[1] === 'b' ? -1 : 1;
            epSquare = { r: end.r - dir, c: end.c };
            epPiece = this.board.grid[epSquare.r][epSquare.c];
            this.board.grid[epSquare.r][epSquare.c] = "";
        }

        const isCastle = type === 'r' && Math.abs(start.c - end.c) === 2;
        let rookStart = null;
        let rookEnd = null;
        let rookPiece = "";
        if (isCastle) {
            if (end.c > start.c) { // Petit roque
                rookStart = { r: start.r, c: 7 };
                rookEnd = { r: start.r, c: 5 };
            } else { // Grand roque
                rookStart = { r: start.r, c: 0 };
                rookEnd = { r: start.r, c: 3 };
            }
            rookPiece = this.board.grid[rookStart.r][rookStart.c];
            this.board.grid[rookEnd.r][rookEnd.c] = rookPiece;
            this.board.grid[rookStart.r][rookStart.c] = "";
        }

        this.board.grid[end.r][end.c] = piece;
        this.board.grid[start.r][start.c] = "";

        const nextTurn = piece[1] === 'b' ? 'n' : 'b';
        if (this.board.isInCheck(nextTurn)) {
            if (this.board.isCheckmate(nextTurn)) {
                notation += "#";
            } else {
                notation += "+";
            }
        }

        // Rétablir
        this.board.grid[start.r][start.c] = piece;
        this.board.grid[end.r][end.c] = originalTarget;
        if (isEp && epSquare) {
            this.board.grid[epSquare.r][epSquare.c] = epPiece;
        }
        if (isCastle && rookStart && rookEnd) {
            this.board.grid[rookStart.r][rookStart.c] = rookPiece;
            this.board.grid[rookEnd.r][rookEnd.c] = "";
        }

        return notation;
    }

    getDisambiguation(start, end, type, color) {
        let sameTypePieces = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (r === start.r && c === start.c) continue;
                const p = this.board.grid[r][c];
                if (p === `${type}${color}`) {
                    sameTypePieces.push({ r, c });
                }
            }
        }

        // Filtrer celles qui peuvent bouger sur la même case de destination
        const competitors = sameTypePieces.filter(pos => this.board.isValidMoveInternal(pos, end) && !this.board.leavesKingInCheck(pos, end));

        if (competitors.length === 0) return "";

        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

        // Si elles n'ont pas la même colonne
        const diffCol = competitors.every(pos => pos.c !== start.c);
        if (diffCol) {
            return files[start.c];
        }

        // Si elles ont la même colonne mais pas la même ligne
        const diffRow = competitors.every(pos => pos.r !== start.r);
        if (diffRow) {
            return ranks[start.r];
        }

        // Sinon les deux
        return `${files[start.c]}${ranks[start.r]}`;
    }

    openPromotionModal(start, end, color) {
        this.waitingPromotionMove = { start, end };
        
        // Mettre à jour l'apparence des options avec la bonne couleur de pièce
        const options = document.querySelectorAll('.promo-option');
        options.forEach(opt => {
            const type = opt.getAttribute('data-piece');
            opt.innerHTML = PIECE_SVGS[type](color);
        });

        document.getElementById('promotion-overlay').classList.add('active');
    }

    executePromotion(choice) {
        document.getElementById('promotion-overlay').classList.remove('active');
        if (this.waitingPromotionMove) {
            const { start, end } = this.waitingPromotionMove;
            this.waitingPromotionMove = null;
            this.executeMove(start, end, choice);
        }
    }

    cancelPromotion() {
        document.getElementById('promotion-overlay').classList.remove('active');
        this.waitingPromotionMove = null;
        this.selectedSq = null;
        this.validMoves = [];
        this.renderBoard();
    }

    renderHistory() {
        const historyEl = document.getElementById('move-history');
        historyEl.innerHTML = "";

        if (this.moveHistory.length === 0) {
            historyEl.innerHTML = `<div class="empty-history">Aucun coup joué</div>`;
            return;
        }

        let rowEl = null;
        this.moveHistory.forEach((moveObj, index) => {
            if (index % 2 === 0) {
                // Créer une nouvelle ligne
                rowEl = document.createElement('div');
                rowEl.className = "move-row";
                
                const numEl = document.createElement('span');
                numEl.className = "move-num";
                numEl.textContent = `${Math.floor(index / 2) + 1}.`;
                rowEl.appendChild(numEl);

                const whiteMoveEl = document.createElement('span');
                whiteMoveEl.className = "move-white";
                whiteMoveEl.textContent = moveObj.notation;
                rowEl.appendChild(whiteMoveEl);
                
                historyEl.appendChild(rowEl);
            } else {
                const blackMoveEl = document.createElement('span');
                blackMoveEl.className = "move-black";
                blackMoveEl.textContent = moveObj.notation;
                rowEl.appendChild(blackMoveEl);
            }
        });

        // Scroll vers le bas automatiquement
        historyEl.scrollTop = historyEl.scrollHeight;
    }

    endGame(winnerColor, reason) {
        this.state = "GAME_OVER";
        this.stopTimer();
        this.selectedSq = null;
        this.validMoves = [];

        this.soundManager.play('game_over');

        // Mettre à jour les scores cumulés
        if (winnerColor === 'b') {
            if (this.p1IsWhite) this.scoreP1 += 1.0;
            else this.scoreP2 += 1.0;
        } else if (winnerColor === 'n') {
            if (this.p1IsWhite) this.scoreP2 += 1.0;
            else this.scoreP1 += 1.0;
        } else {
            // Nulle
            this.scoreP1 += 0.5;
            this.scoreP2 += 0.5;
        }

        // Mettre à jour l'affichage de la boîte finale
        const titleEl = document.getElementById('game-over-title');
        const resultEl = document.getElementById('game-over-result');
        const reasonEl = document.getElementById('game-over-reason');

        if (winnerColor) {
            const winnerName = (winnerColor === 'b' && this.p1IsWhite) || (winnerColor === 'n' && !this.p1IsWhite) 
                ? this.player1Name 
                : this.player2Name;
            
            titleEl.textContent = "VICTOIRE";
            resultEl.textContent = `${winnerName} gagne !`;
            resultEl.style.color = "var(--color-primary-hover)";
        } else {
            titleEl.textContent = "MATCH NUL";
            resultEl.textContent = "Égalité !";
            resultEl.style.color = "var(--text-secondary)";
        }

        let reasonStr = "";
        switch (reason) {
            case "mat": reasonStr = "Par échec et mat."; break;
            case "abandon": reasonStr = "Par abandon de l'adversaire."; break;
            case "temps": reasonStr = "Au temps (chronomètre écoulé)."; break;
            case "pat": reasonStr = "Par Pat (stalemate)."; break;
            case "accord": reasonStr = "Par accord mutuel."; break;
            case "repetition": reasonStr = "Par triple répétition de la position."; break;
            case "materiel": reasonStr = "Par manque de matériel de mat."; break;
            case "50coups": reasonStr = "Par la règle des 50 coups sans capture ni pion."; break;
        }
        reasonEl.textContent = reasonStr;

        // Ouvrir l'overlay
        document.getElementById('game-over-overlay').classList.add('active');
        this.renderLayout(); // rafraîchir les scores affichés
    }

    getActivePlayerName() {
        if (this.board.turn === 'b') {
            return this.p1IsWhite ? this.player1Name : this.player2Name;
        } else {
            return this.p1IsWhite ? this.player2Name : this.player1Name;
        }
    }

    getOpponentPlayerName() {
        if (this.board.turn === 'b') {
            return this.p1IsWhite ? this.player2Name : this.player1Name;
        } else {
            return this.p1IsWhite ? this.player1Name : this.player2Name;
        }
    }
}
