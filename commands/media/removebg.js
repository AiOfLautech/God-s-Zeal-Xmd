const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function removebgCommand(sock, chatId, message) {
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
            text: 'Reply to an image with .removebg to use this feature.'
        }, { quoted: message });
        return;
    }

    try {
        await downloadMediaMessage(targetMessage, 'buffer', {}, {
            logger: undefined,
            reuploadRequest: sock.updateMediaMessage
        });

        await sock.sendMessage(chatId, {
            text: 'Remove background is not configured yet. Add your API integration to enable it.'
        }, { quoted: message });
    } catch (error) {
        console.error('Error in removebg command:', error);
        await sock.sendMessage(chatId, {
            text: 'Failed to process the image for background removal.'
        }, { quoted: message });
    }
}

module.exports = removebgCommand;
