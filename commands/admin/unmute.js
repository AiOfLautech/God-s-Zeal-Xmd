const { sendStyled } = require('../../lib/menuLayout');

async function unmuteCommand(sock, chatId, message) {
    await sock.groupSettingUpdate(chatId, 'not_announcement');
    await sendStyled(sock, chatId, message, {
        title: 'UNMUTE',
        lines: ['The group has been unmuted.']
    });
}

module.exports = unmuteCommand;
