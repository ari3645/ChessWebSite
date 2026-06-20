# Plan de Développement & Spécification : IA Jeu d'Échecs

Ce document recense les étapes, l'architecture et les spécifications exclusives à l'intégration de l'Intelligence Artificielle au sein du jeu d'échecs.

---

## 🎯 Objectif
Concevoir une IA performante (niveau amateur fort / club, estimé à 1600-1900 Elo) combinant un **moteur de calcul tactique brut** (Minimax) et un **moteur d'apprentissage continu et persistant** (Q-learning + TD-learning via IndexedDB) qui progresse au fil des parties, sans affecter les performances de l'interface utilisateur.

---

## ⚙️ Architecture Globale

```
                     +---------------------------------------+
                     |  Interface Utilisateur (Main Thread)  |
                     +---------------------------------------+
                                   ▲          │
                    searchResult   |          | search (boardState, depth)
                    JSON Message   |          | JSON Message
                                   │          ▼
                     +---------------------------------------+
                     |        Web Worker (Thread IA)         |
                     +---------------------------------------+
                                   ▲          │
             Charger / Sauvegarder |          | Lire / Écrire
             Poids & Statistiques  |          | Tables d'apprentissages
                                   │          ▼
                     +---------------------------------------+
                     |        Persistance (IndexedDB)        |
                     +---------------------------------------+
```

---

## 📅 Étapes et Suivi de l'IA

### 🔴 Étape 1 : Infrastructure & Communication (Terminée)
- [x] Création de [aiWorker.js](file:///C:/Users/albin/Documents/Vie/ESGI_B3/Archive/Archive_Term/Python_term/Projet/Projet_Echecs/src/aiWorker.js) pour déporter les calculs hors du thread principal.
- [x] Ajout de méthodes de sérialisation et copie d'état dans [board.js](file:///C:/Users/albin/Documents/Vie/ESGI_B3/Archive/Archive_Term/Python_term/Projet/Projet_Echecs/src/board.js) ([getState()](file:///C:/Users/albin/Documents/Vie/ESGI_B3/Archive/Archive_Term/Python_term/Projet/Projet_Echecs/src/board.js#L24) / [loadState()](file:///C:/Users/albin/Documents/Vie/ESGI_B3/Archive/Archive_Term/Python_term/Projet/Projet_Echecs/src/board.js#L35)).
- [x] Liaison et gestion du cycle de vie du Worker dans [gameController.js](file:///C:/Users/albin/Documents/Vie/ESGI_B3/Archive/Archive_Term/Python_term/Projet/Projet_Echecs/src/gameController.js).
- [x] Blocage des clics utilisateur et affichage d'un statut "L'IA réfléchit..." lors des calculs.

### 🟡 Étape 2 : Moteur de Calcul Brut (Terminée)
- [x] Écriture de l'évaluation matérielle et positionnelle (Tables de Positionnement - PST) pour orienter le style de jeu.
- [x] Implémentation du Minimax récursif avec élagage Alpha-Beta pour élaguer l'arbre de recherche.
- [x] Ajout du tri des coups (Move Ordering) priorisant les captures pour accélérer massivement la recherche.
- [x] Intégration de la sélection de difficulté (Profondeur 1 à 4).
- [x] Intégration de notions positionnelles avancées (Heuristiques) :
    - **Contrôle du Centre** : Pression et occupation des cases centrales (d4, d5, e4, e5) par les pièces.
    - **Pawn Center Duo** : Bonus pour la paire de pions centraux alliés d4/e4 (blancs) ou d5/e5 (noirs).
    - **Knights on the Rim** : Malus pour les cavaliers en bordure (colonnes A/H).
    - **Développement précoce** : Pénalité pour les cavaliers et fous non développés.
    - **Early Queen Development** : Pénalité si la Dame sort prématurément alors que les pièces mineures ne sont pas développées.
    - **Paires de Fous** : Bonus d'activité.
    - **Fous obstrués (Bad Bishops)** : Pénalité pour les fous bloqués par leurs propres pions sur la même couleur de case.
    - **Structures de pions** : Doublés, isolés, connectés.
    - **Pions passés & Bloque** : Bonus progressif, atténué si le pion est bloqué par une pièce ennemie ou alliée.
    - **Règle de Tarrasch** : Alignement d'une Tour derrière son pion passé.
    - **Tours actives** : Colonnes ouvertes/semi-ouvertes et 7ème rangée.
    - **Tours connectées** : Protection mutuelle.
    - **Sécurité du Roi** : Bouclier de pions, droits de roquer, et pénalité d'exposition aux colonnes ouvertes/semi-ouvertes.
    - **Fourchettes (Forks) tactiques** : Détection des fourchettes de pion et cavalier.
    - **Centralisation du Roi en finale** : Transition automatique vers le centre dès que le matériel non-pion tombe sous 1500 cp.

### 🟢 Étape 3 : Module d'Apprentissage & Persistance (Terminée)
- [x] **Persistance IndexedDB** : Initialisation d'une base de données locale dans le navigateur pour stocker les modèles appris.
- [x] **Livre d'Ouvertures Dynamique (Q-learning)** :
    - L'IA enregistre les états de début de partie (jusqu'au coup 12).
    - Elle attribue une note (Q-value) à chaque coup joué en fonction du résultat final.
    - Au fil des parties, elle apprend à jouer de meilleures ouvertures et à éviter les pièges.
- [x] **Ajustement Positionnel (TD-learning / Différence Temporelle)** :
    - Les poids de la fonction d'évaluation s'ajustent de manière adaptative selon les fins de parties.

### 🔵 Étape 4 : Améliorations de Jeu & Styles (Partiellement Terminée)
- [x] **Styles de jeu asymétriques** (Défensif vs Agressif) :
    - *IA Défensive* : Focus sur le bouclier de pions et maintien du Roi à l'abri.
    - *IA Testeuse (Agressive)* : Avancement des pièces, proximité du Roi adverse, et Pawn Storm (poussée des pions de l'aile du Roi adverse).
- [x] **Affichage asynchrone des évaluations réelles** en centipions pour chaque IA à côté de leur badge nominatif.
- [x] **Recherche de Calme (Quiescence Search)** : Résolution de l'effet d'horizon en prolongeant l'analyse tant qu'il y a des captures/échecs en suspens.
- [x] **Iterative Deepening** : Permettre à l'IA de gérer son temps de réflexion de façon progressive et adaptative (avec coupure de sécurité à 5 secondes max).
- [ ] **Gestion Adaptative du Temps (Time Management)** : Permettre à l'IA d'adapter sa profondeur de recherche selon le temps restant à la pendule.
