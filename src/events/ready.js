const { shouldResetShop, forceResetShop, getTimeUntilNextReset } = require('../utils/shopRotatif');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        // bot is ready
        console.log(`✅ Bot connecté en tant que ${client.user.tag}!`);
        console.log(`📊 Servant ${client.guilds.cache.size} serveur(s)`);
        
        // Définir le statut du bot (watching)
        // Note: Discord ne permet les boutons cliquables que pour Twitch/YouTube en mode STREAMING
        // Pour une URL personnalisée, on utilise WATCHING qui affiche le lien dans le statut
        client.user.setPresence({
            activities: [{
                name: 'https://guns.lol/0xRynal',
                type: 3 // WATCHING
            }],
            status: 'online'
        });
        
        // Setup shop reset toutes les 2h
        setupShopReset();
    },
};

function setupShopReset() {
    // Vérifier immédiatement si un reset est nécessaire
    if (shouldResetShop()) {
        console.log('🔄 Reset initial du shop rotatif...');
        forceResetShop();
    }
    
    // Vérifier toutes les minutes si on doit reset
    setInterval(() => {
        if (shouldResetShop()) {
            console.log('🔄 Reset du shop rotatif (toutes les 2h)');
            forceResetShop();
        }
    }, 60 * 1000); // Vérifier toutes les minutes
    
    // Calculer le temps jusqu'au prochain reset (2h)
    const msUntilNextReset = getTimeUntilNextReset();
    
    // Programmer le reset exact dans 2h
    setTimeout(() => {
        console.log('🔄 Reset du shop rotatif (toutes les 2h)');
        forceResetShop();
        
        // Programmer les resets suivants (toutes les 2h)
        setInterval(() => {
            console.log('🔄 Reset du shop rotatif (toutes les 2h)');
            forceResetShop();
        }, 2 * 60 * 60 * 1000); // Toutes les 2h
    }, msUntilNextReset);
    
    const minutesUntilReset = Math.floor(msUntilNextReset / 1000 / 60);
    console.log(`⏰ Shop rotatif configuré - Prochain reset dans ${minutesUntilReset} minutes`);
}
