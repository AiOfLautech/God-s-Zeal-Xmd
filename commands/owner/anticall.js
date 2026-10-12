const fs = require('fs');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

const ANTICALL_PATH = './data/anticall.json';

function readState() {
    try {
        if (!fs.existsSync(ANTICALL_PATH)) return { enabled: false };
        const raw = fs.readFileSync(ANTICALL_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return { enabled: !!data.enabled };
    } catch {
        return { enabled: false };
    }
}

function writeState(enabled) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(ANTICALL_PATH, JSON.stringify({ enabled: !!enabled }, null, 2));
    } catch {}
}

async function anticallCommand(sock, chatId, message, args) {
    const state = readState();
    const sub = (args || '').trim().toLowerCase();
    const prefix = getPrefix();

    if (!sub || (sub !== 'on' && sub !== 'off' && sub !== 'status')) {
        await sendStyled(sock, chatId, message, {
            title: 'ANTICALL',
            lines: [
                `${prefix}anticall on`,
                `${prefix}anticall off`,
                `${prefix}anticall status`
            ]
        });
        return;
    }

    if (sub === 'status') {
        await sendStyled(sock, chatId, message, {
            title: 'ANTICALL',
            lines: [`Status ☇ ${state.enabled ? 'ON' : 'OFF'}`]
        });
        return;
    }

    const enable = sub === 'on';
    writeState(enable);
    await sendStyled(sock, chatId, message, {
        title: 'ANTICALL',
        lines: [`Anticall is now ${enable ? 'ENABLED' : 'DISABLED'}.`]
    });
}

module.exports = { anticallCommand, readState };
