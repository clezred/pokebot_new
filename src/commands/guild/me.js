const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, ChatInputCommandInteraction, InteractionContextType } = require('discord.js');
const { random, logInfo, logWarn } = require('../../utils.js');
const { pokedexEmbed } = require('../../pokedex-utils.js');
const { updateMembersPokemon, addMembersPokemon, getMembersPokemon } = require('../../postgres-utils.js');
const gen = require('../../../config/genpkid.json');
const { getMember, getRole } = require('../../discord-client.js');
const { getPokemonSpecies } = require('../../pokeapi-utils.js');
const ids = require('../../../config/ids.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('me')
		.setDescription('Te permet d\'obtenir le Pokémon qui te repésente sur le serveur du PokéBot !')
        .setContexts([
            InteractionContextType.Guild
        ])
    ,

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
	async execute(interaction) {
        await interaction.deferReply({ephemeral: true});
        const membersPokemons = await getMembersPokemon(interaction.guild.id, interaction.member.id);
        
        const memberPokemon = membersPokemons.length > 0 ? membersPokemons[0] : null;

        const now = new Date();

        const getNewPokemonButton = new ButtonBuilder()
            .setCustomId('new_pokemon')
            .setLabel(memberPokemon ? 'Changer de Pokémon' : 'Obtenir mon Pokémon')
            .setStyle(ButtonStyle.Primary);
        
        let reply = {content: 'Tu n\'as pas encore de Pokémon !', embeds: [], components: []};

        const hour = 60 * 60 * 1000;

        if (memberPokemon) {
            const pokemonEmbed = await pokedexEmbed(memberPokemon.pokemon_id, memberPokemon.shiny);
            reply.content = `Voici ton Pokémon :`;
            reply.embeds.push(pokemonEmbed);
            const elapsedTime = now - new Date(memberPokemon.updated_at)
            let remainingTime = 12 * hour - elapsedTime
            remainingTime = remainingTime < 0 ? 0 : remainingTime;
            const changeAvailable = elapsedTime > (12 * hour);
            if (!changeAvailable) {
                getNewPokemonButton.setDisabled(true);
                getNewPokemonButton.setLabel(Math.floor(remainingTime / hour) + " heure(s) restantes")
                getNewPokemonButton.setEmoji('⏱️')
            }
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(getNewPokemonButton);
        
        reply.components.push(actionRow);

        await interaction.editReply(reply);

        const replyMessage = await interaction.fetchReply();

        const filter = async i => {
            await i.deferUpdate();
            return i.user.id === interaction.user.id;
        }

        const collector = replyMessage.createMessageComponentCollector({dispose: true, filter, componentType: ComponentType.Button, time: 60000, max: 1});

        collector.on('collect', async i => {
            if (i.customId === 'new_pokemon') {
                const newPokemonId = random(gen[0][0], gen[0][1]);
                const shiny = (random(1, 4096) === 1);
                if (memberPokemon) {
                    await updateMembersPokemon(interaction.guild.id, interaction.user.id, newPokemonId, shiny, now.toISOString());
                } else {
                    await addMembersPokemon(interaction.guild.id, interaction.user.id, newPokemonId, shiny, now.toISOString());
                }
                await interaction.editReply({components: []});
                await interaction.followUp({content: `Voici le nouveau Pokémon de ${interaction.user} :`, embeds: [await pokedexEmbed(newPokemonId, shiny)], components: []});
                const member = await getMember(interaction.user.id);
                if (!member) return;
                const pkm = await getPokemonSpecies(newPokemonId);
                let pkmName = pkm.names.find(name => name.language.name === 'fr').name;
                const shinyAdd = shiny ? " ✨" : "";
                const cut = 6 + shinyAdd.length;
                let memberUsername = member.user.username;
                if (memberUsername.length > (32 - (pkmName.length + cut))) {
                    memberUsername = memberUsername.substring(0, (32 - (pkmName.length + cut))) + "...";
                }
                if (shiny) {
                    pkmName += shinyAdd;
                    await member.setNickname(memberUsername + " | " + pkmName);
                    await member.roles.add(await interaction.guild.roles.fetch(ids.shinyRoleId));
                } else if (member.roles.cache.has(ids.shinyRoleId)) {
                    await member.roles.remove(await interaction.guild.roles.fetch(ids.shinyRoleId));
                }
                await member.setNickname(memberUsername + " | " + pkmName).catch(err => {
                    logWarn(`Failed to update nickname for ${member.user.username} : ${err}`);
                });
            }
        });
	},
};
