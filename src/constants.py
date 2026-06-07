import pygame

# Configuration
ROWS, COLS = 8, 8

# Couleurs
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GRAY = (96, 96, 96)
DARK_GRAY = (50, 50, 50)
BLUE_HIGHLIGHT = (201, 224, 249)
RED = (200, 50, 50)
GREEN = (50, 200, 50)
PIECE_SCALE = 0.8  # Ratio de la taille de la pièce par rapport à la case (0.8 = 80%)

# Mapping des pièces pour le plateau initial
INITIAL_BOARD = [
    ["tn", "cn", "fn", "dn", "rn", "fn", "cn", "tn"],
    ["pn", "pn", "pn", "pn", "pn", "pn", "pn", "pn"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["pb", "pb", "pb", "pb", "pb", "pb", "pb", "pb"],
    ["tb", "cb", "fb", "db", "rb", "fb", "cb", "tb"]
]
