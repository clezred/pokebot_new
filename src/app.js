// OLD IMPORTS
const fs = require('node:fs');
const path = require('node:path');
const { Collection, Events, EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');

// NEW IMPORTS
require('dotenv').config();
const { getDiscordClient, getChannel, getRole, getMember } = require('./discord-client.js');
const { getMembersPokemon, addMembersPokemon, addGivenRoleReactionRecord, deleteGivenRoleReactionRecord } = require('./postgres-utils.js');
const ids = require('../config/ids.json');
const gen = require('../config/genpkid.json');
const types = require('../config/types.json');
const { logWarn, logInfo, random, logError } = require('./utils.js');
const { sendMessage, sendLogMessage, addRole, removeRole } = require('./discord-utils.js');
const { updateBotPresence } = require('./client-presence-utils.js');
const { updateStats } = require('./stats-utils.js');
const { getPokemonSpecies, getPokemonArtwork, subRequest } = require('./pokeapi-utils.js');
const { getRoleReactions, refreshRoleReactions } = require('./rolereact-utils.js');
const neededPerms = require('./needed-perms.js');
const { getCommands } = require('./command-utils.js');

// MAIN FUNCTION
// Used to asyncronously run the main function
async function main() {

const discordClient = await getDiscordClient();

// SLASH COMMANDS SETUP
discordClient.commands = new Collection();

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
			discordClient.commands.set(command.data.name, command);
		} else {
			logWarn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

discordClient.login(process.env.TOKEN);

discordClient.once(Events.ClientReady, async () => {
    const logsChannel = await getChannel(ids.logsChannelId);

    logInfo('PokéBot ready');
    if (logsChannel) {
        logsChannel.send(`PokéBot en ligne !`);
    } else {
        logWarn('Logs channel not found');
    }

    refreshRoleReactions();
    updateBotPresence();
    updateStats();

    activityInterval = setInterval(() => {
        refreshRoleReactions();
        updateBotPresence();
        updateStats();
    }, 600000);
});

discordClient.on(Events.InteractionCreate, async interaction => {

	if (!interaction.isChatInputCommand()) return;

    sendLogMessage(`Command : \`${interaction.commandName}\` | User : \`${interaction.user.username}\` | ChannelType : \`${Object.keys(ChannelType).find(key => ChannelType[key] === interaction.channel.type)}\``);

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		logError(`No command matching ${interaction.commandName} was found.`);
		return;
	}

    if (interaction.commandName !== 'pokebot') {
        const commandsStatus = await getCommands();
        if (!commandsStatus[interaction.commandName]) {
            await interaction.reply({ content: `La commande \`${interaction.commandName}\` n'est pas accessible.`, ephemeral: true });
            return;
        } else if (!commandsStatus[interaction.commandName].is_enabled) {
            await interaction.reply({ content: `La commande \`${interaction.commandName}\` est désactivée pour le moment.\nRaison : ${commandsStatus[interaction.commandName].reason}`, ephemeral: true });
            return;
        }
    }

    if (interaction.guild) {
        const missingPerms = [];
        for (const perm of neededPerms[interaction.commandName].channel) {
            if (!interaction.guild.members.me.permissionsIn(interaction.channel).has(perm)) {
                missingPerms.push(perm);
            }
        }
        for (const perm of neededPerms[interaction.commandName].guild) {
            if (!interaction.guild.members.me.permissions.has(perm)) {
                missingPerms.push(perm);
            }
        }

        if (missingPerms.length > 0) {
            const missingPermsField = new PermissionsBitField(missingPerms);
            await interaction.reply({ content: `Je n'ai pas les permissions nécessaires pour exécuter cette commande dans ce salon.\nPermissions manquantes : ${missingPermsField.toArray().join(' | ')}`, ephemeral: true });
            logWarn(`Missing permissions ${missingPermsField.toArray()} for command ${interaction.commandName} in channel ${interaction.channel.id}`);
            return;
        } else {
            logInfo(`All permissions OK for command ${interaction.commandName} in channel ${interaction.channel.id}`);
        }
    }

    try {
		await command.execute(interaction);
	} catch (error) {
		logError(error);
        console.error(error);
        const errorMessage = { content: 'Il y a eu une erreur lors de l\'exécution de la commande, veuillez réessayer.\n*Si le problème persiste, merci de le signaler sur le serveur de support (</support:1310560708236279908>).', ephemeral: true }
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(errorMessage);
		} else {
			await interaction.reply(errorMessage);
		}
	}
});

