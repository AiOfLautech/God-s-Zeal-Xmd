const fs = require('fs');
const settings = require('../settings');

async function gcstatus(sock, chatId, message) {
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: 'This command can only be used in groups.' }, { quoted: message });

    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants;
        const admins = participants.filter(p => p.admin);
        
        let statusText = `*Group Status: ${metadata.subject}*\n\n`;
        statusText += `📝 *Description:* ${metadata.desc || 'No description'}\n`;
        statusText += `👥 *Participants:* ${participants.length}\n`;
        statusText += `👮 *Admins:* ${admins.length}\n`;
        statusText += `📅 *Created At:* ${new Date(metadata.creation * 1000).toLocaleString()}\n`;
        statusText += `👑 *Owner:* ${metadata.owner || 'Unknown'}\n`;
        statusText += `🔒 *Restricted:* ${metadata.restrict ? 'Yes' : 'No'}\n`;
        statusText += `🚫 *Announce Only:* ${metadata.announce ? 'Yes' : 'No'}\n`;

        await sock.sendMessage(chatId, { text: statusText }, { quoted: message });
    } catch (error) {
        console.error('Error in gcstatus:', error);
        await sock.sendMessage(chatId, { text: 'Failed to fetch group status.' }, { quoted: message });
    }
}

module.exports = gcstatus;