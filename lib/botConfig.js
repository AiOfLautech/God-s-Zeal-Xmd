const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), 'bot.json');

const DEFAULTS = {
    botName: 'GODS ZEAL XMD',
    packname: 'GODS ZEAL XMD',
    author: 'Gods Zeal †',
    creator: 'Gods Zeal †',
    creatorNumber: '2349074488025',
    ownerNumbers: ['2349074488025', '2347049283499'],
    devNumbers: ['2349074488015', '2347049283499'],
    commandPrefix: '.',
    commandMode: 'public',
    description: 'This is a bot for managing group commands and automating tasks.',
    version: '3.2.0',
    themeEmoji: '•',
    newsletterJid: '120363269950668068@newsletter',
    newsletterName: 'GODS ZEAL XMD',
    newsletterUrl: 'https://whatsapp.com/channel/0029VaXKAEoKmCPS6Jz7sw0N',
    youtubeUrl: 'https://youtube.com/@Godszealtech',
    supportGroup: 'https://chat.whatsapp.com/GA4WrOFythU6g3BFVubYM7?mode=wwt',
    telegram: 'https://t.me/aitoolshub01',
    menuStyle: 'button',
    menuStyles: ['button', 'normal', 'newmenu', 'box', 'classic', 'compact'],
    menuImage: '',
    botImageUrl: '',
    giphyApiKey: '',
    updateZipUrl: 'https://github.com/AiOfLautech/God-s-zeal-Xmd/archive/refs/heads/main.zip',
    githubRepo: 'https://github.com/AiOfLautech/God-s-Zeal-Xmd',
    pairAccess: 'public',
    maxSessions: 8,
    pairedSessionAutoActions: false,
    maxRamMb: 1024,
    maxStoreMessages: 20,
    storeWriteInterval: 10000,
    alwaysOnline: true,
    autoFollowChannels: ['120363269950668068@newsletter'],
    groupInviteLinks: [],
    telegramHandlersDir: 'handlers',
    premiumDbPath: 'data/premium_users.db',
    mongoUri: '',
    mongoDbName: 'gods_zeal_xmd',
    mongoEncryptionKey: '',
    pairApiBase: ''
};

let cache = null;
let lastMtime = 0;

function fillEmptyFromEnv(cfg) {
    const next = { ...cfg };
    if (!next.creatorNumber && process.env.OWNER_NUMBER) next.creatorNumber = process.env.OWNER_NUMBER;
    if (!next.creator && process.env.OWNER_NAME) next.creator = process.env.OWNER_NAME;
    if (!next.botName && process.env.BOT_NAME) next.botName = process.env.BOT_NAME;
    if (!next.packname && process.env.PACKNAME) next.packname = process.env.PACKNAME;
    if (!next.author && process.env.AUTHOR) next.author = process.env.AUTHOR;
    if (!next.commandPrefix && process.env.PREFIX) next.commandPrefix = process.env.PREFIX;
    if (!next.commandMode && process.env.COMMAND_MODE) next.commandMode = process.env.COMMAND_MODE;
    if (!next.giphyApiKey && process.env.GIPHY_API_KEY) next.giphyApiKey = process.env.GIPHY_API_KEY;
    if (!next.mongoUri && process.env.MONGO_URI) next.mongoUri = process.env.MONGO_URI;
    if (!next.mongoDbName && process.env.MONGO_DB_NAME) next.mongoDbName = process.env.MONGO_DB_NAME;
    if (!next.mongoEncryptionKey && process.env.MONGO_ENCRYPTION_KEY) next.mongoEncryptionKey = process.env.MONGO_ENCRYPTION_KEY;
    if (!next.pairApiBase && process.env.PAIR_API_BASE) next.pairApiBase = process.env.PAIR_API_BASE;
    return next;
}

function normalize(cfg) {
    const merged = { ...DEFAULTS, ...(cfg || {}) };
    if (!Array.isArray(merged.ownerNumbers) || !merged.ownerNumbers.length) {
        merged.ownerNumbers = [merged.creatorNumber].filter(Boolean);
    }
    if (!Array.isArray(merged.devNumbers)) merged.devNumbers = [];
    if (!Array.isArray(merged.autoFollowChannels)) merged.autoFollowChannels = [];
    if (!Array.isArray(merged.groupInviteLinks)) merged.groupInviteLinks = [];
    if (!Array.isArray(merged.menuStyles) || !merged.menuStyles.length) {
        merged.menuStyles = ['button', 'normal', 'newmenu', 'box', 'classic', 'compact'];
    }
    const aliases = { buttons: 'button', text: 'normal', default: 'button', kayzen: 'newmenu' };
    const style = aliases[String(merged.menuStyle || 'button').toLowerCase()] || String(merged.menuStyle || 'button').toLowerCase();
    merged.menuStyle = merged.menuStyles.includes(style) ? style : 'button';
    merged.commandPrefix = String(merged.commandPrefix || '.').trim() || '.';
    merged.botOwner = merged.creator;
    merged.ownerNumber = merged.creatorNumber;
    merged.channelUrl = merged.newsletterUrl;
    return fillEmptyFromEnv(merged);
}

function readDisk() {
    if (!fs.existsSync(CONFIG_PATH)) {
        const created = normalize(DEFAULTS);
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(created, null, 2));
        return created;
    }
    const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return normalize(parsed);
}

function getConfig() {
    try {
        const stats = fs.statSync(CONFIG_PATH);
        if (!cache || stats.mtimeMs !== lastMtime) {
            cache = readDisk();
            lastMtime = stats.mtimeMs;
        }
    } catch {
        cache = normalize(DEFAULTS);
    }
    return cache;
}

function saveConfig(next) {
    const merged = normalize({ ...getConfig(), ...next });
    const toWrite = { ...merged };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(toWrite, null, 2));
    cache = merged;
    try {
        lastMtime = fs.statSync(CONFIG_PATH).mtimeMs;
    } catch {
        lastMtime = Date.now();
    }
    return cache;
}

function updateConfig(partial) {
    return saveConfig(partial);
}

function getPrefix() {
    return String(getConfig().commandPrefix || '.').trim() || '.';
}

function getMenuStyle() {
    return String(getConfig().menuStyle || 'box').toLowerCase();
}

module.exports = {
    CONFIG_PATH,
    DEFAULTS,
    getConfig,
    saveConfig,
    updateConfig,
    getPrefix,
    getMenuStyle
};
