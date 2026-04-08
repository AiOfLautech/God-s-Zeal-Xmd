const axios = require('axios');
const settings = require('../../settings');
const { sleep } = require('../../lib/myfunc');
const { storeLinkedUser } = require('../../lib/mongoStore');

function normalizeHost(value) {
    if (!value) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/$/, '');
    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmed)) return `https://${trimmed}`;
    return null;
}

function getDynamicPairHosts() {
    const hosts = [
        process.env.PAIR_API_BASE,
        settings.pairApiBase,
        process.env.DEPLOYMENT_HOST,
        process.env.RENDER_EXTERNAL_URL,
        process.env.RAILWAY_STATIC_URL,
        process.env.RAILWAY_PUBLIC_DOMAIN,
        process.env.KOYEB_PUBLIC_DOMAIN,
        process.env.CYCLIC_URL,
        process.env.URL,
        process.env.VERCEL_URL
    ];

    if (process.env.REPLIT_DOMAINS) {
        hosts.push(...String(process.env.REPLIT_DOMAINS).split(','));
    }

    hosts.push('https://knight-bot-paircode.onrender.com');

    const normalized = hosts
        .map(normalizeHost)
        .filter(Boolean);

    return [...new Set(normalized)];
}

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

async function requestCode(number) {
    const pairHosts = getDynamicPairHosts();
    for (const base of pairHosts) {
        try {
            const response = await axios.get(`${base.replace(/\/$/, '')}/code`, {
                params: { number },
                timeout: 25000
            });
            const code = response?.data?.code;
            if (code && code !== 'Service Unavailable') return code;
        } catch {
            // continue with next host
        }
    }
    throw new Error('All pairing hosts failed');
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
                const code = await requestCode(number);

                await sleep(1200);
                await storeLinkedUser({
                    phone: number,
                    jid: whatsappID,
                    source: 'pair_command',
                    requestedBy: message.key.participant || message.key.remoteJid,
                    chatId,
                    requestedAt: new Date().toISOString()
                });

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
                        { buttonId: '.chfollow 1 https://whatsapp.com/channel/0029VaXKAEoKmCPS6Jz7sw0N', buttonText: { displayText: '📢 Follow Channel' }, type: 1 },
                        { buttonId: 'support', buttonText: { displayText: '👥 Join Support Group' }, type: 1 }
                    ],
                    headerType: 1,
                    ...channelContext()
                }, { quoted: message });
            } catch (apiError) {
                console.error('Pair API error:', apiError.message);
                await sock.sendMessage(chatId, {
                    text: 'Failed to generate pairing code. Pair host is unreachable right now; try again shortly.',
                    ...channelContext()
                }, { quoted: message });
            }
        }
    } catch (error) {
        console.error('Pair command error:', error);
        await sock.sendMessage(chatId, {
            text: 'An error occurred while generating the pairing code.',
            ...channelContext()
        }, { quoted: message });
    }
}

module.exports = pairCommand;
