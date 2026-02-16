const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function gcstatus(sock, chatId, message) {
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: 'This command can only be used in groups.' }, { quoted: message });

    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                       message.message?.imageMessage || 
                       message.message?.videoMessage || 
                       message.message?.audioMessage;
                       
        if (!quoted) return sock.sendMessage(chatId, { text: 'Please reply to a message (image/video/audio/text) to post as group status.' }, { quoted: message });

        const mtype = Object.keys(quoted)[0];
        let statusPayload = {};
        
        if (mtype === 'imageMessage') {
            const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            const caption = quoted.imageMessage?.caption || '';
            statusPayload = {
                groupStatusMessage: {
                    image: buffer,
                    caption: caption
                }
            };
        } else if (mtype === 'videoMessage') {
            const stream = await downloadContentFromMessage(quoted.videoMessage, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            const caption = quoted.videoMessage?.caption || '';
            statusPayload = {
                groupStatusMessage: {
                    video: buffer,
                    caption: caption
                }
            };
        } else if (mtype === 'audioMessage') {
            const stream = await downloadContentFromMessage(quoted.audioMessage, 'audio');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            statusPayload = {
                groupStatusMessage: {
                    audio: buffer,
                    ptt: quoted.audioMessage?.ptt || false
                }
            };
        } else if (mtype === 'conversation' || mtype === 'extendedTextMessage') {
            const textContent = quoted.conversation || quoted.extendedTextMessage?.text || '';
            const bgColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#33FFF5', '#F5FF33', '#9933FF'];
            const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];
            statusPayload = {
                groupStatusMessage: {
                    text: textContent,
                    backgroundColor: randomBg,
                    font: Math.floor(Math.random() * 5)
                }
            };
        } else {
            return sock.sendMessage(chatId, { text: 'Unsupported media type for status.' }, { quoted: message });
        }
        
        // Re-read settings for reaction config
        const settings = require('../settings');
        const reactEmoji = settings.statusReactEmoji || '📢';
        
        await sock.sendMessage(chatId, statusPayload);
        await sock.sendMessage(chatId, { react: { text: reactEmoji, key: message.key } });
        
    } catch (e) {
        console.error("gcstatus error:", e);
        await sock.sendMessage(chatId, { text: 'Failed to post group status.' }, { quoted: message });
    }
}

module.exports = gcstatus;