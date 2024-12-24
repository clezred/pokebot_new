const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField, ChannelType, InteractionContextType, ChatInputCommandInteraction } = require('discord.js');
const { getAllNewsChannels, addNewsChannel, deleteNewsChannel } = require('../../postgres-utils.js');
const { logError, logInfo } = require('../../utils.js');
const { sendLogMessage } = require('../../discord-utils.js');
const neededPerms = require('../../needed-perms.js');

/*
 * NEEDED BOT PERMISSIONS
 * news-channel : []
 * news-channel.addedChannel : [SendMessages, EmbedLinks, ViewChannel]
 */

module.exports = {
    data: new SlashCommandBuilder()
        .setName('news-channel')
        .setDescription('Définir un salon pour les dernières nouveautés du PokéBot')
        .addSubcommand(subcommand => 
            subcommand.setName('add')
                .setDescription('Ajouter un salon à la liste de diffusion des news')
                .addChannelOption(option => 
                    option.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                        .setName('channel')
                        .setDescription('Le salon à ajouter')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('Retirer un salon de la liste de diffusion des news')
                .addChannelOption(option =>
                    option.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                        .setName('channel')
                        .setDescription('Le salon à retirer')
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts([InteractionContextType.Guild]),

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {

        const rows = getAllNewsChannels();

        const channels = (await rows).map(row => row.channel_id);

        if (interaction.options.getSubcommand() === 'add') {
            const channel = interaction.options.getChannel('channel');

            if (channels.includes(`${channel.id}`)) {
                interaction.reply({content: 'Ce salon fait déjà partie de la liste de diffusion des news.', ephemeral: true});
            } else {
                const missingPerms = [];
                for (const perm of neededPerms["news-channel.addedChannel"]) {
                    if (!interaction.guild.members.me.permissionsIn(interaction.channel).has(perm)) {
                        missingPerms.push(perm);
                    }
                }

                if (missingPerms.length > 0) {
                    const missingPermsField = new PermissionsBitField(missingPerms);
                    await interaction.reply({ content: `Je n'ai pas les permissions nécessaires pour envoyer les news dans ce salon. Merci de réessayer une fois les permissions mises à jour.\nPermissions manquantes : ${missingPermsField.toArray().join(' | ')}`, ephemeral: true });
                    return;
                }

                try {
                    await addNewsChannel(interaction.guild.id, channel.id, new Date().toISOString());
                    interaction.reply({content: `Le salon ${channel} a été ajouté de la liste de diffusion des news.`, ephemeral: true});
                    logInfo(`Added news channel ${channel.id} to guild ${interaction.guild.id}`);
                    sendLogMessage(`Command : \`news-channel\` (**add**) | User : \`${interaction.user.username}\` | Channel : \`${channel.id}\` | Guild : \`${interaction.guild.id}\`| ChannelType : \`${Object.keys(ChannelType).find(key => ChannelType[key] === channel.type)}\``);
                } catch (error) {
                    const errorMessage = `Il y a eu une erreur lors de l'ajout du salon ${channel} de la liste de diffusion des news.`;
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({content: errorMessage, ephemeral: true});
                    } else {
                        interaction.reply({content: errorMessage, ephemeral: true})
                    }
                    logError(error);
                    sendLogMessage(`Error : \`news-channel\` (**add**) : ${error}`);
                }
            }

        } else if (interaction.options.getSubcommand() === 'remove') {
            const channel = interaction.options.getChannel('channel');

            if (channels.includes(channel.id)) {
                try {
                    await deleteNewsChannel(interaction.guild.id, channel.id);
                    interaction.reply({content: `Le salon ${channel} a été retiré de la liste de distribution des news.`, ephemeral: true});
                    logInfo(`Removed news channel ${channel.id} from guild ${interaction.guild.id}`);
                    sendLogMessage(`Command : \`news-channel\` (**remove**) | User : \`${interaction.user.username}\` | Channel : \`${channel.id}\` | Guild : \`${interaction.guild.id}\` | ChannelType : \`${Object.keys(ChannelType).find(key => ChannelType[key] === channel.type)}\``);
                } catch (error) {
                    interaction.reply({content: `Il y a eu une erreur lors de la suppression du salon ${channel} de la liste de diffusion des news.`, ephemeral: true})
                    logError(error);
                    sendLogMessage(`Error : \`news-channel\` (**remove**) : ${error}`);
                }
            } else {
                interaction.reply({content: 'Ce salon ne fait pas partie de la liste de diffusion des news.', ephemeral: true});
            }
        } else {
            interaction.reply({content: 'Il y a eu une erreur lors de l\'exécution de la commande.'})
        }
    }
}
