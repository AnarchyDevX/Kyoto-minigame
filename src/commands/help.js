const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'help',
    },
    async execute(message, args) {
        try {
            const devUser = await message.client.users.fetch('685552160594723015').catch(() => null);
            
            // Create buttons
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('help_games')
                        .setLabel('Mini-Jeux')
                        .setEmoji('🎮')
                        .setStyle(ButtonStyle.Primary)
                );
            
            const helpEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('📖 COMMANDES MINI-JEUX')
                .setDescription('**Clique sur le bouton pour voir toutes les commandes disponibles**')
                .setAuthor(devUser ? {
                    name: `Kyoto Mini-Jeux - ${devUser.username}`,
                    iconURL: devUser.displayAvatarURL(),
                    url: `https://discord.com/users/685552160594723015`,
                } : {
                    name: 'Kyoto Mini-Jeux',
                })
                .setFooter({ 
                    text: devUser ? `By ${devUser.tag}` : 'By 0xRynal',
                    iconURL: devUser ? devUser.displayAvatarURL() : undefined
                })
                .setTimestamp();
            
            await message.reply({ 
                embeds: [helpEmbed],
                components: [row]
            });
        } catch (error) {
            console.error('Erreur lors de l\'affichage de l\'aide:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors de l\'affichage de l\'aide.')
                .setTimestamp();
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
