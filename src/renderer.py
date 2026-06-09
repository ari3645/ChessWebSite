import pygame
from src.constants import ROWS, COLS, WHITE, GRAY, BLACK, DARK_GRAY, BLUE_HIGHLIGHT, RED, GREEN
from src.ui import Button

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
        
        # On ajoute une option pour annuler (la croix)
        menu_w, menu_h = self.square_size * 5, self.square_size
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
            
        # Dessin de la croix d'annulation
        cross_x = menu_x + 4 * self.square_size
        pygame.draw.line(self.screen, RED, (cross_x + 20, menu_y + 20), (cross_x + self.square_size - 20, menu_y + self.square_size - 20), 5)
        pygame.draw.line(self.screen, RED, (cross_x + self.square_size - 20, menu_y + 20), (cross_x + 20, menu_y + self.square_size - 20), 5)

    def draw_menu(self, controller, can_play):
        self.screen.fill(DARK_GRAY)
        total_w = self.width + self.sidebar_width
        
        title = self.fonts['title'].render("JEU D'ÉCHECS", True, WHITE)
        self.screen.blit(title, (total_w // 2 - title.get_width() // 2, 80))
        
        # Inputs (Rects)
        color_p1 = GREEN if controller.active_input == 1 else WHITE
        pygame.draw.rect(self.screen, color_p1, controller.input_p1_rect, 2, border_radius=5)
        cursor1 = "|" if controller.active_input == 1 and (pygame.time.get_ticks() // 500) % 2 == 0 else ""
        txt_p1 = self.fonts['btn'].render(f"P1: {controller.player1_name}{cursor1}", True, WHITE)
        self.screen.blit(txt_p1, (controller.input_p1_rect.x + 10, controller.input_p1_rect.centery - txt_p1.get_height() // 2))
        
        color_p2 = GREEN if controller.active_input == 2 else WHITE
        pygame.draw.rect(self.screen, color_p2, controller.input_p2_rect, 2, border_radius=5)
        cursor2 = "|" if controller.active_input == 2 and (pygame.time.get_ticks() // 500) % 2 == 0 else ""
        txt_p2 = self.fonts['btn'].render(f"P2: {controller.player2_name}{cursor2}", True, WHITE)
        self.screen.blit(txt_p2, (controller.input_p2_rect.x + 10, controller.input_p2_rect.centery - txt_p2.get_height() // 2))

        # Draw Buttons
        controller.btn_clear1.draw(self.screen)
        controller.btn_clear2.draw(self.screen)
        controller.btn_time.draw(self.screen)
        
        if controller.time_menu_open:
            # Menu de temps est dessiné au-dessus de tout
            # On dessine un fond pour le menu
            bg_rect = pygame.Rect(controller.btn_time.rect.x, controller.btn_time.rect.bottom, controller.btn_time.rect.width, len(controller.time_option_buttons) * 35)
            pygame.draw.rect(self.screen, (30, 30, 50), bg_rect)
            pygame.draw.rect(self.screen, WHITE, bg_rect, 1)
            for i, btn in enumerate(controller.time_option_buttons):
                # Highlight if selected
                if i == controller.selected_time_idx:
                    pygame.draw.rect(self.screen, (100, 100, 200), btn.rect)
                    pygame.draw.rect(self.screen, WHITE, btn.rect, 1)
                btn.draw(self.screen)

        controller.btn_play.color = GREEN if can_play else GRAY
        controller.btn_play.hover_color = (100, 255, 100) if can_play else GRAY
        controller.btn_play.draw(self.screen)
        controller.btn_quit.draw(self.screen)

    def draw_game_over(self, controller):
        overlay = pygame.Surface((self.width + self.sidebar_width, self.height))
        overlay.set_alpha(200)
        overlay.fill((0, 0, 0))
        self.screen.blit(overlay, (0, 0))
        
        font_lg = pygame.font.SysFont('Arial', 64, bold=True)
        
        text_str = "MATCH NUL"
        subtext_str = "Partie terminée"
        
        if controller.winner_by_resign:
            winner = "NOIRS" if controller.winner_by_resign == 'n' else "BLANCS"
            text_str = "VICTOIRE PAR ABANDON"
            subtext_str = f"Les {winner} gagnent !"
        elif controller.winner_by_timeout:
            winner = "NOIRS" if controller.winner_by_timeout == 'n' else "BLANCS"
            text_str = "TEMPS ÉCOULÉ"
            subtext_str = f"Les {winner} gagnent !"
        elif controller.mutual_draw:
            subtext_str = "Par accord mutuel"
        elif controller.board.is_checkmate(controller.board.turn):
            winner = "NOIRS" if controller.board.turn == 'b' else "BLANCS"
            text_str = "ECHEC ET MAT !"
            subtext_str = f"Victoire des {winner}"
        elif controller.board.is_stalemate(controller.board.turn):
            subtext_str = "Par Pat (Stalemate)"
        elif controller.board.is_fifty_move_rule():
            subtext_str = "Règle des 50 coups"
        elif controller.board.is_threefold_repetition():
            subtext_str = "Triple répétition"
        elif controller.board.is_insufficient_material():
            subtext_str = "Manque de matériel"
        
        text = font_lg.render(text_str, True, WHITE)
        subtext = font_lg.render(subtext_str, True, (255, 215, 0) if "Victoire" in text_str or controller.winner_by_resign or controller.winner_by_timeout else (200, 200, 200))
        
        total_w = self.width + self.sidebar_width
        self.screen.blit(text, (total_w // 2 - text.get_width() // 2, self.height // 2 - 150))
        self.screen.blit(subtext, (total_w // 2 - subtext.get_width() // 2, self.height // 2 - 50))

        controller.btn_replay.draw(self.screen)
        controller.btn_back_menu.draw(self.screen)

    def draw_sidebar(self, controller):
        pygame.draw.rect(self.screen, DARK_GRAY, (self.width, 0, self.sidebar_width, self.height))
        pygame.draw.line(self.screen, BLACK, (self.width, 0), (self.width, self.height), 2)

        self.draw_player_controls('n', 0, controller)
        self.draw_player_controls('b', self.height // 2, controller)
        
        controller.btn_rotate.draw(self.screen)

    def draw_player_controls(self, color, y_offset, controller):
        p1_is_white = controller.p1_is_white
        time_p1, time_p2 = controller.time_p1, controller.time_p2
        draw_offered_by = controller.draw_offered_by
        
        if color == 'b':
            name = controller.player1_name if p1_is_white else controller.player2_name
            score = controller.score_p1 if p1_is_white else controller.score_p2
            time_ms = time_p1 if p1_is_white else time_p2
        else:
            name = controller.player2_name if p1_is_white else controller.player1_name
            score = controller.score_p2 if p1_is_white else controller.score_p1
            time_ms = time_p2 if p1_is_white else time_p1

        # Affichage du temps
        if time_ms is not None:
            seconds = max(0, int(time_ms // 1000))
            minutes = seconds // 60
            seconds %= 60
            time_str = f"{minutes:02}:{seconds:02}"
            time_color = RED if time_ms < 10000 else WHITE
            txt_time = self.fonts['title'].render(time_str, True, time_color)
            txt_time = pygame.transform.scale(txt_time, (int(txt_time.get_width() * 0.5), int(txt_time.get_height() * 0.5)))
            self.screen.blit(txt_time, (self.width + (self.sidebar_width - txt_time.get_width()) // 2, y_offset + 10))
            y_name_offset = 55
        else:
            y_name_offset = 20

        display_text = f"{name} ({score})"
        title = self.fonts['btn'].render(display_text, True, WHITE)
        self.screen.blit(title, (self.width + (self.sidebar_width - title.get_width()) // 2, y_offset + y_name_offset))

        # Drawing buttons (using standard Button objects defined dynamically for now to match logic)
        btn_resign = Button((self.width + 25, y_offset + y_name_offset + 50, 200, 45), RED, "Abandonner", self.fonts['btn'])
        btn_resign.draw(self.screen)

        if draw_offered_by == color:
            # Button is "disabled" or shows status
            btn_pending = Button((self.width + 25, y_offset + y_name_offset + 110, 200, 45), GRAY, "Nulle proposée...", self.fonts['small'])
            btn_pending.draw(self.screen)
        elif draw_offered_by is not None:
            btn_accept = Button((self.width + 25, y_offset + y_name_offset + 110, 95, 45), GREEN, "Accepter", self.fonts['small'])
            btn_refuse = Button((self.width + 130, y_offset + y_name_offset + 110, 95, 45), RED, "Refuser", self.fonts['small'])
            btn_accept.draw(self.screen)
            btn_refuse.draw(self.screen)
        else:
            btn_draw = Button((self.width + 25, y_offset + y_name_offset + 110, 200, 45), (100, 100, 150), "Proposer Nulle", self.fonts['btn'])
            btn_draw.draw(self.screen)
