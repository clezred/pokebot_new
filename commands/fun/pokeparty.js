const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, CommandInteraction, Collection} = require('discord.js');
const { game } = require('../../assets/js/pokeparty.js')

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
        .setDMPermission(false),

    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        
        const players = new Collection();

        let host = interaction.user

        const acces = interaction.options.getString('acces') ?? 'public';

        players.set(interaction.user.id, interaction.user);

        for (i = 2; i < 6; i++) {
            let player = interaction.options.getUser(`joueur${i}`);
            if (player) {
                players.set(player.id, player);
            }
        }

        let playersStr = ""

        let playersField = {
            name: "Liste des joueurs",
            value: playersStr
        }

        function refreshPlayers() {
            playersStr = `<@${host.id}>`;

            players.forEach((player, id) => {
                if (id != host.id) {
                    playersStr += " | <@" + id + ">"; 
                }
            })

            playersField.value = playersStr;
        }

        refreshPlayers();

        let accessField = {
            name: "Accessibilité de la partie"
        }

        let isPrivate = false;

        if (acces == 'private') isPrivate = true;

        const joinBtn = new ButtonBuilder()
            .setCustomId('join')
            .setLabel('Rejoindre la partie')
            .setStyle(ButtonStyle.Success);

        const leaveBtn = new ButtonBuilder()
            .setCustomId('leave')
            .setLabel('Quitter la partie')
            .setStyle(ButtonStyle.Danger)
        
        const startBtn = new ButtonBuilder()
            .setCustomId('start')
            .setLabel('Commencer')
            .setStyle(ButtonStyle.Secondary) 

        if (isPrivate) {
            accessField.value = "Privée";
            joinBtn.setLabel('Demander à rejoindre');
        } else {
            accessField.value = "Publique";
        }

        const buttons = new ActionRowBuilder().addComponents(joinBtn, leaveBtn, startBtn);

        let embed = {
            title: "PokéParty",
            description: "**Bienvenue au PokéQuiz Multijoueur !**\n\nRègles:\nVous avez 5 minutes pour trouver le Pokémon correspondant à la description donnée. Que le meilleur gagne !",
            fields: [accessField, playersField],
            footer: {text: 'Hôte de la partie : ' + host.username}
        }

        await interaction.reply({embeds: [embed], components: [buttons]});

        const message = await interaction.fetchReply();

        const lobbyCollector = message.createMessageComponentCollector({componentType: ComponentType.Button})

        lobbyCollector.on('collect', async btn => {
            await btn.deferUpdate();

            if (btn.customId == 'join') {

                const player = players.get(btn.user.id);

                if (!player) {

                    if (isPrivate) {
                        const yesBtn = new ButtonBuilder()
                            .setCustomId('yes')
                            .setLabel('Accepter')
                            .setStyle(ButtonStyle.Success);
                        
                        const noBtn = new ButtonBuilder()
                            .setCustomId('no')
                            .setLabel('Refuser')
                            .setStyle(ButtonStyle.Danger);
                        
                        const joinButtons = new ActionRowBuilder()
                            .addComponents(yesBtn, noBtn)

                        const acceptMsg = await (await host.createDM(true)).send({content: `${btn.user.username} souhaite rejoindre la partie lancée sur le channel ${interaction.channel.name} du serveur ${interaction.guild.name}`, components: [joinButtons]})

                        const collectorFilter = i => {
                            i.deferUpdate();
                            return i.user.id === host.id;
                        };

                        acceptMsg.awaitMessageComponent({filter: collectorFilter, componentType: ComponentType.Button, time: 30000})
                            .then(async button => {
                                if (button.component.customId == 'yes') {
                                    players.set(btn.user.id, btn.user);
                                    joinButtons.components.forEach(comp => {
                                        comp.setDisabled(true);
                                        if (comp.data.custom_id == 'no') {
                                            comp.setStyle(ButtonStyle.Secondary)
                                        }
                                    })
                                    await acceptMsg.edit({content: 'Vous avez accepté la demande de ' + btn.user.username, components: [joinButtons]})
                                    refreshPlayers();
                                    embed.fields[1] = playersField;
                                    await interaction.editReply({embeds: [embed]});
                                } else if (button.component.customId == 'no') {
                                    joinButtons.components.forEach(comp => {
                                        comp.setDisabled(true);
                                        if (comp.data.custom_id === 'yes') {
                                            comp.setStyle(ButtonStyle.Secondary)
                                        }
                                    })
                                    await acceptMsg.edit({content: 'Vous avez refusé la demande de ' + btn.user.username, components: [joinButtons]})
                                }
                            }).catch(async error => {
                                await acceptMsg.edit({content: 'Demande de ' + btn.user.username + ' expirée.', components: []})
                            })
                    } else {
                        players.set(btn.user.id, btn.user);
                        refreshPlayers();
                        embed.fields[1] = playersField
                        await interaction.editReply({embeds: [embed]})
                    }
                }
            } else if (btn.customId == 'leave') {
                const player = players.get(btn.user.id)

                if (player) {
                    players.delete(player.id);

                    if (player.id == host.id) {
                        if (players.size >= 1) {
                            host = players.first();
                            embed.footer.text = 'Hôte de la partie : ' + host.username;
                        } else {
                            await interaction.editReply({content: 'Partie annulée', embeds: [], components: []})
                            lobbyCollector.stop();
                        }
                    }

                    refreshPlayers();
                    embed.fields[1] = playersField;
                    await interaction.editReply({embeds: [embed]})
                }
            } else if (btn.customId == 'start') {
                if (btn.user.id == host.id) {
                    interaction.deleteReply();
                    game(players, interaction.channel, host);
                }
            }
        })
    }
}

