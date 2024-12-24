const { getPostgresClient } = require("./postgres-client");
const { logInfo } = require("./utils");

/**
 * Fetch all rows from a table
 * @param {string} tableName 
 * @returns {Promise<Array>} rows
 * @throws {Error} if failed to get postgres client
 */
async function getAll(tableName) {
    const postgresClient = await getPostgresClient();
    if (!postgresClient) {
        throw new Error("Failed to get postgres client");
    }
    const query = `SELECT * FROM ${tableName};`;
    const result = await postgresClient.query(query);
    logInfo(`Fetched ${result.rowCount} rows from ${tableName}`);
    return result.rows;
}

/**
 * Fetch all rows from the role_reactions table
 * @returns {Promise<Array>} rows
 * @throws {Error} if failed to get postgres client
 */
async function getAllRoleReactionRecords() {
    return getAll("role_reactions");
}

/**
 * Add a row to the role_reactions table
 * @param {String} guildId the guild id
 * @param {String} channelId the channel id
 * @param {String} messageId the message id
 * @param {String} reactionsRoles JSON stringified array of objects
 * @param {number} maxReactions max number of reactions allowed per user
 * @param {String} createdAt ISO Date string
 * @returns {Promise<void>}
 * @throws {Error} if failed to get postgres client
 */
async function addRoleReactionRecord(guildId, channelId, messageId, reactionsRoles, maxReactions, createdAt) {
    const postgresClient = await getPostgresClient();
    if (!postgresClient) {
        throw new Error("Failed to get postgres client");
    }
    const query = `INSERT INTO role_reactions (message_id, guild_id, channel_id, reactions_roles, max_reactions, created_at) VALUES ($1, $2, $3, $4, $5, $6);`; 
    const res = await postgresClient.query(query, [messageId, guildId, channelId, reactionsRoles, maxReactions, createdAt]);
    logInfo(`Inserted ${res.rowCount} row into role_reactions`);
}

/**
 * Delete a row from the role_reactions table and all related rows from the given_role_reactions table
 * @param {String} messageId
 */
async function deleteRoleReactionRecord(messageId) {
    const postgresClient = await getPostgresClient();
    if (!postgresClient) {
        throw new Error("Failed to get postgres client");
    }
    const query = `DELETE FROM role_reactions WHERE message_id = $1;`;
    let res = await postgresClient.query(query, [messageId]);
    logInfo(`Deleted ${res.rowCount} rows from role_reactions`);
    const subquery = `DELETE FROM given_role_reactions WHERE message_id = $1;`;
    res = await postgresClient.query(subquery, [messageId]);
    logInfo(`Deleted ${res.rowCount} rows from given_role_reactions`);
}

/**
 * Fetch all rows from the given_role_reactions table
 * @returns {Promise<Array>} rows
 * @throws {Error} if failed to get postgres client
 */
async function getAllGivenRoleReactionsRecords() {
    return getAll("given_role_reactions");
}

/**
 * Add a row to the given_role_reactions table
 * @param {String} messageId the message id
 * @param {String} channelId the channel id
 * @param {String} guildId the guild id
 * @param {String} userId the user id
 * @param {String} roleId the role id
 * @param {String} givenAt ISO Date string
 * @returns {Promise<void>}
 * @throws {Error} if failed to get postgres client
 */
async function addGivenRoleReactionRecord(messageId, channelId, guildId, userId, roleId, givenAt) {
    const postgresClient = await getPostgresClient();
    if (!postgresClient) {
        throw new Error("Failed to get postgres client");
    }
    const query = `INSERT INTO given_role_reactions (message_id, channel_id, guild_id, user_id, role_id, given_at) VALUES ($1, $2, $3, $4, $5, $6);`;
    const res = await postgresClient.query(query, [messageId, channelId, guildId, userId, roleId, givenAt]);
    logInfo(`Inserted ${res.rowCount} row into given_role_reactions`);
}

/**
 * Delete a row from the given_role_reactions table
 * @param {String} messageId the message id
 * @param {String} userId the user id
 * @param {String} roleId the role id
 * @returns {Promise<void>}
 * @throws {Error} if failed to get postgres client
 */
