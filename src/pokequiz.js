/*
POKEQUIZ

Principe :
- Le bot choisit un Pokémon aléatoire
- Le bot commence par donner la description 
  du Pokédex du Pokémon (censurée)
- Le bot peut donner des indices sur le Pokémon 
  à deviner au fur et à mesure de la partie (1 indice / minute)

Difficulté :
- Facile      | 4 indices    | 5 minutes   | Pas de limite d'essais
- Moyen       | 2 indices    | 3 minutes   | Pas de limite d'essais
- Difficile   | 1 indice     | 2 minutes   | 10 essais
- Expert      | Pas d'indice | 1 minute    | 3 essais
- Impossible  | Pas d'indice | 30 secondes | 1 essai

Indices :
1. Type(s) du Pokémon
2. Génération du Pokémon
3. Initiale du nom du Pokémon 
4. Artwork du Pokémon
*/

const { ButtonBuilder, ButtonStyle, EmbedBuilder, User, MessageCollector, TextChannel, ComponentType, ActionRowBuilder, ChannelType} = require("discord.js");
const { getPokemon, subRequest, getPokemonSpecies } = require("./pokeapi-utils");
const difficulties = require("../config/gamedifficulty.json");
const gen = require("../config/genpkid.json");
const { sendLogMessage } = require("./discord-utils");
const { random } = require("./utils");
const { latinize } = require("./latinize");
const { pokedexEmbed } = require("./pokedex-utils");

/**
 * A Pokequiz game
 * @param {TextChannel} channel 
 * @param {User} player
 * @param {number} generation
 * @param {String} difficulty 
 */
