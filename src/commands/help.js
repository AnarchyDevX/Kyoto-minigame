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
                            value: 'Mute un utilisateur (max 1h)\nEx: `&mute @user 30m Spam`',
                            inline: true,
                        },
                        {
                            name: '⏱️ &timeout @user <durée> [raison]',
                            value: 'Timeout un utilisateur (max 10min)\nEx: `&timeout @user 5m Insultes`',
                            inline: true,
                        },
                        {
                            name: '🔓 &unmute @user',
                            value: 'Retire le mute',
                            inline: true,
                        },
                        {
                            name: '🔓 &untimeout @user',
                            value: 'Retire le timeout',
                            inline: true,
                        },
                        {
                            name: '✅ &wladd @role',
                            value: 'Ajoute un rôle à la whitelist',
                            inline: true,
                        },
                        {
                            name: '❌ &wlremove @role',
                            value: 'Retire un rôle de la whitelist',
                            inline: true,
                        },
                        {
                            name: '📋 &wllist',
                            value: 'Liste les rôles whitelistés',
                            inline: true,
                        },
                        {
                            name: '✅ &semiwladd @role',
                            value: 'Ajoute un rôle à la semi-whitelist (mute uniquement)',
                            inline: true,
                        },
                        {
                            name: '❌ &semiwlremove @role',
                            value: 'Retire un rôle de la semi-whitelist',
                            inline: true,
                        },
                        {
                            name: '📋 &semiwllist',
                            value: 'Liste les rôles semi-whitelistés',
                            inline: true,
                        },
                        {
                            name: '👑 &setadmin @role',
                            value: 'Définit un rôle admin pour gérer les whitelists',
                            inline: true,
                        },
                    ],
                    footer: {
                        text: devUser ? `By ${devUser.tag}` : 'By 0xRynal',
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
