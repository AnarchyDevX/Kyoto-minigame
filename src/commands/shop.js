const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { getUser, addCoins, addKey, addItem, updateUser, calculateLuck } = require('../utils/game');
const { getDailyShopForUser, RARITIES, getTimeUntilNextReset } = require('../utils/shopRotatif');

// Fonction pour créer une barre de chance visuelle
function getLuckBar(luck) {
    const maxLuck = 50;
    const normalized = Math.max(-maxLuck, Math.min(maxLuck, luck));
    const percentage = ((normalized + maxLuck) / (maxLuck * 2)) * 100;
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}


module.exports = {
    data: {
        name: 'shop',
    },
    async execute(message, args) {
        try {
            const userId = message.author.id;
            const user = getUser(userId);
            
            // Calculer la luck du joueur
            const userLuck = calculateLuck(userId);
            
            // Obtenir le shop du jour avec luck appliquée
            const shopItems = getDailyShopForUser(userLuck);
            
            // Créer les boutons de catégories
            const categoryRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('shop_cles')
                        .setLabel('Clés')
                        .setEmoji('🔑')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('shop_objets')
                        .setLabel('Objets')
                        .setEmoji('⚔️')
                        .setStyle(ButtonStyle.Primary)
                );
            
            // Calculer le temps jusqu'au prochain reset
            const timeUntilReset = getTimeUntilNextReset();
            const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
            const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
            
            const luckEmoji = userLuck > 0 ? '🍀' : userLuck < 0 ? '💀' : '⚖️';
            const luckText = userLuck > 0 ? `+${userLuck}` : userLuck < 0 ? `${userLuck}` : '0';
            const luckBar = getLuckBar(userLuck);
            
            // Embed principal du shop
            const shopEmbed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🛒 BOUTIQUE ROTATIVE')
                .setDescription('**Choisis une catégorie pour voir les articles disponibles**\n\n*Le shop se reset automatiquement toutes les 2 heures*')
                .addFields(
                    {
                        name: '💰 Tes pièces',
                        value: `\`\`\`${user.coins.toLocaleString()} pièces\`\`\``,
                        inline: true,
                    },
                    {
                        name: `${luckEmoji} Ta chance`,
                        value: `\`\`\`${luckText}\`\`\`\n${luckBar}`,
                        inline: true,
                    },
                    {
                        name: '⏰ Prochain reset',
                        value: `\`\`\`${hours}h ${minutes}m\`\`\``,
                        inline: true,
                    }
                )
                .setFooter({ 
                    text: 'Utilise les boutons pour naviguer • Shop unique toutes les 2h',
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();
            
            const shopMsg = await message.reply({ 
                embeds: [shopEmbed], 
                components: [categoryRow] 
            });
            
            // Créer un collector global pour toutes les interactions du shop
            const shopCollector = shopMsg.createMessageComponentCollector({ 
                filter: (i) => i.user.id === userId,
                time: 300000 // 5 minutes
            });
            
            let currentCategory = null;
            
            shopCollector.on('collect', async (interaction) => {
                try {
                    // Gérer les clics sur les catégories
                    if (interaction.customId === 'shop_cles' || interaction.customId === 'shop_objets') {
                        const category = interaction.customId === 'shop_cles' ? 'cles' : 'objets';
                        currentCategory = category;
                        const categoryData = shopItems[category];
                        const updatedUser = getUser(userId);
                        const currentUserLuck = calculateLuck(userId);
                    
                        if (!categoryData || !categoryData.items || categoryData.items.length === 0) {
                            const errorEmbed = new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setTitle('❌ Erreur')
                                .setDescription('Aucun article disponible dans cette catégorie.')
                                .setTimestamp();
                            
                            await interaction.reply({
                                embeds: [errorEmbed],
                                ephemeral: true,
                            });
                            return;
                        }
                        
                        // Créer les boutons d'items (max 5 par row)
                        const itemRows = [];
                        let currentRow = new ActionRowBuilder();
                        let buttonCount = 0;
                        
                        categoryData.items.forEach((item, index) => {
                            if (!item.price && item.price !== 0) {
                                console.warn(`Item ${item.name} n'a pas de prix défini`);
                                return;
                            }
                            
                            const canAfford = updatedUser.coins >= item.price;
                            const button = new ButtonBuilder()
                                .setCustomId(`buy_${category}_${index}`)
                                .setLabel(`${item.name} - ${item.price}💰`)
                                .setEmoji(item.emoji || '❓')
                                .setStyle(canAfford ? ButtonStyle.Success : ButtonStyle.Secondary)
                                .setDisabled(!canAfford);
                            
                            currentRow.addComponents(button);
                            buttonCount++;
                            
                            if (buttonCount === 5 || index === categoryData.items.length - 1) {
                                const rowData = currentRow.toJSON();
                                if (rowData.components && rowData.components.length > 0) {
                                    itemRows.push(currentRow);
                                }
                                currentRow = new ActionRowBuilder();
                                buttonCount = 0;
                            }
                        });
                        
                        // Ajouter le bouton retour
                        const backRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('shop_back')
                                    .setLabel('Retour au menu')
                                    .setEmoji('⬅️')
                                    .setStyle(ButtonStyle.Secondary)
                            );
                        itemRows.push(backRow);
                        
                        // Créer les champs avec rareté
                        const fields = categoryData.items.map(item => {
                            const rarityInfo = item.rarityInfo || RARITIES[item.rarity] || RARITIES.commun;
                            let value = `${rarityInfo.emoji} **${rarityInfo.name}**\n\`\`\`💰 ${item.price.toLocaleString()} pièces\`\`\``;
                            
                            if (item.effect) {
                                if (item.effect.damageBoost) {
                                    value += `\n⚔️ **+${item.effect.damageBoost}%** dégâts`;
                                }
                                if (item.effect.defenseBoost) {
                                    value += `\n🛡️ **+${item.effect.defenseBoost}** défense`;
                                }
                            }
                            
                            return {
                                name: `${item.emoji} ${item.name}`,
                                value: value,
                                inline: true,
                            };
                        });
                        
                        // Embed de la catégorie
                        const categoryEmbed = new EmbedBuilder()
                            .setColor(0xFFD700)
                            .setTitle(`${categoryData.title || 'Catégorie'}`)
                            .setDescription('**Clique sur un article pour l\'acheter**\n\n*Les prix et la rareté varient selon ta chance*')
                            .addFields(fields)
                            .setFooter({ 
                                text: `Pièces: ${updatedUser.coins.toLocaleString()} 💰 | Chance: ${currentUserLuck > 0 ? '+' : ''}${currentUserLuck}`,
                                iconURL: message.author.displayAvatarURL()
                            })
                            .setTimestamp();
                        
                        await interaction.update({ 
                            embeds: [categoryEmbed], 
                            components: itemRows 
                        });
                        return;
                    }
                    
                    // Gérer le bouton retour
                    if (interaction.customId === 'shop_back') {
                        try {
                            const refreshedUser = getUser(userId);
                            const refreshedLuck = calculateLuck(userId);
                            const refreshedLuckEmoji = refreshedLuck > 0 ? '🍀' : refreshedLuck < 0 ? '💀' : '⚖️';
                            const refreshedLuckText = refreshedLuck > 0 ? `+${refreshedLuck}` : refreshedLuck < 0 ? `${refreshedLuck}` : '0';
                            
                            const timeUntilReset = getTimeUntilNextReset();
                            const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
                            const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
                            
                            const refreshedShopEmbed = new EmbedBuilder()
                                .setColor(0xFFD700)
                                .setTitle('🛒 BOUTIQUE ROTATIVE')
                                .setDescription('**Choisis une catégorie pour voir les articles disponibles**\n\n*Le shop se reset automatiquement toutes les 2 heures*')
                                .addFields(
                                    {
                                        name: '💰 Tes pièces',
                                        value: `\`\`\`${refreshedUser.coins.toLocaleString()} pièces\`\`\``,
                                        inline: true,
                                    },
                                    {
                                        name: `${refreshedLuckEmoji} Ta chance`,
                                        value: `\`\`\`${refreshedLuckText}\`\`\`\n${getLuckBar(refreshedLuck)}`,
                                        inline: true,
                                    },
                                    {
                                        name: '⏰ Prochain reset',
                                        value: `\`\`\`${hours}h ${minutes}m\`\`\``,
                                        inline: true,
                                    }
                                )
                                .setFooter({ 
                                    text: 'Utilise les boutons pour naviguer • Shop unique toutes les 2h',
                                    iconURL: message.author.displayAvatarURL()
                                })
                                .setTimestamp();
                            
                            await interaction.update({ 
                                embeds: [refreshedShopEmbed], 
                                components: [categoryRow] 
                            });
                            currentCategory = null;
                        } catch (error) {
                            console.error('Erreur lors du retour au shop:', error);
                            const errorEmbed = new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setTitle('❌ Erreur')
                                .setDescription('Une erreur s\'est produite.')
                                .setTimestamp();
                            
                            await interaction.reply({
                                embeds: [errorEmbed],
                                ephemeral: true,
                            }).catch(() => {});
                        }
                        return;
                    }
                    
                    // Gérer les achats
                    if (interaction.customId.startsWith('buy_') && currentCategory) {
                        const currentShop = getDailyShopForUser(calculateLuck(userId));
                        const currentCategoryData = currentShop[currentCategory];
                        
                        if (!currentCategoryData || !currentCategoryData.items) {
                            const errorEmbed = new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setTitle('❌ Erreur')
                                .setDescription('Article introuvable.')
                                .setTimestamp();
                            
                            await interaction.reply({
                                embeds: [errorEmbed],
                                ephemeral: true,
                            });
                            return;
                        }
                        
                        const itemIndex = parseInt(interaction.customId.split('_').pop());
                        const item = currentCategoryData.items[itemIndex];
                        
                        if (!item) {
                            const errorEmbed = new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setTitle('❌ Erreur')
                                .setDescription('Article introuvable.')
                                .setTimestamp();
                            
                            await interaction.reply({
                                embeds: [errorEmbed],
                                ephemeral: true,
                            });
                            return;
                        }
                        
                        const updatedUser = getUser(userId);
                        
                        if (updatedUser.coins < item.price) {
                            const errorEmbed = new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setTitle('❌ Pièces insuffisantes')
                                .setDescription(`Tu n'as que **${updatedUser.coins.toLocaleString()} pièces**.\n\nIl te faut **${item.price.toLocaleString()} pièces** pour acheter ${item.name}.`)
                                .addFields({
                                    name: '💰 Manque',
                                    value: `\`\`\`${(item.price - updatedUser.coins).toLocaleString()} pièces\`\`\``,
                                    inline: true,
                                })
                                .setTimestamp();
                            
                            await interaction.reply({
                                embeds: [errorEmbed],
                                ephemeral: true,
                            });
                            return;
                        }
                        
                        // Traiter l'achat
                        addCoins(userId, -item.price);
                        
                        if (item.type === 'key') {
                            addKey(userId, item.keyType);
                        } else if (item.type === 'item') {
                            addItem(userId, {
                                type: item.itemType,
                                name: item.name,
                                effect: item.effect,
                            });
                        }
                        
                        // Récupérer les données mises à jour
                        const finalUser = getUser(userId);
                        const finalUserLuck = calculateLuck(userId);
                        
                        // Créer l'embed de succès
                        const successEmbed = new EmbedBuilder()
                            .setColor(0x00FF00)
                            .setTitle('✅ Achat réussi !')
                            .setDescription(`Tu as acheté **${item.name}** pour ${item.price.toLocaleString()} pièces.`)
                            .addFields({
                                name: '💰 Pièces restantes',
                                value: `\`\`\`${finalUser.coins.toLocaleString()} pièces\`\`\``,
                                inline: true,
                            })
                            .setFooter({ 
                                text: 'L\'objet a été ajouté à ton inventaire',
                                iconURL: message.author.displayAvatarURL()
                            })
                            .setTimestamp();
                        
                        // Mettre à jour l'embed de la catégorie avec les nouvelles données
                        const updatedCategoryData = getDailyShopForUser(finalUserLuck)[currentCategory];
                        
                        // Recréer les boutons avec les nouvelles pièces
                        const updatedItemRows = [];
                        let updatedCurrentRow = new ActionRowBuilder();
                        let updatedButtonCount = 0;
                        
                        updatedCategoryData.items.forEach((updatedItem, updatedIndex) => {
                            if (!updatedItem.price && updatedItem.price !== 0) {
                                return;
                            }
                            
                            const canAfford = finalUser.coins >= updatedItem.price;
                            const button = new ButtonBuilder()
                                .setCustomId(`buy_${currentCategory}_${updatedIndex}`)
                                .setLabel(`${updatedItem.name} - ${updatedItem.price}💰`)
                                .setEmoji(updatedItem.emoji || '❓')
                                .setStyle(canAfford ? ButtonStyle.Success : ButtonStyle.Secondary)
                                .setDisabled(!canAfford);
                            
                            updatedCurrentRow.addComponents(button);
                            updatedButtonCount++;
                            
                            if (updatedButtonCount === 5 || updatedIndex === updatedCategoryData.items.length - 1) {
                                const rowData = updatedCurrentRow.toJSON();
                                if (rowData.components && rowData.components.length > 0) {
                                    updatedItemRows.push(updatedCurrentRow);
                                }
                                updatedCurrentRow = new ActionRowBuilder();
                                updatedButtonCount = 0;
                            }
                        });
                        
                        // Ajouter le bouton retour
                        const updatedBackRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('shop_back')
                                    .setLabel('Retour au menu')
                                    .setEmoji('⬅️')
                                    .setStyle(ButtonStyle.Secondary)
                            );
                        updatedItemRows.push(updatedBackRow);
                        
                        // Recréer les champs
                        const updatedFields = updatedCategoryData.items.map(updatedItem => {
                            const rarityInfo = updatedItem.rarityInfo || RARITIES[updatedItem.rarity] || RARITIES.commun;
                            let value = `${rarityInfo.emoji} **${rarityInfo.name}**\n\`\`\`💰 ${updatedItem.price.toLocaleString()} pièces\`\`\``;
                            
                            if (updatedItem.effect) {
                                if (updatedItem.effect.damageBoost) {
                                    value += `\n⚔️ **+${updatedItem.effect.damageBoost}%** dégâts`;
                                }
                                if (updatedItem.effect.defenseBoost) {
                                    value += `\n🛡️ **+${updatedItem.effect.defenseBoost}** défense`;
                                }
                            }
                            
                            return {
                                name: `${updatedItem.emoji} ${updatedItem.name}`,
                                value: value,
                                inline: true,
                            };
                        });
                        
                        // Embed de la catégorie mis à jour
                        const updatedCategoryEmbed = new EmbedBuilder()
                            .setColor(0xFFD700)
                            .setTitle(`${updatedCategoryData.title || 'Catégorie'}`)
                            .setDescription('**Clique sur un article pour l\'acheter**\n\n*Les prix et la rareté varient selon ta chance*')
                            .addFields(updatedFields)
                            .setFooter({ 
                                text: `Pièces: ${finalUser.coins.toLocaleString()} 💰 | Chance: ${finalUserLuck > 0 ? '+' : ''}${finalUserLuck}`,
                                iconURL: message.author.displayAvatarURL()
                            })
                            .setTimestamp();
                        
                        // Mettre à jour l'embed et répondre avec le succès
                        await interaction.update({ 
                            embeds: [updatedCategoryEmbed], 
                            components: updatedItemRows 
                        });
                        
                        // Envoyer le message de succès en ephemeral
                        await interaction.followUp({
                            embeds: [successEmbed],
                            ephemeral: true,
                        });
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'interaction shop:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Erreur')
                        .setDescription('Une erreur s\'est produite.')
                        .setTimestamp();
                    
                    await interaction.reply({
                        embeds: [errorEmbed],
                        ephemeral: true,
                    }).catch(() => {});
                }
            });
            
            shopCollector.on('end', () => {
                shopMsg.edit({ components: [] }).catch(() => {});
            });
        } catch (error) {
            console.error('Erreur lors de l\'affichage du shop:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors de l\'affichage du shop.')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
