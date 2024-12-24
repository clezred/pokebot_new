const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, CommandInteraction, ChannelType, ChatInputCommandInteraction, InteractionContextType } = require('discord.js');
const { logError } = require('../../utils.js');
const { sendLogMessage } = require('../../discord-utils.js');
const { pokequiz } = require('../../pokequiz.js');
const difficulties = require('../../../config/gamedifficulty.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pokequiz')
        .setDescription('Jouer au PokéQuiz !')
        .addIntegerOption(option =>
			option.setName('generation')
				.setDescription('Limiter l\'aléatoire à une génération en particulier')
				.setMaxValue(8)
				.setMinValue(1)
		)
        .addStringOption(option =>
            option.setName('difficulty')
                .setDescription('Niveau de difficulté')
                .addChoices(
                    {name: difficulties.easy.name, value: 'easy'},
                    {name: difficulties.medium.name, value: 'medium'},
                    {name: difficulties.hard.name, value: 'hard'},
                    {name: difficulties.extreme.name, value: 'extreme'},
                    {name: difficulties.impossible.name, value: 'impossible'}
                )
                .setRequired(false)
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
        const channel = interaction.channel;
        const user = interaction.user;
        const generation = interaction.options.getInteger('generation') ?? 0;
        const difficulty = interaction.options.getString('difficulty') ?? 'easy';

        await interaction.deferReply({ephemeral: true});

        try {
            pokequiz(channel, user, generation, difficulty);
            interaction.editReply('La partie PokéQuiz commence !');
        } catch (error) {
            logError(error);
            await interaction.editReply('Une erreur est survenue lors de la partie PokéQuiz !');
            sendLogMessage(`Error : \`pokequiz\` : ${error.message}`);
        }
    }
}