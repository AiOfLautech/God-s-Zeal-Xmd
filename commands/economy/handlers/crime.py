import random
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, ContextTypes
from database import get_user, update_user, has_item, remove_item, add_item
from config import COOLDOWNS
from utils import check_cooldown, add_xp
from msg_style import *

async def rob(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not update.message.reply_to_message:
        await update.message.reply_text(
            info_box("Rob", ["Reply to someone: <code>/rob</code>", "Requires: 🔧 Crowbar", "Optional: 🎭 Ski Mask (+success)"], "🔫"),
            parse_mode="HTML", reply_markup=crime_menu_kb())
        return
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "rob", COOLDOWNS["rob"])
    if not can:
        await update.message.reply_text(cooldown_msg("Rob", remaining), parse_mode="HTML")
        return
    if not has_item(user['user_id'], "crowbar"):
        await update.message.reply_text(error_msg("Missing Equipment", "  🔧 Need a <b>Crowbar</b>!"), parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🛒 Buy Crowbar", callback_data="shop_tools")]]))
        return
    target = get_user(update.message.reply_to_message.from_user.id, update.message.reply_to_message.from_user.first_name)
    if has_item(target['user_id'], "shield"):
        remove_item(target['user_id'], "shield")
        await update.message.reply_text(error_msg("Blocked!", "  🛡️ Target had a Shield Token!"), parse_mode="HTML")
        return
    update_user(user['user_id'], last_rob=datetime.now().isoformat())
    success_chance = 0.4
    if has_item(user['user_id'], "ski_mask"): success_chance += 0.1
    if has_item(user['user_id'], "gloves"): success_chance += 0.05
    if has_item(user['user_id'], "disguise_kit"): success_chance += 0.1
    if random.random() < success_chance:
        stolen = min(random.randint(200, 2000), target['wallet'] // 3)
        if stolen <= 0:
            await update.message.reply_text(error_msg("Empty Target", "They have no money!"), parse_mode="HTML")
            return
        update_user(user['user_id'], wallet=user['wallet'] + stolen, crimes_committed=user['crimes_committed'] + 1)
        update_user(target['user_id'], wallet=target['wallet'] - stolen)
        add_xp(user['user_id'], 20)
        text = f"""
🔫 <b>ROBBERY SUCCESS!</b>
{HEADER}
  🎯 Target: <b>{update.message.reply_to_message.from_user.first_name}</b>
  💰 Stolen: <b>{fmt_money(stolen)}</b>
  ⭐ +20 XP
{HEADER}"""
    else:
        fine = random.randint(100, 800)
        update_user(user['user_id'], wallet=max(0, user['wallet'] - fine), crimes_failed=user['crimes_failed'] + 1)
        if random.random() < 0.3: remove_item(user['user_id'], "crowbar")
        text = f"""
🚔 <b>ROBBERY FAILED!</b>
{HEADER}
  ❌ Got caught trying to rob <b>{update.message.reply_to_message.from_user.first_name}</b>
  💸 Fine: <b>{fmt_money(fine)}</b>
  🔧 {'Crowbar confiscated!' if random.random() < 0.3 else 'Crowbar intact.'}
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

async def steal(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "steal", COOLDOWNS["steal"])
    if not can:
        await update.message.reply_text(cooldown_msg("Steal", remaining), parse_mode="HTML")
        return
    update_user(user['user_id'], last_steal=datetime.now().isoformat())
    if random.random() < 0.5:
        places = [("💰 Cash register", 100, 500), ("👜 Purse", 50, 300), ("🏪 Store", 200, 800), ("🏧 ATM glitch", 500, 2000)]
        place = random.choice(places)
        loot = random.randint(place[1], place[2])
        update_user(user['user_id'], wallet=user['wallet'] + loot, crimes_committed=user['crimes_committed'] + 1)
        add_xp(user['user_id'], 10)
        text = success_msg("Theft Success!", f"  📍 {place[0]}\n  💰 Stole: <b>{fmt_money(loot)}</b>\n  ⭐ +10 XP")
    else:
        fine = random.randint(50, 300)
        update_user(user['user_id'], wallet=max(0, user['wallet'] - fine), crimes_failed=user['crimes_failed'] + 1)
        text = error_msg("Caught Stealing!", f"  🚔 Security spotted you!\n  💸 Fine: <b>{fmt_money(fine)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

async def heist(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "heist", COOLDOWNS["heist"])
    if not can:
        await update.message.reply_text(cooldown_msg("Heist", remaining), parse_mode="HTML")
        return
    missing = []
    if not has_item(user['user_id'], "lockpick"): missing.append("🔓 Lockpick")
    if not has_item(user['user_id'], "ski_mask"): missing.append("🎭 Ski Mask")
    if not has_item(user['user_id'], "walkie_talkie"): missing.append("📻 Walkie Talkie")
    if missing:
        await update.message.reply_text(error_msg("Missing Gear", "  Need: " + ", ".join(missing)), parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🛒 Shop", callback_data="shop_tools")]]))
        return
    update_user(user['user_id'], last_heist=datetime.now().isoformat())
    if random.random() < 0.3:
        loot = random.randint(5000, 25000)
        update_user(user['user_id'], wallet=user['wallet'] + loot, crimes_committed=user['crimes_committed'] + 1)
        if random.random() < 0.4:
            remove_item(user['user_id'], "lockpick")
            remove_item(user['user_id'], "ski_mask")
        add_xp(user['user_id'], 50)
        text = f"""
💰 <b>HEIST SUCCESS!</b>
{HEADER}
  🏦 Broke into the vault!
  💎 Loot: <b>{fmt_money(loot)}</b>
  ⭐ +50 XP
{HEADER}"""
    else:
        fine = random.randint(1000, 5000)
        remove_item(user['user_id'], "lockpick")
        update_user(user['user_id'], wallet=max(0, user['wallet'] - fine), crimes_failed=user['crimes_failed'] + 1)
        text = f"""
🚔 <b>HEIST FAILED!</b>
{HEADER}
  🚨 Alarm triggered!
  💸 Fine: <b>{fmt_money(fine)}</b>
  🔓 Lockpick lost!
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

async def pickpocket(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "pickpocket", COOLDOWNS["pickpocket"])
    if not can:
        await update.message.reply_text(cooldown_msg("Pickpocket", remaining), parse_mode="HTML")
        return
    update_user(user['user_id'], last_pickpocket=datetime.now().isoformat())
    if random.random() < 0.55:
        loot = random.randint(50, 500)
        update_user(user['user_id'], wallet=user['wallet'] + loot, crimes_committed=user['crimes_committed'] + 1)
        add_xp(user['user_id'], 8)
        text = success_msg("Quick Fingers!", f"  👛 Snagged <b>{fmt_money(loot)}</b>!\n  ⭐ +8 XP")
    else:
        fine = random.randint(30, 200)
        update_user(user['user_id'], wallet=max(0, user['wallet'] - fine), crimes_failed=user['crimes_failed'] + 1)
        text = error_msg("Caught!", f"  ✋ They grabbed your hand!\n  💸 Fine: <b>{fmt_money(fine)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

async def hack(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "hack", COOLDOWNS["hack"])
    if not can:
        await update.message.reply_text(cooldown_msg("Hack", remaining), parse_mode="HTML")
        return
    if not has_item(user['user_id'], "hacking_kit"):
        await update.message.reply_text(error_msg("Missing Equipment", "  💻 Need a <b>Hacking Kit</b>!"), parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🛒 Shop", callback_data="shop_tools")]]))
        return
    update_user(user['user_id'], last_hack=datetime.now().isoformat())
    if random.random() < 0.35:
        loot = random.randint(1000, 8000)
        update_user(user['user_id'], wallet=user['wallet'] + loot, crimes_committed=user['crimes_committed'] + 1)
        add_xp(user['user_id'], 30)
        targets = ["a bank account 🏦", "a crypto wallet 📱", "a corporate server 🖥️"]
        text = success_msg("Hack Successful!", f"  💻 Hacked: {random.choice(targets)}\n  💰 Extracted: <b>{fmt_money(loot)}</b>\n  ⭐ +30 XP")
    else:
        fine = random.randint(500, 3000)
        if random.random() < 0.2: remove_item(user['user_id'], "hacking_kit")
        update_user(user['user_id'], wallet=max(0, user['wallet'] - fine), crimes_failed=user['crimes_failed'] + 1)
        text = error_msg("Traced!", f"  🔍 Your IP was traced!\n  💸 Fine: <b>{fmt_money(fine)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

async def scam(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "scam", COOLDOWNS["scam"])
    if not can:
        await update.message.reply_text(cooldown_msg("Scam", remaining), parse_mode="HTML")
        return
    if not has_item(user['user_id'], "fake_id"):
        await update.message.reply_text(error_msg("Missing Equipment", "  🪪 Need a <b>Fake ID</b>!"), parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🛒 Shop", callback_data="shop_tools")]]))
        return
    update_user(user['user_id'], last_scam=datetime.now().isoformat())
    if random.random() < 0.4:
        loot = random.randint(500, 4000)
        scams = ["fake investment scheme", "phone scam", "email phishing", "fake charity"]
        update_user(user['user_id'], wallet=user['wallet'] + loot, crimes_committed=user['crimes_committed'] + 1)
        add_xp(user['user_id'], 20)
        text = success_msg("Scam Success!", f"  🪪 Method: {random.choice(scams).title()}\n  💰 Profit: <b>{fmt_money(loot)}</b>\n  ⭐ +20 XP")
    else:
        fine = random.randint(300, 1500)
        update_user(user['user_id'], wallet=max(0, user['wallet'] - fine), crimes_failed=user['crimes_failed'] + 1)
        text = error_msg("Exposed!", f"  🔍 Victim saw through your scam!\n  💸 Fine: <b>{fmt_money(fine)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

async def smuggle(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "smuggle", COOLDOWNS["smuggle"])
    if not can:
        await update.message.reply_text(cooldown_msg("Smuggle", remaining), parse_mode="HTML")
        return
    goods = [("contraband_a", 0.7, 1.5, 3), ("contraband_b", 0.5, 2, 5), ("contraband_c", 0.3, 3, 8)]
    smuggled = None
    for gid, chance, low, high in goods:
        if has_item(user['user_id'], gid):
            smuggled = (gid, chance, low, high)
            break
    if not smuggled:
        await update.message.reply_text(error_msg("No Contraband", "  📦 Buy from /shop → Smuggling"), parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🛒 Shop", callback_data="shop_smuggling")]]))
        return
    from items import ITEMS
    update_user(user['user_id'], last_smuggle=datetime.now().isoformat())
    remove_item(user['user_id'], smuggled[0])
    if random.random() < smuggled[1]:
        profit = int(ITEMS[smuggled[0]]['price'] * random.uniform(smuggled[2], smuggled[3]))
        update_user(user['user_id'], wallet=user['wallet'] + profit, crimes_committed=user['crimes_committed'] + 1)
        add_xp(user['user_id'], 25)
        text = success_msg("Smuggling Done!", f"  📦 Delivered {ITEMS[smuggled[0]]['name']}\n  💰 Profit: <b>{fmt_money(profit)}</b>")
    else:
        fine = random.randint(500, 5000)
        update_user(user['user_id'], wallet=max(0, user['wallet'] - fine), crimes_failed=user['crimes_failed'] + 1)
        text = error_msg("Caught at Border!", f"  🚨 Customs found your goods!\n  💸 Fine: <b>{fmt_money(fine)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

async def crime(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "crime", COOLDOWNS["crime"])
    if not can:
        await update.message.reply_text(cooldown_msg("Crime", remaining), parse_mode="HTML")
        return
    update_user(user['user_id'], last_crime=datetime.now().isoformat())
    crimes = [("🏪 Robbed a convenience store", 200, 1000), ("💊 Sold illegal goods", 300, 1500),
              ("🚗 Stripped a car for parts", 500, 2000), ("📱 Sold stolen phones", 100, 800),
              ("💳 Credit card fraud", 400, 2500), ("🔌 Crypto mining scam", 600, 3000)]
    c = random.choice(crimes)
    if random.random() < 0.5:
        loot = random.randint(c[1], c[2])
        update_user(user['user_id'], wallet=user['wallet'] + loot, crimes_committed=user['crimes_committed'] + 1)
        add_xp(user['user_id'], 15)
        text = success_msg(c[0], f"  💰 Loot: <b>{fmt_money(loot)}</b>")
    else:
        fine = random.randint(50, 300)
        update_user(user['user_id'], wallet=max(0, user['wallet'] - fine), crimes_failed=user['crimes_failed'] + 1)
        text = error_msg("Caught!", f"  🚔 Police nabbed you!\n  💸 Fine: <b>{fmt_money(fine)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

async def burglary(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    if not has_item(user['user_id'], "lockpick"):
        await update.message.reply_text(error_msg("Missing Equipment", "  🔓 Need a <b>Lockpick</b>!"), parse_mode="HTML")
        return
    if random.random() < 0.45:
        loot = random.randint(500, 3000)
        update_user(user['user_id'], wallet=user['wallet'] + loot, crimes_committed=user['crimes_committed'] + 1)
        if random.random() < 0.3: remove_item(user['user_id'], "lockpick")
        add_xp(user['user_id'], 25)
        text = success_msg("Burglary Success!", f"  🏠 Broke into a house\n  💰 Loot: <b>{fmt_money(loot)}</b>")
    else:
        fine = random.randint(200, 1000)
        update_user(user['user_id'], wallet=max(0, user['wallet'] - fine), crimes_failed=user['crimes_failed'] + 1)
        remove_item(user['user_id'], "lockpick")
        text = error_msg("Alarm Triggered!", f"  🚨 The house had an alarm!\n  💸 Fine: <b>{fmt_money(fine)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

async def carjack(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    if random.random() < 0.4:
        cars = [("🚗 Honda Civic", 500), ("🚙 Toyota SUV", 800), ("🏎️ BMW", 2000), ("🚘 Mercedes", 3000)]
        car = random.choice(cars)
        update_user(user['user_id'], wallet=user['wallet'] + car[1], crimes_committed=user['crimes_committed'] + 1)
        add_xp(user['user_id'], 20)
        text = success_msg("Carjack Success!", f"  🚗 Stole a {car[0]}\n  💰 Sold for: <b>{fmt_money(car[1])}</b>")
    else:
        fine = random.randint(300, 1500)
        update_user(user['user_id'], wallet=max(0, user['wallet'] - fine), crimes_failed=user['crimes_failed'] + 1)
        text = error_msg("Failed!", f"  🚔 Owner caught you!\n  💸 Fine: <b>{fmt_money(fine)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

async def counterfeit(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    if random.random() < 0.35:
        amount = random.randint(200, 2000)
        update_user(user['user_id'], wallet=user['wallet'] + amount, crimes_committed=user['crimes_committed'] + 1)
        add_xp(user['user_id'], 20)
        text = success_msg("Counterfeiting!", f"  🖨️ Printed fake bills\n  💰 Profit: <b>{fmt_money(amount)}</b>")
    else:
        fine = random.randint(500, 2000)
        update_user(user['user_id'], wallet=max(0, user['wallet'] - fine), crimes_failed=user['crimes_failed'] + 1)
        text = error_msg("Bad Bills!", f"  🔍 Your fakes were detected!\n  💸 Fine: <b>{fmt_money(fine)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

async def launder(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    args = ctx.args
    if not args:
        await update.message.reply_text(
            info_box("Money Laundering", [
                "Usage: <code>/launder [amount]</code>",
                "Convert dirty money at 70% rate",
                "No risk involved!",
            ], "🧹"), parse_mode="HTML")
        return
    amount = int(args[0])
    if amount <= 0 or amount > user['wallet']:
        await update.message.reply_text(error_msg("Invalid", "Not enough money!"), parse_mode="HTML")
        return
    clean = int(amount * 0.7)
    update_user(user['user_id'], wallet=user['wallet'] - amount + clean)
    text = success_msg("Money Laundered!", f"  💰 Dirty: <b>{fmt_money(amount)}</b>\n  ✅ Clean: <b>{fmt_money(clean)}</b>\n  📉 Fee: <b>{fmt_money(amount - clean)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=crime_menu_kb())

def register_crime_handlers(app):
    for cmd, fn in [
        ("rob", rob), ("steal", steal), ("heist", heist), ("pickpocket", pickpocket),
        ("hack", hack), ("scam", scam), ("smuggle", smuggle), ("crime", crime),
        ("burglary", burglary), ("carjack", carjack), ("counterfeit", counterfeit),
        ("launder", launder),
    ]:
        app.add_handler(CommandHandler(cmd, fn))
