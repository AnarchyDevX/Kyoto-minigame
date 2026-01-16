const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, '..', 'data', 'users.json');

// create data dir if not exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// load users data
function loadUsers() {
    if (!fs.existsSync(usersPath)) {
        return {};
    }
    try {
        const data = fs.readFileSync(usersPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        return {};
    }
}

// save users data
function saveUsers(users) {
    try {
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des utilisateurs:', error);
        throw error;
    }
}

    // Ensure user has all required properties (migration helper)
    function ensureUserProperties(user) {
        const defaults = {
            coins: 1000,
            keys: {
                bois: 0,
                argent: 0,
                or: 0,
                demoniaque: 0,
            },
            items: [],
            stats: {
                wins: 0,
                losses: 0,
                totalCoinsWon: 0,
            },
            bonuses: {
                multiplier: 1,
                chanceBoost: 0,
                damageBoost: 0,
                expiresAt: null,
            },
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            totalXp: 0,
            dailyStreak: 0,
            lastDailyDate: null,
            lastDailyTime: 0,
            dailyChallenges: {
                completed: [],
                current: null,
                resetDate: null,
            },
            charges: {
                charges_destin: { current: 3, lastRecharge: Date.now() },
                charges_arene: { current: 3, lastRecharge: Date.now() },
                charges_ouvrir: { current: 5, lastRecharge: Date.now() },
            },
            achievements: [],
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
            },
            rivalries: {
                rivals: [],
                challenges: [],
            },
            luck: 0,
        };
        
        // Merge defaults with existing user data
        for (const key in defaults) {
            if (user[key] === undefined) {
                user[key] = defaults[key];
            } else if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key]) && defaults[key] !== null) {
                // Deep merge for objects
                for (const subKey in defaults[key]) {
                    if (user[key][subKey] === undefined) {
                        user[key][subKey] = defaults[key][subKey];
                    }
                }
            }
        }
        
        return user;
    }

    // get user data
    function getUser(userId) {
        const users = loadUsers();
        if (!users[userId]) {
            users[userId] = {
                coins: 1000, // Starting coins
                keys: {
                    bois: 0,
                    argent: 0,
                    or: 0,
                    demoniaque: 0,
                },
                items: [],
                stats: {
                    wins: 0,
                    losses: 0,
                    totalCoinsWon: 0,
                },
                bonuses: {
                    multiplier: 1,
                    chanceBoost: 0,
                    damageBoost: 0,
                    expiresAt: null,
                },
                // Progression system
                level: 1,
                xp: 0,
                xpToNextLevel: 100,
                totalXp: 0,
                // Daily/streak system
                dailyStreak: 0,
                lastDailyDate: null,
                lastDailyTime: 0,
                dailyChallenges: {
                    completed: [],
                    current: null,
                    resetDate: null,
                },
                // Charge system (replaces cooldowns)
                charges: {
                    charges_destin: { current: 3, lastRecharge: Date.now() },
                    charges_arene: { current: 3, lastRecharge: Date.now() },
                    charges_ouvrir: { current: 5, lastRecharge: Date.now() },
                },
                // Achievements
                achievements: [],
                // Prestige system
                prestige: {
                    level: 0,
                    totalPrestiges: 0,
                    bonus: {
                        coinMultiplier: 1,
                        xpMultiplier: 1,
                    },
                },
                // Milestones
                milestones: {
                    unlocked: [],
                },
                // Rivalries
                rivalries: {
                    rivals: [],
                    challenges: [],
                },
                // Luck system (affects shop prices and item drops)
                luck: 0, // Range: -50 to +50
            };
            saveUsers(users);
        } else {
            // Ensure existing user has all properties
            users[userId] = ensureUserProperties(users[userId]);
        }
        return users[userId];
    }

// update user data
function updateUser(userId, data) {
    const users = loadUsers();
    if (!users[userId]) {
        getUser(userId); // Initialize if doesn't exist
        // Reload after initialization
        const updatedUsers = loadUsers();
        updatedUsers[userId] = ensureUserProperties({ ...updatedUsers[userId], ...data });
        saveUsers(updatedUsers);
    } else {
        users[userId] = ensureUserProperties({ ...users[userId], ...data });
        saveUsers(users);
    }
}

// add coins to user
function addCoins(userId, amount) {
    const user = getUser(userId);
    
    // Apply prestige bonus if exists and positive amount
    if (amount > 0 && user.prestige?.bonus?.coinMultiplier) {
        amount = Math.floor(amount * user.prestige.bonus.coinMultiplier);
    }
    
    user.coins = Math.max(0, user.coins + amount);
    if (amount > 0) {
        user.stats.totalCoinsWon += amount;
    }
    updateUser(userId, user);
    return user.coins;
}

