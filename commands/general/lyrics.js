const fetch = require('node-fetch');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle) {
        await sendStyled(sock, chatId, message, {
            title: 'LYRICS',
            lines: [`Usage ☇ ${getPrefix()}lyrics <song name>`]
        });
        return;
    }

    try {
        const apiUrl = `https://lyricsapi.fly.dev/api/lyrics?q=${encodeURIComponent(songTitle)}`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const lyrics = data && data.result && data.result.lyrics ? data.result.lyrics : null;
        if (!lyrics) {
            await sendStyled(sock, chatId, message, {
                title: 'LYRICS',
                lines: [`No lyrics found for ${songTitle}`]
            });
            return;
        }
        const maxChars = 3500;
        const output = lyrics.length > maxChars ? lyrics.slice(0, maxChars - 3) + '...' : lyrics;
        await sendStyled(sock, chatId, message, {
            title: `LYRICS ${songTitle}`,
            lines: output.split('\n').slice(0, 40)
        });
    } catch (error) {
        console.error('Error in lyrics command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'LYRICS',
            lines: [`Could not fetch lyrics for ${songTitle}`]
        });
    }
}

module.exports = { lyricsCommand };
