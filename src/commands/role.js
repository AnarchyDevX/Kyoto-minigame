const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: {
        name: 'role',
    },
    async execute(message, args) {
        try {
            if (!message.guild) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Erreur')
                    .setDescription('Cette commande ne peut être utilisée que dans un serveur.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Chercher le rôle "mini-jeux" (insensible à la casse)
            const roleName = 'mini-jeux';
            let role = message.guild.roles.cache.find(r => 
                r.name.toLowerCase() === roleName.toLowerCase()
            );

            // Créer le rôle s'il n'existe pas
            if (!role) {
                try {
                    role = await message.guild.roles.create({
                        name: roleName,
                        color: 0x0099FF,
                        reason: 'Rôle créé automatiquement pour l\'accès aux mini-jeux',
                        mentionable: false,
                    });
                } catch (error) {
                    console.error('Erreur lors de la création du rôle:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Erreur')
                        .setDescription(`Impossible de créer le rôle **${roleName}**.\n\nAssure-toi que le bot a les permissions nécessaires pour créer des rôles.`)
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
            }

            // Vérifier si l'utilisateur a déjà le rôle (rafraîchir le membre pour avoir les rôles à jour)
            const member = await message.guild.members.fetch(message.author.id);
            const hasRole = member.roles.cache.has(role.id);

            // Créer le bouton
            const button = new ButtonBuilder()
                .setCustomId('toggle_minijeux_role')
                .setLabel(hasRole ? 'Retirer le rôle' : 'Obtenir le rôle')
                .setEmoji(hasRole ? '❌' : '✅')
                .setStyle(hasRole ? ButtonStyle.Danger : ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(button);

            // Créer l'embed
            const embed = new EmbedBuilder()
                .setColor(hasRole ? 0x00FF00 : 0x0099FF)
                .setTitle('🎮 Accès aux Mini-Jeux')
                .setDescription(
                    hasRole 
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
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();

            await message.reply({ 
                embeds: [embed], 
                components: [row] 
            });
        } catch (error) {
            console.error('Erreur lors de la commande role:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors de l\'exécution de la commande.')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
    },
};
