const ids = require('../config/ids.json');

/**
 * Get current time in HH:MM format
 * @returns {String} current time in HH:MM format
 */
function getCurrentTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(2)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} | ${hours}:${minutes}`;
}

/**
 * Log info message
 * @param {String} txt 
 */
function logInfo(txt) {
    console.log(`[${getCurrentTime()}] info: ${txt}`);
}

/**
 * Log warning message
 * @param {String} txt 
 */
function logWarn(txt) {
    console.warn(`[${getCurrentTime()}] warn: ${txt}`);
}

/**
 * Log error message
 * @param {String} txt 
 */
function logError(txt) {
    console.error(`[${getCurrentTime()}] ERRO: ${txt}`)
}

/**
 * Transforms string duration into seconds
 * @param {string} duration
 * @returns {number} duration in seconds
 */
function formatDuration(duration) {
    const durationRegex = /(\d+)([smhdw])/g;
    const durationMap = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400,
        w: 604800
    };
    let totalSeconds = 0;
    let match;
    while ((match = durationRegex.exec(duration)) !== null) {
        const value = parseInt(match[1]);
        const unit = match[2];
        totalSeconds += value * durationMap[unit];
    }
    return totalSeconds;
}

/**
 * Transforms a number into a hex string
 * @param {number} n 
 * @returns {String} number as hex
 */
function intToHex(n) {
    return n.toString(16)
}

/**
 * Transforms a hex string into a number
 * @param {String} hex 
 * @returns {number} hex as number
 */
function hexToInt(hex) {
    return parseInt(hex, 16)
}

/**
 * Clear an object
 * @param {object} obj 
 */
function clear(obj) {
    for (const key in obj) {
        delete obj[key]
    }
}

/**
 * Generate a random number between min and max
 * @param {number} min The minimum number
 * @param {number} max The maximum number
 * @returns {number} The random number
 */
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Capitalize the first letter of a string
 * @param {String} str string to capitalize
 * @returns {String} string with first letter capitalized
 */
function upperFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { 
    getCurrentTime,
    logInfo,
    logWarn,
    logError,
    formatDuration,
    intToHex,
    hexToInt,
    clear,
    random,
    upperFirst
}
