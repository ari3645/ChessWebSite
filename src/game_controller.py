import pygame
import os
from src.constants import ROWS, COLS, PIECE_SCALE
from src.board import Board
from src.renderer import Renderer
from src.ui import Button

class GameController:
    def __init__(self):
        pygame.init()
        
        # Adaptation à l'écran
        info = pygame.display.Info()
        screen_w, screen_h = info.current_w, info.current_h
        target_size = int(min(screen_w, screen_h) * 0.8)
        self.square_size = target_size // 8
        self.width = self.height = self.square_size * 8
        self.sidebar_width = 250
        
        # Taille des pièces
        self.piece_size = int(self.square_size * PIECE_SCALE)
        self.piece_offset = (self.square_size - self.piece_size) // 2
        
        self.screen = pygame.display.set_mode((self.width + self.sidebar_width, self.height))
        
        self.images = {}
        self.load_images()
        
        self.fonts = {
            'title': pygame.font.SysFont('Arial', 72, bold=True),
            'btn': pygame.font.SysFont('Arial', 24, bold=True),
            'small': pygame.font.SysFont('Arial', 18)
        }
        
        self.renderer = Renderer(self.screen, self.square_size, self.sidebar_width, 
                                 self.piece_size, self.piece_offset, self.images, self.fonts)
        
        # Gestion des joueurs et scores
        self.player1_name = "Joueur 1"
        self.player2_name = "Joueur 2"
        self.score_p1 = 0.0
        self.score_p2 = 0.0
        self.p1_is_white = True
        self.active_input = None
        
        # Contrôle du temps
        self.time_controls = [
            ("10 min + 15s", 10 * 60, 15),
            ("3 min + 2s", 3 * 60, 2),
            ("1 min + 0s", 1 * 60, 0),
            ("Sans temps", None, None)
        ]
        self.selected_time_idx = 0
        self.time_p1 = None
        self.time_p2 = None
        self.increment = 0
        self.winner_by_timeout = None
        self.time_menu_open = False
        self.last_tick_time = pygame.time.get_ticks()
        self.flash_timer = 0
        self.auto_rotate = False
        self.state = "MENU"
        self.game_over = False
        self.waiting_for_promotion = None
        self.selected_sq = None
        self.valid_moves = []
        self.draw_offered_by = None
        self.winner_by_resign = None
        self.mutual_draw = False

        # Définition des zones de clic (Rects et Buttons)
        self.init_ui_rects()

    def init_ui_rects(self):
        total_w = self.width + self.sidebar_width
        center_x = total_w // 2
        y_center = 280
        
        # Largeurs
        input_w = 200
        clear_w = 80
        time_w = 200
        spacing = 15
        
        # Calcul du début de la ligne pour centrer l'ensemble
        # (Input1 + Clear1 + Input2 + Clear2 + Time) + spacing
        total_line_w = (input_w * 2) + (clear_w * 2) + time_w + (spacing * 4)
        start_x = (total_w - total_line_w) // 2

        # Inputs
        self.input_p1_rect = pygame.Rect(start_x, y_center, input_w, 45)
        self.btn_clear1 = Button((self.input_p1_rect.right + spacing, y_center, clear_w, 45), (80, 80, 80), "Effacer", self.fonts['small'])
        
        self.input_p2_rect = pygame.Rect(self.btn_clear1.rect.right + spacing, y_center, input_w, 45)
        self.btn_clear2 = Button((self.input_p2_rect.right + spacing, y_center, clear_w, 45), (80, 80, 80), "Effacer", self.fonts['small'])
        
        self.btn_time = Button((self.btn_clear2.rect.right + spacing, y_center, time_w, 45), (100, 100, 150), f"{self.time_controls[self.selected_time_idx][0]}", self.fonts['btn'])

        # Dropdown options (sous le bouton temps)
        self.time_option_buttons = []
        for i in range(len(self.time_controls)):
            rect = (self.btn_time.rect.x, self.btn_time.rect.bottom + i * 35, time_w, 35)
            self.time_option_buttons.append(Button(rect, (40, 40, 60), self.time_controls[i][0], self.fonts['small']))

        # Action Buttons (en bas)
        self.btn_play = Button((center_x - 100, self.height - 150, 200, 60), (50, 200, 50), "JOUER", self.fonts['btn'], border_radius=10)
        self.btn_quit = Button((center_x - 100, self.height - 70, 200, 50), (200, 50, 50), "QUITTER", self.fonts['btn'], border_radius=10)

        # Game Over Buttons
        self.btn_replay = Button((total_w // 2 - 210, self.height // 2 + 80, 200, 50), (50, 200, 50), "Rejouer", self.fonts['btn'])
        self.btn_back_menu = Button((total_w // 2 + 10, self.height // 2 + 80, 200, 50), (100, 100, 150), "Menu Principal", self.fonts['btn'])
        
        # Sidebar Base Buttons
        self.btn_rotate = Button((self.width + 25, self.height - 60, 200, 40), (96, 96, 96), "Rotation Auto : OFF", self.fonts['small'])

    def reset_game_state(self, switch_colors=False):
        self.board = Board()
        self.selected_sq = None
        self.valid_moves = []
        self.waiting_for_promotion = None
        self.flash_timer = 0
        self.game_over = False
        self.draw_offered_by = None
        self.winner_by_resign = None
        self.winner_by_timeout = None
        self.mutual_draw = False
        self.auto_rotate = False
        
        # Initialisation du temps
        _, base_time, self.increment = self.time_controls[self.selected_time_idx]
        if base_time is not None:
            self.time_p1 = base_time * 1000 # ms
            self.time_p2 = base_time * 1000
        else:
            self.time_p1 = None
            self.time_p2 = None
        
        self.last_tick_time = pygame.time.get_ticks()

        if switch_colors:
            self.p1_is_white = not self.p1_is_white

    def load_images(self):
        pieces = ['pb', 'pn', 'tb', 'tn', 'cb', 'cn', 'fb', 'fn', 'db', 'dn', 'rb', 'rn']
        for piece in pieces:
            path = os.path.join("assets", "images", f"{piece}.png")
            try:
                img = pygame.image.load(path)
                self.images[piece] = pygame.transform.scale(img, (self.piece_size, self.piece_size))
            except Exception as e:
                print(f"Erreur de chargement for {path}: {e}")

    def handle_menu_click(self, pos):
        # Si le menu de temps est ouvert, on vérifie d'abord les clics dessus
        if self.time_menu_open:
            for i, btn in enumerate(self.time_option_buttons):
                if btn.is_clicked(pos):
                    self.selected_time_idx = i
                    self.time_menu_open = False
                    self.btn_time.update_text(f"Temps : {self.time_controls[i][0]}")
                    return True
            if not self.btn_time.is_clicked(pos):
                self.time_menu_open = False
                return True

        if self.input_p1_rect.collidepoint(pos):
            self.active_input = 1
        elif self.input_p2_rect.collidepoint(pos):
            self.active_input = 2
        elif self.btn_clear1.is_clicked(pos):
            self.player1_name = ""
            self.active_input = 1
        elif self.btn_clear2.is_clicked(pos):
            self.player2_name = ""
            self.active_input = 2
        elif self.btn_time.is_clicked(pos):
            self.time_menu_open = not self.time_menu_open
        elif self.btn_play.is_clicked(pos):
            p1_n = self.player1_name.strip()
            p2_n = self.player2_name.strip()
            if p1_n != "" and p2_n != "" and p1_n.lower() != p2_n.lower():
                self.reset_game_state()
                self.score_p1 = 0.0
                self.score_p2 = 0.0
                self.state = "PLAYING"
        elif self.btn_quit.is_clicked(pos):
            return False
        else:
            self.active_input = None
        return True

    def handle_game_over_click(self, pos):
        if self.btn_replay.is_clicked(pos):
            self.reset_game_state(switch_colors=True)
            self.state = "PLAYING"
        elif self.btn_back_menu.is_clicked(pos):
            self.state = "MENU"

    def handle_promotion_click(self, pos):
        menu_w = self.square_size * 4
        menu_x = (self.width - menu_w) // 2
        menu_y = (self.height - self.square_size) // 2
        
        if menu_x <= pos[0] < menu_x + menu_w and menu_y <= pos[1] < menu_y + self.square_size:
            idx = (pos[0] - menu_x) // self.square_size
            options = ['d', 't', 'f', 'c']
            choice = options[idx]
            
            start_sq, end_sq = self.waiting_for_promotion
            # Avant le coup, on note qui joue pour l'incrément
            p1_played = (self.board.turn == 'b' and self.p1_is_white) or (self.board.turn == 'n' and not self.p1_is_white)
            
            if self.board.move_piece(start_sq, end_sq, choice):
                # Incrément
                if self.time_p1 is not None:
                    if p1_played: self.time_p1 += self.increment * 1000
                    else: self.time_p2 += self.increment * 1000

                if self.board.is_checkmate(self.board.turn) or \
                   self.board.is_stalemate(self.board.turn) or \
                   self.board.is_fifty_move_rule() or \
                   self.board.is_threefold_repetition() or \
                   self.board.is_insufficient_material():
                    self.game_over = True
                
            self.waiting_for_promotion = None
            self.selected_sq = None
            self.valid_moves = []

    def handle_click(self, pos):
        if self.game_over:
            return

        if pos[0] >= self.width:
            self.handle_sidebar_click(pos)
            return

        if self.waiting_for_promotion:
            self.handle_promotion_click(pos)
            return

        # Coordonnées logiques
        v_col = pos[0] // self.square_size
        v_row = pos[1] // self.square_size
        
        # Utilisation de la méthode du renderer pour la conversion inverse
        row, col = self.renderer.get_visual_coords(v_row, v_col, self.auto_rotate, self.board.turn)
        
        if self.selected_sq:
            if self.selected_sq == (row, col):
                self.selected_sq = None
                self.valid_moves = []
            else:
                piece = self.board.get_piece(self.selected_sq[0], self.selected_sq[1])
                if piece and piece[0] == 'p' and (row, col) in self.valid_moves:
                    if (piece[1] == 'b' and row == 0) or (piece[1] == 'n' and row == 7):
                        self.waiting_for_promotion = (self.selected_sq, (row, col))
                        return

                # Avant le coup, on note qui joue pour l'incrément
                p1_played = (self.board.turn == 'b' and self.p1_is_white) or (self.board.turn == 'n' and not self.p1_is_white)

                if self.board.move_piece(self.selected_sq, (row, col)):
                    # Incrément
                    if self.time_p1 is not None:
                        if p1_played: self.time_p1 += self.increment * 1000
                        else: self.time_p2 += self.increment * 1000

                    self.selected_sq = None
                    self.valid_moves = []
                    self.draw_offered_by = None
                    
                    if self.board.is_checkmate(self.board.turn) or \
                       self.board.is_stalemate(self.board.turn) or \
                       self.board.is_fifty_move_rule() or \
                       self.board.is_threefold_repetition() or \
                       self.board.is_insufficient_material():
                        self.game_over = True
                else:
                    if (row, col) in self.board.get_valid_moves(self.selected_sq):
                         self.flash_timer = 60
                    
                    piece = self.board.get_piece(row, col)
                    if piece != "" and piece[1] == self.board.turn:
                        self.selected_sq = (row, col)
                        self.valid_moves = self.board.get_valid_moves(self.selected_sq)
                    else:
                        self.selected_sq = None
                        self.valid_moves = []
        else:
            piece = self.board.get_piece(row, col)
            if piece != "" and piece[1] == self.board.turn:
                self.selected_sq = (row, col)
                self.valid_moves = self.board.get_valid_moves(self.selected_sq)

    def handle_sidebar_click(self, pos):
        if self.btn_rotate.is_clicked(pos):
            self.auto_rotate = not self.auto_rotate
            self.btn_rotate.update_text("Rotation Auto : ON" if self.auto_rotate else "Rotation Auto : OFF")
            return

        color = 'n' if pos[1] < self.height // 2 else 'b'
        y_offset = 0 if color == 'n' else self.height // 2
        
        # Le décalage vertical dépend de si le temps est affiché ou non
        y_name_offset = 55 if self.time_p1 is not None else 20
        
        # Boutons dynamiques (on les définit "à la volée" pour le clic mais ils seront gérés proprement)
        btn_resign = Button((self.width + 25, y_offset + y_name_offset + 50, 200, 45), (200, 50, 50), "Abandonner", self.fonts['btn'])
        
        if btn_resign.is_clicked(pos):
            self.winner_by_resign = 'b' if color == 'n' else 'n'
            self.game_over = True
            return

        if self.draw_offered_by == color:
            return # Déjà proposé

        if self.draw_offered_by is not None:
            # On vérifie Accepter / Refuser
            btn_accept = Button((self.width + 25, y_offset + y_name_offset + 110, 95, 45), (50, 200, 50), "Accepter", self.fonts['small'])
            btn_refuse = Button((self.width + 130, y_offset + y_name_offset + 110, 95, 45), (200, 50, 50), "Refuser", self.fonts['small'])
            if btn_accept.is_clicked(pos):
                self.mutual_draw = True
                self.game_over = True
            elif btn_refuse.is_clicked(pos):
                self.draw_offered_by = None
        else:
            # On vérifie Proposer
            btn_draw = Button((self.width + 25, y_offset + y_name_offset + 110, 200, 45), (100, 100, 150), "Proposer Nulle", self.fonts['btn'])
            if btn_draw.is_clicked(pos):
                self.draw_offered_by = color

    def update_scores(self):
        winner = None
        if self.winner_by_resign:
            winner = self.winner_by_resign
        elif self.winner_by_timeout:
            winner = self.winner_by_timeout
        elif self.board.is_checkmate(self.board.turn):
            winner = 'b' if self.board.turn == 'n' else 'n'
        
        if winner == 'b':
            if self.p1_is_white: self.score_p1 += 1
            else: self.score_p2 += 1
        elif winner == 'n':
            if self.p1_is_white: self.score_p2 += 1
            else: self.score_p1 += 1
        elif self.game_over:
            self.score_p1 += 0.5
            self.score_p2 += 0.5

    def run(self):
        clock = pygame.time.Clock()
        running = True
        while running:
            current_time = pygame.time.get_ticks()
            dt = current_time - self.last_tick_time
            self.last_tick_time = current_time

            if self.flash_timer > 0:
                self.flash_timer -= 1

            # Gestion du temps
            if self.state == "PLAYING" and not self.game_over and self.time_p1 is not None:
                active_is_p1 = (self.board.turn == 'b' and self.p1_is_white) or (self.board.turn == 'n' and not self.p1_is_white)
                if active_is_p1:
                    self.time_p1 -= dt
                    if self.time_p1 <= 0:
                        self.time_p1 = 0
                        self.game_over = True
                        self.winner_by_timeout = 'n' if self.p1_is_white else 'b'
                        self.state = "GAME_OVER"
                        self.update_scores()
                else:
                    self.time_p2 -= dt
                    if self.time_p2 <= 0:
                        self.time_p2 = 0
                        self.game_over = True
                        self.winner_by_timeout = 'b' if self.p1_is_white else 'n'
                        self.state = "GAME_OVER"
                        self.update_scores()

            # Titre
            if self.state == "MENU":
                pygame.display.set_caption("Jeu d'Échecs - Menu Principal")
            elif self.state == "PLAYING":
                turn_str = "Blancs" if self.board.turn == 'b' else "Noirs"
                pygame.display.set_caption(f"Jeu d'Échecs - Tour : {turn_str}")
            else:
                pygame.display.set_caption("FIN DE PARTIE")
            
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
            
            # Rendu (on passe le contrôleur pour que le renderer puisse accéder aux boutons)
            if self.state == "MENU":
                names_ok = self.player1_name.strip() != "" and self.player2_name.strip() != ""
                names_diff = self.player1_name.strip().lower() != self.player2_name.strip().lower()
                self.renderer.draw_menu(self, names_ok and names_diff)
            else:
                self.renderer.draw_board(self.board, self.selected_sq, self.flash_timer, self.auto_rotate)
                self.renderer.draw_valid_moves(self.board, self.valid_moves, self.auto_rotate)
                self.renderer.draw_pieces(self.board, self.auto_rotate)
                self.renderer.draw_sidebar(self)
                self.renderer.draw_promotion_menu(self.board.turn, self.waiting_for_promotion)
                if self.state == "GAME_OVER":
                    self.renderer.draw_game_over(self)
            
            pygame.display.flip()
            clock.tick(60)
            
        pygame.quit()
