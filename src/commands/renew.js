const { PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../config');

module.exports = {
    data: {
        name: 'renew',
    },
    async execute(message, args) {
        const { getRandomNoPermission, getRandomError } = require('../utils/messages');
        const { hasFullPermissions, isHighRank } = require('../utils/whitelist');
        
        // check full permissions first
        const hasFullPerms = hasFullPermissions(message.author.id);
        
        // check perm user
        const hasPermission = message.member.permissions.has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Administrator]);
        const isHighRankMember = isHighRank(message.member) || hasFullPerms;
        
        if (!hasPermission && !hasFullPerms && !isHighRankMember) {
            return message.reply('❌ Tu n\'as pas les permissions pour renouveler ce channel.');
        }

        // check if channel is deletable
        if (!message.channel.deletable) {
            return message.reply('❌ Je ne peux pas supprimer ce channel, vérifie mes permissions.');
        }

        try {
            const channel = message.channel;
            const channelName = channel.name;
            const channelType = channel.type;
            const parentId = channel.parentId;
            const position = channel.position;
            
            // Get channel permissions
            const permissionOverwrites = channel.permissionOverwrites.cache.map(overwrite => ({
                id: overwrite.id,
                type: overwrite.type,
                allow: overwrite.allow,
                deny: overwrite.deny,
            }));

            // Get channel topic if text channel
            const topic = channelType === ChannelType.GuildText ? channel.topic : null;
            
            // Get rate limit if text channel
            const rateLimitPerUser = channelType === ChannelType.GuildText ? channel.rateLimitPerUser : null;

            // Delete the channel
            await channel.delete('Renew command');

            // Wait a bit for Discord to process the deletion
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Create new channel with same properties
            const channelOptions = {
                name: channelName,
                type: channelType,
                parent: parentId,
                position: position,
                permissionOverwrites: permissionOverwrites,
            };

            if (topic) channelOptions.topic = topic;
            if (rateLimitPerUser !== null) channelOptions.rateLimitPerUser = rateLimitPerUser;

            const newChannel = await message.guild.channels.create(channelOptions);

            await newChannel.send(`✅ Channel renouvelé par ${message.author}`);
        } catch (error) {
            console.error('Erreur lors du renouvellement du channel:', error);
            message.reply(getRandomError());
        }
    },
};
