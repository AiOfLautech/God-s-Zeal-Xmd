const fs = require('fs');
const isOwnerOrSudo = require('../../lib/isOwner');
const { getConfig, getPrefix, getMenuStyle } = require('../../lib/botConfig');
const { sendStyled } = require('../../lib/menuLayout');

function readJsonSafe(filePath, fallback) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return fallback;
    }
}

async function settingsCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

        if (!message.key.fromMe && !isOwner) {
            await sendStyled(sock, chatId, message, {
                title: 'SETTINGS',
                lines: ['Only bot owner can use this command.']
            });
            return;
        }

        const cfg = getConfig();
        const isGroup = chatId.endsWith('@g.us');
        const dataDir = './data';
        const prefix = getPrefix();

        const mode = readJsonSafe(`${dataDir}/messageCount.json`, { isPublic: true });
        const autoStatus = readJsonSafe(`${dataDir}/autoStatus.json`, { enabled: false });
        const autoread = readJsonSafe(`${dataDir}/autoread.json`, { enabled: false });
        const autotyping = readJsonSafe(`${dataDir}/autotyping.json`, { enabled: false });
        const pmblocker = readJsonSafe(`${dataDir}/pmblocker.json`, { enabled: false });
        const anticall = readJsonSafe(`${dataDir}/anticall.json`, { enabled: false });
        const userGroupData = readJsonSafe(`${dataDir}/userGroupData.json`, {
            antilink: {}, antibadword: {}, welcome: {}, goodbye: {}, chatbot: {}, antitag: {}
        });

        const groupId = isGroup ? chatId : null;
        const lines = [
            `Name ☇ *${cfg.botName}*`,
            `Creator ☇ *${cfg.creator}*`,
            `Creator No ☇ *${cfg.creatorNumber}*`,
            `Prefix ☇ *${prefix}*`,
            `Menu ☇ *${getMenuStyle()}*`,
            `Newsletter ☇ *${cfg.newsletterName}*`,
            `Mode ☇ *${mode.isPublic ? 'Public' : 'Private'}*`,
            `Auto Status ☇ *${autoStatus.enabled ? 'ON' : 'OFF'}*`,
            `Autoread ☇ *${autoread.enabled ? 'ON' : 'OFF'}*`,
            `Autotyping ☇ *${autotyping.enabled ? 'ON' : 'OFF'}*`,
            `PM Blocker ☇ *${pmblocker.enabled ? 'ON' : 'OFF'}*`,
            `Anticall ☇ *${anticall.enabled ? 'ON' : 'OFF'}*`,
            `Auto Reaction ☇ *${userGroupData.autoReaction ? 'ON' : 'OFF'}*`,
            'Config file ☇ *bot.json*'
        ];

        if (groupId) {
            lines.push(`Antilink ☇ *${userGroupData.antilink?.[groupId] ? 'ON' : 'OFF'}*`);
            lines.push(`Welcome ☇ *${userGroupData.welcome?.[groupId] ? 'ON' : 'OFF'}*`);
            lines.push(`Goodbye ☇ *${userGroupData.goodbye?.[groupId] ? 'ON' : 'OFF'}*`);
            lines.push(`Chatbot ☇ *${userGroupData.chatbot?.[groupId] ? 'ON' : 'OFF'}*`);
        } else {
            lines.push('Use inside a group to see per-group settings');
        }

        await sendStyled(sock, chatId, message, {
            title: `${cfg.botName} SETTINGS`,
            lines
        });
    } catch (error) {
        console.error('Error in settings command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'SETTINGS',
            lines: ['Failed to read settings.']
        });
    }
}

module.exports = settingsCommand;
