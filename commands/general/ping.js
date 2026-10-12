const os = require('os');
const { getConfig, getPrefix } = require('../../lib/botConfig');
const { sendStyled, formatUptime } = require('../../lib/menuLayout');

async function pingCommand(sock, chatId, message) {
    try {
        const cfg = getConfig();
        const start = Date.now();
        const ping = Math.round((Date.now() - start) / 2) || 1;
        await sendStyled(sock, chatId, message, {
            title: `${cfg.botName} SPEED`,
            userName: message.pushName || cfg.botName,
            lines: [
                `Ping ☇ *${ping} ms*`,
                `Uptime ☇ *${formatUptime(process.uptime())}*`,
                `Version ☇ *${cfg.version}*`,
                `Prefix ☇ *${getPrefix()}*`,
                `Platform ☇ *${os.platform()}*`
            ]
        });
    } catch (error) {
        console.error('Error in ping command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'PING',
            lines: ['Failed to get bot status.']
        });
    }
}

module.exports = pingCommand;
