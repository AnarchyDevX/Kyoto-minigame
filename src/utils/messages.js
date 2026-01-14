// Messages d'erreur aléatoires (troll dev)
const errorMessages = [
    '💀 Wallah j\'crois le dev il a fait de la merde, il sait pas coder frr',
    '💀 Le dev il a fait n\'importe quoi là, ça marche même pas',
    '💀 J\'crois le dev il bug, il sait pas programmer ce con',
    '💀 Wallah le dev il est nul, il a cassé le bot frr',
    '💀 Le dev il a fait une erreur de merde, il sait même pas coder',
    '💀 J\'pense le dev il a mal codé, ça bug de partout',
    '💀 Wallah le dev il est à chier, il fait n\'importe quoi',
    '💀 Le dev il sait pas ce qu\'il fait, il a tout cassé',
];

// Messages de refus pour permissions manquantes
const noPermissionMessages = {
    mute: {
        staff: [
            '😏 T\'as cru t\'as qui pour mute frr ? Retourne à tes études mon reuf',
            '😏 Wsh t\'as pas les droits pour mute quelqu\'un bg, va réviser',
            '😏 Frr tu peux pas mute, t\'as pas les permissions nécessaires',
        ],
        member: [
            '😂 Wsh frr tu veux mute quelqu\'un ? T\'es qui toi ?',
            '💀 Mdr t\'as cru que tu pouvais mute ? T\'es pas staff bg',
            '🤡 Frr tu veux faire le modérateur ? Va jouer ailleurs',
            '😭 Wsh t\'es pas staff, tu peux pas mute personne mon reuf',
            '💀 T\'as cru t\'étais qui pour mute ? Retourne jouer à Minecraft',
        ],
    },
    timeout: {
        staff: [
            '😏 T\'as cru t\'as qui pour timeout frr ? Retourne à tes études mon reuf',
            '😏 Wsh t\'as pas les droits pour timeout quelqu\'un bg, va réviser',
            '😏 Frr tu peux pas timeout, t\'as pas les permissions nécessaires',
        ],
        member: [
            '😂 Wsh frr tu veux timeout quelqu\'un ? T\'es qui toi ?',
            '💀 Mdr t\'as cru que tu pouvais timeout ? T\'es pas staff bg',
            '🤡 Frr tu veux faire le modérateur ? Va jouer ailleurs',
            '😭 Wsh t\'es pas staff, tu peux pas timeout personne mon reuf',
            '💀 T\'as cru t\'étais qui pour timeout ? Retourne jouer à Minecraft',
        ],
    },
    unmute: {
        staff: [
            '😏 T\'as cru t\'as qui pour unmute frr ? Retourne à tes études mon reuf',
            '😏 Wsh t\'as pas les droits pour unmute quelqu\'un bg, va réviser',
            '😏 Frr tu peux pas unmute, t\'as pas les permissions nécessaires',
        ],
        member: [
            '😂 Wsh frr tu veux unmute quelqu\'un ? T\'es qui toi ?',
            '💀 Mdr t\'as cru que tu pouvais unmute ? T\'es pas staff bg',
            '🤡 Frr tu veux faire le modérateur ? Va jouer ailleurs',
            '😭 Wsh t\'es pas staff, tu peux pas unmute personne mon reuf',
        ],
    },
    untimeout: {
        staff: [
            '😏 T\'as cru t\'as qui pour untimeout frr ? Retourne à tes études mon reuf',
            '😏 Wsh t\'as pas les droits pour untimeout quelqu\'un bg, va réviser',
            '😏 Frr tu peux pas untimeout, t\'as pas les permissions nécessaires',
        ],
        member: [
            '😂 Wsh frr tu veux untimeout quelqu\'un ? T\'es qui toi ?',
            '💀 Mdr t\'as cru que tu pouvais untimeout ? T\'es pas staff bg',
            '🤡 Frr tu veux faire le modérateur ? Va jouer ailleurs',
            '😭 Wsh t\'es pas staff, tu peux pas untimeout personne mon reuf',
        ],
    },
    wladd: {
        staff: [
            '😏 T\'as cru t\'as qui pour ajouter un rôle à la whitelist frr ? Retourne à tes études mon reuf',
            '😏 Wsh t\'as pas les droits pour gérer la whitelist bg, va réviser',
            '😏 Frr tu peux pas ajouter de rôle à la whitelist, t\'as pas les permissions',
        ],
        member: [
            '😂 Wsh frr tu veux gérer la whitelist ? T\'es qui toi ?',
            '💀 Mdr t\'as cru que tu pouvais ajouter des rôles ? T\'es pas staff bg',
            '🤡 Frr tu veux faire l\'admin ? Va jouer ailleurs',
            '😭 Wsh t\'es pas staff, tu peux pas toucher à la whitelist mon reuf',
            '💀 T\'as cru t\'étais qui pour gérer la whitelist ? Retourne jouer à Minecraft',
        ],
    },
    wlremove: {
        staff: [
            '😏 T\'as cru t\'as qui pour retirer un rôle de la whitelist frr ? Retourne à tes études mon reuf',
            '😏 Wsh t\'as pas les droits pour retirer un rôle de la whitelist bg, va réviser',
            '😏 Frr tu peux pas retirer de rôle de la whitelist, t\'as pas les permissions',
        ],
        member: [
            '😂 Wsh frr tu veux retirer un rôle de la whitelist ? T\'es qui toi ?',
            '💀 Mdr t\'as cru que tu pouvais retirer des rôles ? T\'es pas staff bg',
            '🤡 Frr tu veux faire l\'admin ? Va jouer ailleurs',
            '😭 Wsh t\'es pas staff, tu peux pas toucher à la whitelist mon reuf',
            '💀 T\'as cru t\'étais qui pour retirer des rôles ? Retourne jouer à Minecraft',
        ],
    },
    wllist: {
        staff: [
            '😏 T\'as cru t\'as qui pour voir la whitelist frr ? Retourne à tes études mon reuf',
            '😏 Wsh t\'as pas les droits pour voir la whitelist bg, va réviser',
            '😏 Frr tu peux pas voir la whitelist, t\'as pas les permissions nécessaires',
        ],
        member: [
            '😂 Wsh frr tu veux voir la whitelist ? T\'es qui toi ?',
            '💀 Mdr t\'as cru que tu pouvais voir la whitelist ? T\'es pas staff bg',
            '🤡 Frr tu veux faire l\'admin ? Va jouer ailleurs',
            '😭 Wsh t\'es pas staff, tu peux pas voir la whitelist mon reuf',
        ],
    },
    rulesmessage: {
        staff: [
            '😏 T\'as cru t\'as qui pour gérer les règles frr ? Retourne à tes études mon reuf',
            '😏 Wsh t\'as pas les droits pour envoyer les messages de règles bg',
            '😏 Frr tu peux pas gérer les règles, t\'as pas les permissions',
        ],
        member: [
            '😂 Wsh frr tu veux gérer les règles ? T\'es qui toi ?',
            '💀 Mdr t\'as cru que tu pouvais envoyer les règles ? T\'es pas staff bg',
            '🤡 Frr tu veux faire l\'admin ? Va jouer ailleurs',
        ],
    },
};

