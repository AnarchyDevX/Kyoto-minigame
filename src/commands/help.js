module.exports = {
    data: {
        name: 'help',
    },
    async execute(message, args) {
        try {
            const devUser = await message.client.users.fetch('685552160594723015').catch(() => null);
            
            await message.reply({
                embeds: [{
                    color: 0x0099FF,
                    title: '📖 Commandes disponibles',
                    author: devUser ? {
                        name: `Kyoto Sanction - ${devUser.username}`,
                        icon_url: devUser.displayAvatarURL(),
                        url: `https://discord.com/users/685552160594723015`,
                    } : {
                        name: 'Kyoto Sanction',
                    },
                    fields: [
                        {
                            name: '🔇 &mute @user <durée> [raison]',
                            value: 'Mute un utilisateur avec un rôle (max 1h)\nFormats: `10m`, `30m`, `1h`\nExemple: `&mute @user 30m Spam`\nLa raison est optionnelle',
                            inline: false,
                        },
                        {
                            name: '🔓 &unmute @user',
                            value: 'Retire le mute d\'un utilisateur',
                            inline: false,
                        },
                        {
                            name: '⏱️ &timeout @user <durée> [raison]',
                            value: 'Applique un timeout Discord (max 10min)\nFormats: `1m`, `5m`, `10m`\nExemple: `&timeout @user 5m Insultes`\nLa raison est optionnelle',
                            inline: false,
                        },
                        {
                            name: '🔓 &untimeout @user',
                            value: 'Retire le timeout d\'un utilisateur',
                            inline: false,
                        },
                        {
                            name: '✅ &wladd @role',
                            value: 'Ajoute un rôle à la whitelist (permet de sanctionner des membres avec ce rôle même s\'ils sont supérieurs)',
                            inline: false,
                        },
                        {
                            name: '❌ &wlremove @role',
                            value: 'Retire un rôle de la whitelist',
                            inline: false,
                        },
                        {
                            name: '📋 &wllist',
                            value: 'Affiche la liste des rôles dans la whitelist',
                            inline: false,
                        },
                    ],
                    footer: {
                        text: devUser ? `By ${devUser.tag} (${devUser.id})` : 'By 0xRynal',
                    },
                    timestamp: new Date().toISOString(),
                }],
            });
        } catch (error) {
            console.error('Erreur lors de l\'affichage de l\'aide:', error);
            message.reply('❌ Une erreur s\'est produite lors de l\'affichage de l\'aide.');
        }
    },
};
