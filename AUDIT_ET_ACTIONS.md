# 🎮 AUDIT TECHNIQUE & ACTIONS - Bot Kyoto

## 1️⃣ AUDIT TECHNIQUE RAPIDE

### Fichiers concernés par l'équilibrage

**Cooldowns** :
- `src/utils/game.js` : `getCooldownTime()` ligne 168
- `src/commands/destin.js` : lignes 14, 43
- `src/commands/arene.js` : lignes 14, 31
- `src/commands/ouvrir.js` : lignes 29, 47

**Gains/Pertes** :
- `src/utils/game.js` : `addCoins()` ligne 103
- `src/commands/destin.js` : lignes 111-140 (probabilités hardcodées)
- `src/commands/arene.js` : lignes 305-308 (gains), 381-382 (pertes)
- `src/commands/ouvrir.js` : lignes 71-164 (loot par coffre)

**Probabilités** :
- `src/commands/destin.js` : lignes 111-140 (roll < 0.30, 0.55, etc.)
- `src/commands/ouvrir.js` : lignes 70-164 (roll < 0.4, 0.7, etc.)
- `src/commands/arene.js` : ligne 140 (crit chance), 153 (miss chance)

**Économie** :
- `src/utils/game.js` : `addCoins()`, `addKey()`, `removeKey()`
- `src/commands/shop.js` : prix hardcodés
- `src/commands/daily.js` : récompense base 500 pièces

**Variables clés à exposer/configurer** :
- Cooldowns base : `src/utils/game.js` ligne 169-173
- Multiplicateur niveau : `src/commands/destin.js` ligne 175, `arene.js` ligne 304
- Probabilités : hardcodées dans chaque commande
- Prix shop : `src/commands/shop.js` lignes 10-30

---

## 2️⃣ COOLDOWNS — SYSTÈME DE CHARGES

**Décision** : Système de charges (3 charges max, recharge 1 charge toutes les X secondes)

**Justification** : Plus flexible, moins frustrant, permet stockage pour sessions intenses.

### Code à modifier

**`src/utils/game.js`** :

```javascript
// REMPLACER getCooldownTime() par :

// Get charge system config
function getChargeConfig(command) {
    const configs = {
        destin: { max: 3, rechargeTime: 30 }, // 1 charge toutes les 30s
        arene: { max: 3, rechargeTime: 60 },  // 1 charge toutes les 60s
        ouvrir: { max: 5, rechargeTime: 10 }, // 1 charge toutes les 10s
    };
    return configs[command] || { max: 3, rechargeTime: 30 };
}

// Get current charges for a command
function getCharges(userId, command) {
    const user = getUser(userId);
    const config = getChargeConfig(command);
    const chargeKey = `charges_${command}`;
    
    if (!user.charges) user.charges = {};
    if (!user.charges[chargeKey]) {
        user.charges[chargeKey] = {
            current: config.max,
            lastRecharge: Date.now(),
        };
        updateUser(userId, user);
    }
    
    const chargeData = user.charges[chargeKey];
    const now = Date.now();
    const timeSinceRecharge = now - chargeData.lastRecharge;
    const chargesToAdd = Math.floor(timeSinceRecharge / (config.rechargeTime * 1000));
    
    if (chargesToAdd > 0) {
        chargeData.current = Math.min(config.max, chargeData.current + chargesToAdd);
        chargeData.lastRecharge = now;
        updateUser(userId, user);
    }
    
    return {
        current: chargeData.current,
        max: config.max,
        nextRecharge: config.rechargeTime - (timeSinceRecharge % (config.rechargeTime * 1000)) / 1000,
    };
}

// Use a charge
function useCharge(userId, command) {
    const charges = getCharges(userId, command);
    if (charges.current <= 0) {
        return { success: false, charges };
    }
    
    const user = getUser(userId);
    const chargeKey = `charges_${command}`;
    user.charges[chargeKey].current--;
    updateUser(userId, user);
    
    return { success: true, charges: getCharges(userId, command) };
}
```

