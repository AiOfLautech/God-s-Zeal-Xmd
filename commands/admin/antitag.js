const { setAntitag, getAntitag, removeAntitag } = require('../../lib/index');
const isAdmin = require('../../lib/isAdmin');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

async function handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            await sendStyled(sock, chatId, message, {
                title: 'ANTITAG',
                lines: ['For group admins only.']
            });
            return;
        }

        const prefix = getPrefix();
        const args = userMessage.replace(/^[.\/\\!~#$%\-]+\S+\s*/, '').toLowerCase().trim().split(' ');
        const action = args[0];

        if (!action) {
            await sendStyled(sock, chatId, message, {
                title: 'ANTITAG',
                lines: [
                    `${prefix}antitag on`,
                    `${prefix}antitag set delete | kick`,
                    `${prefix}antitag off`
                ]
            });
            return;
        }

        switch (action) {
            case 'on': {
                const existingConfig = await getAntitag(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sendStyled(sock, chatId, message, { title: 'ANTITAG', lines: ['Antitag is already on.'] });
                    return;
                }
                const result = await setAntitag(chatId, 'on', 'delete');
                await sendStyled(sock, chatId, message, {
                    title: 'ANTITAG',
                    lines: [result ? 'Antitag has been turned ON.' : 'Failed to turn on Antitag.']
                });
                break;
            }
            case 'off':
                await removeAntitag(chatId, 'on');
                await sendStyled(sock, chatId, message, { title: 'ANTITAG', lines: ['Antitag has been turned OFF.'] });
                break;
            case 'set': {
                if (args.length < 2) {
                    await sendStyled(sock, chatId, message, {
                        title: 'ANTITAG',
                        lines: [`Usage ☇ ${prefix}antitag set delete | kick`]
                    });
                    return;
                }
                const setAction = args[1];
                if (!['delete', 'kick'].includes(setAction)) {
                    await sendStyled(sock, chatId, message, {
                        title: 'ANTITAG',
                        lines: ['Invalid action. Choose delete or kick.']
                    });
                    return;
                }
                const setResult = await setAntitag(chatId, 'on', setAction);
                await sendStyled(sock, chatId, message, {
                    title: 'ANTITAG',
                    lines: [setResult ? `Antitag action set to ${setAction}.` : 'Failed to set Antitag action.']
                });
                break;
            }
            case 'get': {
                const status = await getAntitag(chatId, 'on');
                const actionConfig = await getAntitag(chatId, 'on');
                await sendStyled(sock, chatId, message, {
                    title: 'ANTITAG',
                    lines: [
                        `Status ☇ ${status ? 'ON' : 'OFF'}`,
                        `Action ☇ ${actionConfig ? actionConfig.action : 'Not set'}`
                    ]
                });
                break;
            }
            default:
                await sendStyled(sock, chatId, message, {
                    title: 'ANTITAG',
                    lines: [`Use ${prefix}antitag for usage.`]
                });
        }
    } catch (error) {
        console.error('Error in antitag command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'ANTITAG',
            lines: ['Error processing antitag command.']
        });
    }
}

async function handleTagDetection(sock, chatId, message, senderId) {
    try {
        const antitagSetting = await getAntitag(chatId, 'on');
        if (!antitagSetting || !antitagSetting.enabled) return;

        const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const messageText = (
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            ''
        );
        const textMentions = messageText.match(/@[\d+\s\-()~.]+/g) || [];
        const numericMentions = messageText.match(/@\d{10,}/g) || [];
        const uniqueNumericMentions = new Set();
        numericMentions.forEach(mention => {
            const numMatch = mention.match(/@(\d+)/);
            if (numMatch) uniqueNumericMentions.add(numMatch[1]);
        });
        const mentionedJidCount = mentionedJids.length;
        const numericMentionCount = uniqueNumericMentions.size;
        const totalMentions = Math.max(mentionedJidCount, numericMentionCount);

        if (totalMentions >= 3) {
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants || [];
            const mentionThreshold = Math.ceil(participants.length * 0.5);
            const hasManyNumericMentions = numericMentionCount >= 10 ||
                (numericMentionCount >= 5 && numericMentionCount >= mentionThreshold);

            if (totalMentions >= mentionThreshold || hasManyNumericMentions) {
                const action = antitagSetting.action || 'delete';
                if (action === 'delete') {
                    await sock.sendMessage(chatId, {
                        delete: {
                            remoteJid: chatId,
                            fromMe: false,
                            id: message.key.id,
                            participant: senderId
                        }
                    });
                    await sendStyled(sock, chatId, message, {
                        title: 'ANTITAG',
                        lines: ['Tagall detected.']
                    });
                } else if (action === 'kick') {
                    await sock.sendMessage(chatId, {
                        delete: {
                            remoteJid: chatId,
                            fromMe: false,
                            id: message.key.id,
                            participant: senderId
                        }
                    });
                    await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    await sendStyled(sock, chatId, message, {
                        title: 'ANTITAG',
                        lines: [`@${senderId.split('@')[0]} has been kicked for tagging all members.`]
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error in tag detection:', error);
    }
}

module.exports = {
    handleAntitagCommand,
    handleTagDetection
};
