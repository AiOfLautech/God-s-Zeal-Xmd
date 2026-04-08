const {
    downloadMediaMessage,
    prepareWAMessageMedia,
    generateWAMessageFromContent
} = require('@whiskeysockets/baileys');
const pino = require('pino');

const WHATSAPP_STATUS_TEXT_LIMIT = 1024;

function splitTextPreservingFormat(input, limit = WHATSAPP_STATUS_TEXT_LIMIT) {
    if (!input) return [];

    const chunks = [];
    let remaining = input;

    while (remaining.length > limit) {
        let splitAt = remaining.lastIndexOf('\n', limit);
        if (splitAt <= 0) splitAt = remaining.lastIndexOf(' ', limit);
        if (splitAt <= 0) splitAt = limit;

        chunks.push(remaining.slice(0, splitAt));
        remaining = remaining.slice(splitAt);
    }

    if (remaining.length) chunks.push(remaining);

    return chunks;
}

function extractTextFromMessage(content = {}) {
    return (
        content.conversation ||
        content.extendedTextMessage?.text ||
        content.imageMessage?.caption ||
        content.videoMessage?.caption ||
        ''
    );
}

async function relayGroupStatus(sock, from, payload) {
    const generatedMessage = generateWAMessageFromContent(
        from,
        payload,
        { userJid: sock.user.id }
    );

    await sock.relayMessage(from, generatedMessage.message, {
        messageId: generatedMessage.key.id
    });
}

async function gcstatus(sock, chatId, message, inputText) {
    const from = chatId;
    const m = message;
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: m });

    if (!from.endsWith('@g.us')) {
        return reply('❌ This command is for groups only.');
    }

    const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = quotedInfo?.quotedMessage || null;
    const text = Array.isArray(inputText) ? inputText.join(' ') : String(inputText || '');

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
    const fallbackText = extractTextFromMessage(content);
    const statusText = text || fallbackText;

    if (!isImage && !isVideo && !isAudio && !statusText) {
        return reply(
            '❌ Usage:\n' +
            '.gcstatus Hello group\n' +
            '.gcstatus (as caption on media)\n' +
            '.gcstatus (reply to image/video/audio)'
        );
    }

    await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

    try {
        const textParts = splitTextPreservingFormat(statusText, WHATSAPP_STATUS_TEXT_LIMIT);

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

            const captions = textParts.length ? textParts : [undefined];

            for (const caption of captions) {
                let mediaOptions = {};
                if (isImage) mediaOptions = { image: mediaBuffer, caption };
                if (isVideo) mediaOptions = { video: mediaBuffer, caption };
                if (isAudio) mediaOptions = { audio: mediaBuffer, mimetype: content.audioMessage.mimetype || 'audio/mp4', ptt: false };

                const preparedMedia = await prepareWAMessageMedia(mediaOptions, {
                    upload: sock.waUploadToServer
                });

                let finalMediaMessage = {};
                if (isImage) finalMediaMessage = { imageMessage: preparedMedia.imageMessage };
                if (isVideo) finalMediaMessage = { videoMessage: preparedMedia.videoMessage };
                if (isAudio) finalMediaMessage = { audioMessage: preparedMedia.audioMessage };

                await relayGroupStatus(sock, from, {
                    groupStatusMessageV2: {
                        message: finalMediaMessage
                    }
                });
            }
        } else {
            const parts = textParts.length ? textParts : [statusText];

            for (const part of parts) {
                const randomHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');

                await relayGroupStatus(sock, from, {
                    groupStatusMessageV2: {
                        message: {
                            extendedTextMessage: {
                                text: part,
                                backgroundArgb: 0xFF000000 + parseInt(randomHex, 16),
                                font: 2
                            }
                        }
                    }
                });
            }
        }

        await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (error) {
        console.error('[GCSTATUS] error:', error);
        await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
        return reply(`❌ Failed to post group status.\n${error.message}`);
    }
}

module.exports = gcstatus;
