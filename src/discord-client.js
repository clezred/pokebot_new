const { Client: DiscordClient, GatewayIntentBits, Guild, Channel, Role, Partials, Message } = require('discord.js');
const { logError } = require('./utils.js');
const ids = require('../config/ids.json');

let discordClientInstance;

const intents = [
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent
];

const partials = [
    Partials.Channel, 
    Partials.GuildMember,
    Partials.GuildScheduledEvent,
    Partials.Message,
    Partials.Reaction,
    Partials.ThreadMember,
    Partials.User
]

const guildId = ids.guildId;

/**
 * Get the discord client instance
 * @returns {Promise<DiscordClient>}
 */
async function getDiscordClient() {
    if (!discordClientInstance) {
        discordClientInstance = new DiscordClient({ intents: intents, partials: partials });
    }
    return discordClientInstance;
}

/**
 * Get a guild by its id
 * @param {String} guild_id The guild id
 * @returns {Promise<Guild> | undefined} The guild
 */
async function getGuild(guild_id = guildId) {
    const client = await getDiscordClient();
    try {
        const guild = await client.guilds.fetch(guild_id);
        return guild;
    } catch (err) {
        logError(err);
        return undefined;
    }
}

/**
 * Get a channel by its id
 * @param {String} channel_id The channel id
 * @returns {Promise<Channel> | undefined} The channel
 */
async function getChannel(channel_id, guild_id = undefined) {
    const client = await getDiscordClient();
    try {
        let channel;
        if (guild_id) {
            const guild = await getGuild(guild_id);
            channel = await guild.channels.fetch(channel_id);
        } else {
            channel = await client.channels.fetch(channel_id);
        }
        return channel;
    } catch (err) {
        logError(err);
        return undefined;
    }
}

/**
 * Get a role by its id
 * @param {String} role_id The role id 
 * @returns {Promise<Role> | undefined} The role
 */
async function getRole(role_id, guild_id = guildId) {
    const guild = await getGuild(guild_id);
    try {
        const role = await guild.roles.fetch(role_id);
        return role;
    } catch (err) {
        logError(err);
        return undefined;
    }
}

/**
 * Get a member by its id
 * @param {string} user_id The user id
 * @returns {Promise<GuildMember>} The member
 */
async function getMember(user_id, guild_id = guildId) {
    const guild = await getGuild(guild_id);
    try {
        const member = await guild.members.fetch(user_id);
        return member;
    } catch (err) {
        logError(err);
        return undefined;
    }
}

/**
 * Get a message by its id
 * @param {String} guild_id The guild id
 * @param {String} channel_id The channel id
 * @param {String} message_id The message id
 * @returns {Promise<Message> | undefined} The message
 */
async function getMessage(guild_id, channel_id, message_id) {
    const channel = await getChannel(channel_id, guild_id);
    try {
        const message = await channel.messages.fetch(message_id);
        return message;
    } catch (err) {
        logError(err);
        return undefined;
    }
}

async function stopClient() {
    const client = await getDiscordClient();
    await client.destroy();
    process.exit(0);
}

module.exports = {
    getDiscordClient,
    getGuild,
    getChannel,
    getRole,
    getMember,
    getMessage,
    stopClient
};
