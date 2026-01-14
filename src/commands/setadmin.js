const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
    data: {
        name: 'setadmin',
    },
    async execute(message, args) {
        const { getRandomNoPermission, getRandomError, getRandomInvalidUsage, getRandomUserNotFound } = require('../utils/messages');
        
        const { hasFullPermissions } = require('../utils/whitelist');
        
        // check full permissions first
        const hasFullPerms = hasFullPermissions(message.author.id);
        
        // check perm user (only owner or full permissions can set admin role)
        const isOwner = message.author.id === message.guild.ownerId;
        const hasPermission = message.member.permissions.has(PermissionFlagsBits.Administrator);
        
        if (!isOwner && !hasPermission && !hasFullPerms) {
            return message.reply(getRandomNoPermission('wladd', false));
        }

        // check args
        if (args.length < 1) {
            return message.reply('❌ Utilisation: `&setadmin @role`\nExemple: `&setadmin @Admin`');
        }

        // get role
        const role = message.mentions.roles.first();
        
        if (!role) {
            return message.reply(getRandomUserNotFound());
        }

        try {
            const { saveAdminRole, loadAdminRole } = require('../utils/whitelist');
            
            // get current admin role
            const currentAdminRoleId = loadAdminRole(message.guild.id);
            const currentAdminRole = currentAdminRoleId ? message.guild.roles.cache.get(currentAdminRoleId) : null;
            
            // save new admin role
            saveAdminRole(message.guild.id, role.id);
            
            let response = `✅ Le rôle ${role} a été défini comme rôle admin pour gérer les whitelists.`;
            if (currentAdminRole) {
                response += `\n(Ancien rôle admin: ${currentAdminRole})`;
            }
            
            await message.reply(response);
        } catch (error) {
            console.error('Erreur lors de la définition du rôle admin:', error);
            message.reply(getRandomError());
        }
    },
};
