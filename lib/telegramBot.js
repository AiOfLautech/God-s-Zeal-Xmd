const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { getConfig, updateConfig } = require('./botConfig');
const { pairAndStart, normalizePhone, listSessions } = require('./sessionManager');
const { KEYS: TOGGLE_KEYS, getToggleState, applyToggle } = require('./toggles');

let TelegramBot = null;
try {
    TelegramBot = require('node-telegram-bot-api');
} catch (error) {
    TelegramBot = null;
}

let bot = null;
let activeToken = '';
let me = null;
const membershipCache = new Map();

function log(message, color = 'cyan') {
    console.log(chalk[color](`[telegram] ${message}`));
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function tg() {
    return getConfig().telegram || {};
}

function cardText(title, lines = []) {
    const cfg = getConfig();
    const name = escapeHtml(cfg.botName);
    const header = `╭━━━〔 <b>${escapeHtml(title)}</b> 〕━━━╮`;
    const body = lines
        .filter((line) => line !== undefined && line !== null && line !== '')
        .map((line) => `┃ ${escapeHtml(line)}`)
        .join('\n');
    const footer = `╰━━━〔 <b>${name}</b> 〕━━━╯`;
    return [header, body, footer].filter(Boolean).join('\n');
}

function botImage() {
    const cfg = getConfig();
    const local = [
        path.join(process.cwd(), 'assets', 'bot_image.jpg'),
        path.join(process.cwd(), 'assets', 'bot_thumb.jpg')
    ];
    for (const file of local) {
        try {
            if (fs.existsSync(file) && fs.statSync(file).size > 0) return file;
        } catch {}
    }
    return String(cfg.telegram?.imageUrl || cfg.botImageUrl || cfg.menuImage || '').trim() || null;
}

async function sendCard(chatId, title, lines, options = {}) {
    if (!bot) return null;
    const config = tg();
    const text = cardText(title, lines);
    const replyMarkup = options.replyMarkup || undefined;
    const disablePreview = options.disablePreview !== false;
    const image = config.sendImage !== false ? botImage() : null;

    if (image) {
        try {
            return await bot.sendPhoto(chatId, image, {
                caption: text,
                parse_mode: 'HTML',
                reply_markup: replyMarkup,
                disable_notification: false
            });
        } catch (error) {
            log(`sendPhoto failed, falling back to text: ${error.message}`, 'yellow');
        }
    }

    try {
        return await bot.sendMessage(chatId, text, {
            parse_mode: 'HTML',
            reply_markup: replyMarkup,
            disable_web_page_preview: disablePreview
        });
    } catch (error) {
        log(`sendMessage failed: ${error.message}`, 'red');
        return null;
    }
}

async function replyPlain(chatId, text, options = {}) {
    if (!bot) return null;
    try {
        return await bot.sendMessage(chatId, text, {
            parse_mode: options.parseMode || undefined,
            disable_web_page_preview: true,
            reply_markup: options.replyMarkup || undefined
        });
    } catch (error) {
        log(`reply failed: ${error.message}`, 'red');
        return null;
    }
}

function isTelegramAdmin(chatId) {
    const config = tg();
    const id = String(chatId);
    if ((config.adminChatIds || []).map(String).includes(id)) return true;
    const env = String(process.env.TELEGRAM_ADMIN_CHAT_ID || '').trim();
    if (env && env === id) return true;
    return false;
}

function getChannels() {
    const config = tg();
    return Array.isArray(config.channels) ? config.channels : [];
}

function saveChannels(channels) {
    updateConfig({ telegram: { ...getConfig().telegram, channels } });
}

function joinUrlFor(channel) {
    if (channel.url) return channel.url;
    const id = String(channel.id || '');
    if (id.startsWith('@')) return `https://t.me/${id.slice(1)}`;
    return '';
}

function channelsKeyboard(channels, prefixText = 'Join') {
    const rows = [];
    for (const channel of channels) {
        const url = joinUrlFor(channel);
        if (!url) continue;
        rows.push([{ text: `${prefixText} ${channel.title}`.slice(0, 60), url }]);
    }
    return rows.length ? { inline_keyboard: rows } : undefined;
}

function mainKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: 'Pair Session', callback_data: 'menu_pair' },
                { text: 'My ID', callback_data: 'menu_id' }
            ],
            [
                { text: 'Channels', callback_data: 'menu_channels' },
                { text: 'Help', callback_data: 'menu_help' }
            ]
        ]
    };
}

