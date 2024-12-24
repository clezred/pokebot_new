const { getDiscordClient, getGuild } = require("./discord-client");
const { sendLogMessage } = require("./discord-utils");
const { getAllNewsChannels } = require("./postgres-utils");
const { logError } = require("./utils");

/**
 * 
 * @param {Object} messageContent 
 */
async function sendNews(messageContent) {
    const discordClient = await getDiscordClient();
    await discordClient.guilds.fetch();

    const channels = await getAllNewsChannels();

    let count = 0;
    let errors = 0;
    const deleted_guilds = [];
    const deleted_channels = [];

    for (const channel of channels) {
        try {
            const guild = await getGuild(channel.guild_id);
            if (!guild) {
                errors++;
                if (!deleted_guilds.includes(channel.guild_id)) {
                    deleted_guilds.push(channel.guild_id);
                }
            } else {
                const ch = await guild.channels.fetch(channel.channel_id);
                if (!ch) {
                    errors++;
                    if (!deleted_channels.includes(channel.channel_id)) {
                        deleted_channels.push(channel.channel_id);
                    }
                } else {
                    await ch.send(messageContent);
                    count++;
                }
            }
        } catch (error) {
            logError(`Failed to send news to channel ${channel.channel_id} : ${error}`);
            errors++;
        }
    }

    if (deleted_guilds.length > 0) {
        for (const guildId of deleted_guilds) {
            try {
                await deleteGuildNewsChannels(guildId);
            } catch (error) {
                logError(`Failed to delete news channel(s) for guild ${guildId} : ${error}`);
            }
        }
    }

    if (deleted_channels.length > 0) {
        for (const channelId of deleted_channels) {
            try {
                await deleteNewsChannel(channelId);
            } catch (error) {
                logError(`Failed to delete news channel ${channelId} : ${error}`);
            }
        }
    }

    sendLogMessage(`News sent to ${count} channel(s). ${errors} error(s). ${deleted_guilds.length} deleted guild(s). ${deleted_channels.length} deleted channel(s).`);
}

module.exports = {
    sendNews
}