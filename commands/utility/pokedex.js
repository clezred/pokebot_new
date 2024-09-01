const { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType } = require('discord.js');
const { pokedexID, pokedexName } = require('../../assets/js/pokedexEmbedBuilder.js');
const { guildId, logsChannelId } = require('../../config.json')
const gen = require('../../assets/json/genpkid.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pokedex')
		.setDescription('Te donne des informations sur le Pokémon de ton choix !')
        .addIntegerOption(option => 
            option.setName('id')
                .setDescription('Numéro (id) du Pokémon')
                .setRequired(false)
                .setMaxValue(gen[0][1])
                .setMinValue(gen[0][0])
        )
        .addStringOption(option => 
            option.setName('nom')
                .setDescription('Nom du Pokémon')
                .setRequired(false)
                .setMaxLength(20)
                .setMinLength(1)
        ),

    /**
     * Defines actions to do for this interaction
     * @param {ChatInputCommandInteraction} interaction - the interaction
     */
	async execute(interaction) {

        let id = interaction.options.getInteger('id') ?? null;
        let pkmName = interaction.options.getString('nom') ?? null;
        let mode = "UNDEFINED`";

        if (id != null) {
            mode = id + "` (*id*)"
            if (id > 0 && id < 1026) {
                await interaction.reply({embeds: [pokedexID(id-1)]});
            } else {
                await interaction.reply({content: "L'id de Pokémon fourni n'est pas valide, il doit être compris entre 1 et 905.", ephemeral: true});
            }
        } else if (pkmName != null) {
            mode = pkmName + "` (*name*)"
            let embed = pokedexName(pkmName);
            if (embed != null) {
                await interaction.reply({embeds: [embed]});
            } else {
                await interaction.reply({content: "Le nom de Pokémon fourni n'est pas valide, réessaie en vérifiant son orthographe.", ephemeral: true})
            }
        } else {
            await interaction.reply({content: "Tu as mal utilisé cette commande, réfères-toi à l'aide disponible via la commande `/help` et sélectionne l'aide relative à la commande `/pokedex`", ephemeral: true})
        }

        let guild = interaction.client.guilds.cache.get(guildId);
		let logsChannel = guild.channels.cache.get(logsChannelId);
		logsChannel.send("Command : `pokedex` | User : `" + interaction.user.username + "` | Entry : `" + mode + " | ChannelType : `" + Object.keys(ChannelType).find(key => ChannelType[key] === interaction.channel.type) + "`");
        interaction.client.stats.pokedex += 1;
	},
};
