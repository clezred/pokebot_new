const { SlashCommandBuilder, ChannelType, ChatInputCommandInteraction, InteractionContextType } = require('discord.js');
const { team } = require('../../team.js');
const { random } = require('../../utils.js');
const gen = require('../../../config/genpkid.json');
const { sendLogMessage } = require('../../discord-utils.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('team')
		.setDescription('Renvoie une équipe aléatoire de 6 Pokémons')
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
	 * 
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
		const generation = interaction.options.getInteger('generation') ?? 0;
		const minId = gen[generation][0];
		const maxId = gen[generation][1];

		interaction.deferReply(	);

        let pkms = [];
		while (pkms.length < 6) {
            const id = random(minId, maxId);
            if (!pkms.includes(id)) {
                pkms.push(id);
            }
        }

		const embed = await team(pkms);

		if (!embed) {
			await interaction.editReply({content: "Erreur lors de la récupération des données", ephemeral: true});
			return;
		}

		embed.data.author.name += interaction.user.username;

		await interaction.editReply({embeds: [embed]});

		sendLogMessage("Command : `team` | User : `" + interaction.user.username + "` | ChannelType : `" + Object.keys(ChannelType).find(key => ChannelType[key] === interaction.channel.type) + "`");
	}
};