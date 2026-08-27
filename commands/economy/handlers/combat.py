import random
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, ContextTypes
from database import get_user, update_user, has_item, get_db
from utils import add_xp, check_cooldown
from config import COOLDOWNS
from msg_style import *

async def duel(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not update.message.reply_to_message:
        await update.message.reply_text(
            info_box("Duel", ["Reply to someone: <code>/duel [bet]</code>", "Weapons increase win chance!", "🔪 +10% | 🏏 +15% | 🔫 +25% | 🎯 +35% | ⚔️ +45% | 🚀 +60%"], "⚔️"),
            parse_mode="HTML", reply_markup=combat_menu_kb())
        return
    args = ctx.args
    bet = int(args[0]) if args else 100
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "duel", COOLDOWNS["duel"])
    if not can:
        await update.message.reply_text(cooldown_msg("Duel", remaining), parse_mode="HTML")
        return
    if bet > user['wallet']:
        await update.message.reply_text(error_msg("Not Enough", "Can't afford that bet!"), parse_mode="HTML")
        return
    opponent = get_user(update.message.reply_to_message.from_user.id, update.message.reply_to_message.from_user.first_name)
    if bet > opponent['wallet']:
        await update.message.reply_text(error_msg("Opponent Broke", "They can't afford that bet!"), parse_mode="HTML")
        return
    from datetime import datetime
    update_user(user['user_id'], last_duel=datetime.now().isoformat())
    power = random.randint(1, 100)
    opp_power = random.randint(1, 100)
    weapon_bonus = 0
    if has_item(user['user_id'], "rpg"): weapon_bonus = 60
    elif has_item(user['user_id'], "katana"): weapon_bonus = 45
    elif has_item(user['user_id'], "rifle"): weapon_bonus = 35
    elif has_item(user['user_id'], "pistol"): weapon_bonus = 25
    elif has_item(user['user_id'], "baseball_bat"): weapon_bonus = 15
    elif has_item(user['user_id'], "knife"): weapon_bonus = 10
    power += weapon_bonus
    p1_name = update.effective_user.first_name
    p2_name = update.message.reply_to_message.from_user.first_name
    if power > opp_power:
        update_user(user['user_id'], wallet=user['wallet'] + bet, wins=user.get('wins', 0) + 1)
        update_user(opponent['user_id'], wallet=opponent['wallet'] - bet, losses=opponent.get('losses', 0) + 1)
        add_xp(user['user_id'], 30)
        text = battle_result(p1_name, p2_name, bet, f"⚔️ {power} vs {opp_power} (weapon +{weapon_bonus})")
    else:
        update_user(user['user_id'], wallet=user['wallet'] - bet, losses=user.get('losses', 0) + 1)
        update_user(opponent['user_id'], wallet=opponent['wallet'] + bet, wins=opponent.get('wins', 0) + 1)
        text = battle_result(p2_name, p1_name, bet, f"⚔️ {opp_power} vs {power} (weapon +{weapon_bonus})")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=combat_menu_kb())

async def arena(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "arena", COOLDOWNS["arena"])
    if not can:
        await update.message.reply_text(cooldown_msg("Arena", remaining), parse_mode="HTML")
        return
    args = ctx.args
    bet = int(args[0]) if args else 500
    if bet > user['wallet']:
        await update.message.reply_text(error_msg("Not Enough", "Can't afford that bet!"), parse_mode="HTML")
        return
    from datetime import datetime
    update_user(user['user_id'], last_arena=datetime.now().isoformat())
    opponents = ["🤖 Iron Golem", "🧟 Zombie King", "🐉 Fire Drake", "👹 Orc Warlord", "🦹 Dark Knight", "🧙 Evil Wizard", "👻 Shadow Wraith", "🦇 Vampire Lord"]
    opp = random.choice(opponents)
    if random.random() < 0.5:
        winnings = bet * 2
        update_user(user['user_id'], wallet=user['wallet'] + winnings - bet, wins=user.get('wins', 0) + 1)
        add_xp(user['user_id'], 50)
        text = f"""
🏟️ <b>ARENA BATTLE</b>
{HEADER}
  ⚔️ <b>{update.effective_user.first_name}</b> vs <b>{opp}</b>
{DIVIDER}
  🏆 <b>VICTORY!</b>
  💰 Won: <b>{fmt_money(winnings)}</b>
  ⭐ +50 XP
{HEADER}"""
    else:
        update_user(user['user_id'], wallet=user['wallet'] - bet, losses=user.get('losses', 0) + 1)
        text = f"""
🏟️ <b>ARENA BATTLE</b>
{HEADER}
  ⚔️ <b>{update.effective_user.first_name}</b> vs <b>{opp}</b>
{DIVIDER}
  💀 <b>DEFEATED!</b>
  💸 Lost: <b>{fmt_money(bet)}</b>
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=combat_menu_kb())

async def bounty(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not update.message.reply_to_message:
        await update.message.reply_text(error_msg("Bounty", "Reply to someone: <code>/bounty [amount]</code>"), parse_mode="HTML")
        return
    args = ctx.args
    amount = int(args[0]) if args else 1000
    user = get_user(update.effective_user.id)
    if amount > user['wallet'] or amount < 100:
        await update.message.reply_text(error_msg("Invalid", "Min \$100, and enough wallet!"), parse_mode="HTML")
        return
    target_id = update.message.reply_to_message.from_user.id
    update_user(user['user_id'], wallet=user['wallet'] - amount)
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO bounties (target_id, placed_by, amount) VALUES (?, ?, ?)",
              (target_id, user['user_id'], amount))
    conn.commit()
    conn.close()
    text = f"""
💀 <b>BOUNTY PLACED</b>
{HEADER}
  🎯 Target: <b>{update.message.reply_to_message.from_user.first_name}</b>
  💰 Reward: <b>{fmt_money(amount)}</b>
  📋 Kill/defeat them to claim!
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=combat_menu_kb())

async def bountylist(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT b.*, u.username FROM bounties b JOIN users u ON b.target_id = u.user_id WHERE b.active = 1 ORDER BY b.amount DESC LIMIT 10")
    bounties = c.fetchall()
    conn.close()
    if not bounties:
        text = info_box("BOUNTY BOARD", ["No active bounties!", "Place one: /bounty"], "💀")
    else:
        lines = [f"🎯 {b['username']} — <b>{fmt_money(b['amount'])}</b>" for b in bounties]
        text = info_box("BOUNTY BOARD", lines, "💀")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=combat_menu_kb())

async def defend(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    defenses = []
    if has_item(user['user_id'], "body_armor"): defenses.append("🛡️ Body Armor (-30% damage)")
    if has_item(user['user_id'], "shield"): defenses.append("🛡️ Shield Token (rob protection)")
    if not defenses:
        text = info_box("DEFENSES", ["❌ No defensive items!", "Buy from /shop weapons"], "🛡️")
    else:
        text = info_box("YOUR DEFENSES", defenses, "🛡️")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=combat_menu_kb())

def register_combat_handlers(app):
    for cmd, fn in [
        ("duel", duel), ("fight", duel), ("pvp", duel),
        ("arena", arena), ("tournament", arena),
        ("bounty", bounty), ("bountylist", bountylist), ("bounties", bountylist),
        ("defend", defend),
    ]:
        app.add_handler(CommandHandler(cmd, fn))
