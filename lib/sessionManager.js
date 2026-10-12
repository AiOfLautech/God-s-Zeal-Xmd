const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const pino = require('pino');
const NodeCache = require('node-cache');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    delay,
    Browsers
} = require('@whiskeysockets/baileys');
const { getConfig } = require('./botConfig');
const { storeLinkedUser } = require('./mongoStore');

const SESSIONS_ROOT = path.join(process.cwd(), 'sessions');
const REGISTRY_PATH = path.join(process.cwd(), 'data', 'sessions.json');
const activeSessions = new Map();
const pendingPair = new Map();
let messageHandler = null;
let groupHandler = null;
let statusHandler = null;
let storeFactory = null;

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sessionFolder(id) {
    return path.join(SESSIONS_ROOT, id);
}

function loadRegistry() {
    try {
        if (!fs.existsSync(REGISTRY_PATH)) return { sessions: [] };
        return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    } catch {
        return { sessions: [] };
    }
}

function saveRegistry(registry) {
    ensureDir(path.dirname(REGISTRY_PATH));
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

function upsertRegistry(entry) {
    const registry = loadRegistry();
    const idx = registry.sessions.findIndex((item) => item.id === entry.id);
    if (idx >= 0) registry.sessions[idx] = { ...registry.sessions[idx], ...entry };
    else registry.sessions.push(entry);
    saveRegistry(registry);
    return registry;
}

function removeRegistry(id) {
    const registry = loadRegistry();
    registry.sessions = registry.sessions.filter((item) => item.id !== id);
    saveRegistry(registry);
}

function listSessions() {
    const live = [...activeSessions.values()].map((item) => ({
        id: item.id,
        phone: item.phone,
        jid: item.jid,
        status: item.status,
        isolated: true
    }));
    const saved = loadRegistry().sessions || [];
    for (const row of saved) {
        if (!live.some((item) => item.id === row.id)) {
            live.push({
                id: row.id,
                phone: row.phone,
                jid: row.jid,
                status: row.status || 'offline',
                isolated: true
            });
        }
    }
    return live;
}

function getSession(id) {
    return activeSessions.get(id) || null;
}

function sessionCount() {
    return activeSessions.size;
}

function normalizePhone(value) {
    return String(value || '').replace(/[^0-9]/g, '');
}

function attachHandlers(sock, sessionId) {
    sock.sessionId = sessionId;
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            if (typeof messageHandler === 'function') {
                await messageHandler(sock, chatUpdate, true);
            }
        } catch (error) {
            console.error(`[session:${sessionId}] message handler error:`, error.message);
        }
    });
    sock.ev.on('group-participants.update', async (update) => {
        try {
            if (typeof groupHandler === 'function') {
                await groupHandler(sock, update);
            }
        } catch (error) {
            console.error(`[session:${sessionId}] group handler error:`, error.message);
        }
    });
    sock.ev.on('messages.upsert', async (m) => {
        try {
            if (m.messages?.[0]?.key?.remoteJid === 'status@broadcast' && typeof statusHandler === 'function') {
                await statusHandler(sock, m);
            }
        } catch {}
    });
}

async function createSocket(sessionId, options = {}) {
    const cfg = getConfig();
    const authDir = sessionFolder(sessionId);
    ensureDir(authDir);
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    let version;
    try {
        const latest = await fetchLatestBaileysVersion();
        version = latest.version;
    } catch {
        version = [2, 3000, 1027934701];
    }
    const msgRetryCounterCache = new NodeCache();
    const logger = pino({ level: 'silent' });
    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        browser: Browsers?.ubuntu ? Browsers.ubuntu('Chrome') : ['Ubuntu', 'Chrome', '20.0.04'],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
        },
        markOnlineOnConnect: cfg.alwaysOnline !== false,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        getMessage: async () => '',
        msgRetryCounterCache,
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
    });
    sock.ev.on('creds.update', saveCreds);
    if (typeof storeFactory === 'function') {
        try { storeFactory(sock); } catch {}
    }
    attachHandlers(sock, sessionId);
    return { sock, creds: state.creds };
}

function waitForOpen(sock, timeoutMs = 45000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            sock.ev.off('connection.update', onUpdate);
            reject(new Error('Timed out waiting for WhatsApp connection'));
        }, timeoutMs);
        const onUpdate = ({ connection, lastDisconnect }) => {
            if (connection === 'open') {
                clearTimeout(timer);
                sock.ev.off('connection.update', onUpdate);
                resolve(true);
            }
            if (connection === 'close') {
                const status = lastDisconnect?.error?.output?.statusCode;
                if (status === DisconnectReason.loggedOut || status === 401) {
                    clearTimeout(timer);
                    sock.ev.off('connection.update', onUpdate);
                    reject(new Error('Session logged out before it could connect'));
                }
            }
        };
        sock.ev.on('connection.update', onUpdate);
        if (sock.user?.id) {
            clearTimeout(timer);
            sock.ev.off('connection.update', onUpdate);
            resolve(true);
        }
    });
}

