const { getChannel, getGuild, getRole } = require("./discord-client");
const { logWarn } = require("./utils");
const ids = require('../config/ids.json');

async function sendMessage(channelId, message) {
    const channel = await getChannel(channelId);
    try {
        await channel.send(message);
        return true;
    } catch (error) {
        logWarn(`Failed to send message to channel ${channelId}: ${error}`);
        return false;
    }
}

function sendLogMessage(message) {
    sendMessage(ids.logsChannelId, message);
}

async function addRole(guildId, userId, roleId) {
    const guild = await getGuild(guildId);
    const member = await guild.members.fetch(userId);
    const role = await getRole(roleId, guildId);
    try {
        await member.roles.add(role);
        return true;
    } catch (error) {
        logWarn(`Failed to add role ${roleId} to user ${userId}: ${error}`);
        return false;
    }
}

async function removeRole(guildId, userId, roleId) {
    const guild = await getGuild(guildId);
    const member = await guild.members.fetch(userId);
    const role = await getRole(roleId, guildId);
    try {
        await member.roles.remove(role);
        return true;
    } catch (error) {
        logWarn(`Failed to remove role ${roleId} from user ${userId}: ${error}`);
        return false;
    }
}

module.exports = {
    sendMessage,
    sendLogMessage,
    addRole,
    removeRole
};