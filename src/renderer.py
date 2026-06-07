import pygame
from src.constants import ROWS, COLS, WHITE, GRAY, BLACK, DARK_GRAY, BLUE_HIGHLIGHT, RED, GREEN

class Renderer:
    def __init__(self, screen, square_size, sidebar_width, piece_size, piece_offset, images, fonts):
        self.screen = screen
        self.square_size = square_size
        self.width = square_size * 8
        self.height = square_size * 8
        self.sidebar_width = sidebar_width
        self.piece_size = piece_size
        self.piece_offset = piece_offset
        self.images = images
        self.fonts = fonts # Dictionary of fonts

    def get_visual_coords(self, row, col, auto_rotate, turn):
        """Traduit les coordonnées logiques en coordonnées visuelles selon la rotation."""
        if auto_rotate and turn == 'n':
            return 7 - row, 7 - col
        return row, col

    def draw_board(self, board, selected_sq, flash_timer, auto_rotate):
        # On cherche le roi en échec pour l'affichage
        king_in_check_pos = None
        if board.is_in_check(board.turn):
            for r in range(ROWS):
                for c in range(COLS):
                    if board.grid[r][c] == 'r' + board.turn:
                        king_in_check_pos = (r, c)
                        break

        for row in range(ROWS):
            for col in range(COLS):
                v_row, v_col = self.get_visual_coords(row, col, auto_rotate, board.turn)
                color = WHITE if (row + col) % 2 == 0 else GRAY
                
                # Affichage du Roi en rouge (Échec permanent ou clignotement)
                if (row, col) == king_in_check_pos or (flash_timer > 0 and board.grid[row][col] == 'r' + board.turn):
                    if flash_timer == 0 or (flash_timer // 10) % 2 == 0:
                        color = (255, 100, 100) # Rouge clair

                pygame.draw.rect(self.screen, color, (v_col * self.square_size, v_row * self.square_size, self.square_size, self.square_size))
                
                if selected_sq == (row, col):
                    pygame.draw.rect(self.screen, BLUE_HIGHLIGHT, (v_col * self.square_size, v_row * self.square_size, self.square_size, self.square_size))

    def draw_valid_moves(self, board, valid_moves, auto_rotate):
        """Dessine des indicateurs sur les cases où le déplacement est possible."""
        for move in valid_moves:
            row, col = move
            v_row, v_col = self.get_visual_coords(row, col, auto_rotate, board.turn)
            center = (v_col * self.square_size + self.square_size // 2, v_row * self.square_size + self.square_size // 2)
            
            target_piece = board.get_piece(row, col)
            if target_piece != "":
                pygame.draw.circle(self.screen, (255, 0, 0), center, self.square_size // 2, 5)
            else:
                pygame.draw.circle(self.screen, (0, 0, 0), center, self.square_size // 6)

    def draw_pieces(self, board, auto_rotate):
        for row in range(ROWS):
            for col in range(COLS):
                v_row, v_col = self.get_visual_coords(row, col, auto_rotate, board.turn)
                piece = board.get_piece(row, col)
                if piece != "":
                    x = v_col * self.square_size + self.piece_offset
                    y = v_row * self.square_size + self.piece_offset
                    self.screen.blit(self.images[piece], (x, y))

    def draw_promotion_menu(self, turn, waiting_for_promotion):
        if not waiting_for_promotion:
            return
            
        overlay = pygame.Surface((self.width, self.height))
        overlay.set_alpha(180)
        overlay.fill((0, 0, 0))
        self.screen.blit(overlay, (0, 0))
        
        menu_w, menu_h = self.square_size * 4, self.square_size
        menu_x = (self.width - menu_w) // 2
        menu_y = (self.height - menu_h) // 2
        
        pygame.draw.rect(self.screen, (200, 200, 200), (menu_x, menu_y, menu_w, menu_h))
        pygame.draw.rect(self.screen, (0, 0, 0), (menu_x, menu_y, menu_w, menu_h), 3)
        
        color = turn
        options = ['d', 't', 'f', 'c']
        for i, opt in enumerate(options):
            piece_img = self.images[opt + color]
            x = menu_x + i * self.square_size + self.piece_offset
            y = menu_y + self.piece_offset
            self.screen.blit(piece_img, (x, y))

    def draw_menu(self, player1_name, player2_name, active_input, can_play):
        self.screen.fill(DARK_GRAY)
        total_w = self.width + self.sidebar_width
        
        title = self.fonts['title'].render("JEU D'ÉCHECS", True, WHITE)
        self.screen.blit(title, (total_w // 2 - title.get_width() // 2, 80))
        
        y_input = 220
        center_x = total_w // 2
        
        input_p1_rect = pygame.Rect(center_x - 150, y_input, 300, 45)
        input_p2_rect = pygame.Rect(center_x - 150, y_input + 70, 300, 45)
        
        # P1
        color_p1 = GREEN if active_input == 1 else WHITE
        pygame.draw.rect(self.screen, color_p1, input_p1_rect, 2, border_radius=5)
        cursor1 = "|" if active_input == 1 and (pygame.time.get_ticks() // 500) % 2 == 0 else ""
        txt_p1 = self.fonts['btn'].render(f"P1: {player1_name}{cursor1}", True, WHITE)
        self.screen.blit(txt_p1, (input_p1_rect.x + 10, input_p1_rect.centery - txt_p1.get_height() // 2))
        
        # P2
        color_p2 = GREEN if active_input == 2 else WHITE
        pygame.draw.rect(self.screen, color_p2, input_p2_rect, 2, border_radius=5)
        cursor2 = "|" if active_input == 2 and (pygame.time.get_ticks() // 500) % 2 == 0 else ""
        txt_p2 = self.fonts['btn'].render(f"P2: {player2_name}{cursor2}", True, WHITE)
        self.screen.blit(txt_p2, (input_p2_rect.x + 10, input_p2_rect.centery - txt_p2.get_height() // 2))

        # Buttons Clear
        btn_clear1_rect = pygame.Rect(input_p1_rect.right + 10, input_p1_rect.y, 100, 45)
        btn_clear2_rect = pygame.Rect(input_p2_rect.right + 10, input_p2_rect.y, 100, 45)
        
        for rect in [btn_clear1_rect, btn_clear2_rect]:
            pygame.draw.rect(self.screen, (80, 80, 80), rect, border_radius=5)
            txt_clear = self.fonts['small'].render("Effacer", True, WHITE)
            self.screen.blit(txt_clear, (rect.centerx - txt_clear.get_width() // 2, rect.centery - txt_clear.get_height() // 2))

        # Play Button
        btn_play_rect = pygame.Rect(center_x - 100, 400, 200, 60)
        btn_play_color = GREEN if can_play else GRAY
        pygame.draw.rect(self.screen, btn_play_color, btn_play_rect, border_radius=10)
        txt_play = self.fonts['btn'].render("JOUER", True, WHITE)
        self.screen.blit(txt_play, (btn_play_rect.centerx - txt_play.get_width() // 2, btn_play_rect.centery - txt_play.get_height() // 2))

        # Quit Button
        btn_quit_rect = pygame.Rect(center_x - 100, 500, 200, 60)
        pygame.draw.rect(self.screen, RED, btn_quit_rect, border_radius=10)
        txt_quit = self.fonts['btn'].render("QUITTER", True, WHITE)
        self.screen.blit(txt_quit, (btn_quit_rect.centerx - txt_quit.get_width() // 2, btn_quit_rect.centery - txt_quit.get_height() // 2))

    def draw_game_over(self, board, winner_by_resign, mutual_draw):
        overlay = pygame.Surface((self.width + self.sidebar_width, self.height))
        overlay.set_alpha(200)
        overlay.fill((0, 0, 0))
        self.screen.blit(overlay, (0, 0))
        
        font_lg = pygame.font.SysFont('Arial', 64, bold=True)
        
        text_str = "MATCH NUL"
        subtext_str = "Partie terminée"
        
        if winner_by_resign:
            winner = "NOIRS" if winner_by_resign == 'n' else "BLANCS"
            text_str = "VICTOIRE PAR ABANDON"
            subtext_str = f"Les {winner} gagnent !"
        elif mutual_draw:
            subtext_str = "Par accord mutuel"
        elif board.is_checkmate(board.turn):
            winner = "NOIRS" if board.turn == 'b' else "BLANCS"
            text_str = "ECHEC ET MAT !"
            subtext_str = f"Victoire des {winner}"
        elif board.is_stalemate(board.turn):
            subtext_str = "Par Pat (Stalemate)"
        elif board.is_fifty_move_rule():
            subtext_str = "Règle des 50 coups"
        elif board.is_threefold_repetition():
            subtext_str = "Triple répétition"
        elif board.is_insufficient_material():
            subtext_str = "Manque de matériel"
        
        text = font_lg.render(text_str, True, WHITE)
        subtext = font_lg.render(subtext_str, True, (255, 215, 0) if "Victoire" in text_str or winner_by_resign else (200, 200, 200))
        
        total_w = self.width + self.sidebar_width
        self.screen.blit(text, (total_w // 2 - text.get_width() // 2, self.height // 2 - 150))
        self.screen.blit(subtext, (total_w // 2 - subtext.get_width() // 2, self.height // 2 - 50))

        # Replay/Menu Buttons
        btn_replay_rect = pygame.Rect(total_w // 2 - 210, self.height // 2 + 80, 200, 50)
        pygame.draw.rect(self.screen, GREEN, btn_replay_rect, border_radius=5)
        txt_replay = self.fonts['btn'].render("Rejouer", True, WHITE)
        self.screen.blit(txt_replay, (btn_replay_rect.centerx - txt_replay.get_width() // 2, btn_replay_rect.centery - txt_replay.get_height() // 2))

        btn_back_menu_rect = pygame.Rect(total_w // 2 + 10, self.height // 2 + 80, 200, 50)
        pygame.draw.rect(self.screen, (100, 100, 150), btn_back_menu_rect, border_radius=5)
        txt_back = self.fonts['btn'].render("Menu Principal", True, WHITE)
        self.screen.blit(txt_back, (btn_back_menu_rect.centerx - txt_back.get_width() // 2, btn_back_menu_rect.centery - txt_back.get_height() // 2))

    def draw_sidebar(self, player1_name, player2_name, score_p1, score_p2, p1_is_white, auto_rotate, draw_offered_by):
        pygame.draw.rect(self.screen, DARK_GRAY, (self.width, 0, self.sidebar_width, self.height))
        pygame.draw.line(self.screen, BLACK, (self.width, 0), (self.width, self.height), 2)

        self.draw_player_controls('n', 0, player1_name, player2_name, score_p1, score_p2, p1_is_white, draw_offered_by)
        self.draw_player_controls('b', self.height // 2, player1_name, player2_name, score_p1, score_p2, p1_is_white, draw_offered_by)
        
        btn_rotate_rect = pygame.Rect(self.width + 25, self.height - 60, 200, 40)
        color_rotate = GREEN if auto_rotate else GRAY
        pygame.draw.rect(self.screen, color_rotate, btn_rotate_rect, border_radius=5)
        txt_rotate = self.fonts['small'].render("Rotation Auto : ON" if auto_rotate else "Rotation Auto : OFF", True, WHITE)
        self.screen.blit(txt_rotate, (btn_rotate_rect.centerx - txt_rotate.get_width() // 2, btn_rotate_rect.centery - txt_rotate.get_height() // 2))

    def draw_player_controls(self, color, y_offset, player1_name, player2_name, score_p1, score_p2, p1_is_white, draw_offered_by):
        if color == 'b':
            name = player1_name if p1_is_white else player2_name
            score = score_p1 if p1_is_white else score_p2
        else:
            name = player2_name if p1_is_white else player1_name
            score = score_p2 if p1_is_white else score_p1

        display_text = f"{name} ({score})"
        title = self.fonts['btn'].render(display_text, True, WHITE)
        self.screen.blit(title, (self.width + (self.sidebar_width - title.get_width()) // 2, y_offset + 20))

        btn_resign_rect = pygame.Rect(self.width + 25, y_offset + 70, 200, 45)
        pygame.draw.rect(self.screen, RED, btn_resign_rect, border_radius=5)
        txt_resign = self.fonts['btn'].render("Abandonner", True, WHITE)
        self.screen.blit(txt_resign, (btn_resign_rect.centerx - txt_resign.get_width() // 2, btn_resign_rect.centery - txt_resign.get_height() // 2))

        btn_draw_rect = pygame.Rect(self.width + 25, y_offset + 130, 200, 45)
        
        if draw_offered_by == color:
            pygame.draw.rect(self.screen, GRAY, btn_draw_rect, border_radius=5)
            txt_draw = self.fonts['small'].render("Nulle proposée...", True, WHITE)
            self.screen.blit(txt_draw, (btn_draw_rect.centerx - txt_draw.get_width() // 2, btn_draw_rect.centery - txt_draw.get_height() // 2))
        elif draw_offered_by is not None:
            btn_accept_rect = pygame.Rect(self.width + 25, y_offset + 130, 95, 45)
            pygame.draw.rect(self.screen, GREEN, btn_accept_rect, border_radius=5)
            txt_accept = self.fonts['small'].render("Accepter", True, WHITE)
            txt_accept2 = self.fonts['small'].render("Nulle", True, WHITE)
            self.screen.blit(txt_accept, (btn_accept_rect.centerx - txt_accept.get_width() // 2, btn_accept_rect.centery - 12))
            self.screen.blit(txt_accept2, (btn_accept_rect.centerx - txt_accept2.get_width() // 2, btn_accept_rect.centery + 2))
            
            btn_refuse_rect = pygame.Rect(self.width + 130, y_offset + 130, 95, 45)
            pygame.draw.rect(self.screen, RED, btn_refuse_rect, border_radius=5)
            txt_refuse = self.fonts['small'].render("Refuser", True, WHITE)
            txt_refuse2 = self.fonts['small'].render("Nulle", True, WHITE)
            self.screen.blit(txt_refuse, (btn_refuse_rect.centerx - txt_refuse.get_width() // 2, btn_refuse_rect.centery - 12))
            self.screen.blit(txt_refuse2, (btn_refuse_rect.centerx - txt_refuse2.get_width() // 2, btn_refuse_rect.centery + 2))
        else:
            pygame.draw.rect(self.screen, (100, 100, 150), btn_draw_rect, border_radius=5)
            txt_draw = self.fonts['btn'].render("Proposer Nulle", True, WHITE)
            self.screen.blit(txt_draw, (btn_draw_rect.centerx - txt_draw.get_width() // 2, btn_draw_rect.centery - txt_draw.get_height() // 2))