function parseChannelTarget(input) {
    let value = String(input || '').trim();
    if (!value) return '';
    const linkMatch = value.match(/t\.me\/(?:joinchat\/)?([A-Za-z0-9_+-]+)/i);
    if (linkMatch) value = linkMatch[1];
    if (/^-?\d+$/.test(value)) return value;
    value = value.replace(/^@/, '');
    if (!value) return '';
    return `@${value}`;
}

async function isMember(chatId, userId) {
    const key = `${chatId}:${userId}`;
    const cached = membershipCache.get(key);
    if (cached && Date.now() - cached.ts < 60000) return cached.value;
    try {
        const member = await bot.getChatMember(chatId, userId);
        const status = member?.status;
        const value = ['creator', 'administrator', 'member'].includes(status)
            || (status === 'restricted' && member.is_member !== false);
        membershipCache.set(key, { value, ts: Date.now() });
        return value;
    } catch (error) {
        log(`membership check failed for ${chatId}: ${error.message}`, 'yellow');
        return null;
    }
}

async function checkGate(chatId, userId) {
    const config = tg();
    if (!config.forceJoin) return { ok: true, missing: [], unknown: [] };
    const channels = getChannels();
    if (!channels.length) return { ok: true, missing: [], unknown: [] };
    const missing = [];
    const unknown = [];
    for (const channel of channels) {
        const result = await isMember(channel.id, userId);
        if (result === false) missing.push(channel);
        else if (result === null) unknown.push(channel);
    }
    return { ok: missing.length === 0, missing, unknown };
}

async function sendGate(chatId, missing) {
    const lines = [
        'You must join our channels/groups before pairing.',
        'Join all of them, then send /pair again.',
        ''
    ];
    for (const channel of missing) lines.push(`• ${channel.title} (${channel.type})`);
    await sendCard(chatId, 'FORCED JOIN', lines, {
        replyMarkup: channelsKeyboard(missing, 'Join')
    });
}

function helpLines() {
    const config = tg();
    const lines = [
        '/start - welcome and buttons',
        '/pair <number> - start a pairing session',
        '/channels - list channels and groups',
        '/status - show bot session status',
        '/id - show your Telegram chat id',
        '/help - show this help',
        '',
        'Admin commands:',
        '/addchannel <@user|id|link> [title] - add a channel',
        '/addgroup <@user|id|link> [title] - add a group',
        '/removechannel <id> - remove a channel/group',
        '/admins - list Telegram admins',
        '/addadmin <chatId> - add a Telegram admin',
        '/deladmin <chatId> - remove a Telegram admin',
        '/toggle - view or flip toggles',
        '/broadcast <text> - message all admins'
    ];
    if (config.forceJoin) lines.push('', 'Forced join gate: ON');
    return lines;
}

async function handleStart(chatId, name) {
    const cfg = getConfig();
    const lines = [
        `Hello ${name || 'there'}!`,
        '',
        `${cfg.botName} is online.`,
        'Use the buttons below or type /help.',
        'Pair your WhatsApp number with /pair <number>.'
    ];
    await sendCard(chatId, 'WELCOME', lines, { replyMarkup: mainKeyboard() });
}

