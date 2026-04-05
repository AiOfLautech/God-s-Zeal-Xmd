"""
Cloud Sync Module — Pushes bot data to Lovable Cloud dashboard.
Uses the bot-sync edge function to keep the web dashboard updated in real-time.
"""

import httpx
import asyncio
import logging
from config import SUPABASE_URL, SUPABASE_ANON_KEY

logger = logging.getLogger(__name__)

SYNC_URL = f"{SUPABASE_URL}/functions/v1/bot-sync"

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "apikey": SUPABASE_ANON_KEY,
}


async def sync_user(user_data: dict):
    """Sync a user's data to the cloud dashboard."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                SYNC_URL,
                json={"action": "sync_user", "user": user_data},
                headers=HEADERS,
                timeout=10,
            )
            if resp.status_code == 200:
                logger.debug(f"Synced user {user_data.get('telegram_id')}")
            else:
                logger.warning(f"Sync failed: {resp.text}")
    except Exception as e:
        logger.error(f"Sync error: {e}")


async def log_transaction(telegram_id: int, tx_type: str, amount: int, description: str = "", target_id: int = None):
    """Log a transaction to the cloud dashboard."""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                SYNC_URL,
                json={
                    "action": "log_transaction",
                    "transaction": {
                        "telegram_id": telegram_id,
                        "type": tx_type,
                        "amount": amount,
                        "description": description,
                        "target_telegram_id": target_id,
                    },
                },
                headers=HEADERS,
                timeout=10,
            )
    except Exception as e:
        logger.error(f"Transaction log error: {e}")


async def set_bot_config(bot_name: str, admin_ids: list, dev_ids: list):
    """Push bot configuration to the cloud."""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                SYNC_URL,
                json={
                    "action": "set_config",
                    "config": {
                        "bot_name": bot_name,
                        "admin_ids": admin_ids,
                        "dev_ids": dev_ids,
                    },
                },
                headers=HEADERS,
                timeout=10,
            )
    except Exception as e:
        logger.error(f"Config sync error: {e}")


def build_user_sync_data(user_id: int, user_record: dict) -> dict:
    """Convert internal user record to sync format."""
    return {
        "telegram_id": user_id,
        "username": user_record.get("username"),
        "first_name": user_record.get("first_name"),
        "wallet": user_record.get("wallet", 0),
        "bank": user_record.get("bank", 0),
        "bank_capacity": user_record.get("bank_capacity", 10000),
        "level": user_record.get("level", 1),
        "xp": user_record.get("xp", 0),
        "xp_needed": user_record.get("xp_needed", 100),
        "daily_streak": user_record.get("daily_streak", 0),
        "total_earned": user_record.get("total_earned", 0),
        "total_spent": user_record.get("total_spent", 0),
        "games_won": user_record.get("games_won", 0),
        "games_lost": user_record.get("games_lost", 0),
        "crimes_committed": user_record.get("crimes_committed", 0),
        "items": user_record.get("items", {}),
        "achievements": user_record.get("achievements", []),
        "inventory": user_record.get("inventory", []),
        "is_banned": user_record.get("is_banned", False),
    }
