const fs = require('node:fs');
const Papa = require('papaparse');
const rare = require('../json/rare.json');
const evotype = require('../json/evotype.json');
const typescolor = require('../json/typescolor.json')

var pokeliste = Papa.parse(fs.readFileSync('./assets/csv/pokeliste.csv', "utf-8"), {encoding: "utf-8"});

function pokedexID(pkID) {

    let pkm = pokeliste.data[pkID];
    let pkmRare = "";
    let pkmType = pkm[3];
    let typeStr = "Type";

    if (pkm[4] != "") {
        typeStr += 's';
        pkmType += " | " + pkm[4];
    }

    if (pkm[9] != "") {
        pkmRare = " | " + rare[pkm[9]];
    }

    let pkmFields = [
        {
            name: typeStr,
            value: pkmType,
            inline: true
        },
        {
            name: "Niveau d'évolution",
            value: pkm[7],
            inline: true
        },
        {
            name: "Description du Pokédex",
            value: pkm[8],
            inline: false
        }
    ]

    if (pkm[5] != "") {
        if (pkm[5] == '2') {
            pkmFields.push({
                name: evotype[pkm[5]][0],
                value: `Ce Pokémon peut Méga-évoluer pour devenir ${evotype[pkm[5]][2] + pkm[2]} X ou ${evotype[pkm[5]][2] + pkm[2]} Y`,
                inline: true
            })
        } else {
            pkmFields.push({
                name: evotype[pkm[5]][0],
                value: `Ce Pokémon peut ${evotype[pkm[5]][1]} pour devenir ${evotype[pkm[5]][2]+pkm[2]}`,
                inline: true
            })
        }
    }

    if (pkm[6] != "") {
        pkmFields.push({
            name: "Formes Alternatives",
            value: "Ce Pokémon possède " + pkm[6] + " formes alternatives (En prenant en compte la forme de base)",
            inline: false
        })
    }

    let pkmNameFix = pkm[2];

    if (pkmNameFix.includes(" ")) pkmNameFix = pkmNameFix.replace(" ", "_");

    let embed = {
        author: {
            name: pkm[2], 
            url: `https://www.pokepedia.fr/${pkmNameFix}`,
            iconURL: 'https://cdn.discordapp.com/attachments/940549449925668884/1114570590456651826/pokedex_icon.png'
        },
        color: parseInt(typescolor[pkm[3]], 16),
        description: `*Pokémon n°${pkm[0]} | Génération ${pkm[1] + pkmRare}*`,
        fields: pkmFields,
        footer: {text: "Cliquez sur le nom du Pokémon pour accéder à sa page Poképédia."}
    };

    return embed;
}

function pokedexName(name) {

    let i = 0;
    let found = false;
    while (i < pokeliste.data.length && !found) {
        if (name.toUpperCase() == pokeliste.data[i][2].toUpperCase()) {
            found = true;
        } else {
            i++;
        }
    }

    if (i > 905) return null;

    return pokedexID(i);
}

module.exports = { pokedexID, pokedexName };