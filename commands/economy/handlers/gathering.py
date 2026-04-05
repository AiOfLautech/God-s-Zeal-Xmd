import random
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, ContextTypes
from database import get_user, update_user, has_item, add_item
from config import COOLDOWNS
from utils import check_cooldown, add_xp
from msg_style import *

FISH = [("🐟 Common Fish", 50, 0.4), ("🐠 Tropical Fish", 150, 0.25), ("🦈 Shark", 500, 0.1),
        ("🐙 Octopus", 300, 0.15), ("🐋 Whale", 1000, 0.05), ("🦞 Lobster", 400, 0.05)]
GAME = [("🐰 Rabbit", 100, 0.35), ("🦌 Deer", 300, 0.25), ("🐻 Bear", 800, 0.15),
        ("🦅 Eagle", 500, 0.1), ("🦁 Lion", 1500, 0.1), ("🐉 Dragon", 5000, 0.05)]
MINERALS = [("⬜ Stone", 30, 0.35), ("⬛ Iron", 100, 0.25), ("⬜ Silver", 300, 0.15),
            ("💛 Gold", 800, 0.1), ("💎 Diamond", 2000, 0.1), ("🌟 Mythril", 5000, 0.05)]
WOOD = [("🪵 Oak", 50, 0.4), ("🪵 Pine", 80, 0.25), ("🪵 Mahogany", 200, 0.15),
        ("🪵 Ebony", 500, 0.1), ("🪵 Enchanted", 1500, 0.1)]
DIG_FINDS = [("🪨 Rock", 10, 0.3), ("🪙 Old Coin", 200, 0.2), ("📦 Chest", 500, 0.15),
             ("💀 Fossil", 800, 0.15), ("🗺️ Map", 1500, 0.1), ("👑 Crown", 5000, 0.05), ("💎 Diamond", 3000, 0.05)]

def _roll(items):
    roll = random.random()
    cumulative = 0
    for name, value, chance in items:
        cumulative += chance
        if roll < cumulative:
            return name, value
    return items[0][0], items[0][1]

async def fish(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "fish", COOLDOWNS["fish"])
    if not can:
        await update.message.reply_text(cooldown_msg("Fish", remaining), parse_mode="HTML")
        return
    if not has_item(user['user_id'], "fishing_rod"):
        await update.message.reply_text(error_msg("Missing Equipment", "  🎣 Need a <b>Fishing Rod</b>!"), parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🛒 Buy Rod", callback_data="shop_gathering")]]))
        return
    update_user(user['user_id'], last_fish=datetime.now().isoformat())
    catch, value = _roll(FISH)
    bonus = random.randint(1, 3) if has_item(user['user_id'], "net") else 1
    total = value * bonus
    update_user(user['user_id'], wallet=user['wallet'] + total, total_earned=user['total_earned'] + total, fish_caught=user.get('fish_caught', 0) + 1)
    add_xp(user['user_id'], 15)
    multi = f"\n  🥅 Net Bonus: <b>x{bonus}</b>" if bonus > 1 else ""
    text = f"""
🎣 <b>FISHING</b>
{HEADER}
  🐟 Caught: <b>{catch}</b>
  💰 Value: <b>{fmt_money(total)}</b>{multi}
  ⭐ +15 XP
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=gathering_menu_kb())

async def hunt(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "hunt", COOLDOWNS["hunt"])
    if not can:
        await update.message.reply_text(cooldown_msg("Hunt", remaining), parse_mode="HTML")
        return
    if not has_item(user['user_id'], "hunting_rifle"):
        await update.message.reply_text(error_msg("Missing Equipment", "  🏹 Need a <b>Hunting Bow</b>!"), parse_mode="HTML")
        return
    update_user(user['user_id'], last_hunt=datetime.now().isoformat())
    catch, value = _roll(GAME)
    update_user(user['user_id'], wallet=user['wallet'] + value, total_earned=user['total_earned'] + value, animals_hunted=user.get('animals_hunted', 0) + 1)
    add_xp(user['user_id'], 20)
    text = success_msg("Hunt Successful!", f"  🏹 Caught: <b>{catch}</b>\n  💰 Sold for: <b>{fmt_money(value)}</b>\n  ⭐ +20 XP")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=gathering_menu_kb())

async def mine(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "mine", COOLDOWNS["mine"])
    if not can:
        await update.message.reply_text(cooldown_msg("Mine", remaining), parse_mode="HTML")
        return
    if not has_item(user['user_id'], "pickaxe"):
        await update.message.reply_text(error_msg("Missing Equipment", "  ⛏️ Need a <b>Pickaxe</b>!"), parse_mode="HTML")
        return
    update_user(user['user_id'], last_mine=datetime.now().isoformat())
    find, value = _roll(MINERALS)
    update_user(user['user_id'], wallet=user['wallet'] + value, total_earned=user['total_earned'] + value, minerals_mined=user.get('minerals_mined', 0) + 1)
    add_xp(user['user_id'], 15)
    text = success_msg("Mining Success!", f"  ⛏️ Found: <b>{find}</b>\n  💰 Value: <b>{fmt_money(value)}</b>\n  ⭐ +15 XP")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=gathering_menu_kb())

async def chop(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "chop", COOLDOWNS["chop"])
    if not can:
        await update.message.reply_text(cooldown_msg("Chop", remaining), parse_mode="HTML")
        return
    if not has_item(user['user_id'], "axe"):
        await update.message.reply_text(error_msg("Missing Equipment", "  🪓 Need an <b>Axe</b>!"), parse_mode="HTML")
        return
    update_user(user['user_id'], last_chop=datetime.now().isoformat())
    find, value = _roll(WOOD)
    update_user(user['user_id'], wallet=user['wallet'] + value, total_earned=user['total_earned'] + value)
    add_xp(user['user_id'], 12)
    text = success_msg("Chopping Done!", f"  🪓 Got: <b>{find}</b>\n  💰 Sold: <b>{fmt_money(value)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=gathering_menu_kb())

async def dig(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "dig", COOLDOWNS["dig"])
    if not can:
        await update.message.reply_text(cooldown_msg("Dig", remaining), parse_mode="HTML")
        return
    if not has_item(user['user_id'], "shovel"):
        await update.message.reply_text(error_msg("Missing Equipment", "  🪏 Need a <b>Shovel</b>!"), parse_mode="HTML")
        return
    update_user(user['user_id'], last_dig=datetime.now().isoformat())
    find, value = _roll(DIG_FINDS)
    update_user(user['user_id'], wallet=user['wallet'] + value, total_earned=user['total_earned'] + value)
    add_xp(user['user_id'], 10)
    text = success_msg("Treasure Found!", f"  🪏 Dug up: <b>{find}</b>\n  💰 Worth: <b>{fmt_money(value)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=gathering_menu_kb())

def register_gathering_handlers(app):
    for cmd, fn in [("fish", fish), ("hunt", hunt), ("mine", mine), ("chop", chop), ("dig", dig)]:
        app.add_handler(CommandHandler(cmd, fn))
