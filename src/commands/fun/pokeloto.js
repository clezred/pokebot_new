const { SlashCommandBuilder, ChannelType, ChatInputCommandInteraction, PermissionFlagsBits, InteractionContextType } = require('discord.js');
const { pokedexEmbed } = require('../../pokedex-utils.js');
const { random } = require('../../utils.js');
const { sendLogMessage } = require('../../discord-utils.js');
const gen = require('../../../config/genpkid.json');

/*
 * NEEDED BOT PERMISSIONS
 * pokeloto : [SendMessages, SendMessagesInThreads, ReadMessageHistory, EmbedLinks, ViewChannel]
 */

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pokeloto')
		.setDescription('Renvoie un Pokémon aléatoire du Pokédex')
		.addIntegerOption(option =>
			option.setName('generation')
				.setDescription('Limiter l\'aléatoire à une génération en particulier')
				.setMaxValue(9)
				.setMinValue(1)
		)
		.setContexts([
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel,
			InteractionContextType.BotDM
		])
	,
	/**
	 * Execute the command
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
		const option = interaction.options.getInteger('generation') ?? 0

		const min = gen[option][0]
		const max = gen[option][1]
		const id = random(min, max);

		const shiny = random(1, 4096) === 1;

		await interaction.deferReply();

		const embed = await pokedexEmbed(id, shiny);

		let state = 'SUCCESS';
		let pkmName = 'no embed';
		if (!embed) {
			await interaction.deleteReply();
			await interaction.followUp({content: 'Une erreur est survenue lors de la recherche du Pokémon. Veuillez réessayer.\n*Si le problème persiste, merci de le signaler sur le serveur de support (</support:1310560708236279908>).*', ephemeral: true});
			state = 'ERROR';
		} else {
			await interaction.editReply({embeds: [embed]});
			pkmName = embed.data.author.name;
		}
		
		sendLogMessage(`Command : \`pokeloto\` | State : \`${state}\` | User : \`${interaction.user.username}\` | Pokemon : \`${id}\` (${pkmName}) | ChannelType : \`${Object.keys(ChannelType).find(key => ChannelType[key] === interaction.channel.type)}\``);
	}
};