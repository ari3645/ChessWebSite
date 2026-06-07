# Plan de Test - Projet Échecs

Ce document récapitule les tests unitaires effectués pour valider le moteur de jeu d'échecs.

## 1. Mouvements des Pièces
- [x] Pion : Avancée simple, double avancée initiale.
- [x] Pion : Capture diagonale.
- [x] Pion : En passant (Blancs et Noirs).
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
- [x] Empêcher un coup qui laisse son propre roi en échec (Clouage).
- [x] Enregistrement de l'historique des positions.
- [x] Validation des coups (départ vide, capture de sa propre pièce, mouvement invalide).
- [ ] Blocage des pièces : Vérifier que chaque pièce est bloquée par ses propres alliés et ne peut pas sauter (sauf cavalier).
- [ ] Échec à la découverte : Vérifier qu'un mouvement peut créer un échec sans que la pièce déplacée n'attaque le roi.
- [ ] Double échec : Vérifier la détection de plusieurs menaces simultanées.

## 5. Contrôle du Temps
- [x] Sélection du mode de temps dans le menu (via Button class).
- [x] Décompte précis du temps pour le joueur actif.
- [x] Arrêt du décompte lors du changement de tour.
- [x] Ajout correct de l'incrément après chaque coup.
- [x] Détection de la défaite au temps (00:00).
- [x] Fonctionnement correct du mode "Sans temps".

## 6. Scénarios Limites (Edge Cases)
- [ ] Promotion capturante : Capturer une pièce sur la 8ème rangée et promouvoir en même temps.
- [ ] Pion bloqué : Vérifier qu'un pion ne peut pas capturer en avant ni avancer si bloqué.
- [ ] Roque & Clouage : Vérifier que le roque est impossible si une tour est clouée (Note: en réalité c'est autorisé si le roi n'est pas menacé, à vérifier).
- [ ] Triple répétition complexe : Position répétée avec des droits de roque différents.
