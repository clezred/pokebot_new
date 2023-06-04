const { SlashCommandBuilder } = require('discord.js');
const { pokedexID, pokedexName } = require('../../assets/js/pokedexEmbedBuilder.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pokedex')
		.setDescription('Te donne des informations sur le Pokémon de ton choix !')
        .addIntegerOption(option => 
            option.setName('id')
                .setDescription('Numéro (id) du Pokémon')
                .setRequired(false)
        )
        .addStringOption(option => 
            option.setName('nom')
                .setDescription('Nom du Pokémon')
                .setRequired(false)
        ),
	async execute(interaction) {

        let id = interaction.options.getInteger('id') ?? null;
        let pkmName = interaction.options.getString('nom') ?? null;

        if (id != null) {
            if (id > 0 && id < 906) {
                await interaction.reply({embeds: [pokedexID(id-1)]});
            } else {
                await interaction.reply({content: "L'id de Pokémon fourni n'est pas valide, il doit être compris entre 1 et 905.", ephemeral: true});
            }
        } else if (pkmName != null) {
            let embed = pokedexName(pkmName);
            if (embed != null) {
                await interaction.reply({embeds: [embed]});
            } else {
                await interaction.reply({content: "Le nom de Pokémon fourni n'est pas valide, réessaie en vérifiant son orthographe.", ephemeral: true})
            }
        } else {
            await interaction.reply({content: "Tu as mal utilisé cette commande, réfères-toi à l'aide disponible via la commande `/help pokedex`", ephemeral: true})
        }
	},
};
