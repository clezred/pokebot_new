const { Collection, User, ComponentType, ButtonBuilder, ActionRowBuilder, ButtonStyle, ChatInputCommandInteraction, ChannelType, EmbedBuilder, MessageCollector, TextChannel } = require("discord.js");
const { random, logWarn } = require('./utils.js');
const ids = require('../config/ids.json')
const gen = require('../config/genpkid.json');
const { latinize } = require('./latinize');
const difficulties = require('../config/gamedifficulty.json');
const { pokedexEmbed } = require('./pokedex-utils.js');
const { sendLogMessage } = require("./discord-utils.js");
const { getPokemonSpecies, subRequest } = require("./pokeapi-utils.js");

/**
 * Players in game
 */
const playersInGame = new Collection();

/**
 * Check if a player is already playing in a channel
 * @param {String} userId 
 * @param {String} channelId 
 * @returns {Boolean}
 */
function isPlaying(userId, channelId) {
    if (playersInGame.has(userId)) {
        return playersInGame.get(userId).includes(channelId);
    }
    return false;    
}

/**
 * Add a player to the game
 * @param {String} userId 
 * @param {String} channelId 
 */
function addPlayer(userId, channelId) {
    if (!playersInGame.has(userId)) {
        playersInGame.set(userId, [channelId]);
    } else {
        playersInGame.get(userId).push(channelId);
    }
}

/**
 * Remove a player from the game
 * @param {String} userId 
 * @param {String} channelId 
 */
function removePlayer(userId, channelId) {
    if (playersInGame.has(userId)) {
        const index = playersInGame.get(userId).indexOf(channelId);
        if (index > -1) {
            playersInGame.get(userId).splice(index, 1);
        }
        if (playersInGame.get(userId).length === 0) {
            playersInGame.delete(userId);
        }
    }
}

/**
 * A Pokeparty game
 * @param {TextChannel} channel 
 * @param {User[]} players 
 * @param {number} generation 
 * @param {String} difficulty 
 * @param {String} hostId 
 */
