import random
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, ContextTypes
from database import get_user, update_user
from utils import check_cooldown, add_xp
from msg_style import *

async def slots(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    args = ctx.args
    if not args:
        await update.message.reply_text(
            info_box("Slot Machine", ["Usage: <code>/slots [bet]</code>", "Match symbols to win!", "7️⃣7️⃣7️⃣ = 10x | 💎💎💎 = 7x", "Other 3x match = 3x | 2 match = 2x"], "🎰"),
            parse_mode="HTML", reply_markup=gambling_menu_kb())
        return
    bet = int(args[0])
    if bet <= 0 or bet > user['wallet']:
        await update.message.reply_text(error_msg("Invalid Bet", f"Your wallet: {fmt_money(user['wallet'])}"), parse_mode="HTML")
        return
    symbols = ["🍒", "🍋", "🍊", "🍇", "💎", "7️⃣", "🔔"]
    result = [random.choice(symbols) for _ in range(3)]
    update_user(user['user_id'], total_gambled=user['total_gambled'] + bet)
    display = f"╔═══════════╗\n║  {' │ '.join(result)}  ║\n╚═══════════╝"
    if result[0] == result[1] == result[2]:
        if result[0] == "7️⃣": multiplier = 10
        elif result[0] == "💎": multiplier = 7
        else: multiplier = 3
        winnings = bet * multiplier
        update_user(user['user_id'], wallet=user['wallet'] + winnings - bet, total_won=user['total_won'] + winnings)
        text = f"""
🎰 <b>SLOT MACHINE</b>
{HEADER}
<code>{display}</code>

🎉 <b>JACKPOT! {multiplier}x!</b>
  💰 Won: <b>{fmt_money(winnings)}</b>
  📊 Profit: <b>+{fmt_money(winnings - bet)}</b>
{HEADER}"""
    elif result[0] == result[1] or result[1] == result[2]:
        winnings = bet * 2
        update_user(user['user_id'], wallet=user['wallet'] + winnings - bet, total_won=user['total_won'] + winnings)
        text = f"""
🎰 <b>SLOT MACHINE</b>
{HEADER}
<code>{display}</code>

✨ <b>Two Match! 2x!</b>
  💰 Won: <b>{fmt_money(winnings)}</b>
{HEADER}"""
    else:
        update_user(user['user_id'], wallet=user['wallet'] - bet, total_lost=user['total_lost'] + bet)
        text = f"""
🎰 <b>SLOT MACHINE</b>
{HEADER}
<code>{display}</code>

😔 <b>No match...</b>
  💸 Lost: <b>{fmt_money(bet)}</b>
{HEADER}"""
    add_xp(user['user_id'], 5)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=play_again_kb("slots", str(bet)))

