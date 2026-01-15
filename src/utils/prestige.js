const { getUser, updateUser, addCoins } = require('./game');

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
    // KEEP: items, stats, achievements, prestige data, milestones, rivalries
    
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

module.exports = {
    canPrestige,
    performPrestige,
};
