"""
Admin & Developer commands for bot management.
Admins: ADMIN_IDS — Devs: DEV_IDS (superset of admin)
"""
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, ContextTypes
from database import get_user, update_user, get_db, get_total_users, get_total_economy
from config import ADMIN_IDS, DEV_IDS, BOT_NAME
from msg_style import *

def is_admin(user_id):
    return user_id in ADMIN_IDS or user_id in DEV_IDS

def is_dev(user_id):
    return user_id in DEV_IDS

async def admin(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("🚫 Admin only!", parse_mode="HTML")
        return
    dev_section = ""
    if is_dev(update.effective_user.id):
        dev_section = f"""
{DIVIDER}
  🔧 <b>Developer Commands:</b>
  /dev — Developer panel
  /devstats — System diagnostics
  /forceadd — Force add money (no limits)
  /wipe — Wipe user completely
  /globalreset — Reset all users ⚠️"""
    
    text = f"""
🔧 <b>ADMIN PANEL — {BOT_NAME}</b>
{HEADER}
  👑 Welcome, Admin!
{DIVIDER}
  📊 /botstats — Bot statistics
  💰 /addmoney — Add money to user
  💸 /removemoney — Remove money from user
  🚫 /ban — Ban a user
  ✅ /unban — Unban a user
  📢 /broadcast — Send message to all
  🔄 /resetuser — Reset user data
  👤 /userinfo — View user details
  ⚙️ /setlevel — Set user level
  🎖️ /setvip — Set VIP status
  🏦 /canceloan — Cancel a user's loan{dev_section}
{HEADER}"""
    kb = admin_menu_kb()
    if is_dev(update.effective_user.id):
        kb = InlineKeyboardMarkup([
            *admin_menu_kb().inline_keyboard,
            [InlineKeyboardButton("🔧 Dev Panel", callback_data="cmd_dev")],
        ])
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=kb)

async def dev(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_dev(update.effective_user.id):
        await update.message.reply_text("🚫 Developer only!", parse_mode="HTML")
        return
    text = f"""
🔧 <b>DEVELOPER PANEL</b>
{HEADER}
  🛠️ Full system access
{DIVIDER}
  /devstats — System diagnostics
  /forceadd [user_id] [amount] — Force add money
  /wipe [user_id] — Wipe user completely
  /globalreset — Reset all users ⚠️
  /seteconomy [total] — Set total economy
  /debug — Debug info
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=dev_menu_kb())

async def botstats(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id): return
    total_users = get_total_users()
    total_economy = get_total_economy()
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as cnt FROM users WHERE banned = 1")
    banned = c.fetchone()['cnt']
    c.execute("SELECT COUNT(*) as cnt FROM transactions")
    transactions = c.fetchone()['cnt']
    c.execute("SELECT COUNT(*) as cnt FROM gangs")
    gangs = c.fetchone()['cnt']
    c.execute("SELECT COUNT(*) as cnt FROM loans WHERE paid = 0")
    active_loans = c.fetchone()['cnt']
    c.execute("SELECT COALESCE(SUM(total_due), 0) as total FROM loans WHERE paid = 0")
    loan_total = c.fetchone()['total']
    conn.close()
    
    text = f"""
📊 <b>BOT STATISTICS</b>
{HEADER}
  👥 Total Users: <b>{total_users:,}</b>
  🚫 Banned: <b>{banned}</b>
  💰 Total Economy: <b>{fmt_money(total_economy)}</b>
  📝 Transactions: <b>{transactions:,}</b>
  🔥 Gangs: <b>{gangs}</b>
  🏦 Active Loans: <b>{active_loans}</b>
  💸 Loan Outstanding: <b>{fmt_money(loan_total)}</b>
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=admin_menu_kb())