**Modifier `getUser()` pour initialiser charges** :

```javascript
charges: {
    charges_destin: { current: 3, lastRecharge: Date.now() },
    charges_arene: { current: 3, lastRecharge: Date.now() },
    charges_ouvrir: { current: 5, lastRecharge: Date.now() },
},
```

**Exporter nouvelles fonctions** :

```javascript
module.exports = {
    // ... existing
    getChargeConfig,
    getCharges,
    useCharge,
};
```

**Modifier `src/commands/destin.js`** :

```javascript
// REMPLACER lignes 13-45 par :

const { getUser, addCoins, addKey, updateUser, addXP, updateChallengeProgress, generateDailyChallenge, getCharges, useCharge } = require('../utils/game');

// Check charges
const charges = getCharges(userId, 'destin');
if (charges.current <= 0) {
    const nextRecharge = Math.ceil(charges.nextRecharge);
    return message.reply({
        embeds: [{
            color: 0xFF0000,
            title: '⏳ Plus de charges',
            description: `Tu n'as plus de charges pour &destin.\n\nRecharge dans ${nextRecharge}s\n💡 Tu as ${charges.max} charges max.`,
            footer: {
                text: `Charges: 0/${charges.max}`,
            },
            timestamp: new Date().toISOString(),
        }],
    });
}

// Check for Jeton du Destin (bypasses charge)
let usedJeton = false;
if (user.items) {
    const jetonIndex = user.items.findIndex(item => item.type === 'jeton_destin');
    if (jetonIndex !== -1) {
        usedJeton = true;
        user.items.splice(jetonIndex, 1);
        updateUser(userId, user);
    }
}

// Use charge (unless jeton used)
if (!usedJeton) {
    const chargeResult = useCharge(userId, 'destin');
    if (!chargeResult.success) {
        return; // Should not happen but safety check
    }
}
```

**Même logique pour `arene.js` et `ouvrir.js`** (remplacer cooldown par charges).

---

## 3️⃣ ÉCONOMIE — MONEY SINKS OBLIGATOIRES

### Sink 1 : Amélioration d'objets (OBLIGATOIRE)

**Fichier** : `src/commands/ameliorer.js` (NOUVEAU)

```javascript
module.exports = {
    data: { name: 'ameliorer' },
    async execute(message, args) {
        const { getUser, addCoins, updateUser } = require('../utils/game');
        
        if (args.length < 1) {
            return message.reply('❌ Usage: `&ameliorer <index_objet>`');
        }
        
        const userId = message.author.id;
        const user = getUser(userId);
        const itemIndex = parseInt(args[0]) - 1;
        
        if (!user.items || itemIndex < 0 || itemIndex >= user.items.length) {
            return message.reply('❌ Objet invalide. Utilise `&inventaire` pour voir tes objets.');
        }
        
        const item = user.items[itemIndex];
        
        // Cannot upgrade legendary items
        const legendaryTypes = ['oeil_chaos', 'coeur_maudit', 'couronne_destin', 'dragon_ancien', 'grimoire', 'sceau_abime'];
        if (legendaryTypes.includes(item.type)) {
            return message.reply('❌ Les objets légendaires ne peuvent pas être améliorés.');
        }
        
        // Calculate upgrade cost
        const currentLevel = item.level || 1;
        const upgradeCost = Math.floor(500 * Math.pow(2, currentLevel - 1)); // 500, 1000, 2000, 4000...
        
        if (user.coins < upgradeCost) {
            return message.reply(`❌ Il te faut ${upgradeCost.toLocaleString()} pièces pour améliorer cet objet.`);
        }
        
        // Upgrade item
        item.level = (item.level || 1) + 1;
        if (item.effect) {
            if (item.effect.damageBoost) {
                item.effect.damageBoost = Math.floor(item.effect.damageBoost * 1.5);
            }
            if (item.effect.defenseBoost) {
                item.effect.defenseBoost = Math.floor(item.effect.defenseBoost * 1.5);
            }
        }
        
        addCoins(userId, -upgradeCost);
        updateUser(userId, user);
        
        message.reply({
            embeds: [{
                color: 0x00FF00,
                title: '✅ Objet amélioré !',
                description: `${item.name} → Niveau ${item.level}\n💰 Coût: ${upgradeCost.toLocaleString()} pièces`,
                timestamp: new Date().toISOString(),
            }],
        });
    },
};
```

### Sink 2 : Réparation d'objets (usure)

**Modifier `src/utils/game.js`** :

```javascript
// Add durability to items when created
function addItem(userId, item) {
    const user = getUser(userId);
    if (!user.items) user.items = [];
    
    // Add durability to non-legendary items
    const legendaryTypes = ['oeil_chaos', 'coeur_maudit', 'couronne_destin', 'dragon_ancien', 'grimoire', 'sceau_abime'];
    if (!legendaryTypes.includes(item.type)) {
        item.durability = item.durability || 100;
    }
    
    user.items.push({
        ...item,
        obtainedAt: new Date().toISOString(),
    });
    updateUser(userId, user);
}

