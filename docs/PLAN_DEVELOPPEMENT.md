# Plan de Développement - Jeu d'Échecs Python

Ce document suit l'évolution du projet de jeu d'échecs.

## 📌 Objectif
Créer un jeu d'échecs fonctionnel pour deux joueurs en local utilisant la bibliothèque Pygame, avec une architecture modulaire et propre.

---

## 📅 Étapes du Projet

### 🟦 Étape 1 : Architecture et Structure (Terminée)
- [x] Créer une structure de données propre pour le plateau (matrice 8x8).
- [x] Centraliser le chargement des images.
- [x] **Refactorisation Modulaire (MVC)** :
    - [x] `board.py` : Logique pure des échecs (Modèle).
    - [x] `renderer.py` : Gestion complète de l'affichage Pygame (Vue).
    - [x] `game_controller.py` : Gestion des événements et du flux de jeu (Contrôleur).
    - [x] `main.py` : Point d'entrée épuré.

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
- [x] Promotion du pion (Interface graphique de choix).
- [x] Détection de l'échec.
- [x] Prise en passant.
- [x] Échec et Mat.
- [x] Abandonner (Bouton pour déclarer forfait).
- [x] Fin de partie (Affichage du vainqueur et scores).

### 🟦 Étape 6 : Gestion des Parties Nulles (Draws) (Terminée)
- [x] Le Pat (Stalemate).
- [x] Règle des 50 coups (Aucune capture ni mouvement de pion).
- [x] Triple répétition de la position.
- [x] Manque de matériel (Impossibilité de mater).
- [x] Accord mutuel (Proposition/Acceptation de nulle).

### 🟦 Étape 7 : Polissage et Améliorations (En cours)
- [x] Réorganisation professionnelle de la structure des dossiers (src, assets, docs, tests).
- [x] Système de chronomètre (Timer Blitz/Rapid/Bullet) avec incréments.
- [x] Refonte de l'interface avec une classe Button (Hitboxes fiables, effets hover).
- [x] Nouveau design horizontal pour le menu principal.
- [x] Ajouter des effets sonores (déplacement, capture, échec).
- [ ] Historique des coups (notation algébrique standard).
- [ ] Menu de paramètres (choix des thèmes de couleurs et de l'apparence des pièces).
- [ ] (Amélioration) Différencier les sons de promotion (capture vs simple mouvement).
- [ ] (Optionnel) Sauvegarde et chargement de partie.

---

**Stack Technique :**
- **Langage :** Python 3.x
- **Bibliothèque :** Pygame
- **Architecture :** Modulaire / MVC / Professionnelle
- **Images :** Dossier `./assets/images/`
