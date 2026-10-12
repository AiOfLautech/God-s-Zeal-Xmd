const { sendStyled } = require('../../lib/menuLayout');

async function clearCommand(sock, chatId, message) {
    try {
        const sent = await sock.sendMessage(chatId, { text: 'Clearing bot messages...' });
        const messageKey = sent.key;
        await sock.sendMessage(chatId, { delete: messageKey });
    } catch (error) {
        console.error('Error clearing messages:', error);
        await sendStyled(sock, chatId, message, {
            title: 'CLEAR',
            lines: ['An error occurred while clearing messages.']
        });
    }
}

module.exports = { clearCommand };
