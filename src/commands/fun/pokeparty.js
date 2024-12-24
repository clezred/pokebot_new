const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, Collection, ChatInputCommandInteraction, ChannelType, InteractionContextType, userMention, EmbedBuilder } = require('discord.js');
const difficulties = require('../../../config/gamedifficulty.json');
const { pokeparty, isPlaying, addPlayer, removePlayer } = require('../../pokeparty.js');
const { sendLogMessage } = require('../../discord-utils.js');
const { logInfo } = require('../../utils.js');

/*
* NEEDED BOT PERMISSIONS
* pokeparty : [SendMessages, SendMessagesInThreads, ManageMessages, EmbedLinks, ViewChannel, AddReactions]
*/

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pokeparty')
        .setDescription('Jouer au PokéQuiz version mutijoueur !')
        .addStringOption(option =>
            option.setName('acces')
                .setDescription('Définir l\'accessibilité aux autres joueurs (publique par défaut)')
                .addChoices(
                    {name: 'Privée', value: 'private'},
                    {name: 'Publique', value: 'public'}
                )
                .setRequired(false)
        )
        .addIntegerOption(option =>
			option.setName('generation')
				.setDescription('Limiter l\'aléatoire à une génération en particulier')
				.setMaxValue(9)
				.setMinValue(1)
		)
        .addStringOption(option =>
            option.setName('difficulty')
                .setDescription('Niveau de difficulté')
                .addChoices(
                    {name: difficulties.easy.name, value: 'easy'},
                    {name: difficulties.medium.name, value: 'medium'},
                    {name: difficulties.hard.name, value: 'hard'},
                    {name: difficulties.extreme.name, value: 'extreme'},
                    {name: difficulties.impossible.name, value: 'impossible'}
                )
                .setRequired(false)
        )
        .addUserOption(option =>
            option.setName('joueur2')
                .setDescription('Mentionne le joueur que tu veux ajouter')
                .setRequired(false)
        )
        .addUserOption(option =>
            option.setName('joueur3')
                .setDescription('Mentionne le joueur que tu veux ajouter')
                .setRequired(false)
        )
        .addUserOption(option =>
            option.setName('joueur4')
                .setDescription('Mentionne le joueur que tu veux ajouter')
                .setRequired(false)
        )
        .addUserOption(option =>
            option.setName('joueur5')
                .setDescription('Mentionne le joueur que tu veux ajouter')
                .setRequired(false)
        )
        .setContexts([
            InteractionContextType.Guild,
            InteractionContextType.PrivateChannel
        ])
    ,

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {

        if (isPlaying(interaction.user.id, interaction.channel.id)) {
            await interaction.reply({content: 'Vous êtes déjà dans une partie en cours sur ce salon !', ephemeral: true});
            return;
        }

        addPlayer(interaction.user.id, interaction.channel.id);

        const acces = interaction.options.getString('acces') ?? 'public';
        const generation = interaction.options.getInteger('generation') ?? 0;
        const difficulty = interaction.options.getString('difficulty') ?? 'easy';
        
        let host = interaction.user;

        const players = new Collection()

        players.set(host.id, host)

        const playersListLabel = 'Liste des joueurs';

		sendLogMessage(`Command : \`pokeparty\` | User : \`${host.username}\` | Access : \`${acces}\` | ChannelType : \`${Object.keys(ChannelType).find(key => ChannelType[key] === interaction.channel.type)}\``);

        for (i = 2; i < 6; i++) {
            let player = interaction.options.getUser(`joueur${i}`);
            if (player && !players.has(player.id)) {
                addPlayer(player.id, interaction.channel.id);
                players.set(player.id, player);
            }
        }

        const playersField = {
            name: playersListLabel,
            value: ""
        }

        let playersIds = [];

        function refreshPlayers() {
            playersIds = players.map((player, id, c) => id);
            playersField.value = players.map(player => userMention(player.id)).join(' | ');
        }

        refreshPlayers();

        const isPrivate = acces === 'private';

        const joinButton = new ButtonBuilder()
            .setCustomId('join')
            .setLabel('Rejoindre la partie')
            .setStyle(ButtonStyle.Success);

        const leaveButton = new ButtonBuilder()
            .setCustomId('leave')
            .setLabel('Quitter la partie')
            .setStyle(ButtonStyle.Danger)
        
        const startButton = new ButtonBuilder()
            .setCustomId('start')
            .setLabel('Commencer')
            .setStyle(ButtonStyle.Primary); 

        if (isPrivate) joinButton.setLabel('Demander à rejoindre');

        const lobbyButtons = new ActionRowBuilder().addComponents(joinButton, leaveButton, startButton);

        const lobbyEmbed = new EmbedBuilder()
            .setTitle(`PokéParty du ${difficulties[difficulty].name}`)
            .setDescription(`Vous avez 5 minutes pour trouver le Pokémon correspondant à la description donnée. Que le meilleur gagne !\n_La partie commence <t:${Math.floor(Date.now() / 1000) + Math.ceil(difficulties[difficulty].time / 1000)}:R>_`)
            .setFields(playersField)
            .setColor(0xFFFF00)
            .setFooter({
                text: `Hôte de la partie : ${host.username} | Accessibilité : ${acces === 'private' ? 'Privée' : 'Publique'}`
            })

        const lobbyMessage = await interaction.reply({embeds: [lobbyEmbed], components: [lobbyButtons], fetchReply: true});

        const lobbyMessageFilter = i => {
            return i.message.id === lobbyMessage.id;
        }

        const lobbyCollector = lobbyMessage.createMessageComponentCollector({componentType: ComponentType.Button, filter: lobbyMessageFilter, time: 300000});
        
        const waitingPlayersIds = [];
        const joinDemandCollectors = [];

        lobbyCollector.on('collect', async b => {
            await b.deferUpdate();
            if (b.customId === 'join') {
                if (isPlaying(b.user.id, interaction.channel.id)) {
                    await b.followUp({content: 'Vous êtes déjà dans une partie en cours sur le même salon !', ephemeral: true});
                } else if (!playersIds.includes(b.user.id)) {

                    // PARTIE PRIVEE
                    if (isPrivate) {
                        
                        if (waitingPlayersIds.includes(b.user.id)) {
                            await b.followUp({content: 'Vous avez déjà demandé à rejoindre la partie, merci de patienter.', ephemeral: true});
                            return;
                        }

                        try {
                        const acceptButton = new ButtonBuilder()
                            .setCustomId('yes')
                            .setLabel('Accepter')
                            .setStyle(ButtonStyle.Success);
                        
                        const refuseButton = new ButtonBuilder()
                            .setCustomId('no')
                            .setLabel('Refuser')
                            .setStyle(ButtonStyle.Danger);
                        
                        const joinButtons = new ActionRowBuilder()
                            .addComponents(acceptButton, refuseButton);

                        await host.createDM(true);

                        const joinDemandMessage = await host.dmChannel.send({content: `${b.user.username} souhaite rejoindre la partie lancée sur le channel ${interaction.channel.name} du serveur ${interaction.guild.name}`, components: [joinButtons]});
                        
                        await b.followUp({content: 'Demande de rejoindre la partie envoyée à l\'hôte', ephemeral: true});

                        const collectorFilter = async i => {
                            await i.deferUpdate();
                            return i.user.id === host.id;
                        };

                        const joinDemandMessageButtonCollector = joinDemandMessage.createMessageComponentCollector({filter: collectorFilter, componentType: ComponentType.Button, time: 30000, max: 1});
                        
                        waitingPlayersIds.push(b.user.id);
                        joinDemandCollectors.push(joinDemandMessageButtonCollector);

                        joinDemandMessageButtonCollector.on('collect', async button => {
                            // ACCEPT
                            if (button.component.customId === 'yes') {
                                if (isPlaying(b.user.id, interaction.channel.id)) {
                                    await joinDemandMessage.edit({content: `${b.user.username} a rejoint une autre partie entre temps.`, components: [joinButtons]});
                                    waitingPlayersIds.pop(waitingPlayersIds.indexOf(b.user.id));
                                } else {
                                    addPlayer(b.user.id, interaction.channel.id);
                                    players.set(b.user.id, b.user);
                                    await joinDemandMessage.edit({content: 'Vous avez accepté la demande de ' + btn.user.username, components: [joinButtons]})
                                    refreshPlayers();
                                    await interaction.editReply({embeds: [lobbyEmbed]});
                                    waitingPlayersIds.pop(waitingPlayersIds.indexOf(b.user.id));
                                }
                            }
                            // REFUSE
                            else if (button.component.customId === 'no') {
                                await joinDemandMessage.edit({content: 'Vous avez refusé la demande de ' + btn.user.username, components: [joinButtons]})
                                waitingPlayersIds.pop(waitingPlayersIds.indexOf(b.user.id));
                            } 
                            // WTF
                            else return;

                            joinButtons.components.forEach(comp => {
                                comp.setDisabled(true);
                                if (comp.data.custom_id === (button.component.customId === 'no' ? 'yes' : 'no')) {
                                    comp.setStyle(ButtonStyle.Secondary)
                                }
                            })
                        })

                        joinDemandMessageButtonCollector.on('end', async () => {
                            joinDemandMessage.edit({content: 'La demande a expiré', components: []});
                            waitingPlayersIds.pop(waitingPlayersIds.indexOf(b.user.id));
                        })

                        } catch (e) {
                            console.error(e);
                            await b.followUp({content: 'Impossible de contacter l\'hôte de la partie pour demander à rejoindre, DMs désactivés.', ephemeral: true});
                        }
                    } 
                    // PARTIE PUBLIQUE
                    else {
                        addPlayer(b.user.id, interaction.channel.id);
                        players.set(b.user.id, b.user);
                        refreshPlayers();
                        await interaction.editReply({embeds: [lobbyEmbed]});
                    }
                } else {
                    await b.followUp({content: 'Vous êtes déjà dans la partie', ephemeral: true});
                }
            } else if (b.customId == 'leave') {
                if (playersIds.includes(b.user.id)) {
                    players.delete(b.user.id);
                    removePlayer(b.user.id, interaction.channel.id);
                    if (b.user.id === host.id) {
                        if (players.size > 0) {
                            host = players.random();
                            lobbyEmbed.setFooter({text: `Hôte de la partie : ${host.username} | Accessibilité : ${acces === 'private' ? 'Privée' : 'Publique'}`});
                        } else {
                            lobbyEmbed.setTitle('PokéParty annulée')
                            lobbyEmbed.setColor(0xFF0000);
                            lobbyEmbed.setDescription(null);
                            lobbyEmbed.setFields([]);
                            lobbyCollector.stop();
                            await interaction.editReply({components: []});
                        }
                    }
                    refreshPlayers();
                    await interaction.editReply({embeds: [lobbyEmbed]})
                }
            } else if (b.customId === 'start') {
                if (b.user.id === host.id) {
                    lobbyCollector.stop();
                    for (const collector of joinDemandCollectors) {
                        if (!collector.ended) collector.stop();
                    }
                }
            }
        })

        lobbyCollector.on('end', async () => {
            if (players.size > 0) {
                interaction.deleteReply();
                pokeparty(interaction.channel, players.map((p, id, c) => p), generation, difficulty, host.id);
            } else {
                sendLogMessage("Command : `pokeparty` | User : `" + interaction.user.username + "` | State : `cancelled` | Access : `" + acces + "` | ChannelType : `" + Object.keys(ChannelType).find(key => ChannelType[key] === interaction.channel.type) + "`");
            }
        })
    }
}

