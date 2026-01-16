const { EmbedBuilder } = require('discord.js');

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

            // Créer l'embed (neutre, pas basé sur un utilisateur spécifique)
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🎮 Accès aux Mini-Jeux')
                .setDescription(
                    `Pour accéder aux channels **🕹️・mini-jeu** et **🎮・commandes-jeu**, tu dois obtenir le rôle **${role.name}**.\n\n` +
                    `**Réagis avec ✅ pour obtenir le rôle**\n` +
                    `**Réagis avec ❌ pour retirer le rôle**`
                )
                .addFields(
                    {
                        name: '📋 Ce que tu obtiens',
                        value: '• Accès au channel **🕹️・mini-jeu**\n• Accès au channel **🎮・commandes-jeu**\n• Possibilité de jouer aux mini-jeux',
                        inline: false,
                    }
                )
                .setFooter({ 
                    text: 'Chaque joueur voit son propre statut',
                })
                .setTimestamp();

            const roleMsg = await message.reply({ embeds: [embed] });
            
            // Ajouter les réactions
            await roleMsg.react('✅');
            await roleMsg.react('❌');
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
