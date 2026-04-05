const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const config = require('./config');

const dbPath = path.join(process.cwd(), config.DB_PATH);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

function backupCorruptedEconomyDb(error) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filesToRotate = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`];

    for (const file of filesToRotate) {
        if (!fs.existsSync(file)) continue;
        const backupPath = `${file}.corrupt-${timestamp}.bak`;
        fs.copyFileSync(file, backupPath);
        fs.unlinkSync(file);
    }

    console.error(`[economy] Corrupted SQLite database detected and backed up. Reason: ${error.message}`);
}

function createDatabaseConnection(targetPath = dbPath) {
    return new DatabaseSync(targetPath);
}

function configureDatabase(database) {
    database.exec('PRAGMA journal_mode = WAL;');
    database.exec('PRAGMA synchronous = NORMAL;');
}

let db;
try {
    db = createDatabaseConnection();
    configureDatabase(db);
} catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (!message.includes('malformed')) {
        throw error;
    }
    backupCorruptedEconomyDb(error);
    console.warn('[economy] Recreating primary economy database after corruption backup.');
    db = createDatabaseConnection(dbPath);
    configureDatabase(db);
}

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    wallet INTEGER DEFAULT 1000,
    bank INTEGER DEFAULT 0,
    bank_capacity INTEGER DEFAULT 10000,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    prestige_level INTEGER DEFAULT 0,
    banned INTEGER DEFAULT 0,
    job TEXT DEFAULT NULL,
    job_level INTEGER DEFAULT 0,
    last_daily TEXT DEFAULT NULL,
    last_weekly TEXT DEFAULT NULL,
    last_monthly TEXT DEFAULT NULL,
    last_work TEXT DEFAULT NULL,
    last_beg TEXT DEFAULT NULL,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    total_transferred INTEGER DEFAULT 0,
    total_received INTEGER DEFAULT 0,
    total_gambled INTEGER DEFAULT 0,
    total_won INTEGER DEFAULT 0,
    total_lost INTEGER DEFAULT 0,
    active_loan INTEGER DEFAULT 0,
    loan_amount INTEGER DEFAULT 0,
    loan_due TEXT DEFAULT NULL,
    loan_interest INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user TEXT,
    to_user TEXT,
    amount INTEGER,
    type TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

const getUserStmt = db.prepare('SELECT * FROM users WHERE user_id = ?');
const insertUserStmt = db.prepare(`
    INSERT INTO users (user_id, username, wallet, bank_capacity)
    VALUES (?, ?, ?, ?)
`);
const updateUsernameStmt = db.prepare('UPDATE users SET username = ? WHERE user_id = ?');
const leaderboardStmt = db.prepare(`
    SELECT user_id, username, wallet + bank AS networth
    FROM users
    WHERE banned = 0
    ORDER BY networth DESC, username ASC
    LIMIT ? OFFSET ?
`);
const updateUserStmtCache = new Map();
const insertTransactionStmt = db.prepare(`
    INSERT INTO transactions (from_user, to_user, amount, type)
    VALUES (?, ?, ?, ?)
`);

function normalizeUserId(value = '') {
    const text = String(value || '').trim();
    if (!text) return '';
    if (!text.includes('@')) {
        return text.split(':')[0];
    }
    const [left, right] = text.split('@');
    return `${left.split(':')[0]}@${right}`;
}

function getUser(userId, username = 'Unknown') {
    const normalizedUserId = normalizeUserId(userId);
    if (!normalizedUserId) {
        throw new Error('Invalid economy user id');
    }

    let user = getUserStmt.get(normalizedUserId);
    if (!user) {
        insertUserStmt.run(normalizedUserId, username || 'Unknown', config.STARTING_BALANCE, config.STARTING_BANK_CAPACITY);
        user = getUserStmt.get(normalizedUserId);
    } else if (username && username !== 'Unknown' && user.username !== username) {
        updateUsernameStmt.run(username, normalizedUserId);
        user = getUserStmt.get(normalizedUserId);
    }

    return user;
}

function updateUser(userId, patch) {
    const entries = Object.entries(patch).filter(([, value]) => value !== undefined);
    if (!entries.length) return;

    const normalizedUserId = normalizeUserId(userId);
    const key = entries.map(([field]) => field).sort().join('|');
    let stmt = updateUserStmtCache.get(key);

    if (!stmt) {
        const sortedEntries = [...entries].sort(([a], [b]) => a.localeCompare(b));
        const setClause = sortedEntries.map(([field]) => `${field} = ?`).join(', ');
        stmt = db.prepare(`UPDATE users SET ${setClause} WHERE user_id = ?`);
        updateUserStmtCache.set(key, { stmt, fields: sortedEntries.map(([field]) => field) });
    }

    const { stmt: preparedStmt, fields } = stmt;
    const values = fields.map((field) => patch[field]);
    preparedStmt.run(...values, normalizedUserId);
}

function getLeaderboard(limit = 10, offset = 0) {
    return leaderboardStmt.all(limit, offset);
}

function logTransaction(fromUser, toUser, amount, type) {
    insertTransactionStmt.run(
        fromUser ? normalizeUserId(fromUser) : null,
        toUser ? normalizeUserId(toUser) : null,
        amount,
        type
    );
}

function getTotalUsers() {
    return db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
}

module.exports = {
    db,
    getUser,
    updateUser,
    getLeaderboard,
    logTransaction,
    getTotalUsers,
    normalizeUserId,
};
