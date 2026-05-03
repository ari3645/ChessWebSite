import pygame
import os
from constants import ROWS, COLS, WHITE, GRAY, BLUE_HIGHLIGHT
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
        
        self.screen = pygame.display.set_mode((self.width, self.height))
        pygame.display.set_caption("Jeu d'Échecs - Modulaire")
        
        self.images = {}
        self.load_images()
        
        self.board = Board()
        self.selected_sq = None
        self.valid_moves = []
        self.waiting_for_promotion = None # Stocke (start_sq, end_sq) si on attend un choix
        self.flash_timer = 0 # Timer pour le clignotement rouge du roi
        self.game_over = False

    def load_images(self):
        pieces = ['pb', 'pn', 'tb', 'tn', 'cb', 'cn', 'fb', 'fn', 'db', 'dn', 'rb', 'rn']
        for piece in pieces:
            path = os.path.join("Image", f"{piece}.png")
            try:
                img = pygame.image.load(path)
                self.images[piece] = pygame.transform.scale(img, (self.square_size, self.square_size))
            except Exception as e:
                print(f"Erreur de chargement for {path}: {e}")

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
                color = WHITE if (row + col) % 2 == 0 else GRAY
                
                # Affichage du Roi en rouge (Échec permanent ou clignotement)
                if (row, col) == king_in_check_pos or (self.flash_timer > 0 and self.board.grid[row][col] == 'r' + self.board.turn):
                    # Si c'est le flash_timer, on alterne les couleurs pour l'effet clignotant
                    if self.flash_timer == 0 or (self.flash_timer // 10) % 2 == 0:
                        color = (255, 100, 100) # Rouge clair

                pygame.draw.rect(self.screen, color, (col * self.square_size, row * self.square_size, self.square_size, self.square_size))
                
                if self.selected_sq == (row, col):
                    pygame.draw.rect(self.screen, BLUE_HIGHLIGHT, (col * self.square_size, row * self.square_size, self.square_size, self.square_size))

    def draw_valid_moves(self):
        """Dessine des indicateurs sur les cases où le déplacement est possible."""
        for move in self.valid_moves:
            row, col = move
            center = (col * self.square_size + self.square_size // 2, row * self.square_size + self.square_size // 2)
            
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
                piece = self.board.get_piece(row, col)
                if piece != "":
                    self.screen.blit(self.images[piece], (col * self.square_size, row * self.square_size))

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
            self.screen.blit(piece_img, (menu_x + i * self.square_size, menu_y))

    def draw_game_over(self):
        """Affiche le message de fin de partie."""
        if not self.game_over:
            return
            
        overlay = pygame.Surface((self.width, self.height))
        overlay.set_alpha(200)
        overlay.fill((0, 0, 0))
        self.screen.blit(overlay, (0, 0))
        
        font = pygame.font.SysFont('Arial', 64, bold=True)
        # Le gagnant est celui dont ce n'est pas le tour (puisque turn a changé)
        winner = "NOIRS" if self.board.turn == 'b' else "BLANCS"
        text = font.render(f"ECHEC ET MAT !", True, (255, 255, 255))
        subtext = font.render(f"Victoire des {winner}", True, (255, 215, 0))
        
        self.screen.blit(text, (self.width // 2 - text.get_width() // 2, self.height // 2 - 100))
        self.screen.blit(subtext, (self.width // 2 - subtext.get_width() // 2, self.height // 2))

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
            
            # Vérifier mat après promotion
            if self.board.is_checkmate(self.board.turn):
                self.game_over = True
                
            self.waiting_for_promotion = None
            self.selected_sq = None
            self.valid_moves = []

    def handle_click(self, pos):
        if self.game_over:
            return

        if self.waiting_for_promotion:
            self.handle_promotion_click(pos)
            return

        col = pos[0] // self.square_size
        row = pos[1] // self.square_size
        
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
                    # Vérifier si le coup a mis l'adversaire en échec et mat
                    if self.board.is_checkmate(self.board.turn):
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

    def run(self):
        clock = pygame.time.Clock()
        running = True
        while running:
            # Gestion du timer de clignotement
            if self.flash_timer > 0:
                self.flash_timer -= 1

            # Mise à jour du titre avec le tour actuel
            if not self.game_over:
                turn_str = "Blancs" if self.board.turn == 'b' else "Noirs"
                pygame.display.set_caption(f"Jeu d'Échecs - Tour : {turn_str}")
            else:
                pygame.display.set_caption("FIN DE PARTIE - Echec et Mat")
            
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    self.handle_click(pygame.mouse.get_pos())
            
            self.draw_board()
            self.draw_valid_moves() # On dessine les points avant les pièces
            self.draw_pieces()
            self.draw_promotion_menu() # Menu par-dessus tout
            self.draw_game_over() # Message de fin par-dessus tout
            pygame.display.flip()
            clock.tick(60)
            
        pygame.quit()

if __name__ == "__main__":
    game = ChessGame()
    game.run()
