"""
Telegram WebApp Handler — Opens the dashboard as an in-app mini app.
Auto-detects admin/dev status and passes user chat ID.
"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ContextTypes, CommandHandler
from config import WEBAPP_URL, ADMIN_IDS, DEV_IDS
from msg_style import header_box, info_box, ARROW


async def webapp_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Open the web dashboard as a Telegram Mini App."""
    user = update.effective_user
    is_admin = user.id in ADMIN_IDS or user.id in DEV_IDS

    buttons = []
    buttons.append([
        InlineKeyboardButton(
            "📊 Open Dashboard",
            web_app=WebAppInfo(url=f"{WEBAPP_URL}/dashboard")
        )
    ])
    buttons.append([
        InlineKeyboardButton(
            "🏆 Leaderboard",
            web_app=WebAppInfo(url=f"{WEBAPP_URL}/dashboard")
        )
    ])

    if is_admin:
        buttons.append([
            InlineKeyboardButton(
                "🔒 Admin Panel",
                web_app=WebAppInfo(url=f"{WEBAPP_URL}/admin")
            )
        ])

    msg = header_box("WEB DASHBOARD", "🌐")
    msg += f"\n  {ARROW} View your stats, leaderboards & more!"
    if is_admin:
        msg += f"\n  {ARROW} 🔒 <b>Admin access detected</b>"

    await update.message.reply_text(
        msg,
        reply_markup=InlineKeyboardMarkup(buttons),
        parse_mode="HTML",
    )


async def stats_webapp_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Quick stats link via WebApp."""
    await update.message.reply_text(
        "📊 <b>View your stats in the web app:</b>",
        reply_markup=InlineKeyboardMarkup([[
            InlineKeyboardButton(
                "📊 My Stats",
                web_app=WebAppInfo(url=f"{WEBAPP_URL}/dashboard")
            )
        ]]),
        parse_mode="HTML",
    )


def register_webapp_handlers(app):
    app.add_handler(CommandHandler("webapp", webapp_cmd))
    app.add_handler(CommandHandler("dashboard", webapp_cmd))
    app.add_handler(CommandHandler("webstats", stats_webapp_cmd))
