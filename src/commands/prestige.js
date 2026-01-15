const { getUser } = require('../utils/game');
const { canPrestige, performPrestige } = require('../utils/prestige');

module.exports = {
    data: {
        name: 'prestige',
    },
    async execute(message, args) {
        try {
            const userId = message.author.id;
            const user = getUser(userId);
            
            if (!canPrestige(userId)) {
                return message.reply({
                    embeds: [{
                        color: 0xFF0000,
                        title: '❌ Prestige non disponible',
                        description: `Tu dois être niveau 20 minimum pour faire un prestige.\n\nNiveau actuel: ${user.level}`,
                        timestamp: new Date().toISOString(),
                    }],
                });
            }
            
            if (args[0] !== 'confirm') {
                const nextPrestigeLevel = (user.prestige?.level || 0) + 1;
                const bonusPercent = nextPrestigeLevel * 10;
                
                return message.reply({
                    embeds: [{
                        color: 0xFFD700,
                        title: '⭐ Prestige',
                        description: `Tu es niveau ${user.level}.\n\n**Reset partiel** :\n- Niveau → 1\n- Pièces → 1000\n- Clés → 0\n\n**Conservé** :\n- Objets\n- Stats\n- Achievements\n- Rivalités\n\n**Bonus permanent** :\n+${bonusPercent}% gains et XP\n\nTape \`$prestige confirm\` pour confirmer.`,
                        footer: {
                            text: `Prestige actuel: ${user.prestige?.level || 0}`,
                        },
                        timestamp: new Date().toISOString(),
                    }],
                });
            }
            
            const result = performPrestige(userId);
            
            if (!result.success) {
                return message.reply({
                    embeds: [{
                        color: 0xFF0000,
                        title: '❌ Erreur',
                        description: result.reason,
                        timestamp: new Date().toISOString(),
                    }],
                });
            }
            
            message.reply({
                embeds: [{
                    color: 0x00FF00,
                    title: '⭐ Prestige effectué !',
                    description: `Prestige niveau ${result.prestigeLevel}\n\nBonus permanent : +${(result.bonusMultiplier - 1) * 100}% gains et XP\n\nTu recommences au niveau 1 avec ce bonus permanent !`,
                    footer: {
                        text: `Total prestiges: ${result.prestigeLevel}`,
                    },
                    timestamp: new Date().toISOString(),
                }],
            });
        } catch (error) {
            console.error('Erreur lors du prestige:', error);
            message.reply('❌ Une erreur s\'est produite.');
        }
    },
};
