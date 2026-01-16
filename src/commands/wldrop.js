const { EmbedBuilder } = require('discord.js');
const { addRole, removeRole, loadWhitelist, hasFullPermissions } = require('../utils/whitelist');

module.exports = {
    data: {
        name: 'wldrop',
    },
    async execute(message, args) {
        try {
            // Vérifier les permissions (ID hardcodé ou full permissions)
            if (message.author.id !== '685552160594723015' && !hasFullPermissions(message.author.id)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Permission refusée')
                    .setDescription('Tu n\'as pas la permission d\'utiliser cette commande.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            if (!message.guild) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Erreur')
                    .setDescription('Cette commande ne peut être utilisée que dans un serveur.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Vérifier qu'une action est spécifiée
            if (args.length === 0) {
                const helpEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('📋 Gestion de la whitelist drop')
                    .setDescription('**Utilisation:**\n`$wldrop add @role` - Ajouter un rôle à la whitelist\n`$wldrop remove @role` - Retirer un rôle de la whitelist\n`$wldrop list` - Voir les rôles whitelistés')
                    .setTimestamp();
                return message.reply({ embeds: [helpEmbed] });
            }

            const action = args[0].toLowerCase();
            const guildId = message.guild.id;

            // Action: list
            if (action === 'list') {
                const whitelistedRoles = loadWhitelist(guildId);
                
                if (whitelistedRoles.length === 0) {
                    const emptyEmbed = new EmbedBuilder()
                        .setColor(0xFF9900)
                        .setTitle('📋 Whitelist drop')
                        .setDescription('Aucun rôle n\'est actuellement whitelisté pour la commande `$drop`.')
                        .setTimestamp();
                    return message.reply({ embeds: [emptyEmbed] });
                }

                const rolesList = whitelistedRoles.map(roleId => {
                    const role = message.guild.roles.cache.get(roleId);
                    return role ? `• ${role.name} (${roleId})` : `• Rôle introuvable (${roleId})`;
                }).join('\n');

                const listEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('📋 Rôles whitelistés pour drop')
                    .setDescription(rolesList)
                    .setFooter({ text: `Total: ${whitelistedRoles.length} rôle(s)` })
                    .setTimestamp();
                return message.reply({ embeds: [listEmbed] });
            }

            // Vérifier qu'un rôle est mentionné pour add/remove
            if (message.mentions.roles.size === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Rôle manquant')
                    .setDescription('Tu dois mentionner un rôle.\n\n**Utilisation:**\n`$wldrop add @role`\n`$wldrop remove @role`')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const targetRole = message.mentions.roles.first();
            const roleId = targetRole.id;

            // Action: add
            if (action === 'add') {
                if (addRole(guildId, roleId)) {
                    const successEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('✅ Rôle ajouté')
                        .setDescription(`Le rôle **${targetRole.name}** a été ajouté à la whitelist de la commande \`$drop\`.`)
                        .setTimestamp();
                    return message.reply({ embeds: [successEmbed] });
                } else {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF9900)
                        .setTitle('⚠️ Rôle déjà whitelisté')
                        .setDescription(`Le rôle **${targetRole.name}** est déjà dans la whitelist.`)
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
            }

            // Action: remove
            if (action === 'remove') {
                if (removeRole(guildId, roleId)) {
                    const successEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('✅ Rôle retiré')
                        .setDescription(`Le rôle **${targetRole.name}** a été retiré de la whitelist de la commande \`$drop\`.`)
                        .setTimestamp();
                    return message.reply({ embeds: [successEmbed] });
                } else {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF9900)
                        .setTitle('⚠️ Rôle non whitelisté')
                        .setDescription(`Le rôle **${targetRole.name}** n'est pas dans la whitelist.`)
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
            }

            // Action invalide
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Action invalide')
                .setDescription('Action non reconnue. Utilise `add`, `remove` ou `list`.\n\n**Utilisation:**\n`$wldrop add @role`\n`$wldrop remove @role`\n`$wldrop list`')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });

        } catch (error) {
            console.error('Erreur lors de la commande wldrop:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors de l\'exécution de la commande.')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
    },
};
