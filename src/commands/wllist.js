const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
    data: {
        name: 'wllist',
    },
    async execute(message, args) {
        const { getRandomNoPermission, getRandomWrongChannel, getRandomError } = require('../utils/messages');
        
        const { hasFullPermissions } = require('../utils/whitelist');
        
        // check full permissions first
        const hasFullPerms = hasFullPermissions(message.author.id);
        
        // check perm user
        const hasPermission = message.member.permissions.has([PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.Administrator]);
        if (!hasPermission && !hasFullPerms) {
            return message.reply(getRandomNoPermission('wllist', false));
        }

        // check channel
        const isHighRank = message.member.roles.cache.has(config.highRankRoleId);
        if (!isHighRank && message.channel.id !== config.punitionsChannelId) {
            return message.reply(getRandomWrongChannel('wllist'));
        }

        try {
            // load whitelist
            const { loadWhitelist } = require('../utils/whitelist');
            const whitelistedRoleIds = loadWhitelist(message.guild.id);

            if (whitelistedRoleIds.length === 0) {
                return message.reply('📋 La whitelist est vide.');
            }

            // format roles
            const roles = whitelistedRoleIds
                .map(roleId => {
                    const role = message.guild.roles.cache.get(roleId);
                    return role ? role.toString() : `ID: ${roleId} (rôle introuvable)`;
                })
                .join('\n');

            await message.reply({
                embeds: [{
                    color: 0x00FF00,
                    title: '📋 Rôles dans la whitelist',
                    description: roles || 'Aucun rôle',
                    timestamp: new Date().toISOString(),
                }],
            });
        } catch (error) {
            console.error('Erreur lors de l\'affichage de la whitelist:', error);
            message.reply(getRandomError());
        }
    },
};
