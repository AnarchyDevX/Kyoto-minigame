const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const whitelistPath = path.join(__dirname, '..', 'data', 'whitelist.json');

// create data dir if not exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// load whitelist from file
function loadWhitelist(guildId) {
    if (!fs.existsSync(whitelistPath)) {
        return [];
    }
    try {
        const data = fs.readFileSync(whitelistPath, 'utf8');
        const whitelist = JSON.parse(data);
        return whitelist[guildId] || [];
    } catch (error) {
        console.error('Erreur lors du chargement de la whitelist:', error);
        return [];
    }
}

// save whitelist to file
function saveWhitelist(guildId, roles) {
    let allWhitelists = {};
    if (fs.existsSync(whitelistPath)) {
        try {
            const data = fs.readFileSync(whitelistPath, 'utf8');
            allWhitelists = JSON.parse(data);
        } catch (error) {
            console.error('Erreur lors de la lecture de la whitelist:', error);
        }
    }
    allWhitelists[guildId] = roles;
    fs.writeFileSync(whitelistPath, JSON.stringify(allWhitelists, null, 2), 'utf8');
}

// add role to whitelist
function addRole(guildId, roleId) {
    const roles = loadWhitelist(guildId);
    if (!roles.includes(roleId)) {
        roles.push(roleId);
        saveWhitelist(guildId, roles);
        return true;
    }
    return false;
}

// remove role from whitelist
function removeRole(guildId, roleId) {
    const roles = loadWhitelist(guildId);
    const index = roles.indexOf(roleId);
    if (index > -1) {
        roles.splice(index, 1);
        saveWhitelist(guildId, roles);
        return true;
    }
    return false;
}

// check if role is whitelisted
function isRoleWhitelisted(guildId, roleId) {
    const roles = loadWhitelist(guildId);
    return roles.includes(roleId);
}

// check if member has whitelisted role
function hasWhitelistedRole(member) {
    const whitelistedRoles = loadWhitelist(member.guild.id);
    const memberRoles = member.roles.cache.map(role => role.id);
    return memberRoles.some(roleId => whitelistedRoles.includes(roleId));
}

// check if executor can sanction target
function canSanction(executor, target) {
    // check if executor has full permissions
    if (hasFullPermissions(executor.id)) {
        return true;
    }
    
    // check if executor is owner or admin (can always sanction)
    if (executor.id === executor.guild.ownerId || executor.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }
    
    // check if target has whitelisted role (protected from sanctions)
    const whitelistedRoles = loadWhitelist(target.guild.id);
    const targetRoles = target.roles.cache.map(role => role.id);
    const hasWhitelistedRole = targetRoles.some(roleId => whitelistedRoles.includes(roleId));
    
    if (hasWhitelistedRole) {
        return false;
    }
    
    // check role hierarchy
    const executorHighestPosition = executor.roles.highest.position;
    const targetHighestPosition = target.roles.highest.position;
    
    if (targetHighestPosition >= executorHighestPosition) {
        return false;
    }
    
    return true;
}

// check if user has full permissions (bypass all checks)
function hasFullPermissions(userId) {
    const config = require('../config');
    return config.fullPermissionUserIds && config.fullPermissionUserIds.includes(userId);
}

module.exports = {
    addRole,
    removeRole,
    isRoleWhitelisted,
    hasWhitelistedRole,
    canSanction,
    loadWhitelist,
    hasFullPermissions,
};