async function handleChannels(chatId, isCallback = false) {
    const channels = getChannels();
    if (!channels.length) {
        const text = cardText('CHANNELS', ['No channels or groups configured yet.']);
        if (isCallback) await replyPlain(chatId, text, { parseMode: 'HTML' });
        else await sendCard(chatId, 'CHANNELS', ['No channels or groups configured yet.']);
        return;
    }
    const lines = [`Total: ${channels.length}`, ''];
    for (const channel of channels) {
        lines.push(`${channel.title} [${channel.type}]`);
        lines.push(`  ${channel.id}`);
    }
    const markup = channelsKeyboard(channels, 'Open');
    if (isCallback) await replyPlain(chatId, cardText('CHANNELS', lines), { parseMode: 'HTML', replyMarkup: markup });
    else await sendCard(chatId, 'CHANNELS', lines, { replyMarkup: markup });
}

async function handlePair(chatId, userId, rawNumber) {
    const number = normalizePhone(rawNumber);
    if (!number || number.length < 6) {
        await sendCard(chatId, 'PAIR', ['Usage: /pair 234xxxxxxxxxx', 'Enter the full number without + or spaces.']);
        return;
    }

    const gate = await checkGate(chatId, userId);
    if (!gate.ok) {
        await sendGate(chatId, gate.missing);
        return;
    }

    const cfg = getConfig();
    const whatsappID = `${number}@s.whatsapp.net`;
    await sendCard(chatId, 'PAIR SESSION', [`Starting isolated session for ${number}...`]);

    try {
        const paired = await pairAndStart(number, {
            requestedBy: `telegram:${chatId}`,
            chatId: String(chatId)
        });

        if (paired.alreadyConnected) {
            await sendCard(chatId, 'PAIR SESSION', [
                `${number} is already connected.`,
                `Session: ${paired.session.id}`
            ]);
            return;
        }
        if (paired.alreadyRegistered) {
            await sendCard(chatId, 'PAIR SESSION', [
                'Session started',
                `Number: ${number}`,
                `Session: ${paired.sessionId}`,
                'Commands work immediately on that isolated session.'
            ]);
            return;
        }
        await sendCard(chatId, 'PAIRING CODE READY', [
            `Number: ${number}`,
            `Code: ${paired.code}`,
            `Session: ${paired.sessionId}`,
            '',
            'WhatsApp > Linked Devices > Link with phone number',
            'Enter the code above to finish pairing.',
            `Bot: ${cfg.botName}`
        ], {
            replyMarkup: { inline_keyboard: [[{ text: 'Main Menu', callback_data: 'menu_home' }]] }
        });
    } catch (error) {
        log(`pair failed: ${error.message}`, 'red');
        await sendCard(chatId, 'PAIR FAILED', [number, String(error.message || 'Could not start pairing')]);
    }
}

async function handleAddChannel(chatId, rawArgs, type) {
    const parts = String(rawArgs || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
        await sendCard(chatId, type === 'group' ? 'ADD GROUP' : 'ADD CHANNEL', [
            `Usage: /add${type === 'group' ? 'group' : 'channel'} <@username|id|link> [title]`
        ]);
        return;
    }
    const targetRaw = parts.shift();
    const id = parseChannelTarget(targetRaw);
    if (!id) {
        await sendCard(chatId, 'ADD FAILED', ['Could not parse the channel/group target.']);
        return;
    }
    const title = parts.join(' ') || id;
    const channels = getChannels();
    const existing = channels.find((channel) => channel.id === id);
    const url = /^https?:\/\//i.test(targetRaw)
        ? targetRaw
        : (id.startsWith('@') ? `https://t.me/${id.slice(1)}` : '');

    if (existing) {
        existing.title = title;
        existing.url = url || existing.url;
        existing.type = type;
    } else {
        channels.push({ id, title, url, type });
    }
    saveChannels(channels);
    await sendCard(chatId, type === 'group' ? 'GROUP ADDED' : 'CHANNEL ADDED', [
        `Title: ${title}`,
        `ID: ${id}`,
        `Type: ${type}`,
        `Total entries: ${channels.length}`
    ]);
}