async def coinflip(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    args = ctx.args
    if not args or len(args) < 2:
        await update.message.reply_text(
            info_box("Coinflip", ["Usage: <code>/coinflip [heads|tails] [bet]</code>", "50/50 chance, 2x payout!"], "🪙"),
            parse_mode="HTML", reply_markup=gambling_menu_kb())
        return
    choice = args[0].lower()
    if choice not in ["heads", "tails", "h", "t"]:
        await update.message.reply_text(error_msg("Invalid", "Choose <b>heads</b> or <b>tails</b>!"), parse_mode="HTML")
        return
    bet = int(args[1])
    if bet <= 0 or bet > user['wallet']:
        await update.message.reply_text(error_msg("Invalid Bet", f"Wallet: {fmt_money(user['wallet'])}"), parse_mode="HTML")
        return
    result = random.choice(["heads", "tails"])
    won = (choice[0] == result[0])
    update_user(user['user_id'], total_gambled=user['total_gambled'] + bet)
    coin = "🟡" if result == "heads" else "⚪"
    if won:
        update_user(user['user_id'], wallet=user['wallet'] + bet, total_won=user['total_won'] + bet)
        text = f"""
{coin} <b>COINFLIP</b>
{HEADER}
  🪙 Result: <b>{result.upper()}</b>
  ✅ You chose: <b>{choice.upper()}</b>
  💰 Won: <b>{fmt_money(bet)}</b>
{HEADER}"""
    else:
        update_user(user['user_id'], wallet=user['wallet'] - bet, total_lost=user['total_lost'] + bet)
        text = f"""
{coin} <b>COINFLIP</b>
{HEADER}
  🪙 Result: <b>{result.upper()}</b>
  ❌ You chose: <b>{choice.upper()}</b>
  💸 Lost: <b>{fmt_money(bet)}</b>
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=play_again_kb("coinflip", str(bet)))

async def blackjack(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    args = ctx.args
    if not args:
        await update.message.reply_text(
            info_box("Blackjack", ["Usage: <code>/blackjack [bet]</code>", "Beat the dealer!", "Blackjack = 2.5x payout"], "🃏"),
            parse_mode="HTML", reply_markup=gambling_menu_kb())
        return
    bet = int(args[0])
    if bet <= 0 or bet > user['wallet']:
        await update.message.reply_text(error_msg("Invalid Bet", f"Wallet: {fmt_money(user['wallet'])}"), parse_mode="HTML")
        return
    player = random.randint(15, 21)
    dealer = random.randint(14, 22)
    update_user(user['user_id'], total_gambled=user['total_gambled'] + bet)
    if player == 21:
        winnings = int(bet * 2.5)
        update_user(user['user_id'], wallet=user['wallet'] + winnings - bet, total_won=user['total_won'] + winnings)
        result_text = f"🎉 <b>BLACKJACK!</b>\n  💰 Won: <b>{fmt_money(winnings)}</b> (2.5x)"
    elif dealer > 21 or player > dealer:
        update_user(user['user_id'], wallet=user['wallet'] + bet, total_won=user['total_won'] + bet)
        result_text = f"✅ <b>YOU WIN!</b>\n  💰 Won: <b>{fmt_money(bet)}</b>"
    elif player == dealer:
        result_text = "🤝 <b>PUSH!</b>\n  💰 Bet returned"
    else:
        update_user(user['user_id'], wallet=user['wallet'] - bet, total_lost=user['total_lost'] + bet)
        result_text = f"❌ <b>DEALER WINS!</b>\n  💸 Lost: <b>{fmt_money(bet)}</b>"
    text = f"""
🃏 <b>BLACKJACK</b>
{HEADER}
  👤 You:    <b>{player}</b>
  🎩 Dealer: <b>{dealer}</b> {'💥 BUST!' if dealer > 21 else ''}
{DIVIDER}
  {result_text}
{HEADER}"""
    add_xp(user['user_id'], 10)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=play_again_kb("blackjack", str(bet)))

async def roulette(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    args = ctx.args
    if not args or len(args) < 2:
        await update.message.reply_text(
            info_box("Roulette", ["Usage: <code>/roulette [color|number] [bet]</code>", "🔴 Red/⚫ Black = 2x", "🟢 Green = 35x | Number = 35x"], "🎡"),
            parse_mode="HTML", reply_markup=gambling_menu_kb())
        return
    choice = args[0].lower()
    bet = int(args[1])
    if bet <= 0 or bet > user['wallet']:
        await update.message.reply_text(error_msg("Invalid Bet", f"Wallet: {fmt_money(user['wallet'])}"), parse_mode="HTML")
        return
    number = random.randint(0, 36)
    color = "green" if number == 0 else ("red" if number % 2 == 0 else "black")
    color_emoji = {"red": "🔴", "black": "⚫", "green": "🟢"}[color]
    update_user(user['user_id'], total_gambled=user['total_gambled'] + bet)
    won = False
    multiplier = 0
    if choice == "green" and color == "green": won, multiplier = True, 35
    elif choice in ["red", "black"] and choice == color: won, multiplier = True, 2
    elif choice.isdigit() and int(choice) == number: won, multiplier = True, 35
    if won:
        winnings = bet * multiplier
        update_user(user['user_id'], wallet=user['wallet'] + winnings - bet, total_won=user['total_won'] + winnings)
        text = f"""
🎡 <b>ROULETTE</b>
{HEADER}
  🔮 Ball: <b>{number}</b> {color_emoji} {color.upper()}
  🎯 Your pick: <b>{choice.upper()}</b>
{DIVIDER}
  🎉 <b>WIN! {multiplier}x</b>
  💰 Won: <b>{fmt_money(winnings)}</b>
{HEADER}"""
    else:
        update_user(user['user_id'], wallet=user['wallet'] - bet, total_lost=user['total_lost'] + bet)
        text = f"""
🎡 <b>ROULETTE</b>
{HEADER}
  🔮 Ball: <b>{number}</b> {color_emoji} {color.upper()}
  🎯 Your pick: <b>{choice.upper()}</b>
{DIVIDER}
  😔 <b>No match...</b>
  💸 Lost: <b>{fmt_money(bet)}</b>
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=play_again_kb("roulette", str(bet)))