// Reduce durability after arena combat
function reduceItemDurability(userId, amount = 1) {
    const user = getUser(userId);
    if (!user.items) return;
    
    user.items.forEach(item => {
        if (item.durability !== undefined) {
            item.durability = Math.max(0, item.durability - amount);
        }
    });
    
    // Remove broken items
    user.items = user.items.filter(item => item.durability === undefined || item.durability > 0);
    updateUser(userId, user);
}
```

**Ajouter commande `&reparer`** :

```javascript
module.exports = {
    data: { name: 'reparer' },
    async execute(message, args) {
        const { getUser, addCoins, updateUser } = require('../utils/game');
        
        const userId = message.author.id;
        const user = getUser(userId);
        
        const brokenItems = user.items.filter(item => item.durability !== undefined && item.durability < 100);
        
        if (brokenItems.length === 0) {
            return message.reply('✅ Tous tes objets sont en parfait état !');
        }
        
        let totalCost = 0;
        brokenItems.forEach(item => {
            const repairCost = (100 - item.durability) * 10; // 10 pièces par point
            totalCost += repairCost;
            item.durability = 100;
        });
        
        if (user.coins < totalCost) {
            return message.reply(`❌ Il te faut ${totalCost.toLocaleString()} pièces pour réparer.`);
        }
        
        addCoins(userId, -totalCost);
        updateUser(userId, user);
        
        message.reply({
            embeds: [{
                color: 0x00FF00,
                title: '🔧 Réparation effectuée',
                description: `${brokenItems.length} objet(s) réparé(s)\n💰 Coût: ${totalCost.toLocaleString()} pièces`,
            }],
        });
    },
};
```

**Modifier `arene.js`** : Après combat, appeler `reduceItemDurability(userId, 1)`.

### Sink 3 : Taxe de maintenance quotidienne

**Modifier `src/commands/daily.js`** :

```javascript
// Ajouter taxe basée sur niveau
const maintenanceTax = Math.floor(user.level * 50); // 50 pièces par niveau
if (user.coins < maintenanceTax) {
    // Player loses items if can't pay
    const itemsToLose = Math.floor((maintenanceTax - user.coins) / 1000);
    if (itemsToLose > 0 && user.items && user.items.length > 0) {
        // Remove non-legendary items first
        const nonLegendary = user.items.filter(item => !['oeil_chaos', 'coeur_maudit', 'couronne_destin', 'dragon_ancien', 'grimoire', 'sceau_abime'].includes(item.type));
        for (let i = 0; i < Math.min(itemsToLose, nonLegendary.length); i++) {
            const index = user.items.indexOf(nonLegendary[i]);
            if (index > -1) user.items.splice(index, 1);
        }
    }
    addCoins(userId, -Math.min(user.coins, maintenanceTax));
} else {
    addCoins(userId, -maintenanceTax);
}

