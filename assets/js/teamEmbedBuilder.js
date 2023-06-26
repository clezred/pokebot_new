const fs = require('node:fs');
const Papa = require('papaparse');

var pokeliste = Papa.parse(fs.readFileSync('./assets/csv/pokeliste.csv', "utf-8"), {encoding: "utf-8"});

function teamBuilder(pkIDs) {

    if (pkIDs.length != 6) {
        return null;
    } else {
        let pokemons = [];
        pkIDs.forEach(id => {
            pokemons.push(pokeliste.data[id])
        });

        let pkmFields = [];
        pokemons.forEach(pkm => {
            let pkmType = pkm[3];
            if (pkm[4] != "") {
                pkmType += " | " + pkm[4];
            }
            pkmFields.push({
                name: `${pkm[2]}`,
                value: pkmType,
                inline: true
            })
        });

        let embed = {
            author: {
                name: "Équipe Pokémon",
                iconURL: 'https://cdn.discordapp.com/attachments/1113867865314046112/1115285679727976469/pokedex_icon.png'
            },
            color: 0xFFFF00,
            description: "",
            fields: pkmFields
        }
        return embed;
    }
}

module.exports = { teamBuilder };