async function handleRemoveChannel(chatId, rawArgs) {
    const id = parseChannelTarget(String(rawArgs || '').trim());
    if (!id) {
        await sendCard(chatId, 'REMOVE', ['Usage: /removechannel <@username|id>']);
        return;
    }
    const channels = getChannels();
    const next = channels.filter((channel) => channel.id !== id);
    if (next.length === channels.length) {
        await sendCard(chatId, 'REMOVE', [`No entry matched ${id}`]);
        return;
    }
    saveChannels(next);
    await sendCard(chatId, 'REMOVED', [`Removed: ${id}`, `Remaining: ${next.length}`]);
}

async function handleAdmins(chatId) {
    const admins = tg().adminChatIds || [];
    const lines = admins.length ? admins.map((id) => `• ${id}`) : ['No Telegram admins yet.', 'Add one with /addadmin <chatId>'];
    await sendCard(chatId, 'TELEGRAM ADMINS', lines);
}

async function handleAddAdmin(chatId, rawArgs) {
    const id = String(rawArgs || '').trim().replace(/[^0-9-]/g, '');
    if (!id) {
        await sendCard(chatId, 'ADD ADMIN', ['Usage: /addadmin <chatId>', 'Get your id with /id']);
        return;
    }
    const admins = tg().adminChatIds || [];
    if (!admins.includes(id)) admins.push(id);
    updateConfig({ telegram: { ...getConfig().telegram, adminChatIds: admins } });
    await sendCard(chatId, 'ADMIN ADDED', [`Chat id: ${id}`, `Total admins: ${admins.length}`]);
}

async function handleDelAdmin(chatId, rawArgs) {
    const id = String(rawArgs || '').trim().replace(/[^0-9-]/g, '');
    const admins = (tg().adminChatIds || []).filter((entry) => entry !== id);
    updateConfig({ telegram: { ...getConfig().telegram, adminChatIds: admins } });
    await sendCard(chatId, 'ADMIN REMOVED', [`Chat id: ${id}`, `Total admins: ${admins.length}`]);
}

function toggleKeyboard() {
    const state = getToggleState();
    const mark = (value) => (value ? 'ON' : 'OFF');
    return {
        inline_keyboard: [
            [{ text: `Telegram ${mark(state.telegram)}`, callback_data: 'toggle:telegram' }],
            [{ text: `Force Join ${mark(state.join)}`, callback_data: 'toggle:join' }],
            [{ text: `Bot Image ${mark(state.image)}`, callback_data: 'toggle:image' }],
            [{ text: `Web Pair ${mark(state.pair)}`, callback_data: 'toggle:pair' }],
            [{ text: `Web Force Join ${mark(state.pairjoin)}`, callback_data: 'toggle:pairjoin' }]
        ]
    };
}

function toggleLines() {
    const state = getToggleState();
    return [
        'Flip a switch below or use /toggle <key> <on|off>.',
        '',
        `telegram : ${state.telegram ? 'ON' : 'OFF'}  (Telegram bot)`,
        `join     : ${state.join ? 'ON' : 'OFF'}  (Telegram forced join gate)`,
        `image    : ${state.image ? 'ON' : 'OFF'}  (send bot image)`,
        `pair     : ${state.pair ? 'ON' : 'OFF'}  (web pair page)`,
        `pairjoin : ${state.pairjoin ? 'ON' : 'OFF'}  (web forced join gate)`
    ];
}