async function deleteGivenRoleReactionRecord(messageId, userId, roleId) {
    const postgresClient = await getPostgresClient();
    if (!postgresClient) {
        throw new Error("Failed to get postgres client");
    }
    const query = `DELETE FROM given_role_reactions WHERE message_id = $1 AND user_id = $2 AND role_id = $3;`;
    const res = await postgresClient.query(query, [messageId, userId, roleId]);
    logInfo(`Deleted ${res.rowCount} rows from given_role_reactions`);  
}

/**
 * Fetch all rows from the news_channels table
 * @returns {Promise<Array>} rows
 * @throws {Error} if failed to get postgres client
 */
async function getAllNewsChannels() {
    return getAll("news_channels");
}

/**
 * Fetch all rows from the news_channels table with the given guildId
 * @param {String} guildId 
 * @returns {Promise<Array>} rows
 */
async function getGuildNewsChannels(guildId) {
    const postgresClient = await getPostgresClient();
    if (!postgresClient) {
        throw new Error("Failed to get postgres client");
    }
    const query = `SELECT * FROM news_channels WHERE guild_id = $1;`;
    const result = await postgresClient.query(query, [guildId]);
    logInfo(`Fetched ${result.rowCount} rows from news_channels with guild_id ${guildId}`);
    return result.rows;
}

/**
 * Add a row to the news_channels table
 * @param {String} guildId 
 * @param {String} channelId 
 * @param {String} since 
 */
async function addNewsChannel(guildId, channelId, since) {
    const postgresClient = await getPostgresClient();
    if (!postgresClient) {
        throw new Error("Failed to get postgres client");
    }
    const query = `INSERT INTO news_channels (guild_id, channel_id, since) VALUES ($1, $2, $3);`;
    const res = await postgresClient.query(query, [guildId, channelId, since]);
    logInfo(`Inserted ${res.rowCount} row into news_channels`);
}

/**
 * Delete a row from the news_channels table
 * @param {String} guildId 
 * @param {String} channelId 
 */
async function deleteNewsChannel(guildId, channelId) {
    const postgresClient = await getPostgresClient();
    if (!postgresClient) {
        throw new Error("Failed to get postgres client");
    }
    const query = `DELETE FROM news_channels WHERE guild_id = $1 AND channel_id = $2;`;
    const res = await postgresClient.query(query, [guildId, channelId]);
    logInfo(`Deleted ${res.rowCount} rows from news_channels`);
}

/**
 * Delete all rows from the news_channels table with the given guildId
 * @param {String} guildId 
 */
async function deleteGuildNewsChannels(guildId) {
    const postgresClient = await getPostgresClient();
    if (!postgresClient) {
        throw new Error("Failed to get postgres client");
    }
    const query = `DELETE FROM news_channels WHERE guild_id = $1;`;
    const res = await postgresClient.query(query, [guildId]);
    logInfo(`Deleted ${res.rowCount} rows from news_channels`);
}

/**
 * Fetch all rows from the members_pokemons table
 * @returns {Promise<Array>} rows
 * @throws {Error} if failed to get postgres client
 */
async function getAllMembersPokemons() {
    return getAll("members_pokemons");
}

/**
 * Fetch the row from the members_pokemons table with the given guildId and userId
 * @param {String} guildId the guild id
 * @param {String} userId the user id
 * @returns {Promise<Array>} rows
 * @throws {Error} if failed to get postgres client
 */
async function getMembersPokemon(guildId, userId) {
    const postgresClient = await getPostgresClient();
    if (!postgresClient) {
        throw new Error("Failed to get postgres client");
    }
    const query = `SELECT * FROM members_pokemons WHERE guild_id = $1 AND user_id = $2;`;
    const result = await postgresClient.query(query, [guildId, userId]);
    logInfo(`Fetched ${result.rowCount} rows from members_pokemons with guild_id ${guildId} and user_id ${userId}`);
    return result.rows;
}