async def addmoney(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id): return
    if update.message.reply_to_message:
        target_id = update.message.reply_to_message.from_user.id
        target_name = update.message.reply_to_message.from_user.first_name
    elif ctx.args and len(ctx.args) >= 2:
        target_id = int(ctx.args[0])
        target_name = f"User {target_id}"
        ctx.args = ctx.args[1:]
    else:
        await update.message.reply_text(info_box("Add Money", ["Reply to user: <code>/addmoney [amount]</code>", "Or: <code>/addmoney [user_id] [amount]</code>"], "💰"), parse_mode="HTML")
        return
    amount = int(ctx.args[0]) if ctx.args else 0
    if amount <= 0:
        await update.message.reply_text(error_msg("Invalid", "Amount must be positive!"), parse_mode="HTML")
        return
    user = get_user(target_id, target_name)
    update_user(target_id, wallet=user['wallet'] + amount)
    text = success_msg("Money Added!", f"  👤 User: <b>{target_name}</b>\n  💰 Added: <b>{fmt_money(amount)}</b>\n  👛 New Balance: <b>{fmt_money(user['wallet'] + amount)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=admin_menu_kb())

async def removemoney(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id): return
    if update.message.reply_to_message:
        target_id = update.message.reply_to_message.from_user.id
        target_name = update.message.reply_to_message.from_user.first_name
    elif ctx.args and len(ctx.args) >= 2:
        target_id = int(ctx.args[0])
        target_name = f"User {target_id}"
        ctx.args = ctx.args[1:]
    else:
        await update.message.reply_text(info_box("Remove Money", ["Reply: <code>/removemoney [amount]</code>"], "💸"), parse_mode="HTML")
        return
    amount = int(ctx.args[0]) if ctx.args else 0
    if amount <= 0:
        await update.message.reply_text(error_msg("Invalid", "Amount must be positive!"), parse_mode="HTML")
        return
    user = get_user(target_id, target_name)
    new_wallet = max(0, user['wallet'] - amount)
    update_user(target_id, wallet=new_wallet)
    text = success_msg("Money Removed!", f"  👤 User: <b>{target_name}</b>\n  💸 Removed: <b>{fmt_money(amount)}</b>\n  👛 New Balance: <b>{fmt_money(new_wallet)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=admin_menu_kb())

async def ban(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id): return
    if not update.message.reply_to_message and (not ctx.args):
        await update.message.reply_text(info_box("Ban User", ["Reply: <code>/ban [reason]</code>", "Or: <code>/ban [user_id] [reason]</code>"], "🚫"), parse_mode="HTML")
        return
    if update.message.reply_to_message:
        target_id = update.message.reply_to_message.from_user.id
        target_name = update.message.reply_to_message.from_user.first_name
        reason = " ".join(ctx.args) if ctx.args else "No reason"
    else:
        target_id = int(ctx.args[0])
        target_name = f"User {target_id}"
        reason = " ".join(ctx.args[1:]) if len(ctx.args) > 1 else "No reason"
    update_user(target_id, banned=1, ban_reason=reason)
    text = f"""
🚫 <b>USER BANNED</b>
{HEADER}
  👤 User: <b>{target_name}</b> ({target_id})
  📋 Reason: <b>{reason}</b>
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=admin_menu_kb())

async def unban(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id): return
    if not update.message.reply_to_message and (not ctx.args):
        await update.message.reply_text(info_box("Unban", ["Reply: <code>/unban</code>", "Or: <code>/unban [user_id]</code>"], "✅"), parse_mode="HTML")
        return
    if update.message.reply_to_message:
        target_id = update.message.reply_to_message.from_user.id
        target_name = update.message.reply_to_message.from_user.first_name
    else:
        target_id = int(ctx.args[0])
        target_name = f"User {target_id}"
    update_user(target_id, banned=0, ban_reason=None)
    text = success_msg("User Unbanned!", f"  👤 <b>{target_name}</b> ({target_id}) is unbanned!")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=admin_menu_kb())

async def broadcast(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id): return
    if not ctx.args:
        await update.message.reply_text(info_box("Broadcast", ["Usage: <code>/broadcast [message]</code>", "Sends to all users"], "📢"), parse_mode="HTML")
        return
    message = " ".join(ctx.args)
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT user_id FROM users WHERE banned = 0")
    users = c.fetchall()
    conn.close()
    sent, failed = 0, 0
    for u in users:
        try:
            await ctx.bot.send_message(u['user_id'], f"""
📢 <b>BROADCAST</b>
{HEADER}
{message}
{HEADER}""", parse_mode="HTML")
            sent += 1
        except:
            failed += 1
    text = success_msg("Broadcast Sent!", f"  ✅ Delivered: <b>{sent}</b>\n  ❌ Failed: <b>{failed}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=admin_menu_kb())

async def resetuser(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id): return
    if not update.message.reply_to_message and (not ctx.args):
        await update.message.reply_text(info_box("Reset User", ["Reply: <code>/resetuser</code>", "Or: <code>/resetuser [user_id]</code>"], "🔄"), parse_mode="HTML")
        return
    target_id = update.message.reply_to_message.from_user.id if update.message.reply_to_message else int(ctx.args[0])
    update_user(target_id, wallet=1000, bank=0, bank_capacity=10000, xp=0, level=1,
                reputation=0, job=None, prestige_level=0, total_earned=0, total_spent=0,
                total_gambled=0, total_won=0, total_lost=0, crimes_committed=0, crimes_failed=0,
                active_loan=0, loan_amount=0, total_transferred=0, total_received=0)
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM inventory WHERE user_id = ?", (target_id,))
    c.execute("DELETE FROM vehicles WHERE user_id = ?", (target_id,))
    c.execute("DELETE FROM properties WHERE user_id = ?", (target_id,))
    c.execute("DELETE FROM loans WHERE user_id = ?", (target_id,))
    conn.commit()
    conn.close()
    text = success_msg("User Reset!", f"  🔄 User <b>{target_id}</b> has been fully reset!")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=admin_menu_kb())

async def userinfo(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id): return
    if not update.message.reply_to_message and (not ctx.args):
        await update.message.reply_text(info_box("User Info", ["Reply or: <code>/userinfo [user_id]</code>"], "👤"), parse_mode="HTML")
        return
    target_id = update.message.reply_to_message.from_user.id if update.message.reply_to_message else int(ctx.args[0])
    user = get_user(target_id)
    from database import get_active_loan
    loan = get_active_loan(target_id)
    loan_text = f"\n  🏦 Active Loan: <b>{fmt_money(loan['total_due'])}</b>" if loan else "\n  🏦 No active loan"
    text = f"""
👤 <b>USER INFO (ADMIN)</b>
{HEADER}
  🆔 ID: <code>{user['user_id']}</code>
  📛 Name: <b>{user['username']}</b>
  👛 Wallet: <b>{fmt_money(user['wallet'])}</b>
  🏦 Bank: <b>{fmt_money(user['bank'])}</b>
  ⭐ Level: <b>{user['level']}</b>
  🎖️ Prestige: <b>{user['prestige_level']}</b>
  🚫 Banned: <b>{'Yes' if user.get('banned') else 'No'}</b>
  ⭐ VIP: <b>{user.get('vip_level', 0)}</b>
  💸 Transferred: <b>{fmt_money(user.get('total_transferred', 0))}</b>
  📥 Received: <b>{fmt_money(user.get('total_received', 0))}</b>{loan_text}
  📅 Joined: <b>{user.get('created_at', 'N/A')}</b>
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=admin_menu_kb())

async def setlevel(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id): return
    if update.message.reply_to_message and ctx.args:
        target_id = update.message.reply_to_message.from_user.id
        level = int(ctx.args[0])
    elif ctx.args and len(ctx.args) >= 2:
        target_id = int(ctx.args[0])
        level = int(ctx.args[1])
    else:
        await update.message.reply_text(info_box("Set Level", ["Reply: <code>/setlevel [level]</code>"], "⚙️"), parse_mode="HTML")
        return
    update_user(target_id, level=level)
    text = success_msg("Level Set!", f"  👤 User {target_id} → Level <b>{level}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=admin_menu_kb())

async def setvip(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id): return
    if update.message.reply_to_message and ctx.args:
        target_id = update.message.reply_to_message.from_user.id
        vip = int(ctx.args[0])
    elif ctx.args and len(ctx.args) >= 2:
        target_id = int(ctx.args[0])
        vip = int(ctx.args[1])
    else:
        await update.message.reply_text(info_box("Set VIP", ["Reply: <code>/setvip [level 0-3]</code>"], "🎖️"), parse_mode="HTML")
        return
    update_user(target_id, vip_level=vip)
    text = success_msg("VIP Set!", f"  👤 User {target_id} → VIP <b>{vip}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=admin_menu_kb())

async def canceloan(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id): return
    if not update.message.reply_to_message and (not ctx.args):
        await update.message.reply_text(info_box("Cancel Loan", ["Reply: <code>/canceloan</code>", "Or: <code>/canceloan [user_id]</code>"], "🏦"), parse_mode="HTML")
        return
    target_id = update.message.reply_to_message.from_user.id if update.message.reply_to_message else int(ctx.args[0])
    from database import get_active_loan, pay_loan
    loan = get_active_loan(target_id)
    if not loan:
        await update.message.reply_text(error_msg("No Loan", "User has no active loan!"), parse_mode="HTML")
        return
    pay_loan(loan['id'])
    update_user(target_id, active_loan=0, loan_amount=0)
    text = success_msg("Loan Cancelled!", f"  🏦 User {target_id}'s loan of {fmt_money(loan['total_due'])} cancelled!")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=admin_menu_kb())

def register_admin_handlers(app):
    for cmd, fn in [
        ("admin", admin), ("dev", dev), ("botstats", botstats), ("addmoney", addmoney),
        ("removemoney", removemoney), ("ban", ban), ("unban", unban),
        ("broadcast", broadcast), ("resetuser", resetuser), ("userinfo", userinfo),
        ("setlevel", setlevel), ("setvip", setvip), ("canceloan", canceloan),
    ]:
        app.add_handler(CommandHandler(cmd, fn))
