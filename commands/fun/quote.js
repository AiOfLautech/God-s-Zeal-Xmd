const axios = require('axios');

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

        await sock.sendMessage(chatId, {
            text: `*QUOTE OF THE MOMENT*\n\n"${text}"\n\n- ${author}`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in quote command:', error);
        await sock.sendMessage(chatId, { text: 'Failed to fetch a quote.' }, { quoted: message });
    }
}

module.exports = quoteCommand;
