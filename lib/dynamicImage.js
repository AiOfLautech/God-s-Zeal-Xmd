const fs = require("fs");
const path = require("path");

/**
 * Returns a random image path from the assets/images directory.
 * Falls back to bot.jpg if the directory is empty or doesn't exist.
 */
function getDynamicBotImage() {
    const imagesDir = path.join(process.cwd(), "assets", "images");
    try {
        if (fs.existsSync(imagesDir)) {
            const files = fs
                .readdirSync(imagesDir)
                .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));
            if (files.length > 0) {
                const randomFile =
                    files[Math.floor(Math.random() * files.length)];
                return path.join("assets", "images", randomFile);
            }
        }
    } catch (error) {
        console.error("Error reading dynamic images:", error);
    }
    return "bot.jpg"; // Global fallback
}

module.exports = { getDynamicBotImage };
