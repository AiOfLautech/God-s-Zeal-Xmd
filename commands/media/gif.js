const axios = require('axios');
const { sendStyled } = require('../../lib/menuLayout');
const { getConfig, getPrefix } = require('../../lib/botConfig');

async function gifCommand(sock, chatId, query, message) {
    const apiKey = getConfig().giphyApiKey;

    if (!query) {
        await sendStyled(sock, chatId, message, {
            title: 'GIF',
            lines: [`Usage ☇ ${getPrefix()}gif dancing`]
        });
        return;
    }

    try {
        const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
            params: {
                api_key: apiKey,
                q: query,
                limit: 1,
                rating: 'g'
            }
        });
        const gifUrl = response.data.data[0]?.images?.downsized_medium?.url;
        if (gifUrl) {
            await sock.sendMessage(chatId, { video: { url: gifUrl }, caption: `GIF for ${query}` });
        } else {
            await sendStyled(sock, chatId, message, {
                title: 'GIF',
                lines: ['No GIFs found for your search term.']
            });
        }
    } catch (error) {
        console.error('Error fetching GIF:', error);
        await sendStyled(sock, chatId, message, {
            title: 'GIF',
            lines: ['Failed to fetch GIF. Please try again later.']
        });
    }
}

module.exports = gifCommand;
