const isOwnerOrSudo = require('../../lib/isOwner');
const { getConfig, getPrefix } = require('../../lib/botConfig');
const { sendMenu, commandCatalog } = require('../../lib/menuLayout');

async function helpCommand(sock, chatId, message) {
    const cfg = getConfig();
    const prefix = getPrefix();
    const senderId = message.key.participant || message.key.remoteJid;
    const isPremium = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);
    const userName = message.pushName || String(senderId).split('@')[0];
    await sendMenu(sock, chatId, message, {
        userName,
        plan: isPremium ? 'Premium' : 'Free',
        groups: commandCatalog(prefix)
    });
}

module.exports = helpCommand;
