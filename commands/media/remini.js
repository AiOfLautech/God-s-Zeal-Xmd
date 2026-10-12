const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

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
        await sendStyled(sock, chatId, message, {
            title: 'REMINI',
            lines: [`Reply to an image with ${getPrefix()}remini to enhance it.`]
        });
        return;
    }

    try {
        await downloadMediaMessage(targetMessage, 'buffer', {}, {
            logger: undefined,
            reuploadRequest: sock.updateMediaMessage
        });

        await sendStyled(sock, chatId, message, {
            title: 'REMINI',
            lines: ['Remini enhancement is not configured yet. Add your image enhancement API to enable it.']
        });
    } catch (error) {
        console.error('Error in remini command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'REMINI',
            lines: ['Failed to process the image for enhancement.']
        });
    }
}

module.exports = { reminiCommand };
