const isAdmin = require('../../lib/isAdmin');
const { sendStyled } = require('../../lib/menuLayout');

async function tagAllCommand(sock, chatId, senderId, message) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isBotAdmin) {
            await sendStyled(sock, chatId, message, {
                title: 'TAGALL',
                lines: ['Please make the bot an admin first.']
            });
            return;
        }
        if (!isSenderAdmin) {
            await sendStyled(sock, chatId, message, {
                title: 'TAGALL',
                lines: ['Only group admins can use the tagall command.']
            });
            return;
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        if (!participants.length) {
            await sendStyled(sock, chatId, message, {
                title: 'TAGALL',
                lines: ['No participants found in the group.']
            });
            return;
        }

        await sendStyled(sock, chatId, message, {
            title: 'TAGALL',
            lines: ['Hello everyone.', `Members ☇ ${participants.length}`]
        });
        await sock.sendMessage(chatId, {
            text: participants.map(p => `@${p.id.split('@')[0]}`).join('\n'),
            mentions: participants.map(p => p.id)
        });
    } catch (error) {
        console.error('Error in tagall command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'TAGALL',
            lines: ['Failed to tag all members.']
        });
    }
}

module.exports = tagAllCommand;
