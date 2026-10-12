const fetch = require('node-fetch');
const { sendStyled } = require('../../lib/menuLayout');

async function goodnightCommand(sock, chatId, message) {
    try {
        const res = await fetch('https://shizoapi.onrender.com/api/texts/lovenight?apikey=shizo');
        if (!res.ok) throw await res.text();
        const json = await res.json();
        await sendStyled(sock, chatId, message, {
            title: 'GOODNIGHT',
            lines: [json.result || 'Sleep well.']
        });
    } catch (error) {
        console.error('Error in goodnight command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'GOODNIGHT',
            lines: ['Failed to get goodnight message. Please try again later.']
        });
    }
}

module.exports = { goodnightCommand };
