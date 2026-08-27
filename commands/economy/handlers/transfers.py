"""
Transfer system — send money between users with tax.
"""
import random
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, ContextTypes
from database import get_user, update_user, log_transaction
from config import *
from msg_style import *

async def transfer(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Transfer money to another user (reply to their message)."""
    if not update.message.reply_to_message:
        await update.message.reply_text(
            info_box("TRANSFER", [
                "Reply to someone's message:",
                "<code>/transfer [amount]</code>",
                "<code>/pay [amount]</code>",
                f"Tax: {int(TRANSFER_TAX_RATE * 100)}%",
                f"Min: {fmt_money(MIN_TRANSFER)} | Max: {fmt_money(MAX_TRANSFER)}",
            ], "💸"), parse_mode="HTML", reply_markup=transfer_kb())
        return
    
    args = ctx.args
    if not args:
        await update.message.reply_text(error_msg("Missing Amount", "Usage: <code>/transfer [amount]</code>"), parse_mode="HTML")
        return
    
    try:
        amount = int(args[0])
    except ValueError:
        await update.message.reply_text(error_msg("Invalid", "Enter a valid number!"), parse_mode="HTML")
        return
    
    if amount < MIN_TRANSFER:
        await update.message.reply_text(error_msg("Too Small", f"Minimum transfer: {fmt_money(MIN_TRANSFER)}"), parse_mode="HTML")
        return
    if amount > MAX_TRANSFER:
        await update.message.reply_text(error_msg("Too Large", f"Maximum transfer: {fmt_money(MAX_TRANSFER)}"), parse_mode="HTML")
        return
    
    sender = get_user(update.effective_user.id, update.effective_user.first_name)
    target_user = update.message.reply_to_message.from_user
    receiver = get_user(target_user.id, target_user.first_name)
    
    if sender['user_id'] == receiver['user_id']:
        await update.message.reply_text(error_msg("Error", "Can't transfer to yourself!"), parse_mode="HTML")
        return
    
    if amount > sender['wallet']:
        await update.message.reply_text(
            error_msg("Not Enough Money", f"  👛 Wallet: <b>{fmt_money(sender['wallet'])}</b>\n  💸 Need: <b>{fmt_money(amount)}</b>"),
            parse_mode="HTML")
        return
    
    tax = int(amount * TRANSFER_TAX_RATE)
    net = amount - tax
    
    update_user(sender['user_id'], 
                wallet=sender['wallet'] - amount,
                total_transferred=sender.get('total_transferred', 0) + amount)
    update_user(receiver['user_id'], 
                wallet=receiver['wallet'] + net,
                total_received=receiver.get('total_received', 0) + net)
    log_transaction(sender['user_id'], receiver['user_id'], amount, "transfer")
    
    text = transfer_msg(
        update.effective_user.first_name,
        target_user.first_name,
        amount, tax, net
    )
    
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton("💰 Balance", callback_data="cmd_balance"),
         InlineKeyboardButton("💸 Transfer Again", callback_data="info_transfer")],
        [InlineKeyboardButton("🔙 Menu", callback_data="cmd_menu")],
    ])
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=kb)
    
    # Notify receiver
    try:
        notify_text = f"""
📨 <b>MONEY RECEIVED!</b>
{HEADER}
  📤 From: <b>{update.effective_user.first_name}</b>
  💰 Amount: <b>{fmt_money(net)}</b>
  📊 (After {int(TRANSFER_TAX_RATE*100)}% tax on {fmt_money(amount)})
{HEADER}"""
        await ctx.bot.send_message(receiver['user_id'], notify_text, parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("💰 Check Balance", callback_data="cmd_balance")],
            ]))
    except:
        pass

async def donate(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Donate money (no tax, charitable)."""
    if not update.message.reply_to_message:
        await update.message.reply_text(
            info_box("DONATE", [
                "Reply to someone: <code>/donate [amount]</code>",
                "No tax! Pure generosity 💝",
            ], "💝"), parse_mode="HTML")
        return
    args = ctx.args
    if not args:
        await update.message.reply_text(error_msg("Missing Amount", "<code>/donate [amount]</code>"), parse_mode="HTML")
        return
    amount = int(args[0])
    sender = get_user(update.effective_user.id, update.effective_user.first_name)
    if amount <= 0 or amount > sender['wallet']:
        await update.message.reply_text(error_msg("Invalid", "Not enough money!"), parse_mode="HTML")
        return
    target = update.message.reply_to_message.from_user
    receiver = get_user(target.id, target.first_name)
    
    update_user(sender['user_id'], wallet=sender['wallet'] - amount,
                total_transferred=sender.get('total_transferred', 0) + amount)
    update_user(receiver['user_id'], wallet=receiver['wallet'] + amount,
                total_received=receiver.get('total_received', 0) + amount)
    log_transaction(sender['user_id'], receiver['user_id'], amount, "donate")
    
    text = f"""
💝 <b>DONATION SENT!</b>
{HEADER}
  📤 From: <b>{update.effective_user.first_name}</b>
  📥 To: <b>{target.first_name}</b>
  💰 Amount: <b>{fmt_money(amount)}</b>
  📊 Tax: <b>FREE!</b> 💝
{HEADER}"""
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=transfer_kb())

def register_transfer_handlers(app):
    for cmd, fn in [
        ("transfer", transfer), ("pay", transfer), ("send", transfer),
        ("donate", donate),
    ]:
        app.add_handler(CommandHandler(cmd, fn))
