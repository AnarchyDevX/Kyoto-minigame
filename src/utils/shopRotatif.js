const fs = require('fs');
const path = require('path');

const shopDataPath = path.join(__dirname, '..', 'data', 'shopRotatif.json');

// Raretés avec taux de drop et multiplicateurs de prix
const RARITIES = {
    commun: {
        name: 'Commun',
        emoji: '⚪',
        dropRate: 0.50, // 50%
        priceMultiplier: 1.0,
        color: 0x808080,
    },
    rare: {
        name: 'Rare',
        emoji: '🔵',
        dropRate: 0.30, // 30%
        priceMultiplier: 1.5,
        color: 0x0099FF,
    },
    epique: {
        name: 'Épique',
        emoji: '🟣',
        dropRate: 0.15, // 15%
        priceMultiplier: 2.5,
        color: 0x9B59B6,
    },
    legendaire: {
        name: 'Légendaire',
        emoji: '🟡',
        dropRate: 0.05, // 5%
        priceMultiplier: 5.0,
        color: 0xFFD700,
    },
};

// Pool d'items disponibles
const ITEM_POOL = {
    cles: [
        { name: 'Clé Bois', type: 'key', keyType: 'bois', basePrice: 200, emoji: '🟤', rarity: 'commun' },
        { name: 'Clé Argent', type: 'key', keyType: 'argent', basePrice: 500, emoji: '⚪', rarity: 'rare' },
        { name: 'Clé Or', type: 'key', keyType: 'or', basePrice: 1500, emoji: '🟡', rarity: 'epique' },
        { name: 'Clé Démoniaque', type: 'key', keyType: 'demoniaque', basePrice: 5000, emoji: '🔴', rarity: 'legendaire' },
    ],
    objets: [
        { name: 'Lame Émoussée', type: 'item', itemType: 'lame', basePrice: 300, emoji: '⚔️', effect: { damageBoost: 5 }, rarity: 'commun' },
        { name: 'Cuirasse Usée', type: 'item', itemType: 'cuirasse', basePrice: 300, emoji: '🛡️', effect: { defenseBoost: 5 }, rarity: 'commun' },
        { name: 'Amulette du Combattant', type: 'item', itemType: 'amulette', basePrice: 800, emoji: '🔮', effect: { damageBoost: 10 }, rarity: 'rare' },
        { name: 'Armure Légère', type: 'item', itemType: 'armure', basePrice: 800, emoji: '🛡️', effect: { defenseBoost: 10 }, rarity: 'rare' },
        { name: 'Gantelets Sanglants', type: 'item', itemType: 'gantelets', basePrice: 2000, emoji: '⚔️', effect: { damageBoost: 20 }, rarity: 'epique' },
        { name: 'Bouclier de Fer', type: 'item', itemType: 'bouclier', basePrice: 2000, emoji: '🛡️', effect: { defenseBoost: 20 }, rarity: 'epique' },
        { name: 'Épée de la Destinée', type: 'item', itemType: 'lame', basePrice: 5000, emoji: '⚔️', effect: { damageBoost: 35 }, rarity: 'legendaire' },
        { name: 'Armure Divine', type: 'item', itemType: 'armure', basePrice: 5000, emoji: '🛡️', effect: { defenseBoost: 35 }, rarity: 'legendaire' },
    ],
};

// Charger les données du shop
function loadShopData() {
    if (!fs.existsSync(shopDataPath)) {
        return null;
    }
    try {
        const data = fs.readFileSync(shopDataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors du chargement du shop rotatif:', error);
        return null;
    }
}

// Sauvegarder les données du shop
function saveShopData(shopData) {
    try {
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(shopDataPath, JSON.stringify(shopData, null, 2), 'utf8');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du shop rotatif:', error);
        throw error;
    }
}

// Obtenir la date du dernier reset (arrondi à l'heure paire)
function getLastResetTime() {
    const now = new Date();
    const currentHour = now.getHours();
    const resetHour = Math.floor(currentHour / 2) * 2; // Arrondir à l'heure paire (0, 2, 4, 6, etc.)
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), resetHour, 0, 0, 0);
}

