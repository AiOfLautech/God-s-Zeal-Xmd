"""
Beautiful message styling for Telegram bot responses.
Uses HTML parse_mode for rich formatting with inline keyboards.
"""
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

# ═══════════ STYLE CONSTANTS ═══════════
HEADER = "━━━━━━━━━━━━━━━━━━━━━━━━━"
DIVIDER = "┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄"
THIN_DIV = "─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─"
BOX_TL = "╔" ; BOX_TR = "╗"
BOX_BL = "╚" ; BOX_BR = "╝"
BOX_H = "═" ; BOX_V = "║"
ARROW = "➤"
DOT = "•"
COIN = "💵"

def fmt_money(amount):
    """Format number as currency with commas."""
    return f"${amount:,}"

def header_box(title, emoji=""):
    """Create a styled header box."""
    return f"""
{emoji} <b>{title}</b>
{HEADER}"""

def success_msg(title, body):
    """Green success message."""
    return f"""
✅ <b>{title}</b>
{DIVIDER}
{body}"""

def error_msg(title, body):
    """Red error message."""
    return f"""
❌ <b>{title}</b>
{DIVIDER}
{body}"""

def info_box(title, lines, emoji="📋"):
    """Info card with title and key-value lines."""
    content = "\n".join(f"  {ARROW} {line}" for line in lines)
    return f"""
{emoji} <b>{title}</b>
{HEADER}
{content}
{HEADER}"""

def stat_line(label, value, emoji=""):
    """Single stat line: emoji Label: value"""
    return f"{emoji} {label}: <b>{value}</b>"

def progress_bar(current, maximum, length=10):
    """Visual progress bar."""
    filled = int((current / max(maximum, 1)) * length)
    empty = length - filled
    return f"[{'█' * filled}{'░' * empty}] {current}/{maximum}"

def cooldown_msg(action, remaining):
    """Cooldown warning message."""
    return f"""
⏰ <b>Cooldown Active</b>
{DIVIDER}
  {ARROW} <b>{action}</b> available in <code>{remaining}</code>"""

def reward_msg(title, amount, bonus_text=""):
    """Reward notification."""
    bonus = f"\n  🎁 Bonus: {bonus_text}" if bonus_text else ""
    return f"""
🎉 <b>{title}</b>
{DIVIDER}
  💰 Received: <b>{fmt_money(amount)}</b>{bonus}"""

def battle_result(winner, loser, amount, details=""):
    """PvP battle result."""
    det = f"\n  📊 {details}" if details else ""
    return f"""
⚔️ <b>BATTLE RESULT</b>
{HEADER}
  🏆 Winner: <b>{winner}</b>
  💀 Loser: <b>{loser}</b>
  💰 Prize: <b>{fmt_money(amount)}</b>{det}
{HEADER}"""

def transfer_msg(sender, receiver, amount, tax, net):
    """Transfer receipt."""
    return f"""
💸 <b>TRANSFER COMPLETE</b>
{HEADER}
  📤 From: <b>{sender}</b>
  📥 To: <b>{receiver}</b>
{DIVIDER}
  💰 Amount: <b>{fmt_money(amount)}</b>
  📊 Tax (5%): <b>{fmt_money(tax)}</b>
  ✅ Received: <b>{fmt_money(net)}</b>
{HEADER}"""

def loan_info_msg(amount, interest, total, due_in):
    """Loan details."""
    return f"""
🏦 <b>LOAN APPROVED</b>
{HEADER}
  💰 Amount: <b>{fmt_money(amount)}</b>
  📈 Interest (10%): <b>{fmt_money(interest)}</b>
  💸 Total Due: <b>{fmt_money(total)}</b>
  ⏰ Due in: <b>{due_in}</b>
{DIVIDER}
  ⚠️ <i>Late penalty: +25%!</i>
  💡 Use <code>/repay</code> to pay back
{HEADER}"""

# ═══════════ KEYBOARD BUILDERS ═══════════

