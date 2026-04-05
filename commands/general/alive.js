const settings = require('../../settings');

async function aliveCommand(sock, chatId, message) {
    try {
        const text = [
            '┌ ❏ *⌜ BOT STATUS ⌟* ❏',
            '│',
            `├◆ Name: ${settings.botName}`,
            `├◆ Version: ${settings.version}`,
            `├◆ Prefix: ${settings.commandPrefix || '.'}`,
            '├◆ Status: Online',
            '├◆ Plan: Free',
            '├◆ Type .menu for command list',
            '└ ❏'
        ].join('\n');

        await sock.sendMessage(chatId, {
            text,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: settings.newsletterJid || '120363269950668068@newsletter',
                    newsletterName: 'GODSZEAL XMD',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { text: 'Bot is alive and running.' }, { quoted: message });
    }
}

module.exports = aliveCommand;
