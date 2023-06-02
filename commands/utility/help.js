const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Te donne des informations sur le PokéBot !'),
	async execute(interaction) {
		await interaction.reply({content: 'Cette commande n\'est pas encore entièrement rédigée mais si tu veux tu peux aller sur le serveur Discord du support PokéBot : https://discord.gg/FrMYzXn48V', ephemeral: true});
	},
};
