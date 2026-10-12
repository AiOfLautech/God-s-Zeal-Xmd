const { getConfig, updateConfig, getPrefix } = require('../../lib/botConfig');
const isOwnerOrSudo = require('../../lib/isOwner');
const { sendStyled } = require('../../lib/menuLayout');

async function setPrefixCommand(sock, chatId, message, rawText = '') {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);
    if (!isOwner) {
        await sendStyled(sock, chatId, message, {
            title: 'PREFIX',
            lines: ['Only the bot owner can change the prefix.']
        });
        return;
    }

    const parts = String(rawText || '').trim().split(/\s+/);
    const nextPrefix = (parts[1] || '').trim();
    const current = getPrefix();
    const cfg = getConfig();

    if (!nextPrefix) {
        await sendStyled(sock, chatId, message, {
            title: 'PREFIX',
            lines: [
                `Current ☇ *${current}*`,
                `Usage ☇ ${current}setprefix <symbol>`,
                `Example ☇ ${current}setprefix !`
            ]
        });
        return;
    }

    if (nextPrefix.length > 3) {
        await sendStyled(sock, chatId, message, {
            title: 'PREFIX',
            lines: ['Prefix must be 1 to 3 characters.']
        });
        return;
    }

    updateConfig({ commandPrefix: nextPrefix });
    await sendStyled(sock, chatId, message, {
        title: 'PREFIX UPDATED',
        lines: [
            `Bot ☇ *${cfg.botName}*`,
            `Old ☇ *${current}*`,
            `New ☇ *${nextPrefix}*`,
            'Saved in ☇ *bot.json*'
        ]
    });
}

module.exports = setPrefixCommand;
