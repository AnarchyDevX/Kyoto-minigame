const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
    data: {
        name: 'semiwladd',
    },
    async execute(message, args) {
        const { getRandomNoPermission, getRandomWrongChannel, getRandomError, getRandomInvalidUsage, getRandomUserNotFound, getRandomAlreadyWhitelisted } = require('../utils/messages');
        
        const { hasFullPermissions, isHighRank } = require('../utils/whitelist');
        
        // check full permissions first
        const hasFullPerms = hasFullPermissions(message.author.id);
        
        // check perm user
        const hasPermission = message.member.permissions.has([PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.Administrator]);
        if (!hasPermission && !hasFullPerms) {
            return message.reply(getRandomNoPermission('wladd', false));
        }

        // check channel
        const isHighRankMember = isHighRank(message.member);
        if (!isHighRankMember && message.channel.id !== config.punitionsChannelId) {
            return message.reply(getRandomWrongChannel('wladd'));
        }

        // check args
        if (args.length < 1) {
            return message.reply('❌ Utilisation: `&semiwladd @role`\nExemple: `&semiwladd @Modérateur`');
        }

        // get role
        const role = message.mentions.roles.first();
        
        if (!role) {
            return message.reply(getRandomUserNotFound());
        }

        try {
            const { addSemiWhitelistRole, isRoleSemiWhitelisted } = require('../utils/whitelist');
            
            // check if already semi-whitelisted
            if (isRoleSemiWhitelisted(message.guild.id, role.id)) {
                return message.reply(`🤦‍♂️ Wsh frr le rôle ${role} est déjà dans la semi-whitelist, réfléchis 2 sec`);
            }

            // add to semi-whitelist
            addSemiWhitelistRole(message.guild.id, role.id);
            await message.reply(`✅ Le rôle ${role} a été ajouté à la semi-whitelist (mute uniquement).`);
        } catch (error) {
            console.error('Erreur lors de l\'ajout du rôle à la semi-whitelist:', error);
            message.reply(getRandomError());
        }
    },
};