// Obtenir la date du prochain reset (2h après le dernier)
function getNextResetTime() {
    const lastReset = getLastResetTime();
    return new Date(lastReset.getTime() + 2 * 60 * 60 * 1000); // +2 heures
}

// Vérifier si le shop doit être reset (toutes les 2h)
function shouldResetShop() {
    const shopData = loadShopData();
    if (!shopData || !shopData.lastReset) {
        return true;
    }
    
    const lastReset = new Date(shopData.lastReset);
    const now = new Date();
    const timeSinceLastReset = now - lastReset;
    
    // Reset si 2 heures ou plus se sont écoulées
    return timeSinceLastReset >= 2 * 60 * 60 * 1000;
}

// Calculer le multiplicateur de prix basé sur la luck
function calculatePriceMultiplier(userLuck, baseMultiplier) {
    // Luck affecte le prix : -10% à +10% par point de luck
    // Luck va de -50 à +50 (affecte de -50% à +50% max)
    const luckEffect = 1 + (userLuck / 100); // -0.5 à +0.5
    return baseMultiplier * luckEffect;
}

// Générer un item aléatoire selon les taux de drop
function generateRandomItem(category, userLuck = 0) {
    const pool = ITEM_POOL[category] || [];
    if (pool.length === 0) return null;
    
    // Calculer les probabilités avec bonus de luck
    // Luck augmente les chances d'obtenir des items rares
    const luckBonus = Math.max(0, userLuck / 10); // +0.1% par point de luck positif
    
    const weightedPool = [];
    pool.forEach(item => {
        const rarity = RARITIES[item.rarity];
        let dropRate = rarity.dropRate;
        
        // Bonus de luck pour les raretés supérieures
        if (userLuck > 0) {
            if (item.rarity === 'legendaire') {
                dropRate += (luckBonus * 0.01); // +0.1% par point de luck
            } else if (item.rarity === 'epique') {
                dropRate += (luckBonus * 0.02); // +0.2% par point de luck
            } else if (item.rarity === 'rare') {
                dropRate += (luckBonus * 0.03); // +0.3% par point de luck
            }
        }
        
        // Malus de luck pour les raretés inférieures si luck négative
        if (userLuck < 0) {
            if (item.rarity === 'commun') {
                dropRate += Math.abs(userLuck / 1000); // +0.1% par point de luck négatif
            }
        }
        
        // Normaliser pour que la somme reste à 1
        const weight = Math.max(0.01, Math.min(0.99, dropRate));
        weightedPool.push({ ...item, weight });
    });
    
    // Normaliser les poids
    const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
    weightedPool.forEach(item => {
        item.weight = item.weight / totalWeight;
    });
    
    // Sélectionner selon les poids
    let random = Math.random();
    let cumulative = 0;
    
    for (const item of weightedPool) {
        cumulative += item.weight;
        if (random <= cumulative) {
            return item;
        }
    }
    
    // Fallback (ne devrait jamais arriver)
    return weightedPool[weightedPool.length - 1];
}