def main_menu_kb():
    """Main menu inline keyboard."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("💰 Balance", callback_data="cmd_balance"),
         InlineKeyboardButton("👤 Profile", callback_data="cmd_profile")],
        [InlineKeyboardButton("🛒 Shop", callback_data="cmd_shop"),
         InlineKeyboardButton("🎒 Inventory", callback_data="cmd_inventory")],
        [InlineKeyboardButton("🎰 Gambling", callback_data="menu_gambling"),
         InlineKeyboardButton("🔫 Crime", callback_data="menu_crime")],
        [InlineKeyboardButton("🎣 Gather", callback_data="menu_gathering"),
         InlineKeyboardButton("⚔️ Combat", callback_data="menu_combat")],
        [InlineKeyboardButton("💸 Transfer", callback_data="info_transfer"),
         InlineKeyboardButton("🏦 Loans", callback_data="info_loan")],
        [InlineKeyboardButton("🏆 Leaderboard", callback_data="cmd_leaderboard"),
         InlineKeyboardButton("📖 Help", callback_data="cmd_help")],
    ])

def balance_kb():
    """Balance action buttons."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📥 Deposit All", callback_data="act_deposit_all"),
         InlineKeyboardButton("📤 Withdraw All", callback_data="act_withdraw_all")],
        [InlineKeyboardButton("🏦 Bank Upgrade", callback_data="cmd_bankupgrade"),
         InlineKeyboardButton("📊 Stats", callback_data="cmd_stats")],
        [InlineKeyboardButton("💸 Transfer", callback_data="info_transfer"),
         InlineKeyboardButton("🏦 Get Loan", callback_data="info_loan")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ])

def transfer_kb():
    """Transfer action buttons."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("💰 Balance", callback_data="cmd_balance"),
         InlineKeyboardButton("📊 History", callback_data="cmd_stats")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ])

def loan_kb():
    """Loan action buttons."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🏦 Take Loan", callback_data="info_loan"),
         InlineKeyboardButton("💸 Repay Loan", callback_data="info_repay")],
        [InlineKeyboardButton("💰 Balance", callback_data="cmd_balance")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ])

def profile_kb(user_id):
    """Profile action buttons."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📊 Stats", callback_data="cmd_stats"),
         InlineKeyboardButton("🎒 Inventory", callback_data="cmd_inventory")],
        [InlineKeyboardButton("🏎️ Garage", callback_data="cmd_garage"),
         InlineKeyboardButton("🏠 Properties", callback_data="cmd_properties")],
        [InlineKeyboardButton("🏆 Achievements", callback_data="cmd_achievements"),
         InlineKeyboardButton("🎯 Skills", callback_data="cmd_skills")],
        [InlineKeyboardButton("🏦 Loan Status", callback_data="cmd_loanstatus")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ])

def shop_categories_kb():
    """Shop category selector."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🔧 Tools", callback_data="shop_tools"),
         InlineKeyboardButton("🔪 Weapons", callback_data="shop_weapons")],
        [InlineKeyboardButton("🎣 Gathering", callback_data="shop_gathering"),
         InlineKeyboardButton("🥤 Consumables", callback_data="shop_consumables")],
        [InlineKeyboardButton("🏆 Collectibles", callback_data="shop_collectibles"),
         InlineKeyboardButton("🍕 Food", callback_data="shop_food")],
        [InlineKeyboardButton("📦 Smuggling", callback_data="shop_smuggling")],
        [InlineKeyboardButton("🚗 Vehicles", callback_data="cmd_vehicleshop"),
         InlineKeyboardButton("🏠 Properties", callback_data="cmd_propertyshop")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ])

def gambling_menu_kb():
    """Gambling games menu."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🎰 Slots", callback_data="info_slots"),
         InlineKeyboardButton("🪙 Coinflip", callback_data="info_coinflip")],
        [InlineKeyboardButton("🃏 Blackjack", callback_data="info_blackjack"),
         InlineKeyboardButton("🎡 Roulette", callback_data="info_roulette")],
        [InlineKeyboardButton("🎲 Dice", callback_data="info_dice"),
         InlineKeyboardButton("🎱 Lottery", callback_data="info_lottery")],
        [InlineKeyboardButton("🎫 Scratch", callback_data="info_scratch"),
         InlineKeyboardButton("🃏 Poker", callback_data="info_poker")],
        [InlineKeyboardButton("🏇 Horse Race", callback_data="info_horserace"),
         InlineKeyboardButton("📈 Crash", callback_data="info_crash")],
        [InlineKeyboardButton("💀 Russian Roulette", callback_data="info_russian_roulette"),
         InlineKeyboardButton("🎲 Gamble All", callback_data="info_gamble_all")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ])

def crime_menu_kb():
    """Crime activities menu."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🔫 Rob", callback_data="info_rob"),
         InlineKeyboardButton("🤫 Steal", callback_data="info_steal")],
        [InlineKeyboardButton("💰 Heist", callback_data="info_heist"),
         InlineKeyboardButton("👛 Pickpocket", callback_data="info_pickpocket")],
        [InlineKeyboardButton("💻 Hack", callback_data="info_hack"),
         InlineKeyboardButton("🪪 Scam", callback_data="info_scam")],
        [InlineKeyboardButton("📦 Smuggle", callback_data="info_smuggle"),
         InlineKeyboardButton("🔨 Crime", callback_data="info_crime")],
        [InlineKeyboardButton("🏠 Burglary", callback_data="info_burglary"),
         InlineKeyboardButton("🚗 Carjack", callback_data="info_carjack")],
        [InlineKeyboardButton("💰 Bribe", callback_data="info_bribe"),
         InlineKeyboardButton("🔪 Kidnap", callback_data="info_kidnap")],
        [InlineKeyboardButton("🎯 Assassinate", callback_data="info_assassinate"),
         InlineKeyboardButton("🗺️ Treasure", callback_data="info_treasure")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ])

