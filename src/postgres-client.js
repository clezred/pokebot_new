require('dotenv').config();
const { Client: PostgresClient } = require('pg');
const { logInfo, logWarn, logError } = require('./utils.js');

const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;

let postgresClientInstance;

/**
 * Get the postgres client instance
 * @returns {Promise<PostgresClient> | undefined} The postgres client instance
 */
async function getPostgresClient(dbHost = DB_HOST, dbPort = DB_PORT, dbName = DB_NAME, dbUser = DB_USER, dbPass = DB_PASS) {
    if (!postgresClientInstance) {
        logInfo('Creating postgres client instance');
        postgresClientInstance = new PostgresClient({
            user: dbUser,
            host: dbHost,
            database: dbName,
            password: dbPass,
            port: dbPort,
        });

        try {
            await postgresClientInstance.connect();
            logInfo('Connected to postgres');
        } catch (err) {
            logError(err);
            logError('Failed to connect to postgres');
            postgresClientInstance = undefined;
        }
    }
    return postgresClientInstance;
}

module.exports = {
    getPostgresClient
}
