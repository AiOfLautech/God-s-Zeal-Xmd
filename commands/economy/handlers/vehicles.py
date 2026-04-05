import random
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, ContextTypes
from database import get_user, update_user, get_db
from items import VEHICLES, FUEL_PRICES
from utils import add_xp, check_cooldown
from config import COOLDOWNS
from msg_style import *

def _garage_text(user):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM vehicles WHERE user_id = ?", (user['user_id'],))
    vehicles = c.fetchall()
    conn.close()
    if not vehicles:
        return info_box("YOUR GARAGE", ["Empty! Buy from /vehicleshop"], "🏎️")
    lines = []
    for v in vehicles:
        info = VEHICLES.get(v['vehicle_id'], {})
        fuel_bar = progress_bar(v['fuel'], 100, 8)
        cond_bar = progress_bar(v['condition'], 100, 8)
        lines.append(f"{info.get('name', v['vehicle_id'])}\n    ⛽ {fuel_bar}\n    🔧 {cond_bar}\n    🛡️ {'Insured' if v['insured'] else 'Not Insured'}")
    return info_box("YOUR GARAGE", lines, "🏎️")

async def buyvehicle(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args:
        await update.message.reply_text(info_box("Buy Vehicle", ["Usage: <code>/buyvehicle [id]</code>", "See /vehicleshop"], "🚗"), parse_mode="HTML")
        return
    vid = args[0].lower()
    if vid not in VEHICLES:
        await update.message.reply_text(error_msg("Not Found", "Vehicle doesn't exist!"), parse_mode="HTML")
        return
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    v = VEHICLES[vid]
    if user['wallet'] < v['price']:
        await update.message.reply_text(error_msg("Not Enough", f"Need {fmt_money(v['price'])}!"), parse_mode="HTML")
        return
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM vehicles WHERE user_id = ? AND vehicle_id = ?", (user['user_id'], vid))
    if c.fetchone():
        conn.close()
        await update.message.reply_text(error_msg("Already Owned", "You already own this!"), parse_mode="HTML")
        return
    update_user(user['user_id'], wallet=user['wallet'] - v['price'], total_spent=user['total_spent'] + v['price'])
    c.execute("INSERT INTO vehicles (user_id, vehicle_id) VALUES (?, ?)", (user['user_id'], vid))
    conn.commit()
    conn.close()
    add_xp(user['user_id'], 50)
    text = f"""
🚗 <b>VEHICLE PURCHASED!</b>
{HEADER}
  🏎️ Vehicle: <b>{v['name']}</b>
  💰 Price: <b>{fmt_money(v['price'])}</b>
  🏁 Speed: <b>{v['speed']}</b>
  ⛽ Fuel Cost: <b>{v['fuel_cost']}</b>
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([
        [InlineKeyboardButton("🏎️ Garage", callback_data="cmd_garage")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ]))

async def sellvehicle(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args:
        await update.message.reply_text(info_box("Sell Vehicle", ["Usage: <code>/sellvehicle [id]</code>"], "🚗"), parse_mode="HTML")
        return
    vid = args[0].lower()
    user = get_user(update.effective_user.id)
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM vehicles WHERE user_id = ? AND vehicle_id = ?", (user['user_id'], vid))
    vehicle = c.fetchone()
    if not vehicle:
        conn.close()
        await update.message.reply_text(error_msg("Not Found", "You don't own that!"), parse_mode="HTML")
        return
    sell_price = int(VEHICLES[vid]['price'] * 0.5)
    c.execute("DELETE FROM vehicles WHERE user_id = ? AND vehicle_id = ?", (user['user_id'], vid))
    conn.commit()
    conn.close()
    update_user(user['user_id'], wallet=user['wallet'] + sell_price)
    text = success_msg("Vehicle Sold!", f"  🚗 {VEHICLES[vid]['name']}\n  💰 Received: {fmt_money(sell_price)}")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def garage(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    text = _garage_text(user)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([
        [InlineKeyboardButton("🚗 Vehicle Shop", callback_data="cmd_vehicleshop")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ]))

async def buyfuel(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args or len(args) < 2:
        await update.message.reply_text(info_box("Buy Fuel", ["Usage: <code>/buyfuel [type] [vehicle_id]</code>", "See /fuelshop for types"], "⛽"), parse_mode="HTML")
        return
    fuel_type, vid = args[0].lower(), args[1].lower()
    if fuel_type not in FUEL_PRICES:
        await update.message.reply_text(error_msg("Invalid", "Fuel type not found!"), parse_mode="HTML")
        return
    user = get_user(update.effective_user.id)
    fuel = FUEL_PRICES[fuel_type]
    if user['wallet'] < fuel['price']:
        await update.message.reply_text(error_msg("No Money", f"Need {fmt_money(fuel['price'])}!"), parse_mode="HTML")
        return
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM vehicles WHERE user_id = ? AND vehicle_id = ?", (user['user_id'], vid))
    vehicle = c.fetchone()
    if not vehicle:
        conn.close()
        await update.message.reply_text(error_msg("Not Found", "Vehicle not in garage!"), parse_mode="HTML")
        return
    new_fuel = min(100, vehicle['fuel'] + fuel['amount'])
    c.execute("UPDATE vehicles SET fuel = ? WHERE user_id = ? AND vehicle_id = ?", (new_fuel, user['user_id'], vid))
    conn.commit()
    conn.close()
    update_user(user['user_id'], wallet=user['wallet'] - fuel['price'])
    text = success_msg("Fueled Up!", f"  ⛽ {VEHICLES[vid]['name']}\n  📊 Fuel: {progress_bar(new_fuel, 100, 8)}")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def drive(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args:
        await update.message.reply_text(info_box("Drive", ["Usage: <code>/drive [vehicle_id]</code>"], "🚗"), parse_mode="HTML")
        return
    vid = args[0].lower()
    user = get_user(update.effective_user.id)
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM vehicles WHERE user_id = ? AND vehicle_id = ?", (user['user_id'], vid))
    vehicle = c.fetchone()
    if not vehicle:
        conn.close()
        await update.message.reply_text(error_msg("Not Found", "You don't own that!"), parse_mode="HTML")
        return
    if vehicle['fuel'] < 10:
        conn.close()
        await update.message.reply_text(error_msg("No Fuel", "Need at least 10% fuel! /buyfuel"), parse_mode="HTML")
        return
    earnings = random.randint(50, 300) + VEHICLES[vid]['speed']
    new_fuel = max(0, vehicle['fuel'] - 10)
    new_cond = max(0, vehicle['condition'] - random.randint(1, 5))
    c.execute("UPDATE vehicles SET fuel = ?, condition = ? WHERE user_id = ? AND vehicle_id = ?",
              (new_fuel, new_cond, user['user_id'], vid))
    conn.commit()
    conn.close()
    update_user(user['user_id'], wallet=user['wallet'] + earnings)
    add_xp(user['user_id'], 10)
    text = f"""
🚗 <b>DRIVE COMPLETE</b>
{HEADER}
  🏎️ Vehicle: <b>{VEHICLES[vid]['name']}</b>
  💰 Earned: <b>{fmt_money(earnings)}</b>
  ⛽ Fuel: {progress_bar(new_fuel, 100, 8)}
  🔧 Condition: {progress_bar(new_cond, 100, 8)}
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def race(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args or len(args) < 2:
        await update.message.reply_text(info_box("Race", ["Usage: <code>/race [vehicle_id] [bet]</code>", "Faster vehicles win more!"], "🏁"), parse_mode="HTML")
        return
    vid, bet = args[0].lower(), int(args[1])
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "race", COOLDOWNS["race"])
    if not can:
        await update.message.reply_text(cooldown_msg("Race", remaining), parse_mode="HTML")
        return
    if bet > user['wallet']:
        await update.message.reply_text(error_msg("Not Enough", "Can't afford that bet!"), parse_mode="HTML")
        return
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM vehicles WHERE user_id = ? AND vehicle_id = ?", (user['user_id'], vid))
    vehicle = c.fetchone()
    if not vehicle:
        conn.close()
        await update.message.reply_text(error_msg("Not Found", "You don't own that!"), parse_mode="HTML")
        return
    if vehicle['fuel'] < 15:
        conn.close()
        await update.message.reply_text(error_msg("No Fuel", "Need 15%+ fuel!"), parse_mode="HTML")
        return
    from datetime import datetime
    update_user(user['user_id'], last_race=datetime.now().isoformat(), total_gambled=user['total_gambled'] + bet)
    new_fuel = max(0, vehicle['fuel'] - 15)
    c.execute("UPDATE vehicles SET fuel = ? WHERE user_id = ? AND vehicle_id = ?", (new_fuel, user['user_id'], vid))
    conn.commit()
    conn.close()
    speed = VEHICLES[vid]['speed'] + random.randint(-20, 20)
    opp_speed = random.randint(30, 120)
    if speed > opp_speed:
        winnings = bet * 2
        update_user(user['user_id'], wallet=user['wallet'] + winnings - bet, total_won=user['total_won'] + winnings, wins=user.get('wins', 0) + 1)
        text = f"""
🏁 <b>RACE RESULTS</b>
{HEADER}
  🏎️ You: <b>{speed} km/h</b> ({VEHICLES[vid]['name']})
  🚗 Opponent: <b>{opp_speed} km/h</b>
{DIVIDER}
  🏆 <b>YOU WON!</b>
  💰 Prize: <b>{fmt_money(winnings)}</b>
{HEADER}"""
    else:
        update_user(user['user_id'], wallet=user['wallet'] - bet, total_lost=user['total_lost'] + bet, losses=user.get('losses', 0) + 1)
        text = f"""
🏁 <b>RACE RESULTS</b>
{HEADER}
  🏎️ You: <b>{speed} km/h</b> ({VEHICLES[vid]['name']})
  🚗 Opponent: <b>{opp_speed} km/h</b>
{DIVIDER}
  💀 <b>YOU LOST!</b>
  💸 Lost: <b>{fmt_money(bet)}</b>
{HEADER}"""
    add_xp(user['user_id'], 20)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def repair(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args:
        await update.message.reply_text(info_box("Repair", ["Usage: <code>/repair [vehicle_id]</code>", "Costs based on damage"], "🔧"), parse_mode="HTML")
        return
    vid = args[0].lower()
    user = get_user(update.effective_user.id)
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM vehicles WHERE user_id = ? AND vehicle_id = ?", (user['user_id'], vid))
    vehicle = c.fetchone()
    if not vehicle:
        conn.close()
        await update.message.reply_text(error_msg("Not Found", "You don't own that!"), parse_mode="HTML")
        return
    damage = 100 - vehicle['condition']
    cost = damage * 50
    if user['wallet'] < cost:
        conn.close()
        await update.message.reply_text(error_msg("No Money", f"Repair costs {fmt_money(cost)}!"), parse_mode="HTML")
        return
    c.execute("UPDATE vehicles SET condition = 100 WHERE user_id = ? AND vehicle_id = ?", (user['user_id'], vid))
    conn.commit()
    conn.close()
    update_user(user['user_id'], wallet=user['wallet'] - cost)
    text = success_msg("Repaired!", f"  🔧 {VEHICLES[vid]['name']} is like new!\n  💰 Cost: {fmt_money(cost)}")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def insure(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args:
        await update.message.reply_text(info_box("Insure", ["Usage: <code>/insure [vehicle_id]</code>", "Costs 10% of vehicle price"], "🛡️"), parse_mode="HTML")
        return
    vid = args[0].lower()
    if vid not in VEHICLES:
        await update.message.reply_text(error_msg("Not Found", "Vehicle doesn't exist!"), parse_mode="HTML")
        return
    user = get_user(update.effective_user.id)
    cost = int(VEHICLES[vid]['price'] * 0.1)
    if user['wallet'] < cost:
        await update.message.reply_text(error_msg("No Money", f"Insurance costs {fmt_money(cost)}!"), parse_mode="HTML")
        return
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE vehicles SET insured = 1 WHERE user_id = ? AND vehicle_id = ?", (user['user_id'], vid))
    conn.commit()
    conn.close()
    update_user(user['user_id'], wallet=user['wallet'] - cost)
    text = success_msg("Insured!", f"  🛡️ {VEHICLES[vid]['name']} is now insured!\n  💰 Cost: {fmt_money(cost)}")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

def register_vehicle_handlers(app):
    for cmd, fn in [
        ("buyvehicle", buyvehicle), ("buycar", buyvehicle),
        ("sellvehicle", sellvehicle), ("sellcar", sellvehicle),
        ("garage", garage), ("cars", garage),
        ("buyfuel", buyfuel), ("fuel", buyfuel),
        ("drive", drive), ("race", race),
        ("repair", repair), ("fix", repair),
        ("insure", insure),
    ]:
        app.add_handler(CommandHandler(cmd, fn))
