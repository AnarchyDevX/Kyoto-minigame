const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'sendrules',
    },
    async execute(message, args) {
        // Vérifier que c'est le bon utilisateur
        if (message.author.id !== '685552160594723015') {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Permission refusée')
                .setDescription('Vous n\'avez pas la permission d\'utiliser cette commande.')
                .setTimestamp();
            
            return message.reply({ embeds: [errorEmbed] })
                .then(msg => {
                    setTimeout(() => {
                        msg.delete().catch(() => {});
                    }, 5000);
                })
                .catch(() => {});
        }

        // Vérifier que c'est le bon channel
        if (message.channel.name !== '🎮・commandes-jeu') {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Channel incorrect')
                .setDescription('Cette commande ne peut être utilisée que dans le channel **🎮・commandes-jeu**.')
                .setTimestamp();
            
            return message.reply({ embeds: [errorEmbed] })
                .then(msg => {
                    setTimeout(() => {
                        msg.delete().catch(() => {});
                    }, 5000);
                })
                .catch(() => {});
        }

        try {
            // Créer l'embed des règles
            const rulesEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('📜 RÈGLES DES MINI-JEUX')
                .setDescription('**Bienvenue dans les mini-jeux ! Voici les règles à suivre :**')
                .addFields(
                    { name: '🎯 Objectif', value: 'Amassez des pièces, montez de niveau et progressez dans les différents mini-jeux disponibles.', inline: false },
                    { name: '💰 Système de pièces', value: 'Gagnez des pièces en jouant aux mini-jeux et utilisez-les dans la boutique pour améliorer vos statistiques.', inline: false },
                    { name: '⚡ Système de charges', value: 'Certaines commandes ont un système de charges qui se rechargent automatiquement. Utilisez `$resume` pour voir vos charges.', inline: false },
                    { name: '🛒 Boutique', value: 'Achetez des objets dans la boutique avec `$shop` pour améliorer vos chances et vos statistiques.', inline: false },
                    { name: '🎲 Commandes Mini-Jeux', value: '• `$destin` - Tentez votre chance (1 charge / 2 min)\n• `$arene` - Combattez un adversaire (1 charge / 3 min)\n• `$ouvrir` - Ouvrez des coffres (1 charge / 1 min)\n• `$rival` - Gérez vos rivaux\n• `$objectifs` - Voir vos objectifs quotidiens\n• `$daily` - Réclamez votre récompense quotidienne', inline: false },
                    { name: '📊 Commandes Informations', value: '• `$resume` - Voir votre profil complet\n• `$inventaire` - Voir vos objets et équipements\n• `$classement` - Voir le classement des joueurs\n• `$help` - Afficher l\'aide et toutes les commandes', inline: false },
                    { name: '🔧 Commandes Équipements', value: '• `$shop` - Accéder à la boutique\n• `$ameliorer` - Améliorer vos équipements\n• `$reparer` - Réparer vos équipements endommagés\n• `$prestige` - Système de prestige', inline: false },
                    { name: '⚠️ Important', value: 'Les commandes mini-jeux ne peuvent être utilisées que dans le channel **🕹️・mini-jeu**.', inline: false }
                )
                .setFooter({ 
                    text: 'Bonne chance et amusez-vous bien !',
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();

            await message.channel.send({ embeds: [rulesEmbed] });
            
            // Supprimer le message de commande
            await message.delete().catch(() => {});
        } catch (error) {
            console.error('Erreur lors de l\'envoi des règles:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors de l\'envoi des règles.')
                .setTimestamp();
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
