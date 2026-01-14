const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

function parseDuration(durationStr) {
    const regex = /^(\d+)([mh])$/;
    const match = durationStr.toLowerCase().match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    if (unit === 'm') {
        return value * 60 * 1000;
    } else if (unit === 'h') {
        return value * 60 * 60 * 1000;
    }
    
    return null;
}

function formatDuration(ms) {
    const minutes = Math.floor(ms / (60 * 1000));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h${minutes % 60 > 0 ? minutes % 60 + 'm' : ''}`;
    }
    return `${minutes}m`;
}

module.exports = {
    data: {
        name: 'mute',
    },
    async execute(message, args) {
        const { hasWhitelistedRole, hasFullPermissions, isHighRank } = require('../utils/whitelist');
        const { getRandomNoPermission, getRandomWrongChannel, getRandomSelfSanction, getRandomBotSanction, getRandomHierarchy, getRandomUserNotFound, getRandomInvalidDuration, getRandomBotPermission, getRandomRoleCreationError, getRandomInvalidUsage } = require('../utils/messages');
        
        // check full permissions first
        const hasFullPerms = hasFullPermissions(message.author.id);
        
        // check perm user
        const hasPermission = message.member.permissions.has([PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.Administrator]);
        const hasWhitelist = hasWhitelistedRole(message.member);
        const isHighRankMember = isHighRank(message.member) || hasFullPerms;
        const isStaff = hasPermission || hasWhitelist || hasFullPerms;
        
        if (!isStaff) {
            return message.reply(getRandomNoPermission('mute', false));
        }

        // check channel
        if (!isHighRankMember && message.channel.id !== config.punitionsChannelId) {
            return message.reply(getRandomWrongChannel('mute'));
        }

        // check args
        if (args.length < 2) {
            return message.reply(getRandomInvalidUsage('mute'));
        }

        // check if bot is mentioned
        const mentionedUser = message.mentions.users.first();
        if (mentionedUser && mentionedUser.id === message.client.user.id) {
            return message.reply(getRandomBotSanction('mute'));
        }
        
        // check if protected user is mentioned
        if (mentionedUser && mentionedUser.id === config.protectedUserId) {
            const protectionMessages = [
                '🙏 Je ne touche pas mon maître, je ne lui ferais aucun mal',
                '🙏 Wsh frr tu veux mute mon maître ? Jamais je ne lui ferais de mal',
                '🙏 Frr mon maître est intouchable, je ne le sanctionnerai jamais',
                '🙏 Je ne toucherai jamais mon maître, c\'est sacré',
                '🙏 Wsh t\'essaies de mute mon maître ? C\'est mort frr, je le protège',
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
            return message.reply(getRandomSelfSanction('mute'));
        }
        if (targetUser.id === message.client.user.id) {
            return message.reply(getRandomBotSanction('mute'));
        }
        
        // check protected user
        if (targetUser.id === config.protectedUserId) {
            const protectionMessages = [
                '🙏 Je ne touche pas mon maître, je ne lui ferais aucun mal',
                '🙏 Wsh frr tu veux mute mon maître ? Jamais je ne lui ferais de mal',
                '🙏 Frr mon maître est intouchable, je ne le sanctionnerai jamais',
                '🙏 Je ne toucherai jamais mon maître, c\'est sacré',
                '🙏 Wsh t\'essaies de mute mon maître ? C\'est mort frr, je le protège',
            ];
            return message.reply(protectionMessages[Math.floor(Math.random() * protectionMessages.length)]);
        }

        // check hierarchy (skip if full permissions)
        if (!hasFullPerms) {
            const { canSanction } = require('../utils/whitelist');
            if (!canSanction(message.member, targetUser)) {
                return message.reply(getRandomHierarchy('mute'));
            }
        }

        // parse duration
        const durationStr = args[1];
        const durationMs = parseDuration(durationStr);
        const reason = args.slice(2).join(' ') || 'Rien frr, juste comme ça';

        if (!durationMs) {
            return message.reply(getRandomInvalidDuration());
        }

        if (durationMs > config.maxMuteDuration) {
            return message.reply(`❌ La durée maximale est de 1 heure. Vous avez spécifié: ${formatDuration(durationMs)}`);
        }

        try {
            // check bot perm
            if (!message.guild.members.me.permissions.has([PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ModerateMembers])) {
                return message.reply(getRandomBotPermission());
            }

            // get or create mute role
            let muteRole = message.guild.roles.cache.find(role => role.name === config.muteRoleName);
            
            if (!muteRole) {
                try {
                    muteRole = await message.guild.roles.create({
                        name: config.muteRoleName,
                        color: '#808080',
                        reason: 'Rôle Muted créé automatiquement',
                    });

                    // setup role perms
                    const channels = message.guild.channels.cache;
                    for (const channel of channels.values()) {
                        try {
                            await channel.permissionOverwrites.edit(muteRole, {
                                SendMessages: false,
                                Speak: false,
                                AddReactions: false,
                            });
                        } catch (error) {
                        }
                    }
                } catch (error) {
                    return message.reply(getRandomRoleCreationError());
                }
            }

            // add role
            await targetUser.roles.add(muteRole);

            // auto remove after duration
            setTimeout(async () => {
                try {
                    if (targetUser.roles.cache.has(muteRole.id)) {
                        await targetUser.roles.remove(muteRole);
                    }
                } catch (error) {
                    console.error('Erreur lors de la suppression automatique du mute:', error);
                }
            }, durationMs);

            const formattedDuration = formatDuration(durationMs);
            await message.reply(`✅ ${targetUser} a été muté pendant ${formattedDuration}.`);

            // send log
            if (config.logChannelId) {
                const logChannel = message.guild.channels.cache.get(config.logChannelId);
                if (logChannel) {
                    try {
                        await logChannel.send({
                            embeds: [{
                                color: 0xFF9900,
                                title: '🔇 Mute',
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
            console.error('Erreur lors du mute:', error);
            const { getRandomError } = require('../utils/messages');
            message.reply(getRandomError());
        }
    },
};
