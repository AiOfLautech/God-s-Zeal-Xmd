const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

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
        await sendStyled(sock, chatId, message, {
            title: 'REMOVEBG',
            lines: [`Reply to an image with ${getPrefix()}removebg.`]
        });
        return;
    }

    try {
        await downloadMediaMessage(targetMessage, 'buffer', {}, {
            logger: undefined,
            reuploadRequest: sock.updateMediaMessage
        });

        await sendStyled(sock, chatId, message, {
            title: 'REMOVEBG',
            lines: ['Remove background is not configured yet.']
        });
    } catch (error) {
        console.error('Error in removebg command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'REMOVEBG',
            lines: ['Failed to process the image for background removal.']
        });
    }
}

module.exports = removebgCommand;
