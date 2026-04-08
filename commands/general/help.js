const settings = require('../../settings');
const fs = require('fs');
const path = require('path');
const os = require('os');
const isOwnerOrSudo = require('../../lib/isOwner');

const MENU_IMAGE_JSON = path.join(__dirname, '../../data/menuImage.json');
const LOCAL_MENU_IMAGE = path.join(__dirname, '../../assets/bot_image.jpg');

function loadMenuImageUrl() {
    try {
        if (!fs.existsSync(MENU_IMAGE_JSON)) return '';
        const parsed = JSON.parse(fs.readFileSync(MENU_IMAGE_JSON, 'utf8'));
        return String(parsed.url || '').trim();
    } catch {
        return '';
    }
}

function readJsonSafe(filePath, fallback) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return fallback;
    }
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return [days ? `${days}d` : '', hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', `${secs}s`].filter(Boolean).join(' ');
}

function section(title, commands) {
    return [
        `┌ ❏ *⌜ ${title} ⌟* ❏`,
        '│',
        ...commands.map((entry) => `├◆ ${entry}`),
        '└ ❏'
    ].join('\n');
}

async function helpCommand(sock, chatId, message) {
    const prefix = settings.commandPrefix || '.';
    const senderId = message.key.participant || message.key.remoteJid;
    const isPremium = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);
    const modeData = readJsonSafe('./data/messageCount.json', { isPublic: true });
    const lagosNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
    const totalMem = os.totalmem();
    const usedMem = totalMem - os.freemem();
    const memUsage = `${(usedMem / 1024 / 1024 / 1024).toFixed(1)}GB / ${(totalMem / 1024 / 1024 / 1024).toFixed(1)}GB (${((usedMem / totalMem) * 100).toFixed(1)}%)`;
    const cpuModel = os.cpus()?.[0]?.model || 'Unknown CPU';
    const commandSections = [
        section('GENERAL COMMANDS', [
            `${prefix}help / ${prefix}menu`, `${prefix}ping`, `${prefix}alive`, `${prefix}tts <text>`, `${prefix}owner`, `${prefix}joke`,
            `${prefix}quote`, `${prefix}fact`, `${prefix}weather <city>`, `${prefix}news`, `${prefix}attp <text>`, `${prefix}lyrics <title>`,
            `${prefix}8ball <quest>`, `${prefix}groupinfo`, `${prefix}staff / ${prefix}admins`, `${prefix}vv`, `${prefix}trt <txt> <lg>`,
            `${prefix}ss <link>`, `${prefix}jid`, `${prefix}pair <number>`
        ]),
        section('ECONOMY COMMANDS', [
            `${prefix}economy / ${prefix}eco`, `${prefix}balance / ${prefix}bal`, `${prefix}daily`, `${prefix}weekly`, `${prefix}monthly`,
            `${prefix}work`, `${prefix}beg`, `${prefix}deposit <amount|all>`, `${prefix}withdraw <amount|all>`,
            `${prefix}leaderboard / ${prefix}lb`, `${prefix}profile`, `${prefix}networth / ${prefix}nw`
        ]),
        section('ADMIN COMMANDS', [
            `${prefix}ban @user`, `${prefix}promote @user`, `${prefix}demote @user`, `${prefix}mute <minutes>`, `${prefix}unmute`,
            `${prefix}delete / ${prefix}del`, `${prefix}kick @user`, `${prefix}warnings @user`, `${prefix}warn @user`,
            `${prefix}antilink`, `${prefix}antibadword`, `${prefix}clear`, `${prefix}tag <message>`, `${prefix}tagall`,
            `${prefix}chatbot`, `${prefix}resetlink`, `${prefix}antitag <on/off>`, `${prefix}welcome <on/off>`, `${prefix}goodbye <on/off>`
        ]),
        section('OWNER COMMANDS', [
            `${prefix}mode`, `${prefix}settings`, `${prefix}setprefix <char>`, `${prefix}autostatus`, `${prefix}clearsession`,
            `${prefix}antidelete`, `${prefix}cleartmp`, `${prefix}update`, `${prefix}setpp <image>`, `${prefix}autoreact <on/off>`,
            `${prefix}autotyping <on/off>`, `${prefix}autoread <on/off>`, `${prefix}anticall <on/off>`
        ]),
        section('IMAGE/STICKER', [
            `${prefix}blur <image>`, `${prefix}simage <sticker>`, `${prefix}sticker <image>`, `${prefix}tgsticker <link>`,
            `${prefix}meme`, `${prefix}take <packname>`, `${prefix}emojimix <emj1+emj2>`, `${prefix}igs <insta link>`,
            `${prefix}igsc <insta link>`, `${prefix}removebg`, `${prefix}remini`
        ]),
        section('PIES COMMANDS', [
            `${prefix}pies <country>`, `${prefix}china`, `${prefix}indonesia`, `${prefix}japan`, `${prefix}korea`, `${prefix}hijab`
        ]),
        section('GAME COMMANDS', [
            `${prefix}tictactoe @user`, `${prefix}hangman`, `${prefix}guess <letter>`, `${prefix}trivia`, `${prefix}answer <ans>`, `${prefix}truth`, `${prefix}dare`
        ]),
        section('AI COMMANDS', [
            `${prefix}gpt <question>`, `${prefix}gemini <quest>`, `${prefix}imagine <prompt>`, `${prefix}flux <prompt>`, `${prefix}sora <query>`
        ]),
        section('FUN COMMANDS', [
            `${prefix}compliment @user`, `${prefix}insult @user`, `${prefix}flirt`, `${prefix}shayari`, `${prefix}goodnight`,
            `${prefix}roseday`, `${prefix}character @user`, `${prefix}wasted @user`, `${prefix}ship @user`, `${prefix}simp @user`, `${prefix}stupid @user [txt]`
        ]),
        section('TEXTMAKER', [
            `${prefix}metallic <text>`, `${prefix}ice <text>`, `${prefix}snow <text>`, `${prefix}impressive <txt>`, `${prefix}matrix <text>`,
            `${prefix}light <text>`, `${prefix}neon <text>`, `${prefix}devil <text>`, `${prefix}purple <text>`, `${prefix}thunder <text>`,
            `${prefix}leaves <text>`, `${prefix}1917 <text>`, `${prefix}arena <text>`, `${prefix}hacker <text>`, `${prefix}sand <text>`,
            `${prefix}blackpink <txt>`, `${prefix}glitch <text>`, `${prefix}fire <text>`
        ]),
        section('DOWNLOADER', [
            `${prefix}play <song>`, `${prefix}song <name>`, `${prefix}instagram <url>`, `${prefix}facebook <url>`,
            `${prefix}tiktok <url>`, `${prefix}video <name>`, `${prefix}ytmp4 <link>`
        ]),
        section('MISC COMMANDS', [
            `${prefix}heart`, `${prefix}horny`, `${prefix}circle`, `${prefix}lgbt`, `${prefix}lolice`, `${prefix}its-so-stupid`,
            `${prefix}namecard`, `${prefix}oogway`, `${prefix}tweet`, `${prefix}ytcomment`, `${prefix}comrade`, `${prefix}gay`,
            `${prefix}glass`, `${prefix}jail`, `${prefix}passed`, `${prefix}triggered`
        ]),
        section('ANIME COMMANDS', [
            `${prefix}nom`, `${prefix}poke`, `${prefix}cry`, `${prefix}kiss`, `${prefix}pat`, `${prefix}hug`, `${prefix}wink`, `${prefix}facepalm`
        ]),
        section('GITHUB COMMANDS', [
            `${prefix}git`, `${prefix}github`, `${prefix}sc`, `${prefix}script`, `${prefix}repo`, `${prefix}chfollow <count>`, `${prefix}chreact <count> <channel-link> <emoji>`
        ]),
        section('JOIN OUR CHANNEL', [
            'Get free updates & support', 'Exclusive fixes & bot news', 'Godszealtech'
        ])
    ];

    const commandCount = commandSections.reduce((sum, block) => sum + (block.match(/├◆/g) || []).length, 0);
    const mood = lagosNow.getHours() >= 18 || lagosNow.getHours() < 6 ? '🌙' : '☀️';
    const userName = message.pushName || senderId.split('@')[0];

    const header = [
        '┌ ❏ *⌜ 𝐆𝐎𝐃𝐒𝐙𝐄𝐀𝐋 𝐗𝐌𝐃 ⌟* ❏',
        '│',
        `├◆ ᴏᴡɴᴇʀ: ${settings.botOwner}`,
        `├◆ ᴘʀᴇғɪx: ${prefix}`,
        `├◆ ᴜsᴇʀ: ${userName}`,
        `├◆ ᴘʟᴀɴ: ${isPremium ? 'Premium ✓' : 'Free ✓'}`,
        `├◆ ᴠᴇʀsɪᴏɴ: ${settings.version}`,
        `├◆ ᴛɪᴍᴇ: ${lagosNow.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' })} (Africa/Lagos)`,
        `├◆ ᴜᴘᴛɪᴍᴇ: ${formatUptime(process.uptime())}`,
        `├◆ ᴄᴏᴍᴍᴀɴᴅs: ${commandCount}`,
        `├◆ ᴛᴏᴅᴀʏ: ${lagosNow.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Africa/Lagos' })}`,
        `├◆ ᴅᴀᴛᴇ: ${lagosNow.toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos' })}`,
        '├◆ ᴘʟᴀᴛғᴏʀᴍ: Chrome Ubuntu',
        `├◆ ʀᴜɴᴛɪᴍᴇ: Node.js ${process.version}`,
        `├◆ ᴄᴘᴜ: ${cpuModel}`,
        `├◆ ʀᴀᴍ: ${memUsage}`,
        `├◆ ᴍᴏᴅᴇ: ${modeData.isPublic ? 'public' : 'private'}`,
        `├◆ ᴍᴏᴏᴅ: ${mood}`,
        '└ ◆'
    ].join('\n');

    const helpMessage = `${header}\n\n${commandSections.join('\n\n')}`;
    const contextInfo = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: settings.newsletterJid || '120363269950668068@newsletter',
            newsletterName: 'GODS ZEAL XMD',
            serverMessageId: -1
        }
    };

    try {
        const imageUrl = loadMenuImageUrl();
        if (imageUrl) {
            await sock.sendMessage(chatId, { image: { url: imageUrl }, caption: helpMessage, contextInfo }, { quoted: message });
            return;
        }
        if (fs.existsSync(LOCAL_MENU_IMAGE)) {
            await sock.sendMessage(chatId, { image: fs.readFileSync(LOCAL_MENU_IMAGE), caption: helpMessage, contextInfo }, { quoted: message });
            return;
        }
        await sock.sendMessage(chatId, { text: helpMessage, contextInfo }, { quoted: message });
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage }, { quoted: message });
    }
}

module.exports = helpCommand;
