const fetch = require('node-fetch');
const { sendStyled } = require('../../lib/menuLayout');

async function shayariCommand(sock, chatId, message) {
    try {
        const response = await fetch('https://shizoapi.onrender.com/api/texts/shayari?apikey=shizo');
        const data = await response.json();
        if (!data || !data.result) throw new Error('Invalid response from API');
        await sendStyled(sock, chatId, message, {
            title: 'SHAYARI',
            lines: String(data.result).split('\n').slice(0, 20)
        });
    } catch (error) {
        console.error('Error in shayari command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'SHAYARI',
            lines: ['Failed to fetch shayari. Please try again later.']
        });
    }
}

module.exports = { shayariCommand };
