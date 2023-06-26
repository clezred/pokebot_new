const { SlashCommandBuilder } = require('discord.js');
const { pokedexID } = require('../../assets/js/pokedexEmbedBuilder.js');
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
	async execute(interaction) {
		const option = interaction.options.getInteger('generation') ?? 0
		const min = gen[option][0]
		const max = gen[option][1]
		const number = random(min,max);
		await interaction.reply({embeds: [pokedexID(number)]});
	},
};