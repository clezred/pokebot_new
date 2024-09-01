const { SlashCommandBuilder, ChannelType, ChatInputCommandInteraction } = require('discord.js');
const { pokedexID } = require('../../assets/js/pokedexEmbedBuilder.js');
const { guildId, logsChannelId } = require('../../config.json')
const { random } = require('../../assets/js/random.js');
const gen = require('../../assets/json/genpkid.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pokeloto')
		.setDescription('Renvoie un Pokémon aléatoire du Pokédex')
		.addIntegerOption(option =>
			option.setName('generation')
				.setDescription('Limiter l\'aléatoire à une génération en particulier')
				.setMaxValue(9)
				.setMinValue(1)
		),
	/**
	 * 
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
		const option = interaction.options.getInteger('generation') ?? 0
		const min = gen[option][0]
		const max = gen[option][1]
		const id = random(min,max) - 1;
		await interaction.reply({embeds: [pokedexID(id)]});

		let guild = interaction.client.guilds.cache.get(guildId);
		let logsChannel = guild.channels.cache.get(logsChannelId);
		logsChannel.send("Command : `pokeloto` | User : `" + interaction.user.username + "` | Gen : `" + option + "` | Pokemon : `" + id + "` | ChannelType : `" + Object.keys(ChannelType).find(key => ChannelType[key] === interaction.channel.type) + "`");
		interaction.client.stats.pokeloto += 1;
	},
};