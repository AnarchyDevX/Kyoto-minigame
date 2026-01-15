# 🎮 PROMPT EXPERT UX / GAME ECONOMY

## Bot Discord **Kyoto** — Système de Mini-Jeux Addictif & Long Terme

---

## 🎯 RÔLE ATTENDU

Tu es **Expert Senior UX, Game Designer & Game Economist**, spécialisé dans :

* jeux free-to-play
* systèmes incrémentaux/addictifs
* boucles de rétention long terme
* équilibrage probabiliste
* économie virtuelle (inflation, sinks, méta-progression)

Tu dois analyser **sans complaisance** un système existant et proposer **des améliorations concrètes**, réalistes techniquement et orientées **rétention & addiction saine**.

---

## 🧠 OBJECTIF GLOBAL

Transformer un bot Discord déjà fonctionnel en un **système de jeu durable**, capable de :

* retenir les joueurs sur **plusieurs mois**
* créer des **habitudes quotidiennes**
* maintenir l'intérêt **après le mid/endgame**
* favoriser la **rivalité sociale**
* éviter inflation, fatigue, frustration ou abandon

---

## 🧩 CONTEXTE TECHNIQUE

* Plateforme : **Discord**
* Tech : **discord.js v14**
* Stockage : **JSON uniquement (pas de DB)**
* Commandes texte (pas de slash)
* UI : **Embeds Discord**
* Contraintes fortes de simplicité & performance

👉 **Toutes tes propositions doivent respecter ces contraintes.**

---

## ⚙️ SYSTÈME ACTUEL (DÉTAILS)

### Commandes Principales

#### 1. `&destin` — Jeu de Hasard
**Mécanique** : Roulette aléatoire avec suspense (2s)

**Probabilités actuelles** :
- 30% → Gain commun (50-250 pièces) — Moyenne : ~150
- 25% → Perte (50-250 pièces) — Moyenne : ~150
- 17% → Gain rare (300-700 pièces) — Moyenne : ~500
- 13% → Multiplicateur x2/x3/x5 (5 min)
- 9% → Clé de coffre (bois/argent/or)
- 4% → Malédiction (-20% chance, 10 min)
- 2% → JACKPOT (5000 pièces)

**Expected Value approximatif** : ~+100-150 pièces par partie

**Cooldown** : 30s base → +5% par niveau (max 60s à niveau 20)

**Bonus niveau** : +5% par niveau sur les gains

**XP gagné** : 5-20 selon résultat

---

#### 2. `&ouvrir coffre_xxx` — Ouverture de Coffres
**Types** : bois, argent, or, démoniaque

**Coffre Bois** :
- 40% → Pièces (50-150)
- 30% → Bonus chance +5% (10 min)
- 20% → Objet : Lame émoussée (+5 dégâts) ou Cuirasse usée (+5 défense)
- 10% → Piège (-50 pièces)

**Coffre Argent** :
- 30% → Pièces (200-400)
- 20% → Bonus chance +10% (30 min)
- 20% → Objet : Amulette (+10 dégâts) ou Armure légère (+8 défense)
- 20% → Clé bonus (bois/argent)
- 10% → Malédiction (-10% chance, 15 min)

**Coffre Or** :
- 25% → Pièces (800-1500)
- 15% → Objet permanent : Anneau du Hasard (+15% chance)
- 15% → Objet : Gantelets (+20 dégâts) ou Bouclier (+15 défense)
- 15% → Compagnon : Loup spectral (+10% dégâts)
- 15% → Jeton du Destin (relance gratuite)
- 15% → Relique instable (gros gain OU grosse perte)

**Coffre Démoniaque** :
- 100% → Objet légendaire (6 types possibles)
  - Œil du Chaos (5% annule défaite)
  - Cœur Maudit (+30% gains/pertes)
  - Couronne du Destin (1 chance x5/jour)
  - Dragon Ancien (critique massif)
  - Grimoire Interdit (transforme échec en jackpot)
  - Sceau de l'Abîme (vol auto pièces)

**Cooldown** : 10s base → +5% par niveau (max 20s)

**XP gagné** : 5 (bois), 10 (argent), 20 (or), 50 (démoniaque)

---

