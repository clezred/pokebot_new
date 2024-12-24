/**
 * Returns a latinized string
 * @param {String} str 
 * @returns {String} latinized string
 */
function latinize(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}

module.exports = {
    latinize
}