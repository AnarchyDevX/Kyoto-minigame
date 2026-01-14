# Bot Discord Kyoto

Bot Discord de modération avec système de sanctions, whitelist et gestion des rôles.

## Fonctionnalités

- **Sanctions** : Mute, timeout, unmute, untimeout
- **Whitelist** : Gestion des rôles protégés
- **Messages personnalisés** : Messages trolls pour les membres, sérieux pour le staff
- **Permissions complètes** : Système de permissions pour utilisateurs spécifiques
- **Channel spécial** : Gestion automatique du channel smash-or-pass

## Installation

1. Clone le repository :
```bash
git clone [URL_DU_REPO]
cd bot-kyoto
```

2. Installe les dépendances :
```bash
npm install
```

3. Configure le bot :
   - Crée un fichier `.env` avec `TOKEN=ton_token_discord`
   - Modifie `src/config.js` selon tes besoins

4. Lance le bot :
```bash
npm start
```

## Commandes

- `&mute @user <durée> [raison]` - Mute un utilisateur
- `&timeout @user <durée> [raison]` - Timeout un utilisateur
- `&unmute @user` - Unmute un utilisateur
- `&untimeout @user` - Untimeout un utilisateur
- `&wladd @role` - Ajoute un rôle à la whitelist
- `&wlremove @role` - Retire un rôle de la whitelist
- `&wllist` - Liste les rôles dans la whitelist
- `&help` - Affiche l'aide

## Configuration

Modifie `src/config.js` pour configurer :
- IDs des channels
- IDs des rôles
- Durées maximales
- Utilisateurs avec permissions complètes

## Technologies

- Node.js
- Discord.js v14
- dotenv

## License

ISC
