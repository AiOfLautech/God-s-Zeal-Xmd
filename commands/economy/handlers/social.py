from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, ContextTypes
from database import get_user, update_user, get_db, get_inventory
from items import JOBS, SKILLS, ACHIEVEMENTS
from utils import add_xp
from msg_style import *

def _achievements_text(user):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT achievement_id FROM achievements WHERE user_id = ?", (user['user_id'],))
    unlocked = set(r['achievement_id'] for r in c.fetchall())
    conn.close()
    lines = []
    for k, v in ACHIEVEMENTS.items():
        status = "✅" if k in unlocked else "🔒"
        lines.append(f"{status} <b>{v['name']}</b> — {v['desc']} (${v['reward']:,})")
    return info_box("ACHIEVEMENTS", lines, "🏆")

def _skills_text(user):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM skills WHERE user_id = ?", (user['user_id'],))
    user_skills = {r['skill_name']: r for r in c.fetchall()}
    conn.close()
    lines = []
    for k, v in SKILLS.items():
        s = user_skills.get(k)
        level = s['level'] if s else 0
        xp = s['xp'] if s else 0
        bar = progress_bar(xp, (level + 1) * 100, 8)
        lines.append(f"{v['name']} Lv.{level} {bar}")
    return info_box("YOUR SKILLS", lines, "🎯")

async def rep(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not update.message.reply_to_message:
        await update.message.reply_text(error_msg("Rep", "Reply to someone: <code>/rep</code>"), parse_mode="HTML")
        return
    target = get_user(update.message.reply_to_message.from_user.id, update.message.reply_to_message.from_user.first_name)
    user = get_user(update.effective_user.id)
    if user['user_id'] == target['user_id']:
        await update.message.reply_text(error_msg("Error", "Can't rep yourself!"), parse_mode="HTML")
        return
    update_user(target['user_id'], reputation=target['reputation'] + 1)
    text = success_msg("Reputation Given!", f"  👍 +1 rep to <b>{update.message.reply_to_message.from_user.first_name}</b>\n  ⭐ Their rep: <b>{target['reputation'] + 1}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def apply(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    args = ctx.args
    if not args:
        text = header_box("AVAILABLE JOBS", "💼") + "\n"
        for k, v in JOBS.items():
            locked = "🔒" if user['level'] < v['level_req'] else "✅"
            text += f"\n  {locked} {v['name']} — {fmt_money(v['salary'])}/work\n    Level {v['level_req']} required\n    └ <code>/apply {k}</code>"
        kb = InlineKeyboardMarkup([
            [InlineKeyboardButton("💼 Current Job", callback_data="cmd_profile")],
            [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
        ])
        await update.message.reply_text(text, parse_mode="HTML", reply_markup=kb)
        return
    job_id = args[0].lower()
    if job_id not in JOBS:
        await update.message.reply_text(error_msg("Not Found", "Job doesn't exist!"), parse_mode="HTML")
        return
    job = JOBS[job_id]
    if user['level'] < job['level_req']:
        await update.message.reply_text(error_msg("Level Too Low", f"Need level <b>{job['level_req']}</b>!"), parse_mode="HTML")
        return
    update_user(user['user_id'], job=job_id)
    text = success_msg("Hired!", f"  💼 You are now a {job['name']}!\n  💰 Salary: {fmt_money(job['salary'])}/work")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def resign(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id)
    if not user.get('job'):
        await update.message.reply_text(error_msg("No Job", "You're already unemployed!"), parse_mode="HTML")
        return
    update_user(user['user_id'], job=None)
    text = success_msg("Resigned!", "  🚪 You quit your job!")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def creategang(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args:
        await update.message.reply_text(info_box("Create Gang", ["Usage: <code>/creategang [name]</code>", "Costs \$10,000"], "🔥"), parse_mode="HTML")
        return
    name = " ".join(args)
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    if user['wallet'] < 10000:
        await update.message.reply_text(error_msg("Not Enough", "Costs \$10,000!"), parse_mode="HTML")
        return
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("INSERT INTO gangs (name, leader_id) VALUES (?, ?)", (name, user['user_id']))
        gang_id = c.lastrowid
        c.execute("INSERT INTO gang_members (gang_id, user_id, role) VALUES (?, ?, 'leader')", (gang_id, user['user_id']))
        conn.commit()
        update_user(user['user_id'], wallet=user['wallet'] - 10000)
        text = success_msg("Gang Created!", f"  🔥 <b>{name}</b> is born!\n  👑 You are the leader!")
    except:
        text = error_msg("Name Taken", "That gang name already exists!")
    conn.close()
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def achievements(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    text = _achievements_text(user)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def prestige(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    if user['level'] < 50:
        await update.message.reply_text(error_msg("Not Ready", f"Need level <b>50</b>! (You: {user['level']})"), parse_mode="HTML")
        return
    new_prestige = user['prestige_level'] + 1
    bonus = new_prestige * 10000
    update_user(user['user_id'], level=1, xp=0, prestige_level=new_prestige, wallet=user['wallet'] + bonus)
    text = f"""
🎖️ <b>PRESTIGE {new_prestige}!</b>
{HEADER}
  ⭐ Reset to Level 1
  🎁 Bonus: <b>{fmt_money(bonus)}</b>
  📈 +{fmt_money(100)} daily bonus
  🏆 New prestige perks unlocked!
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def train(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    args = ctx.args
    if not args:
        text = _skills_text(user)
        text += f"\n\n💡 Train: <code>/train [skill_name]</code>"
        await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())
        return
    skill_name = args[0].lower()
    if skill_name not in SKILLS:
        await update.message.reply_text(error_msg("Not Found", "Skill doesn't exist!"), parse_mode="HTML")
        return
    cost = 500
    if user['wallet'] < cost:
        await update.message.reply_text(error_msg("No Money", f"Training costs {fmt_money(cost)}!"), parse_mode="HTML")
        return
    update_user(user['user_id'], wallet=user['wallet'] - cost)
    import random
    xp_gained = random.randint(20, 50)
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM skills WHERE user_id = ? AND skill_name = ?", (user['user_id'], skill_name))
    existing = c.fetchone()
    if existing:
        new_xp = existing['xp'] + xp_gained
        level = existing['level']
        needed = (level + 1) * 100
        if new_xp >= needed:
            new_xp -= needed
            level += 1
        c.execute("UPDATE skills SET xp = ?, level = ? WHERE user_id = ? AND skill_name = ?", (new_xp, level, user['user_id'], skill_name))
    else:
        c.execute("INSERT INTO skills (user_id, skill_name, xp, level) VALUES (?, ?, ?, 0)", (user['user_id'], skill_name, xp_gained))
    conn.commit()
    conn.close()
    text = success_msg("Training Complete!", f"  🎯 {SKILLS[skill_name]['name']}\n  ⭐ +{xp_gained} skill XP\n  💰 Cost: {fmt_money(cost)}")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

def register_social_handlers(app):
    for cmd, fn in [
        ("rep", rep), ("apply", apply), ("jobs", apply), ("resign", resign), ("quit", resign),
        ("creategang", creategang), ("achievements", achievements), ("ach", achievements),
        ("prestige", prestige), ("train", train), ("skills", train),
    ]:
        app.add_handler(CommandHandler(cmd, fn))
