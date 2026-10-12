const { getConfig, getPrefix } = require('../../lib/botConfig');
const { pairAndStart, listSessions, normalizePhone } = require('../../lib/sessionManager');
const { storeLinkedUser } = require('../../lib/mongoStore');
const { sendStyled } = require('../../lib/menuLayout');
const isOwnerOrSudo = require('../../lib/isOwner');

function canUsePair(senderId, fromMe) {
    const cfg = getConfig();
    if (fromMe) return true;
    const access = String(cfg.pairAccess || 'public').toLowerCase();
    return access === 'public';
}

async function pairCommand(sock, chatId, message, q) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const owner = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);
        if (!canUsePair(senderId, owner)) {
            await sendStyled(sock, chatId, message, {
                title: 'PAIR',
                lines: ['Pairing is restricted.', 'Set pairAccess to public in bot.json.']
            });
            return;
        }

        const prefix = getPrefix();
        const cfg = getConfig();
        if (!q) {
            await sendStyled(sock, chatId, message, {
                title: 'PAIR SESSION',
                lines: [
                    `Usage ☇ ${prefix}pair 234xxxxxxxxxx`,
                    'Enter the full number without + or spaces.',
                    'A successful pair starts an isolated session immediately.'
                ]
            });
            return;
        }

        const numbers = String(q).split(',')
            .map((v) => normalizePhone(v))
            .filter((v) => v.length > 5 && v.length < 20);

        if (!numbers.length) {
            await sendStyled(sock, chatId, message, {
                title: 'PAIR SESSION',
                lines: [`Invalid number. Example: ${prefix}pair 234xxxxxxxxxx`]
            });
            return;
        }

        for (const number of numbers) {
            const whatsappID = `${number}@s.whatsapp.net`;
            try {
                const result = await sock.onWhatsApp(whatsappID);
                if (!result?.[0]?.exists) {
                    await sendStyled(sock, chatId, message, {
                        title: 'PAIR SESSION',
                        lines: [`${number} is not registered on WhatsApp.`]
                    });
                    continue;
                }
            } catch {}

            await sendStyled(sock, chatId, message, {
                title: 'PAIR SESSION',
                lines: [`Starting isolated session for ${number}...`]
            });

            try {
                const paired = await pairAndStart(number, {
                    requestedBy: senderId,
                    chatId
                });

                await storeLinkedUser({
                    phone: number,
                    jid: whatsappID,
                    source: 'pair_command',
                    requestedBy: senderId,
                    chatId,
                    sessionId: paired.sessionId || paired.session?.id,
                    requestedAt: new Date().toISOString()
                }).catch(() => {});

                if (paired.alreadyConnected) {
                    await sendStyled(sock, chatId, message, {
                        title: 'PAIR SESSION',
                        lines: [
                            `${number} is already connected.`,
                            `Session ☇ ${paired.session.id}`
                        ]
                    });
                    continue;
                }

                if (paired.alreadyRegistered) {
                    await sendStyled(sock, chatId, message, {
                        title: cfg.botName,
                        lines: [
                            'Session started',
                            `Number ☇ ${number}`,
                            `Session ☇ ${paired.sessionId}`,
                            'Commands work immediately on that isolated session.'
                        ]
                    });
                    continue;
                }

                await sendStyled(sock, chatId, message, {
                    title: 'PAIRING CODE READY',
                    lines: [
                        `Number ☇ ${number}`,
                        `Code ☇ ${paired.code}`,
                        `Session ☇ ${paired.sessionId}`,
                        'WhatsApp > Linked Devices > Link with phone number',
                        'The session starts immediately after a successful pair.',
                        'This session is isolated from other numbers.'
                    ],
                    buttons: [
                        { buttonId: `copy_pair:${paired.code}`, buttonText: { displayText: 'copy code' }, type: 1 },
                        { buttonId: `${prefix}menu`, buttonText: { displayText: 'menu' }, type: 1 },
                        { buttonId: `${prefix}owner`, buttonText: { displayText: 'owner' }, type: 1 }
                    ]
                });
            } catch (apiError) {
                console.error('Pair session error:', apiError.message);
                await sendStyled(sock, chatId, message, {
                    title: 'PAIR FAILED',
                    lines: [`${number}`, String(apiError.message || 'Could not start pairing')]
                });
            }
        }
    } catch (error) {
        console.error('Pair command error:', error);
        await sendStyled(sock, chatId, message, {
            title: 'PAIR FAILED',
            lines: ['An error occurred while starting the pairing session.']
        });
    }
}

async function sessionsCommand(sock, chatId, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    const owner = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);
    if (!owner) {
        await sendStyled(sock, chatId, message, {
            title: 'SESSIONS',
            lines: ['Only the owner can list sessions.']
        });
        return;
    }
    const rows = listSessions();
    if (!rows.length) {
        await sendStyled(sock, chatId, message, {
            title: 'ACTIVE SESSIONS',
            lines: ['No extra sessions yet.', 'Use pair <number> to add one.']
        });
        return;
    }
    await sendStyled(sock, chatId, message, {
        title: 'ACTIVE SESSIONS',
        lines: rows.map((row) => `${row.phone || row.id} ☇ ${row.status}`)
    });
}

module.exports = pairCommand;
module.exports.sessionsCommand = sessionsCommand;