// Générer le shop (sans luck, généré une fois pour tous)
function generateDailyShop() {
    const shopItems = {
        cles: {
            title: '🔑 Clés',
            items: [],
        },
        objets: {
            title: '⚔️ Objets',
            items: [],
        },
    };
    
    // Sets pour éviter les duplications
    const usedKeys = new Set();
    const usedItems = new Set();
    
    // Générer 3-5 clés sans duplication
    const numKeys = 3 + Math.floor(Math.random() * 3);
    let attempts = 0;
    const maxAttempts = 50; // Limite de tentatives pour éviter boucle infinie
    
    while (shopItems.cles.items.length < numKeys && attempts < maxAttempts) {
        attempts++;
        const item = generateRandomItem('cles', 0); // Génération neutre
        if (item && !usedKeys.has(item.name)) {
            usedKeys.add(item.name);
            const rarity = RARITIES[item.rarity];
            const basePrice = Math.floor(item.basePrice * rarity.priceMultiplier);
            
            shopItems.cles.items.push({
                ...item,
                basePrice: basePrice, // Prix de base sans luck
                rarity: item.rarity,
                rarityInfo: rarity,
            });
        }
    }
    
    // Générer 4-6 objets sans duplication
    const numItems = 4 + Math.floor(Math.random() * 3);
    attempts = 0;
    
    while (shopItems.objets.items.length < numItems && attempts < maxAttempts) {
        attempts++;
        const item = generateRandomItem('objets', 0); // Génération neutre
        if (item && !usedItems.has(item.name)) {
            usedItems.add(item.name);
            const rarity = RARITIES[item.rarity];
            const basePrice = Math.floor(item.basePrice * rarity.priceMultiplier);
            
            shopItems.objets.items.push({
                ...item,
                basePrice: basePrice, // Prix de base sans luck
                rarity: item.rarity,
                rarityInfo: rarity,
            });
        }
    }
    
    return shopItems;
}

// Appliquer la luck d'un joueur au shop (pour affichage et achat)
function applyLuckToShop(shopItems, userLuck) {
    const adjustedShop = JSON.parse(JSON.stringify(shopItems)); // Deep copy
    
    // Ajuster les prix selon la luck
    ['cles', 'objets'].forEach(category => {
        if (adjustedShop[category] && adjustedShop[category].items) {
            adjustedShop[category].items = adjustedShop[category].items.map(item => {
                const rarity = item.rarityInfo || RARITIES[item.rarity] || RARITIES.commun;
                const priceMultiplier = calculatePriceMultiplier(userLuck, 1.0);
                const finalPrice = Math.floor(item.basePrice * priceMultiplier);
                
                return {
                    ...item,
                    price: finalPrice,
                };
            });
        }
    });
    
    return adjustedShop;
}

// Obtenir ou générer le shop (sans luck)
function getDailyShop() {
    const shopData = loadShopData();
    
    if (shouldResetShop()) {
        // Générer nouveau shop
        const newShop = generateDailyShop();
        const now = new Date();
        
        saveShopData({
            lastReset: now.toISOString(),
            shop: newShop,
        });
        
        return newShop;
    }
    
    // Retourner le shop existant
    return shopData.shop || generateDailyShop();
}

// Obtenir le shop avec luck appliquée pour un joueur
function getDailyShopForUser(userLuck = 0) {
    const baseShop = getDailyShop();
    return applyLuckToShop(baseShop, userLuck);
}

// Obtenir le shop actuel (sans reset)
function getCurrentShop() {
    const shopData = loadShopData();
    if (!shopData || !shopData.shop) {
        return generateDailyShop(0);
    }
    return shopData.shop;
}

// Forcer le reset du shop (pour tests ou admin)
function forceResetShop() {
    const newShop = generateDailyShop();
    const now = new Date();
    
    saveShopData({
        lastReset: now.toISOString(),
        shop: newShop,
    });
    
    return newShop;
}

// Obtenir le temps jusqu'au prochain reset
function getTimeUntilNextReset() {
    const shopData = loadShopData();
    if (!shopData || !shopData.lastReset) {
        return 0;
    }
    
    const lastReset = new Date(shopData.lastReset);
    const nextReset = new Date(lastReset.getTime() + 2 * 60 * 60 * 1000);
    const now = new Date();
    
    return Math.max(0, nextReset - now);
}

module.exports = {
    getDailyShop,
    getDailyShopForUser,
    getCurrentShop,
    forceResetShop,
    shouldResetShop,
    getTimeUntilNextReset,
    RARITIES,
    calculatePriceMultiplier,
    applyLuckToShop,
};
