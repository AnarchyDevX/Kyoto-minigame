const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'ouvrir',
    },
    async execute(message, args) {
        const { getUser, removeKey, addCoins, addItem, updateUser, getCharges, useCharge, addXP, updateChallengeProgress } = require('../utils/game');
        
        try {
            if (args.length < 1) {
                return message.reply('❌ Utilisation: `$ouvrir coffre_bois` ou `$ouvrir coffre_argent` ou `$ouvrir coffre_or` ou `$ouvrir coffre_demoniaque`');
            }
            
            let coffreType = args[0].replace('coffre_', '');
            // Support both "or" and "doré" for golden chest
            if (coffreType === 'doré' || coffreType === 'dore') {
                coffreType = 'or';
            }
            const validTypes = ['bois', 'argent', 'or', 'demoniaque'];
            
            if (!validTypes.includes(coffreType)) {
                return message.reply('❌ Type de coffre invalide. Types disponibles: `coffre_bois`, `coffre_argent`, `coffre_or` (ou `coffre_doré`), `coffre_demoniaque`');
            }

            const userId = message.author.id;
            const user = getUser(userId);
            const now = Date.now();
            
            // Check charges
            const charges = getCharges(userId, 'ouvrir');
            if (charges.current <= 0) {
                const nextRecharge = charges.nextRecharge;
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('⏳ Plus de charges')
                    .setDescription(`Tu n'as plus de charges pour $ouvrir.\n\n**Recharge dans:** ${nextRecharge}s\n💡 Tu as ${charges.max} charges max (1 charge toutes les 1 minute)`)
                    .setFooter({ 
                        text: `Charges: 0/${charges.max}`,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }
            
            const chargeResult = useCharge(userId, 'ouvrir');
            if (!chargeResult.success) {
                return; // Safety check
            }

            // Check if user has key
            if (!user.keys[coffreType] || user.keys[coffreType] === 0) {
                return message.reply(`❌ Tu n'as pas de clé pour le coffre ${coffreType}.`);
            }

            // Remove key
            removeKey(userId, coffreType);

            // Send suspense
            const suspenseMsg = await message.reply('🧰 Ouverture du coffre…\n⏳ …');
            await new Promise(resolve => setTimeout(resolve, 2000));

            let result = '';
            let coinsChange = 0;
            let item = null;

            // Generate loot based on chest type
            const roll = Math.random();

            if (coffreType === 'bois') {
                if (roll < 0.4) {
                    coinsChange = Math.floor(Math.random() * 100) + 50;
                    result = `💰 Bourse usée → +${coinsChange} pièces`;
                } else if (roll < 0.7) {
                    // Apply temporary bonus immediately
                    const updatedUser = getUser(userId);
                    updatedUser.bonuses = {
                        ...updatedUser.bonuses,
                        chanceBoost: (updatedUser.bonuses.chanceBoost || 0) + 5,
                        expiresAt: Date.now() + (10 * 60 * 1000),
                    };
                    updateUser(userId, updatedUser);
                    result = `🍀 Porte-bonheur fêlé → +5% chance pendant 10 min`;
                } else if (roll < 0.9) {
                    const itemType = Math.random() < 0.5 ? 'lame' : 'cuirasse';
                    if (itemType === 'lame') {
                        item = { type: 'lame', name: 'Lame émoussée', effect: { damageBoost: 5 } };
                        result = `⚔️ Lame émoussée → +5% dégâts arène`;
                    } else {
                        item = { type: 'cuirasse', name: 'Cuirasse usée', effect: { defenseBoost: 5 } };
                        result = `🛡️ Cuirasse usée → +5 défense`;
                    }
                } else {
                    coinsChange = -50;
                    result = `❌ Piège rouillé → -50 pièces`;
                }
            } else if (coffreType === 'argent') {
                if (roll < 0.3) {
                    coinsChange = Math.floor(Math.random() * 200) + 200;
                    result = `💰 Sac d'argent → +${coinsChange} pièces`;
                } else if (roll < 0.5) {
                    // Apply temporary bonus immediately
                    const updatedUser = getUser(userId);
                    updatedUser.bonuses = {
                        ...updatedUser.bonuses,
                        chanceBoost: (updatedUser.bonuses.chanceBoost || 0) + 10,
                        expiresAt: Date.now() + (30 * 60 * 1000),
                    };
                    updateUser(userId, updatedUser);
                    result = `🍀 Trèfle brillant → +10% chance pendant 30 min`;
                } else if (roll < 0.7) {
                    const itemType = Math.random() < 0.5 ? 'amulette' : 'armure';
                    if (itemType === 'amulette') {
                        item = { type: 'amulette', name: 'Amulette du combattant', effect: { damageBoost: 10 } };
                        result = `⚔️ Amulette du combattant → +10% dégâts arène`;
                    } else {
                        item = { type: 'armure', name: 'Armure légère', effect: { defenseBoost: 8 } };
                        result = `🛡️ Armure légère → +8 défense`;
                    }
                } else if (roll < 0.9) {
                    const bonusKeyTypes = ['bois', 'argent'];
                    const bonusKey = bonusKeyTypes[Math.floor(Math.random() * bonusKeyTypes.length)];
                    const { addKey } = require('../utils/game');
                    addKey(userId, bonusKey);
                    result = `🧰 Clé bonus → tu gagnes une clé ${bonusKey}`;
                } else {
                    const updatedUser = getUser(userId);
                    updatedUser.bonuses = { 
                        ...updatedUser.bonuses, 
                        chanceBoost: -10, 
                        expiresAt: Date.now() + (15 * 60 * 1000) 
                    };
                    updateUser(userId, updatedUser);
                    result = `💀 Marque du malchanceux → -10% chance pendant 15 min`;
                }
            } else if (coffreType === 'or') {
                if (roll < 0.25) {
                    coinsChange = Math.floor(Math.random() * 700) + 800;
                    result = `💰 Coffre rempli d'or → +${coinsChange} pièces`;
                } else if (roll < 0.4) {
                    item = { type: 'anneau', name: 'Anneau du Hasard', effect: { chanceBoost: 15, permanent: true } };
                    result = `🍀 Anneau du Hasard → +15% chance (permanent)`;
                } else if (roll < 0.55) {
                    const itemType = Math.random() < 0.5 ? 'gantelets' : 'bouclier';
                    if (itemType === 'gantelets') {
                        item = { type: 'gantelets', name: 'Gantelets sanglants', effect: { damageBoost: 20 } };
                        result = `⚔️ Gantelets sanglants → +20% dégâts`;
                    } else {
                        item = { type: 'bouclier', name: 'Bouclier de fer', effect: { defenseBoost: 15 } };
                        result = `🛡️ Bouclier de fer → +15 défense`;
                    }
                } else if (roll < 0.7) {
                    item = { type: 'compagnon_loup', name: 'Loup spectral', effect: { damageBoost: 10, companion: true } };
                    result = `🐉 Compagnon : Loup spectral → +10% dégâts`;
                } else if (roll < 0.85) {
                    item = { type: 'jeton_destin', name: 'Jeton du Destin', effect: { freeDestin: true } };
                    result = `🎲 Jeton du Destin → relance gratuite de /destin`;
                } else {
                    const bigGain = Math.random() < 0.5;
                    if (bigGain) {
                        coinsChange = Math.floor(Math.random() * 2000) + 2000;
                        result = `💀 Relique instable → +${coinsChange} pièces (gros gain !)`;
                    } else {
                        coinsChange = -(Math.floor(Math.random() * 1000) + 500);
                        result = `💀 Relique instable → ${coinsChange} pièces (grosse perte...)`;
                    }
                }
            } else if (coffreType === 'demoniaque') {
                // Legendary items
                const legendaryItems = [
                    { type: 'oeil_chaos', name: 'Œil du Chaos', effect: { cancelDefeat: 5 } },
                    { type: 'coeur_maudit', name: 'Cœur Maudit', effect: { gainBoost: 30, lossBoost: 30 } },
                    { type: 'couronne_destin', name: 'Couronne du Destin', effect: { dailyX5: true } },
                    { type: 'dragon_ancien', name: 'Dragon Ancien', effect: { massiveCrit: true, companion: true } },
                    { type: 'grimoire', name: 'Grimoire Interdit', effect: { transformFail: true } },
                    { type: 'sceau_abime', name: 'Sceau de l\'Abîme', effect: { autoSteal: true } },
                ];
                
                const legendary = legendaryItems[Math.floor(Math.random() * legendaryItems.length)];
                item = legendary;
                result = `🌈 **${legendary.name}**\n${getLegendaryDescription(legendary.type)}`;
                
                // Announce to server if possible
                try {
                    await message.channel.send(`🎉 **${message.author}** a obtenu un objet légendaire : **${legendary.name}** !`);
                } catch (e) {}
            }

                // Apply level-based multiplier to rewards
                const levelMultiplier = 1 + (user.level - 1) * 0.05;
                if (coinsChange > 0) {
                    coinsChange = Math.floor(coinsChange * levelMultiplier);
                    result += ` (x${levelMultiplier.toFixed(2)} bonus niveau ${user.level})`;
                }
                
                // Apply changes
                if (coinsChange !== 0) {
                    addCoins(userId, coinsChange);
                }
                if (item) {
                    // Check for Jeton du Destin - apply immediately if free destin
                    if (item.type === 'jeton_destin') {
                        // Store as item but also mark for free use
                        addItem(userId, item);
                    } else {
                        addItem(userId, item);
                    }
                }
                
                // Add XP based on chest type
                const xpRewards = {
                    bois: 5,
                    argent: 10,
                    or: 20,
                    demoniaque: 50,
                };
                const xpGained = xpRewards[coffreType] || 5;
                const levelResult = addXP(userId, xpGained);
                
                // Update challenge progress
                const challengeUpdate = updateChallengeProgress(userId, 'ouvrir');
                
                const updatedUser = getUser(userId);
                
                // Build result embed
                const resultEmbed = new EmbedBuilder()
                    .setColor(coinsChange > 0 ? 0x00FF00 : coinsChange < 0 ? 0xFF0000 : 0xFFD700)
                    .setTitle('🧰 CONTENU DU COFFRE')
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
                        value: `**Niveau ${levelResult.newLevel}** débloqué !`,
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

                await suspenseMsg.edit({ embeds: [resultEmbed] });
        } catch (error) {
            console.error('Erreur lors de l\'ouverture du coffre:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors de l\'ouverture du coffre.')
                .setTimestamp();
            message.reply({ embeds: [errorEmbed] });
        }
    },
};

function getLegendaryDescription(type) {
    const descriptions = {
        'oeil_chaos': '➜ 5% de chance d\'annuler une défaite en arène',
        'coeur_maudit': '➜ +30% gains\n➜ +30% pertes (très risqué)',
        'couronne_destin': '➜ Chaque jour : 1 chance de x5 gains',
        'dragon_ancien': '➜ Critique massif aléatoire',
        'grimoire': '➜ Peut transformer un échec en jackpot',
        'sceau_abime': '➜ Vol automatique de pièces en arène',
    };
    return descriptions[type] || '';
}
