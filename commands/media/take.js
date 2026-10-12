const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const webp = require('node-webpmux');
const crypto = require('crypto');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix, getConfig } = require('../../lib/botConfig');

async function takeCommand(sock, chatId, message, args) {
    try {
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMessage?.stickerMessage) {
            await sendStyled(sock, chatId, message, {
                title: 'TAKE',
                lines: [`Reply to a sticker with ${getPrefix()}take <packname>`]
            });
            return;
        }

        const packname = args.join(' ') || getConfig().packname || getConfig().botName;

        try {
            const stickerBuffer = await downloadMediaMessage(
                {
                    key: message.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMessage,
                    messageType: 'stickerMessage'
                },
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            if (!stickerBuffer) {
                await sendStyled(sock, chatId, message, {
                    title: 'TAKE',
                    lines: ['Failed to download sticker.']
                });
                return;
            }

            const img = new webp.Image();
            await img.load(stickerBuffer);

            const json = {
                'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                'sticker-pack-name': packname,
                'emojis': ['🤖']
            };

            const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
            const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
            const exif = Buffer.concat([exifAttr, jsonBuffer]);
            exif.writeUIntLE(jsonBuffer.length, 14, 4);

            img.exif = exif;
            const finalBuffer = await img.save(null);

            await sock.sendMessage(chatId, {
                sticker: finalBuffer
            }, {
                quoted: message
            });

        } catch (error) {
            console.error('Sticker processing error:', error);
            await sendStyled(sock, chatId, message, {
                title: 'TAKE',
                lines: ['Error processing sticker.']
            });
        }

    } catch (error) {
        console.error('Error in take command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'TAKE',
            lines: ['Error processing command.']
        });
    }
}

module.exports = takeCommand;
