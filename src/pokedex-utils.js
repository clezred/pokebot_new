const typesJson = require('../config/types.json');
const { latinize } = require('./latinize');
const { subRequest, getPokemonSpecies } = require('./pokeapi-utils');
const pkmNamesLocales = require('../config/pkmnameslocales.json');
const { random, upperFirst } = require('./utils');
const { EmbedBuilder } = require('discord.js');


/**
 * Fonction pour obtenir l'embed pokédex correspondant
 * @param {number | String} id
 * @returns discord embed pokedex
 */
async function pokedexEmbed(id, isShiny = false) {

    if (isNaN(id)) {
        id = pkmNamesLocales[latinize(id.toLowerCase())];
    }

    const pokemonSpecies = await getPokemonSpecies(id);

    if (!pokemonSpecies) {
        return undefined;
    }

    const pokemon = await subRequest(pokemonSpecies.varieties.find(v => v.is_default).pokemon.url);
    const evolvesFromSpecies = pokemonSpecies.evolves_from_species ? await subRequest(pokemonSpecies.evolves_from_species.url) : null;

    const fullName = pokemonSpecies.names.find(n => n.language.name === 'fr').name;
    let genus = pokemonSpecies.genera.find(g => g.language.name === 'fr').genus;
    if (!genus.startsWith("Pokémon ")) genus = "Pokémon " + genus;
    const idText = pokemonSpecies.id.toString().padStart(4, '0');
    const isLegendary = pokemonSpecies.is_legendary;
    const isMythical = pokemonSpecies.is_mythical;
    const generation = pokemonSpecies.generation.url.split('/').slice(-2)[0];
    const weight = pokemon.weight / 10;
    const height = pokemon.height / 10;

    // Pokemon types
    const types = [];
    for (const type of pokemon.types) {
        types.push(await subRequest(type.type.url));
    }
    const mainType = types[0];
    const typesNames = types.map(t => t.names.find(n => n.language.name === 'fr').name);

    // Pokemon habitat
    const habitat = pokemonSpecies.habitat ? await subRequest(pokemonSpecies.habitat.url) : null;
    const habitatName = habitat ? upperFirst(habitat.names.find(n => n.language.name === 'fr').name) : "Inconnu";

    // Pokemon description
    let isFrenchDescription = true;
    let descriptions = pokemonSpecies.flavor_text_entries.filter(f => f.language.name === 'fr')
    if (descriptions.length === 0) {
        descriptions = pokemonSpecies.flavor_text_entries.filter(f => f.language.name === 'en')
        isFrenchDescription = false;
    };
    const description = descriptions[random(0, descriptions.length - 1)];
    const descriptionText = description.flavor_text.replace(/\n/g, ' ');
    const descriptionVersion = await subRequest(description.version.url);
    const descriptionVersionName = descriptionVersion.names.find(n => n.language.name === 'fr').name;

    // Pokemon species varieties
    const formsNames = [];
    for (const variety of pokemonSpecies.varieties) {
        const varietyPokemon = await subRequest(variety.pokemon.url);
        for (const form of varietyPokemon.forms) {
            const pokemonForm = await subRequest(form.url);
            const frName = pokemonForm.names.length > 0 ? pokemonForm.names.find(n => n.language.name === 'fr').name : fullName;
            formsNames.push(frName);
        }
    }

    const fullNameFix = fullName.replace(" ", "_"); // For pokepedia link

    const embed = new EmbedBuilder()
        .setAuthor({
            name: fullName + (isShiny ? " ✨" : ""), url: `https://www.pokepedia.fr/${fullNameFix}`, 
            iconURL: 'https://cdn.discordapp.com/attachments/1113867865314046112/1115285679727976469/pokedex_icon.png'
        })
        .setColor(parseInt(typesJson[mainType.name].color, 16))
        .setDescription(`*${genus} | N°${idText} | Génération ${generation}${isLegendary ? " | Légendaire" : ""}${isMythical ? " | Fabuleux" : ""}*\n*${height}m - ${weight}kg*`)
        .setThumbnail(isShiny ? pokemon.sprites.other['official-artwork'].front_shiny : pokemon.sprites.other['official-artwork'].front_default)
        .addFields([
            {
                name: "Type(s)",
                value: typesNames.join(' | '),
                inline: true
            },
            {
                name: "Chaîne d'évolution",
                value: evolvesFromSpecies ? `Évolution de ${evolvesFromSpecies.names.find(n => n.language.name === 'fr').name}` : "Pokémon de base",
                inline: true
            },
            {
                name: "Habitat",
                value: habitatName,
                inline: true
            },
            {
                name: "Description du Pokédex",
                value: descriptionText + `\n*(Pokémon ${descriptionVersionName}${isFrenchDescription ? ")" : " | Description indisponible en français)"}*`,
                inline: false
            }
        ])
        .setFooter({
            text: "Cliquez sur le nom du Pokémon pour accéder à sa page Poképédia",
            iconURL: 'https://www.pokepedia.fr/images/9/91/Crehelfpokepedia5.png'
        });

    if (pokemonSpecies.varieties.length > 1) {
        embed.addFields({
            name: "Formes",
            value: `Cette espèce de Pokémon possède ${pokemonSpecies.varieties.length} formes différentes\n*${formsNames.join(' | ')}*`,
            inline: false
        })
    }
    
    return embed;
}

module.exports = { 
    pokedexEmbed
}