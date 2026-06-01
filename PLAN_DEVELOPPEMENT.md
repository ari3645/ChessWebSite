# Plan de Développement - Jeu d'Échecs Python

Ce document suit l'évolution du projet de jeu d'échecs.

## 📌 Objectif
Créer un jeu d'échecs fonctionnel pour deux joueurs en local utilisant la bibliothèque Pygame.

---

## 📅 Étapes du Projet

### 🟦 Étape 1 : Refactorisation et Structure (Terminée)
- [x] Créer une structure de données propre pour le plateau (matrice 8x8).
- [x] Centraliser le chargement des images.
- [x] Créer une fonction de rendu (render) qui dessine le plateau et les pièces à partir de l'état du jeu.

### 🟦 Étape 2 : Interaction Joueur (Terminée)
- [x] Implémenter la sélection d'une pièce au clic.
- [x] Gérer le deuxième clic pour le déplacement.
- [x] Mettre à jour la matrice du plateau après un mouvement.

### 🟦 Étape 3 : Logique de Mouvement (Terminée)
- [x] Déplacements valides pour chaque pièce :
    - [x] Pion (avancée simple, double au départ, capture en diagonale).
    - [x] Tour (horizontal/vertical, arrêt aux obstacles).
    - [x] Fou (diagonales, arrêt aux obstacles).
    - [x] Cavalier (mouvement en L, saute par-dessus les pièces).
    - [x] Reine (combinaison Tour + Fou).
    - [x] Roi (1 case autour).

### 🟦 Étape 4 : Règles de Jeu (Terminée)
- [x] Alternance des tours (Blancs / Noirs).
- [x] Empêcher un joueur de bouger les pièces de l'adversaire.
- [x] Gestion des captures (enlever la pièce adverse du plateau).

### 🟦 Étape 5 : Coups Spéciaux & Fin de match (Terminée)
- [x] Le Roque (Coup spécial Roi + Tour).
- [x] Promotion du pion (Transformer le pion arrivé au bout).
- [x] Détection de l'échec.
- [x] Prise en passant.
- [x] Échec et Mat.
- [x] Abandonner (Bouton pour déclarer forfait).
- [x] Fin de partie (Affichage du vainqueur).

### 🟦 Étape 6 : Gestion des Parties Nulles (Draws) (Terminée)
- [x] Le Pat (Stalemate).
- [x] Règle des 50 coups (Aucune capture ni mouvement de pion).
- [x] Triple répétition de la position.
- [x] Manque de matériel (Impossibilité de mater).
- [x] Accord mutuel (Proposition/Acceptation de nulle).
- [ ] (Optionnel) Manque de temps contre manque de matériel.
- **Bibliothèque :** Pygame
- **Dimensions :** Grille 8x8, cases de 118px.
- **Images :** Dossier `./Image/`
