const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

async function ensureGroupAndAdmin(sock, chatId, senderId, message) {
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) {
        await sendStyled(sock, chatId, message, {
            title: 'GROUP',
            lines: ['This command can only be used in groups.']
        });
        return { ok: false };
    }
    const isAdmin = require('../../lib/isAdmin');
    const adminStatus = await isAdmin(sock, chatId, senderId);
    if (!adminStatus.isBotAdmin) {
        await sendStyled(sock, chatId, message, {
            title: 'GROUP',
            lines: ['Please make the bot an admin first.']
        });
        return { ok: false };
    }
    if (!adminStatus.isSenderAdmin) {
        await sendStyled(sock, chatId, message, {
            title: 'GROUP',
            lines: ['Only group admins can use this command.']
        });
        return { ok: false };
    }
    return { ok: true };
}

async function setGroupDescription(sock, chatId, senderId, text, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId, message);
    if (!check.ok) return;
    const desc = (text || '').trim();
    if (!desc) {
        await sendStyled(sock, chatId, message, {
            title: 'SETGDESC',
            lines: [`Usage ☇ ${getPrefix()}setgdesc <description>`]
        });
        return;
    }
    try {
        await sock.groupUpdateDescription(chatId, desc);
        await sendStyled(sock, chatId, message, {
            title: 'SETGDESC',
            lines: ['Group description updated.']
        });
    } catch {
        await sendStyled(sock, chatId, message, {
            title: 'SETGDESC',
            lines: ['Failed to update group description.']
        });
    }
}

async function setGroupName(sock, chatId, senderId, text, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId, message);
    if (!check.ok) return;
    const name = (text || '').trim();
    if (!name) {
        await sendStyled(sock, chatId, message, {
            title: 'SETGNAME',
            lines: [`Usage ☇ ${getPrefix()}setgname <new name>`]
        });
        return;
    }
    try {
        await sock.groupUpdateSubject(chatId, name);
        await sendStyled(sock, chatId, message, {
            title: 'SETGNAME',
            lines: ['Group name updated.']
        });
    } catch {
        await sendStyled(sock, chatId, message, {
            title: 'SETGNAME',
            lines: ['Failed to update group name.']
        });
    }
}

async function setGroupPhoto(sock, chatId, senderId, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId, message);
    if (!check.ok) return;

    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMessage = quoted?.imageMessage || quoted?.stickerMessage;
    if (!imageMessage) {
        await sendStyled(sock, chatId, message, {
            title: 'SETGPP',
            lines: [`Reply to an image/sticker with ${getPrefix()}setgpp`]
        });
        return;
    }
    try {
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        const imgPath = path.join(tmpDir, `gpp_${Date.now()}.jpg`);
        fs.writeFileSync(imgPath, buffer);
        await sock.updateProfilePicture(chatId, { url: imgPath });
        try { fs.unlinkSync(imgPath); } catch {}
        await sendStyled(sock, chatId, message, {
            title: 'SETGPP',
            lines: ['Group profile photo updated.']
        });
    } catch {
        await sendStyled(sock, chatId, message, {
            title: 'SETGPP',
            lines: ['Failed to update group profile photo.']
        });
    }
}

module.exports = {
    setGroupDescription,
    setGroupName,
    setGroupPhoto
};