// Messages de refus pour channel
const wrongChannelMessages = {
    mute: [
        '💀 Wsh frr tu peux pas mute ici, va dans le channel punitions',
        '💀 Va te faire frr, le mute c\'est uniquement dans le channel punitions',
        '💀 Le dev il a dit non frr, mute que dans le channel punitions',
        '💀 C\'est mort frr, tu peux pas mute ici, va dans le channel punitions',
    ],
    timeout: [
        '💀 Wsh frr tu peux pas timeout ici, va dans le channel punitions',
        '💀 Va te faire frr, le timeout c\'est uniquement dans le channel punitions',
        '💀 Le dev il a dit non frr, timeout que dans le channel punitions',
        '💀 C\'est mort frr, tu peux pas timeout ici, va dans le channel punitions',
    ],
    unmute: [
        '💀 Wsh frr tu peux pas unmute ici, va dans le channel punitions',
        '💀 Va te faire frr, l\'unmute c\'est uniquement dans le channel punitions',
        '💀 Le dev il a dit non frr, unmute que dans le channel punitions',
        '💀 C\'est mort frr, tu peux pas unmute ici, va dans le channel punitions',
    ],
    untimeout: [
        '💀 Wsh frr tu peux pas untimeout ici, va dans le channel punitions',
        '💀 Va te faire frr, l\'untimeout c\'est uniquement dans le channel punitions',
        '💀 Le dev il a dit non frr, untimeout que dans le channel punitions',
        '💀 C\'est mort frr, tu peux pas untimeout ici, va dans le channel punitions',
    ],
    wladd: [
        '💀 Wsh frr tu peux pas ajouter un rôle à la whitelist ici, va dans le channel punitions',
        '💀 Va te faire frr, wladd c\'est uniquement dans le channel punitions',
        '💀 Le dev il a dit non frr, ajoute des rôles que dans le channel punitions',
        '💀 C\'est mort frr, tu peux pas gérer la whitelist ici, va dans le channel punitions',
    ],
    wlremove: [
        '💀 Wsh frr tu peux pas retirer un rôle de la whitelist ici, va dans le channel punitions',
        '💀 Va te faire frr, wlremove c\'est uniquement dans le channel punitions',
        '💀 Le dev il a dit non frr, retire des rôles que dans le channel punitions',
        '💀 C\'est mort frr, tu peux pas retirer de rôle de la whitelist ici, va dans le channel punitions',
    ],
    wllist: [
        '💀 Wsh frr tu peux pas voir la whitelist ici, va dans le channel punitions',
        '💀 Va te faire frr, wllist c\'est uniquement dans le channel punitions',
        '💀 Le dev il a dit non frr, regarde la whitelist que dans le channel punitions',
        '💀 C\'est mort frr, tu peux pas voir la whitelist ici, va dans le channel punitions',
    ],
};