def gathering_menu_kb():
    """Gathering activities menu."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🎣 Fish", callback_data="info_fish"),
         InlineKeyboardButton("🏹 Hunt", callback_data="info_hunt")],
        [InlineKeyboardButton("⛏️ Mine", callback_data="info_mine"),
         InlineKeyboardButton("🪓 Chop", callback_data="info_chop")],
        [InlineKeyboardButton("🪏 Dig", callback_data="info_dig")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ])

def combat_menu_kb():
    """Combat menu."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("⚔️ Duel", callback_data="info_duel"),
         InlineKeyboardButton("🏟️ Arena", callback_data="info_arena")],
        [InlineKeyboardButton("💀 Bounties", callback_data="cmd_bountylist"),
         InlineKeyboardButton("🛡️ Defend", callback_data="cmd_defend")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ])

def leaderboard_kb(page=0):
    """Leaderboard pagination."""
    buttons = []
    if page > 0:
        buttons.append(InlineKeyboardButton("⬅️ Prev", callback_data=f"lb_page_{page-1}"))
    buttons.append(InlineKeyboardButton(f"📄 Page {page+1}", callback_data="noop"))
    buttons.append(InlineKeyboardButton("➡️ Next", callback_data=f"lb_page_{page+1}"))
    return InlineKeyboardMarkup([buttons, [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")]])

def confirm_kb(action, amount=""):
    """Confirmation buttons."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("✅ Confirm", callback_data=f"confirm_{action}_{amount}"),
         InlineKeyboardButton("❌ Cancel", callback_data="cmd_menu")],
    ])

def back_to_menu_kb():
    """Simple back button."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🔙 Back to Menu", callback_data="cmd_menu")],
    ])

def play_again_kb(game, bet=""):
    """Play again button for gambling games."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton(f"🔄 Play Again", callback_data=f"replay_{game}_{bet}"),
         InlineKeyboardButton("🎰 All Games", callback_data="menu_gambling")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ])

def daily_rewards_kb():
    """Daily rewards buttons."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📅 Daily", callback_data="claim_daily"),
         InlineKeyboardButton("📆 Weekly", callback_data="claim_weekly")],
        [InlineKeyboardButton("🗓️ Monthly", callback_data="claim_monthly")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ])

def admin_menu_kb():
    """Admin control panel."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📊 Bot Stats", callback_data="admin_stats"),
         InlineKeyboardButton("👥 Users", callback_data="admin_users")],
        [InlineKeyboardButton("💰 Add Money", callback_data="admin_addmoney"),
         InlineKeyboardButton("💸 Remove Money", callback_data="admin_removemoney")],
        [InlineKeyboardButton("🚫 Ban User", callback_data="admin_ban"),
         InlineKeyboardButton("✅ Unban User", callback_data="admin_unban")],
        [InlineKeyboardButton("📢 Broadcast", callback_data="admin_broadcast"),
         InlineKeyboardButton("🔄 Reset User", callback_data="admin_reset")],
        [InlineKeyboardButton("⚙️ Settings", callback_data="admin_settings"),
         InlineKeyboardButton("🏦 Manage Loans", callback_data="admin_loans")],
    ])

def dev_menu_kb():
    """Developer control panel."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📊 System Stats", callback_data="dev_system"),
         InlineKeyboardButton("🗄️ Database", callback_data="dev_db")],
        [InlineKeyboardButton("📝 Logs", callback_data="dev_logs"),
         InlineKeyboardButton("🔧 Debug", callback_data="dev_debug")],
        [InlineKeyboardButton("💰 Eco Control", callback_data="dev_economy"),
         InlineKeyboardButton("⚡ Force Reset", callback_data="dev_forcereset")],
        [InlineKeyboardButton("🔙 Admin Panel", callback_data="cmd_admin")],
    ])
