const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    "news-channel": {"channel": [], "guild": []},
    "news-channel.addedChannel": [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ViewChannel
    ],
    "pokeloto": {
        "channel": [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.SendMessagesInThreads,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ViewChannel
        ],
        "guild": []
    },        
    "pokeparty": {
        "channel": [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.SendMessagesInThreads,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.ManageThreads
        ],
        "guild": []
    },
    "pokequiz": {
        "channel": [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.SendMessagesInThreads,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.AddReactions
        ],
        "guild": []
    },
    "team": {
        "channel": [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.SendMessagesInThreads,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ViewChannel
        ],
        "guild": []
    },
    "me": {
        "channel": [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.SendMessagesInThreads,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ViewChannel
        ],
        "guild": []
    },
    "pokebot": {channel: [], guild: []},
    "publish": {channel: [], guild: []},
    "rolereact": {
        "channel": [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.SendMessagesInThreads,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.AddReactions
        ],
        "guild": [
            PermissionFlagsBits.ManageRoles
        ]
    },
    "help": {channel: [], guild: []},
    "pokedex": {channel: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.SendMessagesInThreads,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ViewChannel
    ], guild: []},
    "support": {channel: [], guild: []}
};