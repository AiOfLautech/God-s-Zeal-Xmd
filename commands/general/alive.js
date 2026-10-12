const { getConfig, getPrefix } = require('../../lib/botConfig');
const { sendStyled } = require('../../lib/menuLayout');

async function aliveCommand(sock, chatId, message) {
    try {
        const cfg = getConfig();
        const prefix = getPrefix();
        await sendStyled(sock, chatId, message, {
            title: cfg.botName,
            userName: message.pushName || cfg.botName,
            lines: [
                `Name ☇ *${cfg.botName}*`,
                `Creator ☇ *${cfg.creator}*`,
                `Version ☇ *${cfg.version}*`,
                `Prefix ☇ *${prefix}*`,
                `Newsletter ☇ *${cfg.newsletterName}*`,
                'Status ☇ *Online*',
                `Type ${prefix}menu for command list`
            ]
        });
    } catch (error) {
        console.error('Error in alive command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'ALIVE',
            lines: ['Bot is alive and running.']
        });
    }
}

module.exports = aliveCommand;
