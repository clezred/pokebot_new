const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events } = require('discord.js');
const { random } = require('../../assets/js/random');
const fs = require('node:fs');
const Papa = require('papaparse');

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
        })

        const client = interaction.client;

        client.on(Events.InteractionCreate, async subinteraction => {
            if (subinteraction.user.id != interaction.user.id) return;

            if (subinteraction.isChatInputCommand() && subinteraction.commandName == 'me') interaction.deleteReply();

            if (!subinteraction.isButton()) return;

            const member = interaction.guild.members.cache.get(subinteraction.user.id);

            let pkID = random(1,1010);
            let shiny = random(1,4096);//4096
            let pkm = pokeliste.data[pkID];
            let pkm_name = pkm[2];
            let displayName = member.user.username;
            if (displayName.length > (32 - (pkm_name.length + 4))) {
                displayName = displayName.substring(0, (32 - (pkm_name.length + 7))) + "..."
            }

            if (shiny == 1) {
                member.setNickname(displayName + " | " + pkm_name + "✨");
                if (!member.roles.cache.has('1113904028414398585')) member.roles.add(member.guild.roles.cache.get('1113904028414398585'));// à modifier
            } else {
                member.setNickname(displayName + " | " + pkm_name);
                if (member.roles.cache.has('1113904028414398585')) member.roles.remove(member.roles.cache.get('1113904028414398585')); // à modifier
            }

            subinteraction.deferUpdate();
            interaction.deleteReply();
        })
	},
};