#### 3. `&arene [@user]` — Combat Automatique
**Mécanique** : Combat tour par tour automatique (max 20 tours)

**Stats** :
- Attaque base : 40
- Défense base : 25
- Chance critique base : 8%

**Dégâts** :
- Variance : ±25%
- Critique : x2 à x3
- Défense réduit : 1% par point (max 50%)

**Probabilités** :
- 10% chance de rater (joueur & adversaire)
- 8% base + items pour critique

**Récompenses victoire** :
- Pièces : 80-380 (niveau 1) → +5% par niveau
- 25% chance de clé (bois/argent)
- XP : 15 + (niveau/2)

**Pertes défaite** :
- Pièces : 50-200

**Cooldown** : 60s base → +5% par niveau (max 120s)

**Équilibrage actuel** : ~50% victoire (après rééquilibrage)

---

#### 4. `&shop` — Boutique
**Clés** :
- Bois : 200💰
- Argent : 500💰
- Or : 1500💰
- Démoniaque : 5000💰

**Objets** :
- Lame/Cuirasse : 300💰
- Amulette/Armure : 800💰
- Gantelets/Bouclier : 2000💰

---

#### 5. `&daily` — Récompense Quotidienne
**Récompense base** : 500 pièces + 50 XP

**Streak** :
- +10% bonus par jour
- Max 100% à 10 jours
- Récompense : 500 + (streak × 50) pièces

**Défi quotidien** :
- Généré selon niveau
- Types : destin, arene, ouvrir
- Objectifs : 3-10 selon niveau
- Récompenses : 500-2000 pièces + 50-200 XP

---

#### 6. `&inventaire` — Stats Joueur
Affiche : pièces, clés, objets, stats, niveau, XP, streak

#### 7. `&classement` — Top 100
Pagination : 10 joueurs par page, top 100 max

---

### Système de Progression

**Niveaux** :
- XP requis : `100 × 1.5^(niveau - 1)`
- Exemples :
  - Niveau 1 → 2 : 100 XP
  - Niveau 5 → 6 : ~760 XP
  - Niveau 10 → 11 : ~5,767 XP
  - Niveau 20 → 21 : ~327,000 XP

**Cooldowns progressifs** :
- Formule : `base × (1 + (niveau - 1) × 0.05)`
- Max : 2x à niveau 20

**Récompenses augmentées** :
- Multiplicateur : `1 + (niveau - 1) × 0.05`
- Niveau 10 : +45% gains
- Niveau 20 : +95% gains

**Streak quotidien** :
- +10% par jour
- Max 100% à 10 jours
- Réinitialisé si jour manqué

---

### Économie Actuelle

**Monnaies** :
- Pièces (principale)
- Clés (ressource stratégique)

**Objets** :
- Permanents (armes, armures, légendaires)
- Temporaires (bonus, multiplicateurs)

**Sinks actuels** :
- Shop (achat clés/objets)
- Pertes dans destin/arene

**Sources de pièces** :
- Destin (gains aléatoires)
- Arène (victoires)
- Coffres (loot)
- Daily (500+ par jour)
- Défis quotidiens (500-2000)

---

## 🚨 POINTS DE TENSION IDENTIFIÉS

1. **Cooldowns progressifs** : Risque de frustration si trop longs
2. **Inflation potentielle** : Pièces s'accumulent sans sinks forts
3. **Endgame peu structuré** : Pas de méta-progression après niveau 20
4. **Social limité** : Seulement classement, pas d'interactions
5. **Perte frustrante** : Pas de narrative autour des échecs
6. **Pas de prestige** : Joueurs max niveau n'ont plus d'objectifs
7. **Objets statiques** : Pas d'évolution/amélioration
8. **Défis répétitifs** : Même structure chaque jour

---

## 🧠 TA MISSION (STRUCTURE OBLIGATOIRE)

### 1️⃣ ANALYSE CRITIQUE DU SYSTÈME ACTUEL

* Ce qui fonctionne vraiment (boucles solides)
* Ce qui va poser problème à moyen/long terme
* Où se situe le plus grand risque d'abandon joueur

👉 **Sois brutal et honnête.**

---

### 2️⃣ ÉQUILIBRAGE & ÉCONOMIE (AVEC JUSTIFICATIONS)

