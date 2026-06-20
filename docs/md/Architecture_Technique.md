# ⚙️ Architecture Technique

Pour garantir une expérience utilisateur fluide à 60 images par seconde, les calculs de l'IA (qui peuvent analyser des millions de positions) ont été séparés de l'interface graphique.

## 🧵 Threading : Thread Principal vs Web Worker

L'application utilise un **Web Worker** pour exécuter le moteur de jeu de manière asynchrone :

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

1. **Thread Principal (Interface)** : Gère le rendu HTML/CSS du plateau, les animations, la gestion du chronomètre et les clics de l'utilisateur. Lorsqu'un coup de l'IA est requis, il envoie un message au worker avec l'état du plateau.
2. **Web Worker (`aiWorker.js`)** : Récupère les données, exécute la recherche arborescente tactique et répond au thread principal avec le meilleur coup trouvé. Cela évite tout gel de l'écran ou ralentissement du navigateur.

## 💾 Persistance de données : IndexedDB

L'apprentissage de l'IA est stocké localement dans la base de données **IndexedDB** du navigateur de l'utilisateur (base de données `ChessAI_DB`).
- **Store `opening_book`** : Contient le livre d'ouvertures dynamique (les signatures de positions et les notes de coups apprises).
- **Clé `global_weights`** : Enregistre les poids ajustés de la fonction d'évaluation (TD-learning).

Toutes les opérations d'écriture et de lecture dans IndexedDB sont asynchrones et sécurisées par des timeouts pour éviter de bloquer le Worker si la base de données est ralentie.
