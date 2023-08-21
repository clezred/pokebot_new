const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, CommandInteraction } = require('discord.js');
const { random } = require('../../assets/js/random');
const fs = require('node:fs');
const Papa = require('papaparse');
const latinize = require('latinize');

const { pokedexID } = require('../../assets/js/pokedexEmbedBuilder.js')

const rare = require('../../assets/json/rare.json');

const pokeliste = Papa.parse(fs.readFileSync('./assets/csv/pokeliste.csv', 'utf-8'), {encoding: "utf-8"});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pokequiz')
        .setDescription('Jouer au PokéQuiz !'),

    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        let pkm = pokeliste.data[random(1,1010)-1];

        let found = false;
        let tries = 0;
        let nbIndices = 0;
        
        let typesStr = "Type";
        let pkmTypes = pkm[3];
        let pkmRarity = "Commun";

        if (pkm[4] != "") {
            typesStr += "s";
            pkmTypes += " | " + pkm[4];
        };

        if (pkm[9] != "") {
            pkmRarity = rare[pkm[9]]
        };

        let initialBtn = new ButtonBuilder()
            .setCustomId('initial')
            .setLabel('Initiale')
            .setStyle(ButtonStyle.Secondary);
        
        let typeBtn = new ButtonBuilder()
            .setCustomId('type')
            .setLabel('Type(s)')
            .setStyle(ButtonStyle.Secondary);

        let rarityBtn = new ButtonBuilder()
            .setCustomId('rarity')
            .setLabel('Rareté')
            .setStyle(ButtonStyle.Secondary);
        
        let evoLvlBtn = new ButtonBuilder()
            .setCustomId('evolvl')
            .setLabel('Niveau d\'évolution')
            .setStyle(ButtonStyle.Secondary);
        
        let generationBtn = new ButtonBuilder()
            .setCustomId('generation')
            .setLabel('Génération')
            .setStyle(ButtonStyle.Secondary);
        
        let hintsArray = [
            {
                name: "Description du Pokédex",
                value: pkm[8],
                inline: false
            }
        ];

        let buttons = new ActionRowBuilder()
            .addComponents(initialBtn, typeBtn, rarityBtn, evoLvlBtn, generationBtn);
        
        let embed = {
            title: "PokéQuiz",
            color: 0xFFFF00,
            description: "*Retrouve le Pokémon correspondant à la description ci-dessous.\nUtilise les boutons pour obtenir plus d'indices sur le Pokémon.\nTu disposes de 10 essais pour le trouver et la partie se termine au bout de 5 minutes.\nUtilise `stop` pour abandonner.*",
            fields: hintsArray,
            footer: {
              text: `Partie démarrée par ${interaction.user.username}`
            },
            thumbnail: {url: "https://cdn.discordapp.com/attachments/940549449925668884/941294853617250346/poke2.png"},
            timestamp: new Date,
        };

        await interaction.reply({
            embeds: [embed],
            components: []
        })

        await interaction.editReply({
            embeds: [embed],
            components: [buttons]
        })

        let message = await interaction.fetchReply();

        const msgFilter = m => m.author.id == interaction.user.id;

        const fixedPkmName = latinize(pkm[2]).toUpperCase();

        const msgCollector = message.channel.createMessageCollector({filter: msgFilter, time: 300000, max: 10})

        const btnCollector = message.createMessageComponentCollector({componentType: ComponentType.Button, maxComponents: 5})

        msgCollector.on('collect', msg => {

            if (latinize(msg.content).toUpperCase() == fixedPkmName) {
                tries++;
                found = true

                msg.react('✅').catch()

                if (!btnCollector.ended) btnCollector.stop();
                msgCollector.stop();
            } else if (msg.content.startsWith('stop')) {
                if (!btnCollector.ended) btnCollector.stop();
                msgCollector.stop();
            } else {
                tries++;
                msg.react('❌').catch()
            }
        })

        btnCollector.on('collect', btn => {
            btn.deferUpdate();
            if (btn.user.id != interaction.user.id) {
                return;
            }

            nbIndices++;

            buttons.components.forEach(button => {
                if (button.data.custom_id === btn.customId) {
                    button.setDisabled(true);
                }
            })

            if (btn.customId === 'initial') {
                hintsArray.push(
                    {
                        name: "Initiale du Pokémon",
                        value: fixedPkmName.substring(0,1),
                        inline: false
                    }
                )
            } else if (btn.customId === 'type') {
                hintsArray.push(
                    {
                        name: typesStr,
                        value: pkmTypes,
                        inline: false
                    }
                )
            } else if (btn.customId === 'rarity') {
                hintsArray.push(
                    {
                        name: "Rareté",
                        value: pkmRarity,
                        inline: false
                    }
                )
            } else if (btn.customId === 'evolvl') {
                hintsArray.push(
                    {
                        name: "Niveau d'évolution",
                        value: pkm[7],
                        inline: false
                    }
                )
            } else if (btn.customId === 'generation') {
                hintsArray.push(
                    {
                        name: "Génération",
                        value: pkm[1],
                        inline: false
                    }
                )
            }

            interaction.editReply({
                embeds: [embed],
                components: [buttons]
            })

            if (nbIndices >= 5) btnCollector.stop();
        })

        msgCollector.on('end', collected => {
            if (found) {
                let successEmbed = {
                    title: "Victoire PokéQuiz !",
                    description: "Pokémon à trouver : " + pkm[2] + "\nNombre d'essais : " + tries + "/10\nNombre d'indices bonus utilisés : " + nbIndices + "/5",
                    footer: {text: "Victoire de " + interaction.user.username},
                    timestamp: new Date,
                    color: 0x00FF00
                }

                interaction.editReply({
                    embeds: [successEmbed, pokedexID(pkm[0]-1)],
                    components: []
                })
            } else {
                let looseEmbed = {
                    title: "Défaite PokéQuiz !",
                    description: "Pokémon à trouver : " + pkm[2] + "\nNombre d'essais : " + tries + "/10\nNombre d'indices bonus utilisés : " + nbIndices + "/5",
                    footer: {text: "Défaite de " + interaction.user.username},
                    timestamp: new Date,
                    color: 0xFF0000
                }

                interaction.editReply({
                    embeds: [looseEmbed, pokedexID(pkm[0]-1)],
                    components: []
                })
            }
        })
    }
}