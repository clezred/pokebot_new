const fs = require('node:fs');
const Papa = require('papaparse');
const path = require('node:path');
const { Client, GatewayIntentBits, Partials, ActivityType, Collection, Events, WelcomeChannel } = require('discord.js');
const { token } = require('./config.json');
const { gameActivity } = require('./assets/js/gameActivity');
const { random } = require('./assets/js/random.js')
const pkmGames = require('./assets/json/pkmgames.json')

const client = new Client({ 
    intents: [
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent
      ],
      partials: [
        Partials.Channel, 
        Partials.GuildMember,
        Partials.GuildScheduledEvent,
        Partials.Message,
        Partials.Reaction,
        Partials.ThreadMember,
        Partials.User
    ]
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

let maintenanceMode = false;
let vanishMode = false;

let pkmGameActivity;
let activityInterval;

let mainGuild; 
let logsChannel;

var pokeliste = Papa.parse(fs.readFileSync('./assets/csv/pokeliste.csv', "utf-8"), {encoding: "utf-8"})

client.login(token);

client.on('ready', () => {
    mainGuild = client.guilds.cache.get('759781274105151488') // à modifier
    logsChannel = mainGuild.channels.cache.get('1113867865314046112') // à modifier

    logsChannel.send(`Le bot est prêt en tant que ${client.user.tag}!`);

    pkmGameActivity = gameActivity();
    updateBotStatus();

    activityInterval = setInterval(() => {
        pkmGameActivity = gameActivity();
        updateBotStatus();
    }, 600000);
});

client.on('messageCreate', (message) => {
     // COMMANDES ADMIN
     if (message.author.id == '285400340696793090') {
        // ARRET COMPLET
        if (message.content.toUpperCase().startsWith('-STOP')) {
            clearInterval(activityInterval);
            logsChannel.send('Bot arrêté').then(() => {
               client.destroy(); 
            })
        } else
        // MAINTENANCE
        if (message.content.toUpperCase().startsWith('-MAINTENANCE')) {
            maintenanceMode = !maintenanceMode;
            if (maintenanceMode && vanishMode) {
                vanishMode = !vanishMode;
                logsChannel.send('Le bot a quitté le mode vanish');
            }
            if (maintenanceMode) {
                logsChannel.send('Le bot est en mode maintenance.');
            } else {
                logsChannel.send('Le bot a quitté le mode maintenance.');
            }
            updateBotStatus();
        } else 
        // VANISH
        if (message.content.toUpperCase().startsWith('-VANISH')) {
            vanishMode = !vanishMode;
            if (maintenanceMode && vanishMode) {
                maintenanceMode = !maintenanceMode;
                logsChannel.send('Le bot a quitté le mode maintenance.');
            }
            if (vanishMode) {
                logsChannel.send('Le bot est en mode vanish.');
            } else {
                logsChannel.send('Le bot a quitté le mode vanish.');
            }
            updateBotStatus();
        } 
     }
});

client.on(Events.InteractionCreate, async interaction => {
    
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

    if ((maintenanceMode || vanishMode) && interaction.user.id != '285400340696793090' && interaction.commandName != 'help') {
        interaction.reply({content: "Le PokéBot est indisponible pour le moment. Pour plus d'aide utilise la commande `/help`", ephemeral: true});
        return;
    }

    if (interaction.commandName == 'me' && interaction.guildId != '759781274105151488') {
        interaction.reply({content: "Tu n'es pas sur le bon serveur pour exécuter cette commande. Elle ne fontionne que sur le serveur officiel du PokéBot.", ephemeral: true});
        return;
    }

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on('guildMemberAdd', member => {

    if (member.guild.id === '759781274105151488') { // à modifier
        let pkID = random(1,905);
        let shiny = random(1,4096);//4096
        let pkm = pokeliste.data[pkID];
        let pkm_name = pkm[2]; 
        if (shiny == 1) {
            member.setNickname(member.user.username + " | " + pkm_name + "✨");
            member.roles.add(member.guild.roles.cache.get('1113904028414398585'));// à modifier
            pkm_name += " *shiny*";
        } else {
            member.setNickname(member.user.username + " | " + pkm_name);
        }
        logsChannel.send('Un **' + pkm_name + '** sauvage est apparu !\nBienvenue à toi <@' + member.user.id + "> !")
    }
  })

function updateBotStatus() {
    let name = pkmGames[pkmGameActivity];
    let activity = ActivityType.Playing;
    let status = 'online';

    if (vanishMode) {
        status = 'invisible'
    } else if (maintenanceMode) {
        name = 'Maintenance'
        status = 'dnd'
    }

    client.user.setPresence({
        activities: [{
          name: name,
          type: activity
        }],
        status: status 
    });
}

