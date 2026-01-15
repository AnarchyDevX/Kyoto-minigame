const { shouldResetShop, forceResetShop } = require('../utils/shopRotatif');

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
        
        // Setup daily shop reset at midnight
        setupDailyShopReset();
    },
};

function setupDailyShopReset() {
    // Vérifier immédiatement si un reset est nécessaire
    if (shouldResetShop()) {
        console.log('🔄 Reset initial du shop rotatif...');
        forceResetShop();
    }
    
    // Vérifier toutes les minutes si on doit reset
    setInterval(() => {
        if (shouldResetShop()) {
            console.log('🔄 Reset quotidien du shop rotatif à minuit');
            forceResetShop();
        }
    }, 60 * 1000); // Vérifier toutes les minutes
    
    // Calculer le temps jusqu'à minuit pour le prochain reset
    const now = new Date();
    const tomorrowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const msUntilMidnight = tomorrowMidnight - now;
    
    // Programmer le reset exact à minuit
    setTimeout(() => {
        console.log('🔄 Reset quotidien du shop rotatif à minuit');
        forceResetShop();
        
        // Programmer le reset suivant (24h après)
        setInterval(() => {
            console.log('🔄 Reset quotidien du shop rotatif à minuit');
            forceResetShop();
        }, 24 * 60 * 60 * 1000); // Toutes les 24h
    }, msUntilMidnight);
    
    console.log(`⏰ Shop rotatif configuré - Prochain reset dans ${Math.floor(msUntilMidnight / 1000 / 60)} minutes`);
}
