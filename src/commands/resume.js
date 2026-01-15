const { EmbedBuilder } = require('discord.js');
const { getUser, getCharges } = require('../utils/game');

module.exports = {
    data: {
        name: 'resume',
    },
    async execute(message, args) {
        try {
            const userId = message.author.id;
            const user = getUser(userId);
            
            const chargesDestin = getCharges(userId, 'destin');
            const chargesArene = getCharges(userId, 'arene');
            const chargesOuvrir = getCharges(userId, 'ouvrir');
            
            const challenge = user.dailyChallenges?.current;
            const totalKeys = Object.values(user.keys || {}).reduce((a, b) => a + b, 0);
            
            // Fonction pour formater le temps de recharge
            function formatRechargeTime(charges) {
                if (charges.current >= charges.max) {
                    return '✅';
                }
                const minutes = Math.floor(charges.nextRecharge / 60);
                const seconds = charges.nextRecharge % 60;
                if (minutes > 0) {
                    return `⏳ ${minutes}m ${seconds}s`;
                }
                return `⏳ ${seconds}s`;
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('📊 RÉSUMÉ')
                .setThumbnail(message.author.displayAvatarURL())
                .addFields(
                    {
                        name: '💰 Économie',
                        value: `\`\`\`Pièces: ${user.coins.toLocaleString()}\nClés: ${totalKeys}\`\`\``,
                        inline: true,
                    },
                    {
                        name: '⚡ Charges',
                        value: `🎲 **Destin:** ${chargesDestin.current}/${chargesDestin.max} ${formatRechargeTime(chargesDestin)}\n⚔️ **Arène:** ${chargesArene.current}/${chargesArene.max} ${formatRechargeTime(chargesArene)}\n🧰 **Ouvrir:** ${chargesOuvrir.current}/${chargesOuvrir.max} ${formatRechargeTime(chargesOuvrir)}`,
                        inline: true,
                    },
                    {
                        name: '⭐ Progression',
                        value: `**Niveau:** ${user.level || 1}\n\`\`\`XP: ${user.xp || 0}/${user.xpToNextLevel || 100}\`\`\`\n🔥 **Streak:** ${user.dailyStreak || 0}j${user.prestige?.level ? `\n⭐ **Prestige:** ${user.prestige.level}` : ''}`,
                        inline: true,
                    }
                );
            
            if (challenge) {
                const progress = challenge.progress || 0;
                const target = challenge.target;
                const progressBar = '█'.repeat(Math.floor((progress / target) * 10)) + '░'.repeat(10 - Math.floor((progress / target) * 10));
                embed.addFields({
                    name: '📋 Défi quotidien',
                    value: `${challenge.description}\n\`\`\`${progressBar} ${progress}/${target}\`\`\``,
                    inline: false,
                });
            }
            
            if (user.stats) {
                const winRate = user.stats.wins + user.stats.losses > 0 
                    ? ((user.stats.wins / (user.stats.wins + user.stats.losses)) * 100).toFixed(1)
                    : '0.0';
                embed.addFields({
                    name: '🏆 Statistiques',
                    value: `🏆 **Victoires:** ${user.stats.wins || 0}\n❌ **Défaites:** ${user.stats.losses || 0}\n📈 **Taux:** ${winRate}%`,
                    inline: true,
                });
            }
            
            embed.setFooter({ 
                text: `Résumé de ${message.author.username}`,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();
            
            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de l\'affichage du résumé:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors de l\'affichage du résumé.')
                .setTimestamp();
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
