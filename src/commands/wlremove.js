const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
    data: {
        name: 'wlremove',
    },
    async execute(message, args) {
        const { getRandomNoPermission, getRandomWrongChannel, getRandomError, getRandomInvalidUsage, getRandomUserNotFound, getRandomNotWhitelisted } = require('../utils/messages');
        
        const { hasFullPermissions } = require('../utils/whitelist');
        
        // check full permissions first
        const hasFullPerms = hasFullPermissions(message.author.id);
        
        // check perm user
        const hasPermission = message.member.permissions.has([PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.Administrator]);
        if (!hasPermission && !hasFullPerms) {
            return message.reply(getRandomNoPermission('wlremove', false));
        }

        // check channel
        const isHighRank = message.member.roles.cache.has(config.highRankRoleId);
        if (!isHighRank && message.channel.id !== config.punitionsChannelId) {
            return message.reply(getRandomWrongChannel('wlremove'));
        }

        // check args
        if (args.length < 1) {
            return message.reply(getRandomInvalidUsage('wlremove'));
        }

        // get role
        const role = message.mentions.roles.first();
        
        if (!role) {
            return message.reply(getRandomUserNotFound());
        }

        try {
            const { removeRole, isRoleWhitelisted } = require('../utils/whitelist');
            
            // check if whitelisted
            if (!isRoleWhitelisted(message.guild.id, role.id)) {
                return message.reply(getRandomNotWhitelisted(role));
            }

            // remove from whitelist
            removeRole(message.guild.id, role.id);
            await message.reply(`✅ Le rôle ${role} a été retiré de la whitelist.`);
        } catch (error) {
            console.error('Erreur lors de la suppression du rôle de la whitelist:', error);
            message.reply(getRandomError());
        }
    },
};
