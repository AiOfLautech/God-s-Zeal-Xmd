"""
Loan system — borrow money with interest, repay within time limit.
"""
from datetime import datetime, timedelta
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, ContextTypes
from database import get_user, update_user, create_loan, get_active_loan, pay_loan, has_item
from config import *
from msg_style import *

def _loan_status_text(user):
    """Get loan status text."""
    loan = get_active_loan(user['user_id'])
    if not loan:
        max_loan = user['level'] * MAX_LOAN_MULTIPLIER * 1000
        return info_box("LOAN STATUS", [
            "✅ No active loan",
            f"💰 You can borrow up to <b>{fmt_money(max_loan)}</b>",
            f"📈 Interest: {int(LOAN_INTEREST_RATE * 100)}%",
            f"⏰ Repay within {LOAN_DURATION_HOURS}h",
            "Use: <code>/loan [amount]</code>",
        ], "🏦")
    
    due = datetime.fromisoformat(loan['due_at'])
    now = datetime.now()
    overdue = now > due
    
    if overdue:
        penalty = int(loan['total_due'] * LOAN_PENALTY_RATE)
        total_now = loan['total_due'] + penalty
        time_text = "⚠️ <b>OVERDUE!</b>"
        penalty_line = f"\n  🚨 Penalty (+{int(LOAN_PENALTY_RATE*100)}%): <b>{fmt_money(penalty)}</b>\n  💸 Total Now: <b>{fmt_money(total_now)}</b>"
    else:
        remaining = due - now
        hours = int(remaining.total_seconds() // 3600)
        mins = int((remaining.total_seconds() % 3600) // 60)
        time_text = f"⏰ Due in: <b>{hours}h {mins}m</b>"
        penalty_line = ""
    
    return f"""
🏦 <b>ACTIVE LOAN</b>
{HEADER}
  💰 Borrowed: <b>{fmt_money(loan['amount'])}</b>
  📈 Interest: <b>{fmt_money(loan['interest'])}</b>
  💸 Total Due: <b>{fmt_money(loan['total_due'])}</b>
  {time_text}{penalty_line}
{DIVIDER}
  💡 Use <code>/repay</code> to pay off
{HEADER}"""

async def loan(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    
    existing = get_active_loan(user['user_id'])
    if existing:
        text = _loan_status_text(user)
        await update.message.reply_text(text, parse_mode="HTML", reply_markup=loan_kb())
        return
    
    max_loan = user['level'] * MAX_LOAN_MULTIPLIER * 1000
    
    args = ctx.args
    if not args:
        await update.message.reply_text(
            info_box("TAKE A LOAN", [
                f"Usage: <code>/loan [amount]</code>",
                f"Max: <b>{fmt_money(max_loan)}</b> (Level {user['level']})",
                f"Interest: {int(LOAN_INTEREST_RATE * 100)}%",
                f"Due in: {LOAN_DURATION_HOURS} hours",
                f"Late penalty: +{int(LOAN_PENALTY_RATE * 100)}%!",
            ], "🏦"), parse_mode="HTML", reply_markup=loan_kb())
        return
    
    try:
        amount = int(args[0])
    except ValueError:
        await update.message.reply_text(error_msg("Invalid", "Enter a valid number!"), parse_mode="HTML")
        return
    
    if amount <= 0:
        await update.message.reply_text(error_msg("Invalid", "Amount must be positive!"), parse_mode="HTML")
        return
    if amount > max_loan:
        await update.message.reply_text(
            error_msg("Too Much", f"Max loan at Level {user['level']}: <b>{fmt_money(max_loan)}</b>"),
            parse_mode="HTML")
        return
    
    # Check for loan voucher (50% interest reduction)
    has_voucher = has_item(user['user_id'], "loan_voucher")
    rate = LOAN_INTEREST_RATE * 0.5 if has_voucher else LOAN_INTEREST_RATE
    if has_voucher:
        from database import remove_item
        remove_item(user['user_id'], "loan_voucher")
    
    interest = int(amount * rate)
    total_due = amount + interest
    due_at = (datetime.now() + timedelta(hours=LOAN_DURATION_HOURS)).isoformat()
    
    create_loan(user['user_id'], amount, interest, total_due, due_at)
    update_user(user['user_id'], 
                wallet=user['wallet'] + amount,
                active_loan=1, loan_amount=total_due)
    
    voucher_text = "\n  🎫 Loan Voucher used! (50% off interest)" if has_voucher else ""
    text = loan_info_msg(amount, interest, total_due, f"{LOAN_DURATION_HOURS} hours") + voucher_text
    
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=loan_kb())

async def repay(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    
    loan_data = get_active_loan(user['user_id'])
    if not loan_data:
        await update.message.reply_text(
            info_box("NO LOAN", ["You have no active loan!", "Use <code>/loan [amount]</code> to borrow"], "✅"),
            parse_mode="HTML", reply_markup=loan_kb())
        return
    
    due = datetime.fromisoformat(loan_data['due_at'])
    now = datetime.now()
    overdue = now > due
    
    total = loan_data['total_due']
    if overdue:
        penalty = int(total * LOAN_PENALTY_RATE)
        total += penalty
        penalty_text = f"\n  🚨 Late Penalty: <b>{fmt_money(penalty)}</b>"
    else:
        penalty_text = ""
    
    if user['wallet'] < total:
        await update.message.reply_text(
            error_msg("Not Enough Money", f"  💸 Need: <b>{fmt_money(total)}</b>\n  👛 Have: <b>{fmt_money(user['wallet'])}</b>{penalty_text}"),
            parse_mode="HTML", reply_markup=loan_kb())
        return
    
    update_user(user['user_id'], 
                wallet=user['wallet'] - total,
                active_loan=0, loan_amount=0)
    pay_loan(loan_data['id'])
    
    text = f"""
✅ <b>LOAN REPAID!</b>
{HEADER}
  💰 Original: <b>{fmt_money(loan_data['amount'])}</b>
  📈 Interest: <b>{fmt_money(loan_data['interest'])}</b>{penalty_text}
  💸 Total Paid: <b>{fmt_money(total)}</b>
  👛 Remaining: <b>{fmt_money(user['wallet'] - total)}</b>
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=loan_kb())

async def loanstatus(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id, update.effective_user.first_name)
    text = _loan_status_text(user)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=loan_kb())

def register_loan_handlers(app):
    for cmd, fn in [
        ("loan", loan), ("borrow", loan),
        ("repay", repay), ("payloan", repay),
        ("loanstatus", loanstatus), ("debt", loanstatus),
    ]:
        app.add_handler(CommandHandler(cmd, fn))
