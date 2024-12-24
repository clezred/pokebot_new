const { ActivityType } = require('discord.js');
const { getDiscordClient } = require('./discord-client');
const { random } = require('./utils');
const pkmGames = require('../config/pkmgames.json');

const customPresence = {
    activityType: ActivityType.Playing,
    activityName: 'Pokémon',
    status: 'online'
}

let isCustomPresence = false;

/**
 * Set the bot's presence
 * @param {ActivityType} activityType 
 * @param {String} activityName 
 * @param {String} status enum: ['online', 'idle', 'dnd', 'invisible']
 */
function setCustomPresence(activityType, activityName, status) {
    customPresence.activityType = activityType;
    customPresence.activityName = activityName;
    customPresence.status = status;
    isCustomPresence = true;
    updateBotPresence();
}

/**
 * Unset the custom presence
 */
function unsetCustomPresence() {
    isCustomPresence = false;
    updateBotPresence();
}

/**
 * Update the bot's presence
 */
async function updateBotPresence() {
    const discordClient = await getDiscordClient();
    if (isCustomPresence) {
        discordClient.user.setPresence({
            activities: [{
              name: customPresence.activityName,
              type: customPresence.activityType
            }],
            status: customPresence.status 
        });
    } else {
        const pkmGameActivityId = random(1, Object.keys(pkmGames).length);
        const pkmGameName = pkmGames[pkmGameActivityId];
        const activity = ActivityType.Playing;
        const status = 'online';

        discordClient.user.setPresence({
            activities: [{
            name: pkmGameName,
            type: activity
            }],
            status: status 
        });
    }
}

module.exports = {
    setCustomPresence,
    unsetCustomPresence,
    updateBotPresence
}

// Custom presence