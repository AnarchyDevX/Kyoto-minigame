const { getRandomNoPermission, getRandomError } = require('../utils/messages');
const { hasFullPermissions } = require('../utils/whitelist');

const allowedUserId = '1442529326955368468';

module.exports = {
    data: {
        name: 'rulesmessage',
    },
    async execute(message, args) {
        // check user id or full permissions
        if (message.author.id !== allowedUserId && !hasFullPermissions(message.author.id)) {
            return message.reply(getRandomNoPermission('rulesmessage', false));
        }

        const rulesChannelId = '1457139280773120155';
        const rolesChannelId = '1460814839998840902';

        try {
            // send rules embed
            const rulesChannel = message.guild.channels.cache.get(rulesChannelId);
            if (rulesChannel) {
                await rulesChannel.send({
                    embeds: [{
                        color: 0x0099FF,
                        title: '📜 Règlement du Serveur',
                        description: `**1️⃣ Respect et bienveillance**
• Traitez tous les membres avec respect, quelle que soit leur opinion, origine ou niveau d'expérience.
• Les insultes, harcèlement, menaces ou discriminations ne seront pas tolérés.
• Évitez le spam, le flood ou toute forme de provocation inutile.

⸻

**2️⃣ Contenu**
• Pas de contenu NSFW, violent ou illégal.
• Les liens malveillants, publicités non autorisées et arnaques sont interdits.
• Les spoilers doivent être signalés avant publication.

⸻

**3️⃣ Canaux et discussions**
• Utilisez le canal approprié pour chaque sujet.
• Évitez de déranger les discussions sérieuses avec des messages hors sujet.
• Les débats sont autorisés, mais restez courtois et respectez les avis des autres.

⸻

**4️⃣ Noms et avatars**
• Les pseudonymes et avatars doivent être appropriés et non offensants.
• Les noms ou images à caractère NSFW ou choquant sont interdits.

⸻

**5️⃣ Sécurité et vie privée**
• Ne partagez jamais vos informations personnelles (adresse, téléphone, identifiants…).
• Ne harcelez pas les membres en dehors du serveur.
• Respectez la vie privée des autres, le respect est la clé.

⸻

**6️⃣ Rôles et permissions**
• Les rôles sont attribués par les modérateurs selon le comportement et la participation.
• Les abus de permissions ou tentatives de contournement ne seront pas tolérés.

⸻

**7️⃣ Modération**
• Les décisions des modérateurs sont finales.
• Toute infraction peut entraîner :
• Avertissement
• Mute temporaire
• Bannissement temporaire ou définitif
• Si vous avez un problème, contactez un modérateur en privé plutôt que d'escalader le conflit.

⸻

**8️⃣ Suggestions et feedback**
• Les idées pour améliorer le serveur sont toujours les bienvenues !
• Merci de les poster dans le canal #suggestions et non ailleurs.

⸻

**⚠️ Rappel final**

En rejoignant ce serveur, vous acceptez de respecter ce règlement.
Le but est que chacun puisse profiter d'un espace agréable, sûr et fun.`,
                        timestamp: new Date().toISOString(),
                    }],
                });
            }

            // send roles embed
            const rolesChannel = message.guild.channels.cache.get(rolesChannelId);
            if (rolesChannel) {
                await rolesChannel.send({
                    embeds: [{
                        color: 0xFFD700,
                        title: '🎖️ Système de Rangs et Classes',
                        description: `**🔹 Rangs (C → S)**

Les rangs représentent votre progression initiale. Pour monter de rang, vous devez cumuler un certain nombre d'heures de vocal et atteindre un niveau minimal.
• **Rang C** : C'est le point de départ. Aucun prérequis, parfait pour commencer à découvrir le serveur et participer aux discussions.
• **Rang B** : Pour atteindre le rang B, vous devez avoir 10 heures de vocal et un niveau 10. Cela montre votre première implication sérieuse.
• **Rang A** : Pour le rang A, il faut 20 heures de vocal et un niveau 15. Vous êtes désormais un membre actif et régulier.
• **Rang S** : Le rang S nécessite 30 heures de vocal et un niveau 20. Vous êtes reconnu comme un membre expérimenté et engagé.

⚠️ Le passage d'un rang à un autre se fait automatiquement dès que vous remplissez les conditions.

⸻

**🔹 Classes (B → S)**

Après le rang S, vous pouvez évoluer vers les classes, qui représentent un niveau supérieur d'engagement et de maîtrise.
• **Classe B** : Pour atteindre la classe B, vous devez avoir 40 heures de vocal et un niveau 25.
• **Classe A** : La classe A nécessite 50 heures de vocal et un niveau 30. Vous êtes alors un membre très actif et impliqué.
• **Classe S** : La classe S est le niveau le plus prestigieux, avec 55 heures de vocal et un niveau 35. Vous êtes un membre exemplaire de la communauté.

💡 Plus vous montez en rang et en classe, plus vous gagnez de responsabilités et privilèges sur le serveur.`,
                        timestamp: new Date().toISOString(),
                    }],
                });
            }

            await message.reply('✅ Les messages de règles et de rôles ont été envoyés avec succès !');
        } catch (error) {
            console.error('Erreur lors de l\'envoi des messages:', error);
            message.reply(getRandomError());
        }
    },
};
