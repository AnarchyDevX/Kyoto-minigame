const { EmbedBuilder } = require('discord.js');
const { getUser, updateUser } = require('../utils/game');

module.exports = {
    data: {
        name: 'rival',
    },
    async execute(message, args) {
        try {
            const userId = message.author.id;
            const user = getUser(userId);
            
            if (args[0] === 'list') {
                const rivals = user.rivalries?.rivals || [];
                
                if (rivals.length === 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Aucun rival')
                        .setDescription('Tu n\'as pas encore de rivaux.\n\nUtilise `$arene @user` pour créer une rivalité !')
                        .setFooter({ 
                            text: message.author.username,
                            iconURL: message.author.displayAvatarURL()
                        })
                        .setTimestamp();
                    
                    return message.reply({ embeds: [errorEmbed] });
                }
                
                const rivalList = [];
                for (const r of rivals.slice(0, 10)) {
                    try {
                        const rivalUser = await message.client.users.fetch(r.userId);
                        const winRate = r.wins + r.losses > 0 
                            ? ((r.wins / (r.wins + r.losses)) * 100).toFixed(1)
                            : '0.0';
                        rivalList.push(`**${rivalUser.username}** - ${r.wins}V/${r.losses}D (${winRate}%)`);
                    } catch (e) {
                        rivalList.push(`**Joueur** ${r.userId.slice(-4)} - ${r.wins}V/${r.losses}D`);
                    }
                }
                
                const listEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('⚔️ TES RIVAUX')
                    .setDescription(rivalList.join('\n') || 'Aucun rival')
                    .setFooter({ 
                        text: `${rivals.length} rival${rivals.length > 1 ? 'aux' : ''} au total`,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();
                
                return message.reply({ embeds: [listEmbed] });
            }
            
            if (args[0] === 'accept') {
                // Récupérer tous les utilisateurs pour trouver les challenges
                const { getAllUsers } = require('../utils/game');
                const allUsers = getAllUsers();
                
                // Trouver les challenges en attente pour cet utilisateur
                const pendingChallenges = [];
                for (const [fromUserId, fromUser] of Object.entries(allUsers)) {
                    if (fromUser.rivalries?.challenges) {
                        for (const challenge of fromUser.rivalries.challenges) {
                            if (challenge.toUserId === userId && challenge.status === 'pending') {
                                pendingChallenges.push({
                                    ...challenge,
                                    fromUserId: fromUserId,
                                    challengeId: challenge.createdAt || Date.now()
                                });
                            }
                        }
                    }
                }
                
                if (pendingChallenges.length === 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Aucun défi en attente')
                        .setDescription('Tu n\'as aucun défi en attente.')
                        .setTimestamp();
                    
                    return message.reply({ embeds: [errorEmbed] });
                }
                
                // Si un utilisateur est mentionné, accepter son challenge
                if (message.mentions.users.size > 0) {
                    const challengerUser = message.mentions.users.first();
                    const challenge = pendingChallenges.find(c => c.fromUserId === challengerUser.id);
                    
                    if (!challenge) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('❌ Défi introuvable')
                            .setDescription(`Tu n'as pas de défi en attente de **${challengerUser.username}**.`)
                            .setTimestamp();
                        
                        return message.reply({ embeds: [errorEmbed] });
                    }
                    
                    // Vérifier que l'utilisateur a assez de pièces
                    if (user.coins < challenge.coins) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('❌ Pièces insuffisantes')
                            .setDescription(`Tu n'as pas assez de pièces pour accepter ce défi.\n\n**Mise:** ${challenge.coins.toLocaleString()}💰\n**Tes pièces:** ${user.coins.toLocaleString()}💰`)
                            .setTimestamp();
                        
                        return message.reply({ embeds: [errorEmbed] });
                    }
                    
                    // Vérifier que le challenger a assez de pièces
                    const challengerData = getUser(challenge.fromUserId);
                    if (challengerData.coins < challenge.coins) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('❌ Challenge invalide')
                            .setDescription(`**${challengerUser.username}** n'a plus assez de pièces pour ce défi.\n\n**Mise:** ${challenge.coins.toLocaleString()}💰`)
                            .setTimestamp();
                        
                        // Supprimer le challenge invalide
                        if (challengerData.rivalries?.challenges && Array.isArray(challengerData.rivalries.challenges)) {
                            challengerData.rivalries.challenges = challengerData.rivalries.challenges.filter(
                                c => !(c && c.toUserId === userId && c.createdAt === challenge.createdAt)
                            );
                            updateUser(challenge.fromUserId, challengerData);
                        }
                        
                        return message.reply({ embeds: [errorEmbed] });
                    }
                    
                    // Accepter le défi et lancer automatiquement le combat
                    // Ne PAS supprimer le challenge ici - il sera détecté et supprimé par arene.js
                    const acceptEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('✅ Défi accepté !')
                        .setDescription(`Défi accepté ! Le combat contre **${challengerUser.username}** commence...\n\n**Mise:** ${challenge.coins.toLocaleString()}💰`)
                        .setThumbnail(challengerUser.displayAvatarURL())
                        .setFooter({ 
                            text: message.author.username,
                            iconURL: message.author.displayAvatarURL()
                        })
                        .setTimestamp();
                    
                    await message.reply({ embeds: [acceptEmbed] });
                    
                    // Attendre un peu avant de lancer le combat pour que le message soit visible
                    setTimeout(async () => {
                        // Lancer automatiquement le combat en appelant la commande arene
                        // Le challenge sera détecté et supprimé automatiquement par arene.js
                        try {
                            const areneCommand = message.client.commands.get('arene');
                            if (areneCommand) {
                                // Récupérer le membre du serveur
                                let challengerMember = message.guild?.members.cache.get(challengerUser.id);
                                if (!challengerMember && message.guild) {
                                    try {
                                        challengerMember = await message.guild.members.fetch(challengerUser.id);
                                    } catch (e) {
                                        throw new Error(`Membre ${challengerUser.username} introuvable sur le serveur`);
                                    }
                                }
                                
                                if (!challengerMember) {
                                    throw new Error(`Membre ${challengerUser.username} introuvable sur le serveur`);
                                }
                                
                                // Créer un message simulé avec la mention correcte
                                const fakeMessage = {
                                    ...message,
                                    content: `$arene <@${challengerUser.id}>`,
                                    mentions: {
                                        users: message.mentions.users?.constructor?.name === 'Collection' 
                                            ? message.mentions.users 
                                            : (() => {
                                                const { Collection } = require('discord.js');
                                                const col = new Collection();
                                                col.set(challengerUser.id, challengerUser);
                                                return col;
                                            })(),
                                        members: (() => {
                                            const { Collection } = require('discord.js');
                                            const col = new Collection();
                                            if (challengerMember) col.set(challengerUser.id, challengerMember);
                                            return col;
                                        })(),
                                    }
                                };
                                
                                // Appeler arene avec les arguments corrects
                                await areneCommand.execute(fakeMessage, []);
                            } else {
                                throw new Error('Commande arene introuvable');
                            }
                        } catch (error) {
                            console.error('Erreur lors du lancement automatique du combat:', error);
                            const errorEmbed = new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setTitle('❌ Erreur')
                                .setDescription(`Une erreur s'est produite lors du lancement du combat.\n\nUtilisez manuellement: \`$arene @${challengerUser.username}\``)
                                .setTimestamp();
                            message.channel.send({ embeds: [errorEmbed] }).catch(() => {});
                        }
                    }, 1500);
                    
                    return;
                }
                
                // Sinon, lister les challenges en attente
                const challengeList = [];
                for (const challenge of pendingChallenges.slice(0, 10)) {
                    try {
                        const challengerUser = await message.client.users.fetch(challenge.fromUserId);
                        challengeList.push(`**${challengerUser.username}** - **${challenge.coins.toLocaleString()}💰**\n➜ Accepter avec \`$rival accept @${challengerUser.username}\``);
                    } catch (e) {
                        challengeList.push(`**Joueur** ${challenge.fromUserId.slice(-4)} - **${challenge.coins.toLocaleString()}💰**`);
                    }
                }
                
                const listEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('⚔️ DÉFIS EN ATTENTE')
                    .setDescription(challengeList.join('\n\n') || 'Aucun défi')
                    .setFooter({ 
                        text: `${pendingChallenges.length} défi${pendingChallenges.length > 1 ? 's' : ''} en attente`,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();
                
                return message.reply({ embeds: [listEmbed] });
            }
            
            if (args[0] === 'challenge' && message.mentions.users.size > 0) {
                // Filter out bot mentions and the command author
                const validMentions = message.mentions.users.filter(u => 
                    !u.bot && u.id !== userId && u.id !== message.client.user.id
                );
                
                if (validMentions.size === 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Utilisateur invalide')
                        .setDescription('Tu dois mentionner un utilisateur valide (pas un bot ni toi-même).')
                        .setTimestamp();
                    
                    return message.reply({ embeds: [errorEmbed] });
                }
                
                const targetUser = validMentions.first();
                const targetMember = message.mentions.members.filter(m => m.id === targetUser.id).first() 
                    || await message.guild.members.fetch(targetUser.id).catch(() => null);
                
                // Trouver le montant (premier argument numérique après 'challenge')
                const bet = parseInt(args.find(arg => !isNaN(parseInt(arg)) && parseInt(arg) > 0)) || 0;
                
                if (!targetUser) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Utilisateur introuvable')
                        .setDescription('Impossible de trouver l\'utilisateur mentionné.')
                        .setTimestamp();
                    
                    return message.reply({ embeds: [errorEmbed] });
                }
                
                if (bet < 100 || bet > user.coins) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Mise invalide')
                        .setDescription(`**Mise minimale:** 100 pièces\n**Mise maximale:** ${user.coins.toLocaleString()} pièces\n\n\`\`\`Tes pièces: ${user.coins.toLocaleString()}\`\`\``)
                        .setTimestamp();
                    
                    return message.reply({ embeds: [errorEmbed] });
                }
                
                // Create challenge
                if (!user.rivalries) user.rivalries = { challenges: [] };
                user.rivalries.challenges.push({
                    fromUserId: userId,
                    toUserId: targetUser.id,
                    coins: bet,
                    status: 'pending',
                    createdAt: Date.now(),
                });
                updateUser(userId, user);
                
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('⚔️ Défi envoyé !')
                    .setDescription(`Défi envoyé à **${targetUser.username}** pour **${bet.toLocaleString()}💰**\n\nIl peut accepter avec \`$arene @${message.author.username}\``)
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setFooter({ 
                        text: message.author.username,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();
                
                return message.reply({ embeds: [successEmbed] });
            }
            
            // Default: show help
            const helpEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('⚔️ SYSTÈME DE RIVALITÉS')
                .setDescription('**Commandes disponibles :**\n\n`$rival list` - Liste tes rivaux\n`$rival challenge @user <mise>` - Défie un joueur avec une mise\n`$rival accept` - Liste tes défis en attente\n`$rival accept @user` - Accepte un défi d\'un joueur spécifique')
                .addFields({
                    name: '💡 Astuce',
                    value: 'Les rivalités se créent automatiquement lors des combats en arène avec d\'autres joueurs.',
                    inline: false,
                })
                .setFooter({ 
                    text: message.author.username,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();
            
            message.reply({ embeds: [helpEmbed] });
        } catch (error) {
            console.error('Erreur lors de la gestion des rivalités:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors de la gestion des rivalités.')
                .setTimestamp();
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
