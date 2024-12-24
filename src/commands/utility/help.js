const { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ChannelType, ApplicationCommandOptionType, InteractionContextType } = require('discord.js');
const { guildId, logsChannelId } = require('../../../config/ids.json');
const { getGuild } = require('../../discord-client');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription("Te donne de l'aide sur l'utilisation du PokéBot !")
		.addStringOption(option =>
            option.setName('commande')
            .setDescription('Obtenir de l\'aide sur une commande en particulier')
            .addChoices(
                { name: 'Pokédex', 		value: 'pokedex'		},
                { name: 'PokéQuiz', 	value: 'pokequiz'		},
                { name: 'PokéParty', 	value: 'pokeparty'		},
				{ name: 'PokéLoto', 	value: 'pokeloto'		},
				{ name: 'Team', 		value: 'team'			},
				{ name: 'Me', 			value: 'me'				},
				{ name: 'News Channel', value: 'news-channel'	},
				{ name: 'Support', 		value: 'support'		},
            )
        )
		.setContexts([
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel,
			InteractionContextType.BotDM
		])
	,
	
	/**
	 * Defines actions to do for this interaction
	 * @param {ChatInputCommandInteraction} interaction - the interaction
	 */
	async execute(interaction) {
		await interaction.deferReply({ephemeral: true})

		const choice = interaction.options.getString('commande') ?? 'default';

		const color = 0xFFFF00;

		const pkbServField = {
			name:"PokéBot Support Server",
			value: "Rejoins le [Serveur Discord Officiel](https://discord.gg/FrMYzXn48V) du PokéBot pour plus d'aide, plus d'informations ou pour nous partager tes suggestions pour le bot. (Il y a même des fonctionalités excusives !)"
		}

		const globalCommands = await interaction.client.application.commands.fetch();
		const commands = globalCommands.map(cmd => cmd).flatMap(cmd => {
			const cmds = [];
			if (cmd.contexts.includes(interaction.context)) {
				if (cmd.options.length > 0) {
					for (const option of cmd.options) {
						if (option.type === ApplicationCommandOptionType.Subcommand) {
							cmds.push(`/${cmd.name} ${option.name}`);
						}
					}
				} 

				if (cmds.length === 0) {
					cmds.push(`/${cmd.name}`);
				}
			}
			return cmds.map(c => `<${c}:${cmd.id}>`);
		});

		if (interaction.guild != null && interaction.guildId == guildId) {
			const baseGuild = await getGuild(guildId);
			const guildCommands = await baseGuild.commands.fetch();
			guildCommands.forEach(cmd => {
				if (cmd.applicationId === interaction.client.application.id && interaction.member.permissions.has(cmd.defaultPermission)) {
					commands.push(`</${cmd.name}:${cmd.id}>`);
				}
			});
		}

		if (choice === 'default') {
			interaction.editReply({
				embeds: [{
					title: "Aide PokéBot",
					color: color,
					description: "**Présentation du PokéBot**\nLe PokéBot est un bot Discord créé par [clezred](https://twitch.tv/clezred) et basé sur l'univers de Pokémon. Grâce à lui, tu pourras jouer à des mini-jeux et en apprendre plus sur les Pokémons !",
					fields: [{
							name: "Liste des commandes utilisables",
							value: commands.join(' '),
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
			interaction.editReply({
				embeds: [{
					title: "Aide commande Pokédex",
					color: color,
					description: commands.find(cmd => cmd.includes('pokedex')),
					fields: [{
							name: "Utilisation",
							value: "```/pokedex ┬── $numéro_du_pokémon\n         └── $nom_du_pokémon```",
							inline: false
						},{
							name: "Description",
							value: "Cette commande te permet d'obtenir la page Pokédex de n'importe quel Pokémon. Il te suffit de renseigner soit son nom (bien orthographié et en français) soit son numéro.",
							inline: false
						},{
							name: "Exemple",
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
			interaction.editReply({
				embeds: [{
					title: "Aide commande PokéLoto",
					color: color,
					description: commands.find(cmd => cmd.includes('pokeloto')),
					fields: [{
							name: "Utilisation",
							value: "```/pokeloto\nOptions :\n- generation: 1-9 (Toutes par défaut)```",
							inline: false
						},{
							name: "Description",
							value: "Cette commande te permet d'afficher un Pokémon aléatoire parmis les 1010 répertoriés. Tu peux également restreindre l'aléatoire à une génération en particulier.",
							inline: false
						},{
							name: "Exemple",
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
		} else if (choice === 'pokeparty') {
			interaction.editReply({
				embeds: [{
					title: "Aide commande PokéParty",
					color: color,
					description: commands.find(cmd => cmd.includes('pokeparty')),
					fields: [{
							name: "Utilisation",
							value: "```/pokeparty\nOptions :\n- acces ┬── Publique (par défaut)\n        └── Privé\n- generation: 1-9 (Toutes par défaut)\n- difficulty: (Dresseur par défaut)\n- joueurN: @user (optionel)```",
							inline: false
						},{
							name: "Description",
							value: "Cette commande te permet de jouer à la version multijoueur du PokéQuiz ! En fonction de la difficulté sélectionnée, les joueurs disposent d'un nombre limité (ou non) d'essais, d'un certain nombre d'indices bonus et d'un temps plus ou moins court pour deviner le Pokémon. Une fois la partie terminée il est possible d'en relancer une et d'afficher la page Pokédex du Pokémon de la partie.",
							inline: false
						},{
							name: "Exemple",
							value: "Pour lancer une partie publique :\n`/pokeparty` ou `/pokeparty acces:Publique`\nPour lancer une partie privée :\n`/pokeparty acces:Privée`\nPour lancer une partie en ajoutant directement des joueurs :\n `/pokeparty joueur2: @user joueur3: @user ...`"
						}, 
						pkbServField
					],
					footer: {text: "Aide demandée par " + interaction.user.username},
					timestamp: new Date,
				}],
				ephemeral: true
			})
		} else if (choice == 'me') {
			interaction.editReply({
				embeds: [{
					title: "Aide commande Me",
					color: color,
					description: "*Cette commande est exclusive au [Serveur Discord Officiel du PokéBot](https://discord.gg/FrMYzXn48V).*\n" + commands.find(cmd => cmd.includes('me')),
					fields: [{
							name: "Utilisation",
							value: "```/me```",
							inline: false
						},{
							name: "Description",
							value: "Cette commande te permet de changer, aléatoirement, le Pokémon qui t'as précédemment été attribué soit quand tu es arrivé sur le serveur, soit la dernière fois que tu as utilisé la commande. Elle est utilisable 1 fois par semaine et par utilisateur et tu aura peut-être la chance de tomber sur un shiny ! (*1/4096*)",
							inline: false
						},{
							name: "Exemple",
							value: "Pour obtenir ton nouveau Pokémon tu peux utiliser :\n - `/me`"
						},
						pkbServField
					],
					footer: {text: "Aide demandée par " + interaction.user.username},
					timestamp: new Date,
				}],
				ephemeral: true
			})
		} else if (choice == 'news-channel') {
			interaction.editReply({
				embeds: [{
					title: "Aide commande News Channel",
					color: color,
					description: "*Cette commande est réservée aux administrateurs de serveurs*\n" + commands.find(cmd => cmd.includes('news-channel add')) + " | " + commands.find(cmd => cmd.includes('news-channel remove')),
					fields: [{
							name: "Utilisation",
							value: "```/news-channel ┬── add #channel\n              └── remove #channel```",
							inline: false
						},{
							name: "Description",
							value: "Cette commande te permet d'ajouter ou de retirer un salon (de type textuel ou annonce) de la liste de diffusion des actualités du PokéBot.",
							inline: false
						},{
							name: "Exemple",
							value: "Pour ajouter un salon à la liste :\n - `/news-channel add channel:<#id_du_salon>`\nPour retirer un salon de la liste :\n - `/news-channel remove channel:<#id_du_salon>`"
						},
						pkbServField
					],
					footer: {text: "Aide demandée par " + interaction.user.username},
					timestamp: new Date,
				}],
				ephemeral: true
			})
		} else if (choice == 'team') {
			interaction.editReply({
				embeds: [{
					title: "Aide commande Team",
					color: color,
					description: commands.find(cmd => cmd.includes('team')),
					fields: [{
							name: "Utilisation",
							value: "```/team\nOptions :\n- generation: 1-9 (Toutes par défaut)```",
							inline: false
						},{
							name: "Description",
							value: "Cette commande te permet d'obtenir une équipe de 6 Pokémons aléatoirement parmis les 1010 répertoriés.",
							inline: false
						},{
							name: "Exemple",
							value: "Pour obtenir une équipe :\n - `/team`"
						},
						pkbServField
					],
					footer: {text: "Aide demandée par " + interaction.user.username},
					timestamp: new Date,
				}],
				ephemeral: true
			})
		} else if (choice == 'pokequiz') {
			interaction.editReply({
				embeds: [{
					title: "Aide commande PokéQuiz",
					color: color,
					description: commands.find(cmd => cmd.includes('pokequiz')),
					fields: [{
							name: "Utilisation",
							value: "```/pokequiz\nOptions :\n- generation: 1-9 (Toutes par défaut)\n- difficulty: (Dresseur par défaut)```",
							inline: false
						},{
							name: "Description",
							value: "Cette commande te permet de jouer au PokéQuiz ! Un jeu dans lequel tu devras, grâce à différents indices, retrouver le Pokémon correspondant à la description.",
							inline: false
						},{
							name: "Exemple",
							value: "Pour commencer une partie :\n - `/team`"
						},
						pkbServField
					],
					footer: {text: "Aide demandée par " + interaction.user.username},
					timestamp: new Date,
				}],
				ephemeral: true
			})
		} else if (choice == 'support') {
			interaction.editReply({
				embeds: [{
					title: "Aide commande Support",
					color: color,
					description: commands.find(cmd => cmd.includes('support')),
					fields: [
						{
							name: "Utilisation",
							value: "```/support```",
							inline: false
						},{
							name: "Description",
							value: "Cette commande te permet d'obtenir un lien d'invitation pour rejoindre le [Serveur Discord Officiel](https://discord.gg/FrMYzXn48V) du PokéBot.",
							inline: false
						},{
							name: "Exemple",
							value: "Pour obtenir le lien d'invitation :\n - `/support`"
						},
						pkbServField
					],
					footer: {text: "Aide demandée par " + interaction.user.username},
					timestamp: new Date,
				}],
				ephemeral: true
			})
		}

		let guild = interaction.client.guilds.cache.get(guildId);
		let logsChannel = guild.channels.cache.get(logsChannelId);
		logsChannel.send("Command : `help` | User : `" + interaction.user.username + "` | Choice : `" + choice + "` | ChannelType : `" + Object.keys(ChannelType).find(key => ChannelType[key] === interaction.channel.type) + "`");
	},
};