// Afficher dans embed
fields.push({
    name: '💸 Taxe de maintenance',
    value: `-${maintenanceTax} pièces (niveau ${user.level})`,
    inline: true,
});
```

---

## 4️⃣ PROGRESSION — PRESTIGE & PALIERS

### Structure JSON mise à jour

**Modifier `getUser()` dans `src/utils/game.js`** :

```javascript
prestige: {
    level: 0,
    totalPrestiges: 0,
    bonus: {
        coinMultiplier: 1,
        xpMultiplier: 1,
    },
},
milestones: {
    unlocked: [],
    // Milestones: level 5, 10, 15, 20, 25, etc.
},
```

### Fonction Prestige

**Ajouter dans `src/utils/game.js`** :

```javascript
function canPrestige(userId) {
    const user = getUser(userId);
    return user.level >= 20; // Prestige possible à partir niveau 20
}

function performPrestige(userId) {
    const user = getUser(userId);
    if (!canPrestige(userId)) {
        return { success: false, reason: 'Niveau 20 requis' };
    }
    
    const prestigeLevel = (user.prestige?.level || 0) + 1;
    const bonusMultiplier = 1 + (prestigeLevel * 0.1); // +10% par prestige
    
    // Reset partiel
    user.level = 1;
    user.xp = 0;
    user.xpToNextLevel = 100;
    user.coins = 1000; // Reset coins
    user.keys = { bois: 0, argent: 0, or: 0, demoniaque: 0 };
    // KEEP: items, stats, achievements, prestige data
    
    // Update prestige
    user.prestige = {
        level: prestigeLevel,
        totalPrestiges: (user.prestige?.totalPrestiges || 0) + 1,
        bonus: {
            coinMultiplier: bonusMultiplier,
            xpMultiplier: bonusMultiplier,
        },
    };
    
    updateUser(userId, user);
    return { success: true, prestigeLevel, bonusMultiplier };
}
```

**Nouvelle commande `src/commands/prestige.js`** :

```javascript
module.exports = {
    data: { name: 'prestige' },
    async execute(message, args) {
        const { getUser, canPrestige, performPrestige } = require('../utils/game');
        
        const userId = message.author.id;
        const user = getUser(userId);
        
        if (!canPrestige(userId)) {
            return message.reply({
                embeds: [{
                    color: 0xFF0000,
                    title: '❌ Prestige non disponible',
                    description: `Tu dois être niveau 20 minimum pour faire un prestige.\n\nNiveau actuel: ${user.level}`,
                }],
            });
        }
        
        if (args[0] !== 'confirm') {
            return message.reply({
                embeds: [{
                    color: 0xFFD700,
                    title: '⭐ Prestige',
                    description: `Tu es niveau ${user.level}.\n\n**Reset partiel** :\n- Niveau → 1\n- Pièces → 1000\n- Clés → 0\n\n**Conservé** :\n- Objets\n- Stats\n- Achievements\n\n**Bonus permanent** :\n+${((user.prestige?.level || 0) + 1) * 10}% gains et XP\n\nTape \`&prestige confirm\` pour confirmer.`,
                }],
            });
        }
        
        const result = performPrestige(userId);
        
        message.reply({
            embeds: [{
                color: 0x00FF00,
                title: '⭐ Prestige effectué !',
                description: `Prestige niveau ${result.prestigeLevel}\n\nBonus permanent : +${(result.bonusMultiplier - 1) * 100}% gains et XP`,
            }],
        });
    },
};
```

### Paliers de niveau

**Ajouter dans `addXP()` après level up** :

```javascript
// Check milestones
const milestoneLevels = [5, 10, 15, 20, 25, 30, 40, 50];
if (milestoneLevels.includes(user.level)) {
    if (!user.milestones) user.milestones = { unlocked: [] };
    if (!user.milestones.unlocked.includes(user.level)) {
        user.milestones.unlocked.push(user.level);
        // Reward milestone
        const milestoneRewards = {
            5: { coins: 1000, item: 'lame' },
            10: { coins: 5000, item: 'amulette' },
            15: { coins: 10000, key: 'or' },
            20: { coins: 20000, prestigeUnlock: true },
            // etc.
        };
        const reward = milestoneRewards[user.level];
        if (reward) {
            if (reward.coins) addCoins(userId, reward.coins);
            if (reward.item) addItem(userId, { type: reward.item, name: '...', effect: {...} });
            if (reward.key) addKey(userId, reward.key);
        }
        updateUser(userId, user);
        return { leveledUp: true, newLevel: user.level, milestone: user.level };
    }
}
```

---

## 5️⃣ STREAK — PALIERS RENFORCÉS

**Modifier `updateDailyStreak()` dans `src/utils/game.js`** :

```javascript
// Streak bonus with milestones
const streakMilestones = [7, 30, 100];
let milestoneReward = null;

