const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

async function ttsCommand(sock, chatId, text, message, language = 'en') {
    if (!text) {
        await sendStyled(sock, chatId, message, {
            title: 'TTS',
            lines: [`Usage ☇ ${getPrefix()}tts hello world`]
        });
        return;
    }

    const fileName = `tts-${Date.now()}.mp3`;
    const filePath = path.join(process.cwd(), 'temp', fileName);
    try {
        if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });
        const gtts = new gTTS(text, language);
        await new Promise((resolve, reject) => {
            gtts.save(filePath, (err) => err ? reject(err) : resolve());
        });
        await sock.sendMessage(chatId, {
            audio: { url: filePath },
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: message });
    } catch (error) {
        console.error('TTS error:', error.message);
        await sendStyled(sock, chatId, message, {
            title: 'TTS',
            lines: ['Error generating TTS audio.']
        });
    } finally {
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
    }
}

module.exports = ttsCommand;
