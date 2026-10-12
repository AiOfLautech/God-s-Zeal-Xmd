const axios = require('axios');
const { sendStyled } = require('../../lib/menuLayout');

async function wastedCommand(sock, chatId, message) {
    let userToWaste;

    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToWaste = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToWaste = message.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToWaste) {
        await sendStyled(sock, chatId, message, {
            title: 'WASTED',
            lines: ['Mention someone or reply to their message.']
        });
        return;
    }

    try {
        let profilePic;
        try {
            profilePic = await sock.profilePictureUrl(userToWaste, 'image');
        } catch {
            profilePic = 'https://i.imgur.com/2wzGhpF.jpeg';
        }

        const wastedResponse = await axios.get(
            `https://some-random-api.com/canvas/overlay/wasted?avatar=${encodeURIComponent(profilePic)}`,
            { responseType: 'arraybuffer' }
        );

        await sock.sendMessage(chatId, {
            image: Buffer.from(wastedResponse.data),
            caption: `Wasted : ${userToWaste.split('@')[0]}\nRest in pieces!`,
            mentions: [userToWaste]
        });

    } catch (error) {
        console.error('Error in wasted command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'WASTED',
            lines: ['Failed to create wasted image. Try again later.']
        });
    }
}

module.exports = wastedCommand;
