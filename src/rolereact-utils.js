const { getChannel, getMember, getRole, getMessage } = require("./discord-client");
const { getAllRoleReactionRecords, getAllGivenRoleReactionsRecords, addGivenRoleReactionRecord, deleteGivenRoleReactionRecord, deleteRoleReactionRecord } = require("./postgres-utils");
const { clear, logInfo, logWarn } = require("./utils");

const roleReactions = {};
let roleReactionsUpdated = true;

/**
 * 
 * @returns {object} roleReactions
 */
async function getRoleReactions() {
    if (roleReactionsUpdated) await retreiveRoleReactions();
    return roleReactions;
}

function setRoleReactionsUpdated(updated) {
    roleReactionsUpdated = updated;
}

async function retreiveRoleReactions(r = roleReactions) {
    const rows = await getAllRoleReactionRecords();
    clear(roleReactions);
    for (const row of rows) {
        r[row.message_id] = {
            guild_id: row.guild_id,
            message_id: row.message_id,
            channel_id: row.channel_id,
            reactions_roles: row.reactions_roles,
            max_reactions_per_user: row.max_reactions
        }
    }
    setRoleReactionsUpdated(false);
}

async function refreshRoleReactions() {
    const rrs = await getRoleReactions();
    const givenRR = await getAllGivenRoleReactionsRecords();
    for (const rr_id in rrs) {
        const message = await getMessage(rrs[rr_id].guild_id, rrs[rr_id].channel_id, rr_id);
        if (!message) {
            logWarn(`Message ${rr_id} not found in channel ${rrs[rr_id].channel_id} in guild ${rrs[rr_id].guild_id}, deleting role reaction ${rr_id}`);
            await deleteRoleReactionRecord(rr_id);
            continue;
        }
        const reactions = message.reactions.cache.values();
        const maxReactionsPerUser = rrs[rr_id].max_reactions_per_user;
        const emojis = [];
        for (const emoji of rrs[rr_id].reactions_roles.map(r => r.emoji)) {
            emojis.push(emoji);
        }
        for (const reaction of reactions) {
            const roleId = rrs[rr_id].reactions_roles.filter(rr => rr.emoji == reaction.emoji.name).length > 0 ? rrs[rr_id].reactions_roles.filter(rr => rr.emoji == reaction.emoji.name)[0].role : null;
            if (emojis.includes(reaction.emoji.name)) {
                if (!roleId) continue;
                const users = await reaction.users.fetch();
                for (const userId of users.keys()) {
                    const member = await getMember(userId, rrs[rr_id].guild_id);
                    if (member.user.bot) continue;
                    const userReactionsCount = message.reactions.cache
                        .filter(reaction => 
                            reaction.users.cache.has(userId) &&
                            emojis.includes(reaction.emoji.name)
                        ).size;
                    if (userReactionsCount > maxReactionsPerUser) {
                        await reaction.users.remove(userId);
                        continue;
                    }
                    if (!member.roles.cache.has(roleId)) {
                        const role = await getRole(roleId);
                        await member.roles.add(role);
                        addGivenRoleReactionRecord(rr_id, message.channel.id, message.channel.guild.id, member.id, role.id, new Date().toISOString());
                    }
                }
                const recordedUserIds = givenRR
                    .filter(g => g.message_id === rr_id)
                    .filter(g => g.role_id === roleId)
                    .map(g => g.user_id);
                for (const recUserId of recordedUserIds) {
                    if (!users[recUserId]) {
                        deleteGivenRoleReactionRecord(rr_id, recUserId, roleId);
                    }
                }
            } else {
                await reaction.remove()
            }
        }
    }

}

module.exports = {
    getRoleReactions,
    setRoleReactionsUpdated,
    retreiveRoleReactions,
    refreshRoleReactions
} 