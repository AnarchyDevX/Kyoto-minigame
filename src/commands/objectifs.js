const { EmbedBuilder } = require('discord.js');
const { getUser } = require('../utils/game');

module.exports = {
    data: {
        name: 'objectifs',
    },
    async execute(message, args) {
        try {
            const userId = message.author.id;
            const user = getUser(userId);
            
            const objectives = [];
            
            // Daily challenge
            if (user.dailyChallenges?.current) {
                const c = user.dailyChallenges.current;
                const progress = c.progress || 0;
                const progressBar = '█'.repeat(Math.floor((progress / c.target) * 10)) + '░'.repeat(10 - Math.floor((progress / c.target) * 10));
                objectives.push({
                    name: '📋 Défi quotidien',
                    value: `${c.description}\n\`\`\`${progressBar} ${progress}/${c.target}\`\`\`\n💰 **Récompense:** ${c.reward.coins} pièces + ${c.reward.xp} XP`,
                    inline: false,
                });
            }
            
            // Next milestone
            const milestoneLevels = [5, 10, 15, 20, 25, 30, 40, 50];
            const nextMilestone = milestoneLevels.find(m => m > user.level);
            if (nextMilestone) {
                const xpNeeded = user.xpToNextLevel - user.xp;
                objectives.push({
                    name: '⭐ Prochain palier',
                    value: `**Niveau ${nextMilestone}**\n\`\`\`XP nécessaire: ${xpNeeded}\`\`\``,
                    inline: true,
                });
            }
            
            // Prestige available
            if (user.level >= 20) {
                objectives.push({
                    name: '⭐ Prestige disponible',
                    value: `Tape \`$prestige\` pour reset avec bonus permanent`,
                    inline: true,
                });
            }
            
            // Streak next milestone
            const streakMilestones = [7, 30, 100];
            const nextStreak = streakMilestones.find(s => s > (user.dailyStreak || 0));
            if (nextStreak) {
                const daysLeft = nextStreak - (user.dailyStreak || 0);
                objectives.push({
                    name: '🔥 Prochain streak',
                    value: `**${daysLeft} jour${daysLeft > 1 ? 's' : ''}** pour streak ${nextStreak}`,
                    inline: true,
                });
            }
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🎯 OBJECTIFS ACTIFS')
                .setThumbnail(message.author.displayAvatarURL());
            
            if (objectives.length > 0) {
                embed.addFields(objectives);
            } else {
                embed.addFields({
                    name: '✅',
                    value: 'Aucun objectif actif',
                    inline: false,
                });
            }
            
            embed.setFooter({ 
                text: message.author.username,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();
            
            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de l\'affichage des objectifs:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors de l\'affichage des objectifs.')
                .setTimestamp();
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
