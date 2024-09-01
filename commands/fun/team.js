const { SlashCommandBuilder, ChannelType, ChatInputCommandInteraction } = require('discord.js');
const { teamBuilder } = require('../../assets/js/teamEmbedBuilder.js');
const { random } = require('../../assets/js/random.js');
const { guildId, logsChannelId } = require('../../config.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('team')
		.setDescription('Renvoie une équipe aléatoire de 6 Pokémons'),
    
	/**
	 * 
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
        let pkms = [];
		while (pkms.length < 6) {
            let id = random(1,1025);
            if (!pkms.includes(id)) {
                pkms.push(id);
            }
        }
		await interaction.reply({embeds: [teamBuilder(pkms)]});

		let guild = interaction.client.guilds.cache.get(guildId);
		let logsChannel = guild.channels.cache.get(logsChannelId);
		logsChannel.send("Command : `team` | User : `" + interaction.user.username + "` | ChannelType : `" + Object.keys(ChannelType).find(key => ChannelType[key] === interaction.channel.type) + "`");
		interaction.client.stats.team += 1;
	},
};