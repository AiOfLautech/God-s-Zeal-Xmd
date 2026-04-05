const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../../lib/isOwner');

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
            await sock.sendMessage(chatId, { text: 'Only bot owner can use this command.' }, { quoted: message });
            return;
        }

        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            '';
        const currentPrefix = require('../../settings').commandPrefix || '.';
        const normalizedText = rawText.startsWith(currentPrefix)
            ? `.${rawText.slice(currentPrefix.length)}`
            : rawText;
        const args = normalizedText.split(/\s+/).slice(1);
        const settingsPath = path.join(process.cwd(), 'settings.js');

        if (normalizedText.startsWith('.setprefix') || normalizedText.startsWith('.prefix')) {
            const nextPrefix = (args[0] || '').trim();
            if (!nextPrefix || nextPrefix.length !== 1) {
                await sock.sendMessage(chatId, {
                    text: 'Use .setprefix <single-character>\nExample: .setprefix !'
                }, { quoted: message });
                return;
            }

            let settingsText = fs.readFileSync(settingsPath, 'utf8');
            if (/commandPrefix:\s*'[^']*'/.test(settingsText)) {
                settingsText = settingsText.replace(/commandPrefix:\s*'[^']*'/, `commandPrefix: '${nextPrefix}'`);
            } else {
                settingsText = settingsText.replace(/ownerNumbers:\s*\[[^\]]*\],/, (match) => `${match}\n  commandPrefix: '${nextPrefix}',`);
            }
            fs.writeFileSync(settingsPath, settingsText);
            delete require.cache[require.resolve('../../settings')];

            await sock.sendMessage(chatId, {
                text: [
                    '┌ ❏ *⌜ PREFIX UPDATED ⌟* ❏',
                    '│',
                    `├◆ New Prefix: ${nextPrefix}`,
                    '└ ❏'
                ].join('\n')
            }, { quoted: message });
            return;
        }

        const isGroup = chatId.endsWith('@g.us');
        const dataDir = './data';
        const currentSettings = require('../../settings');

        const mode = readJsonSafe(`${dataDir}/messageCount.json`, { isPublic: true });
        const autoStatus = readJsonSafe(`${dataDir}/autoStatus.json`, { enabled: false });
        const autoread = readJsonSafe(`${dataDir}/autoread.json`, { enabled: false });
        const autotyping = readJsonSafe(`${dataDir}/autotyping.json`, { enabled: false });
        const pmblocker = readJsonSafe(`${dataDir}/pmblocker.json`, { enabled: false });
        const anticall = readJsonSafe(`${dataDir}/anticall.json`, { enabled: false });
        const userGroupData = readJsonSafe(`${dataDir}/userGroupData.json`, {
            antilink: {}, antibadword: {}, welcome: {}, goodbye: {}, chatbot: {}, antitag: {}
        });
        const autoReaction = Boolean(userGroupData.autoReaction);

        const groupId = isGroup ? chatId : null;
        const antilinkOn = groupId ? Boolean(userGroupData.antilink?.[groupId]) : false;
        const antibadwordOn = groupId ? Boolean(userGroupData.antibadword?.[groupId]) : false;
        const welcomeOn = groupId ? Boolean(userGroupData.welcome?.[groupId]) : false;
        const goodbyeOn = groupId ? Boolean(userGroupData.goodbye?.[groupId]) : false;
        const chatbotOn = groupId ? Boolean(userGroupData.chatbot?.[groupId]) : false;
        const antitagCfg = groupId ? userGroupData.antitag?.[groupId] : null;

        const lines = [
            '┌ ❏ *⌜ BOT SETTINGS ⌟* ❏',
            '│',
            `├◆ Prefix: ${currentSettings.commandPrefix || '.'}`,
            `├◆ Mode: ${mode.isPublic ? 'Public' : 'Private'}`,
            `├◆ Auto Status: ${autoStatus.enabled ? 'ON' : 'OFF'}`,
            `├◆ Autoread: ${autoread.enabled ? 'ON' : 'OFF'}`,
            `├◆ Autotyping: ${autotyping.enabled ? 'ON' : 'OFF'}`,
            `├◆ PM Blocker: ${pmblocker.enabled ? 'ON' : 'OFF'}`,
            `├◆ Anticall: ${anticall.enabled ? 'ON' : 'OFF'}`,
            `├◆ Auto Reaction: ${autoReaction ? 'ON' : 'OFF'}`
        ];

        if (groupId) {
            lines.push(`├◆ Group: ${groupId}`);
            lines.push(`├◆ Antilink: ${antilinkOn ? `ON (${userGroupData.antilink[groupId].action || 'delete'})` : 'OFF'}`);
            lines.push(`├◆ Antibadword: ${antibadwordOn ? `ON (${userGroupData.antibadword[groupId].action || 'delete'})` : 'OFF'}`);
            lines.push(`├◆ Welcome: ${welcomeOn ? 'ON' : 'OFF'}`);
            lines.push(`├◆ Goodbye: ${goodbyeOn ? 'ON' : 'OFF'}`);
            lines.push(`├◆ Chatbot: ${chatbotOn ? 'ON' : 'OFF'}`);
            lines.push(`├◆ Antitag: ${antitagCfg?.enabled ? `ON (${antitagCfg.action || 'delete'})` : 'OFF'}`);
        } else {
            lines.push('├◆ Use inside a group to see per-group settings');
        }

        lines.push('└ ❏');

        await sock.sendMessage(chatId, { text: lines.join('\n') }, { quoted: message });
    } catch (error) {
        console.error('Error in settings command:', error);
        await sock.sendMessage(chatId, { text: 'Failed to read settings.' }, { quoted: message });
    }
}

module.exports = settingsCommand;
