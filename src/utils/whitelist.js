const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const whitelistPath = path.join(__dirname, '..', 'data', 'whitelist.json');
const semiWhitelistPath = path.join(__dirname, '..', 'data', 'semiwhitelist.json');
const adminRolePath = path.join(__dirname, '..', 'data', 'adminrole.json');

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

// check if member has a role above or equal to highRankRoleId
function isHighRank(member) {
    const config = require('../config');
    if (!config.highRankRoleId) return false;
    
    const highRankRole = member.guild.roles.cache.get(config.highRankRoleId);
    if (!highRankRole) return false;
    
    // Check if member has the exact role
    if (member.roles.cache.has(config.highRankRoleId)) {
        return true;
    }
    
    // Check if member has any role with higher position
    const memberHighestRole = member.roles.highest;
    return memberHighestRole.position > highRankRole.position;
}

// ========== SEMI-WHITELIST FUNCTIONS ==========

// load semi-whitelist from file
function loadSemiWhitelist(guildId) {
    if (!fs.existsSync(semiWhitelistPath)) {
        return [];
    }
    try {
        const data = fs.readFileSync(semiWhitelistPath, 'utf8');
        const semiWhitelist = JSON.parse(data);
        return semiWhitelist[guildId] || [];
    } catch (error) {
        console.error('Erreur lors du chargement de la semi-whitelist:', error);
        return [];
    }
}

// save semi-whitelist to file
function saveSemiWhitelist(guildId, roles) {
    let allSemiWhitelists = {};
    if (fs.existsSync(semiWhitelistPath)) {
        try {
            const data = fs.readFileSync(semiWhitelistPath, 'utf8');
            allSemiWhitelists = JSON.parse(data);
        } catch (error) {
            console.error('Erreur lors de la lecture de la semi-whitelist:', error);
        }
    }
    allSemiWhitelists[guildId] = roles;
    fs.writeFileSync(semiWhitelistPath, JSON.stringify(allSemiWhitelists, null, 2), 'utf8');
}

// add role to semi-whitelist
function addSemiWhitelistRole(guildId, roleId) {
    const roles = loadSemiWhitelist(guildId);
    if (!roles.includes(roleId)) {
        roles.push(roleId);
        saveSemiWhitelist(guildId, roles);
        return true;
    }
    return false;
}

// remove role from semi-whitelist
function removeSemiWhitelistRole(guildId, roleId) {
    const roles = loadSemiWhitelist(guildId);
    const index = roles.indexOf(roleId);
    if (index > -1) {
        roles.splice(index, 1);
        saveSemiWhitelist(guildId, roles);
        return true;
    }
    return false;
}

// check if role is in semi-whitelist
function isRoleSemiWhitelisted(guildId, roleId) {
    const roles = loadSemiWhitelist(guildId);
    return roles.includes(roleId);
}

// check if member has semi-whitelisted role (for mute only)
function hasSemiWhitelistedRole(member) {
    const semiWhitelistedRoles = loadSemiWhitelist(member.guild.id);
    const memberRoles = member.roles.cache.map(role => role.id);
    return memberRoles.some(roleId => semiWhitelistedRoles.includes(roleId));
}

// ========== ADMIN ROLE FUNCTIONS ==========

// load admin role from file
function loadAdminRole(guildId) {
    if (!fs.existsSync(adminRolePath)) {
        return null;
    }
    try {
        const data = fs.readFileSync(adminRolePath, 'utf8');
        const adminRoles = JSON.parse(data);
        return adminRoles[guildId] || null;
    } catch (error) {
        console.error('Erreur lors du chargement du rôle admin:', error);
        return null;
    }
}

// save admin role to file
function saveAdminRole(guildId, roleId) {
    let allAdminRoles = {};
    if (fs.existsSync(adminRolePath)) {
        try {
            const data = fs.readFileSync(adminRolePath, 'utf8');
            allAdminRoles = JSON.parse(data);
        } catch (error) {
            console.error('Erreur lors de la lecture du rôle admin:', error);
        }
    }
    allAdminRoles[guildId] = roleId;
    fs.writeFileSync(adminRolePath, JSON.stringify(allAdminRoles, null, 2), 'utf8');
}

// check if member has admin role or role above it
function hasAdminRole(member) {
    const adminRoleId = loadAdminRole(member.guild.id);
    if (!adminRoleId) return false;
    
    const adminRole = member.guild.roles.cache.get(adminRoleId);
    if (!adminRole) return false;
    
    // Check if member has the exact role
    if (member.roles.cache.has(adminRoleId)) {
        return true;
    }
    
    // Check if member has any role with higher position
    const memberHighestRole = member.roles.highest;
    return memberHighestRole.position > adminRole.position;
}

module.exports = {
    addRole,
    removeRole,
    isRoleWhitelisted,
    hasWhitelistedRole,
    canSanction,
    loadWhitelist,
    hasFullPermissions,
    isHighRank,
    // Semi-whitelist exports
    loadSemiWhitelist,
    addSemiWhitelistRole,
    removeSemiWhitelistRole,
    isRoleSemiWhitelisted,
    hasSemiWhitelistedRole,
    // Admin role exports
    loadAdminRole,
    saveAdminRole,
    hasAdminRole,
};
