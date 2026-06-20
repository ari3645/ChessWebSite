# ♟️ Jeu d'Échecs & IA Tactique Apprenante

Bienvenue sur le projet **Jeu d'Échecs IA**, une application web moderne intégrant un moteur d'échecs complet et une intelligence artificielle apprenante autonome, s'exécutant entièrement côté front-end (dans votre navigateur).

[![GitHub license](https://img.shields.io/github/license/ari3645/Chess?style=flat-square)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/ari3645/Chess?style=flat-square)](https://github.com/ari3645/Chess/stargazers)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Soutenir-orange?style=flat-square&logo=buy-me-a-coffee)](https://buymeacoffee.com/ari3645)

---

## 🚀 Fonctionnalités Majeures

### 🎮 Modes de Jeu
- **Joueur vs Joueur (Local)** : Jouez de manière classique contre un ami sur la même machine.
- **Joueur vs IA** : Affrontez l'intelligence artificielle en choisissant de mener les Blancs ou les Noirs.
- **IA vs IA (Entraînement)** : Regardez deux profils d'IA s'affronter en boucle (style défensif vs agressif) à leur puissance maximale (profondeur 4 / Expert) pour entraîner le modèle.

### 🧠 Moteur Tactique de l'IA (Minimax & Alpha-Beta)
- **Élagage Alpha-Beta** : Optimisation drastique de l'exploration arborescente pour couper les branches inutiles.
- **Tri des Coups (Move Ordering)** : Classement des coups légaux (captures prioritaires via MVV-LVA, promotions, etc.) pour maximiser l'efficacité de l'élagage.
- **Recherche de Calme (Quiescence Search)** : Prolongation de la recherche pour les captures et échecs afin d'éviter l'effet d'horizon.
- **Approfondissement Itératif (Iterative Deepening)** : Recherche progressive avec sécurité de temps qui renvoie le meilleur coup calculé si le calcul dépasse 5 secondes.

### 📈 Module d'Apprentissage Machine (ML)
- **Livre d'Ouvertures Dynamique (Q-learning)** : L'IA évalue la force de ses 12 premiers coups en fonction du résultat de la partie (Victoire/Défaite/Nulle) pour jouer de meilleures ouvertures au fil du temps.
- **Ajustement Positionnel (TD-learning / Différence Temporelle)** : Les 18 coefficients de la fonction d'évaluation positionnelle (sécurité du roi, pions passés, fous bloqués, etc.) s'ajustent de manière adaptative à la fin de chaque partie.
- **Persistance IndexedDB** : Toutes les données d'apprentissage sont enregistrées localement dans la base de données de votre navigateur (`ChessAI_DB`).

### 🎨 Design & Ergonomie
- Interface moderne, réactive et optimisée (thème sombre élégant).
- Affichage en temps réel des évaluations (en centipions) pour chaque IA.
- Gestion complète des pendules avec prise en charge du temps d'incrément (style Fischer).
- Historique complet des coups joués.

---

## ⚙️ Architecture Technique

Pour éviter tout gel de l'interface graphique lors de l'exploration de millions de positions par l'IA, le calcul est déporté dans un **Web Worker** indépendant :

```
+---------------------------------------+
|  Interface Utilisateur (Main Thread)  |
+---------------------------------------+
              ▲          │
searchResult  |          | search (boardState, depth)
JSON Message  |          | JSON Message
              │          ▼
+---------------------------------------+
|        Web Worker (Thread IA)         |
+---------------------------------------+
              ▲          │
  Charger /   |          | Lire / Écrire
 Sauvegarder |          | Tables d'apprentissages
              │          ▼
+---------------------------------------+
|        Persistance (IndexedDB)        |
+---------------------------------------+
```

---

## 🛠️ Démarrage Rapide

### 💻 Version Web (JavaScript - Branche `main`)
L'application s'exécute de manière statique et ne requiert aucun serveur d'application complexe (Node.js, PHP, etc.).

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/ari3645/Chess.git
   ```
2. Ouvrez le fichier `index.html` dans votre navigateur.
   - *Note :* Pour éviter les blocages de sécurité des Web Workers locaux imposés par certains navigateurs sur le protocole `file://`, il est fortement recommandé d'utiliser une extension de serveur local (comme **Live Server** sur VS Code) pour servir l'application sous `http://localhost:5500`.

### 🐍 Version Python (Historique - Branche `v1 python`)
La version originale écrite en Python est disponible sur sa branche dédiée.
1. Basculez sur la branche :
   ```bash
   git checkout "v1 python"
   ```
2. Suivez les instructions du fichier `README.md` de cette branche pour exécuter le script Python.

---

## 🧪 Tests Unitaires

Le projet inclut une suite de tests unitaires pour valider les règles du jeu (mouvements légaux, échecs, pat, roque, etc.) et le comportement du moteur.

- Ouvrez simplement le fichier `tests/test_runner.html` dans votre navigateur pour exécuter la suite de tests et visualiser les résultats en temps réel.

---

## 💖 Soutenir le Projet

Si vous aimez ce projet ou que vous souhaitez soutenir mes études en informatique :

☕ **[M'offrir un café sur Buy Me a Coffee](https://buymeacoffee.com/ari3645)**

---

## 📄 Licence

Ce projet est sous licence MIT. Consultez le fichier `LICENSE` pour plus de détails.
