const { SlashCommandBuilder, ChatInputCommandInteraction, InteractionContextType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('support')
		.setDescription("Renvoie le lien d'invitation du serveur de support")
        .setContexts([
            InteractionContextType.Guild,
            InteractionContextType.PrivateChannel,
            InteractionContextType.BotDM
        ])
    ,
    /**
     * Defines actions to do for this interaction
     * @param {ChatInputCommandInteraction} interaction - the interaction
     */
    async execute(interaction) {
        await interaction.deferReply({ephemeral: true});

        await interaction.editReply({content: 'Tu peux rejoindre le serveur de support en cliquant sur ce lien : https://discord.gg/FrMYzXn48V'});
    }
};
