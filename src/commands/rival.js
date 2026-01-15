const { EmbedBuilder } = require('discord.js');
const { getUser, updateUser } = require('../utils/game');

module.exports = {
    data: {
        name: 'rival',
    },
    async execute(message, args) {
        try {
            const userId = message.author.id;
            const user = getUser(userId);
            
            if (args[0] === 'list') {
                const rivals = user.rivalries?.rivals || [];
                
                if (rivals.length === 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Aucun rival')
                        .setDescription('Tu n\'as pas encore de rivaux.\n\nUtilise `$arene @user` pour créer une rivalité !')
                        .setFooter({ 
                            text: message.author.username,
                            iconURL: message.author.displayAvatarURL()
                        })
                        .setTimestamp();
                    
                    return message.reply({ embeds: [errorEmbed] });
                }
                
                const rivalList = [];
                for (const r of rivals.slice(0, 10)) {
                    try {
                        const rivalUser = await message.client.users.fetch(r.userId);
                        const winRate = r.wins + r.losses > 0 
                            ? ((r.wins / (r.wins + r.losses)) * 100).toFixed(1)
                            : '0.0';
                        rivalList.push(`**${rivalUser.username}** - ${r.wins}V/${r.losses}D (${winRate}%)`);
                    } catch (e) {
                        rivalList.push(`**Joueur** ${r.userId.slice(-4)} - ${r.wins}V/${r.losses}D`);
                    }
                }
                
                const listEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('⚔️ TES RIVAUX')
                    .setDescription(rivalList.join('\n') || 'Aucun rival')
                    .setFooter({ 
                        text: `${rivals.length} rival${rivals.length > 1 ? 'aux' : ''} au total`,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();
                
                return message.reply({ embeds: [listEmbed] });
            }
            
            if (args[0] === 'challenge' && message.mentions.members.size > 0) {
                const target = message.mentions.members.first();
                // Trouver le montant (premier argument numérique après 'challenge')
                const bet = parseInt(args.find(arg => !isNaN(parseInt(arg)) && parseInt(arg) > 0)) || 0;
                
                if (bet < 100 || bet > user.coins) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Mise invalide')
                        .setDescription(`**Mise minimale:** 100 pièces\n**Mise maximale:** ${user.coins.toLocaleString()} pièces\n\n\`\`\`Tes pièces: ${user.coins.toLocaleString()}\`\`\``)
                        .setTimestamp();
                    
                    return message.reply({ embeds: [errorEmbed] });
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
                
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('⚔️ Défi envoyé !')
                    .setDescription(`Défi envoyé à **${target.user.username}** pour **${bet.toLocaleString()}💰**\n\nIl peut accepter avec \`$arene @${message.author.username}\``)
                    .setThumbnail(target.user.displayAvatarURL())
                    .setFooter({ 
                        text: message.author.username,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();
                
                return message.reply({ embeds: [successEmbed] });
            }
            
            // Default: show help
            const helpEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('⚔️ SYSTÈME DE RIVALITÉS')
                .setDescription('**Commandes disponibles :**\n\n`$rival list` - Liste tes rivaux\n`$rival challenge @user <mise>` - Défie un joueur avec une mise')
                .addFields({
                    name: '💡 Astuce',
                    value: 'Les rivalités se créent automatiquement lors des combats en arène avec d\'autres joueurs.',
                    inline: false,
                })
                .setFooter({ 
                    text: message.author.username,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();
            
            message.reply({ embeds: [helpEmbed] });
        } catch (error) {
            console.error('Erreur lors de la gestion des rivalités:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors de la gestion des rivalités.')
                .setTimestamp();
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
