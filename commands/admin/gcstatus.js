const {
    downloadMediaMessage,
    prepareWAMessageMedia,
    generateWAMessageFromContent
} = require('@whiskeysockets/baileys');
const pino = require('pino');

async function gcstatus(sock, chatId, message, args) {
    const from = chatId;
    const m = message;
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: m });

    if (!from.endsWith('@g.us')) {
        return reply('❌ This command is for groups only.');
    }

    const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = quotedInfo?.quotedMessage || null;
    const text = args.join(' ').trim();

    const targetMessage = quotedMessage
        ? {
            key: {
                remoteJid: from,
                id: quotedInfo.stanzaId,
                participant: quotedInfo.participant
            },
            message: quotedMessage
        }
        : m;

    const content = targetMessage.message || {};
    const isImage = !!content.imageMessage;
    const isVideo = !!content.videoMessage;
    const isAudio = !!content.audioMessage;

    if (!isImage && !isVideo && !isAudio && !text) {
        return reply(
            '❌ Usage:\n' +
            '.gcstatus Hello group\n' +
            '.gcstatus (as caption on media)\n' +
            '.gcstatus (reply to image/video/audio)'
        );
    }

    await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

    try {
        let payload = {};

        if (isImage || isVideo || isAudio) {
            const mediaBuffer = await downloadMediaMessage(
                targetMessage,
                'buffer',
                {},
                {
                    logger: pino({ level: 'silent' }),
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            let mediaOptions = {};
            if (isImage) mediaOptions = { image: mediaBuffer, caption: text || undefined };
            if (isVideo) mediaOptions = { video: mediaBuffer, caption: text || undefined };
            if (isAudio) mediaOptions = { audio: mediaBuffer, mimetype: content.audioMessage.mimetype || 'audio/mp4', ptt: false };

            const preparedMedia = await prepareWAMessageMedia(mediaOptions, {
                upload: sock.waUploadToServer
            });

            let finalMediaMessage = {};
            if (isImage) finalMediaMessage = { imageMessage: preparedMedia.imageMessage };
            if (isVideo) finalMediaMessage = { videoMessage: preparedMedia.videoMessage };
            if (isAudio) finalMediaMessage = { audioMessage: preparedMedia.audioMessage };

            payload = {
                groupStatusMessageV2: {
                    message: finalMediaMessage
                }
            };
        } else {
            const randomHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
            payload = {
                groupStatusMessageV2: {
                    message: {
                        extendedTextMessage: {
                            text,
                            backgroundArgb: 0xFF000000 + parseInt(randomHex, 16),
                            font: 2
                        }
                    }
                }
            };
        }

        const generatedMessage = generateWAMessageFromContent(
            from,
            payload,
            { userJid: sock.user.id }
        );

        await sock.relayMessage(from, generatedMessage.message, { messageId: generatedMessage.key.id });
        await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (error) {
        console.error('[GCSTATUS] error:', error);
        await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
        return reply(`❌ Failed to post group status.\n${error.message}`);
    }
}

module.exports = gcstatus;
