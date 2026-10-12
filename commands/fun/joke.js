const axios = require('axios');
const { sendStyled } = require('../../lib/menuLayout');

module.exports = async function (sock, chatId, message) {
    try {
        const response = await axios.get('https://icanhazdadjoke.com/', {
            headers: { Accept: 'application/json' },
            timeout: 10000
        });
        const joke = response.data.joke;
        await sendStyled(sock, chatId, message, {
            title: 'JOKE',
            lines: [joke]
        });
    } catch (error) {
        console.error('Error fetching joke:', error);
        await sendStyled(sock, chatId, message, {
            title: 'JOKE',
            lines: ['Sorry, I could not fetch a joke right now.']
        });
    }
};
