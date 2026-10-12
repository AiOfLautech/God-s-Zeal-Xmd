const { sendStyled } = require('../../lib/menuLayout');

async function staffCommand(sock, chatId, msg) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        let pp;
        try {
            pp = await sock.profilePictureUrl(chatId, 'image');
        } catch {
            pp = 'https://i.imgur.com/2wzGhpF.jpeg';
        }

        const participants = groupMetadata.participants || [];
        const groupAdmins = participants.filter(p => p.admin);
        const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`);
        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';

        await sendStyled(sock, chatId, msg, {
            title: 'GROUP ADMINS',
            lines: [`Group ☇ ${groupMetadata.subject}`, ...listAdmin]
        });
        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: groupMetadata.subject,
            mentions: [...groupAdmins.map(v => v.id), owner]
        }).catch(() => {});
    } catch (error) {
        console.error('Error in staff command:', error);
        await sendStyled(sock, chatId, msg, {
            title: 'STAFF',
            lines: ['Failed to get admin list.']
        });
    }
}

module.exports = staffCommand;
