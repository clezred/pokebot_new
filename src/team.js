const { EmbedBuilder, Collection } = require("discord.js");
const { getPokemonSpecies, subRequest } = require("./pokeapi-utils");
const { random } = require("./utils");

/**
 * Fonction pour obtenir un embed d'une equipe Pokémon
 * @param {number[]} pkIDs 
 * @returns {Promise<EmbedBuilder | undefined>} discord embed team
 */
async function team(pkIDs) {

    if (pkIDs.length != 6) return;
    
    const pokemons = [];
    for (const id of pkIDs) {
        const pkmSpecies = await getPokemonSpecies(id);
        const pkm = await subRequest(pkmSpecies.varieties[random(0, pkmSpecies.varieties.length - 1)].pokemon.url);
        pokemons.push(pkm);
    }

    const pkmTypes = new Collection();
    for (const pkm of pokemons) {
        const types = [];
        for (const type of pkm.types) {
            if (!types.includes(type.type.name)) {
                const pkmtype = await subRequest(type.type.url)
                types.push(pkmtype.names.find(n => n.language.name === 'fr').name);
            }
        }
        pkmTypes.set(pkm.name, types.join(' | '));
    }
    
    const pkmNames = new Collection();
    for (const pkm of pokemons) {
        const is_shiny = random(1, 4096) === 1;
        if (pkm.is_default) {
            const species = await subRequest(pkm.species.url);
            pkmNames.set(pkm.name, species.names.find(n => n.language.name === 'fr').name + (is_shiny ? '✨' : ''));
        } else {
            const form = await subRequest(pkm.forms[random(0, pkm.forms.length - 1)].url)
            pkmNames.set(pkm.name, form.names.find(n => n.language.name === 'fr').name + (is_shiny ? '✨' : ''));
        }
        
    }

    const pkmFields = [];
    for (const pkm of pokemons) {
        pkmFields.push({
            name: pkmNames.get(pkm.name),
            value: pkmTypes.get(pkm.name),
            inline: true
        })
    }

    const embed = new EmbedBuilder()
        .setAuthor({
            name: "Équipe de ",
            iconURL: 'https://cdn.discordapp.com/attachments/1113867865314046112/1115285679727976469/pokedex_icon.png'
        })
        .setColor(0xFFFF00)
        .addFields(pkmFields)
    
    return embed;
}

module.exports = { team };