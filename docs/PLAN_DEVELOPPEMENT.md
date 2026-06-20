# Plan de Développement - Jeu d'Échecs

Ce document suit l'évolution du projet de jeu d'échecs.

## 📌 Objectif
Créer un jeu d'échecs fonctionnel pour deux joueurs en local avec une interface fluide, moderne et une architecture modulaire propre.

---

## 📅 Étapes du Projet

### 🟦 Étape 1 : Architecture et Structure (Terminée)
- [x] Créer une structure de données propre pour le plateau (matrice 8x8).
- [x] Centraliser le chargement des images.
- [x] **Refactorisation Modulaire (MVC)** :
    - [x] `board.js` (dans app.js) : Logique pure des échecs (Modèle).
    - [x] CSS / DOM : Gestion complète de l'affichage HTML/CSS (Vue).
    - [x] `game_controller.js` (dans app.js) : Gestion des événements et du flux de jeu (Contrôleur).
    - [x] `index.html` : Point d'entrée épuré.

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
- [x] Réorganisation professionnelle de la structure des dossiers (Web migration).
- [x] Système de chronomètre (Timer Blitz/Rapid/Bullet) avec incréments.
- [x] Refonte de l'interface avec des boutons interactifs (Hitboxes fiables, effets hover).
- [x] Nouveau design moderne pour le menu principal.
- [x] Ajouter des effets sonores (déplacement, capture, échec) via Web Audio API.
- [x] Historique des coups (notation algébrique en français dans la barre latérale, navigation au clic et boutons, raccourcis clavier, bannière interactive de retour au direct, export PGN standard en anglais (importation retirée)).
- [x] Réorganisation et intégration des tests unitaires complets dans un dossier dédié `/tests` avec tableau de bord web interactif.
- [ ] Menu de paramètres (choix des thèmes de couleurs et de l'apparence des pièces).
- [x] (Amélioration) Ajustement et priorité des sons (Échec > Promotion > Roque > Prise > Mouvement).
- [x] Sauvegarde et chargement de partie (via sessionStorage).
- [ ] (Amélioration) Outils d'analyse graphique en jeu : tracé de flèches (clic droit maintenu + glissé) et coloration des cases (clic droit simple).


### 🟦 Étape 8 : Intégration de l'IA (En cours)
- [x] Spécification et architecture (Pure JS avec Web Worker pour préserver la portabilité).
- [x] Moteur de recherche brute force (Minimax + élagage Alpha-Beta + tri des coups + tables PST).
- [x] Intégration dans le contrôleur (Menu de configuration, blocage des actions humaines pendant le calcul, auto-play IA vs IA).
- [/] Apprentissage continu par renforcement (Livre d'ouvertures Q-learning terminé, ajustement heuristique TD-learning à venir).
- [x] Persistance à long terme (IndexedDB).


---

**Stack Technique Actuelle (Migration Web) :**
- **Langage :** HTML5 / CSS3 / JavaScript (ES6+)
- **Affichage :** Grid CSS, Rendu vectoriel SVG dynamique
- **Audio :** Web Audio API (Synthesizer)
- **Architecture :** Client-side MVC
