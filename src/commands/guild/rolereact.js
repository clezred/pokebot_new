const { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, InteractionContextType } = require('discord.js');
const { logError, logInfo } = require('../../utils.js');
const { addRoleReactionRecord } = require('../../postgres-utils.js');
const { retreiveRoleReactions, setRoleReactionsUpdated } = require('../../rolereact-utils.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolereact')
        .setDescription('Gestion des rôles-réactions')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName("message_id")
            .setDescription("ID of the message")
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("channel_id")
            .setDescription("ID of the channel where the message was sent")
            .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName("max_reactions_per_user")
            .setDescription("Maximum reactions for a user")
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("emoji_0")
            .setDescription("Emoji corresponding to role_0")
            .setRequired(false)
        )
        .addMentionableOption(option =>
            option.setName("role_0")
            .setDescription("Role corresponding to emoji_0")
            .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("emoji_1")
            .setDescription("Emoji corresponding to role_1")
            .setRequired(false)
        )
        .addMentionableOption(option =>
            option.setName("role_1")
            .setDescription("Role corresponding to emoji_1")
            .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("emoji_2")
            .setDescription("Emoji corresponding to role_2")
            .setRequired(false)
        )
        .addMentionableOption(option =>
            option.setName("role_2")
            .setDescription("Role corresponding to emoji_2")
            .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("emoji_3")
            .setDescription("Emoji corresponding to role_3")
            .setRequired(false)
        )
        .addMentionableOption(option =>
            option.setName("role_3")
            .setDescription("Role corresponding to emoji_3")
            .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("emoji_4")
            .setDescription("Emoji corresponding to role_4")
            .setRequired(false)
        )
        .addMentionableOption(option =>
            option.setName("role_4")
            .setDescription("Role corresponding to emoji_4")
            .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("emoji_5")
            .setDescription("Emoji corresponding to role_5")
            .setRequired(false)
        )
        .addMentionableOption(option =>
            option.setName("role_5")
            .setDescription("Role corresponding to emoji_5")
            .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("emoji_6")
            .setDescription("Emoji corresponding to role_6")
            .setRequired(false)
        )
        .addMentionableOption(option =>
            option.setName("role_6")
            .setDescription("Role corresponding to emoji_6")
            .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("emoji_7")
            .setDescription("Emoji corresponding to role_7")
            .setRequired(false)
        )
        .addMentionableOption(option =>
            option.setName("role_7")
            .setDescription("Role corresponding to emoji_7")
            .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("emoji_8")
            .setDescription("Emoji corresponding to role_8")
            .setRequired(false)
        )
        .addMentionableOption(option =>
            option.setName("role_8")
            .setDescription("Role corresponding to emoji_8")
            .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("emoji_9")
            .setDescription("Emoji corresponding to role_9")
            .setRequired(false)
        )
        .addMentionableOption(option =>
            option.setName("role_9")
            .setDescription("Role corresponding to emoji_9")
            .setRequired(false)
        )
        .setContexts([
            InteractionContextType.Guild
        ])
    ,

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const messageId = interaction.options.getString("message_id");
        const channelId = interaction.options.getString("channel_id");

        const channel = channelId ? await interaction.guild.channels.fetch(channelId) : interaction.channel
        const guildId = interaction.guild.id;
        const message = await channel.messages.fetch(messageId);

        try {
            await interaction.deferReply({ephemeral: true});
            if (message) {
                const reactions = []
                for (let i = 0; i < 10; i++) {
                    const optionEmoji = interaction.options.getString(`emoji_${i}`);
                    const optionRole  = interaction.options.getMentionable(`role_${i}`);
    
                    if (optionEmoji && optionRole) {
                        reactions.push(
                            {
                                emoji: optionEmoji.trim(),
                                role: optionRole.id
                            }
                        );
                    } 
                }

                if (reactions.length < 1) throw new Error(`No reactions were given.`);

                const temp = interaction.options.getInteger("max_reactions_per_user")
                const max_reactions_per_user = 
                temp ? (temp > reactions.length ? reactions.length : temp) : reactions.length;
                
                for (const reaction of reactions) {
                    if (message.reactions)
                    await message.react(reaction.emoji)
                    .catch(err => {
                        message.reactions.removeAll()
                        throw new Error(`Error while adding reaction ${reaction.emoji} to message with id = ${messageId} and channel with id = ${channel.id}\n${err.message}`);
                    });
                };
                await addRoleReactionRecord(
                    guildId, message.channel.id, messageId, JSON.stringify(reactions), 
                    max_reactions_per_user, new Date().toISOString()
                );

                setRoleReactionsUpdated(true);
                await retreiveRoleReactions();

                await interaction.editReply({content: `RoleReaction added to database for message with id : ${messageId}`});
            } else {
                throw new Error(`Can't find message with id = ${messageId} and channel with id = ${channel.id}`);
            }
        } catch (error) {
            logError(error);
            console.error(error);
            await interaction.editReply({content: error.message});
        }
    }
}