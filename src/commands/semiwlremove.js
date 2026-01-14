const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
    data: {
        name: 'semiwlremove',
    },
    async execute(message, args) {
        const { getRandomNoPermission, getRandomWrongChannel, getRandomError, getRandomInvalidUsage, getRandomUserNotFound } = require('../utils/messages');
        
        const { hasFullPermissions, isHighRank } = require('../utils/whitelist');
        
        // check full permissions first
        const hasFullPerms = hasFullPermissions(message.author.id);
        
        // check perm user
        const hasPermission = message.member.permissions.has([PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.Administrator]);
        if (!hasPermission && !hasFullPerms) {
            return message.reply(getRandomNoPermission('wlremove', false));
        }

        // check channel
        const isHighRankMember = isHighRank(message.member);
        if (!isHighRankMember && message.channel.id !== config.punitionsChannelId) {
            return message.reply(getRandomWrongChannel('wlremove'));
        }

        // check args
        if (args.length < 1) {
            return message.reply('❌ Utilisation: `&semiwlremove @role`\nExemple: `&semiwlremove @Modérateur`');
        }

        // get role
        const role = message.mentions.roles.first();
        
        if (!role) {
            return message.reply(getRandomUserNotFound());
        }

        try {
            const { removeSemiWhitelistRole, isRoleSemiWhitelisted } = require('../utils/whitelist');
            
            // check if not semi-whitelisted
            if (!isRoleSemiWhitelisted(message.guild.id, role.id)) {
                return message.reply(`🤦‍♂️ Wsh frr le rôle ${role} n'est même pas dans la semi-whitelist, réfléchis 2 sec`);
            }

            // remove from semi-whitelist
            removeSemiWhitelistRole(message.guild.id, role.id);
            await message.reply(`✅ Le rôle ${role} a été retiré de la semi-whitelist.`);
        } catch (error) {
            console.error('Erreur lors du retrait du rôle de la semi-whitelist:', error);
            message.reply(getRandomError());
        }
    },
};
