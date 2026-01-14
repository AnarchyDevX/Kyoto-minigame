module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        // bot is ready
        console.log(`✅ Bot connecté en tant que ${client.user.tag}!`);
        console.log(`📊 Servant ${client.guilds.cache.size} serveur(s)`);
    },
};
