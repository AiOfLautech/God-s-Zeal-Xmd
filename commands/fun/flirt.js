const fetch = require('node-fetch');
const { sendStyled } = require('../../lib/menuLayout');

async function flirtCommand(sock, chatId, message) {
    try {
        const res = await fetch('https://shizoapi.onrender.com/api/texts/flirt?apikey=shizo');
        if (!res.ok) throw await res.text();
        const json = await res.json();
        await sendStyled(sock, chatId, message, {
            title: 'FLIRT',
            lines: [json.result || 'You already know.']
        });
    } catch (error) {
        console.error('Error in flirt command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'FLIRT',
            lines: ['Failed to get flirt message. Please try again later.']
        });
    }
}

module.exports = { flirtCommand };
