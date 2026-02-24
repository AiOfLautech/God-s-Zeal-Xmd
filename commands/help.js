const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDynamicBotImage } = require('../lib/dynamicImage');

// Format uptime properly
function formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;

    return time.trim();
}

// Format RAM usage
function formatRam(total, free) {
    const used = (total - free) / (1024 * 1024 * 1024);
    const totalGb = total / (1024 * 1024 * 1024);
    const percent = ((used / totalGb) * 100).toFixed(1);
    return `${used.toFixed(1)}GB / ${totalGb.toFixed(1)}GB (${percent}%)`;
}

// Count total commands
function countCommands() {
    const commandsPath = path.join(__dirname, '../commands');
    try {
        const files = fs.readdirSync(commandsPath);
        return files.filter(file => file.endsWith('.js')).length;
    } catch (error) {
        return 158;
    }
}

// Get mood emoji based on time
function getMoodEmoji() {
    const hour = getLagosTime().getHours();
    if (hour < 12) return '🌅';
    if (hour < 18) return '☀️';
    return '🌙';
}

// Get countdown to next day
function getCountdown() {
    const now = getLagosTime();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `(${hours}h ${minutes}m)`;
}

// Get current time in Africa/Lagos timezone
function getLagosTime() {
    try {
        // Try using Intl API for proper timezone handling
        const options = {
            timeZone: 'Africa/Lagos',
            hour12: false,
            hour: 'numeric',
            minute: 'numeric'
        };
        
        const formatter = new Intl.DateTimeFormat('en-GB', options);
        const parts = formatter.formatToParts(new Date());
        
        const hour = parts.find(part => part.type === 'hour').value;
        const minute = parts.find(part => part.type === 'minute').value;
        
        // Create a new Date object with the correct time
        const now = new Date();
        const lagosDate = new Date(now.toLocaleString('en-US', {timeZone: 'Africa/Lagos'}));
        
        return lagosDate;
    } catch (error) {
        // Fallback for environments without Intl API support
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        // Africa/Lagos is UTC+1
        return new Date(utc + (3600000 * 1));
    }
}