function bindLifecycle(sock, sessionId, phone) {
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        const current = activeSessions.get(sessionId);
        if (connection === 'open') {
            const jid = sock.user?.id || '';
            const livePhone = normalizePhone(jid) || phone;
            if (current) {
                current.status = 'connected';
                current.jid = jid;
                current.phone = livePhone;
                current.connectedAt = new Date().toISOString();
            }
            upsertRegistry({
                id: sessionId,
                phone: livePhone,
                jid,
                status: 'connected',
                connectedAt: new Date().toISOString()
            });
            storeLinkedUser({
                phone: livePhone,
                jid,
                source: 'multi_session',
                sessionId,
                connectedAt: new Date().toISOString()
            }).catch(() => {});
            console.log(chalk.green(`✓ Session ${sessionId} connected as ${livePhone}`));
        }
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 401;
            if (current) current.status = shouldReconnect ? 'reconnecting' : 'logged_out';
            upsertRegistry({
                id: sessionId,
                phone,
                status: shouldReconnect ? 'reconnecting' : 'logged_out',
                closedAt: new Date().toISOString()
            });
            if (!shouldReconnect) {
                activeSessions.delete(sessionId);
                console.log(chalk.red(`✗ Session ${sessionId} logged out`));
                return;
            }
            console.log(chalk.yellow(`↻ Reconnecting session ${sessionId}...`));
            await delay(4000);
            startSavedSession(sessionId, phone).catch((error) => {
                console.error(`[session:${sessionId}] reconnect failed:`, error.message);
            });
        }
    });
}

async function startSavedSession(sessionId, phone = '') {
    if (activeSessions.has(sessionId) && activeSessions.get(sessionId).status === 'connected') {
        return activeSessions.get(sessionId);
    }
    const { sock } = await createSocket(sessionId);
    const record = {
        id: sessionId,
        phone,
        jid: sock.user?.id || '',
        status: 'connecting',
        sock,
        startedAt: new Date().toISOString()
    };
    activeSessions.set(sessionId, record);
    bindLifecycle(sock, sessionId, phone);
    return record;
}

async function pairAndStart(phoneNumber, meta = {}) {
    const phone = normalizePhone(phoneNumber);
    if (!phone) throw new Error('Invalid phone number');
    const cfg = getConfig();
    const maxSessions = Number(cfg.maxSessions || 8);
    if (sessionCount() >= maxSessions) {
        throw new Error(`Maximum sessions reached (${maxSessions})`);
    }
    const existing = [...activeSessions.values()].find((item) => item.phone === phone && item.status === 'connected');
    if (existing) {
        return { alreadyConnected: true, session: existing };
    }
    if (pendingPair.has(phone)) {
        return pendingPair.get(phone);
    }

    const job = (async () => {
        const sessionId = `user-${phone}`;
        const { sock, creds } = await createSocket(sessionId);
        bindLifecycle(sock, sessionId, phone);
        const record = {
            id: sessionId,
            phone,
            jid: '',
            status: 'pairing',
            sock,
            startedAt: new Date().toISOString(),
            requestedBy: meta.requestedBy || '',
            chatId: meta.chatId || ''
        };
        activeSessions.set(sessionId, record);
        upsertRegistry({
            id: sessionId,
            phone,
            status: 'pairing',
            requestedBy: meta.requestedBy || '',
            createdAt: new Date().toISOString()
        });

        if (creds?.registered) {
            record.status = 'connecting';
            return { sessionId, phone, alreadyRegistered: true, sock };
        }

        await delay(1500);
        let code = await sock.requestPairingCode(phone);
        code = String(code || '').replace(/[^0-9A-Z]/gi, '');
        const formatted = code.match(/.{1,4}/g)?.join('-') || code;
        record.pairingCode = formatted;
        record.status = 'waiting_scan';
        waitForOpen(sock, 90000).then(() => {
            record.status = 'connected';
        }).catch((error) => {
            record.status = 'failed';
            record.lastError = error.message;
        });
        return { sessionId, phone, code: formatted, sock };
    })();

    pendingPair.set(phone, job);
    try {
        return await job;
    } finally {
        pendingPair.delete(phone);
    }
}

async function restoreSessions() {
    ensureDir(SESSIONS_ROOT);
    const registry = loadRegistry();
    const saved = registry.sessions || [];
    for (const row of saved) {
        if (!row?.id) continue;
        const folder = sessionFolder(row.id);
        const credsPath = path.join(folder, 'creds.json');
        if (!fs.existsSync(credsPath)) continue;
        try {
            await startSavedSession(row.id, row.phone || '');
        } catch (error) {
            console.error(`[session:${row.id}] restore failed:`, error.message);
        }
    }
}

function registerHandlers({ handleMessages, handleGroupParticipantUpdate, handleStatus, bindStore }) {
    messageHandler = handleMessages;
    groupHandler = handleGroupParticipantUpdate;
    statusHandler = handleStatus;
    storeFactory = bindStore;
}

module.exports = {
    SESSIONS_ROOT,
    registerHandlers,
    pairAndStart,
    restoreSessions,
    startSavedSession,
    listSessions,
    getSession,
    sessionCount,
    normalizePhone
};
