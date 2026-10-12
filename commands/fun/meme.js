const fetch = require('node-fetch');
const { getPrefix } = require('../../lib/botConfig');
const { getChannelInfo } = require('../../lib/messageConfig');
const { menuButtons, sendStyled } = require('../../lib/menuLayout');

async function memeCommand(sock, chatId, message) {
    const prefix = getPrefix();
    const sources = [
        'https://meme-api.com/gimme',
        'https://shizoapi.onrender.com/api/memes/cheems?apikey=shizo'
    ];
    try {
        for (const source of sources) {
            try {
                const response = await fetch(source, { timeout: 12000 });
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('image')) {
                    const imageBuffer = await response.buffer();
                    await sock.sendMessage(chatId, {
                        image: imageBuffer,
                        caption: 'Here is your meme',
                        buttons: [
                            { buttonId: `${prefix}meme`, buttonText: { displayText: 'another meme' }, type: 1 },
                            ...menuButtons(prefix).slice(0, 2)
                        ],
                        headerType: 1,
                        ...getChannelInfo()
                    }, { quoted: message });
                    return;
                }
                const data = await response.json();
                const imageUrl = data.url || data.image || data.result;
                if (imageUrl) {
                    await sock.sendMessage(chatId, {
                        image: { url: imageUrl },
                        caption: data.title || 'Here is your meme',
                        buttons: [
                            { buttonId: `${prefix}meme`, buttonText: { displayText: 'another meme' }, type: 1 },
                            ...menuButtons(prefix).slice(0, 2)
                        ],
                        headerType: 1,
                        ...getChannelInfo()
                    }, { quoted: message });
                    return;
                }
            } catch {}
        }
        throw new Error('All meme sources failed');
    } catch (error) {
        console.error('Error in meme command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'MEME',
            lines: ['Failed to fetch meme. Please try again later.']
        });
    }
}

module.exports = memeCommand;
