const fetch = require('node-fetch');
const { sendStyled } = require('../../lib/menuLayout');

async function truthCommand(sock, chatId, message) {
    try {
        const res = await fetch('https://shizoapi.onrender.com/api/texts/truth?apikey=shizo');
        if (!res.ok) throw await res.text();
        const json = await res.json();
        await sendStyled(sock, chatId, message, {
            title: 'TRUTH',
            lines: [json.result || 'Be honest.']
        });
    } catch (error) {
        console.error('Error in truth command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'TRUTH',
            lines: ['Failed to get truth. Please try again later.']
        });
    }
}

module.exports = { truthCommand };