// add key to user
function addKey(userId, keyType) {
    const user = getUser(userId);
    if (user.keys[keyType] !== undefined) {
        user.keys[keyType]++;
        updateUser(userId, user);
    }
}

// remove key from user
function removeKey(userId, keyType) {
    const user = getUser(userId);
    if (user.keys[keyType] !== undefined && user.keys[keyType] > 0) {
        user.keys[keyType]--;
        updateUser(userId, user);
        return true;
    }
    return false;
}

// add item to user
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

    // get all users for arena
    function getAllUsers() {
        return loadUsers();
    }

    // Add XP and check level up
    function addXP(userId, amount) {
        const user = getUser(userId);
        
        // Apply prestige bonus if exists
        if (user.prestige?.bonus?.xpMultiplier) {
            amount = Math.floor(amount * user.prestige.bonus.xpMultiplier);
        }
        
        user.xp += amount;
        user.totalXp += amount;
        
        let leveledUp = false;
        let milestone = null;
        
        while (user.xp >= user.xpToNextLevel) {
            user.xp -= user.xpToNextLevel;
            user.level++;
            user.xpToNextLevel = Math.floor(100 * Math.pow(1.5, user.level - 1)); // Exponential XP requirement
            leveledUp = true;
            
            // Check milestones
            const milestoneLevels = [5, 10, 15, 20, 25, 30, 40, 50];
            if (milestoneLevels.includes(user.level)) {
                if (!user.milestones) user.milestones = { unlocked: [] };
                if (!user.milestones.unlocked.includes(user.level)) {
                    user.milestones.unlocked.push(user.level);
                    milestone = user.level;
                    
                    // Reward milestone
                    const milestoneRewards = {
                        5: { coins: 1000 },
                        10: { coins: 5000 },
                        15: { coins: 10000, key: 'or' },
                        20: { coins: 20000, prestigeUnlock: true },
                        25: { coins: 30000 },
                        30: { coins: 50000, key: 'demoniaque' },
                        40: { coins: 100000 },
                        50: { coins: 200000 },
                    };
                    const reward = milestoneRewards[user.level];
                    if (reward) {
                        if (reward.coins) addCoins(userId, reward.coins);
                        if (reward.key) addKey(userId, reward.key);
                    }
                }
            }
        }
        
        updateUser(userId, user);
        return { leveledUp, newLevel: user.level, milestone };
    }

    // Get charge system config
    function getChargeConfig(command) {
        const configs = {
            destin: { max: 3, rechargeTime: 120 }, // 1 charge toutes les 2 minutes
            arene: { max: 3, rechargeTime: 180 },  // 1 charge toutes les 3 minutes
            ouvrir: { max: 5, rechargeTime: 60 },  // 1 charge toutes les 1 minute
        };
        return configs[command] || { max: 3, rechargeTime: 120 };
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
            chargeData.lastRecharge = now + (chargesToAdd * config.rechargeTime * 1000);
            updateUser(userId, user);
        }
        
        const nextRechargeMs = (config.rechargeTime * 1000) - (timeSinceRecharge % (config.rechargeTime * 1000));
        
        return {
            current: chargeData.current,
            max: config.max,
            nextRecharge: Math.ceil(nextRechargeMs / 1000),
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
        if (user.charges[chargeKey].lastRecharge > Date.now()) {
            // If we're in the future due to batch recharge, reset to now
            user.charges[chargeKey].lastRecharge = Date.now();
        }
        updateUser(userId, user);
        
        return { success: true, charges: getCharges(userId, command) };
    }

    // Check and update daily streak
    function updateDailyStreak(userId) {
        const user = getUser(userId);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (!user.lastDailyDate) {
            user.dailyStreak = 1;
            user.lastDailyDate = today.toISOString();
            updateUser(userId, user);
            return { streak: 1, bonus: 0 };
        }
        
        const lastDate = new Date(user.lastDailyDate);
        const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) {
            // Already claimed today
            return { streak: user.dailyStreak, bonus: 0 };
        } else if (daysDiff === 1) {
            // Continue streak
            user.dailyStreak++;
            user.lastDailyDate = today.toISOString();
        } else if (daysDiff === 2) {
            // Grace period - continue streak but no bonus
            user.dailyStreak++;
            user.lastDailyDate = today.toISOString();
            updateUser(userId, user);
            return { streak: user.dailyStreak, bonus: 0, graceUsed: true };
        } else {
            // Streak broken
            user.dailyStreak = 1;
            user.lastDailyDate = today.toISOString();
        }
        
        // Streak bonus: +10% coins per day (max 100% at 10 days)
        const streakBonus = Math.min(100, user.dailyStreak * 10);
        
        updateUser(userId, user);
        return { streak: user.dailyStreak, bonus: streakBonus };
    }

    // Generate daily challenge
    function generateDailyChallenge(userId) {
        const user = getUser(userId);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Initialize dailyChallenges if not exists
        if (!user.dailyChallenges) {
            user.dailyChallenges = {
                completed: [],
                current: null,
                resetDate: null,
            };
        }
        
        // Check if challenge already generated today
        if (user.dailyChallenges.resetDate) {
            const resetDate = new Date(user.dailyChallenges.resetDate);
            if (resetDate.getTime() === today.getTime()) {
                return user.dailyChallenges.current;
            }
        }
        
        // Generate new challenge based on level
        const challenges = [
            {
                type: 'destin',
                description: `Utilise &destin ${3 + Math.floor(user.level / 5)} fois`,
                target: 3 + Math.floor(user.level / 5),
                reward: { coins: 500 + (user.level * 50), xp: 50 + (user.level * 5) },
            },
            {
                type: 'arene',
                description: `Gagne ${2 + Math.floor(user.level / 10)} combats en arène`,
                target: 2 + Math.floor(user.level / 10),
                reward: { coins: 1000 + (user.level * 100), xp: 100 + (user.level * 10) },
            },
            {
                type: 'ouvrir',
                description: `Ouvre ${2 + Math.floor(user.level / 8)} coffres`,
                target: 2 + Math.floor(user.level / 8),
                reward: { coins: 800 + (user.level * 80), xp: 80 + (user.level * 8) },
            },
        ];
        
        const challenge = challenges[Math.floor(Math.random() * challenges.length)];
        challenge.progress = 0;
        challenge.id = Date.now().toString();
        
        user.dailyChallenges.current = challenge;
        user.dailyChallenges.resetDate = today.toISOString();
        updateUser(userId, user);
        
        return challenge;
    }

    // Update challenge progress
    function updateChallengeProgress(userId, challengeType) {
        const user = getUser(userId);
        
        // Initialize dailyChallenges if not exists
        if (!user.dailyChallenges) {
            user.dailyChallenges = {
                completed: [],
                current: null,
                resetDate: null,
            };
        }
        
        if (!user.dailyChallenges.current || user.dailyChallenges.current.type !== challengeType) {
            return null;
        }
        
        const challenge = user.dailyChallenges.current;
        challenge.progress = (challenge.progress || 0) + 1;
        
        if (challenge.progress >= challenge.target) {
            // Challenge completed
            addCoins(userId, challenge.reward.coins);
            addXP(userId, challenge.reward.xp);
            
            if (!user.dailyChallenges.completed) {
                user.dailyChallenges.completed = [];
            }
            user.dailyChallenges.completed.push(challenge.id);
            user.dailyChallenges.current = null;
            
            updateUser(userId, user);
            return { completed: true, reward: challenge.reward };
        }
        
        updateUser(userId, user);
        return { completed: false, progress: challenge.progress, target: challenge.target };
    }

    // Get user luck
    function getUserLuck(userId) {
        const user = getUser(userId);
        return user.luck || 0;
    }

    // Update user luck
    function updateLuck(userId, amount) {
        const user = getUser(userId);
        user.luck = Math.max(-50, Math.min(50, (user.luck || 0) + amount));
        updateUser(userId, user);
        return user.luck;
    }

    // Calculate luck from various factors
    function calculateLuck(userId) {
        const user = getUser(userId);
        let luck = 0;
        
        // Base luck from level (higher level = more luck)
        luck += Math.floor(user.level / 5); // +1 luck every 5 levels
        
        // Prestige bonus
        if (user.prestige && user.prestige.level > 0) {
            luck += user.prestige.level * 2; // +2 luck per prestige level
        }
        
        // Streak bonus
        if (user.dailyStreak > 0) {
            luck += Math.floor(user.dailyStreak / 7); // +1 luck every 7 days streak
        }
        
        // Win rate bonus
        if (user.stats && (user.stats.wins + user.stats.losses) > 0) {
            const winRate = user.stats.wins / (user.stats.wins + user.stats.losses);
            if (winRate > 0.6) {
                luck += Math.floor((winRate - 0.6) * 20); // Bonus for high win rate
            }
        }
        
        // Clamp between -50 and +50
        luck = Math.max(-50, Math.min(50, luck));
        
        // Update stored luck
        if (user.luck !== luck) {
            user.luck = luck;
            updateUser(userId, user);
        }
        
        return luck;
    }

    module.exports = {
        getUser,
        updateUser,
        addCoins,
        addKey,
        removeKey,
        addItem,
        reduceItemDurability,
        getAllUsers,
        addXP,
        getChargeConfig,
        getCharges,
        useCharge,
        updateDailyStreak,
        generateDailyChallenge,
        updateChallengeProgress,
        getUserLuck,
        updateLuck,
        calculateLuck,
    };
