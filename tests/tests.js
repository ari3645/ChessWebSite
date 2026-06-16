import { Board } from '../src/board.js';
import { GameController } from '../src/gameController.js';
import { ROWS, COLS } from '../src/constants.js';

// Assertions simple
class Assert {
    static equals(actual, expected, message = "") {
        if (actual !== expected) {
            throw new Error(message || `Attendu : ${expected}, obtenu : ${actual}`);
        }
    }
    
    static deepEquals(actual, expected, message = "") {
        const aStr = JSON.stringify(actual);
        const eStr = JSON.stringify(expected);
        if (aStr !== eStr) {
            throw new Error(message || `Attendu : ${eStr}, obtenu : ${aStr}`);
        }
    }

    static isTrue(val, message = "") {
        if (val !== true) {
            throw new Error(message || `Attendu true, obtenu : ${val}`);
        }
    }

    static isFalse(val, message = "") {
        if (val !== false) {
            throw new Error(message || `Attendu false, obtenu : ${val}`);
        }
    }

    static isNull(val, message = "") {
        if (val !== null) {
            throw new Error(message || `Attendu null, obtenu : ${val}`);
        }
    }

    static isNotNull(val, message = "") {
        if (val === null) {
            throw new Error(message || `Attendu non-null value`);
        }
    }
}

