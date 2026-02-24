const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const pino = require('pino');

/**
 * Creates a WhatsApp group and adds members from a VCF file.
 * Handles potential 400 Bad Request errors by adding participants separately.
 */
async function creategc(sock, chatId, message, args) {
    const from = chatId;
    const m = message;
    const groupName = args.join(" ") || "New Bot Group";

    // Detect quoted or direct document
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
    const doc = quoted.documentMessage;

    // Validation
    if (!doc || (doc.mimetype !== 'text/vcard' && !doc.fileName?.endsWith('.vcf'))) {
        return sock.sendMessage(from, { 
            text: "❌ *Usage:* Reply to a VCF (contacts) file with `.creategc Group Name` to create a group and add all contacts." 
        }, { quoted: m });
    }

    await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

    try {
        // 1. Download VCF with proper message context
        // Baileys requires the full message object for downloadMediaMessage
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
        
        // 2. Extract numbers using robust regex
        const phoneRegex = /TEL(?:;[^:]*)?:(?:\+)?([\d\s\-()]+)/g;
        let numbers = [];
        let match;
        while ((match = phoneRegex.exec(vcfContent)) !== null) {
            let num = match[1].replace(/[\s\-()]/g, '');
            if (num.length > 5) {
                // Ensure proper WhatsApp JID format
                let cleanNum = num.startsWith('+') ? num.slice(1) : num;
                if (!cleanNum.endsWith('@s.whatsapp.net')) {
                    cleanNum = cleanNum + '@s.whatsapp.net';
                }
                numbers.push(cleanNum);
            }
        }

        // Unique numbers only
        numbers = [...new Set(numbers)];

        if (numbers.length === 0) {
            return sock.sendMessage(from, { text: "❌ No valid phone numbers found in the VCF file." }, { quoted: m });
        }

        // 3. Create Group
        // CRITICAL FIX for 400 Bad Request: 
        // We create the group with ONLY the bot as the initial participant.
        // Adding external numbers during creation is often rejected if any number is invalid.
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        console.log(`[creategc] Creating group "${groupName}" for ${from}`);
        
        // Create the group with just the bot
        const group = await sock.groupCreate(groupName, [botId]);
        const groupId = group.id;

        // 4. Get Invite Link immediately
        const inviteCode = await sock.groupInviteCode(groupId);
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        // 5. Add Members incrementally
        // Now that the group exists, we add the members from the VCF.
        // We use a try-catch for the update to ensure the user gets the link even if adding fails.
        let addedCount = 0;
        let inviteSentCount = 0;
        try {
            const response = await sock.groupParticipantsUpdate(groupId, numbers, "add");
            if (Array.isArray(response)) {
                for (const res of response) {
                    if (res.status === "200") addedCount++;
                    else if (res.status === "403") inviteSentCount++;
                }
            }
        } catch (addError) {
            console.error("[CREATEGC ADD ERROR]", addError);
        }

        const successMsg = `*「 GROUP CREATED 」*\n\n` +
            `• *Name:* ${groupName}\n` +
            `• *Numbers Extracted:* ${numbers.length}\n` +
            `• *Successfully Added:* ${addedCount}\n` +
            `• *Invites Sent:* ${inviteSentCount}\n\n` +
            `*Link:* ${inviteLink}`;

        await sock.sendMessage(from, { text: successMsg }, { quoted: m });
        await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("[CREATEGC ERROR]", e);
        let userError = e.message;
        if (e.data === 400) {
            userError = "WhatsApp rejected the request (400). This usually happens if the group name is too long, contains invalid characters, or your account has hit a creation limit.";
        }
        sock.sendMessage(from, { text: `❌ *Error:* ${userError}` }, { quoted: m });
        await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
}

module.exports = creategc;
