"""
Extra crime & gambling commands with inline buttons.
"""
import random
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, ContextTypes
from database import get_user, update_user, has_item, remove_item, add_item
from config import COOLDOWNS
from utils import check_cooldown, add_xp
from msg_style import *

async def bribe(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "bribe", COOLDOWNS["bribe"])
    if not can:
        await update.message.reply_text(cooldown_msg("Bribe", remaining), parse_mode="HTML")
        return
    if not has_item(user['user_id'], "bribe_cash"):
        await update.message.reply_text(error_msg("Missing Item", "  💰 Need <b>Bribe Cash</b> from shop!"), parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🛒 Shop", callback_data="shop_tools")]]))
        return
    update_user(user['user_id'], last_bribe=datetime.now().isoformat())
    
    officials = [
        ("👮 Police Officer", 0.5, 500, 2000),
        ("🏛️ Judge", 0.35, 1000, 5000),
        ("🏢 Mayor", 0.25, 3000, 10000),
        ("👨‍💼 Senator", 0.15, 5000, 25000),
    ]
    official = random.choice(officials)
    
    if random.random() < official[1]:
        loot = random.randint(official[2], official[3])
        remove_item(user['user_id'], "bribe_cash")
        update_user(user['user_id'], wallet=user['wallet'] + loot, crimes_committed=user['crimes_committed'] + 1)
        add_xp(user['user_id'], 25)
        text = f"""
💰 <b>BRIBE SUCCESSFUL!</b>
{HEADER}
  🤝 Bribed: <b>{official[0]}</b>
  💵 Reward: <b>{fmt_money(loot)}</b>
  ✅ They looked the other way...
  ⭐ +25 XP
{HEADER}"""
    else:
        fine = random.randint(500, 3000)
        remove_item(user['user_id'], "bribe_cash")
        update_user(user['user_id'], wallet=max(0, user['wallet'] - fine), crimes_failed=user['crimes_failed'] + 1)
        text = f"""
🚔 <b>BRIBE REJECTED!</b>
{HEADER}
  ❌ {official[0]} refused your bribe!
  🚨 Reported to authorities
  💸 Fine: <b>{fmt_money(fine)}</b>
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

async def kidnap(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "kidnap", COOLDOWNS["kidnap"])
    if not can:
        await update.message.reply_text(cooldown_msg("Kidnap", remaining), parse_mode="HTML")
        return
    if not has_item(user['user_id'], "chloroform"):
        await update.message.reply_text(error_msg("Missing Item", "  💉 Need <b>Chloroform</b> from shop!"), parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🛒 Shop", callback_data="shop_tools")]]))
        return
    update_user(user['user_id'], last_kidnap=datetime.now().isoformat())
    
    targets = [
        ("💼 Businessman", 0.4, 2000, 8000),
        ("💎 Jeweler", 0.3, 5000, 15000),
        ("🏦 Banker", 0.2, 10000, 30000),
        ("👑 Royalty", 0.1, 25000, 75000),
    ]
    target = random.choice(targets)
    
    if random.random() < target[1]:
        ransom = random.randint(target[2], target[3])
        remove_item(user['user_id'], "chloroform")
        update_user(user['user_id'], wallet=user['wallet'] + ransom, crimes_committed=user['crimes_committed'] + 1)
        add_xp(user['user_id'], 40)
        text = f"""
🔪 <b>KIDNAP SUCCESS!</b>
{HEADER}
  🎯 Target: <b>{target[0]}</b>
  💰 Ransom: <b>{fmt_money(ransom)}</b>
  ✅ Collected ransom and released them
  ⭐ +40 XP
{HEADER}"""
    else:
        fine = random.randint(2000, 10000)
        remove_item(user['user_id'], "chloroform")
        update_user(user['user_id'], wallet=max(0, user['wallet'] - fine), crimes_failed=user['crimes_failed'] + 1)
        text = f"""
🚔 <b>KIDNAP FAILED!</b>
{HEADER}
  ❌ {target[0]} escaped!
  🚨 Police arrived!
  💸 Fine: <b>{fmt_money(fine)}</b>
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

async def assassinate(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "assassinate", COOLDOWNS["assassinate"])
    if not can:
        await update.message.reply_text(cooldown_msg("Assassinate", remaining), parse_mode="HTML")
        return
    if not has_item(user['user_id'], "sniper_scope"):
        await update.message.reply_text(error_msg("Missing Item", "  🔭 Need <b>Sniper Scope</b> from shop!"), parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🛒 Shop", callback_data="shop_tools")]]))
        return
    update_user(user['user_id'], last_assassinate=datetime.now().isoformat())
    
    contracts = [
        ("🐀 Snitch", 0.5, 3000, 8000),
        ("🏴‍☠️ Pirate Captain", 0.35, 8000, 20000),
        ("🦹 Villain", 0.2, 15000, 50000),
        ("👿 Kingpin", 0.1, 50000, 150000),
    ]
    contract = random.choice(contracts)
    
    if random.random() < contract[1]:
        payout = random.randint(contract[2], contract[3])
        if random.random() < 0.3: remove_item(user['user_id'], "sniper_scope")
        update_user(user['user_id'], wallet=user['wallet'] + payout, crimes_committed=user['crimes_committed'] + 1)
        add_xp(user['user_id'], 60)
        text = f"""
🎯 <b>CONTRACT COMPLETE!</b>
{HEADER}
  🎯 Target: <b>{contract[0]}</b>
  💰 Payout: <b>{fmt_money(payout)}</b>
  ✅ Clean hit, no witnesses
  ⭐ +60 XP
{HEADER}"""
    else:
        fine = random.randint(5000, 20000)
        remove_item(user['user_id'], "sniper_scope")
        update_user(user['user_id'], wallet=max(0, user['wallet'] - fine), crimes_failed=user['crimes_failed'] + 1)
        text = f"""
🚔 <b>CONTRACT FAILED!</b>
{HEADER}
  ❌ Target survived!
  🔭 Sniper Scope confiscated
  💸 Fine: <b>{fmt_money(fine)}</b>
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

async def treasure(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "treasure", COOLDOWNS["treasure"])
    if not can:
        await update.message.reply_text(cooldown_msg("Treasure", remaining), parse_mode="HTML")
        return
    if not has_item(user['user_id'], "treasure_map"):
        await update.message.reply_text(error_msg("Missing Item", "  🗺️ Need a <b>Treasure Map</b> from shop!"), parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🛒 Shop", callback_data="shop_tools")]]))
        return
    update_user(user['user_id'], last_treasure=datetime.now().isoformat())
    remove_item(user['user_id'], "treasure_map")
    
    treasures = [
        ("🪙 Pile of old coins", 500, 0.3),
        ("💰 Money chest", 2000, 0.25),
        ("💎 Gemstone cache", 5000, 0.2),
        ("👑 Ancient crown", 15000, 0.15),
        ("🏆 Legendary artifact", 50000, 0.07),
        ("💍 Cursed ring (trap!)", -3000, 0.03),
    ]
    roll = random.random()
    cumulative = 0
    found = treasures[0]
    for t in treasures:
        cumulative += t[2]
        if roll < cumulative:
            found = t
            break
    
    if found[1] > 0:
        update_user(user['user_id'], wallet=user['wallet'] + found[1], total_earned=user['total_earned'] + found[1])
        add_xp(user['user_id'], 30)
        text = f"""
🗺️ <b>TREASURE FOUND!</b>
{HEADER}
  📍 You followed the map...
  🎁 Found: <b>{found[0]}</b>
  💰 Value: <b>{fmt_money(found[1])}</b>
  ⭐ +30 XP
{HEADER}"""
    else:
        update_user(user['user_id'], wallet=max(0, user['wallet'] + found[1]))
        text = f"""
🗺️ <b>TREASURE HUNT</b>
{HEADER}
  📍 You followed the map...
  ❌ Found: <b>{found[0]}</b>
  💸 Lost: <b>{fmt_money(abs(found[1]))}</b>
  😱 It was a trap!
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

async def russian_roulette(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "russian_roulette", COOLDOWNS["russian_roulette"])
    if not can:
        await update.message.reply_text(cooldown_msg("Russian Roulette", remaining), parse_mode="HTML")
        return
    args = ctx.args
    if not args:
        await update.message.reply_text(
            info_box("Russian Roulette", [
                "Usage: <code>/russianroulette [bet]</code>",
                "1 in 6 chance to lose...",
                "Survive = 5x your bet! 🎉",
                "⚠️ Extremely risky!",
            ], "💀"), parse_mode="HTML", reply_markup=gambling_menu_kb())
        return
    bet = int(args[0])
    if bet <= 0 or bet > user['wallet']:
        await update.message.reply_text(error_msg("Invalid Bet", f"Wallet: {fmt_money(user['wallet'])}"), parse_mode="HTML")
        return
    
    update_user(user['user_id'], last_russian_roulette=datetime.now().isoformat(),
                total_gambled=user['total_gambled'] + bet)
    
    chamber = random.randint(1, 6)
    chambers_display = ["⚫"] * 6
    
    if chamber == 1:  # Bang!
        chambers_display[0] = "🔴"
        update_user(user['user_id'], wallet=user['wallet'] - bet, total_lost=user['total_lost'] + bet)
        text = f"""
💀 <b>RUSSIAN ROULETTE</b>
{HEADER}
  🔫 Spinning the cylinder...
  {' '.join(chambers_display)}
  
  💥 <b>BANG! You're out!</b>
  💸 Lost: <b>{fmt_money(bet)}</b>
{HEADER}"""
    else:
        winnings = bet * 5
        chambers_display[chamber-1] = "🔴"
        update_user(user['user_id'], wallet=user['wallet'] + winnings - bet, total_won=user['total_won'] + winnings)
        text = f"""
💀 <b>RUSSIAN ROULETTE</b>
{HEADER}
  🔫 Spinning the cylinder...
  {' '.join(chambers_display)}
  
  ✅ <b>*CLICK* — You survived!</b>
  💰 Won: <b>{fmt_money(winnings)}</b> (5x!)
{HEADER}"""
    add_xp(user['user_id'], 15)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=play_again_kb("rr", str(bet)))

async def gamble_all(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "gamble_all", COOLDOWNS["gamble_all"])
    if not can:
        await update.message.reply_text(cooldown_msg("Gamble All", remaining), parse_mode="HTML")
        return
    if user['wallet'] <= 0:
        await update.message.reply_text(error_msg("Broke", "You have no money to gamble!"), parse_mode="HTML")
        return
    
    amount = user['wallet']
    update_user(user['user_id'], last_gamble_all=datetime.now().isoformat(),
                total_gambled=user['total_gambled'] + amount)
    
    if random.random() < 0.45:
        update_user(user['user_id'], wallet=amount * 2, total_won=user['total_won'] + amount)
        text = f"""
🎲 <b>GAMBLE ALL — WINNER!</b>
{HEADER}
  💰 Wagered: <b>{fmt_money(amount)}</b>
  
  🎉🎉🎉 <b>DOUBLED!</b> 🎉🎉🎉
  
  💵 New Balance: <b>{fmt_money(amount * 2)}</b>
{HEADER}"""
    else:
        update_user(user['user_id'], wallet=0, total_lost=user['total_lost'] + amount)
        text = f"""
🎲 <b>GAMBLE ALL — BUSTED!</b>
{HEADER}
  💰 Wagered: <b>{fmt_money(amount)}</b>
  
  💀💀💀 <b>LOST EVERYTHING!</b> 💀💀💀
  
  👛 Wallet: <b>{fmt_money(0)}</b>
{HEADER}"""
    add_xp(user['user_id'], 20)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=gambling_menu_kb())

def register_extra_handlers(app):
    for cmd, fn in [
        ("bribe", bribe), ("kidnap", kidnap), ("assassinate", assassinate),
        ("treasure", treasure), ("treasurehunt", treasure),
        ("russianroulette", russian_roulette), ("rr", russian_roulette),
        ("gambleall", gamble_all), ("allin", gamble_all),
    ]:
        app.add_handler(CommandHandler(cmd, fn))