// Suite de tests
export const tests = {
    // -------------------------------------------------------------
    // CATEGORY: Configuration Initiale
    // -------------------------------------------------------------
    "Configuration Initiale": {
        "test_initial_setup": () => {
            const board = new Board();
            // Trait initial
            Assert.equals(board.turn, 'b', "Le trait doit être aux Blancs ('b')");
            Assert.isNull(board.enPassantTarget, "Pas de cible en passant initiale");
            Assert.equals(board.halfMoveClock, 0, "Horloge des 50 coups initiale doit être à 0");

            // Placement des Blancs
            Assert.equals(board.grid[7][0], "tb"); Assert.equals(board.grid[7][1], "cb");
            Assert.equals(board.grid[7][2], "fb"); Assert.equals(board.grid[7][3], "db");
            Assert.equals(board.grid[7][4], "rb"); Assert.equals(board.grid[7][5], "fb");
            Assert.equals(board.grid[7][6], "cb"); Assert.equals(board.grid[7][7], "tb");
            for (let c = 0; c < 8; c++) {
                Assert.equals(board.grid[6][c], "pb", `Le pion blanc en colonne ${c} n'est pas placé`);
            }

            // Placement des Noirs
            Assert.equals(board.grid[0][0], "tn"); Assert.equals(board.grid[0][1], "cn");
            Assert.equals(board.grid[0][2], "fn"); Assert.equals(board.grid[0][3], "dn");
            Assert.equals(board.grid[0][4], "rn"); Assert.equals(board.grid[0][5], "fn");
            Assert.equals(board.grid[0][6], "cn"); Assert.equals(board.grid[0][7], "tn");
            for (let c = 0; c < 8; c++) {
                Assert.equals(board.grid[1][c], "pn", `Le pion noir en colonne ${c} n'est pas placé`);
            }

            // Cases vides au milieu
            for (let r = 2; r < 6; r++) {
                for (let c = 0; c < 8; c++) {
                    Assert.equals(board.grid[r][c], "", `La case (${r}, ${c}) devrait être vide`);
                }
            }
        }
    },

    // -------------------------------------------------------------
    // CATEGORY: Mouvements et Captures de Base
    // -------------------------------------------------------------
    "Mouvements de Base": {
        "test_pawn_move": () => {
            const board = new Board();
            // Avancée double
            Assert.isTrue(board.isValidMove({ r: 6, c: 4 }, { r: 4, c: 4 }), "e2-e4 devrait être valide au premier coup");
            
            const moveInfo = board.movePiece({ r: 6, c: 4 }, { r: 4, c: 4 });
            Assert.isNotNull(moveInfo, "Le déplacement e2-e4 a échoué");
            Assert.equals(board.grid[6][4], "", "La case e2 doit être vide après le déplacement");
            Assert.equals(board.grid[4][4], "pb", "Le pion blanc doit être en e4");
            Assert.equals(board.turn, 'n', "Le trait doit passer aux Noirs");
            Assert.deepEquals(board.enPassantTarget, { r: 5, c: 4 }, "Cible en passant attendue en e3");
        },

        "test_pawn_capture": () => {
            const board = new Board();
            // Setup position de capture
            board.grid[5][3] = "pn"; // Pion noir en d3
            board.grid[6][4] = "pb"; // Pion blanc en e2
            board.turn = 'b';

            // Diagonale : OK
            Assert.isTrue(board.isValidMove({ r: 6, c: 4 }, { r: 5, c: 3 }), "Capture en diagonale devrait être valide");
            // Verticale bloquée par pièce adverse
            board.grid[5][4] = "pn"; // Bloque e3
            Assert.isFalse(board.isValidMove({ r: 6, c: 4 }, { r: 5, c: 4 }), "Le pion ne devrait pas pouvoir avancer sur une pièce");
        },

        "test_invalid_turn": () => {
            const board = new Board();
            Assert.equals(board.turn, 'b');
            // Essayer de déplacer un pion noir au premier tour
            Assert.isFalse(board.isValidMove({ r: 1, c: 4 }, { r: 2, c: 4 }), "Impossible de déplacer une pièce noire quand c'est le tour des Blancs");
        },

        "test_piece_blocking": () => {
            const board = new Board();
            // Tour bloquée par son propre pion
            Assert.isFalse(board.isValidMove({ r: 7, c: 0 }, { r: 5, c: 0 }), "La tour a1 ne peut pas sauter le pion a2");
        },

        "test_knight_jump": () => {
            const board = new Board();
            // Cavalier saute ses propres pions
            Assert.isTrue(board.isValidMove({ r: 7, c: 1 }, { r: 5, c: 2 }), "Le cavalier b1 doit pouvoir sauter en c3");
        },

        "test_move_invalid_start_empty": () => {
            const board = new Board();
            Assert.isFalse(board.isValidMove({ r: 4, c: 4 }, { r: 5, c: 4 }), "Impossible de jouer un coup depuis une case vide");
        },

        "test_move_invalid_target_own_piece": () => {
            const board = new Board();
            // Tour en a1 veut capturer cavalier en b1
            Assert.isFalse(board.isValidMove({ r: 7, c: 0 }, { r: 7, c: 1 }), "Impossible de capturer sa propre pièce");
        },

        "test_move_not_in_valid_moves": () => {
            const board = new Board();
            // Tour en a1 veut se déplacer en diagonale en b2
            Assert.isFalse(board.isValidMove({ r: 7, c: 0 }, { r: 6, c: 1 }), "Coup non conforme aux déplacements de la Tour");
        }
    },

    // -------------------------------------------------------------
    // CATEGORY: Coups Spéciaux
    // -------------------------------------------------------------
    "Coups Spéciaux": {
        "test_en_passant": () => {
            const board = new Board();
            // Configuration
            board.grid[3][4] = "pb"; // Pion blanc en e5
            board.grid[1][5] = "pn"; // Pion noir en f7
            board.grid[6][4] = "";   // Vider e2
            board.turn = 'n';

            // Avancée double noire
            const moveInfo1 = board.movePiece({ r: 1, c: 5 }, { r: 3, c: 5 });
            Assert.isNotNull(moveInfo1);
            Assert.deepEquals(board.enPassantTarget, { r: 2, c: 5 }, "Cible en passant en f6");

            // Capture en passant blanche
            Assert.isTrue(board.isValidMove({ r: 3, c: 4 }, { r: 2, c: 5 }), "La prise en passant en f6 doit être valide");
            const moveInfo2 = board.movePiece({ r: 3, c: 4 }, { r: 2, c: 5 });
            Assert.isNotNull(moveInfo2);
            Assert.isTrue(moveInfo2.enPassant, "Le coup doit être marqué en passant");
            Assert.equals(board.grid[3][5], "", "Le pion noir capturé en passant en f5 doit être retiré");
        },

        "test_en_passant_persistence": () => {
            const board = new Board();
            board.grid[3][4] = "pb"; // Pion blanc en e5
            board.grid[1][5] = "pn"; // Pion noir en f7
            board.grid[6][4] = "";
            board.turn = 'n';

            // Avancée double noire
            board.movePiece({ r: 1, c: 5 }, { r: 3, c: 5 });
            
            // Blancs font autre chose (ex: bougent le cavalier)
            board.movePiece({ r: 7, c: 1 }, { r: 5, c: 2 });

            // Noirs font autre chose
            board.movePiece({ r: 1, c: 0 }, { r: 2, c: 0 });

            // Maintenant Blanc veut capturer en passant : doit échouer
            Assert.isFalse(board.isValidMove({ r: 3, c: 4 }, { r: 2, c: 5 }), "La prise en passant a expiré et ne doit plus être valide");
        },

        "test_promotion": () => {
            const board = new Board();
            board.grid[1][4] = "pb"; // Pion blanc en e7
            board.grid[0][4] = "";   // Vider e8
            board.turn = 'b';

            // Promotion Dame
            const moveInfo = board.movePiece({ r: 1, c: 4 }, { r: 0, c: 4 }, 'd');
            Assert.isNotNull(moveInfo);
            Assert.isTrue(moveInfo.promotion, "Le coup doit être identifié comme une promotion");
            Assert.equals(board.grid[0][4], "db", "Le pion promu en e8 doit être une dame blanche ('db')");
        },

        "test_promotion_capture": () => {
            const board = new Board();
            board.grid[1][4] = "pb"; // Pion blanc en e7
            board.grid[0][5] = "tn"; // Tour noire en f8
            board.turn = 'b';

            // Promotion avec capture
            const moveInfo = board.movePiece({ r: 1, c: 4 }, { r: 0, c: 5 }, 't');
            Assert.isNotNull(moveInfo);
            Assert.isTrue(moveInfo.capture, "Doit être une capture");
            Assert.isTrue(moveInfo.promotion, "Doit être une promotion");
            Assert.equals(board.grid[0][5], "tb", "Le pion promu en f8 après capture doit être une tour blanche ('tb')");
        }
    },

    // -------------------------------------------------------------
    // CATEGORY: Le Roque (Castling)
    // -------------------------------------------------------------
    "Le Roque": {
        "test_castling_queenside": () => {
            const board = new Board();
            // Vider l'aile dame
            board.grid[7][1] = ""; // Cavalier b1
            board.grid[7][2] = ""; // Fou c1
            board.grid[7][3] = ""; // Dame d1
            board.turn = 'b';

            Assert.isTrue(board.isValidMove({ r: 7, c: 4 }, { r: 7, c: 2 }), "Le grand roque blanc doit être valide");
            const moveInfo = board.movePiece({ r: 7, c: 4 }, { r: 7, c: 2 });
            Assert.isNotNull(moveInfo);
            Assert.isTrue(moveInfo.castle, "Le coup doit être marqué comme roque");
            Assert.equals(board.grid[7][2], "rb", "Le roi doit être en c1");
            Assert.equals(board.grid[7][3], "tb", "La tour doit être en d1");
        },

        "test_castling_restrictions": () => {
            const board = new Board();
            // Vider l'aile roi
            board.grid[7][5] = ""; // Fou f1
            board.grid[7][6] = ""; // Cavalier g1
            board.turn = 'b';

            // 1. King moved
            board.movedStatus["7,4"] = true;
            Assert.isFalse(board.isValidMove({ r: 7, c: 4 }, { r: 7, c: 6 }), "Roque interdit si le roi a bougé");
            
            // Reset et 2. Tour bougée
            board.movedStatus["7,4"] = false;
            board.movedStatus["7,7"] = true;
            Assert.isFalse(board.isValidMove({ r: 7, c: 4 }, { r: 7, c: 6 }), "Roque interdit si la tour a bougé");

            // Reset et 3. Bloqué
            board.movedStatus["7,7"] = false;
            board.grid[7][5] = "fb"; // Remettre le fou f1
            Assert.isFalse(board.isValidMove({ r: 7, c: 4 }, { r: 7, c: 6 }), "Roque interdit s'il y a un obstacle");
        },

        "test_castling_out_of_check_complete": () => {
            const board = new Board();
            board.grid[7][5] = ""; // f1 vide
            board.grid[7][6] = ""; // g1 vide
            board.grid[6][4] = ""; // e2 vide (libère la ligne pour l'échec)
            // Mettre le Roi blanc en échec via une tour noire en e5
            board.grid[4][4] = "tn";
            board.turn = 'b';

            Assert.isTrue(board.isInCheck('b'), "Le roi doit être en échec");
            Assert.isFalse(board.isValidMove({ r: 7, c: 4 }, { r: 7, c: 6 }), "Roque interdit si le roi est en échec");
        },

        "test_castling_through_check": () => {
            const board = new Board();
            board.grid[7][5] = ""; // f1 vide
            board.grid[7][6] = ""; // g1 vide
            board.grid[6][5] = ""; // f2 vide (libère la ligne de passage f1)
            // Tour noire en f5 contrôlant f1 (case de passage)
            board.grid[4][5] = "tn";
            board.turn = 'b';

            Assert.isFalse(board.isValidMove({ r: 7, c: 4 }, { r: 7, c: 6 }), "Roque interdit si le roi doit traverser une case contrôlée");
        },

        "test_castling_into_check": () => {
            const board = new Board();
            board.grid[7][5] = ""; // f1 vide
            board.grid[7][6] = ""; // g1 vide
            board.grid[6][6] = ""; // g2 vide (libère la ligne de destination g1)
            // Tour noire en g5 contrôlant g1 (case de destination)
            board.grid[4][6] = "tn";
            board.turn = 'b';

            // Pour vérifier si le coup est légal, on vérifie s'il figure dans les coups possibles (getValidMoves)
            const validMoves = board.getValidMoves({ r: 7, c: 4 });
            const canCastle = validMoves.some(m => m.r === 7 && m.c === 6);
            Assert.isFalse(canCastle, "Roque interdit si le roi atterrit sur une case contrôlée");
        }
    },

    // -------------------------------------------------------------
    // CATEGORY: Échec et Menaces
    // -------------------------------------------------------------
    "Échecs et Menaces": {
        "test_leaves_king_in_check": () => {
            const board = new Board();
            // e1 (Roi blanc), e2 (Dame blanche), e5 (Tour noire). La Dame est clouée.
            board.grid[7][4] = "rb";
            board.grid[6][4] = "db";
            board.grid[3][4] = "tn";
            board.grid[6][3] = ""; // Libère d2 (pour que le coup ne soit pas bloqué par le pion blanc d2 par défaut)
            board.turn = 'b';

            // Tenter de bouger la Dame blanche en d2 (brise le clouage).
            // Le coup est physiquement possible (pseudo-légal) mais illégal car il laisse le roi en échec.
            const validMoves = board.getValidMoves({ r: 6, c: 4 });
            const canMoveToD2 = validMoves.some(m => m.r === 6 && m.c === 3);
            Assert.isFalse(canMoveToD2, "Déplacement illégal car il laisse le Roi en échec");
        },

        "test_discovered_check": () => {
            const board = new Board();
            // e1 (Roi noir), e7 (Cavalier blanc), e8 (Tour blanche). Le cavalier fait écran.
            board.grid[0][4] = "rn"; // Roi noir
            board.grid[1][4] = "cb"; // Cavalier blanc
            board.grid[2][4] = "tb"; // Tour blanche
            board.turn = 'b';

            // Bouger le cavalier blanc (découvre l'échec de la tour)
            board.movePiece({ r: 1, c: 4 }, { r: 3, c: 5 });
            Assert.isTrue(board.isInCheck('n'), "Le roi noir doit être en échec à la découverte");
        },

        "test_double_check": () => {
            const board = new Board();
            // e1 (Roi noir), f3 (Fou blanc), d2 (Cavalier blanc)
            // On positionne pour qu'un saut de cavalier donne échec par le cavalier ET le fou.
            board.grid[0][4] = "rn"; // Roi noir en e8
            board.grid[2][2] = "fb"; // Fou blanc en c6 (pointe sur e8 si d7 est vide)
            board.grid[1][3] = "cb"; // Cavalier blanc en d7 (bloque c6-e8)
            board.turn = 'b';

            // Déplacer le cavalier en f6 (donne échec, et démasque le fou c6)
            board.movePiece({ r: 1, c: 3 }, { r: 2, c: 5 });
            
            Assert.isTrue(board.isInCheck('n'), "Le roi doit être en échec");
            // Vérifier que c'est bien un échec double
            let attackCount = 0;
            const kingPos = { r: 0, c: 4 };
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const p = board.grid[r][c];
                    if (p !== "" && p[1] === 'b') {
                        if (board.canAttack({ r, c }, kingPos)) attackCount++;
                    }
                }
            }
            Assert.equals(attackCount, 2, "Deux pièces blanches doivent attaquer le roi en même temps (échec double)");
        }
    },

    // -------------------------------------------------------------
    // CATEGORY: Fin de Partie (Nulles et Mats)
    // -------------------------------------------------------------
    "Fin de Partie (Nulles)": {
        "test_stalemate": () => {
            const board = new Board();
            // Vider la grille
            for (let r = 0; r < 8; r++) board.grid[r].fill("");
            
            // Position de pat
            board.grid[0][0] = "rn"; // Roi noir en a8
            board.grid[2][1] = "rb"; // Roi blanc en b6
            board.grid[1][2] = "db"; // Dame blanche en c7
            board.turn = 'n';

            Assert.isFalse(board.isInCheck('n'), "Le roi noir ne doit pas être en échec");
            Assert.isTrue(board.isStalemate('n'), "La position doit être déclarée Pat");
        },

        "test_threefold_repetition": () => {
            const board = new Board();
            // Répéter 3 fois les mêmes coups
            // Cavalier b1-c3 / Cavalier g8-f6 puis retour
            for (let i = 0; i < 2; i++) {
                board.movePiece({ r: 7, c: 1 }, { r: 5, c: 2 }); // Cb1-c3
                board.movePiece({ r: 0, c: 6 }, { r: 2, c: 5 }); // Cg8-f6
                board.movePiece({ r: 5, c: 2 }, { r: 7, c: 1 }); // Cc3-b1
                board.movePiece({ r: 2, c: 5 }, { r: 0, c: 6 }); // Cf6-g8
            }
            
            // 3ème occurrence
            board.movePiece({ r: 7, c: 1 }, { r: 5, c: 2 });
            board.movePiece({ r: 0, c: 6 }, { r: 2, c: 5 });
            
            Assert.isTrue(board.isThreefoldRepetition(), "La position doit être nulle par triple répétition");
        },

        "test_insufficient_material": () => {
            const board = new Board();
            for (let r = 0; r < 8; r++) board.grid[r].fill("");
            
            // Rois seuls
            board.grid[7][4] = "rb";
            board.grid[0][4] = "rn";
            Assert.isTrue(board.isInsufficientMaterial(), "Roi vs Roi est nul");

            // Roi et fou vs Roi
            board.grid[7][2] = "fb";
            Assert.isTrue(board.isInsufficientMaterial(), "Roi + Fou vs Roi est nul");

            // Roi et Cavalier vs Roi
            board.grid[7][2] = "";
            board.grid[7][1] = "cb";
            Assert.isTrue(board.isInsufficientMaterial(), "Roi + Cavalier vs Roi est nul");
        },

        "test_fifty_move_rule": () => {
            const board = new Board();
            board.halfMoveClock = 100;
            Assert.isTrue(board.isFiftyMoveRule(), "La règle des 50 coups (100 demi-coups) doit s'appliquer");
        },

        "test_fifty_move_rule_reset": () => {
            const board = new Board();
            board.halfMoveClock = 99;
            
            // Avancer un pion réinitialise l'horloge
            board.movePiece({ r: 6, c: 4 }, { r: 5, c: 4 });
            Assert.equals(board.halfMoveClock, 0, "L'avancée de pion doit réinitialiser l'horloge des 50 coups");
        }
    },

    // -------------------------------------------------------------
    // CATEGORY: Améliorations Récentes (Ajouts Web)
    // -------------------------------------------------------------
    "Améliorations Récentes": {
        "test_castling_rights_revocation_on_rook_capture": () => {
            const board = new Board();
            // e1 (Roi blanc), h1 (Tour blanche). Ailes ouvertes
            board.grid[7][5] = ""; // f1 vide
            board.grid[7][6] = ""; // g1 vide
            
            // Tour noire en h8 (0,7)
            board.grid[0][7] = "tn";
            
            // Vider les pions sur la colonne h pour permettre le mouvement vertical de la tour noire
            board.grid[1][7] = ""; // h7 vide
            board.grid[6][7] = ""; // h2 vide
            
            board.turn = 'n';

            // Tour noire prend Tour blanche en h1 (0,7 -> 7,7)
            const moveInfo = board.movePiece({ r: 0, c: 7 }, { r: 7, c: 7 });
            Assert.isNotNull(moveInfo);
            Assert.isTrue(moveInfo.capture, "La tour blanche doit être capturée");

            // Même si le Roi blanc n'a jamais bougé, ses droits de roque sur l'aile roi ("7,7")
            // doivent être révoqués car la tour correspondante a été détruite !
            Assert.isTrue(board.movedStatus["7,7"], "Le droit de roque de la tour capturée doit être révoqué");
            
            // Mettre le tour aux Blancs et vérifier s'ils peuvent roquer aile Roi
            board.turn = 'b';
            Assert.isFalse(board.isValidMove({ r: 7, c: 4 }, { r: 7, c: 6 }), "Le roque doit être impossible après capture de la Tour");
        },

        "test_pgn_translation": () => {
            // Création d'une instance pour tester les méthodes de traduction
            const controller = new GameController();
            
            // Cavalier
            Assert.equals(controller.translateFrenchToEnglish("Cf3"), "Nf3");
            Assert.equals(controller.translateFrenchToEnglish("Cxf3"), "Nxf3");
            
            // Roi
            Assert.equals(controller.translateFrenchToEnglish("Rxe2"), "Kxe2");
            
            // Tour
            Assert.equals(controller.translateFrenchToEnglish("Td1"), "Rd1");
            Assert.equals(controller.translateFrenchToEnglish("Tad1"), "Rad1");
            
            // Fou
            Assert.equals(controller.translateFrenchToEnglish("Fxf7+"), "Bxf7+");
            
            // Dame
            Assert.equals(controller.translateFrenchToEnglish("Dxf7#"), "Qxf7#");
            
            // Promotion
            Assert.equals(controller.translateFrenchToEnglish("e8=D"), "e8=Q");
            Assert.equals(controller.translateFrenchToEnglish("axb8=D+"), "axb8=Q+");
            
            // Roque
            Assert.equals(controller.translateFrenchToEnglish("O-O"), "O-O");
            Assert.equals(controller.translateFrenchToEnglish("O-O-O"), "O-O-O");
        },

        "test_history_snapshot_state": () => {
            const controller = new GameController();
            controller.player1Name = "Joueur Blanc";
            controller.player2Name = "Joueur Noir";
            controller.selectedTimeLimit = 600;
            controller.startGame();

            // Jouer le premier coup
            controller.executeMove({ r: 6, c: 4 }, { r: 4, c: 4 }); // e2-e4

            const snapshot = controller.moveHistory[0].boardState;
            Assert.isNotNull(snapshot, "Le snapshot doit être enregistré dans l'historique");
            
            // Vérifier que les propriétés critiques sont enregistrées
            Assert.equals(snapshot.turn, 'n', "Le tour dans le snapshot doit être 'n'");
            Assert.isNotNull(snapshot.timeP1, "Le snapshot doit stocker le temps de P1");
            Assert.isNotNull(snapshot.timeP2, "Le snapshot doit stocker le temps de P2");
            Assert.deepEquals(snapshot.enPassantTarget, { r: 5, c: 4 }, "Cible en passant dans le snapshot incorrecte");

            // Navigation
            controller.navigateToMove(-1);
            Assert.equals(controller.currentHistoryIndex, -1, "Index d'historique incorrect");
            
            const activeBanner = document.getElementById('history-banner').classList.contains('active');
            Assert.isTrue(activeBanner, "La bannière d'historique doit s'activer lors du parcours de l'historique");
        },

        "test_move_history_navigation": () => {
            const controller = new GameController();
            controller.player1Name = "Blanc";
            controller.player2Name = "Noir";
            controller.startGame();

            // Jouer quelques coups : e4, e5, Cf3
            controller.executeMove({ r: 6, c: 4 }, { r: 4, c: 4 }); // e4
            controller.executeMove({ r: 1, c: 4 }, { r: 3, c: 4 }); // e5
            controller.executeMove({ r: 7, c: 6 }, { r: 5, c: 5 }); // Cf3

            Assert.equals(controller.moveHistory.length, 3, "Il doit y avoir 3 coups dans l'historique");
            Assert.equals(controller.currentHistoryIndex, 2, "L'index de l'historique doit être sur le dernier coup (2)");

            // Reculer au premier coup (index 0 : e4)
            controller.navigateToMove(0);
            Assert.equals(controller.currentHistoryIndex, 0);
            // Vérifier que le pion e4 est là mais pas le pion e5 ni le cavalier f3 dans la vue affichée (DOM)
            const sqE4 = document.querySelector('#sandbox .square[data-row="4"][data-col="4"]');
            const sqE5 = document.querySelector('#sandbox .square[data-row="3"][data-col="4"]');
            Assert.isTrue(sqE4 && sqE4.querySelector('.piece') !== null, "La case e4 doit afficher le pion blanc");
            Assert.isTrue(sqE5 && sqE5.querySelector('.piece') === null, "La case e5 ne doit pas encore afficher de pièce");

            // Vérifier que les clics sur l'échiquier sont ignorés pendant la navigation
            controller.handleSquareClick(5, 5); // Tenter de cliquer sur f3 (case vide à ce moment historique)
            Assert.isNull(controller.selectedSq, "La sélection de case doit être bloquée en cours de navigation historique");
            
            // Revenir au direct via la bannière
            document.getElementById('btn-return-live').click();
            Assert.equals(controller.currentHistoryIndex, 2, "Le clic sur la bannière doit ramener au direct");
        },

        "test_draw_offer_flow": () => {
            const controller = new GameController();
            controller.player1Name = "Blanc";
            controller.player2Name = "Noir";
            controller.startGame();

            // Proposer nulle
            document.getElementById('btn-draw').click();
            
            // Vérifier que la modale de nulle est visible
            const drawOverlay = document.getElementById('draw-offer-overlay');
            Assert.isTrue(drawOverlay.classList.contains('active'), "La modale de proposition de nulle doit être active");

            // Accepter la nulle
            document.getElementById('btn-accept-draw').click();

            // Vérifier que la partie est terminée par accord mutuel
            Assert.equals(controller.state, "GAME_OVER", "La partie doit être en état GAME_OVER");
            Assert.equals(controller.scoreP1, 0.5, "Le joueur 1 doit avoir 0.5 points");
            Assert.equals(controller.scoreP2, 0.5, "Le joueur 2 doit avoir 0.5 points");
            Assert.isFalse(drawOverlay.classList.contains('active'), "La modale de nulle doit être fermée");
        },

        "test_resign_flow": () => {
            const controller = new GameController();
            controller.player1Name = "Blanc";
            controller.player2Name = "Noir";
            controller.p1IsWhite = true;
            controller.startGame();

            // Blancs abandonnent
            controller.endGame('n', 'abandon');

            // Vérifier l'état final
            Assert.equals(controller.state, "GAME_OVER", "La partie doit être terminée");
            Assert.equals(controller.scoreP2, 1.0, "Les noirs doivent remporter 1 point");
            Assert.equals(controller.scoreP1, 0.0, "Les blancs ont perdu et restent à 0");
            
            // Vérifier l'affichage de l'overlay de fin de partie
            const gameOverOverlay = document.getElementById('game-over-overlay');
            Assert.isTrue(gameOverOverlay.classList.contains('active'), "L'overlay de fin de partie doit être visible");
            Assert.equals(document.getElementById('game-over-title').textContent, "VICTOIRE", "Le titre doit être VICTOIRE");
            Assert.equals(document.getElementById('game-over-reason').textContent, "Par abandon de l'adversaire.", "La raison doit être l'abandon");
        }
    }
};
