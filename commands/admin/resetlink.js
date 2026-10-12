const { sendStyled } = require('../../lib/menuLayout');

async function resetlinkCommand(sock, chatId, senderId, message) {
    try {
        await sock.groupRevokeInvite(chatId);
        const newCode = await sock.groupInviteCode(chatId);
        await sendStyled(sock, chatId, message, {
            title: 'GROUP LINK RESET',
            lines: ['A new invite link has been created.', `https://chat.whatsapp.com/${newCode}`]
        });
    } catch (error) {
        console.error('Error in resetlink command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'RESETLINK',
            lines: ['Failed to reset the group link. Make sure the bot is an admin.']
        });
    }
}

module.exports = resetlinkCommand;