// Format time specifically for Africa/Lagos
function formatLagosTime() {
    const lagosTime = getLagosTime();
    const hours = lagosTime.getHours().toString().padStart(2, '0');
    const minutes = lagosTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

async function helpCommand(sock, chatId, message) {
    const helpMessage = `
┌ ❏ *⌜ 𝐆𝐎𝐃𝐒𝐙𝐄𝐀𝐋 𝐗𝐌𝐃 ⌟* ❏ 
│
├◆ ᴏᴡɴᴇʀ: ${settings.botOwner || 'Godszeal Tech'}
├◆ ᴘʀᴇғɪx: .
├◆ ᴜsᴇʀ: ${message.pushName}
├◆ ᴘʟᴀɴ: Premium ${'✓'}
├◆ ᴠᴇʀsɪᴏɴ: ${settings.version || '2.0.5'}
├◆ ᴛɪᴍᴇ: ${formatLagosTime()} (Africa/Lagos)
├◆ ᴜᴘᴛɪᴍᴇ: ${formatUptime(process.uptime())}
├◆ ᴄᴏᴍᴍᴀɴᴅs: ${countCommands()}
├◆ ᴛᴏᴅᴀʏ: ${new Date().toLocaleDateString('en-US', {weekday: 'long'})}
├◆ ᴅᴀᴛᴇ: ${new Date().toLocaleDateString('en-GB')}
├◆ ᴘʟᴀᴛғᴏʀᴍ: Chrome Ubuntu
├◆ ʀᴜɴᴛɪᴍᴇ: Node.js v${process.version.replace('v', '')}
├◆ ᴄᴘᴜ: ${os.cpus()[0].model.split(' ')[0]} ${os.cpus()[0].speed}MHz
├◆ ʀᴀᴍ: ${formatRam(os.totalmem(), os.freemem())}
├◆ ᴍᴏᴅᴇ: ${settings.commandMode || 'Public'}
├◆ ᴍᴏᴏᴅ: ${getMoodEmoji()} ${getCountdown()}
└ ◆
‎

┌ ❏ *⌜ GENERAL COMMANDS ⌟* ❏
│
├◆ .help / .menu
├◆ .ping
├◆ .alive
├◆ .tts <text>
├◆ .owner
├◆ .joke
├◆ .quote
├◆ .fact
├◆ .weather <city>
├◆ .news
├◆ .attp <text>
├◆ .lyrics <title>
├◆ .8ball <quest>
├◆ .groupinfo
├◆ .staff / .admins
├◆ .vv
├◆ .trt <txt> <lg>
├◆ .ss <link>
├◆ .jid
└ ❏

┌ ❏ *⌜ ADMIN COMMANDS ⌟* ❏
│
├◆ .ban @user
├◆ .promote @user
├◆ .demote @user
├◆ .mute <minutes>
├◆ .unmute
├◆ .delete / .del
├◆ .kick @user
├◆ .warnings @user
├◆ .warn @user
├◆ .antilink
├◆ .antibadword
├◆ .clear
├◆ .tag <message>
├◆ .tagall
├◆ .chatbot
├◆ .resetlink
├◆ .vcf
├◆ .antitag <on/off>
├◆ .welcome <on/off>
├◆ .goodbye <on/off>
└ ❏

┌ ❏ *⌜ OWNER COMMANDS ⌟* ❏
│
├◆ .mode
├◆ .autostatus
├◆ .clearsession
├◆ .antidelete
├◆ .cleartmp
├◆ .update
├◆ .setpp <image>
├◆ .autoreact <on/off>
├◆ .autostatus <on/off>
├◆ .autostatus react <on/off>
├◆ .autotyping <on/off>
├◆ .autoread <on/off>
├◆ .anticall <on/off
└ ❏

┌ ❏ *⌜ IMAGE/STICKER ⌟* ❏
│
├◆ .blur <image>
├◆ .simage <sticker>
├◆ .sticker <image>
├◆ .tgsticker <Link>
├◆ .meme
├◆ .take <packname>
├◆ .emojimix <emj1+emj2>
├◆ .igs <insta link>
├◆ .igsc <insta link>
├◆ .take <packname>
├◆ .removebg
├◆ .remini
├◆ .crop <reply to image>
└ ❏

┌ ❏ *⌜ PIES COMMANDS ⌟* ❏
│
├◆ .pies <country>
├◆ .china 
├◆ .indonesia 
├◆ .japan 
├◆ .korea 
├◆ .hijab
└ ❏

┌ ❏ *⌜ GAME COMMANDS ⌟* ❏
│
├◆ .tictactoe @user
├◆ .hangman
├◆ .guess <letter>
├◆ .trivia
├◆ .answer <ans>
├◆ .truth
├◆ .dare
└ ❏

┌ ❏ *⌜ AI COMMANDS ⌟* ❏
│
├◆ .gpt <question>
├◆ .gemini <quest>
├◆ .imagine <prompt>
├◆ .flux <prompt>
├◆ .godszeal <query>
└ ❏

┌ ❏ *⌜ FUN COMMANDS ⌟* ❏
│
├◆ .compliment @user
├◆ .insult @user
├◆ .flirt
├◆ .shayari
├◆ .goodnight
├◆ .roseday
├◆ .character @user
├◆ .wasted @user
├◆ .ship @user
├◆ .simp @user
├◆ .stupid @user [txt]
└ ❏

┌ ❏ *⌜ TEXTMAKER ⌟* ❏
│
├◆ .metallic <text>
├◆ .ice <text>
├◆ .snow <text>
├◆ .impressive <txt>
├◆ .matrix <text>
├◆ .light <text>
├◆ .neon <text>
├◆ .devil <text>
├◆ .purple <text>
├◆ .thunder <text>
├◆ .leaves <text>
├◆ .1917 <text>
├◆ .arena <text>
├◆ .hacker <text>
├◆ .sand <text>
├◆ .blackpink <txt>
├◆ .glitch <text>
├◆ .fire <text>
└ ❏

┌ ❏ *⌜ DOWNLOADER ⌟* ❏
│
├◆ .play <song>
├◆ .song <name>
├◆ .instagram <url>
├◆ .facebook <url>
├◆ .tiktok <url>
├◆ .video <name>
├◆ .ytmp4 <Link>
├◆ .movie <title>
└ ❏

┌ ❏ *⌜ DEVELOPER COMMANDS ⌟* ❏
│
├◆ .createapi <METHOD> <ENDPOINT> <RESPONSE_TYPE>
├◆ .dev
├◆ .developer
└ ❏

┌ ❏ *⌜ TOOLS COMMANDS ⌟* ❏
│
├◆ .tempnum <country-code>
├◆ .templist
├◆ .otpbox <number>
└ ❏

┌ ❏ *⌜ MISC COMMANDS ⌟* ❏
│
├◆ .heart
├◆ .horny
├◆ .circle
├◆ .lgbt
├◆ .lolice
├◆ .its-so-stupid
├◆ .namecard 
├◆ .oogway
├◆ .tweet
├◆ .ytcomment 
├◆ .comrade 
├◆ .gay 
├◆ .glass 
├◆ .jail 
├◆ .passed 
├◆ .triggered
└ ❏

┌ ❏ *⌜ ANIME COMMANDS ⌟* ❏
│
├◆ .neko
├◆ .waifu
├◆ .loli
├◆ .nom 
├◆ .poke 
├◆ .cry 
├◆ .kiss 
├◆ .pat 
├◆ .hug 
├◆ .wink 
├◆ .facepalm 
└ ❏

┌ ❏ *⌜ GITHUB COMMANDS ⌟* ❏
│
├◆ .git
├◆ .github
├◆ .sc
├◆ .script
├◆ .repo
└ ❏

┌ ❏ *⌜ JOIN OUR CHANNEL ⌟* ❏
│
├◆ Get premium features & updates
├◆ Exclusive commands & support
├◆ ${global.ytch}
└ ❏`;

    try {
        const dynamicImagePath = getDynamicBotImage();
        const imagePath = path.isAbsolute(dynamicImagePath) ? dynamicImagePath : path.join(process.cwd(), dynamicImagePath);
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363269950668068@newsletter',
                        newsletterName: '❦ ════ •⊰❂ GODSZEAL XMD ❂⊱• ════ ❦',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
        } else {
            console.error('Bot image not found at:', imagePath);
            await sock.sendMessage(chatId, { 
                text: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363269950668068@newsletter',
                        newsletterName: '❦ ════ •⊰❂ GODSZEAL XMD ❂⊱• ════ ❦',
                        serverMessageId: -1
                    } 
                }
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage }, { quoted: message });
    }
}

module.exports = helpCommand;
