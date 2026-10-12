const fs = require('fs');
const path = require('path');
const { sendStyled } = require('../../lib/menuLayout');

const dataFilePath = path.join(__dirname, '..', '..', 'data', 'messageCount.json');

function loadMessageCounts() {
    if (fs.existsSync(dataFilePath)) {
        const data = fs.readFileSync(dataFilePath);
        return JSON.parse(data);
    }
    return {};
}

function saveMessageCounts(messageCounts) {
    fs.writeFileSync(dataFilePath, JSON.stringify(messageCounts, null, 2));
}

function incrementMessageCount(groupId, userId) {
    const messageCounts = loadMessageCounts();

    if (!messageCounts[groupId]) {
        messageCounts[groupId] = {};
    }

    if (!messageCounts[groupId][userId]) {
        messageCounts[groupId][userId] = 0;
    }

    messageCounts[groupId][userId] += 1;

    saveMessageCounts(messageCounts);
}

function topMembers(sock, chatId, isGroup) {
    if (!isGroup) {
        sendStyled(sock, chatId, null, {
            title: 'TOP MEMBERS',
            lines: ['This command is only available in group chats.']
        });
        return;
    }

    const messageCounts = loadMessageCounts();
    const groupCounts = messageCounts[chatId] || {};

    const sortedMembers = Object.entries(groupCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Get top 5 members

    if (sortedMembers.length === 0) {
        sendStyled(sock, chatId, null, {
            title: 'TOP MEMBERS',
            lines: ['No message activity recorded yet.']
        });
        return;
    }

    sendStyled(sock, chatId, null, {
        title: 'TOP MEMBERS',
        lines: sortedMembers.map(([userId, count], index) => `${index + 1}. @${userId.split('@')[0]} ☇ ${count}`)
    });
}

module.exports = { incrementMessageCount, topMembers };

