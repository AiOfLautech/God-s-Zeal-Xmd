"""
Handles all inline keyboard button callbacks.
Routes button presses to appropriate functions.
"""
from telegram import Update
from telegram.ext import CallbackQueryHandler, ContextTypes
from database import get_user, update_user
from msg_style import *

async def handle_callback(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    user = get_user(query.from_user.id, query.from_user.first_name)
    
    if user.get('banned'):
        await query.edit_message_text("🚫 Your account has been banned.", parse_mode="HTML")
        return

    # ═══ MENU NAVIGATION ═══
    if data == "cmd_menu":
        await query.edit_message_text(
            header_box("MAIN MENU", "🎮") + "\n\nChoose an option below:",
            parse_mode="HTML", reply_markup=main_menu_kb())
    
    elif data == "cmd_balance":
        from handlers.economy import _balance_text
        text = _balance_text(user)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=balance_kb())
    
    elif data == "cmd_profile":
        from handlers.economy import _profile_text
        text = _profile_text(user)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=profile_kb(user['user_id']))
    
    elif data == "cmd_stats":
        from handlers.economy import _stats_text
        text = _stats_text(user)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())
    
    elif data == "cmd_leaderboard":
        from handlers.economy import _leaderboard_text
        text = _leaderboard_text(0)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=leaderboard_kb(0))
    
    elif data.startswith("lb_page_"):
        page = int(data.split("_")[2])
        from handlers.economy import _leaderboard_text
        text = _leaderboard_text(page)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=leaderboard_kb(page))
    
    elif data == "cmd_shop":
        await query.edit_message_text(
            header_box("ITEM SHOP", "🛒") + "\n\nSelect a category:",
            parse_mode="HTML", reply_markup=shop_categories_kb())
    
    elif data == "cmd_inventory":
        from handlers.shopping import _inventory_text
        text = _inventory_text(user)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🛒 Shop", callback_data="cmd_shop")],
            [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
        ]))
    
    elif data.startswith("shop_"):
        cat = data.replace("shop_", "")
        from handlers.shopping import _shop_category_text
        text = _shop_category_text(cat)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🔙 Shop", callback_data="cmd_shop")],
        ]))
    
    elif data == "cmd_garage":
        from handlers.vehicles import _garage_text
        text = _garage_text(user)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🚗 Vehicle Shop", callback_data="cmd_vehicleshop")],
            [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
        ]))
    
    elif data == "cmd_properties":
        from handlers.properties import _myproperties_text
        text = _myproperties_text(user)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🏠 Property Shop", callback_data="cmd_propertyshop")],
            [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
        ]))
    
    elif data == "cmd_achievements":
        from handlers.social import _achievements_text
        text = _achievements_text(user)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())
    
    elif data == "cmd_skills":
        from handlers.social import _skills_text
        text = _skills_text(user)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())
    
    elif data == "cmd_vehicleshop":
        from handlers.shopping import _vehicleshop_text
        text = _vehicleshop_text()
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🔙 Shop", callback_data="cmd_shop")],
        ]))
    
    elif data == "cmd_propertyshop":
        from handlers.shopping import _propertyshop_text
        text = _propertyshop_text()
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🔙 Shop", callback_data="cmd_shop")],
        ]))

    # ═══ MENU PAGES ═══
    elif data == "menu_gambling":
        await query.edit_message_text(
            header_box("GAMBLING GAMES", "🎰") + "\n\nChoose a game:",
            parse_mode="HTML", reply_markup=gambling_menu_kb())
    
    elif data == "menu_crime":
        await query.edit_message_text(
            header_box("CRIME ACTIVITIES", "🔫") + "\n\nChoose your crime:",
            parse_mode="HTML", reply_markup=crime_menu_kb())
    
    elif data == "menu_gathering":
        await query.edit_message_text(
            header_box("GATHERING", "🎣") + "\n\nChoose an activity:",
            parse_mode="HTML", reply_markup=gathering_menu_kb())
    
    elif data == "menu_combat":
        await query.edit_message_text(
            header_box("COMBAT ZONE", "⚔️") + "\n\nChoose your battle:",
            parse_mode="HTML", reply_markup=combat_menu_kb())
    
    # ═══ TRANSFER / LOAN INFO ═══
    elif data == "info_transfer":
        text = info_box("TRANSFERS", [
            "Reply to someone: <code>/transfer [amount]</code>",
            "Or: <code>/pay [amount]</code> (same thing)",
            f"Tax: 5% on all transfers",
            f"Min: \$10 | Max: \$1,000,000",
            "Your transfer history in /stats",
        ], "💸")
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=transfer_kb())
    
    elif data == "info_loan":
        text = info_box("LOAN SYSTEM", [
            "Usage: <code>/loan [amount]</code>",
            "Max loan = Level × 5 × \$1,000",
            "Interest: 10% on the amount",
            "Due in 24 hours",
            "Late penalty: +25% extra!",
            "Repay with: <code>/repay</code>",
            "Check status: <code>/loanstatus</code>",
        ], "🏦")
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=loan_kb())
    
    elif data == "info_repay":
        text = info_box("REPAY LOAN", [
            "Usage: <code>/repay</code>",
            "Pays off your active loan",
            "Must have enough in wallet",
            "Late loans cost +25% extra!",
        ], "💸")
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=loan_kb())
    
    elif data == "cmd_loanstatus":
        from handlers.loans import _loan_status_text
        text = _loan_status_text(user)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=loan_kb())
    
    # ═══ DEPOSIT/WITHDRAW ALL ═══
    elif data == "act_deposit_all":
        if user['wallet'] <= 0:
            await query.edit_message_text(error_msg("Empty Wallet", "Nothing to deposit!"), parse_mode="HTML", reply_markup=balance_kb())
            return
        space = user['bank_capacity'] - user['bank']
        amount = min(user['wallet'], space)
        if amount <= 0:
            await query.edit_message_text(error_msg("Bank Full", "Upgrade: /bankupgrade"), parse_mode="HTML", reply_markup=balance_kb())
            return
        update_user(user['user_id'], wallet=user['wallet'] - amount, bank=user['bank'] + amount)
        user = get_user(user['user_id'])
        from handlers.economy import _balance_text
        text = success_msg("Deposited!", f"  💰 {fmt_money(amount)} moved to bank") + "\n" + _balance_text(user)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=balance_kb())
    
    elif data == "act_withdraw_all":
        if user['bank'] <= 0:
            await query.edit_message_text(error_msg("Empty Bank", "Nothing to withdraw!"), parse_mode="HTML", reply_markup=balance_kb())
            return
        amount = user['bank']
        update_user(user['user_id'], wallet=user['wallet'] + amount, bank=0)
        user = get_user(user['user_id'])
        from handlers.economy import _balance_text
        text = success_msg("Withdrawn!", f"  💰 {fmt_money(amount)} moved to wallet") + "\n" + _balance_text(user)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=balance_kb())
    
    # ═══ INFO PAGES ═══
    elif data.startswith("info_"):
        cmd_name = data.replace("info_", "")
        info_texts = {
            "slots": "🎰 <b>Slots</b>\nUsage: <code>/slots [bet]</code>\nMatch 3 symbols to win big!\n\n7️⃣7️⃣7️⃣ = 10x | 💎💎💎 = 7x | Others = 3x\nTwo matching = 2x",
            "coinflip": "🪙 <b>Coinflip</b>\nUsage: <code>/coinflip [heads|tails] [bet]</code>\n50/50 chance, 2x payout!",
            "blackjack": "🃏 <b>Blackjack</b>\nUsage: <code>/blackjack [bet]</code>\nBeat the dealer! Blackjack pays 2.5x",
            "roulette": "🎡 <b>Roulette</b>\nUsage: <code>/roulette [red|black|green|number] [bet]</code>\nColor = 2x | Number = 35x | Green = 35x",
            "dice": "🎲 <b>Dice</b>\nUsage: <code>/dice [1-6] [bet]</code>\nGuess the roll! Correct = 5x",
            "lottery": "🎱 <b>Lottery</b>\nUsage: <code>/lottery</code>\nCosts \$500. Match 5 numbers to win \$500,000!",
            "scratch": "🎫 <b>Scratch Card</b>\nUsage: <code>/scratch</code>\nCosts \$200. Match 3 in a row!",
            "poker": "🃏 <b>Poker</b>\nUsage: <code>/poker [bet]</code>\nRoyal Flush = 50x!",
            "horserace": "🏇 <b>Horse Race</b>\nUsage: <code>/horserace [1-5] [bet]</code>\nPick the winner! 4x payout",
            "crash": "📈 <b>Crash</b>\nUsage: <code>/crash [multiplier] [bet]</code>\nCash out before it crashes!",
            "russian_roulette": "💀 <b>Russian Roulette</b>\nUsage: <code>/russianroulette [bet]</code>\n1 in 6 chance to lose it all... 5x if you survive!",
            "gamble_all": "🎲 <b>Gamble All</b>\nUsage: <code>/gambleall</code>\n50/50 — double your wallet or lose it all!",
            "rob": "🔫 <b>Rob</b>\nReply to someone: <code>/rob</code>\nRequires: 🔧 Crowbar\nOptional: 🎭 Ski Mask, 🧤 Gloves",
            "steal": "🤫 <b>Steal</b>\nUsage: <code>/steal</code>\nNo tools needed. 50% success rate.",
            "heist": "💰 <b>Heist</b>\nUsage: <code>/heist</code>\nRequires: 🔓 Lockpick + 🎭 Mask + 📻 Walkie\nBig risk, big reward!",
            "pickpocket": "👛 <b>Pickpocket</b>\nUsage: <code>/pickpocket</code>\nQuick fingers, quick cash.",
            "hack": "💻 <b>Hack</b>\nUsage: <code>/hack</code>\nRequires: 💻 Hacking Kit",
            "scam": "🪪 <b>Scam</b>\nUsage: <code>/scam</code>\nRequires: 🪪 Fake ID",
            "smuggle": "📦 <b>Smuggle</b>\nUsage: <code>/smuggle</code>\nRequires: Contraband from shop.",
            "crime": "🔨 <b>Crime</b>\nUsage: <code>/crime</code>\nRandom petty crime.",
            "burglary": "🏠 <b>Burglary</b>\nUsage: <code>/burglary</code>\nRequires: 🔓 Lockpick",
            "carjack": "🚗 <b>Carjack</b>\nUsage: <code>/carjack</code>\nSteal and sell a car.",
            "bribe": "💰 <b>Bribe</b>\nUsage: <code>/bribe</code>\nRequires: 💰 Bribe Cash\nBribe officials for rewards!",
            "kidnap": "🔪 <b>Kidnap</b>\nUsage: <code>/kidnap</code>\nRequires: 💉 Chloroform\nKidnap for ransom!",
            "assassinate": "🎯 <b>Assassinate</b>\nUsage: <code>/assassinate</code>\nRequires: 🔭 Sniper Scope\nHigh risk, high reward contract!",
            "treasure": "🗺️ <b>Treasure Hunt</b>\nUsage: <code>/treasure</code>\nRequires: 🗺️ Treasure Map\nFind buried treasure!",
            "transfer": "💸 <b>Transfer</b>\nReply to someone: <code>/transfer [amount]</code>\n5% tax, min \$10, max \$1M",
            "loan": "🏦 <b>Loan</b>\nUsage: <code>/loan [amount]</code>\nMax = Level × 5 × \$1,000\n10% interest, 24h to repay",
            "fish": "🎣 <b>Fish</b>\nUsage: <code>/fish</code>\nRequires: 🎣 Fishing Rod",
            "hunt": "🏹 <b>Hunt</b>\nUsage: <code>/hunt</code>\nRequires: 🏹 Hunting Bow",
            "mine": "⛏️ <b>Mine</b>\nUsage: <code>/mine</code>\nRequires: ⛏️ Pickaxe",
            "chop": "🪓 <b>Chop</b>\nUsage: <code>/chop</code>\nRequires: 🪓 Axe",
            "dig": "🪏 <b>Dig</b>\nUsage: <code>/dig</code>\nRequires: 🪏 Shovel",
            "duel": "⚔️ <b>Duel</b>\nReply to someone: <code>/duel [bet]</code>\nWeapons increase win chance!",
            "arena": "🏟️ <b>Arena</b>\nUsage: <code>/arena [bet]</code>\nFight AI opponents!",
            "jobs": "💼 <b>Jobs</b>\nUse <code>/apply</code> to see available jobs\nHigher levels unlock better salaries!",
        }
        text = info_texts.get(cmd_name, f"ℹ️ Info for {cmd_name}")
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=back_to_menu_kb())
    
    elif data == "noop":
        pass
    
    elif data == "claim_daily":
        from handlers.economy import _claim_reward
        text = await _claim_reward(user, "daily", 500)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=daily_rewards_kb())
    
    elif data == "claim_weekly":
        from handlers.economy import _claim_reward
        text = await _claim_reward(user, "weekly", 5000)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=daily_rewards_kb())
    
    elif data == "claim_monthly":
        from handlers.economy import _claim_reward
        text = await _claim_reward(user, "monthly", 25000)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=daily_rewards_kb())
    
    # ═══ HELP ═══
    elif data == "cmd_help":
        from handlers.misc import _help_text
        text = _help_text()
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("💰 Economy", callback_data="cmd_balance"),
             InlineKeyboardButton("🔫 Crime", callback_data="menu_crime")],
            [InlineKeyboardButton("🎰 Gambling", callback_data="menu_gambling"),
             InlineKeyboardButton("💸 Transfer", callback_data="info_transfer")],
            [InlineKeyboardButton("🏦 Loans", callback_data="info_loan"),
             InlineKeyboardButton("🛒 Shop", callback_data="cmd_shop")],
            [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
        ]))

def register_callback_handlers(app):
    app.add_handler(CallbackQueryHandler(handle_callback))
