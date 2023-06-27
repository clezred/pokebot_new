const { SlashCommandBuilder } = require('discord.js');
const { teamBuilder } = require('../../assets/js/teamEmbedBuilder.js');
const { random } = require('../../assets/js/random.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('team')
		.setDescription('Renvoie une équipe aléatoire de 6 Pokémons'),
    
	async execute(interaction) {
        let pkms = [];
		while (pkms.length < 6) {
            let id = random(1,1010);
            if (!pkms.includes(id)) {
                pkms.push(id);
            }
        }
		await interaction.reply({embeds: [teamBuilder(pkms)]});
	},
};