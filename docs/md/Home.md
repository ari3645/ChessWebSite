# ♟️ Projet Échecs IA - Accueil

Bienvenue sur le Wiki officiel du projet **Jeu d'Échecs avec Intelligence Artificielle**. 

Ce projet est une application web moderne (Vanilla JS / HTML5 / CSS3) intégrant un moteur d'échecs complet et une IA dotée de capacités de calcul tactique et d'apprentissage continu, s'exécutant entièrement côté front-end.

## 🚀 Fonctionnalités Clés
- **Modes de Jeu** : Joueur vs Joueur (local), Joueur vs IA (Blancs/Noirs) et IA vs IA (Mode entraînement).
- **Moteur Tactique Brut** : Algorithme Minimax avec élagage Alpha-Beta et tri des coups.
- **Améliorations de recherche** : Recherche de calme (Quiescence Search) et Approfondissement Itératif (Iterative Deepening).
- **Apprentissage Hybride** : 
  - *Livre d'Ouvertures Dynamique* (Q-learning) basé sur le résultat des parties.
  - *Ajustement positionnel automatique* (TD-learning) des paramètres de jeu.
- **Régulation de Temps** : Interruption de recherche automatique au bout de 5 secondes.
- **Zéro dépendance serveur** : Persistance locale via IndexedDB dans le navigateur et calculs hors-thread via Web Worker.

## 📖 Sommaire de la Documentation
Cliquez sur les liens ci-dessous ou utilisez le menu de droite pour explorer les détails techniques :
1. [[Architecture Technique]] — Threading et persistance IndexedDB.
2. [[Moteur d'Intelligence Artificielle]] — Fonctionnement du Minimax et de l'élagage.
3. [[Heuristiques d'Évaluation]] — Le détail des formules positionnelles.
4. [[Module d'Apprentissage]] — Q-learning et TD-learning.
