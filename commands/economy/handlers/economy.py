import random
from datetime import datetime, timedelta
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, ContextTypes
from database import get_user, update_user, get_leaderboard, log_transaction
from config import *
from utils import check_cooldown, add_xp
from msg_style import *

# ═══════════ TEXT BUILDERS (reusable by callbacks) ═══════════

def _balance_text(user):
    nw = user['wallet'] + user['bank']
    bar = progress_bar(user['bank'], user['bank_capacity'])
    loan_txt = ""
    if user.get('active_loan') and user.get('loan_amount', 0) > 0:
        loan_txt = f"\n  🏦 Active Loan: <b>{fmt_money(user['loan_amount'])}</b>"
    return f"""
💰 <b>{user['username']}'s Balance</b>
{HEADER}
  👛 Wallet: <b>{fmt_money(user['wallet'])}</b>
  🏦 Bank:   <b>{fmt_money(user['bank'])}</b>
  📊 Capacity: {bar}
{DIVIDER}
  💎 Net Worth: <b>{fmt_money(nw)}</b>
  ⭐ Level {user['level']} • {user['xp']} XP
  🎖️ Prestige {user['prestige_level']}{loan_txt}
{HEADER}"""

def _profile_text(user):
    from items import JOBS
    job_name = JOBS[user['job']]['name'] if user.get('job') and user['job'] in JOBS else "🚫 Unemployed"
    nw = user['wallet'] + user['bank']
    return f"""
👤 <b>{user['username']}'s Profile</b>
{HEADER}
  ⭐ Level: <b>{user['level']}</b> ({user['xp']} XP)
  🎖️ Prestige: <b>{user['prestige_level']}</b>
  💎 Net Worth: <b>{fmt_money(nw)}</b>
  💼 Job: {job_name}
{DIVIDER}
  👍 Reputation: <b>{user['reputation']}</b>
  🏆 Wins: <b>{user.get('wins', 0)}</b> | Losses: <b>{user.get('losses', 0)}</b>
  🔫 Crimes: <b>{user['crimes_committed']}</b> ({user['crimes_failed']} failed)
  🎰 Gambled: <b>{fmt_money(user['total_gambled'])}</b>
  📈 Won: <b>{fmt_money(user['total_won'])}</b>
  📉 Lost: <b>{fmt_money(user['total_lost'])}</b>
  💸 Transferred: <b>{fmt_money(user.get('total_transferred', 0))}</b>
  📥 Received: <b>{fmt_money(user.get('total_received', 0))}</b>
{HEADER}"""

def _stats_text(user):
    return info_box("YOUR STATISTICS", [
        stat_line("Total Earned", fmt_money(user['total_earned']), "📈"),
        stat_line("Total Spent", fmt_money(user['total_spent']), "📉"),
        stat_line("Total Gambled", fmt_money(user['total_gambled']), "🎰"),
        stat_line("Gambling Won", fmt_money(user['total_won']), "✅"),
        stat_line("Gambling Lost", fmt_money(user['total_lost']), "❌"),
        stat_line("Transferred", fmt_money(user.get('total_transferred', 0)), "💸"),
        stat_line("Received", fmt_money(user.get('total_received', 0)), "📥"),
        stat_line("Crimes Done", str(user['crimes_committed']), "🔫"),
        stat_line("Crimes Failed", str(user['crimes_failed']), "🚔"),
        stat_line("Fish Caught", str(user.get('fish_caught', 0)), "🎣"),
        stat_line("Animals Hunted", str(user.get('animals_hunted', 0)), "🏹"),
        stat_line("Minerals Mined", str(user.get('minerals_mined', 0)), "⛏️"),
        stat_line("Prestige Level", str(user['prestige_level']), "🎖️"),
    ], "📊")

def _leaderboard_text(page=0):
    top = get_leaderboard(10, page * 10)
    if not top:
        return error_msg("Leaderboard", "No data for this page!")
    medals = ["🥇", "🥈", "🥉"]
    lines = []
    for i, u in enumerate(top):
        idx = page * 10 + i
        prefix = medals[idx] if idx < 3 else f"<b>{idx+1}.</b>"
        lines.append(f"{prefix} {u['username']}: <b>{fmt_money(u['networth'])}</b>")
    return header_box("LEADERBOARD", "🏆") + "\n" + "\n".join(lines)

async def _claim_reward(user, reward_type, base_amount):
    cd = COOLDOWNS[reward_type]
    can, remaining = check_cooldown(user, reward_type, cd)
    if not can:
        return cooldown_msg(reward_type.title(), remaining)
    streak_bonus = min(user.get('prestige_level', 0) * 100, 1000) if reward_type == "daily" else 0
    reward = base_amount + streak_bonus
    update_user(user['user_id'], 
                wallet=user['wallet'] + reward,
                **{f"last_{reward_type}": datetime.now().isoformat()})
    xp_map = {"daily": 25, "weekly": 100, "monthly": 500}
    add_xp(user['user_id'], xp_map.get(reward_type, 25))
    bonus_text = f"+{fmt_money(streak_bonus)} prestige bonus" if streak_bonus > 0 else ""
    return reward_msg(f"{reward_type.title()} Claimed!", reward, bonus_text)

# ═══════════ COMMAND HANDLERS ═══════════

async def balance(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    if user.get('banned'):
        await update.message.reply_text("🚫 Your account is banned.", parse_mode="HTML")
        return
    text = _balance_text(user)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=balance_kb())

async def daily(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    text = await _claim_reward(user, "daily", DAILY_REWARD)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=daily_rewards_kb())

async def weekly(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    text = await _claim_reward(user, "weekly", WEEKLY_REWARD)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=daily_rewards_kb())

