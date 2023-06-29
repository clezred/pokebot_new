const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
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
				{name: 'Team', 	value: 'team'},
                //{name: 'PokéQuiz', 	value: 'pokequiz'},
                //{name: 'PokéParty', value: 'pokeparty'},
				{name: 'News Channel', value: 'news-channel'},
				{name: 'Publish', value: 'publish'},
				{name: 'Me', 		value: 'me'}
            )
        ),
		
	async execute(interaction) {

		const choice = interaction.options.getString('commande') ?? 'basic';

		const pkbServField = {
			name:"PokéBot Support Server",
			value: "Rejoins le [Serveur Discord Officiel](https://discord.gg/FrMYzXn48V) du PokéBot pour plus d'aide, plus d'informations ou pour nous partager tes suggestions pour le bot. (Il y a même des fonctionalités excusives !)"
		}

		if (choice === 'basic') {
			let guildCMDs = "";

			if (interaction.guild != null) {
				if (interaction.guildId == guildId) {
					guildCMDs += "\n- `/me`";
				}
				if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
					guildCMDs += "\n- `/news-channel`";
				}
				if (interaction.guildId == guildId && interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
					guildCMDs += "\n - `/publish`";
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
					description: "**Cette commande est exclusive au [Serveur Discord Officiel du PokéBot](https://discord.gg/FrMYzXn48V).**",
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
		} else if (choice == 'news-channel') {
			interaction.reply({
				embeds: [{
					title: "Aide commande News Channel",
					color: 0xFFFF00,
					description: "**Cette commande est réservée aux administrateurs**",
					fields: [{
							name: "Utilisation :",
							value: "```/news-channel ┬── add #channel\n              └── remove #channel```",
							inline: false
						},{
							name: "Description :",
							value: "Cette commande te permet d'ajouter ou de retirer un salon (de type textuel ou annonce) de la liste de diffusion des actualités du PokéBot.",
							inline: false
						},{
							name: "Exemple :",
							value: "Pour ajouter un salon à la liste :\n - `/news-channel add channel:<#id_du_salon>`\nPour retirer un salon de la liste :\n - `/news-channel remove channel:<#id_du_salon>`"
						}
					],
					footer: {text: "Aide demandée par " + interaction.user.username},
					timestamp: new Date,
				}],
				ephemeral: true
			})
		} else if (choice == 'publish') {
			interaction.reply({
				embeds: [{
					title: "Aide commande Publish",
					color: 0xFFFF00,
					description: "**Cette commande est réservée aux administrateurs du [Serveur Discord Officiel du PokéBot](https://discord.gg/FrMYzXn48V).**",
					fields: [{
							name: "Utilisation :",
							value: "```/publish {jsonFile}```",
							inline: false
						},{
							name: "Description :",
							value: "Cette commande permet de publier les actualités du PokéBot sur tous les salons ayant été ajouté à la liste de diffusion à l'aide d'un fichier JSON.\n*Voir la commande `/news-channel`*",
							inline: false
						},{
							name: "Exemple :",
							value: "Pour publier un nouveau message d'actualités :\n - `/publish {jsonFile}`\nMise en forme du fichier JSON :\n```JSON\n{\n\t\"content\": \"\",\n\t\"embeds\": [\n\t\t// structures d'embeds discord\n\t]\n}```"
						}
					],
					footer: {text: "Aide demandée par " + interaction.user.username},
					timestamp: new Date,
				}],
				ephemeral: true
			})
		} else if (choice == 'team') {
			interaction.reply({
				embeds: [{
					title: "Aide commande Team",
					color: 0xFFFF00,
					description: "",
					fields: [{
							name: "Utilisation :",
							value: "```/team```",
							inline: false
						},{
							name: "Description :",
							value: "Cette commande te permet d'obtenir une équipe de 6 Pokémons aléatoirement parmis les 1010 répertoriés.",
							inline: false
						},{
							name: "Exemple :",
							value: "Pour obtenir une équipe :\n - `/team`"
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
