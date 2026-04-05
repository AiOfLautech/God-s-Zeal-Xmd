import random
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, ContextTypes
from database import get_user, update_user, get_db
from items import PROPERTIES
from utils import add_xp
from msg_style import *

def _myproperties_text(user):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM properties WHERE user_id = ?", (user['user_id'],))
    props = c.fetchall()
    conn.close()
    if not props:
        return info_box("YOUR PROPERTIES", ["None! Buy from /propertyshop"], "🏠")
    lines = []
    for p in props:
        info = PROPERTIES.get(p['property_id'], {})
        income = info.get('income', 0) * p['level']
        lines.append(f"{info.get('name', p['property_id'])} (Lv.{p['level']})\n    💰 Income: {fmt_money(income)}/collect")
    return info_box("YOUR PROPERTIES", lines, "🏠")

async def buyproperty(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args:
        await update.message.reply_text(info_box("Buy Property", ["Usage: <code>/buyproperty [id]</code>", "See /propertyshop"], "🏠"), parse_mode="HTML")
        return
    pid = args[0].lower()
    if pid not in PROPERTIES:
        await update.message.reply_text(error_msg("Not Found", "Property doesn't exist!"), parse_mode="HTML")
        return
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    p = PROPERTIES[pid]
    if user['wallet'] < p['price']:
        await update.message.reply_text(error_msg("Not Enough", f"Need {fmt_money(p['price'])}!"), parse_mode="HTML")
        return
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM properties WHERE user_id = ? AND property_id = ?", (user['user_id'], pid))
    if c.fetchone():
        conn.close()
        await update.message.reply_text(error_msg("Already Owned", "You already own this!"), parse_mode="HTML")
        return
    update_user(user['user_id'], wallet=user['wallet'] - p['price'], total_spent=user['total_spent'] + p['price'])
    c.execute("INSERT INTO properties (user_id, property_id) VALUES (?, ?)", (user['user_id'], pid))
    conn.commit()
    conn.close()
    add_xp(user['user_id'], 50)
    text = f"""
🏠 <b>PROPERTY PURCHASED!</b>
{HEADER}
  🏡 Property: <b>{p['name']}</b>
  💰 Price: <b>{fmt_money(p['price'])}</b>
  📈 Income: <b>{fmt_money(p['income'])}</b>/collect
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def sellproperty(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args:
        await update.message.reply_text(info_box("Sell Property", ["Usage: <code>/sellproperty [id]</code>"], "🏠"), parse_mode="HTML")
        return
    pid = args[0].lower()
    user = get_user(update.effective_user.id)
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM properties WHERE user_id = ? AND property_id = ?", (user['user_id'], pid))
    if not c.fetchone():
        conn.close()
        await update.message.reply_text(error_msg("Not Found", "You don't own that!"), parse_mode="HTML")
        return
    sell_price = int(PROPERTIES[pid]['price'] * 0.6)
    c.execute("DELETE FROM properties WHERE user_id = ? AND property_id = ?", (user['user_id'], pid))
    conn.commit()
    conn.close()
    update_user(user['user_id'], wallet=user['wallet'] + sell_price)
    text = success_msg("Property Sold!", f"  🏠 {PROPERTIES[pid]['name']}\n  💰 Received: {fmt_money(sell_price)}")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def myproperties(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    text = _myproperties_text(user)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([
        [InlineKeyboardButton("🏠 Property Shop", callback_data="cmd_propertyshop")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ]))

async def collectrent(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM properties WHERE user_id = ?", (user['user_id'],))
    props = c.fetchall()
    conn.close()
    if not props:
        await update.message.reply_text(error_msg("No Properties", "Buy from /propertyshop"), parse_mode="HTML")
        return
    total = 0
    for p in props:
        income = PROPERTIES[p['property_id']]['income'] * p['level']
        total += income
    update_user(user['user_id'], wallet=user['wallet'] + total, total_earned=user['total_earned'] + total)
    add_xp(user['user_id'], 20)
    text = f"""
🏘️ <b>RENT COLLECTED!</b>
{HEADER}
  🏘️ Properties: <b>{len(props)}</b>
  💰 Total Income: <b>{fmt_money(total)}</b>
  ⭐ +20 XP
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def upgradeproperty(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args:
        await update.message.reply_text(info_box("Upgrade", ["Usage: <code>/upgradeproperty [id]</code>"], "⬆️"), parse_mode="HTML")
        return
    pid = args[0].lower()
    user = get_user(update.effective_user.id)
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM properties WHERE user_id = ? AND property_id = ?", (user['user_id'], pid))
    prop = c.fetchone()
    if not prop:
        conn.close()
        await update.message.reply_text(error_msg("Not Found", "You don't own that!"), parse_mode="HTML")
        return
    cost = PROPERTIES[pid]['price'] * prop['level']
    if user['wallet'] < cost:
        conn.close()
        await update.message.reply_text(error_msg("No Money", f"Upgrade costs {fmt_money(cost)}!"), parse_mode="HTML")
        return
    c.execute("UPDATE properties SET level = level + 1 WHERE id = ?", (prop['id'],))
    conn.commit()
    conn.close()
    update_user(user['user_id'], wallet=user['wallet'] - cost)
    new_income = PROPERTIES[pid]['income'] * (prop['level'] + 1)
    text = success_msg("Upgraded!", f"  🏠 {PROPERTIES[pid]['name']}\n  ⬆️ Level {prop['level']} → {prop['level'] + 1}\n  💰 New Income: {fmt_money(new_income)}")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

def register_property_handlers(app):
    for cmd, fn in [
        ("buyproperty", buyproperty), ("buyhouse", buyproperty),
        ("sellproperty", sellproperty), ("sellhouse", sellproperty),
        ("myproperties", myproperties), ("properties", myproperties), ("houses", myproperties),
        ("collectrent", collectrent), ("rent", collectrent),
        ("upgradeproperty", upgradeproperty), ("upgradehouse", upgradeproperty),
    ]:
        app.add_handler(CommandHandler(cmd, fn))
