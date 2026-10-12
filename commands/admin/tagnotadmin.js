const isAdmin = require('../../lib/isAdmin');
const { sendStyled } = require('../../lib/menuLayout');

async function tagNotAdminCommand(sock, chatId, senderId, message) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isBotAdmin) {
            await sendStyled(sock, chatId, message, {
                title: 'TAGNOTADMIN',
                lines: ['Please make the bot an admin first.']
            });
            return;
        }
        if (!isSenderAdmin) {
            await sendStyled(sock, chatId, message, {
                title: 'TAGNOTADMIN',
                lines: ['Only admins can use the tagnotadmin command.']
            });
            return;
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        const nonAdmins = participants.filter(p => !p.admin).map(p => p.id);
        if (nonAdmins.length === 0) {
            await sendStyled(sock, chatId, message, {
                title: 'TAGNOTADMIN',
                lines: ['No non-admin members to tag.']
            });
            return;
        }

        await sendStyled(sock, chatId, message, {
            title: 'TAGNOTADMIN',
            lines: [`Members ☇ ${nonAdmins.length}`]
        });
        await sock.sendMessage(chatId, {
            text: nonAdmins.map(jid => `@${jid.split('@')[0]}`).join('\n'),
            mentions: nonAdmins
        }, { quoted: message });
    } catch (error) {
        console.error('Error in tagnotadmin command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'TAGNOTADMIN',
            lines: ['Failed to tag non-admin members.']
        });
    }
}

module.exports = tagNotAdminCommand;
