const fs = require('node:fs');
const Papa = require('papaparse');
const path = require('node:path');
const { Client, GatewayIntentBits, Partials, ActivityType, Collection, Events } = require('discord.js');
const { token, guildId, logsChannelId, shinyRoleId, welcomeChannelId, servCountChId, notifsChannelId, notifsMessageId, notifsRoleId } = require('./config.json');
const { Client: PostgresClient } = require('pg');
const { dbUser, dbHost, dbName, dbPasswd, dbPort } = require('./config.json');
const { random } = require('./assets/js/random.js');
const pkmGames = require('./assets/json/pkmgames.json');

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

const psqlClient = new PostgresClient({
    user: dbUser,
    host: dbHost,
    database: dbName,
    password: dbPasswd,
    port: dbPort,
})

async function dbConnect() {
    await psqlClient.connect()
        .then(() => {
            console.log('Connecté à la base de données PostgreSQL');
        })
        .catch((err) => {
            console.error('Erreur lors de la connexion à la base de données', err);
            client.destroy()
        });
}

dbConnect();

function getPsqlClient() {
    return psqlClient;
}

module.exports = { getPsqlClient }

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

let pkmGameActivity;
let activityInterval;

let guilds;
let mainGuild; 
let logsChannel;
let servCountCh;

let intVars = {};
let boolVars = {
    "maintenance": false,
    "vanish": false
};

var pokeliste = Papa.parse(fs.readFileSync('./assets/csv/pokeliste.csv', "utf-8"), {encoding: "utf-8"})

client.login(token);

client.on(Events.ClientReady, async () => {
    mainGuild = client.guilds.cache.get(guildId);
    logsChannel = mainGuild.channels.cache.get(logsChannelId);
    welcChannel = mainGuild.channels.cache.get(welcomeChannelId);
    servCountCh = mainGuild.channels.cache.get(servCountChId);

    logsChannel.send(`PokéBot en ligne !`);

    await refreshIntVars();
    await refreshBoolVars();
    refreshNotifsRoles();

    pkmGameActivity = random(1,38);
    updateBotStatus();
    updateStats();

    activityInterval = setInterval(() => {
        pkmGameActivity = random(1,38);
        updateBotStatus();
        updateStats();
    }, 600000);
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (reaction.message.id === notifsMessageId) {
        const { guild } = reaction.message;

        const member = guild.members.cache.get(user.id);

        if (member) {
            try {
                const role = guild.roles.cache.get(notifsRoleId);
                await member.roles.add(role);
            } catch (error) {
                console.error(`Erreur lors de l'ajout du rôle : ${error}`);
            }
        }
    }
})

client.on(Events.MessageReactionRemove, async (reaction, user) => {
    if (reaction.message.id === notifsMessageId) {
        const { guild } = reaction.message;

        const member = guild.members.cache.get(user.id);
        
        if (member) {
            try {
                const role = guild.roles.cache.get(notifsRoleId);
                await member.roles.remove(role);
            } catch (error) {
                console.error(`Erreur lors de l'enlèvement du rôle : ${error}`);
            }
        }
    }
})

