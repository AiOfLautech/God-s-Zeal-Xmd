const fs = require('fs');
const isOwnerOrSudo = require('../../lib/isOwner');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

const PMBLOCKER_PATH = './data/pmblocker.json';
const DEFAULT_MSG = 'Direct messages are blocked. Contact the owner in group chats only.';

function readState() {
    try {
        if (!fs.existsSync(PMBLOCKER_PATH)) return { enabled: false, message: DEFAULT_MSG };
        const raw = fs.readFileSync(PMBLOCKER_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return {
            enabled: !!data.enabled,
            message: typeof data.message === 'string' && data.message.trim() ? data.message : DEFAULT_MSG
        };
    } catch {
        return { enabled: false, message: DEFAULT_MSG };
    }
}

function writeState(enabled, message) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        const current = readState();
        const payload = {
            enabled: !!enabled,
            message: typeof message === 'string' && message.trim() ? message : current.message
        };
        fs.writeFileSync(PMBLOCKER_PATH, JSON.stringify(payload, null, 2));
    } catch {}
}

async function pmblockerCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
    const prefix = getPrefix();

    if (!message.key.fromMe && !isOwner) {
        await sendStyled(sock, chatId, message, {
            title: 'PMBLOCKER',
            lines: ['Only bot owner can use this command.']
        });
        return;
    }

    const argStr = (args || '').trim();
    const [sub, ...rest] = argStr.split(' ');
    const state = readState();

    if (!sub || !['on', 'off', 'status', 'setmsg'].includes(sub.toLowerCase())) {
        await sendStyled(sock, chatId, message, {
            title: 'PMBLOCKER',
            lines: [
                `${prefix}pmblocker on`,
                `${prefix}pmblocker off`,
                `${prefix}pmblocker status`,
                `${prefix}pmblocker setmsg <text>`
            ]
        });
        return;
    }

    if (sub.toLowerCase() === 'status') {
        await sendStyled(sock, chatId, message, {
            title: 'PMBLOCKER',
            lines: [`Status ☇ ${state.enabled ? 'ON' : 'OFF'}`, `Message ☇ ${state.message}`]
        });
        return;
    }

    if (sub.toLowerCase() === 'setmsg') {
        const newMsg = rest.join(' ').trim();
        if (!newMsg) {
            await sendStyled(sock, chatId, message, {
                title: 'PMBLOCKER',
                lines: [`Usage ☇ ${prefix}pmblocker setmsg <message>`]
            });
            return;
        }
        writeState(state.enabled, newMsg);
        await sendStyled(sock, chatId, message, {
            title: 'PMBLOCKER',
            lines: ['PM Blocker message updated.']
        });
        return;
    }

    const enable = sub.toLowerCase() === 'on';
    writeState(enable);
    await sendStyled(sock, chatId, message, {
        title: 'PMBLOCKER',
        lines: [`PM Blocker is now ${enable ? 'ENABLED' : 'DISABLED'}.`]
    });
}

module.exports = { pmblockerCommand, readState };