async function handleToggle(chatId, rawArgs, isCallback = false) {
    const parts = String(rawArgs || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
        const text = cardText('TOGGLES', toggleLines());
        if (isCallback) await replyPlain(chatId, text, { parseMode: 'HTML', replyMarkup: toggleKeyboard() });
        else await sendCard(chatId, 'TOGGLES', toggleLines(), { replyMarkup: toggleKeyboard() });
        return;
    }
    const key = parts[0].toLowerCase();
    if (!TOGGLE_KEYS.includes(key)) {
        await sendCard(chatId, 'TOGGLES', [`Unknown key: ${key}`, `Valid: ${TOGGLE_KEYS.join(', ')}`]);
        return;
    }
    let explicit;
    if (parts[1]) explicit = ['on', 'true', '1', 'yes'].includes(parts[1].toLowerCase());
    const target = applyToggle(key, explicit);
    await sendCard(chatId, 'TOGGLES', [`${key} is now ${target ? 'ON' : 'OFF'}`, '', ...toggleLines()]);
}

async function handleBroadcast(chatId, rawArgs) {
    const text = String(rawArgs || '').trim();
    if (!text) {
        await sendCard(chatId, 'BROADCAST', ['Usage: /broadcast <text>']);
        return;
    }
    const admins = tg().adminChatIds || [];
    let sent = 0;
    for (const id of admins) {
        const result = await replyPlain(id, cardText('BROADCAST', [text]), { parseMode: 'HTML' });
        if (result) sent += 1;
    }
    await sendCard(chatId, 'BROADCAST', [`Sent to ${sent}/${admins.length} admins.`]);
}

async function handleStatus(chatId) {
    const sessions = listSessions();
    const lines = [
        `Version: ${getConfig().version}`,
        `Sessions: ${sessions.length}`,
        ''
    ];
    for (const row of sessions.slice(0, 10)) {
        lines.push(`${row.phone || row.id} - ${row.status}`);
    }
    await sendCard(chatId, 'STATUS', lines);
}

async function handleId(chatId, msg) {
    const username = msg?.from?.username ? `@${msg.from.username}` : 'n/a';
    await sendCard(chatId, 'YOUR ID', [
        `Chat id: ${chatId}`,
        `Username: ${username}`,
        `Name: ${[msg?.from?.first_name, msg?.from?.last_name].filter(Boolean).join(' ') || 'n/a'}`
    ]);
}

function parseCommand(text) {
    const match = String(text || '').trim().match(/^\/?([a-zA-Z0-9_]+)(?:@[A-Za-z0-9_]+)?(?:\s+([\s\S]*))?$/);
    if (!match) return null;
    return { command: match[1].toLowerCase(), args: (match[2] || '').trim() };
}

async function handleMessage(msg) {
    if (!msg || !msg.text) return;
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const parsed = parseCommand(msg.text);
    if (!parsed) return;
    const { command, args } = parsed;
    const admin = isTelegramAdmin(chatId);
    const name = msg.from?.first_name || msg.chat?.title || '';

    switch (command) {
        case 'start':
            await handleStart(chatId, name);
            return;
        case 'help':
        case 'menu':
            await sendCard(chatId, 'HELP', helpLines(), { replyMarkup: mainKeyboard() });
            return;
        case 'id':
        case 'chatid':
            await handleId(chatId, msg);
            return;
        case 'channels':
            await handleChannels(chatId);
            return;
        case 'status':
            await handleStatus(chatId);
            return;
        case 'pair':
            await handlePair(chatId, userId, args);
            return;
        case 'toggle':
            if (!admin) return void await denyAdmin(chatId);
            await handleToggle(chatId, args);
            return;
        case 'addchannel':
            if (!admin) return void await denyAdmin(chatId);
            await handleAddChannel(chatId, args, 'channel');
            return;
        case 'addgroup':
            if (!admin) return void await denyAdmin(chatId);
            await handleAddChannel(chatId, args, 'group');
            return;
        case 'removechannel':
        case 'delchannel':
            if (!admin) return void await denyAdmin(chatId);
            await handleRemoveChannel(chatId, args);
            return;
        case 'admins':
            if (!admin) return void await denyAdmin(chatId);
            await handleAdmins(chatId);
            return;
        case 'addadmin':
            if (!admin) return void await denyAdmin(chatId);
            await handleAddAdmin(chatId, args);
            return;
        case 'deladmin':
            if (!admin) return void await denyAdmin(chatId);
            await handleDelAdmin(chatId, args);
            return;
        case 'broadcast':
            if (!admin) return void await denyAdmin(chatId);
            await handleBroadcast(chatId, args);
            return;
        default:
            if (command.startsWith('pair')) {
                await handlePair(chatId, userId, args);
            }
            return;
    }
}