client.on(Events.InteractionCreate, async interaction => {

	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

    if ((boolVars.maintenance || boolVars.vanish) && interaction.user.id != '285400340696793090' && interaction.commandName != 'help') {
        interaction.reply({content: "Le PokéBot est indisponible pour le moment. Pour plus d'aide utilise la commande `/help`", ephemeral: true});
        return;
    }

    if (interaction.commandName == 'me') {
        if (interaction.user.id == interaction.guild.ownerId) {
            interaction.reply({content: "Je n'ai pas le droit d'agir sur le propriétaire du serveur, je ne peux donc pas t'assigner un Pokémon.", ephemeral: true});
            return;
        }
    }

    if (interaction.commandName == 'pokebot') {
        if (interaction.options.getSubcommand() == 'stop') {
            try {
                pkbotStop()
            } catch (error) {
                interaction.reply({content: 'Erreur lors de l\'arrêt du bot', ephemeral: true})
                return;
            }
        } else if (interaction.options.getSubcommand() == 'maintenance') {
            try {
                pkbotMaintenance()
            } catch (error) {
                interaction.reply({content: 'Erreur lors de la maintenance du bot', ephemeral: true})
                return;
            }
        } else if (interaction.options.getSubcommand() == 'vanish') {
            try {
                pkbotVanish()
            } catch (error) {
                interaction.reply({content: 'Erreur lors du vanish du bot', ephemeral: true})
                return;
            }
        } else if (interaction.options.getSubcommand() == 'servers') {
            try {
                pkbotServers()
            } catch (error) {
                interaction.reply({content: 'Erreur lors de l\'affichage des serveurs du bot', ephemeral: true})
                return;
            }
        }
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

client.on(Events.GuildMemberAdd, member => {

    if (member.guild.id === guildId) {
        let pkID = random(1,905);
        let shiny = random(1,4096);//4096
        let pkm = pokeliste.data[pkID];
        let pkm_name = pkm[2];
        let displayName = member.user.username;
        if (displayName.length > (32 - (pkm_name.length + 4))) {
            displayName = displayName.substring(0, (32 - (pkm_name.length + 7))) + "...";
        }

        if (shiny == 1) {
            member.setNickname(displayName + " | " + pkm_name + "✨");
            member.roles.add(member.guild.roles.cache.get(shinyRoleId));
            pkm_name += " *shiny*";
        } else {
            member.setNickname(displayName + " | " + pkm_name);
        }
        welcChannel.send('Un **' + pkm_name + '** sauvage est apparu !\nBienvenue à toi <@' + member.user.id + "> !")
    }
})

client.on(Events.GuildCreate, async guild => {
    await guild.fetch()
    logsChannel.send(`PokéBot ajouté au serveur ${guild.name} qui compte ${guild.memberCount} membres.`)
    updateStats();
})

client.on(Events.GuildDelete, guild => {
    logsChannel.send(`PokéBot retiré du serveur ${guild.name} qui compte ${guild.memberCount} membres.`)
    updateStats();
})

function updateBotStatus() {
    let name = pkmGames[pkmGameActivity];
    let activity = ActivityType.Playing;
    let status = 'online';

    if (boolVars.vanish) {
        status = 'invisible'
    } else if (boolVars.maintenance) {
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

async function updateStats() {
    await client.guilds.fetch();
    
    guilds = client.guilds.cache;

    servCountCh.setName('🌐 ' + guilds.size + ' Serveurs').catch(console.error)
}

async function refreshIntVars() {
    await psqlClient.query('SELECT * FROM intvars')
        .then((res) => {
            res.rows.forEach(row => {
                intVars[row.intvar_id] = row.value;
            })
        }).catch((error) => console.error(error));
}

async function refreshBoolVars() {
    await psqlClient.query('SELECT * FROM boolvars')
        .then((res) => {
            res.rows.forEach(row => {
                boolVars[row.boolvar_id] = row.value;
            })
        }).catch((error) => console.error(error));
}

async function refreshNotifsRoles() {
    const guild = client.guilds.cache.get(guildId);
    await guild.channels.fetch();
    await guild.roles.fetch();
    await guild.members.fetch();
    const channel = guild.channels.cache.get(notifsChannelId);
    if (channel && channel.isTextBased()) {
        try {
            const messages = await channel.messages.fetch();
            const message = messages.get(notifsMessageId);

            if (message) {
                await message.fetch();

                message.reactions.cache.forEach(async reaction => {
                    const users = await reaction.users.fetch();
                    
                    users.forEach(user => {
                        const member = guild.members.cache.get(user.id);

                        if (member) {
                            if (!member.roles.cache.has(notifsRoleId) && member.id != member.guild.ownerId) {
                                member.roles.add(guild.roles.cache.get(notifsRoleId));
                            }
                        }
                    });

                    guild.members.cache.forEach(member => {
                        if (member.roles.cache.has(notifsRoleId) && !users.has(member.user) && member.id != member.guild.ownerId) {
                            member.roles.remove(guild.roles.cache.get(notifsRoleId));
                        }
                    });
                })
            }
        } catch (error) {
            console.error(error);
        }
    }
}

async function pkbotStop() {
    clearInterval(activityInterval);
    logsChannel.send('Bot arrêté').then(async () => {
        client.destroy();
        psqlClient.end();
    })
}

async function pkbotMaintenance() {
    boolVars.maintenance = !boolVars.maintenance;
    psqlClient.query(`UPDATE boolvars SET value = ${boolVars.maintenance} WHERE boolvar_id = 'maintenance'`);
    if (boolVars.maintenance && boolVars.vanish) {
        boolVars.vanish = !boolVars.vanish;
        psqlClient.query(`UPDATE boolvars SET value = ${boolVars.vanish} WHERE boolvar_id = 'vanish'`);
        logsChannel.send('Le bot a quitté le mode vanish');
    }
    if (boolVars.maintenance) {
        logsChannel.send('Le bot est en mode maintenance.');
    } else {
        logsChannel.send('Le bot a quitté le mode maintenance.');
    }
    updateBotStatus();
}

async function pkbotVanish() {
    boolVars.vanish = !boolVars.vanish;
    psqlClient.query(`UPDATE boolvars SET value = ${boolVars.vanish} WHERE boolvar_id = 'vanish'`);
    if (boolVars.maintenance && boolVars.vanish) {
        boolVars.maintenance = !boolVars.maintenance;
        psqlClient.query(`UPDATE boolvars SET value = ${boolVars.maintenance} WHERE boolvar_id = 'maintenance'`);
        logsChannel.send('Le bot a quitté le mode maintenance.');
    }
    if (boolVars.vanish) {
        logsChannel.send('Le bot est en mode vanish.');
    } else {
        logsChannel.send('Le bot a quitté le mode vanish.');
    }
    updateBotStatus();
}

async function pkbotServers() {
    await client.guilds.fetch();

    guilds = client.guilds.cache;

    let desc = "`" + guilds.size + " serveurs`";

    guilds.forEach(guild => {
        desc += "\n- " + guild.name + " | " + guild.id + " | " + guild.memberCount;
    });
    
    if (desc.length + 18 >= 4000) desc = desc.substring(0,3900);

    logsChannel.send({embeds: [{
        author: {
            name: "Liste des serveurs"
        },
        color: 0xFFFF00,
        description: desc
    }]});
}