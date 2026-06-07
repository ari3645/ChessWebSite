import pygame
import os
from src.constants import ROWS, COLS, PIECE_SCALE
from src.board import Board
from src.renderer import Renderer

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
        
        self.reset_game_state()
        self.state = "MENU"
        
        # Gestion des joueurs et scores
        self.player1_name = "Joueur 1"
        self.player2_name = "Joueur 2"
        self.score_p1 = 0.0
        self.score_p2 = 0.0
        self.p1_is_white = True
        self.active_input = None
        
        # Définition des zones de clic (Rects)
        self.init_ui_rects()

    def init_ui_rects(self):
        total_w = self.width + self.sidebar_width
        center_x = total_w // 2
        
        # Menu
        self.input_p1_rect = pygame.Rect(center_x - 150, 220, 300, 45)
        self.input_p2_rect = pygame.Rect(center_x - 150, 290, 300, 45)
        self.btn_clear1_rect = pygame.Rect(self.input_p1_rect.right + 10, 220, 100, 45)
        self.btn_clear2_rect = pygame.Rect(self.input_p2_rect.right + 10, 290, 100, 45)
        self.btn_play_rect = pygame.Rect(center_x - 100, 400, 200, 60)
        self.btn_quit_rect = pygame.Rect(center_x - 100, 500, 200, 60)
        
        # Game Over
        self.btn_replay_rect = pygame.Rect(total_w // 2 - 210, self.height // 2 + 80, 200, 50)
        self.btn_back_menu_rect = pygame.Rect(total_w // 2 + 10, self.height // 2 + 80, 200, 50)
        
        # Sidebar
        self.btn_rotate_rect = pygame.Rect(self.width + 25, self.height - 60, 200, 40)

    def reset_game_state(self, switch_colors=False):
        self.board = Board()
        self.selected_sq = None
        self.valid_moves = []
        self.waiting_for_promotion = None
        self.flash_timer = 0
        self.game_over = False
        self.draw_offered_by = None
        self.winner_by_resign = None
        self.mutual_draw = False
        self.auto_rotate = False
        
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
        if self.input_p1_rect.collidepoint(pos):
            self.active_input = 1
        elif self.input_p2_rect.collidepoint(pos):
            self.active_input = 2
        elif self.btn_clear1_rect.collidepoint(pos):
            self.player1_name = ""
            self.active_input = 1
        elif self.btn_clear2_rect.collidepoint(pos):
            self.player2_name = ""
            self.active_input = 2
        elif self.btn_play_rect.collidepoint(pos):
            p1_n = self.player1_name.strip()
            p2_n = self.player2_name.strip()
            if p1_n != "" and p2_n != "" and p1_n.lower() != p2_n.lower():
                self.reset_game_state()
                self.score_p1 = 0.0
                self.score_p2 = 0.0
                self.state = "PLAYING"
        elif self.btn_quit_rect.collidepoint(pos):
            return False
        else:
            self.active_input = None
        return True

    def handle_game_over_click(self, pos):
        if self.btn_replay_rect.collidepoint(pos):
            self.reset_game_state(switch_colors=True)
            self.state = "PLAYING"
        elif self.btn_back_menu_rect.collidepoint(pos):
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
            self.board.move_piece(start_sq, end_sq, choice)
            
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

                if self.board.move_piece(self.selected_sq, (row, col)):
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
        if self.btn_rotate_rect.collidepoint(pos):
            self.auto_rotate = not self.auto_rotate
            return

        color = 'n' if pos[1] < self.height // 2 else 'b'
        y_offset = 0 if color == 'n' else self.height // 2
        
        btn_resign_rect = pygame.Rect(self.width + 25, y_offset + 70, 200, 45)
        btn_draw_rect = pygame.Rect(self.width + 25, y_offset + 130, 200, 45)
        
        if btn_resign_rect.collidepoint(pos):
            self.winner_by_resign = 'b' if color == 'n' else 'n'
            self.game_over = True
        elif self.draw_offered_by is None:
            if btn_draw_rect.collidepoint(pos):
                self.draw_offered_by = color
        elif self.draw_offered_by != color:
            btn_accept_rect = pygame.Rect(self.width + 25, y_offset + 130, 95, 45)
            btn_refuse_rect = pygame.Rect(self.width + 130, y_offset + 130, 95, 45)
            if btn_accept_rect.collidepoint(pos):
                self.mutual_draw = True
                self.game_over = True
            elif btn_refuse_rect.collidepoint(pos):
                self.draw_offered_by = None

    def update_scores(self):
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
        elif self.game_over:
            self.score_p1 += 0.5
            self.score_p2 += 0.5

    def run(self):
        clock = pygame.time.Clock()
        running = True
        while running:
            if self.flash_timer > 0:
                self.flash_timer -= 1

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
            
            # Rendu
            if self.state == "MENU":
                names_ok = self.player1_name.strip() != "" and self.player2_name.strip() != ""
                names_diff = self.player1_name.strip().lower() != self.player2_name.strip().lower()
                self.renderer.draw_menu(self.player1_name, self.player2_name, self.active_input, names_ok and names_diff)
            else:
                self.renderer.draw_board(self.board, self.selected_sq, self.flash_timer, self.auto_rotate)
                self.renderer.draw_valid_moves(self.board, self.valid_moves, self.auto_rotate)
                self.renderer.draw_pieces(self.board, self.auto_rotate)
                self.renderer.draw_sidebar(self.player1_name, self.player2_name, self.score_p1, self.score_p2, 
                                           self.p1_is_white, self.auto_rotate, self.draw_offered_by)
                self.renderer.draw_promotion_menu(self.board.turn, self.waiting_for_promotion)
                if self.state == "GAME_OVER":
                    self.renderer.draw_game_over(self.board, self.winner_by_resign, self.mutual_draw)
            
            pygame.display.flip()
            clock.tick(60)
            
        pygame.quit()