if (streakMilestones.includes(user.dailyStreak)) {
    milestoneReward = {
        7: { coins: 2000, title: '🔥 Streak de 7 jours !' },
        30: { coins: 10000, item: 'jeton_destin', title: '💎 Streak de 30 jours !' },
        100: { coins: 50000, item: 'legendary_chest_key', title: '👑 Streak de 100 jours !' },
    }[user.dailyStreak];
}

// Streak bonus: +10% coins per day (max 100% at 10 days)
const streakBonus = Math.min(100, user.dailyStreak * 10);

return { 
    streak: user.dailyStreak, 
    bonus: streakBonus,
    milestone: milestoneReward,
};
```

**Modifier `daily.js`** pour afficher milestone :

```javascript
if (streakData.milestone) {
    addCoins(userId, streakData.milestone.coins);
    if (streakData.milestone.item) {
        if (streakData.milestone.item === 'legendary_chest_key') {
            addKey(userId, 'demoniaque');
        } else {
            addItem(userId, { type: streakData.milestone.item, ... });
        }
    }
    
    fields.push({
        name: '🎉 ' + streakData.milestone.title,
        value: `Récompense spéciale : ${streakData.milestone.coins}💰 + ${streakData.milestone.item || ''}`,
        inline: false,
    });
}
```

**Protection contre perte de streak** :

```javascript
// Grace period: 1 jour de grâce
if (daysDiff === 2) {
    // Grace period - continue streak but no bonus
    user.dailyStreak++;
    user.lastDailyDate = today.toISOString();
    return { streak: user.dailyStreak, bonus: 0, graceUsed: true };
} else if (daysDiff > 2) {
    // Streak broken
    user.dailyStreak = 1;
    user.lastDailyDate = today.toISOString();
}
```

---

## 6️⃣ UX — COMMANDES QUALITÉ DE VIE

### `&resume` — Vue d'ensemble

**Nouveau fichier `src/commands/resume.js`** :

```javascript
module.exports = {
    data: { name: 'resume' },
    async execute(message, args) {
        const { getUser, getCharges } = require('../utils/game');
        
        const userId = message.author.id;
        const user = getUser(userId);
        
        const chargesDestin = getCharges(userId, 'destin');
        const chargesArene = getCharges(userId, 'arene');
        const chargesOuvrir = getCharges(userId, 'ouvrir');
        
        const challenge = user.dailyChallenges?.current;
        
        message.reply({
            embeds: [{
                color: 0x0099FF,
                title: '📊 Résumé',
                fields: [
                    {
                        name: '💰 Économie',
                        value: `Pièces: ${user.coins.toLocaleString()}\nClés: ${Object.values(user.keys || {}).reduce((a, b) => a + b, 0)}`,
                        inline: true,
                    },
                    {
                        name: '⚡ Charges',
                        value: `🎲 Destin: ${chargesDestin.current}/${chargesDestin.max}\n⚔️ Arène: ${chargesArene.current}/${chargesArene.max}\n🧰 Ouvrir: ${chargesOuvrir.current}/${chargesOuvrir.max}`,
                        inline: true,
                    },
                    {
                        name: '⭐ Progression',
                        value: `Niveau: ${user.level}\nXP: ${user.xp}/${user.xpToNextLevel}\n🔥 Streak: ${user.dailyStreak || 0}j`,
                        inline: true,
                    },
                    {
                        name: '📋 Défi quotidien',
                        value: challenge ? `${challenge.description}\n${challenge.progress || 0}/${challenge.target}` : 'Aucun défi actif',
                        inline: false,
                    },
                ],
            }],
        });
    },
};
```

### `&objectifs` — Objectifs actifs

**Nouveau fichier `src/commands/objectifs.js`** :

```javascript
module.exports = {
    data: { name: 'objectifs' },
    async execute(message, args) {
        const { getUser } = require('../utils/game');
        
        const userId = message.author.id;
        const user = getUser(userId);
        
        const objectives = [];
        
        // Daily challenge
        if (user.dailyChallenges?.current) {
            const c = user.dailyChallenges.current;
            objectives.push({
                name: '📋 Défi quotidien',
                value: `${c.description}\nProgression: ${c.progress || 0}/${c.target}\nRécompense: ${c.reward.coins}💰 + ${c.reward.xp}XP`,
            });
        }
        
        // Next milestone
        const milestoneLevels = [5, 10, 15, 20, 25, 30, 40, 50];
        const nextMilestone = milestoneLevels.find(m => m > user.level);
        if (nextMilestone) {
            objectives.push({
                name: '⭐ Prochain palier',
                value: `Niveau ${nextMilestone}\nXP nécessaire: ${user.xpToNextLevel - user.xp} XP`,
            });
        }
        
        // Prestige available
        if (user.level >= 20) {
            objectives.push({
                name: '⭐ Prestige disponible',
                value: `Tape \`&prestige\` pour reset avec bonus permanent`,
            });
        }
        
        // Streak next milestone
        const streakMilestones = [7, 30, 100];
        const nextStreak = streakMilestones.find(s => s > (user.dailyStreak || 0));
        if (nextStreak) {
            objectives.push({
                name: '🔥 Prochain streak',
                value: `${nextStreak - (user.dailyStreak || 0)} jour(s) pour streak ${nextStreak}`,
            });
        }
        
        message.reply({
            embeds: [{
                color: 0xFFD700,
                title: '🎯 Objectifs actifs',
                fields: objectives.length > 0 ? objectives : [{
                    name: '✅',
                    value: 'Aucun objectif actif',
                }],
            }],
        });
    },
};
```

---

## 7️⃣ SOCIAL — SYSTÈME DE RIVALITÉS

**Structure JSON** :

```javascript
rivalries: {
    rivals: [], // [{ userId, wins, losses, lastFight }]
    challenges: [], // [{ fromUserId, toUserId, status, coins }]
},
```

**Nouvelle commande `src/commands/rival.js`** :

```javascript
module.exports = {
    data: { name: 'rival' },
    async execute(message, args) {
        const { getUser, updateUser, addCoins } = require('../utils/game');
        
        if (args[0] === 'list') {
            const user = getUser(message.author.id);
            const rivals = user.rivalries?.rivals || [];
            
            if (rivals.length === 0) {
                return message.reply('❌ Tu n\'as pas encore de rivaux. Utilise `&arene @user` pour créer une rivalité !');
            }
            
            const rivalList = rivals.map((r, i) => {
                const rivalUser = message.client.users.cache.get(r.userId);
                return `${i + 1}. ${rivalUser?.username || 'Inconnu'} - ${r.wins}V/${r.losses}D`;
            }).join('\n');
            
            return message.reply({
                embeds: [{
                    title: '⚔️ Tes rivaux',
                    description: rivalList,
                }],
            });
        }
        
        if (args[0] === 'challenge' && message.mentions.members.size > 0) {
            const target = message.mentions.members.first();
            const userId = message.author.id;
            const user = getUser(userId);
            const bet = parseInt(args[1]) || 0;
            
            if (bet < 100 || bet > user.coins) {
                return message.reply('❌ Mise invalide (min 100, max tes pièces)');
            }
            
            // Create challenge
            if (!user.rivalries) user.rivalries = { challenges: [] };
            user.rivalries.challenges.push({
                fromUserId: userId,
                toUserId: target.id,
                coins: bet,
                status: 'pending',
                createdAt: Date.now(),
            });
            updateUser(userId, user);
            
            return message.reply(`⚔️ Défi envoyé à ${target.username} pour ${bet}💰 !`);
        }
    },
};
```

**Modifier `arene.js`** pour tracker rivalités :

```javascript
// Après combat, si adversaire est mentionné
if (isFriend) {
    const user = getUser(userId);
    if (!user.rivalries) user.rivalries = { rivals: [] };
    
    let rivalry = user.rivalries.rivals.find(r => r.userId === opponentId);
    if (!rivalry) {
        rivalry = { userId: opponentId, wins: 0, losses: 0, lastFight: Date.now() };
        user.rivalries.rivals.push(rivalry);
    }
    
    if (userWon) {
        rivalry.wins++;
    } else {
        rivalry.losses++;
    }
    rivalry.lastFight = Date.now();
    updateUser(userId, user);
}
```

---

## 8️⃣ ROADMAP TECHNIQUE

### 🔥 Phase 1 — Urgent (Stabilité)

**Fichiers à modifier** :
1. `src/utils/game.js` : Remplacer `getCooldownTime()` par système charges
2. `src/commands/destin.js` : Adapter pour charges
3. `src/commands/arene.js` : Adapter pour charges
4. `src/commands/ouvrir.js` : Adapter pour charges

**Impact** : Réduit frustration, améliore rétention

---

### ⚙️ Phase 2 — Rétention long terme

**Fichiers à créer/modifier** :
1. `src/commands/prestige.js` : NOUVEAU
2. `src/utils/game.js` : Ajouter `performPrestige()`, paliers
3. `src/commands/ameliorer.js` : NOUVEAU
4. `src/commands/reparer.js` : NOUVEAU
5. `src/commands/daily.js` : Ajouter taxe maintenance
6. `src/utils/game.js` : Ajouter `reduceItemDurability()`
7. `src/commands/arene.js` : Appeler `reduceItemDurability()` après combat

**Impact** : Endgame structuré, inflation contrôlée

---

### 🧠 Phase 3 — Addiction & Social

**Fichiers à créer/modifier** :
1. `src/commands/resume.js` : NOUVEAU
2. `src/commands/objectifs.js` : NOUVEAU
3. `src/commands/rival.js` : NOUVEAU
4. `src/utils/game.js` : Améliorer `updateDailyStreak()` avec paliers
5. `src/commands/daily.js` : Afficher milestones streak
6. `src/commands/arene.js` : Tracker rivalités

**Impact** : Engagement social, clarté UX

---

## CHECKLIST D'IMPLÉMENTATION

- [ ] Phase 1 : Système de charges
  - [ ] Modifier `game.js`
  - [ ] Modifier `destin.js`
  - [ ] Modifier `arene.js`
  - [ ] Modifier `ouvrir.js`
  
- [ ] Phase 2 : Money sinks & prestige
  - [ ] Créer `ameliorer.js`
  - [ ] Créer `reparer.js`
  - [ ] Ajouter durabilité objets
  - [ ] Créer `prestige.js`
  - [ ] Ajouter paliers niveau
  - [ ] Modifier `daily.js` (taxe)
  
- [ ] Phase 3 : UX & Social
  - [ ] Créer `resume.js`
  - [ ] Créer `objectifs.js`
  - [ ] Créer `rival.js`
  - [ ] Améliorer streak
  - [ ] Modifier `arene.js` (rivalités)

---

**Temps estimé** : 4-6h de développement
