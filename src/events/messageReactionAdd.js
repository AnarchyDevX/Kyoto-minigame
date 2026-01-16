const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        // Ignorer les bots
        if (user.bot) return;

        // Récupérer le message complet si c'est une réaction partielle
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Erreur lors de la récupération de la réaction:', error);
                return;
            }
        }

        let message = reaction.message;
        
        // Récupérer le message complet si c'est une réaction partielle
        if (message.partial) {
            try {
                await message.fetch();
            } catch (error) {
                console.error('Erreur lors de la récupération du message:', error);
                return;
            }
        }
        
        // Vérifier que c'est un message du bot
        if (!message.author || !message.author.bot) return;

        // Vérifier que c'est un message avec un embed de rôle
        if (!message.embeds || message.embeds.length === 0) return;
        
        const embed = message.embeds[0];
        if (!embed || !embed.title || !embed.title.includes('🎮 Accès aux Mini-Jeux')) return;

        // Vérifier que c'est une réaction ✅ ou ❌
        if (reaction.emoji.name !== '✅' && reaction.emoji.name !== '❌') return;

        try {
            if (!message.guild) {
                return;
            }

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
                    return;
                }
            }

            // Récupérer le membre avec les rôles à jour
            const member = await message.guild.members.fetch(user.id);
            const hasRole = member.roles.cache.has(role.id);

            if (reaction.emoji.name === '✅') {
                // Ajouter le rôle
                if (!hasRole) {
                    await member.roles.add(role);
                    const successEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('✅ Rôle obtenu')
                        .setDescription(`Tu as obtenu le rôle **${role.name}** !\n\nTu peux maintenant accéder aux channels **🕹️・mini-jeu** et **🎮・commandes-jeu**.`)
                        .setTimestamp();
                    
                    await user.send({ embeds: [successEmbed] }).catch(() => {
                        // Si les DMs sont désactivés, on ne fait rien
                    });
                } else {
                    const alreadyEmbed = new EmbedBuilder()
                        .setColor(0xFF9900)
                        .setTitle('⚠️ Tu as déjà le rôle')
                        .setDescription(`Tu as déjà le rôle **${role.name}**.\n\nUtilise ❌ pour le retirer.`)
                        .setTimestamp();
                    
                    await user.send({ embeds: [alreadyEmbed] }).catch(() => {});
                }
            } else if (reaction.emoji.name === '❌') {
                // Retirer le rôle
                if (hasRole) {
                    await member.roles.remove(role);
                    const successEmbed = new EmbedBuilder()
                        .setColor(0xFF9900)
                        .setTitle('❌ Rôle retiré')
                        .setDescription(`Le rôle **${role.name}** t'a été retiré.\n\nTu n'as plus accès aux channels **🕹️・mini-jeu** et **🎮・commandes-jeu**.`)
                        .setTimestamp();
                    
                    await user.send({ embeds: [successEmbed] }).catch(() => {});
                } else {
                    const alreadyEmbed = new EmbedBuilder()
                        .setColor(0xFF9900)
                        .setTitle('⚠️ Tu n\'as pas le rôle')
                        .setDescription(`Tu n'as pas le rôle **${role.name}**.\n\nUtilise ✅ pour l'obtenir.`)
                        .setTimestamp();
                    
                    await user.send({ embeds: [alreadyEmbed] }).catch(() => {});
                }
            }

            // Retirer la réaction pour que l'utilisateur puisse réagir à nouveau
            try {
                await reaction.users.remove(user.id);
            } catch (error) {
                console.error('Erreur lors de la suppression de la réaction:', error);
            }
        } catch (error) {
            console.error('Erreur lors de la gestion de la réaction:', error);
        }
    },
};
