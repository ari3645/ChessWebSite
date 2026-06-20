# 🧠 Moteur d'Intelligence Artificielle

Le moteur de recherche tactique de l'IA repose sur des algorithmes éprouvés de la théorie des jeux, optimisés pour le web.

## 1. Minimax & Élagage Alpha-Beta
L'algorithme **Minimax** explore l'arbre des coups légaux futurs. Pour limiter le nombre de branches à analyser (qui croît de façon exponentielle), nous utilisons l'**élagage Alpha-Beta** :
- **Alpha ($\alpha$)** : Le meilleur score que le joueur Max (les Blancs) a sécurisé.
- **Beta ($\beta$)** : Le meilleur score que le joueur Min (les Noirs) a sécurisé.
Dès qu'une branche s'avère moins bonne qu'une alternative déjà évaluée, la recherche dans cette branche s'arrête (coupe Beta ou Alpha).

## 2. Tri des Coups (Move Ordering)
L'élagage Alpha-Beta est d'autant plus efficace que les meilleurs coups sont analysés en premier. Notre moteur ordonne les coups avant de lancer Minimax :
1. **Captures de pièces** (priorisées selon l'heuristique MVV-LVA : *Most Valuable Victim - Least Valuable Assailant* ; capturer une reine avec un pion est priorisé).
2. **Promotions de pion**.
3. **Coups calmes**.

## 3. Recherche de Calme (Quiescence Search)
Pour éviter l'**effet d'horizon** (lorsqu'une IA s'arrête au milieu d'un échange tactique parce qu'elle a atteint sa limite de profondeur et évalue faussement la position), le moteur prolonge la recherche pour les captures de pièces et les échecs au Roi tant que la situation n'est pas stabilisée ("calme").

## 4. Approfondissement Itératif (Iterative Deepening)
L'IA cherche d'abord à la profondeur 1, puis 2, puis 3, etc. Cela permet de :
- Toujours disposer d'un coup de secours immédiat en cas d'interruption.
- Remplir les tables pour améliorer l'ordonnancement des coups à la profondeur suivante.
- **Contrôle du Temps** : Si la recherche dépasse **5 secondes**, le processus s'arrête proprement et renvoie le meilleur coup de la profondeur précédente.
