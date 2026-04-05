from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, ContextTypes
from database import get_user, update_user, add_item, remove_item, has_item, get_inventory, get_db
from items import ITEMS, VEHICLES, PROPERTIES, FUEL_PRICES
from utils import add_xp
from msg_style import *

def _shop_category_text(category):
    items = {k: v for k, v in ITEMS.items() if v['category'] == category}
    if not items:
        return error_msg("Empty", "No items in this category!")
    text = header_box(f"{category.upper()} SHOP", "🛒") + "\n"
    for k, v in items.items():
        text += f"\n  {v['name']} — <b>{fmt_money(v['price'])}</b>\n    {v['desc']}\n    └ <code>/buy {k}</code>"
    return text

def _inventory_text(user):
    items = get_inventory(user['user_id'])
    if not items:
        return info_box("YOUR INVENTORY", ["Empty! Buy from /shop"], "🎒")
    lines = []
    for item in items:
        info = ITEMS.get(item['item_id'], {})
        name = info.get('name', item['item_id'])
        lines.append(f"{name} x{item['quantity']}")
    return info_box("YOUR INVENTORY", lines, "🎒")

def _vehicleshop_text():
    text = header_box("VEHICLE SHOP", "🚗") + "\n"
    for k, v in VEHICLES.items():
        text += f"\n  {v['name']} — <b>{fmt_money(v['price'])}</b>\n    🏎️ Speed: {v['speed']} | ⛽ Cost: {v['fuel_cost']}\n    └ <code>/buyvehicle {k}</code>"
    return text

def _propertyshop_text():
    text = header_box("PROPERTY SHOP", "🏠") + "\n"
    for k, v in PROPERTIES.items():
        text += f"\n  {v['name']} — <b>{fmt_money(v['price'])}</b>\n    💰 Income: {fmt_money(v['income'])}/collect\n    └ <code>/buyproperty {k}</code>"
    return text

async def shop(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        header_box("ITEM SHOP", "🛒") + "\n\nSelect a category:",
        parse_mode="HTML", reply_markup=shop_categories_kb())

