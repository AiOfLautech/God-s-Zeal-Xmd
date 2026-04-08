const axios = require('axios');
const settings = require('../../settings');
const { sleep } = require('../../lib/myfunc');

const PAIR_API_BASE = 'https://knight-bot-paircode.onrender.com';
const SUPPORT_GROUP_LINK = 'https://chat.whatsapp.com/GA4WrOFythU6g3BFVubYM7?mode=wwt';

function channelContext() {
    return {
        contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: settings.newsletterJid || '120363269950668068@newsletter',
                newsletterName: 'GODS ZEAL XMD',
                serverMessageId: -1
            }
        }
    };
}

async function pairCommand(sock, chatId, message, q) {
    try {
        if (!q) {
            return await sock.sendMessage(chatId, {
                text: 'Please provide valid WhatsApp number\nExample: .pair 234xxxxxxxxxx',
                ...channelContext()
            }, { quoted: message });
        }

        const numbers = q.split(',')
            .map((v) => v.replace(/[^0-9]/g, ''))
            .filter((v) => v.length > 5 && v.length < 20);

        if (!numbers.length) {
            return await sock.sendMessage(chatId, {
                text: 'Invalid number. Please use the correct format.',
                ...channelContext()
            }, { quoted: message });
        }

        for (const number of numbers) {
            const whatsappID = `${number}@s.whatsapp.net`;
            const result = await sock.onWhatsApp(whatsappID);

            if (!result?.[0]?.exists) {
                await sock.sendMessage(chatId, {
                    text: `That number is not registered on WhatsApp: ${number}`,
                    ...channelContext()
                }, { quoted: message });
                continue;
            }

            await sock.sendMessage(chatId, {
                text: `Generating pairing code for ${number}...`,
                ...channelContext()
            }, { quoted: message });

            try {
                const response = await axios.get(`${PAIR_API_BASE}/code`, {
                    params: { number },
                    timeout: 25000
                });

                const code = response?.data?.code;
                if (!code || code === 'Service Unavailable') {
                    throw new Error(code || 'Invalid response from server');
                }

                await sleep(1500);

                await sock.sendMessage(chatId, {
                    text: [
                        '✅ *Pairing Code Generated*',
                        '',
                        `📱 Number: ${number}`,
                        `🔐 Code: ${code}`,
                        '',
                        'Tap a button below to copy the code or open follow links.'
                    ].join('\n'),
                    buttons: [
                        { buttonId: `copy_pair:${code}`, buttonText: { displayText: '📋 Copy Code' }, type: 1 },
                        { buttonId: '.chfollow', buttonText: { displayText: '📢 Follow Channel' }, type: 1 },
                        { buttonId: 'support', buttonText: { displayText: '👥 Join Support Group' }, type: 1 }
                    ],
                    headerType: 1,
                    ...channelContext()
                }, { quoted: message });
            } catch (apiError) {
                console.error('Pair API error:', apiError.message);
                await sock.sendMessage(chatId, {
                    text: 'Failed to generate pairing code right now. Please try again later.',
                    ...channelContext()
                }, { quoted: message });
            }
        }

        await sock.sendMessage(chatId, {
            text: `For auto follow, use: .chfollow\nFor test channel reaction, use: .chreact ❤️`,
            ...channelContext()
        }, { quoted: message });
    } catch (error) {
        console.error('Pair command error:', error);
        await sock.sendMessage(chatId, {
            text: 'An error occurred while generating the pairing code.',
            ...channelContext()
        }, { quoted: message });
    }
}

module.exports = pairCommand;
