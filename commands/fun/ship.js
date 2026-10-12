const { sendStyled } = require('../../lib/menuLayout');

async function shipCommand(sock, chatId, msg, groupMetadata) {
    try {
        const participants = await sock.groupMetadata(chatId);
        const ps = (participants.participants || []).map(v => v.id);
        if (ps.length < 2) {
            await sendStyled(sock, chatId, msg, {
                title: 'SHIP',
                lines: ['Need at least two members in the group.']
            });
            return;
        }

        let firstUser = ps[Math.floor(Math.random() * ps.length)];
        let secondUser;
        do {
            secondUser = ps[Math.floor(Math.random() * ps.length)];
        } while (secondUser === firstUser);

        const formatMention = id => '@' + id.split('@')[0];
        await sendStyled(sock, chatId, msg, {
            title: 'SHIP',
            lines: [`${formatMention(firstUser)} x ${formatMention(secondUser)}`, 'Congratulations.']
        });
        await sock.sendMessage(chatId, {
            text: `${formatMention(firstUser)} ${formatMention(secondUser)}`,
            mentions: [firstUser, secondUser]
        }).catch(() => {});
    } catch (error) {
        console.error('Error in ship command:', error);
        await sendStyled(sock, chatId, msg, {
            title: 'SHIP',
            lines: ['Failed to ship. Make sure this is a group.']
        });
    }
}

module.exports = shipCommand;
