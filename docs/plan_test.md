# Plan de Test - Jeu d'Échecs

Ce document liste l'ensemble des scénarios de test validant le comportement et la logique des règles d'échecs du moteur de jeu.

---

## 🧪 Scénarios de Test Unitaires

### 1. Configuration Initiale
*   [x] **test_initial_setup** : Vérifier le placement correct des pièces noires (ligne 0 et 1), des pièces blanches (ligne 6 et 7) et s'assurer que le trait de départ est aux Blancs (`'b'`).

### 2. Mouvements et Captures de Base
*   [x] **test_pawn_move** : Valider l'avancée simple d'un pion blanc et d'un pion noir, et s'assurer que le changement de tour s'effectue bien après le coup.
*   [x] **test_pawn_capture** : Vérifier que les pions capturent uniquement en diagonale (1 case) et pas en ligne droite.
*   [x] **test_invalid_turn** : S'assurer qu'un joueur ne peut pas déplacer une pièce de son adversaire lors de son propre tour.
*   [x] **test_piece_blocking** : Confirmer que les pièces linéaires (Tours, Fous, Reines) et les pions sont bloqués par les autres pièces alliées ou ennemies sur leur chemin.
*   [x] **test_knight_jump** : Valider que le Cavalier est la seule pièce capable de sauter par-dessus d'autres pièces (alliées ou ennemies).
*   [x] **test_move_invalid_start_empty** : Tenter de jouer un coup depuis une case vide (doit échouer).
*   [x] **test_move_invalid_target_own_piece** : Tenter de capturer sa propre pièce (doit échouer).
*   [x] **test_move_not_in_valid_moves** : Tenter d'effectuer un coup hors de la liste des mouvements valides d'une pièce.

### 3. Coups Spéciaux
*   [x] **test_en_passant** :
    *   Valider la prise en passant pour les Blancs (ligne 3).
    *   Valider la prise en passant pour les Noirs (ligne 4).
*   [x] **test_en_passant_persistence** : Vérifier que la possibilité de capture en passant expire après exactement un tour (règle de non-persistance).
*   [x] **test_promotion** : Vérifier qu'un pion arrivant sur la dernière ligne (ligne 0 pour les blancs, 7 pour les noirs) se transforme en la pièce choisie (ex : Dame).
*   [x] **test_promotion_capture** : Vérifier qu'un pion peut capturer une pièce sur la dernière rangée tout en étant promu simultanément.

### 4. Le Roque (Castling)
*   [x] **test_castling_queenside** : Vérifier le déplacement de 2 cases du Roi et le saut de la Tour lors du grand roque.
*   [x] **test_castling_restrictions** : S'assurer que le roque est interdit si :
    *   Le Roi a déjà bougé.
    *   La Tour concernée a déjà bougé.
    *   Des pièces font obstacle entre le Roi et la Tour.
*   [x] **test_castling_out_of_check_complete** : Interdire le roque si le Roi est actuellement en échec.
*   [x] **test_castling_through_check** : Interdire le roque si le Roi doit traverser une case contrôlée par l'adversaire.
*   [x] **test_castling_into_check** : Interdire le roque si la case finale du Roi est attaquée par l'adversaire (le Roi ne peut pas s'auto-mettre en échec).

### 5. Échec et Menaces
*   [x] **test_leaves_king_in_check** : Vérifier qu'un coup est illégal s'il laisse le Roi du joueur actif en échec (le joueur doit parer l'échec ou ne pas s'y mettre).
*   [x] **test_discovered_check** : Valider la détection d'un échec à la découverte (déplacement d'une pièce révélant la ligne de mire d'une autre pièce).
*   [x] **test_double_check** : Valider le cas de l'échec double (deux pièces attaquent simultanément le Roi).