async function denyAdmin(chatId) {
    await sendCard(chatId, 'ADMIN ONLY', ['You are not a Telegram admin.', 'Ask an admin to run /addadmin with your chat id.', 'Get your id with /id.']);
}

async function handleCallback(query) {
    const data = query.data || '';
    const chatId = query.message?.chat?.id;
    if (!chatId) return;
    try { await bot.answerCallbackQuery(query.id); } catch {}

    if (data.startsWith('toggle:')) {
        if (!isTelegramAdmin(chatId)) return void await denyAdmin(chatId);
        const key = data.split(':')[1];
        if (!TOGGLE_KEYS.includes(key)) return;
        applyToggle(key);
        await sendCard(chatId, 'TOGGLES', toggleLines(), { replyMarkup: toggleKeyboard() });
        return;
    }

    switch (data) {
        case 'menu_home':
            await handleStart(chatId, query.from?.first_name);
            return;
        case 'menu_pair':
            await sendCard(chatId, 'PAIR', ['Send your number like:', '/pair 234xxxxxxxxxx']);
            return;
        case 'menu_id':
            await handleId(chatId, { from: query.from });
            return;
        case 'menu_channels':
            await handleChannels(chatId, true);
            return;
        case 'menu_help':
            await sendCard(chatId, 'HELP', helpLines());
            return;
        default:
            return;
    }
}

function stopTelegramBot() {
    if (bot) {
        try { bot.stopPolling(); } catch {}
        bot = null;
        activeToken = '';
        me = null;
        log('stopped', 'yellow');
    }
}

function startTelegramBot() {
    const config = tg();
    if (!TelegramBot) {
        log('node-telegram-bot-api is not installed; skipping', 'yellow');
        return null;
    }
    if (!config.enabled) {
        log('disabled in bot.json', 'yellow');
        return null;
    }
    if (!config.token) {
        log('no token configured; skipping', 'yellow');
        return null;
    }
    if (bot && activeToken === config.token) return bot;

    stopTelegramBot();
    try {
        bot = new TelegramBot(config.token, { polling: true });
        activeToken = config.token;
        bot.on('polling_error', (error) => log(`polling error: ${error.message}`, 'yellow'));
        bot.on('error', (error) => log(`error: ${error.message}`, 'red'));
        bot.on('message', (msg) => handleMessage(msg).catch((error) => log(`handler error: ${error.message}`, 'red')));
        bot.on('callback_query', (query) => handleCallback(query).catch((error) => log(`callback error: ${error.message}`, 'red')));
        bot.getMe().then((info) => {
            me = info;
            log(`started as @${info.username}`, 'green');
        }).catch((error) => log(`getMe failed: ${error.message}`, 'red'));
        return bot;
    } catch (error) {
        log(`failed to start: ${error.message}`, 'red');
        bot = null;
        activeToken = '';
        return null;
    }
}

function syncTelegram() {
    const config = tg();
    if (config.enabled && config.token) {
        if (bot && activeToken === config.token) return bot;
        return startTelegramBot();
    }
    if (bot) stopTelegramBot();
    return null;
}

function getTelegramBot() {
    return bot;
}

function getTelegramInfo() {
    return me;
}

module.exports = {
    startTelegramBot,
    stopTelegramBot,
    syncTelegram,
    getTelegramBot,
    getTelegramInfo,
    isTelegramAdmin,
    getChannels,
    checkGate,
    cardText
};