/**
 * Add a row to the members_pokemons table
 * @param {String} guildId the guild id
 * @param {String} userId the user id
 * @param {number} pokemonId the pokemon id
 * @param {boolean} isShiny whether the pokemon is shiny
 * @param {String} updatedAt ISO Date string
 * @returns {Promise<void>}
 * @throws {Error} if failed to get postgres client
 */
async function addMembersPokemon(guildId, userId, pokemonId, isShiny, updatedAt) {
    const postgresClient = await getPostgresClient();
    if (!postgresClient) {
        throw new Error("Failed to get postgres client");
    }
    const query = `INSERT INTO members_pokemons (guild_id, user_id, pokemon_id, is_shiny, updated_at) VALUES ($1, $2, $3, $4, $5);`;
    const res = await postgresClient.query(query, [guildId, userId, pokemonId, isShiny, updatedAt]);
    logInfo(`Inserted ${res.rowCount} row into members_pokemons`);
}

/**
 * Update the row in the members_pokemons table with the given guildId and userId
 * @param {String} guildId the guild id
 * @param {String} userId the user id
 * @param {number} pokemonId the pokemon id
 * @param {boolean} isShiny whether the pokemon is shiny
 * @param {String} updatedAt ISO Date string
 */
async function updateMembersPokemon(guildId, userId, pokemonId, isShiny, updatedAt) {
    const postgresClient = await getPostgresClient();
    if (!postgresClient) {
        throw new Error("Failed to get postgres client");
    }
    const query = `UPDATE members_pokemons SET pokemon_id = $3, is_shiny = $4, updated_at = $5 WHERE guild_id = $1 AND user_id = $2;`;
    const res = await postgresClient.query(query, [guildId, userId, pokemonId, isShiny, updatedAt]);
    logInfo(`Updated ${res.rowCount} row in members_pokemons`);
}

/**
 * Fetch all rows from the commands_status table
 * @returns {Promise<Array>} rows
 */
async function getAllCommandStatus() {
    return getAll("commands_status");
}

/**
 * Add a row to the commands_status table
 * @param {String} commandName 
 * @param {Boolean} isEnabled 
 * @param {String} reason 
 * @param {String} updatedAt 
 */
async function addCommandStatus(commandName, isEnabled, reason, updatedAt) {
    const postgresClient = await getPostgresClient();
    if (!postgresClient) {
        throw new Error("Failed to get postgres client");
    }
    const query = `INSERT INTO commands_status (command_name, is_enabled, reason, updated_at) VALUES ($1, $2, $3, $4);`;
    const res = await postgresClient.query(query, [commandName, isEnabled, reason, updatedAt]);
    logInfo(`Inserted ${res.rowCount} row into commands_status`);
}

/**
 * Update the row in the commands_status table with the given commandName
 * @param {String} commandName 
 * @param {Boolean} isEnabled 
 * @param {String} reason 
 * @param {String} updatedAt 
 */
async function updateCommandStatus(commandName, isEnabled, reason, updatedAt) {
    const postgresClient = await getPostgresClient();
    if (!postgresClient) {
        throw new Error("Failed to get postgres client");
    }
    const query = `UPDATE commands_status SET is_enabled = $2, reason = $3, updated_at = $4 WHERE command_name = $1;`;
    const res = await postgresClient.query(query, [commandName, isEnabled, reason, updatedAt]);
    logInfo(`Updated ${res.rowCount} row in commands_status`);
}

module.exports = {
    getAllRoleReactionRecords,
    addRoleReactionRecord,
    deleteRoleReactionRecord,
    getAllGivenRoleReactionsRecords,
    addGivenRoleReactionRecord,
    deleteGivenRoleReactionRecord,
    getAllNewsChannels,
    getGuildNewsChannels,
    addNewsChannel,
    deleteNewsChannel,
    deleteGuildNewsChannels,
    getAllMembersPokemons,
    getMembersPokemon,
    addMembersPokemon,
    updateMembersPokemon,
    getAllCommandStatus,
    addCommandStatus,
    updateCommandStatus
}