async def monthly(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    text = await _claim_reward(user, "monthly", MONTHLY_REWARD)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=daily_rewards_kb())

async def work(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "work", COOLDOWNS["work"])
    if not can:
        await update.message.reply_text(cooldown_msg("Work", remaining), parse_mode="HTML")
        return
    from items import JOBS
    job = user.get('job')
    if job and job in JOBS:
        salary = JOBS[job]['salary']
        bonus = random.randint(0, salary // 2)
        earnings = salary + bonus
        job_name = JOBS[job]['name']
        text = f"""
💼 <b>WORK COMPLETE</b>
{HEADER}
  👔 Job: {job_name}
  💰 Salary: <b>{fmt_money(salary)}</b>
  🎁 Bonus: <b>{fmt_money(bonus)}</b>
  💵 Total: <b>{fmt_money(earnings)}</b>
{HEADER}"""
    else:
        earnings = random.randint(WORK_MIN, WORK_MAX)
        scenarios = ["cleaned offices", "delivered packages", "washed dishes", "mowed lawns", "walked dogs", "painted fences", "sorted mail", "tutored students"]
        text = f"""
💼 <b>ODD JOB COMPLETE</b>
{HEADER}
  📋 Task: {random.choice(scenarios).title()}
  💵 Earned: <b>{fmt_money(earnings)}</b>
{DIVIDER}
  💡 <i>Tip: Use /apply to get a real job!</i>
{HEADER}"""
    update_user(user['user_id'], wallet=user['wallet'] + earnings,
                last_work=datetime.now().isoformat(),
                total_earned=user['total_earned'] + earnings)
    add_xp(user['user_id'], 15)
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton("💼 Jobs", callback_data="info_jobs"),
         InlineKeyboardButton("💰 Balance", callback_data="cmd_balance")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ])
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=kb)

async def beg(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "beg", COOLDOWNS["beg"])
    if not can:
        await update.message.reply_text(cooldown_msg("Beg", remaining), parse_mode="HTML")
        return
    if random.random() < 0.7:
        earnings = random.randint(BEG_MIN, BEG_MAX)
        donors = ["a kind stranger 🧓", "a rich businessman 🤵", "an old lady 👵", "a tourist 🧳", "a celebrity ⭐"]
        update_user(user['user_id'], wallet=user['wallet'] + earnings, last_beg=datetime.now().isoformat())
        text = success_msg("Someone Helped!", f"  🙏 {random.choice(donors)} gave you <b>{fmt_money(earnings)}</b>")
    else:
        update_user(user['user_id'], last_beg=datetime.now().isoformat())
        text = error_msg("No Luck", "  😔 Nobody gave you anything...")
    add_xp(user['user_id'], 5)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def deposit(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    args = ctx.args
    if not args:
        await update.message.reply_text(
            info_box("Deposit", [
                "Usage: <code>/deposit [amount|all]</code>",
                f"Wallet: {fmt_money(user['wallet'])}",
                f"Bank Space: {fmt_money(user['bank_capacity'] - user['bank'])}",
            ], "🏦"), parse_mode="HTML", reply_markup=balance_kb())
        return
    amount = user['wallet'] if args[0].lower() == "all" else int(args[0])
    if amount <= 0 or amount > user['wallet']:
        await update.message.reply_text(error_msg("Invalid Amount", "Check your wallet balance!"), parse_mode="HTML")
        return
    space = user['bank_capacity'] - user['bank']
    amount = min(amount, space)
    if amount <= 0:
        await update.message.reply_text(error_msg("Bank Full", "Upgrade your bank: /bankupgrade"), parse_mode="HTML")
        return
    update_user(user['user_id'], wallet=user['wallet'] - amount, bank=user['bank'] + amount)
    await update.message.reply_text(
        success_msg("Deposited!", f"  💰 Amount: <b>{fmt_money(amount)}</b>"),
        parse_mode="HTML", reply_markup=balance_kb())

async def withdraw(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    args = ctx.args
    if not args:
        await update.message.reply_text(
            info_box("Withdraw", [
                "Usage: <code>/withdraw [amount|all]</code>",
                f"Bank: {fmt_money(user['bank'])}",
            ], "🏦"), parse_mode="HTML", reply_markup=balance_kb())
        return
    amount = user['bank'] if args[0].lower() == "all" else int(args[0])
    if amount <= 0 or amount > user['bank']:
        await update.message.reply_text(error_msg("Invalid Amount", "Check your bank balance!"), parse_mode="HTML")
        return
    update_user(user['user_id'], wallet=user['wallet'] + amount, bank=user['bank'] - amount)
    await update.message.reply_text(
        success_msg("Withdrawn!", f"  💰 Amount: <b>{fmt_money(amount)}</b>"),
        parse_mode="HTML", reply_markup=balance_kb())

async def leaderboard(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    text = _leaderboard_text(0)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=leaderboard_kb(0))

async def profile(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    text = _profile_text(user)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=profile_kb(user['user_id']))

async def networth(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    nw = user['wallet'] + user['bank']
    await update.message.reply_text(
        f"💎 <b>Net Worth:</b> {fmt_money(nw)}", parse_mode="HTML", reply_markup=back_to_menu_kb())

def register_economy_handlers(app):
    for cmd, fn in [
        ("balance", balance), ("bal", balance), ("daily", daily), ("weekly", weekly),
        ("monthly", monthly), ("work", work), ("beg", beg), ("deposit", deposit), ("dep", deposit),
        ("withdraw", withdraw), ("with", withdraw),
        ("leaderboard", leaderboard), ("lb", leaderboard),
        ("profile", profile), ("networth", networth), ("nw", networth),
    ]:
        app.add_handler(CommandHandler(cmd, fn))
