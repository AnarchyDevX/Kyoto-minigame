const { getUser, updateDailyStreak, generateDailyChallenge, addCoins, addXP } = require('../utils/game');

module.exports = {
    data: {
        name: 'daily',
    },
    async execute(message, args) {
        try {
            const userId = message.author.id;
            const user = getUser(userId);
            
            // Vérifier le cooldown de 24h
            const now = Date.now();
            const lastDailyTime = user.lastDailyTime || 0;
            const timeSinceLastDaily = now - lastDailyTime;
            const cooldownMs = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
            
            if (timeSinceLastDaily < cooldownMs && lastDailyTime > 0) {
                const remainingMs = cooldownMs - timeSinceLastDaily;
                const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
                const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                
                const cooldownEmbed = {
                    color: 0xFF9900,
                    title: '⏰ Cooldown actif',
                    description: `Tu as déjà réclamé ta récompense quotidienne !`,
                    fields: [
                        {
                            name: '⏳ Temps restant',
                            value: `${remainingHours}h ${remainingMinutes}m`,
                            inline: true,
                        },
                    ],
                    footer: {
                        text: 'Reviens dans 24h pour réclamer à nouveau',
                    },
                    timestamp: new Date().toISOString(),
                };
                
                return message.reply({ embeds: [cooldownEmbed] });
            }
            
            // Update streak and get bonus
            const streakData = updateDailyStreak(userId);
            const updatedUser = getUser(userId);
            
            // Enregistrer le timestamp de la réclamation
            updatedUser.lastDailyTime = now;
            const { updateUser } = require('../utils/game');
            updateUser(userId, updatedUser);
            
            // Generate or get daily challenge
            const challenge = generateDailyChallenge(userId);
            
            // Maintenance tax based on level
            const maintenanceTax = Math.floor(updatedUser.level * 50); // 50 pièces par niveau
            let itemsLost = 0;
            
            if (updatedUser.coins < maintenanceTax) {
                // Player loses items if can't pay
                const deficit = maintenanceTax - updatedUser.coins;
                const itemsToLose = Math.floor(deficit / 1000);
                if (itemsToLose > 0 && updatedUser.items && updatedUser.items.length > 0) {
                    // Remove non-legendary items first
                    const legendaryTypes = ['oeil_chaos', 'coeur_maudit', 'couronne_destin', 'dragon_ancien', 'grimoire', 'sceau_abime'];
                    const nonLegendary = updatedUser.items.filter(item => !legendaryTypes.includes(item.type));
                    for (let i = 0; i < Math.min(itemsToLose, nonLegendary.length); i++) {
                        const index = updatedUser.items.indexOf(nonLegendary[i]);
                        if (index > -1) {
                            updatedUser.items.splice(index, 1);
                            itemsLost++;
                        }
                    }
                }
                addCoins(userId, -Math.min(updatedUser.coins, maintenanceTax));
            } else {
                addCoins(userId, -maintenanceTax);
            }
            
            // Daily reward based on streak
            const baseReward = 500;
            const streakBonus = Math.floor(baseReward * (streakData.bonus / 100));
            const totalReward = baseReward + streakBonus;
            
            // Check for streak milestones
            const streakMilestones = [7, 30, 100];
            let milestoneReward = null;
            if (streakMilestones.includes(streakData.streak)) {
                milestoneReward = {
                    7: { coins: 2000, title: '🔥 Streak de 7 jours !' },
                    30: { coins: 10000, item: 'jeton_destin', title: '💎 Streak de 30 jours !' },
                    100: { coins: 50000, key: 'demoniaque', title: '👑 Streak de 100 jours !' },
                }[streakData.streak];
            }
            
            // Add daily reward
            addCoins(userId, totalReward);
            addXP(userId, 50);
            
            // Add milestone reward if applicable
            if (milestoneReward) {
                addCoins(userId, milestoneReward.coins);
                if (milestoneReward.item) {
                    const { addItem } = require('../utils/game');
                    addItem(userId, { type: milestoneReward.item, name: 'Jeton du Destin', effect: { freeDestin: true } });
                }
                if (milestoneReward.key) {
                    const { addKey } = require('../utils/game');
                    addKey(userId, milestoneReward.key);
                }
            }
            
            const finalUser = getUser(userId);
            
            const dailyEmbed = {
                color: 0x00FF00,
                title: '🎁 Récompense Quotidienne',
                description: `Tu as réclamé ta récompense quotidienne !`,
                fields: [
                    {
                        name: '💰 Récompense',
                        value: `💰 ${totalReward.toLocaleString()} pièces\n📊 +50 XP`,
                        inline: false,
                    },
                    {
                        name: '🔥 Streak',
                        value: `${streakData.streak} jour${streakData.streak > 1 ? 's' : ''} consécutif${streakData.streak > 1 ? 's' : ''}\n${streakData.bonus > 0 ? `+${streakData.bonus}% bonus (${streakBonus} pièces)` : 'Pas de bonus'}`,
                        inline: true,
                    },
                    {
                        name: '💸 Taxe de maintenance',
                        value: `-${maintenanceTax} pièces (niveau ${updatedUser.level})${itemsLost > 0 ? `\n⚠️ ${itemsLost} objet(s) perdu(s) (solde insuffisant)` : ''}`,
                        inline: true,
                    },
                    {
                        name: '📋 Défi Quotidien',
                        value: challenge ? `${challenge.description}\nProgression: ${challenge.progress || 0}/${challenge.target}\nRécompense: ${challenge.reward.coins}💰 + ${challenge.reward.xp}XP` : 'Aucun défi',
                        inline: false,
                    },
                    {
                        name: '⭐ Niveau',
                        value: `Niveau ${finalUser.level}\nXP: ${finalUser.xp}/${finalUser.xpToNextLevel}${finalUser.prestige?.level ? `\n⭐ Prestige ${finalUser.prestige.level}` : ''}`,
                        inline: true,
                    },
                ],
                footer: {
                    text: milestoneReward ? milestoneReward.title : (streakData.streak >= 7 ? '🔥 Streak de feu ! Continue comme ça !' : 'Reviens demain pour continuer ton streak !'),
                },
                timestamp: new Date().toISOString(),
            };
            
            // Add milestone field if applicable
            if (milestoneReward) {
                dailyEmbed.fields.push({
                    name: '🎉 ' + milestoneReward.title,
                    value: `Récompense spéciale : ${milestoneReward.coins.toLocaleString()}💰${milestoneReward.item ? ' + Jeton du Destin' : ''}${milestoneReward.key ? ' + Clé démoniaque' : ''}`,
                    inline: false,
                });
            }
            
            message.reply({ embeds: [dailyEmbed] });
        } catch (error) {
            console.error('Erreur lors de la récompense quotidienne:', error);
            message.reply({
                embeds: [{
                    color: 0xFF0000,
                    title: '❌ Erreur',
                    description: 'Une erreur s\'est produite.',
                    timestamp: new Date().toISOString(),
                }],
            });
        }
    },
};
