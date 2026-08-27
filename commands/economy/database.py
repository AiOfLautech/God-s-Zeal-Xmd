import sqlite3
import json
from config import DB_PATH, STARTING_BALANCE, MAX_BANK_CAPACITY

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        username TEXT,
        wallet INTEGER DEFAULT 1000,
        bank INTEGER DEFAULT 0,
        bank_capacity INTEGER DEFAULT 10000,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        reputation INTEGER DEFAULT 0,
        job TEXT DEFAULT NULL,
        job_level INTEGER DEFAULT 0,
        banned INTEGER DEFAULT 0,
        ban_reason TEXT DEFAULT NULL,
        vip_level INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_daily TIMESTAMP, last_weekly TIMESTAMP, last_monthly TIMESTAMP,
        last_work TIMESTAMP, last_beg TIMESTAMP, last_rob TIMESTAMP,
        last_steal TIMESTAMP, last_heist TIMESTAMP, last_pickpocket TIMESTAMP,
        last_hack TIMESTAMP, last_scam TIMESTAMP, last_smuggle TIMESTAMP,
        last_crime TIMESTAMP, last_fish TIMESTAMP, last_hunt TIMESTAMP,
        last_mine TIMESTAMP, last_chop TIMESTAMP, last_dig TIMESTAMP,
        last_race TIMESTAMP, last_duel TIMESTAMP, last_arena TIMESTAMP,
        last_lottery TIMESTAMP, last_slots TIMESTAMP, last_blackjack TIMESTAMP,
        last_roulette TIMESTAMP, last_coinflip TIMESTAMP, last_dice TIMESTAMP,
        last_poker TIMESTAMP, last_scratch TIMESTAMP, last_horserace TIMESTAMP,
        last_crash TIMESTAMP, last_bribe TIMESTAMP, last_kidnap TIMESTAMP,
        last_assassinate TIMESTAMP, last_treasure TIMESTAMP,
        last_gamble_all TIMESTAMP, last_russian_roulette TIMESTAMP,
        total_earned INTEGER DEFAULT 0, total_spent INTEGER DEFAULT 0,
        total_gambled INTEGER DEFAULT 0, total_won INTEGER DEFAULT 0,
        total_lost INTEGER DEFAULT 0, crimes_committed INTEGER DEFAULT 0,
        crimes_failed INTEGER DEFAULT 0, prestige_level INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0, losses INTEGER DEFAULT 0,
        fish_caught INTEGER DEFAULT 0, animals_hunted INTEGER DEFAULT 0,
        minerals_mined INTEGER DEFAULT 0,
        total_transferred INTEGER DEFAULT 0, total_received INTEGER DEFAULT 0,
        active_loan INTEGER DEFAULT 0, loan_amount INTEGER DEFAULT 0,
        loan_due TIMESTAMP DEFAULT NULL, loan_interest INTEGER DEFAULT 0,
        streak_daily INTEGER DEFAULT 0, streak_work INTEGER DEFAULT 0,
        jail_until TIMESTAMP DEFAULT NULL
    );
    
    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER, item_id TEXT, quantity INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
    
    CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER, vehicle_id TEXT, fuel INTEGER DEFAULT 100,
        condition INTEGER DEFAULT 100, upgrades TEXT DEFAULT '{}',
        insured INTEGER DEFAULT 0, customization TEXT DEFAULT '{}',
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
    
    CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER, property_id TEXT, level INTEGER DEFAULT 1,
        decoration TEXT DEFAULT '{}', rent_collected TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
    
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user INTEGER, to_user INTEGER, amount INTEGER,
        type TEXT, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS market_listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_id INTEGER, item_id TEXT, price INTEGER, quantity INTEGER DEFAULT 1,
        listed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES users(user_id)
    );
    
    CREATE TABLE IF NOT EXISTS gangs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE, leader_id INTEGER, bank INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1, xp INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS gang_members (
        gang_id INTEGER, user_id INTEGER, role TEXT DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (gang_id, user_id),
        FOREIGN KEY (gang_id) REFERENCES gangs(id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
    
    CREATE TABLE IF NOT EXISTS skills (
        user_id INTEGER, skill_name TEXT, level INTEGER DEFAULT 0, xp INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, skill_name),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
    
    CREATE TABLE IF NOT EXISTS achievements (
        user_id INTEGER, achievement_id TEXT,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, achievement_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
    
    CREATE TABLE IF NOT EXISTS bounties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_id INTEGER, placed_by INTEGER, amount INTEGER, active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (target_id) REFERENCES users(user_id),
        FOREIGN KEY (placed_by) REFERENCES users(user_id)
    );
    
    CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER, amount INTEGER, interest INTEGER,
        total_due INTEGER, due_at TIMESTAMP, paid INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
    
    CREATE TABLE IF NOT EXISTS bot_settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );
    """)
    conn.commit()
    conn.close()

init_db()

def get_user(user_id, username=None):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
    user = c.fetchone()
    if not user:
        c.execute("INSERT INTO users (user_id, username, wallet) VALUES (?, ?, ?)",
                  (user_id, username or "Unknown", 1000))
        conn.commit()
        c.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        user = c.fetchone()
    elif username and user['username'] != username:
        c.execute("UPDATE users SET username = ? WHERE user_id = ?", (username, user_id))
        conn.commit()
    conn.close()
    return dict(user)

def update_user(user_id, **kwargs):
    conn = get_db()
    c = conn.cursor()
    sets = ", ".join(f"{k} = ?" for k in kwargs)
    vals = list(kwargs.values()) + [user_id]
    c.execute(f"UPDATE users SET {sets} WHERE user_id = ?", vals)
    conn.commit()
    conn.close()

def add_item(user_id, item_id, quantity=1):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM inventory WHERE user_id = ? AND item_id = ?", (user_id, item_id))
    existing = c.fetchone()
    if existing:
        c.execute("UPDATE inventory SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?",
                  (quantity, user_id, item_id))
    else:
        c.execute("INSERT INTO inventory (user_id, item_id, quantity) VALUES (?, ?, ?)",
                  (user_id, item_id, quantity))
    conn.commit()
    conn.close()

def remove_item(user_id, item_id, quantity=1):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT quantity FROM inventory WHERE user_id = ? AND item_id = ?", (user_id, item_id))
    row = c.fetchone()
    if row and row["quantity"] >= quantity:
        new_qty = row["quantity"] - quantity
        if new_qty == 0:
            c.execute("DELETE FROM inventory WHERE user_id = ? AND item_id = ?", (user_id, item_id))
        else:
            c.execute("UPDATE inventory SET quantity = ? WHERE user_id = ? AND item_id = ?",
                      (new_qty, user_id, item_id))
        conn.commit()
        conn.close()
        return True
    conn.close()
    return False

def has_item(user_id, item_id, quantity=1):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT quantity FROM inventory WHERE user_id = ? AND item_id = ?", (user_id, item_id))
    row = c.fetchone()
    conn.close()
    return row and row["quantity"] >= quantity

def get_inventory(user_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT item_id, quantity FROM inventory WHERE user_id = ?", (user_id,))
    items = [dict(r) for r in c.fetchall()]
    conn.close()
    return items

def get_leaderboard(limit=10, offset=0):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT user_id, username, wallet + bank as networth FROM users WHERE banned = 0 ORDER BY networth DESC LIMIT ? OFFSET ?", (limit, offset))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows

def get_total_users():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as cnt FROM users")
    cnt = c.fetchone()['cnt']
    conn.close()
    return cnt

def get_total_economy():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COALESCE(SUM(wallet + bank), 0) as total FROM users WHERE banned = 0")
    total = c.fetchone()['total']
    conn.close()
    return total

def log_transaction(from_user, to_user, amount, tx_type):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO transactions (from_user, to_user, amount, type) VALUES (?, ?, ?, ?)",
              (from_user, to_user, amount, tx_type))
    conn.commit()
    conn.close()

def create_loan(user_id, amount, interest, total_due, due_at):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO loans (user_id, amount, interest, total_due, due_at) VALUES (?, ?, ?, ?, ?)",
              (user_id, amount, interest, total_due, due_at))
    conn.commit()
    conn.close()

def get_active_loan(user_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM loans WHERE user_id = ? AND paid = 0 ORDER BY created_at DESC LIMIT 1", (user_id,))
    loan = c.fetchone()
    conn.close()
    return dict(loan) if loan else None

def pay_loan(loan_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE loans SET paid = 1 WHERE id = ?", (loan_id,))
    conn.commit()
    conn.close()
