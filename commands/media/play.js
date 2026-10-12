const yts = require('yt-search');
const axios = require('axios');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

async function playCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const searchQuery = text.replace(/^[.\/\\!~#$%\-]+\S+\s*/, '').trim();

        if (!searchQuery) {
            await sendStyled(sock, chatId, message, {
                title: 'MUSIC',
                lines: [`Usage ☇ ${getPrefix()}music <song name>`]
            });
            return;
        }

        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            await sendStyled(sock, chatId, message, {
                title: 'MUSIC',
                lines: ['No songs found.']
            });
            return;
        }

        await sendStyled(sock, chatId, message, {
            title: 'MUSIC',
            lines: [`Downloading ${videos[0].title}`]
        });

        const video = videos[0];
        const response = await axios.get(`https://apis-keith.vercel.app/download/dlmp3?url=${video.url}`, { timeout: 60000 });
        const data = response.data;
        if (!data || !data.status || !data.result || !data.result.downloadUrl) {
            await sendStyled(sock, chatId, message, {
                title: 'MUSIC',
                lines: ['Failed to fetch audio. Please try again later.']
            });
            return;
        }

        await sock.sendMessage(chatId, {
            audio: { url: data.result.downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${data.result.title || video.title}.mp3`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in play command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'MUSIC',
            lines: ['Download failed. Please try again later.']
        });
    }
}

module.exports = playCommand;
