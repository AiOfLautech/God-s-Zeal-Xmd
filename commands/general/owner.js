const { getConfig } = require('../../lib/botConfig');
const { sendStyled } = require('../../lib/menuLayout');

async function ownerCommand(sock, chatId, message) {
    const cfg = getConfig();
    const ownerNumbers = Array.isArray(cfg.ownerNumbers) && cfg.ownerNumbers.length
        ? cfg.ownerNumbers
        : [cfg.creatorNumber];

    await sendStyled(sock, chatId, message, {
        title: `${cfg.botName} OWNER`,
        userName: message?.pushName || cfg.botName,
        lines: [
            `Creator ☇ *${cfg.creator}*`,
            ...ownerNumbers.map((num) => `Number ☇ *${num}*`)
        ]
    });

    const contacts = ownerNumbers.map((number, index) => ({
        vcard: [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${cfg.creator}${ownerNumbers.length > 1 ? ` ${index + 1}` : ''}`,
            `TEL;waid=${number}:${number}`,
            'END:VCARD'
        ].join('\n')
    }));

    await sock.sendMessage(chatId, {
        contacts: { displayName: cfg.creator, contacts }
    });
}

module.exports = ownerCommand;
