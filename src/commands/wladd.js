const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
    data: {
        name: 'wladd',
    },
    async execute(message, args) {
        const { getRandomNoPermission, getRandomWrongChannel, getRandomError, getRandomInvalidUsage, getRandomUserNotFound, getRandomAlreadyWhitelisted } = require('../utils/messages');
        
        const { hasFullPermissions } = require('../utils/whitelist');
        
        // check full permissions first
        const hasFullPerms = hasFullPermissions(message.author.id);
        
        // check perm user
        const hasPermission = message.member.permissions.has([PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.Administrator]);
        if (!hasPermission && !hasFullPerms) {
            return message.reply(getRandomNoPermission('wladd', false));
        }

        // check channel
        const isHighRank = message.member.roles.cache.has(config.highRankRoleId);
        if (!isHighRank && message.channel.id !== config.punitionsChannelId) {
            return message.reply(getRandomWrongChannel('wladd'));
        }

        // check args
        if (args.length < 1) {
            return message.reply(getRandomInvalidUsage('wladd'));
        }

        // get role
        const role = message.mentions.roles.first();
        
        if (!role) {
            return message.reply(getRandomUserNotFound());
        }

        try {
            const { addRole, isRoleWhitelisted } = require('../utils/whitelist');
            
            // check if already whitelisted
            if (isRoleWhitelisted(message.guild.id, role.id)) {
                return message.reply(getRandomAlreadyWhitelisted(role));
            }

            // add to whitelist
            addRole(message.guild.id, role.id);
            await message.reply(`✅ Le rôle ${role} a été ajouté à la whitelist.`);
        } catch (error) {
            console.error('Erreur lors de l\'ajout du rôle à la whitelist:', error);
            message.reply(getRandomError());
        }
    },
};
