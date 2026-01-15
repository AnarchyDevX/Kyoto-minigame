const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: {
        name: 'classement',
    },
    async execute(message, args) {
        const { getAllUsers } = require('../utils/game');
        
        try {
            const allUsers = getAllUsers();
            
            // Get all users with their data
            const usersArray = [];
            for (const [userId, userData] of Object.entries(allUsers)) {
                if (userData.coins !== undefined) {
                    // Check if it's a fake user (starts with 999999999999999)
                    if (userId.startsWith('999999999999999')) {
                        // Fake user - use stored username or generate one
                        const fakeUsername = userData.username || `Joueur_${userId.slice(-3)}`;
                        usersArray.push({
                            userId,
                            username: fakeUsername,
                            coins: userData.coins || 0,
                            wins: userData.stats?.wins || 0,
                            losses: userData.stats?.losses || 0,
                            totalCoinsWon: userData.stats?.totalCoinsWon || 0,
                        });
                    } else {
                        // Real user - try to fetch from Discord
                        try {
                            const user = await message.client.users.fetch(userId).catch(() => null);
                            if (user) {
                                usersArray.push({
                                    userId,
                                    username: user.username,
                                    coins: userData.coins || 0,
                                    wins: userData.stats?.wins || 0,
                                    losses: userData.stats?.losses || 0,
                                    totalCoinsWon: userData.stats?.totalCoinsWon || 0,
                                });
                            }
                        } catch (e) {
                            // Skip if user not found
                        }
                    }
                }
            }
            
            if (usersArray.length === 0) {
                return message.reply('❌ Aucun joueur trouvé dans le classement.');
            }
            
            // Sort by coins (descending)
            usersArray.sort((a, b) => b.coins - a.coins);
            
            // Limit to top 100
            const top100 = usersArray.slice(0, 100);
            const totalPages = Math.ceil(top100.length / 10);
            
            // Create buttons for pagination
            function createButtons(page) {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`classement_prev_${page}`)
                            .setLabel('◀️ Précédent')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId(`classement_next_${page}`)
                            .setLabel('Suivant ▶️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page >= totalPages - 1)
                    );
                return row;
            }
            
            // Create embed for a specific page
            function createEmbed(page) {
                const startIndex = page * 10;
                const endIndex = Math.min(startIndex + 10, top100.length);
                const pageUsers = top100.slice(startIndex, endIndex);
                
                const medals = ['🥇', '🥈', '🥉'];
                let rankingText = '';
                
                pageUsers.forEach((user, index) => {
                    const globalIndex = startIndex + index;
                    const medal = globalIndex < 3 ? medals[globalIndex] : `**${globalIndex + 1}.**`;
                    const winRate = user.wins + user.losses > 0 
                        ? ((user.wins / (user.wins + user.losses)) * 100).toFixed(1)
                        : '0.0';
                    
                    rankingText += `${medal} ${user.username}\n`;
                    rankingText += `💰 ${user.coins.toLocaleString()} pièces`;
                    if (user.wins > 0 || user.losses > 0) {
                        rankingText += ` | 🏆 ${user.wins}V/${user.losses}D (${winRate}%)`;
                    }
                    rankingText += '\n\n';
                });
                
                const embed = {
                    color: 0xFFD700,
                    title: '🏆 Classement des Joueurs',
                    description: `Top 100 des joueurs par pièces\nPage ${page + 1}/${totalPages}`,
                    fields: [{
                        name: `📊 Positions ${startIndex + 1}-${endIndex}`,
                        value: rankingText || 'Aucun joueur',
                        inline: false,
                    }],
                    footer: {
                        text: `Total de joueurs: ${usersArray.length} | Utilise les boutons pour naviguer`,
                    },
                    timestamp: new Date().toISOString(),
                };
                
                // Add user's position if not on current page
                const userIndex = usersArray.findIndex(u => u.userId === message.author.id);
                if (userIndex !== -1) {
                    if (userIndex < startIndex || userIndex >= endIndex) {
                        const user = usersArray[userIndex];
                        const winRate = user.wins + user.losses > 0 
                            ? ((user.wins / (user.wins + user.losses)) * 100).toFixed(1)
                            : '0.0';
                        
                        embed.fields.push({
                            name: '📍 Ta position',
                            value: `**${userIndex + 1}.** ${user.username}\n💰 ${user.coins.toLocaleString()} pièces | 🏆 ${user.wins}V/${user.losses}D (${winRate}%)`,
                            inline: false,
                        });
                    } else {
                        embed.fields.push({
                            name: '📍 Ta position',
                            value: `Tu es sur cette page ! 🎉`,
                            inline: false,
                        });
                    }
                }
                
                return embed;
            }
            
            // Send first page
            const buttons = createButtons(0);
            const helpMsg = await message.reply({
                embeds: [createEmbed(0)],
                components: buttons && buttons.components && buttons.components.length > 0 ? [buttons] : [],
            });
            
            // Create collector for pagination
            const filter = (interaction) => {
                return interaction.user.id === message.author.id && 
                       (interaction.customId.startsWith('classement_prev_') || 
                        interaction.customId.startsWith('classement_next_'));
            };
            
            const collector = helpMsg.createMessageComponentCollector({ 
                filter, 
                time: 300000 // 5 minutes
            });
            
            collector.on('collect', async (interaction) => {
                const currentPage = parseInt(interaction.customId.split('_').pop());
                let newPage = currentPage;
                
                if (interaction.customId.startsWith('classement_prev_')) {
                    newPage = Math.max(0, currentPage - 1);
                } else if (interaction.customId.startsWith('classement_next_')) {
                    newPage = Math.min(totalPages - 1, currentPage + 1);
                }
                
                await interaction.update({
                    embeds: [createEmbed(newPage)],
                    components: [createButtons(newPage)],
                });
            });
            
            collector.on('end', () => {
                // Disable buttons after timeout
                helpMsg.edit({ components: [] }).catch(() => {});
            });
        } catch (error) {
            console.error('Erreur lors de l\'affichage du classement:', error);
            message.reply('❌ Une erreur s\'est produite lors de l\'affichage du classement.');
        }
    },
};
