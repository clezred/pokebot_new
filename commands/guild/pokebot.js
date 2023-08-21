const { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pokebot')
        .setDescription('Commandes d\'administration du PokéBot')
        .addSubcommand(subcommand =>
            subcommand.setName('stop')
                .setDescription('Arrêter le bot')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('maintenance')
                .setDescription('Changer le mode maintenance')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('vanish')
                .setDescription('Changer le mode vanish')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('servers')
                .setDescription('Les serveurs du PokéBot')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        interaction.reply({content: 'En cours...', ephemeral: true})
    }
}