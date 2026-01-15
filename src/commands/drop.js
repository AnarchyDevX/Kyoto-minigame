const { EmbedBuilder } = require('discord.js');
const { getUser, addKey, updateUser } = require('../utils/game');

module.exports = {
    data: {
        name: 'drop',
    },
    async execute(message, args) {
        try {
            // Vérifier que seul l'ID spécifié peut exécuter la commande
            if (message.author.id !== '685552160594723015') {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Permission refusée')
                    .setDescription('Tu n\'as pas la permission d\'exécuter cette commande.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Vérifier qu'un utilisateur est mentionné
            if (message.mentions.users.size === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Utilisateur manquant')
                    .setDescription('Tu dois mentionner un utilisateur.\n\n**Utilisation:** `$drop @user coffre_xxx`')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Vérifier qu'un type de coffre est spécifié
            if (args.length < 1) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Type de coffre manquant')
                    .setDescription('Tu dois spécifier un type de coffre.\n\n**Utilisation:** `$drop @user coffre_xxx`\n**Types disponibles:** `coffre_bois`, `coffre_argent`, `coffre_or` (ou `coffre_doré`), `coffre_demoniaque`')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const targetUser = message.mentions.users.first();
            
            // Filtrer les mentions pour exclure les bots
            if (targetUser.bot) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Utilisateur invalide')
                    .setDescription('Tu ne peux pas donner un coffre à un bot.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Parser le type de coffre
            let coffreType = args.find(arg => arg.startsWith('coffre_'));
            if (!coffreType) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Type de coffre invalide')
                    .setDescription('Type de coffre non reconnu.\n\n**Types disponibles:** `coffre_bois`, `coffre_argent`, `coffre_or` (ou `coffre_doré`), `coffre_demoniaque`')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            coffreType = coffreType.replace('coffre_', '');
            // Support both "or" and "doré" for golden chest
            if (coffreType === 'doré' || coffreType === 'dore') {
                coffreType = 'or';
            }
            const validTypes = ['bois', 'argent', 'or', 'demoniaque'];

            if (!validTypes.includes(coffreType)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Type de coffre invalide')
                    .setDescription(`Type de coffre **${coffreType}** non valide.\n\n**Types disponibles:** \`coffre_bois\`, \`coffre_argent\`, \`coffre_or\` (ou \`coffre_doré\`), \`coffre_demoniaque\``)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Récupérer les données de l'utilisateur cible
            const targetUserId = targetUser.id;

            // Ajouter la clé à l'utilisateur (addKey fait déjà l'updateUser en interne)
            addKey(targetUserId, coffreType);
            
            // Récupérer les données à jour après l'ajout de la clé
            const targetUserData = getUser(targetUserId);

            // Afficher le nom du coffre formaté
            const coffreNames = {
                bois: 'Coffre de Bois',
                argent: 'Coffre d\'Argent',
                or: 'Coffre d\'Or',
                demoniaque: 'Coffre Démoniaque',
            };

            // Créer l'embed de succès
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Coffre donné !')
                .setDescription(`**${coffreNames[coffreType]}** donné à **${targetUser.username}** !`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    {
                        name: '👤 Receveur',
                        value: `${targetUser.username}`,
                        inline: true,
                    },
                    {
                        name: '🎁 Type de coffre',
                        value: coffreNames[coffreType],
                        inline: true,
                    },
                    {
                        name: '🗝️ Clés actuelles',
                        value: `**Bois:** ${targetUserData.keys.bois}\n**Argent:** ${targetUserData.keys.argent}\n**Or:** ${targetUserData.keys.or}\n**Démoniaque:** ${targetUserData.keys.demoniaque}`,
                        inline: false,
                    }
                )
                .setFooter({ 
                    text: message.author.username,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();

            return message.reply({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Erreur lors de la commande drop:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors de l\'exécution de la commande.')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
    },
};
