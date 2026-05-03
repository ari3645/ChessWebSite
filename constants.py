import pygame

# Configuration
ROWS, COLS = 8, 8

# Couleurs
WHITE = (255, 255, 255)
GRAY = (96, 96, 96)
BLUE_HIGHLIGHT = (201, 224, 249)

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
