const axios = require('axios');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

async function soraCommand(sock, chatId, message) {
    try {
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';
        const used = (rawText || '').split(/\s+/)[0] || '.sora';
        const args = rawText.slice(used.length).trim();
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        const input = args || quotedText;

        if (!input) {
            await sendStyled(sock, chatId, message, {
                title: 'SORA',
                lines: [`Usage ☇ ${getPrefix()}sora anime girl with short blue hair`]
            });
            return;
        }

        const apiUrl = `https://okatsu-rolezapiiz.vercel.app/ai/txt2video?text=${encodeURIComponent(input)}`;
        const { data } = await axios.get(apiUrl, { timeout: 60000, headers: { 'user-agent': 'Mozilla/5.0' } });
        const videoUrl = data?.videoUrl || data?.result || data?.data?.videoUrl;
        if (!videoUrl) throw new Error('No videoUrl in API response');

        await sock.sendMessage(chatId, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            caption: `Prompt: ${input}`
        }, { quoted: message });
    } catch (error) {
        console.error('[SORA] error:', error?.message || error);
        await sendStyled(sock, chatId, message, {
            title: 'SORA',
            lines: ['Failed to generate video. Try a different prompt later.']
        });
    }
}

module.exports = soraCommand;
