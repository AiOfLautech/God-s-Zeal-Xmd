const os = require('os');
const settings = require('../../settings');

function formatTime(seconds) {
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return [days ? `${days}d` : '', hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', `${secs}s`].filter(Boolean).join(' ');
}

async function pingCommand(sock, chatId, message) {
    try {
        const start = Date.now();
        await sock.sendMessage(chatId, { text: 'Pong!' }, { quoted: message });
        const ping = Math.round((Date.now() - start) / 2);
        const info = [
            '┌ ❏ *⌜ BOT SPEED ⌟* ❏',
            '│',
            `├◆ Ping: ${ping} ms`,
            `├◆ Uptime: ${formatTime(process.uptime())}`,
            `├◆ Version: ${settings.version}`,
            `├◆ Prefix: ${settings.commandPrefix || '.'}`,
            `├◆ Platform: ${os.platform()}`,
            '└ ❏'
        ].join('\n');
        await sock.sendMessage(chatId, { text: info }, { quoted: message });
    } catch (error) {
        console.error('Error in ping command:', error);
        await sock.sendMessage(chatId, { text: 'Failed to get bot status.' }, { quoted: message });
    }
}

module.exports = pingCommand;