Pour chaque point ci-dessous :

* dis si c'est bon / mauvais
* explique pourquoi
* propose une alternative concrète

#### a) Cooldowns

* Progressifs vs fixes vs charges
* Impact psychologique joueur
* Formule actuelle : `base × (1 + (niveau - 1) × 0.05)` — est-ce optimal ?

#### b) Niveaux & XP

* Vitesse early / mid / late game
* Courbe exponentielle : `100 × 1.5^(n-1)` — trop rapide/lent ?
* Ajout de paliers & milestones
* Lisibilité de la progression

#### c) Probabilités & gains

* Expected Value de `&destin` : ~+100-150 pièces — équilibré ?
* Frustration vs excitation
* Jackpot 2% — trop rare/fréquent ?
* Pertes 25% — acceptable ?

#### d) Inflation

* Les pièces s'accumulent-elles trop ?
* Quels sinks **obligatoires** ajouter ?
* Daily 500+ pièces/jour — trop généreux ?
* Shop suffisant comme sink ?

---

### 3️⃣ MÉCANIQUES MANQUANTES (PRIORITÉ ADDICTION)

Propose **UNIQUEMENT** des mécaniques :

* simples à implémenter
* très fortes en rétention

Exemples attendus :

* Prestige / reset intelligent
* Méta-progression
* Coffres évolutifs
* Objets évolutifs
* Défis communautaires
* Saisons légères

👉 Pour chaque mécanique :

* but
* bénéfice UX
* impact économie
* complexité technique (faible / moyenne)

---

### 4️⃣ STREAKS, DAILY & HABITUDES

Analyse :

* Le streak actuel est-il émotionnellement fort ?
* Faut-il des paliers marquants (7, 30, 100 jours) ?
* Comment éviter la démotivation après une rupture ?

Propose :

* structure idéale
* récompenses clés
* erreurs à éviter

---

### 5️⃣ SOCIAL & COMPÉTITION

Objectif : **créer des tensions sociales sans toxicité**.

Analyse :

* limites du classement actuel
* potentiel des rivalités

Propose :

* systèmes de guildes simples
* classements par catégorie
* événements collectifs
* mécaniques de revanche / défi

---

### 6️⃣ UX DISCORD & FEEDBACK JOUEUR

Analyse :

* clarté des embeds
* surcharge cognitive
* compréhension des systèmes

Propose :

* améliorations UX concrètes
* feedbacks émotionnels
* tutoriel progressif
* commandes "qualité de vie"

---

### 7️⃣ ROADMAP STRATÉGIQUE (TRÈS IMPORTANT)

Fournis une roadmap en **3 phases** :

#### 🔥 Phase 1 — Urgent (stabilité & frustration)

#### ⚙️ Phase 2 — Rétention long terme

#### 🧠 Phase 3 — Addiction & social

Pour chaque phase :

* 3 à 5 features max
* justification
* impact attendu

---

## ❌ CE QUE TU NE DOIS PAS FAIRE

* Pas de réponses vagues
* Pas de "ça dépend"
* Pas de mécaniques impossibles techniquement
* Pas de features cosmétiques inutiles

---

## ✅ FORMAT DE RÉPONSE ATTENDU

* Sections claires
* Bullet points
* Ton professionnel mais direct
* Orientation **produit**, pas théorique
* Approche **player-centric + business-centric**

---

## 🎯 OBJECTIF FINAL

À la fin de ton analyse, je dois être capable de :

* corriger mon équilibrage
* prioriser mes développements
* transformer mon bot en **jeu Discord addictif et durable**

---

## 📊 DONNÉES SUPPLÉMENTAIRES

**Statistiques observées** (si disponibles) :
- Ratio victoire/défaite arène : ~75% (avant rééquilibrage) → ~50% (après)
- Temps moyen entre commandes : non mesuré
- Taux de rétention : non mesuré
- Distribution des niveaux : non mesuré

**Feedback joueurs** :
- "C'est trop facile de gagner" (avant rééquilibrage)
- "Les cooldowns sont frustrants" (après ajout)
- "Pas assez d'objectifs long terme"

---

**Merci pour ton expertise ! 🎮**
