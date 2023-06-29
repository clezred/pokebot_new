const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getPsqlClient } = require('../../index.js');

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
        .setDMPermission(false),

    async execute(interaction) {

        const psqlClient = getPsqlClient();

        let result = await psqlClient.query(`SELECT * FROM news_channel WHERE guild_id = '${interaction.guild.id}'`);

        let channels = [];

        result.rows.forEach(row => {
            channels.push(row.channel_id);
        })

        if (interaction.options.getSubcommand() === 'add') {
            const channel = interaction.options.getChannel('channel');

            if (channels.includes(`${channel.id}`)) {
                interaction.reply({content: 'Ce salon fait déjà partie de la liste de diffusion des news.', ephemeral: true});
            } else {
                try {
                    await psqlClient.query(`INSERT INTO news_channel VALUES ('${interaction.guild.id}', '${channel.id}')`);
                    interaction.reply({content: `Le salon <#${channel.id}> a été ajouté de la liste de diffusion des news.`, ephemeral: true});
                } catch (error) {
                    interaction.reply({content: `Il y a eu une erreur lors de l'ajout du salon <#${channel.id}> de la liste de diffusion des news.`, ephemeral: true})
                    console.error(error);
                }
            }

        } else if (interaction.options.getSubcommand() === 'remove') {
            const channel = interaction.options.getChannel('channel');

            if (channels.includes(`${channel.id}`)) {
                try {
                    await psqlClient.query(`DELETE FROM news_channel WHERE guild_id = '${interaction.guild.id}' AND channel_id = '${channel.id}'`);
                    interaction.reply({content: `Le salon <#${channel.id}> a été retiré de la liste de distribution des news.`, ephemeral: true});
                } catch (error) {
                    interaction.reply({content: `Il y a eu une erreur lors de la suppression du salon <#${channel.id}> de la liste de diffusion des news.`, ephemeral: true})
                    console.error(error);
                }
            } else {
                interaction.reply({content: 'Ce salon ne fait pas partie de la liste de diffusion des news.', ephemeral: true});
            }
        } else {
            interaction.reply({content: 'Il y a eu une erreur lors de l\'exécution de la commande.'})
        }
    }
}
