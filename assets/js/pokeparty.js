const { Collection, User, ComponentType, ButtonBuilder, ActionRowBuilder, ButtonStyle, ChatInputCommandInteraction, ChannelType } = require("discord.js");
const { random } = require('../../assets/js/random');
const { guildId, logsChannelId } = require('../../config.json')
const fs = require('node:fs');
const Papa = require('papaparse');
const latinize = require('latinize');

const { pokedexID } = require('../../assets/js/pokedexEmbedBuilder.js')

const rare = require('../../assets/json/rare.json');

const pokeliste = Papa.parse(fs.readFileSync('./assets/csv/pokeliste.csv', 'utf-8'), {encoding: "utf-8"});

/**
 * a pokeparty game
 * @param {Collection<string, User>} players 
 * @param {ChatInputCommandInteraction} interaction
 * @param {User} host
 */
async function game(players, interaction, host) {
    let guild = interaction.client.guilds.cache.get(guildId);
    let logsChannel = guild.channels.cache.get(logsChannelId);

    const pkm = pokeliste.data[random(1, 1025)];

    logsChannel.send("Command : `pokeparty` | User : `" + interaction.user.username + "` | State : `started` | Players : `" + players.size + "` | Pokemon : `" + pkm[0] + "` (*" + pkm[2] + "*) | ChannelType : `" + Object.keys(ChannelType).find(key => ChannelType[key] === interaction.channel.type) + "`");
    interaction.client.stats.pokeparty += 1;

    const channel = interaction.channel

    let found = false;
    let tries = new Collection();
    let nbIndices = 0;

    let typesStr = "Type";
    let pkmTypes = pkm[3];
    let pkmRarity = "Commun";

    if (pkm[4] != "") {
        typesStr += "s";
        pkmTypes += " | " + pkm[4];
    };

    if (pkm[9] != "") {
        pkmRarity = rare[pkm[9]];
    };

    let playersStr = "";
    let playersIds = [];

    players.forEach((player, id) => {
        playersStr += ' | <@' + id + '>';
        tries.set(id, 0);
        playersIds.push(id)
    })

    playersStr = playersStr.substring(3);

    const initialBtn = new ButtonBuilder()
        .setCustomId('initial')
        .setLabel('Initiale')
        .setStyle(ButtonStyle.Secondary);
    
    const typeBtn = new ButtonBuilder()
        .setCustomId('type')
        .setLabel('Type(s)')
        .setStyle(ButtonStyle.Secondary);

    const rarityBtn = new ButtonBuilder()
        .setCustomId('rarity')
        .setLabel('Rareté')
        .setStyle(ButtonStyle.Secondary);
    
    const evoLvlBtn = new ButtonBuilder()
        .setCustomId('evolvl')
        .setLabel('Niveau d\'évolution')
        .setStyle(ButtonStyle.Secondary);
    
    const generationBtn = new ButtonBuilder()
        .setCustomId('generation')
        .setLabel('Génération')
        .setStyle(ButtonStyle.Secondary);
    
    let fieldsArray = [
        {
            name: "Liste des joueurs",
            value: playersStr,
            inline: false
        },
        {
            name: "Description du Pokédex",
            value: pkm[8],
            inline: false
        }
    ];

    const buttons = new ActionRowBuilder()
        .addComponents(initialBtn, typeBtn, rarityBtn, evoLvlBtn, generationBtn);

    let embed = {
        title: "PokéParty",
        color: 0xFFFF00,
        description: "*Retrouvez le Pokémon correspondant à la description ci-dessous.\nUtilisez les boutons pour obtenir plus d'indices sur le Pokémon.\nVous disposez de 5 essais chacun pour le trouver et la partie se termine au bout de 5 minutes.\nL'hôte peut utiliseur `stop` pour arrêter la partie.\nQue le meilleur gagne !*",
        fields: fieldsArray,
        thumbnail: {url: "https://cdn.discordapp.com/attachments/940549449925668884/941294853617250346/poke2.png"},
        footer: {text: "Hôte de la partie : " + host.username},
        timestamp: new Date
    }

    const message = await channel.send({embeds: [embed], components: [buttons]});

    const msgFilter = m => playersIds.includes(m.author.id);

    const msgCollector = message.channel.createMessageCollector({filter: msgFilter, time: 300000});

    const btnCollector = message.createMessageComponentCollector({componentType: ComponentType.Button, maxComponents: 5});

    const fixedPkmName = latinize(pkm[2]).toUpperCase();

    let triesSum = 0;

    let winner;

    msgCollector.on('collect', async msg => {

        if (tries.get(msg.author.id) >= 5) {
            await msg.react('🚫').catch();
        } else if (latinize(msg.content).toUpperCase() == fixedPkmName) {
            winner = msg.author;
            tries.set(winner.id, tries.get(winner.id) + 1);
            triesSum++;
            found = true;

            await msg.react('✅').catch();

            if (!btnCollector.ended) btnCollector.stop();
            msgCollector.stop();
        } else if (msg.content.startsWith('stop') && msg.author.id == host.id) {
            if (!btnCollector.ended) btnCollector.stop();
            msgCollector.stop();
        } else {
            tries.set(msg.author.id, tries.get(msg.author.id) + 1);
            triesSum++;
            await msg.react('❌').catch();
        }

        if (triesSum >= (players.size * 5) && !found) {
            if (!btnCollector.ended) btnCollector.stop();
            msgCollector.stop();
        }

        setTimeout(() => {
            if (msg.deletable) msg.delete().catch();
        }, 5000);
    })

    btnCollector.on('collect', btn => {
        btn.deferUpdate();
        if (!playersIds.includes(btn.user.id)) {
            return;
        }

        nbIndices++;

        buttons.components.forEach(button => {
            if (button.data.custom_id === btn.customId) {
                button.setDisabled(true);
            }
        })

        if (btn.customId === 'initial') {
            fieldsArray.push(
                {
                    name: "Initiale du Pokémon",
                    value: fixedPkmName.substring(0,1),
                    inline: false
                }
            )
        } else if (btn.customId === 'type') {
            fieldsArray.push(
                {
                    name: typesStr,
                    value: pkmTypes,
                    inline: false
                }
            )
        } else if (btn.customId === 'rarity') {
            fieldsArray.push(
                {
                    name: "Rareté",
                    value: pkmRarity,
                    inline: false
                }
            )
        } else if (btn.customId === 'evolvl') {
            fieldsArray.push(
                {
                    name: "Niveau d'évolution",
                    value: pkm[7],
                    inline: false
                }
            )
        } else if (btn.customId === 'generation') {
            fieldsArray.push(
                {
                    name: "Génération",
                    value: pkm[1],
                    inline: false
                }
            )
        }

        message.edit({
            embeds: [embed],
            components: [buttons]
        })

        if (nbIndices >= 5) btnCollector.stop();
    })

    msgCollector.on('end', collected => {
        let str = '';
        tries.forEach((nb, id) => {
            str += players.get(id).username + " : " + nb + "/5\n"
        });
        let triesField = {
            name: 'Nombre d\'essais :',
            value: str
        }

        const restartBtn = new ButtonBuilder()
            .setCustomId('restart')
            .setLabel('Relancer une partie')
            .setStyle(ButtonStyle.Secondary)
        
        const components = new ActionRowBuilder()
            .addComponents(restartBtn)

        let finalEmbed;
        if (found) {
            finalEmbed = {
                title: "Victoire PokéQuiz !",
                description: "Pokémon à trouver : " + pkm[2] + "\nNombre d'indices bonus utilisés : " + nbIndices + "/5",
                fields: [triesField],
                footer: {text: "Victoire de " + winner.username},
                timestamp: new Date,
                color: 0x00FF00
            }
        } else {
            finalEmbed = {
                title: "Défaite PokéQuiz !",
                description: "Pokémon à trouver : " + pkm[2] + "\nNombre d'indices bonus utilisés : " + nbIndices + "/5",
                fields: [triesField],
                footer: {text: "Défaite de l'équipe"},
                timestamp: new Date,
                color: 0xFF0000
            }
        }

        message.edit({
            embeds: [finalEmbed, pokedexID(pkm[0]-1)],
            components: [components]
        }).then(message2 => {
            let filter = async c => {
                await c.deferUpdate();
                return c.user.id == host.id;
            }
            let timer = setTimeout(() => message.edit({components: []}), 60000);
            message2.awaitMessageComponent({dispose: true, componentType: ComponentType.Button, maxComponents: 1, filter: filter})
                .then(async button => {
                    message2.edit({components: []})
                    clearTimeout(timer);
                    game(players, interaction, host);
                })
        })

        logsChannel.send("Command : `pokeparty` | User : `" + interaction.user.username + "` | State : `Ended` | Found : `" + found + "` | Players : `" + players.size + "` | Hints : `" + nbIndices + "` | Pokemon : `" + pkm[0] + "` (*" + pkm[2] + "*) | ChannelType : `" + Object.keys(ChannelType).find(key => ChannelType[key] === interaction.channel.type) + "`");
    })

}

module.exports = {game}