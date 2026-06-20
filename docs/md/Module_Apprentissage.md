# 📈 Module d'Apprentissage Automatique

L'IA intègre deux algorithmes d'apprentissage machine asynchrones qui s'exécutent à la fin de chaque partie.

## 📖 1. Livre d'Ouvertures Dynamique (Q-learning)
Pendant les 12 premiers coups de la partie, l'IA enregistre les états de plateau (signatures de positions) et les coups joués.

- **Formule de mise à jour (Q-value)** :
  $$Q(s, a) \leftarrow Q(s, a) + \alpha \cdot (R - Q(s, a))$$
  - $\alpha$ (Learning Rate) = 0.2
  - $R$ (Reward) = +1.0 en cas de victoire, -1.0 en cas de défaite, 0.0 pour une nulle.
  
Au fil des parties, l'IA apprend à privilégier les ouvertures menant à la victoire et évite les coups ayant causé des défaites rapides.

## 🔄 2. Ajustement des Paramètres Tactiques (TD-learning)
Les poids des 18 heuristiques positionnelles (sécurité du Roi, bonus de pion passé, malus de pions isolés, etc.) ne sont pas figés. À la fin d'une partie :
- Les poids sont ajustés pas à pas dans le sens du résultat (victoire/défaite) en comparant les caractéristiques extraites sur les 40 derniers coups.
- Un **système de bridage de sécurité** est appliqué : les poids ne peuvent jamais dévier de plus de $\pm 50\%$ de leurs valeurs par défaut pour éviter que l'IA ne devienne instable ou n'adopte des comportements absurdes.
- En cas de match nul répété, les poids convergent lentement vers leurs valeurs par défaut.