async def dice(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    args = ctx.args
    if not args or len(args) < 2:
        await update.message.reply_text(
            info_box("Dice", ["Usage: <code>/dice [1-6] [bet]</code>", "Correct guess = 5x payout!"], "🎲"),
            parse_mode="HTML", reply_markup=gambling_menu_kb())
        return
    guess = int(args[0])
    bet = int(args[1])
    if guess < 1 or guess > 6 or bet <= 0 or bet > user['wallet']:
        await update.message.reply_text(error_msg("Invalid", "Pick 1-6 and a valid bet!"), parse_mode="HTML")
        return
    roll = random.randint(1, 6)
    dice_faces = {1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅"}
    update_user(user['user_id'], total_gambled=user['total_gambled'] + bet)
    if roll == guess:
        winnings = bet * 5
        update_user(user['user_id'], wallet=user['wallet'] + winnings - bet, total_won=user['total_won'] + winnings)
        text = f"""
🎲 <b>DICE ROLL</b>
{HEADER}
  {dice_faces[roll]} Rolled: <b>{roll}</b>
  🎯 Your guess: <b>{guess}</b>
  🎉 <b>CORRECT! 5x!</b>
  💰 Won: <b>{fmt_money(winnings)}</b>
{HEADER}"""
    else:
        update_user(user['user_id'], wallet=user['wallet'] - bet, total_lost=user['total_lost'] + bet)
        text = f"""
🎲 <b>DICE ROLL</b>
{HEADER}
  {dice_faces[roll]} Rolled: <b>{roll}</b>
  ❌ Your guess: <b>{guess}</b>
  💸 Lost: <b>{fmt_money(bet)}</b>
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=play_again_kb("dice", str(bet)))

async def lottery(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    can, remaining = check_cooldown(user, "lottery", COOLDOWNS["lottery"])
    if not can:
        await update.message.reply_text(cooldown_msg("Lottery", remaining), parse_mode="HTML")
        return
    cost = 500
    if user['wallet'] < cost:
        await update.message.reply_text(error_msg("No Money", f"Ticket costs {fmt_money(cost)}!"), parse_mode="HTML")
        return
    update_user(user['user_id'], wallet=user['wallet'] - cost, last_lottery=datetime.now().isoformat(), total_gambled=user['total_gambled'] + cost)
    nums = sorted(random.sample(range(1, 50), 5))
    winning = sorted(random.sample(range(1, 50), 5))
    matches = len(set(nums) & set(winning))
    prizes = {0: 0, 1: 100, 2: 500, 3: 5000, 4: 50000, 5: 500000}
    prize = prizes[matches]
    if prize > 0:
        update_user(user['user_id'], wallet=user['wallet'] - cost + prize, total_won=user['total_won'] + prize)
    your_display = " ".join(f"<code>{n:02d}</code>" for n in nums)
    win_display = " ".join(f"<code>{n:02d}</code>" for n in winning)
    match_bar = "🟢" * matches + "⚫" * (5 - matches)
    text = f"""
🎱 <b>LOTTERY DRAW</b>
{HEADER}
  🎫 Your Numbers:
  {your_display}

  🏆 Winning Numbers:
  {win_display}

  {match_bar} <b>{matches}/5 matches</b>
{DIVIDER}
  {'🎉 Won: <b>' + fmt_money(prize) + '</b>!' if prize > 0 else '😔 No prize this time.'}
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=gambling_menu_kb())

async def scratch(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    cost = 200
    if user['wallet'] < cost:
        await update.message.reply_text(error_msg("No Money", f"Card costs {fmt_money(cost)}!"), parse_mode="HTML")
        return
    update_user(user['user_id'], wallet=user['wallet'] - cost, total_gambled=user['total_gambled'] + cost)
    symbols = ["💰", "⭐", "🍀", "💎", "🎁", "❌"]
    grid = [[random.choice(symbols) for _ in range(3)] for _ in range(3)]
    display = "\n".join(["  " + " │ ".join(row) for row in grid])
    wins = 0
    for row in grid:
        if row[0] == row[1] == row[2] and row[0] != "❌": wins += 1
    if wins > 0:
        prize = cost * (wins * 3)
        update_user(user['user_id'], wallet=user['wallet'] - cost + prize, total_won=user['total_won'] + prize)
        text = f"""
🎫 <b>SCRATCH CARD</b>
{HEADER}
{display}
{DIVIDER}
  🎉 <b>{wins} winning row(s)!</b>
  💰 Won: <b>{fmt_money(prize)}</b>
{HEADER}"""
    else:
        text = f"""
🎫 <b>SCRATCH CARD</b>
{HEADER}
{display}
{DIVIDER}
  😔 No matches...
  💸 Cost: <b>{fmt_money(cost)}</b>
{HEADER}"""
    add_xp(user['user_id'], 5)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=gambling_menu_kb())

async def poker(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    args = ctx.args
    if not args:
        await update.message.reply_text(
            info_box("Poker", ["Usage: <code>/poker [bet]</code>", "Royal Flush = 50x!", "Straight = 8x, 3 of Kind = 5x"], "🃏"),
            parse_mode="HTML", reply_markup=gambling_menu_kb())
        return
    bet = int(args[0])
    if bet <= 0 or bet > user['wallet']:
        await update.message.reply_text(error_msg("Invalid Bet", f"Wallet: {fmt_money(user['wallet'])}"), parse_mode="HTML")
        return
    update_user(user['user_id'], total_gambled=user['total_gambled'] + bet)
    suits = ["♠️", "♥️", "♦️", "♣️"]
    ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
    hand = [(random.choice(ranks), random.choice(suits)) for _ in range(5)]
    hand_display = " ".join(f"[{r}{s}]" for r, s in hand)
    rank_counts = {}
    for r, _ in hand:
        rank_counts[r] = rank_counts.get(r, 0) + 1
    max_same = max(rank_counts.values())
    pairs = list(rank_counts.values()).count(2)
    
    if max_same == 4:
        mult, name = 25, "Four of a Kind"
    elif max_same == 3 and pairs == 1:
        mult, name = 15, "Full House"
    elif max_same == 3:
        mult, name = 5, "Three of a Kind"
    elif pairs == 2:
        mult, name = 3, "Two Pair"
    elif pairs == 1:
        mult, name = 2, "Pair"
    else:
        if random.random() < 0.02:
            mult, name = 50, "Royal Flush"
        elif random.random() < 0.05:
            mult, name = 8, "Straight"
        else:
            mult, name = 0, "High Card"
    
    if mult > 0:
        winnings = bet * mult
        update_user(user['user_id'], wallet=user['wallet'] + winnings - bet, total_won=user['total_won'] + winnings)
        text = f"""
🃏 <b>POKER</b>
{HEADER}
  {hand_display}
{DIVIDER}
  🎉 <b>{name}! {mult}x!</b>
  💰 Won: <b>{fmt_money(winnings)}</b>
{HEADER}"""
    else:
        update_user(user['user_id'], wallet=user['wallet'] - bet, total_lost=user['total_lost'] + bet)
        text = f"""
🃏 <b>POKER</b>
{HEADER}
  {hand_display}
{DIVIDER}
  😔 <b>{name}</b> — no win
  💸 Lost: <b>{fmt_money(bet)}</b>
{HEADER}"""
    add_xp(user['user_id'], 10)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=play_again_kb("poker", str(bet)))

async def horserace(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    args = ctx.args
    if not args or len(args) < 2:
        await update.message.reply_text(
            info_box("Horse Race", ["Usage: <code>/horserace [1-5] [bet]</code>", "Pick the winner! 4x payout"], "🏇"),
            parse_mode="HTML", reply_markup=gambling_menu_kb())
        return
    pick = int(args[0])
    bet = int(args[1])
    if pick < 1 or pick > 5 or bet <= 0 or bet > user['wallet']:
        await update.message.reply_text(error_msg("Invalid", "Pick 1-5 and valid bet!"), parse_mode="HTML")
        return
    update_user(user['user_id'], total_gambled=user['total_gambled'] + bet)
    horses = ["🐴", "🦄", "🏇", "🐎", "🦓"]
    winner = random.randint(1, 5)
    race = "\n".join(f"  {'🏆' if i+1 == winner else '  '} #{i+1} {horses[i]} {'━' * random.randint(5, 15)} 🏁" for i in range(5))
    if pick == winner:
        winnings = bet * 4
        update_user(user['user_id'], wallet=user['wallet'] + winnings - bet, total_won=user['total_won'] + winnings)
        text = f"""
🏇 <b>HORSE RACE</b>
{HEADER}
{race}
{DIVIDER}
  🏆 Winner: <b>Horse #{winner}</b>
  🎯 Your Pick: <b>#{pick}</b>
  🎉 <b>CORRECT! 4x!</b>
  💰 Won: <b>{fmt_money(winnings)}</b>
{HEADER}"""
    else:
        update_user(user['user_id'], wallet=user['wallet'] - bet, total_lost=user['total_lost'] + bet)
        text = f"""
🏇 <b>HORSE RACE</b>
{HEADER}
{race}
{DIVIDER}
  🏆 Winner: <b>Horse #{winner}</b>
  ❌ Your Pick: <b>#{pick}</b>
  💸 Lost: <b>{fmt_money(bet)}</b>
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=play_again_kb("horserace", str(bet)))

async def crash(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    args = ctx.args
    if not args or len(args) < 2:
        await update.message.reply_text(
            info_box("Crash", ["Usage: <code>/crash [multiplier] [bet]</code>", "Higher multiplier = bigger reward but less likely", "Example: /crash 2.5 100"], "📈"),
            parse_mode="HTML", reply_markup=gambling_menu_kb())
        return
    target = float(args[0])
    bet = int(args[1])
    if target < 1.1 or target > 100 or bet <= 0 or bet > user['wallet']:
        await update.message.reply_text(error_msg("Invalid", "Multiplier 1.1-100x, valid bet!"), parse_mode="HTML")
        return
    update_user(user['user_id'], total_gambled=user['total_gambled'] + bet)
    crash_at = round(random.uniform(1.0, 10.0), 2)
    if random.random() < 0.05: crash_at = round(random.uniform(10.0, 100.0), 2)
    if crash_at >= target:
        winnings = int(bet * target)
        update_user(user['user_id'], wallet=user['wallet'] + winnings - bet, total_won=user['total_won'] + winnings)
        text = f"""
📈 <b>CRASH</b>
{HEADER}
  📊 Crashed at: <b>{crash_at}x</b>
  🎯 Your cashout: <b>{target}x</b>
  🎉 <b>CASHED OUT IN TIME!</b>
  💰 Won: <b>{fmt_money(winnings)}</b>
{HEADER}"""
    else:
        update_user(user['user_id'], wallet=user['wallet'] - bet, total_lost=user['total_lost'] + bet)
        text = f"""
📈 <b>CRASH</b>
{HEADER}
  📊 Crashed at: <b>{crash_at}x</b>
  🎯 Your cashout: <b>{target}x</b>
  💥 <b>CRASHED BEFORE CASHOUT!</b>
  💸 Lost: <b>{fmt_money(bet)}</b>
{HEADER}"""
    add_xp(user['user_id'], 8)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=play_again_kb("crash", str(bet)))

def register_gambling_handlers(app):
    for cmd, fn in [
        ("slots", slots), ("slot", slots), ("coinflip", coinflip), ("cf", coinflip),
        ("blackjack", blackjack), ("bj", blackjack), ("roulette", roulette),
        ("dice", dice), ("lottery", lottery), ("lotto", lottery),
        ("scratch", scratch), ("poker", poker),
        ("horserace", horserace), ("crash", crash),
    ]:
        app.add_handler(CommandHandler(cmd, fn))
