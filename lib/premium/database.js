const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const settings = require('../../settings');
const { normalizeId, getDevNumbers, isDev } = require('../devs');
const isOwnerOrSudo = require('../isOwner');

const dbPath = path.join(process.cwd(), settings.premiumDbPath || 'data/premium_users.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');

db.exec(`
CREATE TABLE IF NOT EXISTS tracked_users (
    user_key TEXT PRIMARY KEY,
    encrypted_user_id TEXT NOT NULL,
    masked_id TEXT NOT NULL,
    display_name TEXT,
    premium INTEGER DEFAULT 0,
    premium_granted_by TEXT DEFAULT NULL,
    config_json TEXT DEFAULT '{}',
    first_seen TEXT DEFAULT CURRENT_TIMESTAMP,
    last_seen TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

const selectUserStmt = db.prepare('SELECT * FROM tracked_users WHERE user_key = ?');
const countUsersStmt = db.prepare('SELECT COUNT(*) AS count FROM tracked_users');
const listUsersStmt = db.prepare(`
    SELECT masked_id, display_name, premium, premium_granted_by, first_seen, last_seen
    FROM tracked_users
    ORDER BY datetime(last_seen) DESC
    LIMIT ? OFFSET ?
`);
const listPremiumStmt = db.prepare(`
    SELECT masked_id, display_name, premium_granted_by, first_seen, last_seen
    FROM tracked_users
    WHERE premium = 1
    ORDER BY datetime(last_seen) DESC
`);
const listActiveAutomationStmt = db.prepare(`
    SELECT encrypted_user_id, config_json
    FROM tracked_users
    WHERE premium = 1
`);
const searchUsersStmt = db.prepare(`
    SELECT masked_id, display_name, premium, premium_granted_by, first_seen, last_seen
    FROM tracked_users
    WHERE lower(display_name) LIKE ? OR masked_id LIKE ?
    ORDER BY datetime(last_seen) DESC
    LIMIT 20
`);
const upsertUserStmt = db.prepare(`
    INSERT INTO tracked_users (user_key, encrypted_user_id, masked_id, display_name, premium, premium_granted_by, config_json, first_seen, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(user_key) DO UPDATE SET
        encrypted_user_id = excluded.encrypted_user_id,
        masked_id = excluded.masked_id,
        display_name = COALESCE(excluded.display_name, tracked_users.display_name),
        last_seen = CURRENT_TIMESTAMP
`);
const updateConfigStmt = db.prepare('UPDATE tracked_users SET config_json = ?, last_seen = CURRENT_TIMESTAMP WHERE user_key = ?');
const updatePremiumStmt = db.prepare(`
    UPDATE tracked_users
    SET premium = ?, premium_granted_by = ?, last_seen = CURRENT_TIMESTAMP
    WHERE user_key = ?
`);

function buildKeyMaterial() {
    const base = [
        settings.botName || 'GODS ZEAL XMD',
        settings.newsletterJid || '',
        ...(settings.ownerNumbers || []),
        ...(settings.devNumbers || []),
    ].join('|');
    return crypto.createHash('sha256').update(base).digest();
}

const encryptionKey = buildKeyMaterial();

function getUserKey(userId = '') {
    return crypto.createHash('sha256').update(normalizeId(userId)).digest('hex');
}

function maskId(userId = '') {
    const normalized = normalizeId(userId);
    if (!normalized) return 'unknown';
    if (normalized.length <= 4) return `u-${normalized}`;
    return `${normalized.slice(0, 2)}***${normalized.slice(-2)}`;
}

function encryptValue(value = '') {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decryptValue(payload = '') {
    if (!payload) return '';
    const [ivB64, tagB64, encB64] = String(payload).split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encB64, 'base64')),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
}

function parseConfig(configJson) {
    try {
        const parsed = JSON.parse(configJson || '{}');
        return {
            channelFollow: !!parsed.channelFollow,
            channelReact: !!parsed.channelReact,
            newsletterJid: String(parsed.newsletterJid || settings.newsletterJid || '').trim(),
            groupLinks: Array.isArray(parsed.groupLinks) ? parsed.groupLinks.map(String) : [],
            reactionCount: Math.max(1, Number.parseInt(parsed.reactionCount, 10) || 1),
            followerTarget: Math.max(1, Number.parseInt(parsed.followerTarget, 10) || 1),
        };
    } catch {
        return {
            channelFollow: false,
            channelReact: false,
            newsletterJid: settings.newsletterJid || '',
            groupLinks: [],
            reactionCount: 1,
            followerTarget: 1,
        };
    }
}

function serializeConfig(config) {
    return JSON.stringify({
        channelFollow: !!config.channelFollow,
        channelReact: !!config.channelReact,
        newsletterJid: String(config.newsletterJid || settings.newsletterJid || '').trim(),
        groupLinks: Array.isArray(config.groupLinks) ? [...new Set(config.groupLinks.map(String))] : [],
        reactionCount: Math.max(1, Number.parseInt(config.reactionCount, 10) || 1),
        followerTarget: Math.max(1, Number.parseInt(config.followerTarget, 10) || 1),
    });
}

function ensureTrackedUser(userId, displayName = '') {
    const normalized = normalizeId(userId);
    if (!normalized) {
        throw new Error('Invalid tracked user id');
    }

    const userKey = getUserKey(normalized);
    const existing = selectUserStmt.get(userKey);
    if (!existing) {
        upsertUserStmt.run(
            userKey,
            encryptValue(normalized),
            maskId(normalized),
            displayName || normalized,
            0,
            null,
            serializeConfig(parseConfig('{}'))
        );
    } else {
        upsertUserStmt.run(
            userKey,
            encryptValue(normalized),
            maskId(normalized),
            displayName || existing.display_name || normalized,
            existing.premium,
            existing.premium_granted_by,
            existing.config_json || '{}'
        );
    }

    return getTrackedUser(normalized);
}

function getTrackedUser(userId) {
    const userKey = getUserKey(userId);
    const row = selectUserStmt.get(userKey);
    if (!row) return null;
    return {
        ...row,
        userId: decryptValue(row.encrypted_user_id),
        premium: !!row.premium,
        config: parseConfig(row.config_json),
    };
}

function touchUser(userId, displayName = '') {
    return ensureTrackedUser(userId, displayName);
}

function setPremium(userId, grantedBy, enabled) {
    const tracked = ensureTrackedUser(userId);
    updatePremiumStmt.run(enabled ? 1 : 0, enabled ? normalizeId(grantedBy) : null, tracked.user_key);
    return getTrackedUser(userId);
}

function updateUserConfig(userId, patch) {
    const tracked = ensureTrackedUser(userId);
    const merged = {
        ...tracked.config,
        ...patch,
    };
    if (patch.groupLinks) {
        merged.groupLinks = patch.groupLinks;
    }
    updateConfigStmt.run(serializeConfig(merged), tracked.user_key);
    return getTrackedUser(userId);
}

function countTrackedUsers() {
    return countUsersStmt.get().count;
}

function listTrackedUsers(limit = 20, offset = 0) {
    return listUsersStmt.all(limit, offset);
}

function listPremiumUsers() {
    return listPremiumStmt.all();
}

function findTrackedUsers(term) {
    const search = String(term || '').trim().toLowerCase();
    if (!search) return [];
    return searchUsersStmt.all(`%${search}%`, `%${search}%`);
}

function getAutomationTargets() {
    const rows = listActiveAutomationStmt.all();
    const newsletterTargets = new Map();
    const groupLinks = new Set();

    for (const row of rows) {
        const userId = decryptValue(row.encrypted_user_id);
        const config = parseConfig(row.config_json);
        if ((config.channelFollow || config.channelReact) && config.newsletterJid) {
            newsletterTargets.set(config.newsletterJid, {
                channelFollow: config.channelFollow,
                channelReact: config.channelReact,
                configuredBy: userId,
                reactionCount: config.reactionCount,
                followerTarget: config.followerTarget,
            });
        }
        for (const link of config.groupLinks) {
            if (link) groupLinks.add(link);
        }
    }

    return {
        newsletterTargets: Array.from(newsletterTargets.entries()).map(([jid, state]) => ({ jid, ...state })),
        groupLinks: Array.from(groupLinks),
    };
}

async function hasPremiumAccess(senderId, sock) {
    if (isDev(senderId)) return true;
    if (await isOwnerOrSudo(senderId, sock)) return true;
    const tracked = getTrackedUser(senderId);
    return !!tracked?.premium;
}

function canManagePremium(senderId) {
    return isDev(senderId);
}

module.exports = {
    db,
    normalizeId,
    maskId,
    encryptValue,
    decryptValue,
    parseConfig,
    serializeConfig,
    touchUser,
    getTrackedUser,
    setPremium,
    updateUserConfig,
    countTrackedUsers,
    listTrackedUsers,
    listPremiumUsers,
    findTrackedUsers,
    getAutomationTargets,
    hasPremiumAccess,
    canManagePremium,
    getDevNumbers,
};
