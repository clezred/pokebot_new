const { getDiscordClient, getChannel } = require("./discord-client");
const ids = require('../config/ids.json');

let guilds;

/**
 * Updates the stats of the bot
 * @throws {Error} if the discord client could not be retrieved
 * @throws {Error} if the server count channel could not be retrieved
 */
async function updateStats() {
    const discordClient = await getDiscordClient();
    if (!discordClient) {
        throw new Error("Failed to get discord client");
    }
    await discordClient.guilds.fetch();
    guilds = discordClient.guilds.cache;
    const serverCountChannel = await getChannel(ids.serverCountChannelId);
    if (!serverCountChannel) {
        throw new Error("Failed to get server count channel");
    }
    serverCountChannel.setName('🌐 ' + guilds.size + ' Serveurs').catch(console.error)
}

module.exports = { 
    updateStats
};