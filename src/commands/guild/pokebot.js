const { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction, ActivityType, InteractionContextType } = require('discord.js');
const { stopClient } = require('../../discord-client');
const { setCustomPresence, unsetCustomPresence } = require('../../client-presence-utils');
const { updateCommandStatusInDB } = require('../../command-utils');

const activityTypes = {
    'PLAYING': ActivityType.Playing,
    'LISTENING': ActivityType.Listening,
    'WATCHING': ActivityType.Watching,
    'COMPETING': ActivityType.Competing
}
module.exports = {
    data: new SlashCommandBuilder()
        .setName('pokebot')
        .setDescription('Commandes d\'administration du PokéBot')
        .addSubcommand(subcommand =>
            subcommand.setName('stop')
                .setDescription('Arrêter le bot')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('setpresence')
                .setDescription('Définir la présence du bot')
                .addStringOption(option =>
                    option.setName('activity')
                        .setDescription('Nom de l\'activité')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('type')
                    .setDescription('Type d\'activité')
                    .addChoices(
                        {name: 'Joue', value: 'PLAYING'},
                        {name: 'Écoute', value: 'LISTENING'},
                        {name: 'Regarde', value: 'WATCHING'},
                        {name: 'Compétition', value: 'COMPETING'}
                    )
                    .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('status')
                    .setDescription('Statut du bot')
                    .addChoices(
                        {name: 'En ligne', value: 'online'},
                        {name: 'Inactif', value: 'idle'},
                        {name: 'Ne pas déranger', value: 'dnd'},
                        {name: 'Invisible', value: 'invisible'}
                    )
                    .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('autopresence')
                .setDescription('Passer en mode présence automatique')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('command')
                .setDescription('Activer ou désactiver une commande')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Nom de la commande')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('enable')
                        .setDescription('Activer ou désactiver la commande')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Raison de la désactivation')
                        .setRequired(false)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts([
            InteractionContextType.Guild
        ])
    ,
    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.deferReply({ephemeral: true})

        if (interaction.options.getSubcommand() === 'stop') {
            await interaction.editReply({content: 'Bot arrêté', ephemeral: true})
            stopClient();
        } else if (interaction.options.getSubcommand() === 'setpresence') {
            const activity = interaction.options.getString('activity');
            const type = interaction.options.getString('type');
            const status = interaction.options.getString('status');

            setCustomPresence(activityTypes[type], activity, status);
            await interaction.editReply({content: `Présence définie : \`${activity}\` | \`${type}\` | \`${status}\``, ephemeral: true})
        } else if (interaction.options.getSubcommand() === 'autopresence') {
            unsetCustomPresence();
            await interaction.editReply({content: 'Mode présence automatique activé', ephemeral: true})
        } else if (interaction.options.getSubcommand() === 'command') {
            const commandName = interaction.options.getString('name');
            const enable = interaction.options.getBoolean('enable');
            const reason = interaction.options.getString('reason') ?? 'Pas de raison spécifiée.';

            await updateCommandStatusInDB(commandName, enable, reason);
            await interaction.editReply({content: `Commande \`${commandName}\` ${enable ? 'activée' : 'désactivée (' + reason + ')'}`, ephemeral: true})
        }
    }
}