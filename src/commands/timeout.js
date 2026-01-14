const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

function parseDuration(durationStr) {
    const regex = /^(\d+)m$/;
    const match = durationStr.toLowerCase().match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    return value * 60 * 1000;
}

function formatDuration(ms) {
    const minutes = Math.floor(ms / (60 * 1000));
    return `${minutes}m`;
}

module.exports = {
    data: {
        name: 'timeout',
    },
    async execute(message, args) {
        const { hasWhitelistedRole, hasFullPermissions, isHighRank } = require('../utils/whitelist');
        const { getRandomNoPermission, getRandomWrongChannel, getRandomSelfSanction, getRandomBotSanction, getRandomHierarchy, getRandomUserNotFound, getRandomInvalidDuration, getRandomBotPermission, getRandomInvalidUsage } = require('../utils/messages');
        
        // check full permissions first
        const hasFullPerms = hasFullPermissions(message.author.id);
        
        // check perm user
        const hasPermission = message.member.permissions.has([PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.Administrator]);
        const hasWhitelist = hasWhitelistedRole(message.member);
        const isHighRankMember = isHighRank(message.member) || hasFullPerms;
        const isStaff = hasPermission || hasWhitelist || hasFullPerms;
        
        if (!isStaff) {
            return message.reply(getRandomNoPermission('timeout', false));
        }

        // check channel
        if (!isHighRankMember && message.channel.id !== config.punitionsChannelId) {
            return message.reply(getRandomWrongChannel('timeout'));
        }

        // check args
        if (args.length < 2) {
            return message.reply(getRandomInvalidUsage('timeout'));
        }

        // check if bot is mentioned
        const mentionedUser = message.mentions.users.first();
        if (mentionedUser && mentionedUser.id === message.client.user.id) {
            return message.reply(getRandomBotSanction('timeout'));
        }
        
        // check if protected user is mentioned
        if (mentionedUser && mentionedUser.id === config.protectedUserId) {
            const protectionMessages = [
                '🙏 Je ne touche pas mon maître, je ne lui ferais aucun mal',
                '🙏 Wsh frr tu veux timeout mon maître ? Jamais je ne lui ferais de mal',
                '🙏 Frr mon maître est intouchable, je ne le sanctionnerai jamais',
                '🙏 Je ne toucherai jamais mon maître, c\'est sacré',
                '🙏 Wsh t\'essaies de timeout mon maître ? C\'est mort frr, je le protège',
            ];
            return message.reply(protectionMessages[Math.floor(Math.random() * protectionMessages.length)]);
        }

        // get user
        const targetUser = message.mentions.members.first();
        
        if (!targetUser) {
            return message.reply(getRandomUserNotFound());
        }

        // check self sanction
        if (targetUser.id === message.author.id) {
            return message.reply(getRandomSelfSanction('timeout'));
        }
        if (targetUser.id === message.client.user.id) {
            return message.reply(getRandomBotSanction('timeout'));
        }
        
        // check protected user
        if (targetUser.id === config.protectedUserId) {
            const protectionMessages = [
                '🙏 Je ne touche pas mon maître, je ne lui ferais aucun mal',
                '🙏 Wsh frr tu veux timeout mon maître ? Jamais je ne lui ferais de mal',
                '🙏 Frr mon maître est intouchable, je ne le sanctionnerai jamais',
                '🙏 Je ne toucherai jamais mon maître, c\'est sacré',
                '🙏 Wsh t\'essaies de timeout mon maître ? C\'est mort frr, je le protège',
            ];
            return message.reply(protectionMessages[Math.floor(Math.random() * protectionMessages.length)]);
        }

        // check hierarchy (skip if full permissions)
        if (!hasFullPerms) {
            const { canSanction } = require('../utils/whitelist');
            if (!canSanction(message.member, targetUser)) {
                return message.reply(getRandomHierarchy('timeout'));
            }
        }

        // parse duration
        const durationStr = args[1];
        const durationMs = parseDuration(durationStr);
        const reason = args.slice(2).join(' ') || 'Rien frr, juste comme ça';

        if (!durationMs) {
            return message.reply(getRandomInvalidDuration());
        }

        if (durationMs > config.maxTimeoutDuration) {
            return message.reply(`❌ La durée maximale est de 10 minutes. Vous avez spécifié: ${formatDuration(durationMs)}`);
        }

        try {
            // check bot perm
            if (!message.guild.members.me.permissions.has([PermissionFlagsBits.ModerateMembers])) {
                return message.reply(getRandomBotPermission());
            }

            if (!hasFullPerms && targetUser.roles.highest.position >= message.guild.members.me.roles.highest.position) {
                return message.reply(getRandomHierarchy('timeout'));
            }

            // apply timeout
            await targetUser.timeout(durationMs, reason);

            const formattedDuration = formatDuration(durationMs);
            await message.reply(`✅ ${targetUser} a été timeout pendant ${formattedDuration}.`);

            // send log
            if (config.logChannelId) {
                const logChannel = message.guild.channels.cache.get(config.logChannelId);
                if (logChannel) {
                    try {
                        await logChannel.send({
                            embeds: [{
                                color: 0xFF6B6B,
                                title: '⏱️ Timeout',
                                fields: [
                                    { name: 'Utilisateur', value: `${targetUser} (${targetUser.user.tag})`, inline: true },
                                    { name: 'Par', value: `${message.author} (${message.author.tag})`, inline: true },
                                    { name: 'Durée', value: formattedDuration, inline: true },
                                    { name: 'Raison', value: reason, inline: false },
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
            console.error('Erreur lors du timeout:', error);
            const { getRandomError } = require('../utils/messages');
            message.reply(getRandomError());
        }
    },
};
