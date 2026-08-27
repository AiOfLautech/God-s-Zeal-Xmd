import logging
from telegram.ext import Application
from config import BOT_TOKEN
from handlers import register_all_handlers

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    register_all_handlers(app)
    logger.info("🎮 Economy Bot started successfully!")
    app.run_polling()

if __name__ == "__main__":
    main()
