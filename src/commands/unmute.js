const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
    data: {
        name: 'unmute',
    },
    async execute(message, args) {
        const { hasWhitelistedRole } = require('../utils/whitelist');
        const { getRandomNoPermission, getRandomWrongChannel, getRandomError, getRandomUserNotFound, getRandomBotPermission, getRandomRoleNotFound, getRandomNotMuted, getRandomInvalidUsage } = require('../utils/messages');
        
        const { hasFullPermissions } = require('../utils/whitelist');
        
        // check full permissions first
        const hasFullPerms = hasFullPermissions(message.author.id);
        
        // check perm user
        const hasPermission = message.member.permissions.has([PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.Administrator]);
        const hasWhitelist = hasWhitelistedRole(message.member);
        const isHighRank = message.member.roles.cache.has(config.highRankRoleId) || hasFullPerms;
        const isStaff = hasPermission || hasWhitelist || hasFullPerms;
        
        if (!isStaff) {
            return message.reply(getRandomNoPermission('unmute', false));
        }

        // check channel
        if (!isHighRank && message.channel.id !== config.punitionsChannelId) {
            return message.reply(getRandomWrongChannel('unmute'));
        }

        // check args
        if (args.length < 1) {
            return message.reply(getRandomInvalidUsage('unmute'));
        }

        // get user
        const targetUser = message.mentions.members.first();
        
        if (!targetUser) {
            return message.reply(getRandomUserNotFound());
        }

        try {
            // check bot perm
            if (!message.guild.members.me.permissions.has([PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ModerateMembers])) {
                return message.reply(getRandomBotPermission());
            }

            // get mute role
            const muteRole = message.guild.roles.cache.find(role => role.name === config.muteRoleName);
            
            if (!muteRole) {
                return message.reply(getRandomRoleNotFound());
            }

            // check if muted
            if (!targetUser.roles.cache.has(muteRole.id)) {
                return message.reply(getRandomNotMuted(targetUser));
            }

            // remove role
            await targetUser.roles.remove(muteRole);

            await message.reply(`✅ ${targetUser} a été unmute.`);

            // send log
            if (config.logChannelId) {
                const logChannel = message.guild.channels.cache.get(config.logChannelId);
                if (logChannel) {
                    try {
                        await logChannel.send({
                            embeds: [{
                                color: 0x00FF00,
                                title: '🔓 Unmute',
                                fields: [
                                    { name: 'Utilisateur', value: `${targetUser} (${targetUser.user.tag})`, inline: true },
                                    { name: 'Par', value: `${message.author} (${message.author.tag})`, inline: true },
                                ],
                                timestamp: new Date().toISOString(),
                            }],
                        });
                    } catch (error) {
                        console.error('Erreur lors de l\'envoi du log:', error);
                    }
                }
            }

        } catch (error) {
            console.error('Erreur lors de l\'unmute:', error);
            message.reply(getRandomError());
        }
    },
};
