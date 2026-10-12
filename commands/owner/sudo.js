const settings = require('../../settings');
const { addSudo, removeSudo, getSudoList } = require('../../lib/index');
const isOwnerOrSudo = require('../../lib/isOwner');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix, getConfig } = require('../../lib/botConfig');

function extractMentionedJid(message) {
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length > 0) return mentioned[0];
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const match = text.match(/\b(\d{7,15})\b/);
    if (match) return match[1] + '@s.whatsapp.net';
    return null;
}

async function sudoCommand(sock, chatId, message) {
    const senderJid = message.key.participant || message.key.remoteJid;
    const isOwner = message.key.fromMe || await isOwnerOrSudo(senderJid, sock, chatId);
    const prefix = getPrefix();
    const rawText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const args = rawText.trim().split(' ').slice(1);
    const sub = (args[0] || '').toLowerCase();

    if (!sub || !['add', 'del', 'remove', 'list'].includes(sub)) {
        await sendStyled(sock, chatId, message, {
            title: 'SUDO',
            lines: [
                `${prefix}sudo add <@user|number>`,
                `${prefix}sudo del <@user|number>`,
                `${prefix}sudo list`
            ]
        });
        return;
    }

    if (sub === 'list') {
        const list = await getSudoList();
        if (list.length === 0) {
            await sendStyled(sock, chatId, message, { title: 'SUDO', lines: ['No sudo users set.'] });
            return;
        }
        await sendStyled(sock, chatId, message, {
            title: 'SUDO',
            lines: list.map((j, i) => `${i + 1}. ${j}`)
        });
        return;
    }

    if (!isOwner) {
        await sendStyled(sock, chatId, message, {
            title: 'SUDO',
            lines: ['Only owner can add or remove sudo users.']
        });
        return;
    }

    const targetJid = extractMentionedJid(message);
    if (!targetJid) {
        await sendStyled(sock, chatId, message, {
            title: 'SUDO',
            lines: ['Mention a user or provide a number.']
        });
        return;
    }

    if (sub === 'add') {
        const ok = await addSudo(targetJid);
        await sendStyled(sock, chatId, message, {
            title: 'SUDO',
            lines: [ok ? `Added sudo: ${targetJid}` : 'Failed to add sudo']
        });
        return;
    }

    if (sub === 'del' || sub === 'remove') {
        const cfg = getConfig();
        const ownerJid = (cfg.ownerNumber || settings.ownerNumber) + '@s.whatsapp.net';
        if (targetJid === ownerJid) {
            await sendStyled(sock, chatId, message, { title: 'SUDO', lines: ['Owner cannot be removed.'] });
            return;
        }
        const ok = await removeSudo(targetJid);
        await sendStyled(sock, chatId, message, {
            title: 'SUDO',
            lines: [ok ? `Removed sudo: ${targetJid}` : 'Failed to remove sudo']
        });
    }
}

module.exports = sudoCommand;
