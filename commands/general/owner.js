const settings = require('../../settings');

async function ownerCommand(sock, chatId) {
    const ownerNumbers = Array.isArray(settings.ownerNumbers) && settings.ownerNumbers.length
        ? settings.ownerNumbers
        : [settings.ownerNumber];

    const contacts = ownerNumbers.map((number, index) => ({
        vcard: [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${settings.botOwner}${ownerNumbers.length > 1 ? ` ${index + 1}` : ''}`,
            `TEL;waid=${number}:${number}`,
            'END:VCARD'
        ].join('\n')
    }));

    await sock.sendMessage(chatId, {
        text: [
            '┌ ❏ *⌜ OWNER CONTACTS ⌟* ❏',
            '│',
            ...ownerNumbers.map((num) => `├◆ ${num}`),
            '└ ❏'
        ].join('\n')
    });

    await sock.sendMessage(chatId, {
        contacts: { displayName: settings.botOwner, contacts }
    });
}

module.exports = ownerCommand;