// Messages de refus pour auto-sanction
const selfSanctionMessages = {
    mute: [
        '🤦‍♂️ Wsh t\'essaies de te mute toi-même frr ? Va falloir réfléchir 2 sec',
        '🤦‍♂️ Frr tu veux te mute toi-même ? C\'est pas logique bg',
        '🤦‍♂️ Wsh t\'es sérieux là ? Tu peux pas te mute toi-même mon reuf',
    ],
    timeout: [
        '🤦‍♂️ Wsh t\'essaies de te timeout toi-même frr ? Va falloir réfléchir 2 sec',
        '🤦‍♂️ Frr tu veux te timeout toi-même ? C\'est pas logique bg',
        '🤦‍♂️ Wsh t\'es sérieux là ? Tu peux pas te timeout toi-même mon reuf',
    ],
};

// Messages de refus pour bot
const botSanctionMessages = {
    mute: [
        '🧠 Frr tu veux mute le bot ? C\'est moi qui contrôle ici bg',
        '🧠 Wsh t\'essaies de mute le bot ? C\'est mort frr, j\'suis intouchable',
        '🧠 Frr tu peux pas mute le bot, c\'est moi le chef ici',
    ],
    timeout: [
        '🧠 Frr tu veux timeout le bot ? C\'est moi qui contrôle ici bg',
        '🧠 Wsh t\'essaies de timeout le bot ? C\'est mort frr, j\'suis intouchable',
        '🧠 Frr tu peux pas timeout le bot, c\'est moi le chef ici',
    ],
};

// Messages de refus pour hiérarchie
const hierarchyMessages = {
    mute: [
        '💀 Wsh t\'essaies de mute quelqu\'un de supérieur à toi ? Respecte la hiérarchie frr',
        '💀 Frr tu peux pas mute quelqu\'un qui est au-dessus de toi, respecte la hiérarchie',
        '💀 Wsh respecte la hiérarchie bg, tu peux pas mute quelqu\'un de supérieur',
        '💀 C\'est mort frr, tu peux pas mute quelqu\'un qui a un rang plus haut que toi',
    ],
    timeout: [
        '💀 Wsh t\'essaies de timeout quelqu\'un de supérieur à toi ? Respecte la hiérarchie frr',
        '💀 Frr tu peux pas timeout quelqu\'un qui est au-dessus de toi, respecte la hiérarchie',
        '💀 Wsh respecte la hiérarchie bg, tu peux pas timeout quelqu\'un de supérieur',
        '💀 C\'est mort frr, tu peux pas timeout quelqu\'un qui a un rang plus haut que toi',
    ],
};

