const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'destin',
    },
    async execute(message, args) {
        const { getUser, addCoins, addKey, updateUser, getCharges, useCharge, addXP, updateChallengeProgress, generateDailyChallenge } = require('../utils/game');
        
        try {
            const userId = message.author.id;
            const user = getUser(userId);
            const now = Date.now();
            
            // Check for Jeton du Destin (bypasses charge)
            let usedJeton = false;
            if (user.items) {
                const jetonIndex = user.items.findIndex(item => item.type === 'jeton_destin');
                if (jetonIndex !== -1) {
                    usedJeton = true;
                    user.items.splice(jetonIndex, 1);
                    updateUser(userId, user);
                }
            }
            
            // Check charges (unless jeton used)
            if (!usedJeton) {
                const charges = getCharges(userId, 'destin');
                if (charges.current <= 0) {
                    const nextRecharge = charges.nextRecharge;
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('⏳ Plus de charges')
                        .setDescription(`Tu n'as plus de charges pour $destin.\n\n**Recharge dans:** ${nextRecharge}s\n💡 Tu as ${charges.max} charges max (1 charge toutes les 2 minutes)`)
                        .setFooter({ 
                            text: `Charges: 0/${charges.max}`,
                            iconURL: message.author.displayAvatarURL()
                        })
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
                
                const chargeResult = useCharge(userId, 'destin');
                if (!chargeResult.success) {
                    return; // Safety check
                }
            }
            
            // Check if user has active curse
            if (user.bonuses && user.bonuses.expiresAt && user.bonuses.expiresAt > now && user.bonuses.chanceBoost < 0) {
                const remainingTime = Math.ceil((user.bonuses.expiresAt - now) / 1000 / 60);
                const curseEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('💀 Malédiction active')
                    .setDescription(`Tu es sous une malédiction !\n\n**Attends ${remainingTime} minutes** avant de pouvoir utiliser $destin.`)
                    .setFooter({ 
                        text: message.author.username,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();
                return message.reply({ embeds: [curseEmbed] });
            }
            
            // Generate daily challenge if needed
            if (!user.dailyChallenges || !user.dailyChallenges.current) {
                generateDailyChallenge(userId);
            }
            
            // Check for Couronne du Destin (daily x5 chance)
            let dailyX5Used = false;
            if (user.items) {
                const couronne = user.items.find(item => item.type === 'couronne_destin');
                if (couronne) {
                    const lastUsed = couronne.lastDailyUse || 0;
                    const today = new Date().setHours(0, 0, 0, 0);
                    if (lastUsed < today) {
                        dailyX5Used = true;
                        couronne.lastDailyUse = Date.now();
                        updateUser(userId, user);
                    }
                }
            }

            // Send suspense message
            const suspenseMsg = await message.reply('🎲 Le destin tourne la roue…\n⏳ …');
            
            // Wait for suspense
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Apply legendary item effects
            let gainMultiplier = 1;
            let lossMultiplier = 1;
            if (user.items) {
                const coeurMaudit = user.items.find(item => item.type === 'coeur_maudit');
                if (coeurMaudit) {
                    gainMultiplier = 1.3;
                    lossMultiplier = 1.3;
                }
            }
            
            // Generate random result
            let roll = Math.random();
            let result = '';
            let coinsChange = 0;
            let keyGained = null;
            let bonus = null;
            
            // Apply daily x5 from Couronne du Destin
            if (dailyX5Used && roll < 0.2) {
                roll = 0.99; // Force jackpot-like result
            }

            if (roll < 0.30) {
                // Common gain (30%)
                coinsChange = Math.floor(Math.random() * 200) + 50;
                result = `💰 +${coinsChange} pièces`;
            } else if (roll < 0.55) {
                // Loss (25%)
                coinsChange = -(Math.floor(Math.random() * 200) + 50);
                result = `❌ ${coinsChange} pièces`;
            } else if (roll < 0.72) {
                // Rare gain (17%)
                coinsChange = Math.floor(Math.random() * 400) + 300;
                result = `💰 +${coinsChange} pièces`;
            } else if (roll < 0.85) {
                // Multiplier bonus (13%)
                const multiplier = [2, 3, 5][Math.floor(Math.random() * 3)];
                bonus = { multiplier, expiresAt: Date.now() + (5 * 60 * 1000) };
                result = `🔥 Multiplicateur x${multiplier} sur ton prochain gain (5 min)`;
            } else if (roll < 0.94) {
                // Key gained (9%)
                const keyTypes = ['bois', 'argent', 'or'];
                const keyType = keyTypes[Math.floor(Math.random() * keyTypes.length)];
                keyGained = keyType;
                const keyNames = { bois: 'bois', argent: 'argent', or: 'or' };
                result = `💎 Tu gagnes une clé de coffre ${keyNames[keyType]}`;
            } else if (roll < 0.98) {
                // Curse (4%)
                bonus = { chanceBoost: -20, expiresAt: Date.now() + (10 * 60 * 1000) };
                result = `💀 Malédiction : -20% de chance pendant 10 min`;
            } else {
                // JACKPOT (2%)
                coinsChange = 5000;
                result = `🎉 JACKPOT : +${coinsChange} pièces`;
            }

            // Apply multipliers
            if (coinsChange > 0) {
                if (user.bonuses && user.bonuses.multiplier > 1) {
                    coinsChange = Math.floor(coinsChange * user.bonuses.multiplier);
                    result += ` (x${user.bonuses.multiplier} appliqué)`;
                }
                if (gainMultiplier > 1) {
                    coinsChange = Math.floor(coinsChange * gainMultiplier);
                    result += ` (Cœur Maudit: +30%)`;
                }
            } else if (coinsChange < 0) {
                if (lossMultiplier > 1) {
                    coinsChange = Math.floor(coinsChange * lossMultiplier);
                    result += ` (Cœur Maudit: +30% pertes)`;
                }
            }
            
            // Check for Grimoire Interdit (transform failure to jackpot)
            if (coinsChange < 0 && user.items) {
                const grimoire = user.items.find(item => item.type === 'grimoire');
                if (grimoire && Math.random() < 0.1) {
                    coinsChange = 5000;
                    result = `🎉 **GRIMOIRE INTERDIT** : Échec transformé en JACKPOT ! +${coinsChange} pièces`;
                }
            }
            
            if (usedJeton) {
                result += `\n🎲 Jeton du Destin utilisé (relance gratuite)`;
            }

            // Apply level-based multiplier to rewards (higher level = better rewards)
            const levelMultiplier = 1 + (user.level - 1) * 0.05; // +5% per level
            if (coinsChange > 0) {
                coinsChange = Math.floor(coinsChange * levelMultiplier);
                result += ` (x${levelMultiplier.toFixed(2)} bonus niveau ${user.level})`;
            }
            
            // Update user
            if (coinsChange !== 0) {
                addCoins(userId, coinsChange);
            }
            if (keyGained) {
                addKey(userId, keyGained);
            }
            if (bonus) {
                const updatedUser = getUser(userId);
                updatedUser.bonuses = { 
                    multiplier: (bonus.multiplier ? bonus.multiplier : (updatedUser.bonuses?.multiplier || 1)),
                    chanceBoost: (bonus.chanceBoost !== undefined ? bonus.chanceBoost : (updatedUser.bonuses?.chanceBoost || 0)),
                    damageBoost: updatedUser.bonuses?.damageBoost || 0,
                    expiresAt: bonus.expiresAt || updatedUser.bonuses?.expiresAt || null,
                };
                // Reset multiplier if it was used
                if (user.bonuses && user.bonuses.multiplier > 1 && coinsChange > 0) {
                    updatedUser.bonuses.multiplier = 1;
                }
                updateUser(userId, updatedUser);
            } else if (user.bonuses && user.bonuses.multiplier > 1 && coinsChange > 0) {
                // Reset multiplier if it was used but no new bonus
                const updatedUser = getUser(userId);
                updatedUser.bonuses.multiplier = 1;
                updateUser(userId, updatedUser);
            }
            
            // Add XP (more XP for better results)
            let xpGained = 5;
            if (coinsChange > 1000) xpGained = 20;
            else if (coinsChange > 500) xpGained = 15;
            else if (coinsChange > 0) xpGained = 10;
            else if (coinsChange < -100) xpGained = 2; // Less XP for big losses
            
            const levelResult = addXP(userId, xpGained);
            
            // Update challenge progress
            const challengeUpdate = updateChallengeProgress(userId, 'destin');
            
            // Get updated user
            const updatedUser = getUser(userId);
            
            // Build result embed
            const resultEmbed = new EmbedBuilder()
                .setColor(coinsChange > 0 ? 0x00FF00 : coinsChange < 0 ? 0xFF0000 : 0xFFD700)
                .setTitle('🎲 RÉSULTAT DU DESTIN')
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`**${result}**`)
                .addFields(
                    {
                        name: '💰 Pièces',
                        value: `\`\`\`${updatedUser.coins.toLocaleString()} pièces\`\`\``,
                        inline: true,
                    },
                    {
                        name: '📊 XP',
                        value: `\`\`\`+${xpGained} (${updatedUser.xp}/${updatedUser.xpToNextLevel})\`\`\``,
                        inline: true,
                    },
                    {
                        name: '⭐ Niveau',
                        value: `\`\`\`${updatedUser.level}\`\`\``,
                        inline: true,
                    }
                );
            
            if (levelResult.leveledUp) {
                resultEmbed.addFields({
                    name: '🎉 NIVEAU ATTEINT !',
                    value: `**Niveau ${levelResult.newLevel}** débloqué !\nTu débloques de meilleures récompenses !`,
                    inline: false,
                });
                if (levelResult.milestone) {
                    const milestoneRewards = {
                        5: '1000💰',
                        10: '5000💰',
                        15: '10000💰 + Clé Or',
                        20: '20000💰 + Prestige débloqué',
                        25: '30000💰',
                        30: '50000💰 + Clé Démoniaque',
                        40: '100000💰',
                        50: '200000💰',
                    };
                    resultEmbed.addFields({
                        name: '⭐ PALIER DÉBLOQUÉ !',
                        value: `**Palier ${levelResult.milestone}**\nRécompense: ${milestoneRewards[levelResult.milestone] || 'Bonus spécial'}`,
                        inline: false,
                    });
                }
            }
            
            if (challengeUpdate && challengeUpdate.completed) {
                resultEmbed.addFields({
                    name: '✅ Défi quotidien complété !',
                    value: `💰 **+${challengeUpdate.reward.coins}** pièces\n📊 **+${challengeUpdate.reward.xp}** XP`,
                    inline: false,
                });
            } else if (challengeUpdate) {
                const progressBar = '█'.repeat(Math.floor((challengeUpdate.progress / challengeUpdate.target) * 10)) + '░'.repeat(10 - Math.floor((challengeUpdate.progress / challengeUpdate.target) * 10));
                resultEmbed.addFields({
                    name: '📋 Défi quotidien',
                    value: `\`\`\`${progressBar} ${challengeUpdate.progress}/${challengeUpdate.target}\`\`\``,
                    inline: false,
                });
            }
            
            resultEmbed.setFooter({ 
                text: message.author.username,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

            // Update message
            await suspenseMsg.edit({ embeds: [resultEmbed] });
        } catch (error) {
            console.error('Erreur lors de /destin:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors de l\'utilisation de $destin.')
                .setTimestamp();
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
