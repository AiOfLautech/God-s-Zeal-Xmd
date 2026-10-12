const fs = require('fs');
const isAdmin = require('../../lib/isAdmin');
const { isSudo } = require('../../lib/index');
const { sendStyled } = require('../../lib/menuLayout');

async function unbanCommand(sock, chatId, message) {
    const isGroup = chatId.endsWith('@g.us');
    if (isGroup) {
        const senderId = message.key.participant || message.key.remoteJid;
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isBotAdmin) {
            await sendStyled(sock, chatId, message, { title: 'UNBAN', lines: ['Please make the bot an admin first.'] });
            return;
        }
        if (!isSenderAdmin && !message.key.fromMe) {
            await sendStyled(sock, chatId, message, { title: 'UNBAN', lines: ['Only group admins can use unban.'] });
            return;
        }
    } else {
        const senderId = message.key.participant || message.key.remoteJid;
        const senderIsSudo = await isSudo(senderId);
        if (!message.key.fromMe && !senderIsSudo) {
            await sendStyled(sock, chatId, message, { title: 'UNBAN', lines: ['Only owner/sudo can use unban in private chat.'] });
            return;
        }
    }

    let userToUnban;
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToUnban = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToUnban = message.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToUnban) {
        await sendStyled(sock, chatId, message, {
            title: 'UNBAN',
            lines: ['Mention the user or reply to their message.']
        });
        return;
    }

    try {
        const bannedUsers = JSON.parse(fs.readFileSync('./data/banned.json'));
        const index = bannedUsers.indexOf(userToUnban);
        if (index > -1) {
            bannedUsers.splice(index, 1);
            fs.writeFileSync('./data/banned.json', JSON.stringify(bannedUsers, null, 2));
            await sendStyled(sock, chatId, message, {
                title: 'UNBAN',
                lines: [`Successfully unbanned @${userToUnban.split('@')[0]}.`]
            });
            await sock.sendMessage(chatId, { text: `@${userToUnban.split('@')[0]}`, mentions: [userToUnban] }).catch(() => {});
        } else {
            await sendStyled(sock, chatId, message, {
                title: 'UNBAN',
                lines: [`@${userToUnban.split('@')[0]} is not banned.`]
            });
        }
    } catch (error) {
        console.error('Error in unban command:', error);
        await sendStyled(sock, chatId, message, { title: 'UNBAN', lines: ['Failed to unban user.'] });
    }
}

module.exports = unbanCommand;
