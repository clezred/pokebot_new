const axios = require('axios');
const { logInfo, logError, logWarn } = require('./utils.js');

const pokeapiUrl = 'https://pokeapi.co/api/v2';

/**
 * Get a pokemon by its name
 * @param {String} pokemon The pokemon name or id
 * @returns {Promise<Object> | undefined} The pokemon
 */
async function getPokemonSpecies(pokemon) {
    logInfo(`Getting pokemon species: ${pokemon}`);
    try {
        const response = await axios.get(`${pokeapiUrl}/pokemon-species/${pokemon}`);
        logInfo(`Got pokemon species: ${pokemon}`);
        return response.data;
    } catch (err) {
        logWarn(err);
        logWarn(`Failed to get pokemon species: ${pokemon}`);
        return undefined;
    }
}

/**
 * Get a pokemon by its name or id
 * @param {number | String} pokemon The pokemon name or id
 * @returns {Promise<Object> | undefined} The pokemon
 */
async function getPokemon(pokemon) {
    logInfo(`Getting pokemon: ${pokemon}`);
    try {
        const response = await axios.get(`${pokeapiUrl}/pokemon/${pokemon}`);
        logInfo(`Got pokemon: ${pokemon}`);
        return response.data;
    } catch (err) {
        logWarn(err);
        logWarn(`Failed to get pokemon: ${pokemon}`);
        return undefined;
    }
}

/**
 * Get a pokemon artwork
 * @param {number | String} pokemon The pokemon name or id
 * @param {boolean} shiny if the artwork is shiny
 * @returns {Promise<String> | undefined} The pokemon artwork
 */
async function getPokemonArtwork(pokemon, shiny = false) {
    logInfo(`Getting pokemon artwork: ${pokemon}`);
    try {
        const response = await axios.get(`${pokeapiUrl}/pokemon/${pokemon}`);
        logInfo(`Got pokemon artwork: ${pokemon}`);
        return shiny ? response.data.sprites.other['official-artwork'].front_shiny : response.data.sprites.other['official-artwork'].front_default;
    } catch (err) {
        logError(err);
        logError(`Failed to get pokemon artwork: ${pokemon}`);
        return undefined;
    }
}

/**
 * Get a sub request
 * @param {String} url The url of the request
 * @returns {Promise<Object> | undefined} The sub request
 */
async function subRequest(url) {
    logInfo(`Getting sub request: ${url}`);
    try {
        const response = await axios.get(url);
        logInfo(`Got sub request: ${url}`);
        return response.data;
    } catch (err) {
        logError(err);
        logError(`Failed to get sub request: ${url}`);
        return undefined;
    }
}

module.exports = {
    getPokemonSpecies,
    getPokemon,
    getPokemonArtwork,
    subRequest
}