const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, DiscordjsErrorCodes } = require('discord.js');
const { random } = require('../../assets/js/random');
const { getPsqlClient } = require('../../index.js')
const { shinyRoleId } = require('../../config.json');
const fs = require('node:fs');
const Papa = require('papaparse');

var pokeliste = Papa.parse(fs.readFileSync('./assets/csv/pokeliste.csv', "utf-8"), {encoding: "utf-8"});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('me')
		.setDescription('Te permet d\'obtenir le Pokémon qui te repésente sur le serveur du PokéBot !'),

	async execute(interaction) {

        let result;

        const psqlClient = getPsqlClient();

        await psqlClient.query('SELECT * FROM pbsrvmembers')
            .then((res) => {
                result = res.rows;
            })
            .catch((error) => console.error(error));
        
        let ligne;

        await result.forEach(row => {
            if (row.user_id == interaction.user.id) {
                ligne = row 
            }
        });

        let now = new Date();

        if (ligne != undefined) {
            let last = new Date(ligne.last_me);
            const differenceInTime = now.getTime() - last.getTime();
            const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
            if (differenceInDays < 7) {
                interaction.reply({content: 'Tu as déjà utilisé cette commande il y a moins de 7 jours, il te faut encore attendre ' + (7 - differenceInDays) + ' jour(s) avant de pouvoir obtenir un nouveau Pokémon.', ephemeral: true})
                return;
            } else {
                await psqlClient.query(`UPDATE pbsrvmembers SET last_me = '${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}' WHERE user_id = '${interaction.user.id}'`)
                    .catch((error) => console.error(error));
            }
        } else {
            await psqlClient.query(`INSERT INTO pbsrvmembers VALUES ('${interaction.user.id.toString()}', '${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}')`)
                .catch((error) => console.error(error));
        }

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
