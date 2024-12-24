const { updateCommandStatus, addCommandStatus, getAllCommandStatus } = require('./postgres-utils');
const { clear } = require('./utils');

const commands = {}
let commandsStatusUpdated = true;

async function getCommands() {
    if (commandsStatusUpdated) await retreiveCommands();
    return commands;
}

function setCommandsStatusUpdated(updated) {
    commandsStatusUpdated = updated;
}

async function retreiveCommands() {
    const rows = await getAllCommandStatus();
    clear(commands);
    for (const row of rows) {
        commands[row.command_name] = {
            command_name: row.command_name,
            is_enabled: row.is_enabled,
            reason: row.reason
        }
    }
    setCommandsStatusUpdated(false);
}

async function updateCommandStatusInDB(commandName, isEnabled, reason) {
    const now = new Date();
    const commands = await getCommands();
    if (!commands[commandName]) {
        await addCommandStatus(commandName, isEnabled, reason, now.toISOString());
    } else {
        await updateCommandStatus(commandName, isEnabled, reason, now.toISOString());
    }
    setCommandsStatusUpdated(true);
}

module.exports = {
    getCommands,
    setCommandsStatusUpdated,
    retreiveCommands,
    updateCommandStatusInDB
}