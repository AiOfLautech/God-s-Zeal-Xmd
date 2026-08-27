async function promoteCommand(sock, chatId, mentionedJids, message) {
    let userToPromote = [];

    if (mentionedJids && mentionedJids.length > 0) {
        userToPromote = mentionedJids;
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToPromote = [message.message.extendedTextMessage.contextInfo.participant];
    }

    if (userToPromote.length === 0) {
        await sock.sendMessage(chatId, {
            text: 'Please mention a user or reply to a user message to promote.'
        }, { quoted: message });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, userToPromote, 'promote');

        const promotedList = userToPromote.map((jid) => `@${jid.split('@')[0]}`).join('\n');
        const promoterJid = message.key.participant || message.key.remoteJid;

        await sock.sendMessage(chatId, {
            text:
                '*GROUP PROMOTION*\n\n' +
                `Promoted user${userToPromote.length > 1 ? 's' : ''}:\n${promotedList}\n\n` +
                `Promoted by: @${promoterJid.split('@')[0]}\n` +
                `Date: ${new Date().toLocaleString()}`,
            mentions: [...userToPromote, promoterJid]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in promote command:', error);
        await sock.sendMessage(chatId, { text: 'Failed to promote user(s).' }, { quoted: message });
    }
}

async function handlePromotionEvent(sock, groupId, participants, author) {
    try {
        if (!Array.isArray(participants) || participants.length === 0) return;

        const promoted = participants.map((jid) => {
            const normalized = typeof jid === 'string' ? jid : (jid.id || String(jid));
            return `@${normalized.split('@')[0]}`;
        });

        const mentions = participants.map((jid) => typeof jid === 'string' ? jid : (jid.id || String(jid)));
        let promotedBy = 'System';

        if (author) {
            const authorJid = typeof author === 'string' ? author : (author.id || String(author));
            promotedBy = `@${authorJid.split('@')[0]}`;
            mentions.push(authorJid);
        }

        await sock.sendMessage(groupId, {
            text:
                '*GROUP PROMOTION NOTICE*\n\n' +
                `${promoted.join('\n')}\n\n` +
                `Promoted by: ${promotedBy}`,
            mentions
        });
    } catch (error) {
        console.error('Error in handlePromotionEvent:', error);
    }
}

module.exports = {
    promoteCommand,
    handlePromotionEvent
};
