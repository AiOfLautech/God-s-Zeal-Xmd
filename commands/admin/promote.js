const { sendStyled } = require('../../lib/menuLayout');

async function promoteCommand(sock, chatId, mentionedJids, message) {
    let userToPromote = [];

    if (mentionedJids && mentionedJids.length > 0) {
        userToPromote = mentionedJids;
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToPromote = [message.message.extendedTextMessage.contextInfo.participant];
    }

    if (userToPromote.length === 0) {
        await sendStyled(sock, chatId, message, {
            title: 'PROMOTE',
            lines: ['Mention a user or reply to a user message.']
        });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, userToPromote, 'promote');

        const promotedList = userToPromote.map((jid) => `@${jid.split('@')[0]}`).join('\n');
        const promoterJid = message.key.participant || message.key.remoteJid;

        await sendStyled(sock, chatId, message, {
            title: 'PROMOTE',
            lines: [
                `Promoted ☇ ${promotedList.replace(/\n/g, ', ')}`,
                `By ☇ @${promoterJid.split('@')[0]}`
            ]
        });
        await sock.sendMessage(chatId, {
            text: promotedList,
            mentions: [...userToPromote, promoterJid]
        }, { quoted: message }).catch(() => {});
    } catch (error) {
        console.error('Error in promote command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'PROMOTE',
            lines: ['Failed to promote user(s).']
        });
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