async function pokeparty(channel, players, generation, difficulty, hostId) {
    const minId = gen[generation][0];
    const maxId = gen[generation][1];
    
    let pkmId;
    let pokemonSpecies;
    let pokemonToGuess;
    let descriptionText;
    let descTries = 0;

    while (!descriptionText) {
        pkmId = random(minId, maxId);

        pokemonSpecies = await getPokemonSpecies(pkmId);
        pokemonToGuess = await subRequest(pokemonSpecies.varieties.find(v => v.is_default).pokemon.url);

        const descriptions = pokemonSpecies.flavor_text_entries.filter(f => f.language.name === (descTries < 10 ? 'fr' : 'en'));
        const description = descriptions.length > 0 ? descriptions[random(0, descriptions.length - 1)] : null;
        descriptionText = description ? description.flavor_text.replace(/\n/g, ' ') : null;
        if (descTries >= 10) descriptionText += "\n_(Description indisponible en français)_";
        descTries++;
    }

    sendLogMessage(`Command : \`pokeparty\` | Host : \`${players.find(p => p.id === hostId).username}\` | Difficulty : \`${difficulty}\` | Generation : \`${generation}\``);

    let found = false;
    let tries = new Collection();
    for (const player of players) {
        tries.set(player.id, 0);
    }
    let hintsCount = 0;
    let unlockedHintsCount = 0;

    const typeHintLabel = "Type(s)";
    const genusHintLabel = "Catégorie";
    const initialHintLabel = "Initiale";
    const artworkHintLabel = "Artwork";

    const host = players.find(p => p.id === hostId);
    const playersIds = players.map(p => p.id);

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
        .setStyle(ButtonStyle.Danger)
        .setDisabled(false);

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

    const gameEmbedFields = [
        {
            name: "Liste des joueurs",
            value: players.map(p => `<@${p.id}>`).join(' | '),
            inline: false
        },
        {
            name: "Description du Pokédex",
            value: descriptionText,
            inline: false
        }
    ];

    const embed = new EmbedBuilder()
        .setTitle(`PokéParty du ${difficulties[difficulty].name}`)
        .setColor(0xFFFF00)
        .setDescription("*Retrouvez le nom du Pokémon correspondant à la description ci-dessous et utilisez les boutons pour obtenir plus d'indices !\nQue le meilleur gagne !*")
        .addFields(gameEmbedFields)
        .setFooter({
            text: "Hôte de la partie : " + host.username
        })
        .setTimestamp();

    const pokepartyMessage = await channel.send({embeds: [embed], components: [buttonsRow]});
    const startTime = new Date();

    const messageCollectorFilter = m => playersIds.includes(m.author.id);

    const messageCollector = new MessageCollector(channel, {filter: messageCollectorFilter, time: difficulties[difficulty].time});

    if (difficulties[difficulty].hints > 0) {
        messageCollector.options.max = difficulties[difficulty].tries * players.size;
    }

    const buttonCollectorFilter = async i => {
        await i.deferUpdate();
        return playersIds.includes(i.user.id);
    }

    const buttonCollector = pokepartyMessage.createMessageComponentCollector({filter: buttonCollectorFilter, componentType: ComponentType.Button, time: difficulties[difficulty].time});

    const unlockHintsInterval = setInterval(() => {
        if (hintsCount < difficulties[difficulty].hints) {
            buttons[unlockedHintsCount].setDisabled(false);
            buttons[unlockedHintsCount].setStyle(ButtonStyle.Success);
            const updatedRow = new ActionRowBuilder().addComponents(buttons);
            pokepartyMessage.edit({ components: [updatedRow] });
            unlockedHintsCount++;
        } else {
            clearInterval(unlockHintsInterval);
        }
    }, 60000);
    
    let winner;
    let triesSum = 0;

    messageCollector.on('collect', async m => {
        
        if (difficulties[difficulty].tries > 0) {
            if (tries.get(m.author.id) >= difficulties[difficulty].tries) {
                await m.react('🚫').catch();
            }
        } else if (latinize(m.content.toLowerCase()) === fixedFullName) {
            winner = m.author;
            tries.set(winner.id, tries.get(winner.id) + 1);
            triesSum++;
            found = true;
            await m.react('✅').catch();
        } else {
            tries.set(m.author.id, tries.get(m.author.id) + 1);
            triesSum++;
            try {
                await m.react('❌');
            } catch (err) {
                logWarn(`Error while reacting to message : ${err.message}`);
            }
        }

        if (found || (difficulties[difficulty].tries > 0 && triesSum >= difficulties[difficulty].tries * players.size)) {
            if (!buttonCollector.ended) buttonCollector.stop();
            messageCollector.stop();
        }

        setTimeout(() => {
            if (m.deletable) m.delete().catch();
        }, 5000);
    })

    buttonCollector.on('collect', b => {
        // SURRENDER
        if (b.customId === 'surrender' && b.user.id === host.id) {
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
            gameEmbedFields.push({
                name: typeHintLabel,
                value: typesText,
                inline: true
            })
        }
        // GENUS HINT
        else if (b.customId === 'genus') {
            gameEmbedFields.push({
                name: genusHintLabel,
                value: genus,
                inline: true
            })
        }
        // INITIAL HINT
        else if (b.customId === 'initial') {
            gameEmbedFields.push({
                name: initialHintLabel,
                value: fullName.substring(0,1),
                inline: true
            })
        }
        // ARTWORK HINT
        else if (b.customId === 'artwork') {
            embed.setThumbnail(artworkUrl);
        }

        embed.setFields(gameEmbedFields);
        pokepartyMessage.edit({embeds: [embed], components: [updatedRow]});

        if (hintsCount >= difficulties[difficulty].hints * players.length + 1) {
            buttonCollector.stop();
        }
    })

    messageCollector.on('end', async () => {
        for (const player of players) {
            removePlayer(player.id, channel.id);
        }
        clearInterval(unlockHintsInterval);
        const endTime = new Date();
        const chrono = endTime - startTime;
        const endEmbed = new EmbedBuilder()
            .setTitle("PokéParty terminée")
            .setThumbnail(artworkUrl)
            .setTimestamp();
        const endMessage = {embeds: [endEmbed], components: []};
        if (found) {
            endEmbed.setDescription(`Bravo ${winner} !\nVous avez trouvé **${fullName}** en ${chrono / 1000}s !`);
            endEmbed.setColor(0x00FF00);
            endEmbed.setFooter({
                text: `Difficulté ${difficulties[difficulty].name} | ${tries.get(winner.id)} essais | ${hintsCount} indices`
            });
        } else {
            endEmbed.setDescription(`Personne n'a trouvé **${fullName}** !`);
            endEmbed.setColor(0xFF0000);
            endEmbed.setFooter({
                text: `Difficulté ${difficulties[difficulty].name} | ${triesSum} essais | ${hintsCount} indices`
            });
        }
        await pokepartyMessage.edit(endMessage);

        const replayButton = new ButtonBuilder()
            .setCustomId('replay')
            .setLabel('Relancer une partie')
            .setStyle(ButtonStyle.Success);
        
        const displayPokedexButton = new ButtonBuilder()
            .setCustomId('pokedex')
            .setLabel('Voir le Pokémon')
            .setStyle(ButtonStyle.Primary);
        
        const gameEndedRow = new ActionRowBuilder()
            .addComponents(replayButton, displayPokedexButton);

        pokepartyMessage.edit({
            embeds: [endEmbed],
            components: [gameEndedRow]
        });

        const pokepartyMessageFilter = b => {
            return b.message.id === pokepartyMessage.id;
        }

        const replayCollector = pokepartyMessage.createMessageComponentCollector({dispose: true, filter: pokepartyMessageFilter, componentType: ComponentType.Button, time: 60000});

        replayCollector.on('collect', async b => {
            await b.deferUpdate();
            if (b.customId === 'replay' && b.user.id === hostId) {
                const replayPlayers = [];
                for (const player of players) {
                    if (!isPlaying(player.id, channel.id)) {
                        addPlayer(player.id, channel.id);
                        replayPlayers.push(player);
                    }
                }
                if (replayPlayers.length > 0) {
                    pokeparty(channel, replayPlayers, generation, difficulty, hostId);
                    replayCollector.stop();
                } else {
                    await b.followUp({content: "Tous les joueurs sont déjà en jeu !", ephemeral: true});
                }
            } else if (b.customId === 'pokedex') {
                const pkmEmbed = await pokedexEmbed(pkmId);
                await b.followUp({embeds: [pkmEmbed], ephemeral: true});
            }
        });

        replayCollector.on('end', () => {
            pokepartyMessage.edit({embeds: [endEmbed], components: []});
        });

        sendLogMessage(`Command : \`pokeparty\` | Host : \`${host.username}\` | Winner : \`${winner ? winner.username : "X"}\` | Difficulty : \`${difficulty}\` | Generation : \`${generation}\``);
    })

}

module.exports = {
    isPlaying,
    addPlayer,
    removePlayer,
    pokeparty
}