// Messages user not found
const userNotFoundMessages = [
    '❌ Veuillez mentionner un utilisateur valide, frr.',
    '🤔 Qui est cette personne ? Je ne la trouve pas.',
    '🤷‍♂️ Mentionne quelqu\'un qui existe, bg.',
    '🚫 Utilisateur introuvable, essaie encore.',
    '👀 Je ne vois pas cette personne sur le serveur.',
];

// Messages invalid duration
const invalidDurationMessages = [
    '❌ Format de durée invalide. Utilise: `1m`, `5m`, `10m` (pour timeout) ou `10m`, `30m`, `1h` (pour mute)',
    '⏰ La durée que tu as mise n\'est pas bonne, frr.',
    '🤷‍♂️ Je ne comprends pas cette durée, essaie un format valide.',
    '🚫 Durée incorrecte, bg.',
    '⏱️ Vérifie le format de la durée, mon reuf.',
];

// Messages bot permission
const botPermissionMessages = [
    '❌ Je n\'ai pas les permissions nécessaires pour faire ça, frr.',
    '🤖 Je n\'ai pas les droits pour cette action, bg.',
    '🚫 Mes permissions ne me permettent pas de faire ça.',
    '🤷‍♂️ Demande à un admin de me donner les bonnes permissions, frr.',
    '🛑 Je suis bloqué, il me faut plus de permissions.',
];

// Messages role creation error
const roleCreationErrorMessages = [
    '❌ Impossible de créer le rôle Muted. Vérifie mes permissions, frr.',
    '🛠️ Je n\'arrive pas à créer le rôle, vérifie mes droits.',
    '🚫 Problème de création de rôle, permissions manquantes peut-être ?',
    '🤷‍♂️ Le rôle Muted n\'a pas pu être créé, bg.',
    '🛑 Je ne peux pas créer de rôle, il me faut la permission \'Gérer les rôles\'.',
];

// Messages invalid usage
const invalidUsageMessages = {
    mute: '❌ Utilisation: `&mute @user <durée> [raison]`\nExemple: `&mute @user 30m Spam`',
    timeout: '❌ Utilisation: `&timeout @user <durée> [raison]`\nExemple: `&timeout @user 5m Insultes`',
    unmute: '❌ Utilisation: `&unmute @user`\nExemple: `&unmute @user`',
    untimeout: '❌ Utilisation: `&untimeout @user`\nExemple: `&untimeout @user`',
    wladd: '❌ Utilisation: `&wladd @role`\nExemple: `&wladd @Modérateur`',
    wlremove: '❌ Utilisation: `&wlremove @role`\nExemple: `&wlremove @Modérateur`',
    wllist: '❌ Utilisation: `&wllist`',
};

// Messages already whitelisted
const alreadyWhitelistedMessages = (role) => [
    `🤦‍♂️ Wsh frr le rôle ${role} est déjà dans la whitelist, réfléchis 2 sec`,
    `🚫 Le rôle ${role} est déjà whitelisté, pas besoin de le rajouter.`,
    `🤔 Tu as déjà ajouté ${role} à la whitelist, bg.`,
    `🤷‍♂️ Ce rôle est déjà sur la liste blanche, frr.`,
];

// Messages not whitelisted
const notWhitelistedMessages = (role) => [
    `🤦‍♂️ Wsh frr le rôle ${role} n'est même pas dans la whitelist, réfléchis 2 sec`,
    `🚫 Le rôle ${role} n'est pas dans la whitelist, tu ne peux pas le retirer.`,
    `🤔 Ce rôle n'est pas sur la liste blanche, bg.`,
    `🤷‍♂️ Je ne trouve pas ${role} dans la whitelist, frr.`,
];

// Messages role not found
const roleNotFoundMessages = [
    '❌ Le rôle Muted n\'existe pas, frr.',
    '🤷‍♂️ Je ne trouve pas le rôle Muted, il a disparu ou quoi ?',
    '🚫 Le rôle Muted est introuvable, bg.',
    '🤔 Crée le rôle Muted d\'abord, mon reuf.',
];

