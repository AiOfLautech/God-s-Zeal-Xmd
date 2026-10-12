const fetch = require('node-fetch');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

async function handleSsCommand(sock, chatId, message, match) {
    const prefix = getPrefix();
    if (!match) {
        await sendStyled(sock, chatId, message, {
            title: 'SCREENSHOT',
            lines: [
                `Usage ☇ ${prefix}ss https://google.com`,
                `${prefix}ssweb <url>`,
                `${prefix}screenshot <url>`
            ]
        });
        return;
    }

    try {
        await sock.presenceSubscribe(chatId).catch(() => {});
        await sock.sendPresenceUpdate('composing', chatId).catch(() => {});
        const url = match.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            await sendStyled(sock, chatId, message, {
                title: 'SCREENSHOT',
                lines: ['Provide a valid URL starting with http:// or https://']
            });
            return;
        }

        const apiUrl = `https://api.siputzx.my.id/api/tools/ssweb?url=${encodeURIComponent(url)}&theme=light&device=desktop`;
        const response = await fetch(apiUrl, { headers: { accept: '*/*' } });
        if (!response.ok) throw new Error(`API responded with status: ${response.status}`);
        const imageBuffer = await response.buffer();
        await sock.sendMessage(chatId, { image: imageBuffer, caption: url }, { quoted: message });
    } catch (error) {
        console.error('Error in ss command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'SCREENSHOT',
            lines: ['Failed to take screenshot. Check the URL and try again.']
        });
    }
}

module.exports = { handleSsCommand };
