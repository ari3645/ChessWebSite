import pygame
import os
from constants import ROWS, COLS, WHITE, GRAY, BLACK, DARK_GRAY, BLUE_HIGHLIGHT, RED, GREEN, PIECE_SCALE
from board import Board

class ChessGame:
    def __init__(self):
        pygame.init()
        
        # Adaptation à l'écran
        info = pygame.display.Info()
        screen_w, screen_h = info.current_w, info.current_h
        target_size = int(min(screen_w, screen_h) * 0.8)
        self.square_size = target_size // 8
        self.width = self.height = self.square_size * 8
        self.sidebar_width = 250
        
        # Taille des pièces réduite
        self.piece_size = int(self.square_size * PIECE_SCALE)
        self.piece_offset = (self.square_size - self.piece_size) // 2
        
        self.screen = pygame.display.set_mode((self.width + self.sidebar_width, self.height))
        pygame.display.set_caption("Jeu d'Échecs - Modulaire")
        
        self.images = {}
        self.load_images()
        
        self.board = Board()
        self.selected_sq = None
        self.valid_moves = []
        self.waiting_for_promotion = None # Stocke (start_sq, end_sq) si on attend un choix
        self.flash_timer = 0 # Timer pour le clignotement rouge du roi
        self.game_over = False
        
        # Nouveaux états
        self.draw_offered_by = None
        self.winner_by_resign = None
        self.mutual_draw = False
        self.auto_rotate = False # Mode rotation automatique
        self.state = "MENU" # MENU, PLAYING, GAME_OVER
        
        # Gestion des joueurs et scores
        self.player1_name = "Joueur 1"
        self.player2_name = "Joueur 2"
        self.score_p1 = 0.0
        self.score_p2 = 0.0
        self.p1_is_white = True # P1 commence avec les blancs
        self.active_input = None # 1 ou 2 selon le champ édité
        
        # Polices
        self.font_title = pygame.font.SysFont('Arial', 72, bold=True)
        self.font_btn = pygame.font.SysFont('Arial', 24, bold=True)
        self.font_small = pygame.font.SysFont('Arial', 18)

    def reset_game(self, switch_colors=False):
        """Réinitialise l'état du jeu pour une nouvelle partie."""
        self.board = Board()
        self.selected_sq = None
        self.valid_moves = []
        self.waiting_for_promotion = None
        self.flash_timer = 0
        self.game_over = False
        self.draw_offered_by = None
        self.winner_by_resign = None
        self.mutual_draw = False
        
        if switch_colors:
            self.p1_is_white = not self.p1_is_white

    def load_images(self):
        pieces = ['pb', 'pn', 'tb', 'tn', 'cb', 'cn', 'fb', 'fn', 'db', 'dn', 'rb', 'rn']
        for piece in pieces:
            path = os.path.join("Image", f"{piece}.png")
            try:
                img = pygame.image.load(path)
                self.images[piece] = pygame.transform.scale(img, (self.piece_size, self.piece_size))
            except Exception as e:
                print(f"Erreur de chargement for {path}: {e}")

    def get_visual_coords(self, row, col):
        """Traduit les coordonnées logiques en coordonnées visuelles selon la rotation."""
        if self.auto_rotate and self.board.turn == 'n':
            return 7 - row, 7 - col
        return row, col

    def get_logical_coords(self, v_row, v_col):
        """Traduit les coordonnées visuelles en coordonnées logiques selon la rotation."""
        if self.auto_rotate and self.board.turn == 'n':
            return 7 - v_row, 7 - v_col
        return v_row, v_col

    def draw_board(self):
        # On cherche le roi en échec pour l'affichage
        king_in_check_pos = None
        if self.board.is_in_check(self.board.turn):
            for r in range(ROWS):
                for c in range(COLS):
                    if self.board.grid[r][c] == 'r' + self.board.turn:
                        king_in_check_pos = (r, c)
                        break

        for row in range(ROWS):
            for col in range(COLS):
                v_row, v_col = self.get_visual_coords(row, col)
                color = WHITE if (row + col) % 2 == 0 else GRAY
                
                # Affichage du Roi en rouge (Échec permanent ou clignotement)
                if (row, col) == king_in_check_pos or (self.flash_timer > 0 and self.board.grid[row][col] == 'r' + self.board.turn):
                    # Si c'est le flash_timer, on alterne les couleurs pour l'effet clignotant
                    if self.flash_timer == 0 or (self.flash_timer // 10) % 2 == 0:
                        color = (255, 100, 100) # Rouge clair

                pygame.draw.rect(self.screen, color, (v_col * self.square_size, v_row * self.square_size, self.square_size, self.square_size))
                
                if self.selected_sq == (row, col):
                    pygame.draw.rect(self.screen, BLUE_HIGHLIGHT, (v_col * self.square_size, v_row * self.square_size, self.square_size, self.square_size))

    def draw_valid_moves(self):
        """Dessine des indicateurs sur les cases où le déplacement est possible."""
        for move in self.valid_moves:
            row, col = move
            v_row, v_col = self.get_visual_coords(row, col)
            center = (v_col * self.square_size + self.square_size // 2, v_row * self.square_size + self.square_size // 2)
            
            # On vérifie s'il s'agit d'une capture
            target_piece = self.board.get_piece(row, col)
            if target_piece != "":
                # C'est une capture : on dessine un cercle rouge autour de la pièce
                pygame.draw.circle(self.screen, (255, 0, 0), center, self.square_size // 2, 5)
            else:
                # C'est un mouvement simple : petit point noir
                pygame.draw.circle(self.screen, (0, 0, 0), center, self.square_size // 6)

    def draw_pieces(self):
        for row in range(ROWS):
            for col in range(COLS):
                v_row, v_col = self.get_visual_coords(row, col)
                piece = self.board.get_piece(row, col)
                if piece != "":
                    x = v_col * self.square_size + self.piece_offset
                    y = v_row * self.square_size + self.piece_offset
                    self.screen.blit(self.images[piece], (x, y))

    def draw_promotion_menu(self):
        """Affiche un menu graphique pour choisir la pièce de promotion."""
        if not self.waiting_for_promotion:
            return
            
        # Assombrir l'arrière-plan
        overlay = pygame.Surface((self.width, self.height))
        overlay.set_alpha(180)
        overlay.fill((0, 0, 0))
        self.screen.blit(overlay, (0, 0))
        
        # Menu central
        menu_w, menu_h = self.square_size * 4, self.square_size
        menu_x = (self.width - menu_w) // 2
        menu_y = (self.height - menu_h) // 2
        
        pygame.draw.rect(self.screen, (200, 200, 200), (menu_x, menu_y, menu_w, menu_h))
        pygame.draw.rect(self.screen, (0, 0, 0), (menu_x, menu_y, menu_w, menu_h), 3)
        
        # Dessiner les 4 options (Dame, Tour, Fou, Cavalier)
        # On utilise la couleur du joueur qui va être promu (le tour n'a pas encore changé)
        color = self.board.turn
        options = ['d', 't', 'f', 'c']
        for i, opt in enumerate(options):
            piece_img = self.images[opt + color]
            x = menu_x + i * self.square_size + self.piece_offset
            y = menu_y + self.piece_offset
            self.screen.blit(piece_img, (x, y))

    def draw_menu(self):
        """Affiche le menu principal avec saisie des noms et curseurs."""
        self.screen.fill(DARK_GRAY)
        
        # Titre
        title = self.font_title.render("JEU D'ÉCHECS", True, WHITE)
        self.screen.blit(title, ((self.width + self.sidebar_width) // 2 - title.get_width() // 2, 80))
        
        # Saisie des noms
        y_input = 220
        total_center_x = (self.width + self.sidebar_width) // 2
        self.input_p1_rect = pygame.Rect(total_center_x - 150, y_input, 300, 45)
        self.input_p2_rect = pygame.Rect(total_center_x - 150, y_input + 70, 300, 45)
        
        # Boutons Effacer
        self.btn_clear1_rect = pygame.Rect(self.input_p1_rect.right + 10, self.input_p1_rect.y, 100, 45)
        self.btn_clear2_rect = pygame.Rect(self.input_p2_rect.right + 10, self.input_p2_rect.y, 100, 45)
        
        # Dessin P1
        color_p1 = GREEN if self.active_input == 1 else WHITE
        pygame.draw.rect(self.screen, color_p1, self.input_p1_rect, 2, border_radius=5)
        
        # Curseur clignotant
        cursor1 = ""
        if self.active_input == 1 and (pygame.time.get_ticks() // 500) % 2 == 0:
            cursor1 = "|"
            
        txt_p1 = self.font_btn.render(f"P1: {self.player1_name}{cursor1}", True, WHITE)
        self.screen.blit(txt_p1, (self.input_p1_rect.x + 10, self.input_p1_rect.centery - txt_p1.get_height() // 2))
        
        # Bouton Effacer P1
        pygame.draw.rect(self.screen, (80, 80, 80), self.btn_clear1_rect, border_radius=5)
        txt_clear1 = self.font_small.render("Effacer", True, WHITE)
        self.screen.blit(txt_clear1, (self.btn_clear1_rect.centerx - txt_clear1.get_width() // 2, self.btn_clear1_rect.centery - txt_clear1.get_height() // 2))

        # Dessin P2
        color_p2 = GREEN if self.active_input == 2 else WHITE
        pygame.draw.rect(self.screen, color_p2, self.input_p2_rect, 2, border_radius=5)
        
        # Curseur clignotant
        cursor2 = ""
        if self.active_input == 2 and (pygame.time.get_ticks() // 500) % 2 == 0:
            cursor2 = "|"
            
        txt_p2 = self.font_btn.render(f"P2: {self.player2_name}{cursor2}", True, WHITE)
        self.screen.blit(txt_p2, (self.input_p2_rect.x + 10, self.input_p2_rect.centery - txt_p2.get_height() // 2))
        
        # Bouton Effacer P2
        pygame.draw.rect(self.screen, (80, 80, 80), self.btn_clear2_rect, border_radius=5)
        txt_clear2 = self.font_small.render("Effacer", True, WHITE)
        self.screen.blit(txt_clear2, (self.btn_clear2_rect.centerx - txt_clear2.get_width() // 2, self.btn_clear2_rect.centery - txt_clear2.get_height() // 2))

        # Bouton Jouer
        self.btn_play_rect = pygame.Rect(total_center_x - 100, 400, 200, 60)
        
        # Validation : le bouton est grisé si les noms sont vides ou identiques
        names_ok = self.player1_name.strip() != "" and self.player2_name.strip() != ""
        names_different = self.player1_name.strip().lower() != self.player2_name.strip().lower()
        can_play = names_ok and names_different
        
        btn_play_color = GREEN if can_play else GRAY
        
        pygame.draw.rect(self.screen, btn_play_color, self.btn_play_rect, border_radius=10)
        txt_play = self.font_btn.render("JOUER", True, WHITE)
        self.screen.blit(txt_play, (self.btn_play_rect.centerx - txt_play.get_width() // 2, self.btn_play_rect.centery - txt_play.get_height() // 2))
        
        if not names_ok:
            txt_warn = self.font_small.render("Veuillez saisir les noms", True, RED)
            self.screen.blit(txt_warn, (self.btn_play_rect.centerx - txt_warn.get_width() // 2, self.btn_play_rect.bottom + 10))
        elif not names_different:
            txt_warn = self.font_small.render("Les noms doivent être différents", True, RED)
            self.screen.blit(txt_warn, (self.btn_play_rect.centerx - txt_warn.get_width() // 2, self.btn_play_rect.bottom + 10))

        # Bouton Quitter
        self.btn_quit_rect = pygame.Rect(total_center_x - 100, 500, 200, 60)
        pygame.draw.rect(self.screen, RED, self.btn_quit_rect, border_radius=10)
        txt_quit = self.font_btn.render("QUITTER", True, WHITE)
        self.screen.blit(txt_quit, (self.btn_quit_rect.centerx - txt_quit.get_width() // 2, self.btn_quit_rect.centery - txt_quit.get_height() // 2))

    def handle_menu_click(self, pos):
        """Gère les clics dans le menu principal."""
        if self.input_p1_rect.collidepoint(pos):
            self.active_input = 1
        elif self.input_p2_rect.collidepoint(pos):
            self.active_input = 2
        elif hasattr(self, 'btn_clear1_rect') and self.btn_clear1_rect.collidepoint(pos):
            self.player1_name = ""
            self.active_input = 1
        elif hasattr(self, 'btn_clear2_rect') and self.btn_clear2_rect.collidepoint(pos):
            self.player2_name = ""
            self.active_input = 2
        elif self.btn_play_rect.collidepoint(pos):
            p1_n = self.player1_name.strip()
            p2_n = self.player2_name.strip()
            if p1_n != "" and p2_n != "" and p1_n.lower() != p2_n.lower():
                self.reset_game()
                self.score_p1 = 0.0
                self.score_p2 = 0.0
                self.state = "PLAYING"
        elif self.btn_quit_rect.collidepoint(pos):
            return False
        else:
            self.active_input = None
        return True

    def draw_game_over(self):
        """Affiche le message de fin de partie avec options de retour."""
        if self.state != "GAME_OVER":
            return
            
        overlay = pygame.Surface((self.width + self.sidebar_width, self.height))
        overlay.set_alpha(200)
        overlay.fill((0, 0, 0))
        self.screen.blit(overlay, (0, 0))
        
        font_lg = pygame.font.SysFont('Arial', 64, bold=True)
        
        # Détermination du message
        if self.winner_by_resign:
            winner = "NOIRS" if self.winner_by_resign == 'n' else "BLANCS"
            text = font_lg.render(f"VICTOIRE PAR ABANDON", True, (255, 255, 255))
            subtext = font_lg.render(f"Les {winner} gagnent !", True, (255, 215, 0))
        elif self.mutual_draw:
            text = font_lg.render(f"MATCH NUL", True, (255, 255, 255))
            subtext = font_lg.render(f"Par accord mutuel", True, (200, 200, 200))
        elif self.board.is_checkmate(self.board.turn):
            winner = "NOIRS" if self.board.turn == 'b' else "BLANCS"
            text = font_lg.render(f"ECHEC ET MAT !", True, (255, 255, 255))
            subtext = font_lg.render(f"Victoire des {winner}", True, (255, 215, 0))
        elif self.board.is_stalemate(self.board.turn):
            text = font_lg.render(f"MATCH NUL !", True, (255, 255, 255))
            subtext = font_lg.render(f"Par Pat (Stalemate)", True, (200, 200, 200))
        elif self.board.is_fifty_move_rule():
            text = font_lg.render(f"MATCH NUL !", True, (255, 255, 255))
            subtext = font_lg.render(f"Règle des 50 coups", True, (200, 200, 200))
        elif self.board.is_threefold_repetition():
            text = font_lg.render(f"MATCH NUL !", True, (255, 255, 255))
            subtext = font_lg.render(f"Triple répétition", True, (200, 200, 200))
        elif self.board.is_insufficient_material():
            text = font_lg.render(f"MATCH NUL !", True, (255, 255, 255))
            subtext = font_lg.render(f"Manque de matériel", True, (200, 200, 200))
        else:
            text = font_lg.render(f"MATCH NUL !", True, (255, 255, 255))
            subtext = font_lg.render(f"Partie terminée", True, (200, 200, 200))
        
        total_w = self.width + self.sidebar_width
        self.screen.blit(text, (total_w // 2 - text.get_width() // 2, self.height // 2 - 150))
        self.screen.blit(subtext, (total_w // 2 - subtext.get_width() // 2, self.height // 2 - 50))

        # Boutons Rejouer / Menu
        self.btn_replay_rect = pygame.Rect(total_w // 2 - 210, self.height // 2 + 80, 200, 50)
        pygame.draw.rect(self.screen, GREEN, self.btn_replay_rect, border_radius=5)
        txt_replay = self.font_btn.render("Rejouer", True, WHITE)
        self.screen.blit(txt_replay, (self.btn_replay_rect.centerx - txt_replay.get_width() // 2, self.btn_replay_rect.centery - txt_replay.get_height() // 2))

        self.btn_back_menu_rect = pygame.Rect(total_w // 2 + 10, self.height // 2 + 80, 200, 50)
        pygame.draw.rect(self.screen, (100, 100, 150), self.btn_back_menu_rect, border_radius=5)
        txt_back = self.font_btn.render("Menu Principal", True, WHITE)
        self.screen.blit(txt_back, (self.btn_back_menu_rect.centerx - txt_back.get_width() // 2, self.btn_back_menu_rect.centery - txt_back.get_height() // 2))

    def handle_game_over_click(self, pos):
        """Gère les clics sur l'écran de fin de partie."""
        if hasattr(self, 'btn_replay_rect') and self.btn_replay_rect.collidepoint(pos):
            self.reset_game(switch_colors=True) # On alterne les couleurs pour la revanche
            self.state = "PLAYING"
        elif hasattr(self, 'btn_back_menu_rect') and self.btn_back_menu_rect.collidepoint(pos):
            self.state = "MENU"

    def handle_promotion_click(self, pos):
        """Gère le clic dans le menu de promotion."""
        menu_w, menu_h = self.square_size * 4, self.square_size
        menu_x = (self.width - menu_w) // 2
        menu_y = (self.height - menu_h) // 2
        
        if menu_x <= pos[0] < menu_x + menu_w and menu_y <= pos[1] < menu_y + menu_h:
            idx = (pos[0] - menu_x) // self.square_size
            options = ['d', 't', 'f', 'c']
            choice = options[idx]
            
            start_sq, end_sq = self.waiting_for_promotion
            self.board.move_piece(start_sq, end_sq, choice)
            
            # Vérifier fin de partie après promotion
            if self.board.is_checkmate(self.board.turn) or \
               self.board.is_stalemate(self.board.turn) or \
               self.board.is_fifty_move_rule():
                self.game_over = True
                
            self.waiting_for_promotion = None
            self.selected_sq = None
            self.valid_moves = []

    def handle_click(self, pos):
        if self.game_over:
            return

        # Clic dans la sidebar
        if pos[0] >= self.width:
            self.handle_sidebar_click(pos)
            return

        if self.waiting_for_promotion:
            self.handle_promotion_click(pos)
            return

        v_col = pos[0] // self.square_size
        v_row = pos[1] // self.square_size
        row, col = self.get_logical_coords(v_row, v_col)
        
        if self.selected_sq:
            if self.selected_sq == (row, col):
                self.selected_sq = None
                self.valid_moves = []
            else:
                # On vérifie s'il s'agit d'une promotion
                piece = self.board.get_piece(self.selected_sq[0], self.selected_sq[1])
                if piece and piece[0] == 'p' and (row, col) in self.valid_moves:
                    if (piece[1] == 'b' and row == 0) or (piece[1] == 'n' and row == 7):
                        self.waiting_for_promotion = (self.selected_sq, (row, col))
                        return

                if self.board.move_piece(self.selected_sq, (row, col)):
                    self.selected_sq = None
                    self.valid_moves = []
                    # Un coup a été joué : si une nulle était proposée, elle est automatiquement refusée
                    self.draw_offered_by = None
                    
                    # Vérifier les conditions de fin de partie
                    if self.board.is_checkmate(self.board.turn) or \
                       self.board.is_stalemate(self.board.turn) or \
                       self.board.is_fifty_move_rule() or \
                       self.board.is_threefold_repetition() or \
                       self.board.is_insufficient_material():
                        self.game_over = True
                else:
                    # Coup invalide ou ne parant pas l'échec
                    if (row, col) in self.board.get_valid_moves(self.selected_sq): # Coup valide techniquement mais laisse en échec
                         self.flash_timer = 60 # Déclenche le clignotement
                    
                    # Si on clique sur une autre de ses propres pièces, on change la sélection
                    piece = self.board.get_piece(row, col)
                    if piece != "" and piece[1] == self.board.turn:
                        self.selected_sq = (row, col)
                        self.valid_moves = self.board.get_valid_moves(self.selected_sq)
                    else:
                        self.selected_sq = None
                        self.valid_moves = []
        else:
            if self.board.get_piece(row, col) != "":
                piece = self.board.get_piece(row, col)
                if piece[1] == self.board.turn:
                    self.selected_sq = (row, col)
                    self.valid_moves = self.board.get_valid_moves(self.selected_sq)

    def handle_sidebar_click(self, pos):
        """Gère les clics sur les boutons de la barre latérale."""
        x, y = pos
        
        # Bouton Rotation Auto (tout en bas)
        btn_rotate_rect = pygame.Rect(self.width + 25, self.height - 60, 200, 40)
        if btn_rotate_rect.collidepoint(pos):
            self.auto_rotate = not self.auto_rotate
            return

        # On détermine quel joueur a cliqué pour les autres boutons
        color = 'n' if y < self.height // 2 else 'b'
        y_offset = 0 if color == 'n' else self.height // 2
        
        # Rects des boutons (doivent correspondre à draw_player_controls)
        btn_resign_rect = pygame.Rect(self.width + 25, y_offset + 70, 200, 45)
        btn_draw_rect = pygame.Rect(self.width + 25, y_offset + 130, 200, 45)
        
        if btn_resign_rect.collidepoint(pos):
            self.winner_by_resign = 'b' if color == 'n' else 'n'
            self.game_over = True
            
        elif self.draw_offered_by is None:
            if btn_draw_rect.collidepoint(pos):
                self.draw_offered_by = color
        
        elif self.draw_offered_by != color:
            # L'adversaire a proposé, on peut accepter ou refuser
            btn_accept_rect = pygame.Rect(self.width + 25, y_offset + 130, 95, 45)
            btn_refuse_rect = pygame.Rect(self.width + 130, y_offset + 130, 95, 45)
            
            if btn_accept_rect.collidepoint(pos):
                self.mutual_draw = True
                self.game_over = True
            elif btn_refuse_rect.collidepoint(pos):
                self.draw_offered_by = None

    def draw_sidebar(self):
        """Dessine la barre latérale avec les contrôles des joueurs."""
        # Fond de la sidebar
        pygame.draw.rect(self.screen, DARK_GRAY, (self.width, 0, self.sidebar_width, self.height))
        pygame.draw.line(self.screen, BLACK, (self.width, 0), (self.width, self.height), 2)

        # Zones Noirs (haut) et Blancs (bas)
        self.draw_player_controls('n', 0)
        self.draw_player_controls('b', self.height // 2)
        
        # Option Rotation Automatique (tout en bas)
        btn_rotate_rect = pygame.Rect(self.width + 25, self.height - 60, 200, 40)
        color_rotate = GREEN if self.auto_rotate else GRAY
        pygame.draw.rect(self.screen, color_rotate, btn_rotate_rect, border_radius=5)
        txt_rotate = self.font_small.render("Rotation Auto : ON" if self.auto_rotate else "Rotation Auto : OFF", True, WHITE)
        self.screen.blit(txt_rotate, (btn_rotate_rect.centerx - txt_rotate.get_width() // 2, btn_rotate_rect.centery - txt_rotate.get_height() // 2))

    def update_scores(self):
        """Met à jour les scores selon le résultat."""
        winner = None
        if self.winner_by_resign:
            winner = self.winner_by_resign
        elif self.board.is_checkmate(self.board.turn):
            winner = 'b' if self.board.turn == 'n' else 'n'
        
        if winner == 'b':
            if self.p1_is_white: self.score_p1 += 1
            else: self.score_p2 += 1
        elif winner == 'n':
            if self.p1_is_white: self.score_p2 += 1
            else: self.score_p1 += 1
        elif self.game_over: # Cas de nulle
            self.score_p1 += 0.5
            self.score_p2 += 0.5

    def draw_player_controls(self, color, y_offset):
        """Dessine les boutons et infos pour un joueur donné."""
        # Mapping Joueur / Couleur
        if color == 'b':
            name = self.player1_name if self.p1_is_white else self.player2_name
            score = self.score_p1 if self.p1_is_white else self.score_p2
        else:
            name = self.player2_name if self.p1_is_white else self.player1_name
            score = self.score_p2 if self.p1_is_white else self.score_p1

        text_color = WHITE
        
        # Nom et Score
        display_text = f"{name} ({score})"
        title = self.font_btn.render(display_text, True, text_color)
        self.screen.blit(title, (self.width + (self.sidebar_width - title.get_width()) // 2, y_offset + 20))

        # Bouton Abandonner
        btn_resign_rect = pygame.Rect(self.width + 25, y_offset + 70, 200, 45)
        pygame.draw.rect(self.screen, RED, btn_resign_rect, border_radius=5)
        txt_resign = self.font_btn.render("Abandonner", True, WHITE)
        self.screen.blit(txt_resign, (btn_resign_rect.centerx - txt_resign.get_width() // 2, btn_resign_rect.centery - txt_resign.get_height() // 2))

        # Bouton Nulle
        btn_draw_rect = pygame.Rect(self.width + 25, y_offset + 130, 200, 45)
        
        if self.draw_offered_by == color:
            # On a déjà proposé
            pygame.draw.rect(self.screen, GRAY, btn_draw_rect, border_radius=5)
            txt_draw = self.font_small.render("Nulle proposée...", True, WHITE)
            self.screen.blit(txt_draw, (btn_draw_rect.centerx - txt_draw.get_width() // 2, btn_draw_rect.centery - txt_draw.get_height() // 2))
        elif self.draw_offered_by is not None:
            # L'adversaire a proposé
            # Bouton Accepter
            btn_accept_rect = pygame.Rect(self.width + 25, y_offset + 130, 95, 45)
            pygame.draw.rect(self.screen, GREEN, btn_accept_rect, border_radius=5)
            txt_accept = self.font_small.render("Accepter", True, WHITE)
            txt_accept2 = self.font_small.render("Nulle", True, WHITE)
            self.screen.blit(txt_accept, (btn_accept_rect.centerx - txt_accept.get_width() // 2, btn_accept_rect.centery - 12))
            self.screen.blit(txt_accept2, (btn_accept_rect.centerx - txt_accept2.get_width() // 2, btn_accept_rect.centery + 2))
            
            # Bouton Refuser
            btn_refuse_rect = pygame.Rect(self.width + 130, y_offset + 130, 95, 45)
            pygame.draw.rect(self.screen, RED, btn_refuse_rect, border_radius=5)
            txt_refuse = self.font_small.render("Refuser", True, WHITE)
            txt_refuse2 = self.font_small.render("Nulle", True, WHITE)
            self.screen.blit(txt_refuse, (btn_refuse_rect.centerx - txt_refuse.get_width() // 2, btn_refuse_rect.centery - 12))
            self.screen.blit(txt_refuse2, (btn_refuse_rect.centerx - txt_refuse2.get_width() // 2, btn_refuse_rect.centery + 2))
        else:
            # Rien de proposé
            pygame.draw.rect(self.screen, (100, 100, 150), btn_draw_rect, border_radius=5)
            txt_draw = self.font_btn.render("Proposer Nulle", True, WHITE)
            self.screen.blit(txt_draw, (btn_draw_rect.centerx - txt_draw.get_width() // 2, btn_draw_rect.centery - txt_draw.get_height() // 2))

    def run(self):
        clock = pygame.time.Clock()
        running = True
        while running:
            # Gestion du timer de clignotement
            if self.flash_timer > 0:
                self.flash_timer -= 1

            # Titre de la fenêtre
            if self.state == "MENU":
                pygame.display.set_caption("Jeu d'Échecs - Menu Principal")
            elif self.state == "PLAYING":
                turn_str = "Blancs" if self.board.turn == 'b' else "Noirs"
                pygame.display.set_caption(f"Jeu d'Échecs - Tour : {turn_str}")
            else:
                pygame.display.set_caption("FIN DE PARTIE")
            
            # Gestion des événements
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    pos = pygame.mouse.get_pos()
                    if self.state == "MENU":
                        if not self.handle_menu_click(pos):
                            running = False
                    elif self.state == "PLAYING":
                        self.handle_click(pos)
                        if self.game_over:
                            self.state = "GAME_OVER"
                            self.update_scores()
                    elif self.state == "GAME_OVER":
                        self.handle_game_over_click(pos)
                elif event.type == pygame.KEYDOWN and self.state == "MENU" and self.active_input:
                    if event.key == pygame.K_BACKSPACE:
                        if self.active_input == 1:
                            self.player1_name = self.player1_name[:-1]
                        else:
                            self.player2_name = self.player2_name[:-1]
                    elif event.key == pygame.K_RETURN:
                        self.active_input = None
                    elif len(event.unicode) > 0 and event.unicode.isprintable():
                        if self.active_input == 1 and len(self.player1_name) < 15:
                            self.player1_name += event.unicode
                        elif self.active_input == 2 and len(self.player2_name) < 15:
                            self.player2_name += event.unicode
            
            # Rendu selon l'état
            if self.state == "MENU":
                self.draw_menu()
            else:
                self.draw_board()
                self.draw_valid_moves()
                self.draw_pieces()
                self.draw_sidebar()
                self.draw_promotion_menu()
                if self.state == "GAME_OVER":
                    self.draw_game_over()
            
            pygame.display.flip()
            clock.tick(60)
            
        pygame.quit()

if __name__ == "__main__":
    game = ChessGame()
    game.run()