async function pokequiz(channel, player, generation, difficulty) {
    const minId = gen[generation][0];
    const maxId = gen[generation][1];

    let pkmId;
    let pokemonSpecies;
    let pokemonToGuess;
    let descriptionText;

    while (!descriptionText) {
        pkmId = random(minId, maxId);

        pokemonSpecies = await getPokemonSpecies(pkmId);
        pokemonToGuess = await subRequest(pokemonSpecies.varieties.find(v => v.is_default).pokemon.url);

        const descriptions = pokemonSpecies.flavor_text_entries.filter(f => f.language.name === 'fr')
        const description = descriptions.length > 0 ? descriptions[random(0, descriptions.length - 1)] : null;
        descriptionText = description ? description.flavor_text.replace(/\n/g, ' ') : null;
    }

    sendLogMessage(`Command : \`pokequiz\` | Player : \`${player.username}\` | Difficulty : \`${difficulty}\` | Pokemon : \`${pokemonToGuess.name}\` | ChannelType : \`${Object.keys(ChannelType).find(key => ChannelType[key] === channel.type)}\``);

    let found = false;
    let tries = 0;
    let hintsCount = 0;
    let unlockedHintsCount = 0;

    const typeHintLabel = "Type(s)";
    const genusHintLabel = "Catégorie";
    const initialHintLabel = "Initiale";
    const artworkHintLabel = "Artwork";

    const fullName = pokemonSpecies.names.find(n => n.language.name === 'fr').name;
    const fixedFullName = latinize(fullName.toLowerCase());

    descriptionText = descriptionText.replace(fullName, '???');

    const types = [];
    for (const type of pokemonToGuess.types) {
        types.push(await subRequest(type.type.url));
    }
    const typesNames = types.map(t => t.names.find(n => n.language.name === 'fr').name);
    const typesText = typesNames.join(' | ');

    const genus = pokemonSpecies.genera.find(g => g.language.name === 'fr').genus;

    const artworkUrl = pokemonToGuess.sprites.other['official-artwork'].front_default;

    const typeHintButton = new ButtonBuilder()
        .setCustomId('type')
        .setLabel(typeHintLabel)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
    
    const genusHintButton = new ButtonBuilder()
        .setCustomId('genus')
        .setLabel(genusHintLabel)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
    
    const initialHintButton = new ButtonBuilder()
        .setCustomId('initial')
        .setLabel(initialHintLabel)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
    
    const artworkHintButton = new ButtonBuilder()
        .setCustomId('artwork')
        .setLabel(artworkHintLabel)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
    
    const surrenderButton = new ButtonBuilder()
        .setCustomId('surrender')
        .setLabel('Abandonner')
        .setStyle(ButtonStyle.Danger);
    
    const hintButtons = [typeHintButton, genusHintButton, initialHintButton, artworkHintButton];

    const buttons = [];
    if (difficulties[difficulty].hints > 0) {
        for (let i = 0; i < difficulties[difficulty].hints; i++) {
            buttons.push(hintButtons[i]);
        }
    }

    buttons.push(surrenderButton);

    const buttonsRow = new ActionRowBuilder()
        .addComponents(buttons);

    const hintFields = [
        {
            name: "Description du Pokédex",
            value: descriptionText,
            inline: false
        }
    ];
    
    const embed = new EmbedBuilder()
        .setTitle(`PokéQuiz du ${difficulties[difficulty].name}`)
        .setDescription(`*Retrouvez le nom du Pokémon correspondant à la description ci-dessous et utilisez les boutons pour obtenir plus d'indices !*\n Termine ${`<t:${Math.floor(Date.now() / 1000) + Math.ceil(difficulties[difficulty].time / 1000)}:R>`}` )
        .setColor(0xFFFF00)
        .setFields(hintFields)
        .setFooter({
            text: "Partie démarrée par " + player.username
        })
        .setTimestamp();
    
    const pokequizMessage = await channel.send({embeds: [embed], components: [buttonsRow]});
    const startTime = new Date();

    const messageCollectorFilter = m => m.author.id === player.id;

    const messageCollector = new MessageCollector(channel, {filter: messageCollectorFilter, time: difficulties[difficulty].time});

    if (difficulties[difficulty].tries > 0) {
        messageCollector.options.max = difficulties[difficulty].tries;
    }

    const buttonCollectorFilter = async i => {
        await i.deferUpdate();
        return i.user.id === player.id;
    }

    const buttonCollector = pokequizMessage.createMessageComponentCollector({filter: buttonCollectorFilter, componentType: ComponentType.Button, time: difficulties[difficulty].time});

    const unlockHintsInterval = setInterval(() => {
        if (hintsCount < difficulties[difficulty].hints) {
            buttons[unlockedHintsCount].setDisabled(false);
            buttons[unlockedHintsCount].setStyle(ButtonStyle.Success);
            const updatedRow = new ActionRowBuilder().addComponents(buttons);
            pokequizMessage.edit({ components: [updatedRow] });
            unlockedHintsCount++;
        } else {
            clearInterval(unlockHintsInterval);
        }
    }, 60000);

    messageCollector.on('collect', async m => {
        tries++;
        if (latinize(m.content.toLowerCase()) === fixedFullName) {
            found = true;
            m.react('✅').catch();
        } else {
            m.react('❌').catch();
        }

        if (found || (difficulties[difficulty].tries > 0 && tries >= difficulties[difficulty].tries)) {
            messageCollector.stop();
            buttonCollector.stop();
        }
    });

    buttonCollector.on('collect', async b => {
        // SURRENDER
        if (b.customId === 'surrender') {
            if (!messageCollector.ended) messageCollector.stop();
            buttonCollector.stop();
            clearInterval(unlockHintsInterval);
            return;
        } 

        const usedButton = buttons.find(btn => btn.data.custom_id === b.customId);
        if (usedButton) {
            usedButton.setDisabled(true); // Désactive le bouton après utilisation
            usedButton.setStyle(ButtonStyle.Secondary); // Change le style pour indiquer qu'il est désactivé
        }

        const updatedRow = new ActionRowBuilder().addComponents(buttons); // Recrée la rangée mise à jour

        hintsCount++;
        // TYPE HINT
        if (b.customId === 'type') {
            hintFields.push({
                name: typeHintLabel,
                value: typesText,
                inline: true
            });
        }
        // GENUS HINT
        else if (b.customId === 'genus') {
            hintFields.push({
                name: genusHintLabel,
                value: genus,
                inline: true
            });
        }
        // INITIAL HINT
        else if (b.customId === 'initial') {
            hintFields.push({
                name: initialHintLabel,
                value: fullName.substring(0,1),
                inline: true
            });
        }
        // ARTWORK HINT
        else if (b.customId === 'artwork') {
            embed.setThumbnail(artworkUrl);
        }

        embed.setFields(hintFields);
        pokequizMessage.edit({embeds: [embed], components: [updatedRow]});

        if (hintsCount >= difficulties[difficulty].hints + 1) {
            buttonCollector.stop();
        }
    });

    messageCollector.on('end', async () => {
        clearInterval(unlockHintsInterval);
        const endTime = new Date();
        const chrono = endTime - startTime
        const endEmbed = new EmbedBuilder()
            .setTitle("PokéQuiz terminé")
            .setThumbnail(artworkUrl)
            .setTimestamp()
        const endMessage = {embeds: [endEmbed], components: []};
        if (found) {
            endEmbed.setColor(0x00FF00);
            endEmbed.setDescription(`Bravo ${player} !\nVous avez trouvé **${fullName}** en ${chrono / 1000}s !`);
            endEmbed.setFooter({
                text: `Difficulté ${difficulties[difficulty].name} | ${tries} essais | ${hintsCount} indices`
            });
        } else {
            endEmbed.setColor(0xFF0000);
            endEmbed.setDescription(`Dommage ${player} !\nVous n'avez pas trouvé **${fullName}** !`);
            endEmbed.setFooter({
                text: `Difficulté ${difficulties[difficulty].name} | ${tries} essais | ${hintsCount} indices`
            });
        }
        await pokequizMessage.edit(endMessage);

        const replayButton = new ButtonBuilder()
            .setCustomId('replay')
            .setLabel('Rejouer')
            .setStyle(ButtonStyle.Primary);
        
        const displayPokedexButton = new ButtonBuilder()
            .setCustomId('pokedex')
            .setLabel('Voir le Pokémon')
            .setStyle(ButtonStyle.Primary);

        const replayRow = new ActionRowBuilder()
            .addComponents(replayButton, displayPokedexButton);
        
        pokequizMessage.edit({
            embeds: [endEmbed],
            components: [replayRow]
        });

        const replayFilter = async i => {
            await i.deferUpdate();
            return i.user.id === player.id;
        }

        const replayCollector = pokequizMessage.createMessageComponentCollector({dispose: true, filter: replayFilter, componentType: ComponentType.Button, time: 30000});

        replayCollector.on('collect', async b => {
            if (b.customId === 'replay') {
                pokequiz(channel, player, generation, difficulty);
                replayCollector.stop();
            } else if (b.customId === 'pokedex') {
                const pkmEmbed = await pokedexEmbed(pkmId);
                await b.followUp({embeds: [pkmEmbed], ephemeral: true});
            }
        });

        replayCollector.on('end', async () => {
            pokequizMessage.edit({embeds: [endEmbed], components: []});
        });

        sendLogMessage(`Command : \`pokequiz\` | User : \`${player.username}\` | Difficulty : \`${difficulty}\` | Pokemon : \`${pokemonToGuess.name}\` | Found : \`${found}\` | Tries : \`${tries}\` | Hints : \`${hintsCount}\``);

    });
}

module.exports = {
    pokequiz
}