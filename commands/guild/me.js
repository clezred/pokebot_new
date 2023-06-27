const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, DiscordjsErrorCodes } = require('discord.js');
const { random } = require('../../assets/js/random');
const { shinyRoleId } = require('../../config.json')
const fs = require('node:fs');
const Papa = require('papaparse');
const { error } = require('node:console');

var pokeliste = Papa.parse(fs.readFileSync('./assets/csv/pokeliste.csv', "utf-8"), {encoding: "utf-8"});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('me')
		.setDescription('Te permet d\'obtenir le Pokémon qui te repésente sur le serveur du PokéBot !'),

	async execute(interaction) {
		const button = new ButtonBuilder()
            .setLabel('Obtenir mon Pokémon')
            .setCustomId('get-my-pokemon')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder()
            .addComponents(button);
        
        await interaction.reply({
            content: 'Souhaites-tu obtenir le Pokémon qui te représente ?\nCela affectera ton pseudo sur le serveur.', 
            components: [row],
            ephemeral: true
        }).then(async message => {
            await message.awaitMessageComponent({
                filter: (subinteraction) => subinteraction.customId === 'get-my-pokemon' && subinteraction.user.id === interaction.user.id,
                componentType: ComponentType.Button,
                time: 15000,
                dispose: true
            }).then(async subinteraction => {

                let member = interaction.member;

                let pkID = random(1,1010);
                let shiny = random(1,4096);//4096
                let pkm = pokeliste.data[pkID];
                let pkm_name = pkm[2];
                let displayName = member.user.username;
                if (displayName.length > (32 - (pkm_name.length + 4))) {
                    displayName = displayName.substring(0, (32 - (pkm_name.length + 7))) + "...";
                }

                if (shiny == 1) {
                    member.setNickname(displayName + " | " + pkm_name + "✨");
                    if (!member.roles.cache.has(shinyRoleId)) member.roles.add(member.guild.roles.cache.get(shinyRoleId));
                } else {
                    member.setNickname(displayName + " | " + pkm_name);
                    if (member.roles.cache.has(shinyRoleId)) member.roles.remove(member.roles.cache.get(shinyRoleId));
                }

                await subinteraction.deferUpdate();

                await interaction.deleteReply();

            }).catch(error => {
                if (error.code === DiscordjsErrorCodes.InteractionCollectorError) {
                    interaction.deleteReply().catch(console.error);
                } else {
                    console.error(error);
                }
            })
        })
	},
};
