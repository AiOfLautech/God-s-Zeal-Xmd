const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function reminiCommand(sock, chatId, message) {
    const quotedInfo = message.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = quotedInfo?.quotedMessage || null;
    const targetMessage = quotedMessage
        ? {
            key: {
                remoteJid: chatId,
                id: quotedInfo.stanzaId,
                participant: quotedInfo.participant
            },
            message: quotedMessage
        }
        : message;

    const hasImage = !!targetMessage.message?.imageMessage;
    if (!hasImage) {
        await sock.sendMessage(chatId, {
            text: 'Reply to an image with .remini to enhance it.'
        }, { quoted: message });
        return;
    }

    try {
        await downloadMediaMessage(targetMessage, 'buffer', {}, {
            logger: undefined,
            reuploadRequest: sock.updateMediaMessage
        });

        await sock.sendMessage(chatId, {
            text: 'Remini enhancement is not configured yet. Add your image enhancement API to enable it.'
        }, { quoted: message });
    } catch (error) {
        console.error('Error in remini command:', error);
        await sock.sendMessage(chatId, {
            text: 'Failed to process the image for enhancement.'
        }, { quoted: message });
    }
}

module.exports = { reminiCommand };
