const fetch = require('node-fetch');
const { sendStyled } = require('../../lib/menuLayout');

async function dareCommand(sock, chatId, message) {
    try {
        const res = await fetch('https://shizoapi.onrender.com/api/texts/dare?apikey=shizo');
        if (!res.ok) throw await res.text();
        const json = await res.json();
        await sendStyled(sock, chatId, message, {
            title: 'DARE',
            lines: [json.result || 'Try something unexpected.']
        });
    } catch (error) {
        console.error('Error in dare command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'DARE',
            lines: ['Failed to get dare. Please try again later.']
        });
    }
}

module.exports = { dareCommand };
