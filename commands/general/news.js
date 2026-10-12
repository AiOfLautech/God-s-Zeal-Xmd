const axios = require('axios');
const { sendStyled } = require('../../lib/menuLayout');

module.exports = async function (sock, chatId, message) {
    try {
        const sources = [
            () => axios.get('https://saurav.tech/NewsAPI/top-headlines/category/general/us.json', { timeout: 12000 }),
            () => axios.get('https://newsapi.org/v2/top-headlines?country=us&apiKey=dcd720a6f1914e2d9dba9790c188c08c', { timeout: 12000 })
        ];
        let articles = [];
        for (const getter of sources) {
            try {
                const response = await getter();
                articles = response.data?.articles || [];
                if (articles.length) break;
            } catch {}
        }
        if (!articles.length) throw new Error('No articles');
        const lines = articles.slice(0, 5).map((article, index) => `${index + 1}. ${article.title}`);
        await sendStyled(sock, chatId, message, {
            title: 'LATEST NEWS',
            lines
        });
    } catch (error) {
        console.error('Error fetching news:', error);
        await sendStyled(sock, chatId, message, {
            title: 'NEWS',
            lines: ['Sorry, I could not fetch news right now.']
        });
    }
};
