const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'inventaire',
    },
    async execute(message, args) {
        const { getUser } = require('../utils/game');
        
        try {
            const userId = message.author.id;
            const user = getUser(userId);

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🎒 INVENTAIRE')
                .setThumbnail(message.author.displayAvatarURL())
                .addFields(
                    {
                        name: '💰 Pièces',
                        value: `\`\`\`${user.coins.toLocaleString()} pièces\`\`\``,
                        inline: true,
                    },
                    {
                        name: '🔑 Clés',
                        value: `🟤 **Bois:** ${user.keys.bois || 0}\n⚪ **Argent:** ${user.keys.argent || 0}\n🟡 **Or:** ${user.keys.or || 0}\n🔴 **Démoniaque:** ${user.keys.demoniaque || 0}`,
                        inline: true,
                    },
                    {
                        name: '⭐ Progression',
                        value: `**Niveau** ${user.level || 1}\n\`\`\`XP: ${user.xp || 0}/${user.xpToNextLevel || 100}\`\`\`\n🔥 **Streak:** ${user.dailyStreak || 0} jour${(user.dailyStreak || 0) > 1 ? 's' : ''}`,
                        inline: true,
                    }
                );

            if (user.items && user.items.length > 0) {
                const itemsList = user.items.map((item, index) => {
                    const emoji = getItemEmoji(item.type);
                    let itemText = `${emoji} **${item.name}**`;
                    if (item.level) itemText += ` (Niv.${item.level})`;
                    if (item.durability !== undefined) itemText += ` [${item.durability}%]`;
                    return `${index + 1}. ${itemText}`;
                }).join('\n');
                embed.addFields({
                    name: '🎁 Objets',
                    value: itemsList || 'Aucun objet',
                    inline: false,
                });
            } else {
                embed.addFields({
                    name: '🎁 Objets',
                    value: 'Aucun objet',
                    inline: false,
                });
            }

            if (user.stats) {
                const winRate = user.stats.wins + user.stats.losses > 0 
                    ? ((user.stats.wins / (user.stats.wins + user.stats.losses)) * 100).toFixed(1)
                    : '0.0';
                embed.addFields({
                    name: '📊 Statistiques',
                    value: `🏆 **Victoires:** ${user.stats.wins || 0}\n❌ **Défaites:** ${user.stats.losses || 0}\n📈 **Taux:** ${winRate}%\n💰 **Total gagné:** ${(user.stats.totalCoinsWon || 0).toLocaleString()} pièces`,
                    inline: false,
                });
            }

            if (user.bonuses && (user.bonuses.multiplier > 1 || user.bonuses.chanceBoost !== 0 || user.bonuses.damageBoost > 0)) {
                const bonusesList = [];
                if (user.bonuses.multiplier > 1) {
                    bonusesList.push(`🔥 **Multiplicateur** x${user.bonuses.multiplier}`);
                }
                if (user.bonuses.chanceBoost > 0) {
                    bonusesList.push(`🍀 **+${user.bonuses.chanceBoost}%** chance`);
                }
                if (user.bonuses.damageBoost > 0) {
                    bonusesList.push(`⚔️ **+${user.bonuses.damageBoost}%** dégâts`);
                }
                if (user.bonuses.expiresAt) {
                    const remaining = Math.ceil((user.bonuses.expiresAt - Date.now()) / 1000 / 60);
                    if (remaining > 0) {
                        bonusesList.push(`⏰ **${remaining} min** restantes`);
                    }
                }
                
                if (bonusesList.length > 0) {
                    embed.addFields({
                        name: '✨ Bonus actifs',
                        value: bonusesList.join('\n'),
                        inline: false,
                    });
                }
            }

            embed.setFooter({ 
                text: `Inventaire de ${message.author.username}`,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de l\'affichage de l\'inventaire:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors de l\'affichage de l\'inventaire.')
                .setTimestamp();
            message.reply({ embeds: [errorEmbed] });
        }
    },
};

function getItemEmoji(type) {
    const emojis = {
        'porte_bonheur': '🍀',
        'lame': '⚔️',
        'trefle': '🍀',
        'amulette': '⚔️',
        'anneau': '🍀',
        'gantelets': '⚔️',
        'compagnon_loup': '🐉',
        'jeton_destin': '🎲',
        'oeil_chaos': '🌈',
        'coeur_maudit': '🌈',
        'couronne_destin': '🌈',
        'dragon_ancien': '🌈',
        'grimoire': '🌈',
        'sceau_abime': '🌈',
    };
    return emojis[type] || '🎁';
}
