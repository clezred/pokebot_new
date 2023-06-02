const pkmGames = require('../json/pkmgames.json');
const { random } = require('./random.js')

function gameActivity() {

    min = 1;
    max = 38;

    let rdm = random(min,max)

    return rdm;
}

module.exports = {gameActivity};