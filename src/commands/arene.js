const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'arene',
    },
        async execute(message, args) {
            const { getUser, getAllUsers, addCoins, addKey, updateUser, getCharges, useCharge, addXP, updateChallengeProgress, reduceItemDurability } = require('../utils/game');
            
            try {
                const userId = message.author.id;
                const user = getUser(userId);
                const now = Date.now();
                
                // Check charges
                const charges = getCharges(userId, 'arene');
                if (charges.current <= 0) {
                    const nextRecharge = charges.nextRecharge;
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('⏳ Plus de charges')
                        .setDescription(`Tu n'as plus de charges pour $arene.\n\n**Recharge dans:** ${nextRecharge}s\n💡 Tu as ${charges.max} charges max (1 charge toutes les 3 minutes)`)
                        .setFooter({ 
                            text: `Charges: 0/${charges.max}`,
                            iconURL: message.author.displayAvatarURL()
                        })
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
                
                const chargeResult = useCharge(userId, 'arene');
                if (!chargeResult.success) {
                    return; // Safety check
                }
            
            let opponentId = null;
            let opponent = null;
            let opponentUser = null;
            let opponentName = '';
            let isFriend = false;
            let challengeBet = 0;
            
            // Check if user mentioned someone to fight
            if (args.length > 0 && message.mentions.members.size > 0) {
                const targetMember = message.mentions.members.first();
                
                if (targetMember.id === userId) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Erreur')
                        .setDescription('Tu ne peux pas te combattre toi-même !')
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
                
                if (targetMember.user.bot) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Erreur')
                        .setDescription('Tu ne peux pas combattre un bot !')
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
                
                // Check if target is on the server (member exists)
                if (!targetMember || !message.guild.members.cache.has(targetMember.id)) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Utilisateur introuvable')
                        .setDescription(`${targetMember.user.username} n'est pas sur ce serveur.`)
                        .setThumbnail(targetMember.user.displayAvatarURL())
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
                
                // Check if they are friends (we'll consider members on the same server as potential friends)
                // Discord.js doesn't have direct friend API, so we check mutual servers
                try {
                    const mutualGuilds = message.client.guilds.cache.filter(guild => 
                        guild.members.cache.has(userId) && guild.members.cache.has(targetMember.id)
                    );
                    
                    opponentId = targetMember.id;
                    opponentUser = targetMember.user;
                    opponentName = opponentUser.username;
                    isFriend = true; // Consider them as "friend" if they're on the same server
                } catch (e) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Erreur')
                        .setDescription('Impossible de récupérer les informations de l\'utilisateur.')
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
            } else {
                // Get all users for opponent selection (including fake users)
                const allUsers = getAllUsers();
                let opponentIds = Object.keys(allUsers).filter(id => id !== userId);
                
                // If no users in database, try to get random member from server
                if (opponentIds.length === 0) {
                    // Get random member from server (excluding bots and self)
                    const members = message.guild.members.cache
                        .filter(m => !m.user.bot && m.id !== userId && m.user.id !== message.client.user.id)
                        .map(m => m.user.id);
                    
                    if (members.length === 0) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('❌ Aucun adversaire')
                            .setDescription('Aucun adversaire disponible sur le serveur.')
                            .setTimestamp();
                        return message.reply({ embeds: [errorEmbed] });
                    }
                    
                    const randomMemberId = members[Math.floor(Math.random() * members.length)];
                    opponentIds = [randomMemberId];
                }

                // Select random opponent
                opponentId = opponentIds[Math.floor(Math.random() * opponentIds.length)];
            }
            
            // Get opponent data
            opponent = getUser(opponentId);
            
            // Check for pending rival challenge (both directions)
            if (isFriend && opponentId) {
                // Check if opponent has a challenge for user
                const opponentData = getUser(opponentId);
                if (opponentData.rivalries?.challenges) {
                    const pendingChallenge = opponentData.rivalries.challenges.find(
                        c => c.toUserId === userId && c.status === 'pending'
                    );
                    if (pendingChallenge) {
                        // Verify user has enough coins
                        if (user.coins >= pendingChallenge.coins) {
                            challengeBet = pendingChallenge.coins;
                            // Remove challenge as it will be accepted
                            opponentData.rivalries.challenges = opponentData.rivalries.challenges.filter(
                                c => !(c.toUserId === userId && c.createdAt === pendingChallenge.createdAt)
                            );
                            updateUser(opponentId, opponentData);
                        }
                    }
                }
                
                // Also check if user has a challenge for opponent
                if (challengeBet === 0 && user.rivalries?.challenges) {
                    const userChallenge = user.rivalries.challenges.find(
                        c => c.toUserId === opponentId && c.status === 'pending'
                    );
                    if (userChallenge) {
                        // Verify opponent has enough coins
                        if (opponent.coins >= userChallenge.coins) {
                            challengeBet = userChallenge.coins;
                            // Remove challenge as it will be accepted
                            user.rivalries.challenges = user.rivalries.challenges.filter(
                                c => !(c.toUserId === opponentId && c.createdAt === userChallenge.createdAt)
                            );
                            updateUser(userId, user);
                        }
                    }
                }
            }
            
            // Check if it's a fake user
            if (opponentId.startsWith('999999999999999')) {
                opponentName = opponent.username || `Joueur_${opponentId.slice(-3)}`;
            } else {
                if (!opponentUser) {
                    opponentUser = await message.client.users.fetch(opponentId).catch(() => null);
                }
                opponentName = opponentUser ? opponentUser.username : 'Adversaire Inconnu';
                
                // If user doesn't exist in database, initialize them
                if (!opponent.stats) {
                    opponent = getUser(opponentId);
                }
            }

            // Calculate base stats
            const userStats = calculateStats(user);
            const opponentStats = calculateStats(opponent);

            // Send combat start embed
            const challengeText = challengeBet > 0 ? `\n\n🏆 **DÉFI ACCEPTÉ : ${challengeBet.toLocaleString()}💰**` : '';
            const startEmbed = new EmbedBuilder()
                .setColor(isFriend ? 0x00BFFF : 0xFF0000)
                .setTitle(isFriend ? '⚔️ COMBAT AMICAL' : '⚔️ COMBAT D\'ARÈNE')
                .setDescription(`**${message.author.username}** VS **${opponentName}**${isFriend ? ' 👥' : ''}${challengeText}\n\n🎲 Le combat commence...`)
                .setThumbnail(message.author.displayAvatarURL())
                .setImage(opponentUser ? opponentUser.displayAvatarURL() : null)
                .addFields(
                    {
                        name: `👤 ${message.author.username}`,
                        value: `💰 **${user.coins.toLocaleString()}** pièces\n🏆 **${user.stats?.wins || 0}V** / ${user.stats?.losses || 0}D\n💪 **Attaque:** ${userStats.attack}\n🛡️ **Défense:** ${userStats.defense}`,
                        inline: true,
                    },
                    {
                        name: '⚔️ VS ⚔️',
                        value: '\u200b',
                        inline: true,
                    },
                    {
                        name: `👤 ${opponentName}`,
                        value: `💰 **${(opponent.coins || 1000).toLocaleString()}** pièces\n🏆 **${opponent.stats?.wins || 0}V** / ${opponent.stats?.losses || 0}D\n💪 **Attaque:** ${opponentStats.attack}\n🛡️ **Défense:** ${opponentStats.defense}`,
                        inline: true,
                    }
                )
                .setFooter({ 
                    text: isFriend ? 'Combat amical - Rivalité activée ! 🔥' : 'Combat aléatoire - Que le meilleur gagne !',
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();
            
            const combatMsg = await message.reply({ embeds: [startEmbed] });
            await new Promise(resolve => setTimeout(resolve, 2000));

            let userHP = 100;
            let opponentHP = 100;
            let combatLog = [];
            let turn = 0;

            // Combat loop
            while (userHP > 0 && opponentHP > 0 && turn < 20) {
                turn++;
                
                // User attack
                const userAttack = calculateAttack(userStats, user);
                const userCrit = Math.random() < (0.08 + userStats.critChance); // Reduced base crit
                const rawUserDamage = userCrit ? Math.floor(userAttack * (2 + Math.random())) : userAttack;
                
                // User can also miss (increased miss chance for balance)
                const userMiss = Math.random() < 0.12; // Increased from 10% to 12%
                if (userMiss && !userCrit) {
                    combatLog.push(`❌ **${message.author.username}** rate son attaque !`);
                } else {
                    const userDamage = calculateDamageReceived(rawUserDamage, opponentStats);
                    opponentHP = Math.max(0, opponentHP - userDamage);
                    
                    if (userCrit) {
                        const defenseInfo = opponentStats.defense > 25 ? ` (${opponentStats.defense} déf. réduit)` : '';
                        combatLog.push(`💥 **${message.author.username}** attaque !\n🔥 **COUP CRITIQUE !**\n🩸 ${userDamage} dégâts${defenseInfo} → ${opponentName} (${opponentHP}/100 HP)`);
                    } else {
                        const defenseInfo = opponentStats.defense > 25 ? ` (${opponentStats.defense} déf. réduit)` : '';
                        combatLog.push(`⚔️ **${message.author.username}** attaque !\n🩸 ${userDamage} dégâts${defenseInfo} → ${opponentName} (${opponentHP}/100 HP)`);
                    }
                }

                if (opponentHP <= 0) break;

                // Opponent attack (reduced miss chance for balance)
                const opponentMiss = Math.random() < 0.10; // Reduced from 0.15
                if (opponentMiss) {
                    combatLog.push(`❌ **${opponentName}** rate son attaque !`);
                } else {
                    const opponentAttack = calculateAttack(opponentStats, opponent);
                    const opponentCrit = Math.random() < (0.08 + opponentStats.critChance); // Reduced base crit
                    const rawOpponentDamage = opponentCrit ? Math.floor(opponentAttack * (2 + Math.random())) : opponentAttack;
                    const opponentDamage = calculateDamageReceived(rawOpponentDamage, userStats);
                    userHP = Math.max(0, userHP - opponentDamage);
                    
                    if (opponentCrit) {
                        const defenseInfo = userStats.defense > 0 ? ` (${userStats.defense} déf. réduit)` : '';
                        combatLog.push(`💥 **${opponentName}** attaque !\n🔥 **COUP CRITIQUE !**\n🩸 ${opponentDamage} dégâts${defenseInfo} → ${message.author.username} (${userHP}/100 HP)`);
                    } else {
                        const defenseInfo = userStats.defense > 0 ? ` (${userStats.defense} déf. réduit)` : '';
                        combatLog.push(`⚔️ **${opponentName}** attaque !\n🩸 ${opponentDamage} dégâts${defenseInfo} → ${message.author.username} (${userHP}/100 HP)`);
                    }
                }

                // Update embed during combat
                const combatEmbed = new EmbedBuilder()
                    .setColor(0xFF4500)
                    .setTitle('⚔️ COMBAT EN COURS...')
                    .setDescription(`**${message.author.username}** (${userHP}/100 ❤️) VS **${opponentName}** (${opponentHP}/100 ❤️)`)
                    .setThumbnail(message.author.displayAvatarURL())
                    .addFields(
                        {
                            name: `📊 Tour ${turn}`,
                            value: combatLog.slice(-2).join('\n\n') || 'Le combat commence...',
                            inline: false,
                        },
                        {
                            name: '💚 Points de vie',
                            value: `**${message.author.username}:**\n\`\`\`${'█'.repeat(Math.floor(userHP / 10))}${'░'.repeat(10 - Math.floor(userHP / 10))} ${userHP}%\`\`\`\n**${opponentName}:**\n\`\`\`${'█'.repeat(Math.floor(opponentHP / 10))}${'░'.repeat(10 - Math.floor(opponentHP / 10))} ${opponentHP}%\`\`\``,
                            inline: false,
                        }
                    )
                    .setFooter({ 
                        text: `Tour ${turn} sur 20 maximum`,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();
                
                await combatMsg.edit({ embeds: [combatEmbed] });
                await new Promise(resolve => setTimeout(resolve, 2500));
            }

            // Determine winner
            let userWon = userHP > 0;
            
            // Check for Œil du Chaos (cancel defeat)
            if (!userWon && user.items) {
                const oeilChaos = user.items.find(item => item.type === 'oeil_chaos');
                if (oeilChaos && Math.random() < 0.05) {
                    userWon = true;
                    userHP = 1; // Survive with 1 HP
                    combatLog.push(`\n🌈 **ŒIL DU CHAOS** : La défaite est annulée ! Tu survives avec 1 HP.`);
                }
            }
            
            // Apply Sceau de l'Abîme (steal coins on win)
            let stolenCoins = 0;
            if (userWon && user.items) {
                const sceau = user.items.find(item => item.type === 'sceau_abime');
                if (sceau) {
                    stolenCoins = Math.floor(Math.random() * 100) + 50;
                    addCoins(opponentId, -stolenCoins);
                    addCoins(userId, stolenCoins);
                }
            }
            
            // Track rivalry if friend fight
            if (isFriend) {
                const updatedUser = getUser(userId);
                if (!updatedUser.rivalries) updatedUser.rivalries = { rivals: [] };
                
                let rivalry = updatedUser.rivalries.rivals.find(r => r.userId === opponentId);
                if (!rivalry) {
                    rivalry = { userId: opponentId, wins: 0, losses: 0, lastFight: Date.now() };
                    updatedUser.rivalries.rivals.push(rivalry);
                }
                
                if (userWon) {
                    rivalry.wins++;
                } else {
                    rivalry.losses++;
                }
                rivalry.lastFight = Date.now();
                updateUser(userId, updatedUser);
            }
            
            if (userWon) {
                // Handle challenge bet if exists
                if (challengeBet > 0) {
                    // Winner gets opponent's bet
                    addCoins(userId, challengeBet);
                    addCoins(opponentId, -challengeBet);
                }
                
                // Level-based rewards (higher level = better rewards)
                const levelMultiplier = 1 + (user.level - 1) * 0.05;
                const baseCoins = Math.floor(Math.random() * 300) + 80;
                const coinsWon = Math.floor(baseCoins * levelMultiplier);
                const keyChance = Math.random() < 0.25;
                
                addCoins(userId, coinsWon);
                
                // Add XP for victory
                const xpGained = 15 + Math.floor(user.level / 2);
                const levelResult = addXP(userId, xpGained);
                
                // Update challenge progress
                const challengeUpdate = updateChallengeProgress(userId, 'arene');
                
                let rewardText = `💰 **+${coinsWon} pièces**`;
                
                if (challengeBet > 0) {
                    rewardText += `\n🏆 **Défi gagné : +${challengeBet.toLocaleString()}💰**`;
                }
                
                if (stolenCoins > 0) {
                    rewardText += `\n🔮 Sceau de l'Abîme : +${stolenCoins} pièces volées`;
                }
                
                if (keyChance) {
                    const keyTypes = ['bois', 'argent'];
                    const keyType = keyTypes[Math.floor(Math.random() * keyTypes.length)];
                    addKey(userId, keyType);
                    rewardText += `\n🔑 **+1 clé ${keyType}**`;
                }
                
                const updatedUser = getUser(userId);
                updatedUser.stats = { 
                    ...updatedUser.stats, 
                    wins: (updatedUser.stats?.wins || 0) + 1,
                    losses: updatedUser.stats?.losses || 0  // Preserve losses
                };
                updateUser(userId, updatedUser);
                
                const updatedOpponent = getUser(opponentId);
                updatedOpponent.stats = { 
                    ...updatedOpponent.stats, 
                    wins: updatedOpponent.stats?.wins || 0,  // Preserve wins
                    losses: (updatedOpponent.stats?.losses || 0) + 1 
                };
                updateUser(opponentId, updatedOpponent);
                
                const victoryEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🏆 VICTOIRE !')
                    .setDescription(`**${message.author.username}** remporte le combat contre **${opponentName}** !`)
                    .setThumbnail(message.author.displayAvatarURL())
                    .addFields(
                        {
                            name: '📊 Résumé du combat',
                            value: combatLog.slice(-4).join('\n\n') || 'Combat terminé',
                            inline: false,
                        },
                        {
                            name: '🎁 Récompenses obtenues',
                            value: rewardText,
                            inline: false,
                        },
                        {
                            name: '💰 Pièces actuelles',
                            value: `\`\`\`${getUser(userId).coins.toLocaleString()} pièces\`\`\``,
                            inline: true,
                        },
                        {
                            name: '📈 Statistiques',
                            value: `🏆 **${updatedUser.stats.wins}V** / ${updatedUser.stats.losses}D\n📊 **${updatedUser.stats.wins + updatedUser.stats.losses > 0 ? ((updatedUser.stats.wins / (updatedUser.stats.wins + updatedUser.stats.losses)) * 100).toFixed(1) : 0}%** victoires\n⭐ **Niveau** ${updatedUser.level}`,
                            inline: true,
                        }
                    )
                    .setFooter({ 
                        text: isFriend ? `Tu as humilié ton ami ${opponentName} ! 💀` : `Tu as humilié ${opponentName} ! 💀`,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();
                
                await combatMsg.edit({ embeds: [victoryEmbed] });
            } else {
                // Handle challenge bet if exists
                if (challengeBet > 0) {
                    // Loser loses bet, winner gets it
                    addCoins(userId, -challengeBet);
                    addCoins(opponentId, challengeBet);
                }
                
                const coinsLost = Math.floor(Math.random() * 150) + 50;
                addCoins(userId, -coinsLost);
                const updatedUser = getUser(userId);
                updatedUser.stats = { 
                    ...updatedUser.stats, 
                    wins: updatedUser.stats?.wins || 0,  // Preserve wins
                    losses: (updatedUser.stats?.losses || 0) + 1 
                };
                updateUser(userId, updatedUser);
                
                const updatedOpponent = getUser(opponentId);
                updatedOpponent.stats = { 
                    ...updatedOpponent.stats, 
                    wins: (updatedOpponent.stats?.wins || 0) + 1,
                    losses: updatedOpponent.stats?.losses || 0  // Preserve losses
                };
                updateUser(opponentId, updatedOpponent);
                
                const defeatEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ DÉFAITE...')
                    .setDescription(`**${message.author.username}** a été vaincu par **${opponentName}** !`)
                    .setThumbnail(opponentUser ? opponentUser.displayAvatarURL() : message.author.displayAvatarURL())
                    .addFields(
                        {
                            name: '📊 Résumé du combat',
                            value: combatLog.slice(-4).join('\n\n') || 'Combat terminé',
                            inline: false,
                        },
                        {
                            name: '💸 Pertes subies',
                            value: `💰 **-${coinsLost.toLocaleString()} pièces**`,
                            inline: false,
                        },
                        {
                            name: '💰 Pièces actuelles',
                            value: `\`\`\`${getUser(userId).coins.toLocaleString()} pièces\`\`\``,
                            inline: true,
                        },
                        {
                            name: '📈 Statistiques',
                            value: `🏆 **${updatedUser.stats.wins}V** / ${updatedUser.stats.losses}D\n📊 **${updatedUser.stats.wins + updatedUser.stats.losses > 0 ? ((updatedUser.stats.wins / (updatedUser.stats.wins + updatedUser.stats.losses)) * 100).toFixed(1) : 0}%** victoires`,
                            inline: true,
                        }
                    )
                    .setFooter({ 
                        text: isFriend ? `Ton ami ${opponentName} t'a humilié ! 😈` : `${opponentName} t'a humilié ! 😈`,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();
                
                await combatMsg.edit({ embeds: [defeatEmbed] });
            }
        } catch (error) {
            console.error('Erreur lors du combat:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors du combat.')
                .setTimestamp();
            message.reply({ embeds: [errorEmbed] });
        }
    },
};

function calculateStats(user) {
    // Base stats - more balanced
    let attack = 40;
    let defense = 25;
    let critChance = 0.08; // Reduced from 0.1

    // Apply items bonuses (reduced impact)
    if (user.items) {
        user.items.forEach(item => {
            if (item.effect) {
                if (item.effect.damageBoost) {
                    attack += Math.floor(item.effect.damageBoost * 0.7); // Reduced effectiveness
                }
                if (item.effect.defenseBoost) {
                    defense += Math.floor(item.effect.defenseBoost * 0.7); // Defense boost from items
                }
                if (item.effect.chanceBoost && item.effect.permanent) {
                    critChance += (item.effect.chanceBoost / 100) * 0.8; // Reduced effectiveness
                }
            }
        });
    }
    
    // Apply temporary bonuses from user.bonuses (reduced impact)
    if (user.bonuses) {
        if (user.bonuses.damageBoost) {
            attack += Math.floor(user.bonuses.damageBoost * 0.7);
        }
        if (user.bonuses.defenseBoost) {
            defense += Math.floor(user.bonuses.defenseBoost * 0.7);
        }
        const now = Date.now();
        if (user.bonuses.chanceBoost && user.bonuses.chanceBoost > 0 && 
            (!user.bonuses.expiresAt || user.bonuses.expiresAt > now)) {
            critChance += (user.bonuses.chanceBoost / 100) * 0.8;
        }
    }

    return { attack, defense, critChance };
}

function calculateAttack(stats, user) {
    const baseDamage = stats.attack;
    const variance = baseDamage * 0.25; // Reduced variance from 30% to 25%
    let damage = baseDamage + (Math.random() * variance * 2) - variance;
    
    // Apply companion bonuses (reduced chance)
    if (user.items) {
        const companions = user.items.filter(item => item.effect && item.effect.companion);
        for (const companion of companions) {
            if (companion.type === 'dragon_ancien' && Math.random() < 0.05) { // Reduced from 0.1 to 0.05
                damage = damage * 2.5; // Reduced from 3x to 2.5x
                break;
            }
        }
    }
    
    return Math.floor(Math.max(1, damage));
}

function calculateDamageReceived(attackDamage, defenderStats) {
    // Defense reduces damage: each point of defense reduces damage by 1%
    // Max reduction: 50% (at 50 defense)
    const defenseReduction = Math.min(0.5, defenderStats.defense * 0.01);
    const finalDamage = Math.floor(attackDamage * (1 - defenseReduction));
    return Math.max(1, finalDamage); // Minimum 1 damage
}
