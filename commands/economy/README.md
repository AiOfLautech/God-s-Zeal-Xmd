# 🎮 Economy Empire Bot — Telegram

A feature-rich economy bot for Telegram groups with **150+ commands**, beautiful styled messages, inline keyboards, and admin/dev controls!

## ✨ Features
- **💰 Economy** — Balance, daily/weekly/monthly rewards, work, beg
- **💸 Transfers** — Send money to other players, donate, transfer history
- **🏦 Loans** — Borrow money with interest, repay within time limit, late penalties
- **🔫 Crime** — 16 crime types (rob, heist, hack, bribe, kidnap, assassinate, treasure hunt...)
- **🎰 Gambling** — 12 games (slots, blackjack, roulette, poker, crash, russian roulette, gamble all...)
- **🛒 Shopping** — 50+ items, player market, vehicle & property shops
- **🚗 Vehicles** — Buy, fuel, drive, race, repair, insure (12 vehicles)
- **🏠 Properties** — Buy, collect rent, upgrade (10 properties)
- **⚔️ Combat** — PvP duels, arena, bounties with weapon bonuses
- **🎣 Gathering** — Fish, hunt, mine, chop, dig (5 activities)
- **👥 Social** — Reputation, 10 jobs, gangs, achievements, prestige, skills
- **🔧 Admin** — Ban/unban, add/remove money, broadcast, user management, loan management
- **🛠️ Developer** — System diagnostics, force operations, debug tools

## 🎨 Bot Message Style
- Beautiful HTML formatted messages with Unicode borders
- Inline keyboards on every command for easy navigation
- Progress bars for fuel, condition, bank capacity
- Category-based menus and sub-menus
- Play-again buttons on gambling games
- Admin & developer control panels with inline buttons
- Bot logo/GIF/video on /start command

## 🚀 Quick Setup

1. Get a Bot Token from [@BotFather](https://t.me/BotFather)
2. Install: `pip install -r requirements.txt`
3. Configure:
   ```bash
   export BOT_TOKEN="your-bot-token"
   export ADMIN_IDS="your-telegram-user-id"
   export DEV_IDS="your-telegram-user-id"
   ```
4. Run: `python main.py`

## 👑 Admin & Developer Setup

**Get your Telegram user ID:** Send /myid to the bot!

```bash
# Admin access (manage users, ban, broadcast)
export ADMIN_IDS="123456789,987654321"

# Developer access (full system control + admin)
export DEV_IDS="123456789"
```

## 🖼️ Bot Media (Optional)

```bash
# Set a logo image URL for /start
export BOT_LOGO_URL="https://example.com/logo.png"

# Or use a GIF
export BOT_GIF_URL="https://example.com/bot.gif"

# Or use a video (sent as GIF)
export BOT_VIDEO_URL="https://example.com/intro.mp4"
```

## 💸 Transfer & Loan System

- **Transfers:** Reply to someone + `/transfer [amount]` — 5% tax
- **Donations:** `/donate [amount]` — no tax!
- **Loans:** `/loan [amount]` — 10% interest, 24h to repay
- **Repay:** `/repay` — pay off your loan
- **Late penalty:** +25% if you don't pay on time!

## 🐳 Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
ENV BOT_TOKEN=your-token
ENV ADMIN_IDS=your-id
ENV DEV_IDS=your-id
ENV BOT_LOGO_URL=https://example.com/logo.png
CMD ["python", "main.py"]
```

Total: **150+ unique commands** with aliases and inline buttons!
