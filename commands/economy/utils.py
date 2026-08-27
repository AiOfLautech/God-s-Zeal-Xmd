from datetime import datetime, timedelta
from database import get_user, update_user

def format_money(amount):
    return f"${amount:,}"

def check_cooldown(user, action, cooldown_seconds):
    last = user.get(f"last_{action}")
    if not last:
        return True, ""
    try:
        last_time = datetime.fromisoformat(last)
    except:
        return True, ""
    elapsed = (datetime.now() - last_time).total_seconds()
    if elapsed >= cooldown_seconds:
        return True, ""
    remaining = cooldown_seconds - elapsed
    hours = int(remaining // 3600)
    minutes = int((remaining % 3600) // 60)
    seconds = int(remaining % 60)
    if hours > 0:
        return False, f"{hours}h {minutes}m"
    elif minutes > 0:
        return False, f"{minutes}m {seconds}s"
    else:
        return False, f"{seconds}s"

def add_xp(user_id, amount):
    user = get_user(user_id)
    new_xp = user['xp'] + amount
    level = user['level']
    xp_needed = level * 100
    while new_xp >= xp_needed:
        new_xp -= xp_needed
        level += 1
        xp_needed = level * 100
    update_user(user_id, xp=new_xp, level=level)
    return level > user['level']
