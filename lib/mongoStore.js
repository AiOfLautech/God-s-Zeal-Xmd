const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const settings = require('../settings');

const MONGO_URI = process.env.MONGO_URI || settings.mongoUri || '';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || settings.mongoDbName || 'gods_zeal_xmd';
const ENC_SEED = process.env.MONGO_ENCRYPTION_KEY || settings.mongoEncryptionKey || settings.ownerNumber || 'gods-zeal-xmd';

let client;
let db;

function getKey() {
    return crypto.createHash('sha256').update(String(ENC_SEED)).digest();
}

function sanitizeMongoMessage(message) {
    return String(message || '')
        .replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, '[MONGO_URI_REDACTED]')
        .replace(/password=[^&\s]+/gi, 'password=[REDACTED]');
}

function encryptPayload(payload) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
    const plaintext = Buffer.from(JSON.stringify(payload));
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        data: encrypted.toString('base64')
    };
}

async function ensureDb() {
    if (!MONGO_URI) return null;
    if (db) return db;
    client = new MongoClient(MONGO_URI, { maxPoolSize: 5 });
    await client.connect();
    db = client.db(MONGO_DB_NAME);
    return db;
}

async function upsertEncrypted(collectionName, identity, payload) {
    try {
        const mongo = await ensureDb();
        if (!mongo) return false;
        const encrypted = encryptPayload(payload);
        await mongo.collection(collectionName).updateOne(
            identity,
            {
                $set: {
                    identity,
                    encrypted,
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );
        return true;
    } catch (error) {
        console.error(`[mongoStore] ${collectionName} upsert failed:`, sanitizeMongoMessage(error.message));
        return false;
    }
}

async function initializeMongoStore() {
    if (!MONGO_URI) {
        console.log('[mongoStore] Mongo URI not set. Running without remote Mongo sync.');
        return false;
    }

    try {
        const mongo = await ensureDb();
        const [linkedUsers, economyUsers] = await Promise.all([
            mongo.collection('linked_users').countDocuments(),
            mongo.collection('economy_users').countDocuments()
        ]);
        console.log(`[mongoStore] Connected. Loaded existing users: linked=${linkedUsers}, economy=${economyUsers}`);
        return true;
    } catch (error) {
        console.error('[mongoStore] Connection failed:', sanitizeMongoMessage(error.message));
        return false;
    }
}

async function storeLinkedUser(entry) {
    if (!entry?.phone && !entry?.jid) return false;
    const identity = { key: entry.jid || entry.phone };
    return upsertEncrypted('linked_users', identity, entry);
}

async function storeEconomyUser(entry) {
    if (!entry?.user_id) return false;
    return upsertEncrypted('economy_users', { key: entry.user_id }, entry);
}

async function storeChannelAction(entry) {
    const key = `${entry?.action || 'unknown'}:${entry?.initiator || 'na'}:${entry?.target || 'na'}`;
    return upsertEncrypted('channel_actions', { key }, entry);
}

async function storeAutoTargets(entry) {
    return upsertEncrypted('auto_targets', { key: 'default' }, entry || {});
}

module.exports = {
    initializeMongoStore,
    storeLinkedUser,
    storeEconomyUser,
    storeChannelAction,
    storeAutoTargets,
};
