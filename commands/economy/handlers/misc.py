from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, ContextTypes
from database import get_user
from config import *
from msg_style import *

def _help_text():
    return f"""
📖 <b>ALL COMMANDS</b>
{HEADER}

💰 <b>Economy</b>
/balance /daily /weekly /monthly
/work /beg /deposit /withdraw
/leaderboard /profile /networth

💸 <b>Transfers & Loans</b>
/transfer /pay /send /donate
/loan /repay /loanstatus

🔫 <b>Crime (16 types!)</b>
/rob /steal /heist /pickpocket
/hack /scam /smuggle /crime
/burglary /carjack /counterfeit /launder
/bribe /kidnap /assassinate /treasure

🎰 <b>Gambling (12 games!)</b>
/slots /coinflip /blackjack /roulette
/dice /lottery /scratch /poker
/horserace /crash /russianroulette /gambleall

🛒 <b>Shopping</b>
/shop /buy /sell /inventory /gift
/market /listitem /marketbuy
/vehicleshop /propertyshop /fuelshop

🚗 <b>Vehicles</b>
/buyvehicle /sellvehicle /garage
/buyfuel /drive /race /repair /insure

🏠 <b>Properties</b>
/buyproperty /sellproperty
/myproperties /collectrent /upgradeproperty

⚔️ <b>Combat</b>
/duel /arena /bounty /bountylist /defend

🎣 <b>Gathering</b>
/fish /hunt /mine /chop /dig

👥 <b>Social</b>
/rep /apply /resign /creategang
/achievements /prestige /train

⚙️ <b>Utility</b>
/start /help /bankupgrade /stats
/cooldowns /menu /myid
{HEADER}"""

async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    webapp_btn = []
    if WEBAPP_URL:
        webapp_btn = [InlineKeyboardButton("📊 Web Stats", url=WEBAPP_URL)]
    
    text = f"""
🎮 <b>{BOT_NAME}</b>
{HEADER}

  Hey <b>{update.effective_user.first_name}</b>! 👋
  Welcome to the ultimate economy game!

  You start with <b>\$1,000</b> 💰
{DIVIDER}
  ⚡ <b>Quick Start:</b>
  /daily — Claim free money
  /work — Earn from your job
  /shop — Buy tools & items
  /balance — Check your wealth
  /transfer — Send money to friends
  /loan — Borrow money from the bank
{DIVIDER}
  🎯 Buy tools → Do crimes → Gamble
  🏠 Buy properties → Collect rent
  🚗 Buy vehicles → Race for money
  ⚔️ Duel other players → Win prizes
  💸 Transfer money to friends!
  🏦 Take loans & grow your empire!
{HEADER}"""
    
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton("💰 Balance", callback_data="cmd_balance"),
         InlineKeyboardButton("📅 Daily Rewards", callback_data="claim_daily")],
        [InlineKeyboardButton("🛒 Shop", callback_data="cmd_shop"),
         InlineKeyboardButton("🎰 Gambling", callback_data="menu_gambling")],
        [InlineKeyboardButton("💸 Transfer", callback_data="info_transfer"),
         InlineKeyboardButton("🏦 Loans", callback_data="info_loan")],
        [InlineKeyboardButton("📖 All Commands", callback_data="cmd_help"),
         InlineKeyboardButton("👤 Profile", callback_data="cmd_profile")],
        *([webapp_btn] if webapp_btn else []),
    ])
    
    # Send bot logo/gif/video if configured
    sent_media = False
    if BOT_VIDEO_URL:
        try:
            await update.message.reply_animation(BOT_VIDEO_URL, caption=text, parse_mode="HTML", reply_markup=kb)
            sent_media = True
        except: pass
    if not sent_media and BOT_GIF_URL:
        try:
            await update.message.reply_animation(BOT_GIF_URL, caption=text, parse_mode="HTML", reply_markup=kb)
            sent_media = True
        except: pass
    if not sent_media and BOT_LOGO_URL:
        try:
            await update.message.reply_photo(BOT_LOGO_URL, caption=text, parse_mode="HTML", reply_markup=kb)
            sent_media = True
        except: pass
    if not sent_media:
        await update.message.reply_text(text, parse_mode="HTML", reply_markup=kb)

async def help_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    text = _help_text()
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton("💰 Economy", callback_data="cmd_balance"),
         InlineKeyboardButton("🔫 Crime", callback_data="menu_crime")],
        [InlineKeyboardButton("🎰 Gambling", callback_data="menu_gambling"),
         InlineKeyboardButton("💸 Transfer", callback_data="info_transfer")],
        [InlineKeyboardButton("🏦 Loans", callback_data="info_loan"),
         InlineKeyboardButton("🛒 Shop", callback_data="cmd_shop")],
        [InlineKeyboardButton("🎣 Gathering", callback_data="menu_gathering"),
         InlineKeyboardButton("⚔️ Combat", callback_data="menu_combat")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ])
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=kb)

async def bankupgrade(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id)
    cost = user['bank_capacity']
    if user['wallet'] < cost:
        text = error_msg("Bank Upgrade", f"  💰 Cost: <b>{fmt_money(cost)}</b>\n  👛 You have: <b>{fmt_money(user['wallet'])}</b>\n  🏦 Current: <b>{fmt_money(user['bank_capacity'])}</b>")
        await update.message.reply_text(text, parse_mode="HTML")
        return
    from database import update_user
    new_cap = user['bank_capacity'] * 2
    update_user(user['user_id'], wallet=user['wallet'] - cost, bank_capacity=new_cap)
    text = success_msg("Bank Upgraded!", f"  🏦 New capacity: <b>{fmt_money(new_cap)}</b>\n  💰 Cost: <b>{fmt_money(cost)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=balance_kb())

async def stats(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    from handlers.economy import _stats_text
    text = _stats_text(user)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def cooldowns(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id)
    from utils import check_cooldown
    lines = []
    for name, seconds in sorted(COOLDOWNS.items()):
        can, remaining = check_cooldown(user, name, seconds)
        status = "✅ Ready" if can else f"⏰ {remaining}"
        lines.append(f"/{name}: {status}")
    text = info_box("YOUR COOLDOWNS", lines, "⏰")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def menu(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    text = header_box("MAIN MENU", "🎮") + "\n\nChoose an option:"
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=main_menu_kb())

async def myid(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    text = f"""
🆔 <b>YOUR INFO</b>
{HEADER}
  📛 Name: <b>{update.effective_user.first_name}</b>
  🆔 User ID: <code>{uid}</code>
  📋 Chat ID: <code>{update.effective_chat.id}</code>
{DIVIDER}
  💡 Use this ID for ADMIN_IDS or DEV_IDS
  in your config.py environment variables!
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

def register_misc_handlers(app):
    for cmd, fn in [
        ("start", start), ("help", help_cmd), ("commands", help_cmd),
        ("bankupgrade", bankupgrade), ("stats", stats),
        ("cooldowns", cooldowns), ("cd", cooldowns), ("menu", menu),
        ("myid", myid),
    ]:
        app.add_handler(CommandHandler(cmd, fn))
