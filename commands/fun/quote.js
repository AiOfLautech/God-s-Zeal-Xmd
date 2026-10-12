const axios = require('axios');
const { sendStyled } = require('../../lib/menuLayout');

async function quoteCommand(sock, chatId, message) {
    try {
        let text = 'The best way to get started is to quit talking and begin doing.';
        let author = 'Walt Disney';

        try {
            const response = await axios.get('https://api.quotable.io/random', { timeout: 10000 });
            if (response.data?.content) {
                text = response.data.content;
                author = response.data.author || author;
            }
        } catch {}

        await sendStyled(sock, chatId, message, {
            title: 'QUOTE',
            lines: [`"${text}"`, `- ${author}`]
        });
    } catch (error) {
        console.error('Error in quote command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'QUOTE',
            lines: ['Failed to fetch a quote.']
        });
    }
}

module.exports = quoteCommand;
