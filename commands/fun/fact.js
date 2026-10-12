const axios = require('axios');
const { sendStyled } = require('../../lib/menuLayout');

module.exports = async function (sock, chatId, message) {
    try {
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en', { timeout: 10000 });
        const fact = response.data.text;
        await sendStyled(sock, chatId, message, {
            title: 'FACT',
            lines: [fact]
        });
    } catch (error) {
        console.error('Error fetching fact:', error);
        await sendStyled(sock, chatId, message, {
            title: 'FACT',
            lines: ['Sorry, I could not fetch a fact right now.']
        });
    }
};
