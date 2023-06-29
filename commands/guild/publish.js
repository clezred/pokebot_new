const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getPsqlClient } = require('../../index.js');
const { deleteInTable } = require('../../assets/js/databaseFunctions.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('publish')
        .setDescription('Publier un nouveau rapport dans les news')
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('Le fichier du message')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        const psqlClient = getPsqlClient();
        const client = interaction.client;
        const attachment = await interaction.options.getAttachment('file');

        let attachmentURL;
        if (attachment) {
            attachmentURL = attachment.url;
        } else {
            interaction.reply({content: 'Erreur avec l\'attachment.'})
            return;
        }

        let fileContent = "";

        await axios.get(attachmentURL, { responseType: 'text' })
            .then(response => {
                fileContent = response.data;
            })
            .catch(error => {
                console.error(error);
            });

        if (fileContent == "") {
            interaction.reply({content: 'Erreur lors de la lecture du fichier.', ephemeral: true})
            return;
        }

        await client.guilds.fetch();

        let result = await psqlClient.query(`SELECT * FROM news_channel`);

        let channels = [];

        result.rows.forEach(row => {
            channels.push([row.guild_id, row.channel_id]);
        })

        let count = 0;
        let errors = 0;
        let deleted_guilds = [];
        let deleted_channels = [];

        channels.forEach(channel => {
            try {
                let guild = client.guilds.cache.get(channel[0]);

                if (guild == undefined) {
                    errors++;
                    if (!deleted_guilds.includes(channel[0])) deleted_guilds.push(channel[0]);
                } else {
                    let ch = guild.channels.cache.get(channel[1]);

                    if (ch == undefined) {
                        errors++;
                        if (!deleted_channels.includes(channel[1])) deleted_channels.push(channel[1]);
                    } else {
                        ch.send(JSON.parse(fileContent));
                        count++;
                    }
                }
            } catch (error) {
                console.error(error);
            }
        })

        interaction.reply({content: `Actualité envoyée sur ${count} salon(s). ${errors} erreur(s).`, ephemeral:true})

        if (errors > 0) {
            deleted_guilds.forEach(id => {
                deleteInTable(psqlClient, 'news_channel', 'guild_id', `'${id}'`)
            })
            deleted_channels.forEach(id => {
                deleteInTable(psqlClient, 'news_channel', 'channel_id', `'${id}'`)
            })
        }
    }
}