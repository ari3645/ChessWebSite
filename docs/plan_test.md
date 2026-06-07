# Plan de Test - Projet Échecs

Ce document récapitule les tests unitaires effectués pour valider le moteur de jeu d'échecs.

## 1. Mouvements des Pièces
- [x] Pion : Avancée simple, double avancée initiale.
- [x] Pion : Capture diagonale.
- [x] Pion : En passant.
- [x] Pion : Promotion.
- [x] Cavalier : Mouvement en L, saut par-dessus d'autres pièces.
- [x] Fou : Mouvements diagonaux, blocage par d'autres pièces.
- [x] Tour : Mouvements rectilignes, blocage par d'autres pièces.
- [x] Dame : Mouvements combinés (rectiligne + diagonal).
- [x] Roi : Mouvement d'une case, capture.

## 2. Règles Spéciales
- [x] Roque : Petit et grand roque.
- [x] Roque : Interdiction si le roi a bougé.
- [x] Roque : Interdiction si la tour a bougé.
- [x] Roque : Interdiction si le chemin est obstrué.
- [x] Roque : Interdiction si le roi est en échec.
- [x] Roque : Interdiction si le roi traverse une case contrôlée.

## 3. États du Jeu
- [x] Échec : Détection du roi menacé.
- [x] Échec et Mat : Détection de la fin de partie.
- [x] Pat (Stalemate) : Détection de l'impossibilité de bouger sans être en échec.
- [x] Règle des 50 coups.
- [x] Triple répétition de position.
- [x] Matériel insuffisant.

## 4. Logique Globale
- [x] Alternance des tours.
- [x] Initialisation du plateau.
- [x] Empêcher un coup qui laisse son propre roi en échec.
- [x] Enregistrement de l'historique des positions.
