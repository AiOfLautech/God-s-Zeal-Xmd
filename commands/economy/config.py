import os

BOT_TOKEN = os.getenv("BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
DB_PATH = "economy.db"

# ========= ADMIN & DEV SETTINGS =========
# Add your Telegram user ID(s) here for admin access
# You can get your ID by sending /myid to @userinfobot
# Separate multiple IDs with commas: "123456,789012"
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip()]

# Developer IDs get full system access + debug commands
DEV_IDS = [int(x) for x in os.getenv("DEV_IDS", "").split(",") if x.strip()]

BOT_NAME = os.getenv("BOT_NAME", "💰 Economy Empire Bot")
BOT_USERNAME = os.getenv("BOT_USERNAME", "economy_empire_bot")
SUPPORT_CHAT = os.getenv("SUPPORT_CHAT", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "")  # Your published Lovable app URL

# ========= CLOUD SYNC (Lovable Cloud) =========
# These connect your bot to the web dashboard
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
CLOUD_SYNC_ENABLED = bool(SUPABASE_URL and SUPABASE_ANON_KEY)

# ========= BOT MEDIA =========
# Set these to URLs of your bot logo/GIF for /start command
BOT_LOGO_URL = os.getenv("BOT_LOGO_URL", "")
BOT_GIF_URL = os.getenv("BOT_GIF_URL", "")
# For video as GIF (mp4)
BOT_VIDEO_URL = os.getenv("BOT_VIDEO_URL", "")

# ========= ECONOMY SETTINGS =========
STARTING_BALANCE = 1000
DAILY_REWARD = 500
WEEKLY_REWARD = 5000
MONTHLY_REWARD = 25000
WORK_MIN = 100
WORK_MAX = 500
BEG_MIN = 10
BEG_MAX = 200
ROB_SUCCESS_CHANCE = 0.4
ROB_FINE_PERCENT = 0.3
BANK_INTEREST_RATE = 0.02
MAX_BANK_CAPACITY = 1000000
TAX_RATE = 0.05

# ========= LOAN SETTINGS =========
MAX_LOAN_MULTIPLIER = 5  # max loan = level * multiplier * 1000
LOAN_INTEREST_RATE = 0.10  # 10% interest
LOAN_DURATION_HOURS = 24  # hours to repay before penalty
LOAN_PENALTY_RATE = 0.25  # 25% penalty after expiry

# ========= TRANSFER SETTINGS =========
TRANSFER_TAX_RATE = 0.05  # 5% tax on transfers
MIN_TRANSFER = 10
MAX_TRANSFER = 1000000

# ========= COOLDOWNS (seconds) =========
COOLDOWNS = {
    "daily": 86400, "weekly": 604800, "monthly": 2592000,
    "work": 3600, "beg": 300, "rob": 7200, "steal": 5400,
    "heist": 14400, "pickpocket": 1800, "hack": 10800,
    "scam": 7200, "smuggle": 9000, "crime": 3600,
    "fish": 1800, "hunt": 3600, "mine": 2700, "chop": 2400, "dig": 1200,
    "race": 3600, "duel": 1800, "arena": 7200, "lottery": 43200,
    "slots": 60, "blackjack": 120, "roulette": 120, "coinflip": 30,
    "dice": 60, "poker": 300, "scratch": 600, "horserace": 1800, "crash": 120,
    "bribe": 7200, "kidnap": 10800, "assassinate": 14400,
    "treasure": 3600, "gamble_all": 600, "russian_roulette": 1800,
}

# ========= MESSAGE STYLING =========
CURRENCY = "💵"
HEADER_LINE = "━━━━━━━━━━━━━━━━━━━━━━"
DIVIDER = "┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄"
