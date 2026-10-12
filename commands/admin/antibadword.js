const { handleAntiBadwordCommand } = require('../../lib/antibadword');
const isAdminHelper = require('../../lib/isAdmin');
const { sendStyled } = require('../../lib/menuLayout');

async function antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin) {
    try {
        if (!isSenderAdmin) {
            await sendStyled(sock, chatId, message, {
                title: 'ANTIBADWORD',
                lines: ['For group admins only.']
            });
            return;
        }

        const text = message.message?.conversation ||
                    message.message?.extendedTextMessage?.text || '';
        const match = text.split(' ').slice(1).join(' ');
        await handleAntiBadwordCommand(sock, chatId, message, match);
    } catch (error) {
        console.error('Error in antibadword command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'ANTIBADWORD',
            lines: ['Error processing antibadword command.']
        });
    }
}

module.exports = antibadwordCommand;