### 6. Conditions de Fin de Partie (Nulles et Échec et Mat)
*   [x] **test_stalemate** :
    *   Valider la situation de Pat (pas d'échec mais aucun mouvement possible pour le joueur actif).
    *   **test_stalemate_realistic** : Valider un cas de Pat classique en fin de partie (ex: Roi + Pion bloqué contre Roi seul).
*   [x] **test_threefold_repetition** : Valider le match nul automatique par répétition triple de la même position (configuration identique du plateau, du tour, des droits de roque et de prise en passant).
*   [x] **test_threefold_repetition_with_rights** : Vérifier que deux positions identiques sur le plateau ne comptent pas pour une répétition si les droits de roque ont changé entre-temps.
*   [x] **test_insufficient_material** : Confirmer le nul automatique pour manque de matériel de mat dans les cas :
    *   Roi vs Roi.
    *   Roi + Fou vs Roi.
    *   Roi + Cavalier vs Roi.
*   [x] **test_fifty_move_rule** : Valider le nul automatique après 50 coups complets (100 demi-coups) sans capture ni poussée de pion.
*   [x] **test_fifty_move_rule_capture** : Vérifier qu'une capture ou une poussée de pion réinitialise bien le compteur des 50 coups.

### 7. Améliorations Récentes (Fonctionnalités Web & UI)
*   [x] **test_castling_rights_revocation_on_rook_capture** : Vérifier que les droits de roque du Roi sont révoqués si la Tour concernée est capturée par l'adversaire (même si le Roi n'a pas bougé).
*   [x] **test_pgn_translation** : Valider la conversion correcte des coups de la notation algébrique française (T, C, F, D, R) vers la notation standard anglaise (R, N, B, Q, K) pour l'exportation PGN.
*   [x] **test_history_snapshot_state** : Vérifier que chaque déplacement enregistre fidèlement l'état de la partie (trait, temps, cible en passant) dans l'historique et gère la navigation temporelle.
*   [x] **test_move_history_navigation** : Vérifier le recul dans le temps dans l'historique, la mise à jour correcte de l'échiquier HTML/DOM, l'interdiction des clics en cours de navigation historique et le retour à la partie en direct.
*   [x] **test_draw_offer_flow** : Valider le flux de proposition et d'acceptation mutuelle d'un match nul via l'overlay graphique.
*   [x] **test_resign_flow** : Valider le flux d'abandon d'un joueur, la mise à jour immédiate du score et l'affichage de l'écran de fin de partie.

### 8. Sauvegarde et Chargement (sessionStorage)
*   [x] **test_session_save** : Vérifier que le statut de la partie est correctement sérialisé et sauvegardé dans le `sessionStorage` après chaque coup joué.
*   [x] **test_session_load** : Valider la restauration complète de l'état de la partie (grille, noms de joueurs, historique, trait) à partir d'une sauvegarde présente en session.
*   [x] **test_clear_save_on_game_over** : S'assurer que la sauvegarde en session est détruite dès que la partie se termine.
*   [x] **test_leave_and_resume_game** : Valider la mise en pause (état MENU) avec sauvegarde, et la reprise (état PLAYING) avec restauration.

### 9. Événements Sonores (Sound Triggers)
*   [x] **test_sound_on_move** : S'assurer qu'un coup simple joue le son `'move'`.
*   [x] **test_sound_on_capture** : S'assurer qu'une capture joue le son `'capture'`.
*   [x] **test_sound_on_check** : S'assurer qu'un coup mettant le Roi adverse en échec joue le son `'check'`.
*   [x] **test_sound_on_promotion** : S'assurer qu'une promotion sans échec joue le son `'promote'`.
*   [x] **test_sound_on_promotion_with_check** : S'assurer qu'une promotion provoquant un échec joue le son `'check'` (priorité de l'échec).
*   [x] **test_sound_on_castle** : S'assurer que le roque joue le son `'castle'`.

### 10. Moteur IA et State Transfer
*   [x] **test_board_state_transfer** : Vérifier que l'état complet du plateau est correctement exportable et importable (pour envoi au Web Worker).
*   [x] **test_board_clone** : Valider que le clonage d'un plateau crée une copie indépendante (les modifications ultérieures n'impactent pas l'original).
*   [x] **test_indexeddb_opening_book** : S'assurer du bon fonctionnement asynchrone d'écriture et de lecture dans la base de données IndexedDB servant au livre d'ouvertures de l'IA.


