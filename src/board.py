from src.constants import INITIAL_BOARD, ROWS, COLS

class Board:
    def __init__(self):
        self.grid = [row[:] for row in INITIAL_BOARD]
        self.turn = 'b'
        self.moved_status = {
            (0, 0): False, (0, 4): False, (0, 7): False, # Noirs
            (7, 0): False, (7, 4): False, (7, 7): False  # Blancs
        }
        self.en_passant_target = None
        self.half_move_clock = 0
        self.position_history = {} # Stocke l'empreinte de la position et son occurrence
        self.position_history[self.get_position_signature()] = 1

    def get_position_signature(self):
        """Crée une signature unique pour la position actuelle (plateau + tour + roque + en passant)."""
        board_str = "".join(["".join([p if p != "" else "." for p in row]) for row in self.grid])
        # On inclut le tour et les droits de roque dans la signature
        moved_str = "".join(["1" if self.moved_status[k] else "0" for k in sorted(self.moved_status.keys())])
        ep_str = str(self.en_passant_target)
        return f"{board_str}|{self.turn}|{moved_str}|{ep_str}"

    def is_threefold_repetition(self):
        """Vérifie si la position actuelle s'est répétée 3 fois."""
        sig = self.get_position_signature()
        return self.position_history.get(sig, 0) >= 3

    def is_insufficient_material(self):
        """Vérifie s'il reste assez de pièces pour mater."""
        white_pieces = []
        black_pieces = []
        for r in range(ROWS):
            for c in range(COLS):
                p = self.grid[r][c]
                if p != "":
                    if p[1] == 'b': white_pieces.append(p[0])
                    else: black_pieces.append(p[0])
        
        # Cas Roi contre Roi
        if len(white_pieces) == 1 and len(black_pieces) == 1:
            return True
            
        # Roi + Fou ou Roi + Cavalier contre Roi
        if len(white_pieces) <= 2 and len(black_pieces) <= 2:
            w_mats = [p for p in white_pieces if p in ['p', 't', 'd']]
            n_mats = [p for p in black_pieces if p in ['p', 't', 'd']]
            if not w_mats and not n_mats:
                return True
                
        return False

    def is_stalemate(self, color):
        """Vérifie s'il y a Pat (pas en échec mais aucun coup possible)."""
        if self.is_in_check(color):
            return False
            
        for r in range(ROWS):
            for c in range(COLS):
                piece = self.grid[r][c]
                if piece != "" and piece[1] == color:
                    if self.get_valid_moves_internal((r, c)):
                        return False
        return True

    def is_fifty_move_rule(self):
        """La règle des 50 coups est atteinte si 100 demi-coups sans capture ni pion."""
        return self.half_move_clock >= 100

    def get_piece(self, row, col):
        if 0 <= row < ROWS and 0 <= col < COLS:
            return self.grid[row][col]
        return None

    def get_valid_moves(self, pos):
        """Retourne une liste de (row, col) valides pour la pièce à pos, en filtrant les coups qui laissent le roi en échec."""
        valid_moves = []
        for r in range(ROWS):
            for c in range(COLS):
                if self.is_valid_move(pos, (r, c)):
                    # On simule le coup pour voir s'il laisse le roi en échec
                    if not self.leaves_king_in_check(pos, (r, c)):
                        valid_moves.append((r, c))
        return valid_moves

    def leaves_king_in_check(self, start, end):
        """Simule un coup et vérifie si le roi de la couleur active est en échec après."""
        r1, c1 = start
        r2, c2 = end
        piece = self.grid[r1][c1]
        target = self.grid[r2][c2]
        color = piece[1]
        
        # Simulation
        self.grid[r2][c2] = piece
        self.grid[r1][c1] = ""
        
        in_check = self.is_in_check(color)
        
        # Retour à l'état initial
        self.grid[r1][c1] = piece
        self.grid[r2][c2] = target
        
        return in_check

    def is_in_check(self, color):
        """Vérifie si le roi de la couleur donnée est menacé."""
        # 1. Trouver le roi
        king_pos = None
        for r in range(ROWS):
            for c in range(COLS):
                if self.grid[r][c] == 'r' + color:
                    king_pos = (r, c)
                    break
        if not king_pos: return False
        
        # 2. Vérifier si une pièce adverse peut l'atteindre
        enemy_color = 'n' if color == 'b' else 'b'
        for r in range(ROWS):
            for c in range(COLS):
                piece = self.grid[r][c]
                if piece != "" and piece[1] == enemy_color:
                    if self.can_attack((r, c), king_pos):
                        return True
        return False

    def is_checkmate(self, color):
        """Vérifie s'il y a échec et mat pour la couleur donnée."""
        if not self.is_in_check(color):
            return False
            
        # Parcourir toutes les pièces de la couleur donnée
        for r in range(ROWS):
            for c in range(COLS):
                piece = self.grid[r][c]
                if piece != "" and piece[1] == color:
                    # Vérifier si cette pièce a au moins un coup légal qui pare l'échec
                    moves = self.get_valid_moves_internal((r, c))
                    if moves:
                        return False
        return True

    def get_valid_moves_internal(self, pos):
        """Version interne de get_valid_moves qui ne dépend pas du tour actuel pour éviter les boucles."""
        valid_moves = []
        for r in range(ROWS):
            for c in range(COLS):
                if self.is_valid_move_internal(pos, (r, c)):
                    if not self.leaves_king_in_check(pos, (r, c)):
                        valid_moves.append((r, c))
        return valid_moves

    def is_valid_move_internal(self, start_pos, end_pos):
        """Version de is_valid_move sans la vérification du tour."""
        start_row, start_col = start_pos
        end_row, end_col = end_pos
        piece = self.get_piece(start_row, start_col)
        target = self.get_piece(end_row, end_col)
        
        if not piece or start_pos == end_pos: return False
        if target != "" and target[1] == piece[1]: return False

        piece_type = piece[0]
        color = piece[1]
        
        if piece_type == 't': return self.check_linear_move(start_pos, end_pos)
        if piece_type == 'f': return self.check_diagonal_move(start_pos, end_pos)
        if piece_type == 'd': return self.check_linear_move(start_pos, end_pos) or self.check_diagonal_move(start_pos, end_pos)
        if piece_type == 'c': return (abs(start_row - end_row), abs(start_col - end_col)) in [(1, 2), (2, 1)]
        if piece_type == 'r':
            if abs(start_row - end_row) <= 1 and abs(start_col - end_col) <= 1: return True
            return self.check_castling(start_pos, end_pos, color)
        if piece_type == 'p': return self.check_pawn_move(start_pos, end_pos, color)
        return False

    def can_attack(self, start, end):
        """Version simplifiée de is_valid_move pour la détection d'échec."""
        r1, c1 = start
        r2, c2 = end
        piece = self.grid[r1][c1]
        target = self.grid[r2][c2]
        
        if target != "" and target[1] == piece[1]: return False

        piece_type = piece[0]
        color = piece[1]
        
        if piece_type == 't': return self.check_linear_move(start, end)
        if piece_type == 'f': return self.check_diagonal_move(start, end)
        if piece_type == 'd': return self.check_linear_move(start, end) or self.check_diagonal_move(start, end)
        if piece_type == 'c': return (abs(r1 - r2), abs(c1 - c2)) in [(1, 2), (2, 1)]
        if piece_type == 'r': return abs(r1 - r2) <= 1 and abs(c1 - c2) <= 1
        if piece_type == 'p':
            return abs(c1 - c2) == 1 and r2 == r1 + (-1 if color == 'b' else 1)
        return False

    def move_piece(self, start_pos, end_pos, promotion_choice='d'):
        """Déplace une pièce, gère les coups spéciaux et change de tour."""
        if self.is_valid_move(start_pos, end_pos) and not self.leaves_king_in_check(start_pos, end_pos):
            start_row, start_col = start_pos
            end_row, end_col = end_pos
            piece = self.grid[start_row][start_col]
            target = self.grid[end_row][end_col]
            
            # Gestion du half_move_clock (Règle des 50 coups)
            if piece[0] == 'p' or target != "":
                self.half_move_clock = 0
            else:
                self.half_move_clock += 1

            new_en_passant_target = None

            # Roque
            if piece[0] == 'r' and abs(start_col - end_col) == 2:
                if end_col > start_col:
                    rook = self.grid[start_row][7]
                    self.grid[start_row][5] = rook
                    self.grid[start_row][7] = ""
                else:
                    rook = self.grid[start_row][0]
                    self.grid[start_row][3] = rook
                    self.grid[start_row][0] = ""

            # En Passant
            if piece[0] == 'p' and (end_row, end_col) == self.en_passant_target:
                direction = -1 if piece[1] == 'b' else 1
                self.grid[end_row - direction][end_col] = ""
            
            if piece[0] == 'p' and abs(start_row - end_row) == 2:
                direction = -1 if piece[1] == 'b' else 1
                new_en_passant_target = (start_row + direction, start_col)

            # Déplacement
            self.grid[end_row][end_col] = piece
            self.grid[start_row][start_col] = ""
            
            # Promotion
            if piece[0] == 'p':
                if (piece[1] == 'b' and end_row == 0) or (piece[1] == 'n' and end_row == 7):
                    if promotion_choice not in ['d', 't', 'f', 'c']: promotion_choice = 'd'
                    self.grid[end_row][end_col] = promotion_choice + piece[1]

            # États
            self.en_passant_target = new_en_passant_target
            if start_pos in self.moved_status:
                self.moved_status[start_pos] = True
            
            self.turn = 'n' if self.turn == 'b' else 'b'

            # Enregistrement de la position dans l'historique (pour triple répétition)
            sig = self.get_position_signature()
            self.position_history[sig] = self.position_history.get(sig, 0) + 1
            
            return True
        return False

    def is_valid_move(self, start_pos, end_pos):
        start_row, start_col = start_pos
        end_row, end_col = end_pos
        piece = self.get_piece(start_row, start_col)
        target = self.get_piece(end_row, end_col)
        
        if not piece or start_pos == end_pos: return False
        if piece[1] != self.turn: return False
        if target != "" and target[1] == piece[1]: return False

        piece_type = piece[0]
        color = piece[1]
        
        if piece_type == 't': return self.check_linear_move(start_pos, end_pos)
        if piece_type == 'f': return self.check_diagonal_move(start_pos, end_pos)
        if piece_type == 'd': return self.check_linear_move(start_pos, end_pos) or self.check_diagonal_move(start_pos, end_pos)
        if piece_type == 'c': return (abs(start_row - end_row), abs(start_col - end_col)) in [(1, 2), (2, 1)]
        if piece_type == 'r':
            if abs(start_row - end_row) <= 1 and abs(start_col - end_col) <= 1: return True
            return self.check_castling(start_pos, end_pos, color)
        if piece_type == 'p': return self.check_pawn_move(start_pos, end_pos, color)
        return False

    def check_castling(self, start, end, color):
        r1, c1 = start
        r2, c2 = end
        if r1 != r2 or abs(c1 - c2) != 2: return False
        
        # Castling is only possible from the initial King position
        if c1 != 4: return False
        if self.moved_status.get((r1, 4)): return False
        
        # Le roi ne peut pas roquer s'il est en échec
        if self.is_in_check(color): return False

        if c2 == 6: # Petit roque
            if self.moved_status.get((r1, 7)): return False
            if self.get_piece(r1, 5) != "" or self.get_piece(r1, 6) != "": return False
            # Le roi ne peut pas traverser une case contrôlée
            if self.leaves_king_in_check((r1, c1), (r1, 5)): return False
            return True
        if c2 == 2: # Grand roque
            if self.moved_status.get((r1, 0)): return False
            if self.get_piece(r1, 1) != "" or self.get_piece(r1, 2) != "" or self.get_piece(r1, 3) != "": return False
            # Le roi ne peut pas traverser une case contrôlée
            if self.leaves_king_in_check((r1, c1), (r1, 3)): return False
            return True
        return False

    def check_pawn_move(self, start, end, color):
        r1, c1 = start
        r2, c2 = end
        target = self.get_piece(r2, c2)
        direction = -1 if color == 'b' else 1
        start_row = 6 if color == 'b' else 1
        if c1 == c2 and target == "":
            if r2 == r1 + direction: return True
            if r1 == start_row and r2 == r1 + 2 * direction and self.get_piece(r1 + direction, c1) == "": return True
        if abs(c1 - c2) == 1 and r2 == r1 + direction:
            if target != "" and target[1] != color: return True
            if (r2, c2) == self.en_passant_target: return True
        return False

    def check_linear_move(self, start, end):
        r1, c1 = start
        r2, c2 = end
        if r1 != r2 and c1 != c2: return False
        dr = 0 if r1 == r2 else (1 if r2 > r1 else -1)
        dc = 0 if c1 == c2 else (1 if c2 > c1 else -1)
        curr_r, curr_c = r1 + dr, c1 + dc
        while (curr_r, curr_c) != (r2, c2):
            if self.get_piece(curr_r, curr_c) != "": return False
            curr_r += dr
            curr_c += dc
        return True

    def check_diagonal_move(self, start, end):
        r1, c1 = start
        r2, c2 = end
        if abs(r1 - r2) != abs(c1 - c2): return False
        dr = 1 if r2 > r1 else -1
        dc = 1 if c2 > c1 else -1
        curr_r, curr_c = r1 + dr, c1 + dc
        while (curr_r, curr_c) != (r2, c2):
            if self.get_piece(curr_r, curr_c) != "": return False
            curr_r += dr
            curr_c += dc
        return True
