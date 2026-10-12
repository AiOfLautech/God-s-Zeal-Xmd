const axios = require('axios');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

module.exports = async function (sock, chatId, message, city) {
    try {
        if (!city) {
            await sendStyled(sock, chatId, message, {
                title: 'WEATHER',
                lines: [`Usage ☇ ${getPrefix()}weather Lagos`]
            });
            return;
        }
        const apiKey = '4902c0f2550f58298ad4146a92b65e10';
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`, { timeout: 12000 });
        const weather = response.data;
        await sendStyled(sock, chatId, message, {
            title: `WEATHER ${weather.name}`,
            lines: [
                `Condition ☇ *${weather.weather[0].description}*`,
                `Temp ☇ *${weather.main.temp} C*`,
                `Humidity ☇ *${weather.main.humidity}%*`,
                `Wind ☇ *${weather.wind?.speed || 0} m/s*`
            ]
        });
    } catch (error) {
        console.error('Error fetching weather:', error.message);
        await sendStyled(sock, chatId, message, {
            title: 'WEATHER',
            lines: ['Sorry, I could not fetch the weather right now.']
        });
    }
};
