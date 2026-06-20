# 📊 Heuristiques d'Évaluation Positionnelle

Pour juger de la qualité d'une position, l'IA calcule un score combinant la valeur brute des pièces (matériel) et des critères stratégiques avancés.

## 📐 Évaluation positionnelle
- **Valeur des Pièces** : Pion = 100, Cavalier/Fou = 320, Tour = 500, Dame = 900.
- **Tables de Positionnement (PST)** : Bonus/Malus selon la case occupée par la pièce (ex: un cavalier est plus fort au centre, un pion passé gagne en valeur à l'approche de la promotion).

## 🎖️ Heuristiques Spécifiques Implémentées
1. **Contrôle du Centre** : Bonus pour l'occupation et le contrôle des cases centrales (d4, d5, e4, e5).
2. **Knights on the Rim** : Pénalité pour les Cavaliers placés sur les colonnes extérieures (A et H), car leur rayon d'action y est réduit de moitié.
3. **Sécurité du Roi & Roque** : 
   - Bonus pour les droits de roquer restants ou le roque effectué.
   - Pénalité si le Roi est exposé sur des colonnes ouvertes ou semi-ouvertes.
   - **Bouclier de pions** : Bonus si des pions alliés protègent le Roi roqué.
4. **Développement Précoce** : 
   - Pénalité si la Dame sort trop tôt (avant le développement des pièces mineures).
   - Pénalité pour les pièces mineures (fous/cavaliers) restées sur leur rangée de départ.
5. **Structure de Pions** :
   - Pénalité pour les **pions doublés** (sur la même colonne) et **pions isolés** (sans pion allié sur les colonnes adjacentes).
   - Bonus pour les pions connectés.
6. **Pions Passés** : Bonus progressif pour un pion passé, atténué si ce pion est bloqué par une pièce adverse.
7. **Tours Actives** : Bonus pour les Tours placées sur les colonnes ouvertes et sur la 7ème/2nd rangée.
8. **Tours Connectées** : Bonus si deux Tours alliées se défendent mutuellement sur une colonne ou rangée.
9. **Fous Obstrués (Bad Bishops)** : Pénalité si un Fou est bloqué par trop de pions alliés situés sur des cases de la même couleur que lui.
10. **King Tropism (Finale)** : Centralisation du Roi dès que le matériel total tombe en dessous de 1500 centipions pour accompagner les pions passés et repousser le Roi adverse.
