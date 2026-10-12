const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const isOwnerOrSudo = require('../../lib/isOwner');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

async function setProfilePicture(sock, chatId, msg) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!msg.key.fromMe && !isOwner) {
            await sendStyled(sock, chatId, msg, {
                title: 'SETPP',
                lines: ['This command is only available for the owner.']
            });
            return;
        }

        const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMessage) {
            await sendStyled(sock, chatId, msg, {
                title: 'SETPP',
                lines: [`Reply to an image with ${getPrefix()}setpp.`]
            });
            return;
        }

        const imageMessage = quotedMessage.imageMessage || quotedMessage.stickerMessage;
        if (!imageMessage) {
            await sendStyled(sock, chatId, msg, {
                title: 'SETPP',
                lines: ['The replied message must contain an image.']
            });
            return;
        }

        // Create tmp directory if it doesn't exist
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // Download the image
        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const imagePath = path.join(tmpDir, `profile_${Date.now()}.jpg`);
        
        // Save the image
        fs.writeFileSync(imagePath, buffer);

        // Set the profile picture
        await sock.updateProfilePicture(sock.user.id, { url: imagePath });

        // Clean up the temporary file
        fs.unlinkSync(imagePath);

        await sendStyled(sock, chatId, msg, {
            title: 'SETPP',
            lines: ['Successfully updated bot profile picture.']
        });
    } catch (error) {
        console.error('Error in setpp command:', error);
        await sendStyled(sock, chatId, msg, {
            title: 'SETPP',
            lines: ['Failed to update profile picture.']
        });
    }
}

module.exports = setProfilePicture; 

