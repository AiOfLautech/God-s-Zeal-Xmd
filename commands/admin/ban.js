const fs = require('fs');
const isAdmin = require('../../lib/isAdmin');
const { isSudo } = require('../../lib/index');
const { sendStyled } = require('../../lib/menuLayout');

async function banCommand(sock, chatId, message) {
    // Restrict in groups to admins; in private to owner/sudo
    const isGroup = chatId.endsWith('@g.us');
    if (isGroup) {
        const senderId = message.key.participant || message.key.remoteJid;
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isBotAdmin) {
            await sendStyled(sock, chatId, message, { title: 'BAN', lines: ['Please make the bot an admin first.'] });
            return;
        }
        if (!isSenderAdmin && !message.key.fromMe) {
            await sendStyled(sock, chatId, message, { title: 'BAN', lines: ['Only group admins can use ban.'] });
            return;
        }
    } else {
        const senderId = message.key.participant || message.key.remoteJid;
        const senderIsSudo = await isSudo(senderId);
        if (!message.key.fromMe && !senderIsSudo) {
            await sendStyled(sock, chatId, message, { title: 'BAN', lines: ['Only owner/sudo can use ban in private chat.'] });
            return;
        }
    }
    let userToBan;
    
    // Check for mentioned users
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToBan = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToBan = message.message.extendedTextMessage.contextInfo.participant;
    }
    
    if (!userToBan) {
        await sendStyled(sock, chatId, message, {
            title: 'BAN',
            lines: ['Mention the user or reply to their message.']
        });
        return;
    }

    // Prevent banning the bot itself
    try {
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (userToBan === botId || userToBan === botId.replace('@s.whatsapp.net', '@lid')) {
            await sendStyled(sock, chatId, message, { title: 'BAN', lines: ['You cannot ban the bot account.'] });
            return;
        }
    } catch {}

    try {
        // Add user to banned list
        const bannedUsers = JSON.parse(fs.readFileSync('./data/banned.json'));
        if (!bannedUsers.includes(userToBan)) {
            bannedUsers.push(userToBan);
            fs.writeFileSync('./data/banned.json', JSON.stringify(bannedUsers, null, 2));
            
            await sendStyled(sock, chatId, message, {
                title: 'BAN',
                lines: [`Successfully banned @${userToBan.split('@')[0]}.`]
            });
            await sock.sendMessage(chatId, { text: `@${userToBan.split('@')[0]}`, mentions: [userToBan] }).catch(() => {});
        } else {
            await sendStyled(sock, chatId, message, {
                title: 'BAN',
                lines: [`@${userToBan.split('@')[0]} is already banned.`]
            });
        }
    } catch (error) {
        console.error('Error in ban command:', error);
        await sendStyled(sock, chatId, message, { title: 'BAN', lines: ['Failed to ban user.'] });
    }
}

module.exports = banCommand;