discordClient.on(Events.GuildMemberAdd, async member => {
    if (member.guild.id === ids.guildId) {
        await member.roles.add(await getRole(ids.memberRoleId));
        const membersPokemons = await getMembersPokemon(member.guild.id, member.id);
        if (membersPokemons.length > 0) return;

        const pkID = random(gen[0][0], gen[0][1]);
        const shiny = (random(1,4096) === 1); // 4096
        const pkm = await getPokemonSpecies(pkID);
        const pkmVariety = await subRequest(pkm.varieties.find(v => v.is_default).pokemon.url);

        let pkmName = pkm.names.find(name => name.language.name === 'fr').name;
        const shinyAdd = shiny ? " ✨" : "";
        const cut = 6 + shinyAdd.length;

        let memberUsername = member.user.username;
        if (memberUsername.length > (32 - (pkmName.length + cut))) {
            memberUsername = memberUsername.substring(0, (32 - (pkmName.length + cut))) + "...";
        }

        if (shiny) {
            pkmName += shinyAdd;
            member.setNickname(memberUsername + " | " + pkmName);
            member.roles.add(await getRole(ids.shinyRoleId));
        } else {
            member.setNickname(memberUsername + " | " + pkmName);
        }

        await addMembersPokemon(member.guild.id, member.id, pkID, shiny, new Date().toISOString());

        const artworkLink = await getPokemonArtwork(pkID, shiny);

        const embed = new EmbedBuilder()
            .setTitle("Nouveau membre !")
            .setDescription(`Un **${pkmName}** sauvage est apparu !\nBienvenue à toi, ${member} !`)
            .setThumbnail(artworkLink)
            .setColor(types[pkmVariety.types.find(t => t.slot === 1).type.name].color);

        sendMessage(ids.welcomeChannelId, {embeds: [embed]});
    }
})

discordClient.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot) return;
    const roleReactions = await getRoleReactions();
    if (Object.keys(roleReactions).includes(reaction.message.id)) {
        const roleReaction = roleReactions[reaction.message.id];

        const userReactions = [];
        await reaction.message.fetch()
        for (const react of reaction.message.reactions.cache.values()) {
            const users = await react.users.fetch();
            if (users.has(user.id)) {
                userReactions.push(react);
            }
        }

        const emoji = reaction.emoji.name; // not optimized for custom emojis
        const expectedEmojis = roleReaction.reactions_roles.map(rr => rr.emoji);

        if (expectedEmojis.includes(emoji)) {
            if (userReactions.length > roleReaction.max_reactions_per_user) {
                await reaction.users.remove(user.id);
                return;
            }

            const member = await getMember(user.id, reaction.message.guild.id);
            const reactRole = roleReaction.reactions_roles.find(rr => rr.emoji === emoji);

            if (!member.roles.cache.has(reactRole.role)) {
                const given = await addRole(reaction.message.guild.id, user.id, reactRole.role);
                if (given) {
                    addGivenRoleReactionRecord(reaction.message.id, reaction.message.channelId, reaction.message.guild.id, user.id, reactRole.role, new Date().toISOString());
                }
            }
        } else {
            await reaction.remove();
        }
    }
});

discordClient.on(Events.MessageReactionRemove, async (reaction, user) => {
    if (user.bot) return;
    const roleReactions = await getRoleReactions()
    if (Object.keys(roleReactions).includes(reaction.message.id)) {
        const roleReaction = roleReactions[reaction.message.id];

        const emoji = reaction.emoji.name; // not optimized for custom emojis
        const expectedEmojis = roleReaction.reactions_roles.map(rr => rr.emoji);

        if (expectedEmojis.includes(emoji)) {
            const member = await getMember(user.id, reaction.message.guild.id);
            const reactRole = roleReaction.reactions_roles.find(rr => rr.emoji == emoji)
            
            if (member.roles.cache.has(reactRole.role)) {
                const removed = await removeRole(reaction.message.guild.id, user.id, reactRole.role);
                if (removed) {
                    deleteGivenRoleReactionRecord(reaction.message.id, user.id, reactRole.role);
                }
            }
        }
    } 
});

discordClient.on(Events.GuildCreate, async guild => {
    await guild.fetch()
    sendLogMessage(`> Server joined : \`${guild.name}\` | Members : \`${guild.memberCount}\``);
    updateStats();
});

discordClient.on(Events.GuildDelete, async guild => {
    sendLogMessage(`> Server left : \`${guild.name}\` | Members : \`${guild.memberCount}\``);
    updateStats();
});

} // END OF MAIN FUNCTION

main(); // RUN MAIN FUNCTION