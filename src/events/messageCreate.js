const config = require('../config');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    execute(message) {
        // ignore bots
        if (message.author.bot) return;

        // handle smash-or-pass channel
        if (message.channel.id === config.smashOrPassChannelId && config.smashOrPassChannelId) {
            handleSmashOrPassChannel(message);
            return;
        }

        // check prefix
        if (!message.content.startsWith(config.prefix)) return;

        // parse command
        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = message.client.commands.get(commandName);

        if (!command) return;

        try {
            command.execute(message, args);
        } catch (error) {
            console.error(`Erreur lors de l'exécution de la commande ${commandName}:`, error);
            message.reply('❌ Une erreur s\'est produite lors de l\'exécution de cette commande.');
        }
    },
};

async function handleSmashOrPassChannel(message) {
    try {
        // check bot perm
        if (!message.channel.permissionsFor(message.guild.members.me).has(['MANAGE_MESSAGES', 'ADD_REACTIONS', 'CREATE_PUBLIC_THREADS', 'MANAGE_THREADS'])) {
            return;
        }

        // check if image
        const hasImage = message.attachments.some(attachment => {
            const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
            const url = attachment.url.toLowerCase();
            return imageExtensions.some(ext => url.includes(`.${ext}`));
        });

        // delete if no image
        if (!hasImage) {
            try {
                await message.delete();
                const warning = await message.channel.send(`⚠️ ${message.author}, seules les images sont autorisées dans ce channel.`);
                setTimeout(() => warning.delete().catch(() => {}), 5000);
            } catch (error) {
                console.error('Erreur lors de la suppression du message:', error);
            }
            return;
        }

        // add reactions and create thread
        try {
            await message.react('✅');
            await message.react('❌');
            
            const thread = await message.startThread({
                name: `Discussion - ${message.author.username}`,
                autoArchiveDuration: 1440,
            });
            
            // Ensure everyone can send messages in the thread
            try {
                // Wait a bit for thread to be fully created and synced
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Fetch the thread to ensure we have the latest data
                const fetchedThread = await thread.fetch();
                
                // Get the everyone role
                const everyoneRole = message.guild.roles.everyone;
                
                // Check current permissions
                const currentOverwrite = fetchedThread.permissionOverwrites.cache.get(everyoneRole.id);
                
                // Remove any existing deny for @everyone first
                if (currentOverwrite) {
                    await fetchedThread.permissionOverwrites.delete(everyoneRole, { reason: 'Reset permissions pour @everyone' });
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                // Create fresh permissions allowing everything
                await fetchedThread.permissionOverwrites.create(everyoneRole, {
                    ViewChannel: true,
                    SendMessages: true,
                    SendMessagesInThreads: true,
                    ReadMessageHistory: true,
                }, { reason: 'Permettre à tout le monde de parler dans le thread' });
                
                console.log(`✅ Permissions configurées pour le thread: ${fetchedThread.name}`);
            } catch (error) {
                console.error('Erreur lors de la configuration des permissions du thread:', error);
                // Try alternative method
                try {
                    const everyoneRole = message.guild.roles.everyone;
                    await thread.permissionOverwrites.edit(everyoneRole, {
                        ViewChannel: true,
                        SendMessages: true,
                        SendMessagesInThreads: true,
                        ReadMessageHistory: true,
                    }, { reason: 'Fallback: Permettre à tout le monde de parler' });
                } catch (fallbackError) {
                    console.error('Erreur lors de la méthode fallback:', fallbackError);
                }
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout des réactions ou création du thread:', error);
        }
    } catch (error) {
        console.error('Erreur dans handleSmashOrPassChannel:', error);
    }
}
