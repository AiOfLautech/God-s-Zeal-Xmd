const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const pino = require('pino');
const isAdmin = require('../lib/isAdmin');

/**
 * Adds members to a group. Supports:
 * 1. Replying to a VCF file with ".add all" or ".add 20"
 * 2. Pasting numbers directly with ".add +123456789 987654321"
 * 3. Handles numbers with or without '+' and international formats.
 */
async function addCommand(sock, chatId, message, args) {
    const from = chatId;
    const m = message;
    const isGroup = from.endsWith('@g.us');

    if (!isGroup) {
        return sock.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: m });
    }

    // Use the robust isAdmin check for both bot and sender
    const senderId = m.key.participant || m.key.remoteJid;
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, from, senderId);

    if (!isBotAdmin) {
        return sock.sendMessage(from, { text: "❌ Please make the bot an admin first." }, { quoted: m });
    }

    if (!isSenderAdmin && !m.key.fromMe) {
        return sock.sendMessage(from, { text: "❌ This command is only for group admins." }, { quoted: m });
    }

    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message?.documentMessage;
    let numbers = [];

    // Case 1: Numbers provided directly in arguments or pasted
    if (args.length > 0 && !args[0].toLowerCase().startsWith('all') && !/^\d+$/.test(args[0])) {
        args.forEach(arg => {
            let num = arg.replace(/[^\d]/g, '');
            if (num.length > 5) {
                if (!num.endsWith('@s.whatsapp.net')) num += '@s.whatsapp.net';
                numbers.push(num);
            }
        });
    } 
    // Case 2: Reply to a VCF file
    else if (quoted?.documentMessage?.mimetype === 'text/vcard' || quoted?.documentMessage?.fileName?.endsWith('.vcf') || m.message?.documentMessage?.mimetype === 'text/vcard') {
        await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });
        try {
            const msgToDownload = m.message?.extendedTextMessage?.contextInfo?.stanzaId 
                ? { key: { remoteJid: from, fromMe: false, id: m.message.extendedTextMessage.contextInfo.stanzaId }, message: quoted }
                : m;

            const buffer = await downloadMediaMessage(
                msgToDownload,
                'buffer',
                {},
                { logger: pino({ level: 'silent' }) }
            );

            const vcfContent = buffer.toString();
            const phoneRegex = /TEL(?:;[^:]*)?:(?:\+)?([\d\s\-()]+)/g;
            let extracted = [];
            let match;
            while ((match = phoneRegex.exec(vcfContent)) !== null) {
                let num = match[1].replace(/[^\d]/g, '');
                if (num.length > 5) {
                    if (!num.endsWith('@s.whatsapp.net')) num += '@s.whatsapp.net';
                    extracted.push(num);
                }
            }
            extracted = [...new Set(extracted)];

            const limitArg = args[0]?.toLowerCase();
            const limit = limitArg === 'all' ? extracted.length : (parseInt(limitArg) || extracted.length);
            numbers = extracted.slice(0, limit);
        } catch (e) {
            console.error("VCF Read Error:", e);
            return sock.sendMessage(from, { text: `❌ Error reading VCF: ${e.message}` }, { quoted: m });
        }
    }

    if (numbers.length === 0) {
        return sock.sendMessage(from, { text: "❌ No valid numbers found.\n\n*Usage:*\n1. `.add +2349985540084` (Direct paste)\n2. Reply to VCF with `.add all` or `.add 20`" }, { quoted: m });
    }

    // Get metadata once for participant check
    const metadata = await sock.groupMetadata(from);
    const existingParticipants = metadata.participants.map(p => p.id);
    numbers = numbers.filter(n => !existingParticipants.includes(n));

    if (numbers.length === 0) {
        return sock.sendMessage(from, { text: "❌ All provided numbers are already in the group." }, { quoted: m });
    }

    await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

    try {
        const response = await sock.groupParticipantsUpdate(from, numbers, "add");
        let added = 0, invited = 0, failed = 0;

        if (Array.isArray(response)) {
            for (const res of response) {
                if (res.status === "200") added++;
                else if (res.status === "403") invited++;
                else failed++;
            }
        }

        const msg = `*「 ADD MEMBERS 」*\n\n` +
            `• *Total Processed:* ${numbers.length}\n` +
            `• *Added Successfully:* ${added}\n` +
            `• *Invites Sent:* ${invited}\n` +
            `• *Failed/Blocked:* ${failed}\n\n` +
            `_Note: Privacy settings may prevent direct adding for some users._`;

        await sock.sendMessage(from, { text: msg }, { quoted: m });
        await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) {
        console.error("Add Command Error:", e);
        sock.sendMessage(from, { text: `❌ Error adding members: ${e.message}` }, { quoted: m });
    }
}

module.exports = addCommand;
