const { PassThrough } = require('stream');
const ffmpeg = require('fluent-ffmpeg');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

try {
    const ffmpegStatic = require('ffmpeg-static');
    if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);
} catch {}

const TEMP_DIR = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const PURPLE_COLOR = '#9C27B0';
const WHATSAPP_STATUS_TEXT_LIMIT = 1024;

function splitTextPreservingFormat(input, limit = WHATSAPP_STATUS_TEXT_LIMIT) {
    if (!input) return [];
    const chunks = [];
    let remaining = String(input);
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

function detectMediaType(message) {
    if (!message || typeof message !== 'object') return null;
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.stickerMessage) return 'sticker';
    return null;
}

function unwrapQuotedMessage(message) {
    let current = message;
    for (let i = 0; i < 4; i++) {
        const wrapper = current?.viewOnceMessageV2
            || current?.viewOnceMessage
            || current?.viewOnceMessageV2Extension
            || current?.documentWithCaptionMessage;
        if (!wrapper?.message) break;
        current = wrapper.message;
    }
    return current;
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

async function downloadMedia(message, type) {
    const mediaMessage = message[`${type}Message`];
    if (!mediaMessage) throw new Error(`Missing ${type} message payload.`);
    const stream = await downloadContentFromMessage(mediaMessage, type);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

async function postGroupStatus(sock, jid, content) {
    const statusSourceType = content.text
        ? 'TEXT'
        : content.image
            ? 'IMAGE'
            : content.video
                ? 'VIDEO'
                : content.audio
                    ? 'AUDIO'
                    : content.sticker
                        ? 'IMAGE'
                        : 'TEXT';

    return sock.sendMessage(jid, {
        ...content,
        contextInfo: {
            ...(content.contextInfo || {}),
            isGroupStatus: true,
            statusSourceType,
            statusAttributions: [{ type: 10 }],
            statusAudienceMetadata: { audienceType: 'CLOSE_FRIENDS' }
        }
    });
}

async function convertToVoiceNote(buffer) {
    return new Promise((resolve, reject) => {
        const input = new PassThrough();
        const output = new PassThrough();
        const chunks = [];
        input.end(buffer);
        output.on('data', (chunk) => chunks.push(chunk));
        output.on('end', () => resolve(Buffer.concat(chunks)));
        ffmpeg(input)
            .noVideo()
            .audioCodec('libopus')
            .format('ogg')
            .audioChannels(1)
            .audioFrequency(48000)
            .on('error', reject)
            .pipe(output);
    });
}

async function generateWaveform(buffer, bars = 64) {
    return new Promise((resolve, reject) => {
        const input = new PassThrough();
        const chunks = [];
        input.end(buffer);
        ffmpeg(input)
            .audioChannels(1)
            .audioFrequency(16000)
            .format('s16le')
            .on('error', reject)
            .on('end', () => {
                const raw = Buffer.concat(chunks);
                const samples = Math.floor(raw.length / 2);
                if (!samples) return resolve(undefined);
                const amplitudes = [];
                for (let i = 0; i < samples; i++) {
                    amplitudes.push(Math.abs(raw.readInt16LE(i * 2)) / 32768);
                }
                const size = Math.floor(amplitudes.length / bars);
                if (!size) return resolve(undefined);
                const averages = Array.from({ length: bars }, (_, index) => {
                    const slice = amplitudes.slice(index * size, (index + 1) * size);
                    return slice.reduce((sum, value) => sum + value, 0) / slice.length;
                });
                const max = Math.max(...averages);
                if (!max) return resolve(undefined);
                resolve(Buffer.from(averages.map((value) => Math.floor((value / max) * 100))).toString('base64'));
            })
            .pipe()
            .on('data', (chunk) => chunks.push(chunk));
    });
}

async function gcstatusCommand(sock, chatId, message, inputText) {
    const prefix = getPrefix();
    const caption = Array.isArray(inputText) ? inputText.join(' ').trim() : String(inputText || '').trim();

    if (!chatId.endsWith('@g.us')) {
        await sendStyled(sock, chatId, message, {
            title: 'GCSTATUS',
            lines: ['This command can only be used in groups.']
        });
        return;
    }

    const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage
        || message.message?.imageMessage?.contextInfo?.quotedMessage
        || message.message?.videoMessage?.contextInfo?.quotedMessage;

    if (!quotedMessage) {
        if (!caption) {
            await sendStyled(sock, chatId, message, {
                title: 'GCSTATUS',
                lines: [
                    `Reply to image, video, audio, or sticker: ${prefix}gcstatus [caption]`,
                    `Post text: ${prefix}gcstatus Your text here`
                ]
            });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } }).catch(() => {});
        try {
            const parts = splitTextPreservingFormat(caption);
            for (const part of parts) {
                await postGroupStatus(sock, chatId, {
                    text: part,
                    backgroundColor: PURPLE_COLOR
                });
            }
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } }).catch(() => {});
        } catch (error) {
            console.error('[GroupStatus] text error:', error);
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }).catch(() => {});
            await sendStyled(sock, chatId, message, {
                title: 'GCSTATUS',
                lines: [`Failed to post text group story: ${error.message || error}`]
            });
        }
        return;
    }

    const mediaPayload = unwrapQuotedMessage(quotedMessage);
    const mediaType = detectMediaType(mediaPayload);
    if (!mediaType) {
        await sendStyled(sock, chatId, message, {
            title: 'GCSTATUS',
            lines: ['Unsupported quoted media. Reply to an image, video, audio, or sticker.']
        });
        return;
    }

    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } }).catch(() => {});

    try {
        const buffer = await downloadMedia(mediaPayload, mediaType);
        if (!buffer?.length) throw new Error('The quoted media could not be downloaded.');
        const captions = splitTextPreservingFormat(caption || extractTextFromMessage(mediaPayload));

        if (mediaType === 'audio') {
            let voiceNote = buffer;
            try { voiceNote = await convertToVoiceNote(buffer); } catch {}
            const waveform = await generateWaveform(buffer).catch(() => undefined);
            await postGroupStatus(sock, chatId, {
                audio: voiceNote,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true,
                waveform
            });
        } else if (mediaType === 'sticker') {
            try {
                await postGroupStatus(sock, chatId, { sticker: buffer });
            } catch {
                await postGroupStatus(sock, chatId, { image: buffer, caption: captions[0] || '' });
            }
        } else {
            const parts = captions.length ? captions : [''];
            for (const part of parts) {
                await postGroupStatus(sock, chatId, {
                    [mediaType]: buffer,
                    caption: part || ''
                });
            }
        }

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } }).catch(() => {});
    } catch (error) {
        console.error(`[GroupStatus] ${mediaType} error:`, error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }).catch(() => {});
        await sendStyled(sock, chatId, message, {
            title: 'GCSTATUS',
            lines: [`Failed to post ${mediaType} group story: ${error.message || error}`]
        });
    }
}

module.exports = gcstatusCommand;
