const { SlashCommandBuilder } = require('discord.js');
const { guildId } = require('../../config.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription("Te donne de l'aide sur l'utilisation du PokéBot !")
		.addStringOption(option =>
            option.setName('commande')
            .setDescription('Obtenir de l\'aide sur une commande en particulier')
            .addChoices(
                {name: 'Pokédex', 	value: 'pokedex'},
                {name: 'PokéLoto', 	value: 'pokeloto'},
                //{name: 'PokéQuiz', 	value: 'pokequiz'},
                //{name: 'PokéParty', value: 'pokeparty'},
				{name: 'Me', 		value: 'me'}
            )
        ),
		
	async execute(interaction) {

		const choice = interaction.options.getString('commande') ?? 'basic'

		const pkbServField = {
			name:"PokéBot Support Server",
			value: "Rejoins le [Serveur Discord Officiel](https://discord.gg/FrMYzXn48V) du PokéBot pour plus d'aide, plus d'informations ou pour nous partager tes suggestions pour le bot. (Il y a même des fonctionalités excusives !)"
		}

		if (choice === 'basic') {
			let guildCMDs = "";

			if (interaction.guild != null) {
				if (interaction.guildId == guildId) {
					guildCMDs = "\n- `/me`";
				}
			}

			interaction.reply({
				embeds: [{
					title: "Aide PokéBot",
					color: 0xFFFF00,
					description: "**Présentation du PokéBot :**\nLe PokéBot est un bot Discord créé par [clezred](https://twitch.tv/clezred) et basé sur l'univers de Pokémon. Grâce à lui, tu pourras jouer à des mini-jeux et en apprendre plus sur les Pokémons !",
					fields: [{
							name: "Liste des commandes :",
							value: "- `/help`\n- `/pokedex`\n- `/pokeloto`\n- `/team`" + guildCMDs,
							inline: false
						},
						pkbServField
					],
					footer: {text: "Aide demandée par " + interaction.user.username},
					timestamp: new Date,
				}],
				ephemeral: true
			})
		} else if (choice === 'pokedex') {
			interaction.reply({
				embeds: [{
					title: "Aide commande Pokédex",
					color: 0xFFFF00,
					description: "",
					fields: [{
							name: "Utilisation :",
							value: "```/pokedex ┬── $numéro_du_pokémon\n         └── $nom_du_pokémon```",
							inline: false
						},{
							name: "Description :",
							value: "Cette commande te permet d'obtenir la page Pokédex de n'importe quel Pokémon. Il te suffit de renseigner soit son nom (bien orthographié et en français) soit son numéro.",
							inline: false
						},{
							name: "Exemple :",
							value: "Pour obtenir la page Pokédex de Dracaufeu tu peux utiliser :\n - `/pokedex nom:dracaufeu`\n- `/pokedex id:6`"
						},
						pkbServField
					],
					footer: {text: "Aide demandée par " + interaction.user.username},
					timestamp: new Date,
				}],
				ephemeral: true
			})
		} else if (choice === 'pokeloto') {
			interaction.reply({
				embeds: [{
					title: "Aide commande PokéLoto",
					color: 0xFFFF00,
					description: "",
					fields: [{
							name: "Utilisation :",
							value: "```/pokeloto```",
							inline: false
						},{
							name: "Description :",
							value: "Cette commande te permet d'afficher un Pokémon aléatoire parmis les 1010 répertoriés. Tu peux également restreindre l'aléatoire à une génération en particulier.",
							inline: false
						},{
							name: "Exemple :",
							value: "Pour obtenir aléatoirement un Pokémon tu peux utiliser :\n - `/pokeloto`\n- `/pokedex generation:1` (1ère génération)",
							inline: false
						},
						pkbServField
					],
					footer: {text: "Aide demandée par " + interaction.user.username},
					timestamp: new Date,
				}],
				ephemeral: true
			})
		} else if (choice === 'pokequiz') {
			interaction.reply({
				embeds: [{
					title: "Aide commande PokéQuiz",
					color: 0xFFFF00,
					description: "",
					fields: [{
							name: "",
							value: "",
							inline: false
						},
						pkbServField
					],
					footer: {text: "Aide demandée par " + interaction.user.username},
					timestamp: new Date,
				}],
				ephemeral: true
			})
		} else if (choice === 'pokeparty') {
			interaction.reply({
				embeds: [{
					title: "Aide commande PokéParty",
					color: 0xFFFF00,
					description: "",
					fields: [{
							name: "",
							value: "",
							inline: false
						},
						pkbServField
					],
					footer: {text: "Aide demandée par " + interaction.user.username},
					timestamp: new Date,
				}],
				ephemeral: true
			})
		} else if (choice == 'me') {
			interaction.reply({
				embeds: [{
					title: "Aide commande Me",
					color: 0xFFFF00,
					description: "**Cette commande est exclusive au [Serveur Discord Officiel du PokéBot](https://discord.gg/FrMYzXn48V).",
					fields: [{
							name: "Utilisation :",
							value: "```/me```",
							inline: false
						},{
							name: "Description :",
							value: "Cette commande te permet de changer, aléatoirement, le Pokémon qui t'as précédemment été attribué soit quand tu es arrivé sur le serveur, soit la dernière fois que tu as utilisé la commande. Elle est utilisable 1 fois par semaine et par utilisateur et tu peux avoir la chance de tomber sur un shiny ! (1 chance sur 4096)",
							inline: false
						},{
							name: "Exemple :",
							value: "Pour obtenir ton nouveau Pokémon tu peux utiliser :\n - `/me`"
						}
					],
					footer: {text: "Aide demandée par " + interaction.user.username},
					timestamp: new Date,
				}],
				ephemeral: true
			})
		}
	},
};
