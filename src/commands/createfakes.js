const { getAllUsers, updateUser } = require('../utils/game');

module.exports = {
    data: {
        name: 'createfakes',
    },
    async execute(message, args) {
        // Only allow full permissions user
        const { hasFullPermissions } = require('../utils/whitelist');
        if (!hasFullPermissions(message.author.id)) {
            return message.reply('❌ Tu n\'as pas la permission d\'utiliser cette commande.');
        }
        
        try {
            const allUsers = getAllUsers();
            let created = 0;
            
            const fakeUsernames = [
                'AlphaGamer', 'BetaWarrior', 'GammaKiller', 'DeltaMaster', 'EpsilonPro',
                'ZetaElite', 'EtaChampion', 'ThetaLegend', 'IotaHero', 'KappaNinja',
                'LambdaBeast', 'MuDestroyer', 'NuSlayer', 'XiHunter', 'OmicronKing',
                'PiWarrior', 'RhoFighter', 'SigmaElite', 'TauMaster', 'UpsilonPro',
                'PhiChampion', 'ChiLegend', 'PsiHero', 'OmegaNinja', 'AceGamer',
                'BladeWarrior', 'CrimsonKiller', 'DarkMaster', 'ElitePro', 'FrostChampion',
                'GhostLegend', 'HunterHero', 'IronNinja', 'JadeBeast', 'KnightDestroyer',
                'LunarSlayer', 'MysticHunter', 'NovaKing', 'OnyxWarrior', 'PhantomFighter',
                'QuantumElite', 'RavenMaster', 'ShadowPro', 'ThunderChampion', 'VortexLegend',
                'WildHero', 'XenoNinja', 'YukiBeast', 'ZephyrDestroyer', 'AuroraSlayer',
                'BlazeHunter', 'CrystalKing', 'DragonWarrior', 'EchoFighter', 'FlameElite',
                'GlacierMaster', 'HavocPro', 'InfernoChampion', 'JadeLegend', 'KarmaHero',
                'LunaNinja', 'MirageBeast', 'NexusDestroyer', 'OblivionSlayer', 'PhoenixHunter',
                'QuasarKing', 'RiftWarrior', 'StormFighter', 'TitanElite', 'UmbraMaster',
                'VoidPro', 'WraithChampion', 'XenonLegend', 'YmirHero', 'ZeusNinja',
                'ApexBeast', 'BoltDestroyer', 'CinderSlayer', 'DoomHunter', 'EclipseKing',
                'FuryWarrior', 'GaleFighter', 'HazeElite', 'IrisMaster', 'JoltPro',
                'KrakenChampion', 'LuxLegend', 'MythHero', 'NyxNinja', 'OrionBeast',
                'PulseDestroyer', 'QuakeSlayer', 'RageHunter', 'SageKing', 'TideWarrior',
                'UrgeFighter', 'VexElite', 'WispMaster', 'XenPro', 'YawnChampion',
                'ZestLegend', 'AuraHero', 'BoltNinja', 'CoreBeast', 'DashDestroyer',
                'EchoSlayer', 'FlameHunter', 'GlowKing', 'HazeWarrior', 'IceFighter'
            ];
            
            for (let i = 0; i < 120; i++) {
                const fakeUserId = `999999999999999${String(i).padStart(3, '0')}`;
                // Generate coins with more variety (some very high, some low)
                const coins = i < 10 
                    ? Math.floor(Math.random() * 50000) + 40000  // Top 10 have high coins
                    : i < 30
                    ? Math.floor(Math.random() * 20000) + 20000  // Next 20 have medium-high
                    : i < 60
                    ? Math.floor(Math.random() * 15000) + 10000  // Next 30 have medium
                    : Math.floor(Math.random() * 10000) + 1000;  // Rest have lower
                
                const wins = Math.floor(Math.random() * 100);
                const losses = Math.floor(Math.random() * 50);
                const totalCoinsWon = Math.floor(Math.random() * 100000) + coins;
                
                const fakeUser = {
                    username: fakeUsernames[i] || `Joueur_${String(i).padStart(3, '0')}`,
                    coins: coins,
                    keys: {
                        bois: Math.floor(Math.random() * 10),
                        argent: Math.floor(Math.random() * 5),
                        or: Math.floor(Math.random() * 3),
                        demoniaque: Math.floor(Math.random() * 2),
                    },
                    items: [],
                    stats: {
                        wins: wins,
                        losses: losses,
                        totalCoinsWon: totalCoinsWon,
                    },
                    bonuses: {
                        multiplier: 1,
                        chanceBoost: 0,
                        damageBoost: 0,
                        expiresAt: null,
                    },
                };
                
                allUsers[fakeUserId] = fakeUser;
                created++;
            }
            
            // Save all users
            const fs = require('fs');
            const path = require('path');
            const usersPath = path.join(__dirname, '..', 'data', 'users.json');
            fs.writeFileSync(usersPath, JSON.stringify(allUsers, null, 2), 'utf8');
            
            await message.reply(`✅ ${created} utilisateurs fictifs créés avec succès !\nTu peux maintenant tester \`$classement\` avec la pagination.`);
        } catch (error) {
            console.error('Erreur lors de la création des utilisateurs fictifs:', error);
            message.reply('❌ Une erreur s\'est produite.');
        }
    },
};
