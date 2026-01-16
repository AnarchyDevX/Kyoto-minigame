const config = require('../config');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    execute(message) {
        // ignore bots
        if (message.author.bot) return;

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
            // Vérifier si c'est le bon channel par nom (plus robuste que l'ID)
            if (message.channel.name !== '🕹️・mini-jeu') {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Channel incorrect')
                    .setDescription(`Les commandes mini-jeux ne peuvent être utilisées que dans le channel **🕹️・mini-jeu**.`)
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