async def buy(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args:
        await update.message.reply_text(info_box("Buy", ["Usage: <code>/buy [item_id] [qty]</code>", "Browse /shop first!"], "🛒"), parse_mode="HTML", reply_markup=shop_categories_kb())
        return
    item_id = args[0].lower()
    qty = int(args[1]) if len(args) > 1 else 1
    if item_id not in ITEMS:
        await update.message.reply_text(error_msg("Not Found", "Item doesn't exist! Check /shop"), parse_mode="HTML")
        return
    item = ITEMS[item_id]
    total = item['price'] * qty
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    if user['wallet'] < total:
        await update.message.reply_text(
            error_msg("Not Enough Money", f"  💰 Need: <b>{fmt_money(total)}</b>\n  👛 Have: <b>{fmt_money(user['wallet'])}</b>"),
            parse_mode="HTML")
        return
    update_user(user['user_id'], wallet=user['wallet'] - total, total_spent=user['total_spent'] + total)
    add_item(user['user_id'], item_id, qty)
    add_xp(user['user_id'], 5)
    text = f"""
🛒 <b>PURCHASE COMPLETE</b>
{HEADER}
  📦 Item: {item['name']}
  📊 Qty: <b>{qty}</b>
  💰 Total: <b>{fmt_money(total)}</b>
  👛 Remaining: <b>{fmt_money(user['wallet'] - total)}</b>
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([
        [InlineKeyboardButton("🛒 Shop More", callback_data="cmd_shop"),
         InlineKeyboardButton("🎒 Inventory", callback_data="cmd_inventory")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ]))

async def sell(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args:
        await update.message.reply_text(info_box("Sell", ["Usage: <code>/sell [item_id] [qty]</code>", "Sells at 60% of shop price"], "💰"), parse_mode="HTML")
        return
    item_id = args[0].lower()
    qty = int(args[1]) if len(args) > 1 else 1
    if item_id not in ITEMS:
        await update.message.reply_text(error_msg("Not Found", "Item doesn't exist!"), parse_mode="HTML")
        return
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    if not has_item(user['user_id'], item_id, qty):
        await update.message.reply_text(error_msg("Not Enough", "You don't have enough of that item!"), parse_mode="HTML")
        return
    sell_price = int(ITEMS[item_id]['price'] * 0.6) * qty
    remove_item(user['user_id'], item_id, qty)
    update_user(user['user_id'], wallet=user['wallet'] + sell_price)
    text = success_msg("Item Sold!", f"  📦 {ITEMS[item_id]['name']} x{qty}\n  💰 Received: <b>{fmt_money(sell_price)}</b>")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def inventory(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    text = _inventory_text(user)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([
        [InlineKeyboardButton("🛒 Shop", callback_data="cmd_shop"),
         InlineKeyboardButton("💰 Balance", callback_data="cmd_balance")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ]))

async def gift(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not update.message.reply_to_message:
        await update.message.reply_text(error_msg("Gift", "Reply to someone: <code>/gift [item] [qty]</code>"), parse_mode="HTML")
        return
    args = ctx.args
    if not args:
        await update.message.reply_text(error_msg("Gift", "Usage: <code>/gift [item_id] [qty]</code>"), parse_mode="HTML")
        return
    item_id = args[0].lower()
    qty = int(args[1]) if len(args) > 1 else 1
    user = get_user(update.effective_user.id)
    if not has_item(user['user_id'], item_id, qty):
        await update.message.reply_text(error_msg("Not Enough", "You don't have enough!"), parse_mode="HTML")
        return
    target = get_user(update.message.reply_to_message.from_user.id, update.message.reply_to_message.from_user.first_name)
    remove_item(user['user_id'], item_id, qty)
    add_item(target['user_id'], item_id, qty)
    name = ITEMS.get(item_id, {}).get('name', item_id)
    text = f"""
🎁 <b>GIFT SENT!</b>
{HEADER}
  📤 From: <b>{update.effective_user.first_name}</b>
  📥 To: <b>{update.message.reply_to_message.from_user.first_name}</b>
  📦 Item: {name} x{qty}
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def market(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM market_listings ORDER BY listed_at DESC LIMIT 10")
    listings = c.fetchall()
    conn.close()
    if not listings:
        text = info_box("PLAYER MARKET", ["No listings yet!", "Use /listitem to sell your items"], "🏪")
    else:
        lines = []
        for l in listings:
            name = ITEMS.get(l['item_id'], {}).get('name', l['item_id'])
            lines.append(f"#{l['id']} {name} x{l['quantity']} — {fmt_money(l['price'])}\n    └ <code>/marketbuy {l['id']}</code>")
        text = info_box("PLAYER MARKET", lines, "🏪")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def listitem(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args or len(args) < 2:
        await update.message.reply_text(info_box("List Item", ["Usage: <code>/listitem [item_id] [price] [qty]</code>"], "📋"), parse_mode="HTML")
        return
    item_id, price = args[0].lower(), int(args[1])
    qty = int(args[2]) if len(args) > 2 else 1
    user = get_user(update.effective_user.id)
    if not has_item(user['user_id'], item_id, qty):
        await update.message.reply_text(error_msg("Not Enough", "You don't have enough!"), parse_mode="HTML")
        return
    remove_item(user['user_id'], item_id, qty)
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO market_listings (seller_id, item_id, price, quantity) VALUES (?, ?, ?, ?)",
              (user['user_id'], item_id, price, qty))
    conn.commit()
    conn.close()
    name = ITEMS.get(item_id, {}).get('name', item_id)
    text = success_msg("Listed!", f"  📦 {name} x{qty} for {fmt_money(price)}")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def marketbuy(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args:
        await update.message.reply_text(info_box("Market Buy", ["Usage: <code>/marketbuy [listing_id]</code>", "Check /market for listings"], "🛒"), parse_mode="HTML")
        return
    listing_id = int(args[0])
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM market_listings WHERE id = ?", (listing_id,))
    listing = c.fetchone()
    if not listing:
        conn.close()
        await update.message.reply_text(error_msg("Not Found", "Listing doesn't exist!"), parse_mode="HTML")
        return
    user = get_user(update.effective_user.id)
    if user['wallet'] < listing['price']:
        conn.close()
        await update.message.reply_text(error_msg("Not Enough", f"Need {fmt_money(listing['price'])}!"), parse_mode="HTML")
        return
    update_user(user['user_id'], wallet=user['wallet'] - listing['price'])
    update_user(listing['seller_id'], wallet=get_user(listing['seller_id'])['wallet'] + listing['price'])
    add_item(user['user_id'], listing['item_id'], listing['quantity'])
    c.execute("DELETE FROM market_listings WHERE id = ?", (listing_id,))
    conn.commit()
    conn.close()
    name = ITEMS.get(listing['item_id'], {}).get('name', listing['item_id'])
    text = success_msg("Purchased!", f"  📦 {name} x{listing['quantity']}\n  💰 Paid: {fmt_money(listing['price'])}")
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

async def vehicleshop(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    text = _vehicleshop_text()
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([
        [InlineKeyboardButton("🔙 Shop", callback_data="cmd_shop")],
    ]))

async def propertyshop(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    text = _propertyshop_text()
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([
        [InlineKeyboardButton("🔙 Shop", callback_data="cmd_shop")],
    ]))

async def fuelshop(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    text = header_box("FUEL STATION", "⛽") + "\n"
    for k, v in FUEL_PRICES.items():
        text += f"\n  {v['name']} — <b>{fmt_money(v['price'])}</b>\n    ⛽ +{v['amount']}% fuel\n    └ <code>/buyfuel {k} [vehicle_id]</code>"
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())

def register_shopping_handlers(app):
    for cmd, fn in [
        ("shop", shop), ("store", shop), ("buy", buy), ("sell", sell),
        ("inventory", inventory), ("inv", inventory), ("gift", gift),
        ("market", market), ("listitem", listitem), ("marketbuy", marketbuy),
        ("vehicleshop", vehicleshop), ("propertyshop", propertyshop), ("fuelshop", fuelshop),
    ]:
        app.add_handler(CommandHandler(cmd, fn))
