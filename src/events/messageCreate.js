const config = require('../config');
const { PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');

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

        // Liste des commandes mini-jeux qui nécessitent le channel spécifique
        const gameCommands = [
            'destin', 'arene', 'ouvrir', 'shop', 'inventaire', 
            'resume', 'rival', 'objectifs', 'prestige', 'daily', 
            'classement', 'ameliorer', 'reparer', 'createfakes', 'help'
        ];

        // Vérifier si c'est une commande mini-jeu
        if (gameCommands.includes(commandName)) {
            // Vérifier si c'est le bon channel
            if (message.channel.id !== config.gamesChannelId) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Channel incorrect')
                    .setDescription(`Les commandes mini-jeux ne peuvent être utilisées que dans <#${config.gamesChannelId}>.`)
                    .setFooter({ 
                        text: message.author.username,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();
                
                return message.reply({ embeds: [errorEmbed] })
                    .then(msg => {
                        setTimeout(() => {
                            msg.delete().catch(() => {});
                        }, 5000);
                    })
                    .catch(() => {});
            }
        }

        try {
            command.execute(message, args);
        } catch (error) {
            console.error(`Erreur lors de l'exécution de la commande ${commandName}:`, error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors de l\'exécution de cette commande.')
                .setTimestamp();
            message.reply({ embeds: [errorEmbed] });
        }
    },
};

async function handleSmashOrPassChannel(message) {
    try {
        // check bot perm
        if (!message.channel.permissionsFor(message.guild.members.me).has(['MANAGE_MESSAGES', 'ADD_REACTIONS', 'CREATE_PUBLIC_THREADS', 'MANAGE_THREADS', 'SEND_MESSAGES_IN_THREADS'])) {
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
                type: ChannelType.PublicThread,
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
