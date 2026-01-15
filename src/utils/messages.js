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

function getRandomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)];
}

function getRandomError() {
    return getRandomMessage(errorMessages);
}

module.exports = {
    getRandomError,
};
