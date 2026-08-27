async function resetlinkCommand(sock, chatId, senderId) {
    try {
        await sock.groupRevokeInvite(chatId);
        const newCode = await sock.groupInviteCode(chatId);
        await sock.sendMessage(chatId, {
            text:
                '*GROUP LINK RESET*\n\n' +
                'A new invite link has been created.\n' +
                `https://chat.whatsapp.com/${newCode}`
        });
    } catch (error) {
        console.error('Error in resetlink command:', error);
        await sock.sendMessage(chatId, {
            text: 'Failed to reset the group link. Make sure the bot is an admin.'
        });
    }
}

module.exports = resetlinkCommand;
