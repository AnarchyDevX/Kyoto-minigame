const { getUser, addCoins, updateUser } = require('../utils/game');

module.exports = {
    data: {
        name: 'reparer',
    },
    async execute(message, args) {
        try {
            const userId = message.author.id;
            const user = getUser(userId);
            
            if (!user.items || user.items.length === 0) {
                return message.reply({
                    embeds: [{
                        color: 0xFF0000,
                        title: '❌ Aucun objet',
                        description: 'Tu n\'as aucun objet à réparer.',
                        timestamp: new Date().toISOString(),
                    }],
                });
            }
            
            const legendaryTypes = ['oeil_chaos', 'coeur_maudit', 'couronne_destin', 'dragon_ancien', 'grimoire', 'sceau_abime'];
            const brokenItems = user.items.filter(item => 
                item.durability !== undefined && 
                item.durability < 100 && 
                !legendaryTypes.includes(item.type)
            );
            
            if (brokenItems.length === 0) {
                return message.reply({
                    embeds: [{
                        color: 0x00FF00,
                        title: '✅ Tous tes objets sont en parfait état !',
                        timestamp: new Date().toISOString(),
                    }],
                });
            }
            
            let totalCost = 0;
            const repairedItems = [];
            
            brokenItems.forEach(item => {
                const repairCost = (100 - item.durability) * 10; // 10 pièces par point
                totalCost += repairCost;
                item.durability = 100;
                repairedItems.push(item.name);
            });
            
            if (user.coins < totalCost) {
                return message.reply({
                    embeds: [{
                        color: 0xFF0000,
                        title: '❌ Pièces insuffisantes',
                        description: `Il te faut ${totalCost.toLocaleString()} pièces pour réparer.\n\n💰 Tes pièces: ${user.coins.toLocaleString()}`,
                        timestamp: new Date().toISOString(),
                    }],
                });
            }
            
            addCoins(userId, -totalCost);
            updateUser(userId, user);
            
            message.reply({
                embeds: [{
                    color: 0x00FF00,
                    title: '🔧 Réparation effectuée',
                    description: `${brokenItems.length} objet(s) réparé(s) :\n${repairedItems.map(name => `• ${name}`).join('\n')}\n\n💰 Coût: ${totalCost.toLocaleString()} pièces`,
                    footer: {
                        text: `Pièces restantes: ${getUser(userId).coins.toLocaleString()}`,
                    },
                    timestamp: new Date().toISOString(),
                }],
            });
        } catch (error) {
            console.error('Erreur lors de la réparation:', error);
            message.reply('❌ Une erreur s\'est produite.');
        }
    },
};
