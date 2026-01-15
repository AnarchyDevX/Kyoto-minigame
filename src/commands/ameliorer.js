const { getUser, addCoins, updateUser } = require('../utils/game');

module.exports = {
    data: {
        name: 'ameliorer',
    },
    async execute(message, args) {
        try {
            if (args.length < 1) {
                return message.reply('❌ Usage: `$ameliorer <index_objet>`\nUtilise `$inventaire` pour voir les index de tes objets.');
            }
            
            const userId = message.author.id;
            const user = getUser(userId);
            const itemIndex = parseInt(args[0]) - 1;
            
            if (!user.items || itemIndex < 0 || itemIndex >= user.items.length) {
                return message.reply({
                    embeds: [{
                        color: 0xFF0000,
                        title: '❌ Objet invalide',
                        description: 'Utilise `$inventaire` pour voir tes objets et leurs index.',
                        timestamp: new Date().toISOString(),
                    }],
                });
            }
            
            const item = user.items[itemIndex];
            
            // Cannot upgrade legendary items
            const legendaryTypes = ['oeil_chaos', 'coeur_maudit', 'couronne_destin', 'dragon_ancien', 'grimoire', 'sceau_abime'];
            if (legendaryTypes.includes(item.type)) {
                return message.reply({
                    embeds: [{
                        color: 0xFF0000,
                        title: '❌ Impossible',
                        description: 'Les objets légendaires ne peuvent pas être améliorés.',
                        timestamp: new Date().toISOString(),
                    }],
                });
            }
            
            // Calculate upgrade cost
            const currentLevel = item.level || 1;
            const upgradeCost = Math.floor(500 * Math.pow(2, currentLevel - 1)); // 500, 1000, 2000, 4000...
            
            if (user.coins < upgradeCost) {
                return message.reply({
                    embeds: [{
                        color: 0xFF0000,
                        title: '❌ Pièces insuffisantes',
                        description: `Il te faut ${upgradeCost.toLocaleString()} pièces pour améliorer cet objet.\n\n💰 Tes pièces: ${user.coins.toLocaleString()}`,
                        timestamp: new Date().toISOString(),
                    }],
                });
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
                    description: `**${item.name}** → Niveau ${item.level}\n\n💰 Coût: ${upgradeCost.toLocaleString()} pièces\n${item.effect?.damageBoost ? `⚔️ Dégâts: +${item.effect.damageBoost}` : ''}${item.effect?.defenseBoost ? `🛡️ Défense: +${item.effect.defenseBoost}` : ''}`,
                    footer: {
                        text: `Pièces restantes: ${getUser(userId).coins.toLocaleString()}`,
                    },
                    timestamp: new Date().toISOString(),
                }],
            });
        } catch (error) {
            console.error('Erreur lors de l\'amélioration:', error);
            message.reply('❌ Une erreur s\'est produite.');
        }
    },
};
