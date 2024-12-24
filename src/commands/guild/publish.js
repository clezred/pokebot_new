const { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, InteractionContextType } = require('discord.js');
const axios = require('axios');
const { sendNews } = require('../../publish');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('publish')
        .setDescription('Publier un nouveau rapport dans les news')
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('Le fichier du message')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts([
            InteractionContextType.Guild
        ])
    ,
    
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     * @returns 
     */
    async execute(interaction) {
        const attachment = interaction.options.getAttachment('file');

        await interaction.deferReply({ephemeral: true});

        if (!attachment) {
            interaction.editReply({content: 'Erreur avec l\'attachment.'})
            return;
        }

        let fileContent = "";

        await axios.get(attachment.url, { responseType: 'text' })
            .then(response => {
                fileContent = response.data;
            })
            .catch(error => {
                console.error(error);
            });

        let newsMessage;
        try {
            newsMessage = JSON.parse(fileContent);
        } catch (error) {
            interaction.editReply({content: 'Erreur lors de la lecture du fichier.', ephemeral: true})
            return;
        }

        const sendButton = new ButtonBuilder()
            .setCustomId('send_news')
            .setLabel('Envoyer')
            .setStyle(ButtonStyle.Success);
        
        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_news')
            .setLabel('Annuler')
            .setStyle(ButtonStyle.Danger);

        const actionsRow = new ActionRowBuilder()
            .addComponents(sendButton, cancelButton);
        
        const newsMessageCopy = {...newsMessage};
        newsMessageCopy.components = newsMessageCopy.components ? newsMessageCopy.components.push(actionsRow) : newsMessageCopy.components = [actionsRow];

        const testMessage = await interaction.editReply(newsMessageCopy);

        const filter = i => {
            i.deferUpdate();
            return i.user.id === interaction.user.id;
        }

        const decisionCollector = testMessage.createMessageComponentCollector({filter:  filter, componentType: ComponentType.Button, time: 300000, max: 1});

        let isCorrect = false;

        decisionCollector.on('collect', async b => {
            if (b.customId === 'send_news') {
                isCorrect = true;
            }
        })

        decisionCollector.on('end', async () => {
            if (isCorrect) {
                interaction.editReply({content: 'Envoi en cours...', embeds: [], components: []});
                await sendNews(newsMessage);
                interaction.editReply({content: 'News envoyées.'});
            } else {
                interaction.editReply({content: 'Envoi annulé.', embeds: [], components: []});
            }
        });
    }
}