// Messages not muted
const notMutedMessages = (user) => [
    `🤦‍♂️ Wsh frr ${user} n'est même pas muté, réfléchis 2 sec`,
    `😂 ${user} n'est pas muté, tu essaies de faire quoi là ?`,
    `🚫 ${user} est libre comme l'air, pas besoin de l'unmute.`,
    `🤷‍♂️ Cette personne n'est pas sous silence, frr.`,
];

// Messages not timeouted
const notTimeoutedMessages = (user) => [
    `🤦‍♂️ Wsh frr ${user} n'est même pas timeout, réfléchis 2 sec`,
    `😂 ${user} n'est pas timeout, tu essaies de faire quoi là ?`,
    `🚫 ${user} est libre comme l'air, pas besoin de l'untimeout.`,
    `🤷‍♂️ Cette personne n'est pas timeout, frr.`,
];

function getRandomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)];
}

function getRandomError() {
    return getRandomMessage(errorMessages);
}

function getRandomNoPermission(commandName, isStaff = false) {
    if (commandName && noPermissionMessages[commandName]) {
        const messages = isStaff ? noPermissionMessages[commandName].staff : noPermissionMessages[commandName].member;
        if (messages) {
            return getRandomMessage(messages);
        }
    }
    // Fallback générique si commande non spécifiée
    const allMessages = Object.values(noPermissionMessages).flatMap(cmd => 
        Object.values(cmd).flat()
    );
    return getRandomMessage(allMessages);
}

function getRandomWrongChannel(commandName) {
    if (commandName && wrongChannelMessages[commandName]) {
        return getRandomMessage(wrongChannelMessages[commandName]);
    }
    // Fallback générique si commande non spécifiée
    const allMessages = Object.values(wrongChannelMessages).flat();
    return getRandomMessage(allMessages);
}

function getRandomSelfSanction(commandName) {
    if (commandName && selfSanctionMessages[commandName]) {
        return getRandomMessage(selfSanctionMessages[commandName]);
    }
    // Fallback générique si commande non spécifiée
    const allMessages = Object.values(selfSanctionMessages).flat();
    return getRandomMessage(allMessages);
}

function getRandomBotSanction(commandName) {
    if (commandName && botSanctionMessages[commandName]) {
        return getRandomMessage(botSanctionMessages[commandName]);
    }
    // Fallback générique si commande non spécifiée
    const allMessages = Object.values(botSanctionMessages).flat();
    return getRandomMessage(allMessages);
}

function getRandomHierarchy(commandName) {
    if (commandName && hierarchyMessages[commandName]) {
        return getRandomMessage(hierarchyMessages[commandName]);
    }
    // Fallback générique si commande non spécifiée
    const allMessages = Object.values(hierarchyMessages).flat();
    return getRandomMessage(allMessages);
}

function getRandomUserNotFound() {
    return getRandomMessage(userNotFoundMessages);
}

function getRandomInvalidDuration() {
    return getRandomMessage(invalidDurationMessages);
}

function getRandomBotPermission() {
    return getRandomMessage(botPermissionMessages);
}

function getRandomRoleCreationError() {
    return getRandomMessage(roleCreationErrorMessages);
}

function getRandomInvalidUsage(commandName) {
    return invalidUsageMessages[commandName] || '❌ Utilisation invalide.';
}

function getRandomAlreadyWhitelisted(role) {
    return getRandomMessage(alreadyWhitelistedMessages(role));
}

function getRandomNotWhitelisted(role) {
    return getRandomMessage(notWhitelistedMessages(role));
}

function getRandomRoleNotFound() {
    return getRandomMessage(roleNotFoundMessages);
}

function getRandomNotMuted(user) {
    return getRandomMessage(notMutedMessages(user));
}

function getRandomNotTimeouted(user) {
    return getRandomMessage(notTimeoutedMessages(user));
}

module.exports = {
    getRandomError,
    getRandomNoPermission,
    getRandomWrongChannel,
    getRandomSelfSanction,
    getRandomBotSanction,
    getRandomHierarchy,
    getRandomUserNotFound,
    getRandomInvalidDuration,
    getRandomBotPermission,
    getRandomRoleCreationError,
    getRandomInvalidUsage,
    getRandomAlreadyWhitelisted,
    getRandomNotWhitelisted,
    getRandomRoleNotFound,
    getRandomNotMuted,
    getRandomNotTimeouted,
};
