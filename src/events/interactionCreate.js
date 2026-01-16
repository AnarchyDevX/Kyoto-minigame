const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Only handle button interactions
        if (!interaction.isButton()) return;
        
        // Handle classement pagination (handled in classement.js collector)
        if (interaction.customId.startsWith('classement_prev_') || interaction.customId.startsWith('classement_next_')) {
            return; // Let the collector in classement.js handle it
        }
        
        // Handle shop interactions (handled in shop.js collector)
        if (interaction.customId.startsWith('shop_') || interaction.customId.startsWith('buy_')) {
            return; // Let the collector in shop.js handle it
        }
        
        // Handle role toggle button
        if (interaction.customId === 'toggle_minijeux_role') {
            try {
                if (!interaction.guild) {
                    return interaction.reply({ 
                        content: '❌ Cette commande ne peut être utilisée que dans un serveur.', 
                        ephemeral: true 
                    });
                }

                const roleName = 'mini-jeux';
                let role = interaction.guild.roles.cache.find(r => 
                    r.name.toLowerCase() === roleName.toLowerCase()
                );

                // Créer le rôle s'il n'existe pas
                if (!role) {
                    try {
                        role = await interaction.guild.roles.create({
                            name: roleName,
                            color: 0x0099FF,
                            reason: 'Rôle créé automatiquement pour l\'accès aux mini-jeux',
                            mentionable: false,
                        });
                    } catch (error) {
                        console.error('Erreur lors de la création du rôle:', error);
                        return interaction.reply({ 
                            content: `❌ Impossible de créer le rôle **${roleName}**. Assure-toi que le bot a les permissions nécessaires.`, 
                            ephemeral: true 
                        });
                    }
                }

                const member = interaction.member;
                const hasRole = member.roles.cache.has(role.id);

                if (hasRole) {
                    // Retirer le rôle
                    await member.roles.remove(role);
                    const successEmbed = new EmbedBuilder()
                        .setColor(0xFF9900)
                        .setTitle('❌ Rôle retiré')
                        .setDescription(`Le rôle **${role.name}** t'a été retiré.\n\nTu n'as plus accès aux channels **🕹️・mini-jeu** et **🎮・commandes-jeu**.`)
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [successEmbed], ephemeral: true });
                } else {
                    // Donner le rôle
                    await member.roles.add(role);
                    const successEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('✅ Rôle obtenu')
                        .setDescription(`Tu as obtenu le rôle **${role.name}** !\n\nTu peux maintenant accéder aux channels **🕹️・mini-jeu** et **🎮・commandes-jeu**.`)
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [successEmbed], ephemeral: true });
                }

                // Mettre à jour le message original avec le nouveau statut
                const newHasRole = !hasRole;
                const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                
                const button = new ButtonBuilder()
                    .setCustomId('toggle_minijeux_role')
                    .setLabel(newHasRole ? 'Retirer le rôle' : 'Obtenir le rôle')
                    .setEmoji(newHasRole ? '❌' : '✅')
                    .setStyle(newHasRole ? ButtonStyle.Danger : ButtonStyle.Success);

                const row = new ActionRowBuilder().addComponents(button);

                const embed = new EmbedBuilder()
                    .setColor(newHasRole ? 0x00FF00 : 0x0099FF)
                    .setTitle('🎮 Accès aux Mini-Jeux')
                    .setDescription(
                        newHasRole 
                            ? `Tu as actuellement le rôle **${role.name}**.\n\n` +
                              `✅ Tu peux voir les channels **🕹️・mini-jeu** et **🎮・commandes-jeu**\n\n` +
                              `Clique sur le bouton ci-dessous pour retirer le rôle.`
                            : `Pour accéder aux channels **🕹️・mini-jeu** et **🎮・commandes-jeu**, tu dois obtenir le rôle **${role.name}**.\n\n` +
                              `Clique sur le bouton ci-dessous pour obtenir le rôle.`
                    )
                    .addFields(
                        {
                            name: '📋 Ce que tu obtiens',
                            value: '• Accès au channel **🕹️・mini-jeu**\n• Accès au channel **🎮・commandes-jeu**\n• Possibilité de jouer aux mini-jeux',
                            inline: false,
                        }
                    )
                    .setFooter({ 
                        text: 'Tu peux retirer le rôle à tout moment',
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTimestamp();

                await interaction.message.edit({ 
                    embeds: [embed], 
                    components: [row] 
                }).catch(() => {});
            } catch (error) {
                console.error('Erreur lors du toggle du rôle:', error);
                await interaction.reply({ 
                    content: '❌ Une erreur s\'est produite. Assure-toi que le bot a les permissions nécessaires pour gérer les rôles.', 
                    ephemeral: true 
                }).catch(() => {});
            }
            return;
        }
        
        // Handle help command buttons
        if (interaction.customId === 'help_games') {
            const devUser = await interaction.client.users.fetch('685552160594723015').catch(() => null);
            
            let fields = [];
            let title = '';
            
            if (interaction.customId === 'help_games') {
                title = '🎮 Commandes Mini-Jeux';
                fields = [
                    {
                        name: '🎲 $destin',
                        value: 'Tente ta chance pour gagner ou perdre des pièces\nGains aléatoires, multiplicateurs, clés, malédictions...',
                        inline: false,
                    },
                    {
                        name: '🧰 $ouvrir coffre_xxx',
                        value: 'Ouvre un coffre avec une clé\nTypes: `coffre_bois`, `coffre_argent`, `coffre_or` (ou `coffre_doré`), `coffre_demoniaque`',
                        inline: false,
                    },
                    {
                        name: '⚔️ $arene [@user]',
                        value: 'Combat automatique contre un adversaire\n`$arene` → adversaire aléatoire\n`$arene @user` → combat contre un ami spécifique\nGagne des pièces et des clés en gagnant !',
                        inline: false,
                    },
                    {
                        name: '🎒 $inventaire',
                        value: 'Affiche ton inventaire : pièces, clés, objets et statistiques',
                        inline: false,
                    },
                    {
                        name: '🏆 $classement',
                        value: 'Affiche le top 100 des joueurs par pièces',
                        inline: false,
                    },
                    {
                        name: '🛒 $shop',
                        value: 'Ouvre la boutique pour acheter des clés et objets',
                        inline: false,
                    },
                    {
                        name: '🎁 $daily',
                        value: 'Réclame ta récompense quotidienne et continue ton streak !',
                        inline: false,
                    },
                    {
                        name: '📊 $resume',
                        value: 'Vue d\'ensemble rapide : charges, pièces, progression',
                        inline: false,
                    },
                    {
                        name: '🎯 $objectifs',
                        value: 'Affiche tes objectifs actifs (défis, paliers, prestige)',
                        inline: false,
                    },
                    {
                        name: '⚔️ $rival',
                        value: 'Gère tes rivalités : `$rival list` ou `$rival challenge @user <mise>`',
                        inline: false,
                    },
                    {
                        name: '⭐ $prestige',
                        value: 'Reset partiel avec bonus permanent (niveau 20 requis)',
                        inline: false,
                    },
                    {
                        name: '🔧 $ameliorer <index>',
                        value: 'Améliore un objet pour augmenter ses stats',
                        inline: false,
                    },
                    {
                        name: '🔧 $reparer',
                        value: 'Répare tes objets endommagés après les combats',
                        inline: false,
                    },
                ];
            }
            
            try {
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(title)
                    .setAuthor(devUser ? {
                        name: `Kyoto Mini-Jeux - ${devUser.username}`,
                        iconURL: devUser.displayAvatarURL(),
                        url: `https://discord.com/users/685552160594723015`,
                    } : {
                        name: 'Kyoto Mini-Jeux',
                    })
                    .addFields(fields)
                    .setFooter({ 
                        text: devUser ? `By ${devUser.tag}` : 'By 0xRynal',
                        iconURL: devUser ? devUser.displayAvatarURL() : undefined
                    })
                    .setTimestamp();
                
                await interaction.update({
                    embeds: [embed],
                    components: [], // Remove buttons after selection
                });
            } catch (error) {
                console.error('Erreur lors de la mise à jour de l\'interaction:', error);
                await interaction.reply({ content: '❌ Une erreur s\'est produite.', ephemeral: true }).catch(() => {});
            }
        }
    },
};
