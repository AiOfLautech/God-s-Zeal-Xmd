const fs = require('fs');
const path = require('path');
const { getConfig, getPrefix, getMenuStyle } = require('./botConfig');
const { getChannelInfo } = require('./messageConfig');

const LOCAL_IMAGE = path.join(process.cwd(), 'assets', 'bot_image.jpg');
const LOCAL_THUMB = path.join(process.cwd(), 'assets', 'bot_thumb.jpg');
const MENU_IMAGE_JSON = path.join(process.cwd(), 'data', 'menuImage.json');

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return [days ? `${days}d` : '', hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', `${secs}s`].filter(Boolean).join(' ');
}

function todayLabel() {
    return new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Africa/Lagos'
    });
}

function loadMode() {
    try {
        const data = JSON.parse(fs.readFileSync('./data/messageCount.json', 'utf8'));
        if (typeof data.isPublic === 'boolean') return data.isPublic ? 'Public' : 'Private';
    } catch {}
    return 'Public';
}

function readMenuImageUrl(cfg = {}) {
    const fromCfg = String(cfg.menuImage || '').trim();
    if (fromCfg) return fromCfg;
    try {
        if (fs.existsSync(MENU_IMAGE_JSON)) {
            const parsed = JSON.parse(fs.readFileSync(MENU_IMAGE_JSON, 'utf8'));
            const url = String(parsed.url || parsed.menuImage || '').trim();
            if (url) return url;
        }
    } catch {}
    return '';
}

function isHttpUrl(value) {
    return /^https?:\/\//i.test(String(value || '').trim());
}

function loadMenuImage(cfg) {
    const url = readMenuImageUrl(cfg);
    if (isHttpUrl(url)) return { url };
    if (fs.existsSync(LOCAL_IMAGE)) return fs.readFileSync(LOCAL_IMAGE);
    return null;
}

function jpegThumbnail() {
    try {
        const source = fs.existsSync(LOCAL_THUMB) ? LOCAL_THUMB : (fs.existsSync(LOCAL_IMAGE) ? LOCAL_IMAGE : '');
        if (!source) return undefined;
        return fs.readFileSync(source);
    } catch {}
    return undefined;
}

function infoBox(cfg, extras = {}) {
    const prefix = getPrefix();
    const userName = extras.userName || 'User';
    const plan = extras.plan || 'Free';
    return [
        `╭─〔 *${cfg.botName}* 〕`,
        `│ Creator ☇ *${cfg.creator}*`,
        `│ Number ☇ *${cfg.creatorNumber}*`,
        `│ Telegram ☇ *${cfg.telegram}*`,
        `│ Bot Name ☇ *${cfg.botName}*`,
        `│ Newsletter ☇ *${cfg.newsletterName}*`,
        `│ Type ☇ *CommonJs*`,
        `│ User ☇ *${userName}*`,
        `│ Status User ☇ *${plan}*`,
        `│ Mode Bot ☇ *${loadMode()}*`,
        `│ Prefix ☇ *${prefix}*`,
        `│ Version ☇ *${cfg.version}*`,
        `│ Run Time ☇ ${formatUptime(process.uptime())}`,
        '╰──────────────'
    ].join('\n');
}

function commandBlock(title, rows) {
    return [
        `─〔 \`${title}\` 〕`,
        ...rows.map((row) => `│  • ${row}`),
        '╰━━━━━━━━━━━━'
    ].join('\n');
}

function compactBlock(title, rows) {
    return `─〔 \`${title}\` 〕 ${rows.join(' • ')}`;
}

function commandCatalog(prefix) {
    return [
        {
            title: 'GENERAL',
            rows: [
                `${prefix}menu`, `${prefix}help`, `${prefix}bot`, `${prefix}list`, `${prefix}ping`,
                `${prefix}alive`, `${prefix}owner`, `${prefix}pair <number>`, `${prefix}settings`,
                `${prefix}jid`, `${prefix}tts <text>`, `${prefix}weather <city>`, `${prefix}news`,
                `${prefix}lyrics <title>`, `${prefix}ss <link>`, `${prefix}translate <text>`,
                `${prefix}url`, `${prefix}vv`, `${prefix}script`, `${prefix}git`
            ]
        },
        {
            title: 'ADMIN',
            rows: [
                `${prefix}ban @user`, `${prefix}unban @user`, `${prefix}kick @user`, `${prefix}promote @user`,
                `${prefix}demote @user`, `${prefix}mute <min>`, `${prefix}unmute`, `${prefix}tagall`,
                `${prefix}tag`, `${prefix}hidetag`, `${prefix}tagnotadmin`, `${prefix}warn @user`,
                `${prefix}warnings`, `${prefix}delete`, `${prefix}clear`, `${prefix}antilink`,
                `${prefix}antitag`, `${prefix}antibadword`, `${prefix}welcome`, `${prefix}goodbye`,
                `${prefix}chatbot`, `${prefix}resetlink`, `${prefix}groupinfo`, `${prefix}staff`,
                `${prefix}gcstatus`, `${prefix}setgdesc`, `${prefix}setgname`, `${prefix}setgpp`,
                `${prefix}mention`, `${prefix}setmention`
            ]
        },
        {
            title: 'OWNER',
            rows: [
                `${prefix}setprefix <char>`, `${prefix}setmenu <style>`, `${prefix}sessions`, `${prefix}mode`,
                `${prefix}update`, `${prefix}setpp`, `${prefix}clearsession`, `${prefix}cleartmp`,
                `${prefix}autostatus`, `${prefix}anticall`, `${prefix}autoread`, `${prefix}autotyping`,
                `${prefix}antidelete`, `${prefix}pmblocker`, `${prefix}sudo`, `${prefix}areact`,
                `${prefix}chfollow`, `${prefix}chreact`
            ]
        },
        {
            title: 'MEDIA',
            rows: [
                `${prefix}sticker`, `${prefix}s`, `${prefix}simage`, `${prefix}take`, `${prefix}steal`,
                `${prefix}crop`, `${prefix}play <song>`, `${prefix}song <name>`, `${prefix}video <name>`,
                `${prefix}music`, `${prefix}spotify`, `${prefix}tiktok <url>`, `${prefix}instagram <url>`,
                `${prefix}igs <url>`, `${prefix}igsc <url>`, `${prefix}facebook <url>`, `${prefix}remini`,
                `${prefix}removebg`, `${prefix}blur`, `${prefix}emojimix`, `${prefix}tg <url>`, `${prefix}attp`
            ]
        },
        {
            title: 'AI',
            rows: [
                `${prefix}gpt <text>`, `${prefix}gemini <text>`, `${prefix}imagine <prompt>`,
                `${prefix}flux <prompt>`, `${prefix}dalle <prompt>`, `${prefix}sora <prompt>`
            ]
        },
        {
            title: 'FUN',
            rows: [
                `${prefix}truth`, `${prefix}dare`, `${prefix}joke`, `${prefix}quote`, `${prefix}fact`,
                `${prefix}meme`, `${prefix}flirt`, `${prefix}ship`, `${prefix}character`, `${prefix}waste`,
                `${prefix}compliment`, `${prefix}insult`, `${prefix}8ball`, `${prefix}simp`, `${prefix}stupid`,
                `${prefix}goodnight`, `${prefix}shayari`, `${prefix}roseday`
            ]
        },
        {
            title: 'MISC',
            rows: [
                `${prefix}misc`, `${prefix}heart`, `${prefix}horny`, `${prefix}circle`, `${prefix}lgbt`, `${prefix}lied`,
                `${prefix}lolice`, `${prefix}simpcard`, `${prefix}tonikawa`, `${prefix}its-so-stupid`,
                `${prefix}namecard`, `${prefix}oogway`, `${prefix}oogway2`, `${prefix}tweet`, `${prefix}ytcomment`,
                `${prefix}comrade`, `${prefix}gay`, `${prefix}glass`, `${prefix}jail`, `${prefix}passed`,
                `${prefix}triggered`
            ]
        },
        {
            title: 'GAMES',
            rows: [
                `${prefix}tictactoe`, `${prefix}ttt`, `${prefix}move <n>`, `${prefix}surrender`,
                `${prefix}hangman`, `${prefix}guess <letter>`, `${prefix}trivia`, `${prefix}answer`,
                `${prefix}topmembers`
            ]
        },
        {
            title: 'TEXTMAKER',
            rows: [
                `${prefix}metallic`, `${prefix}ice`, `${prefix}snow`, `${prefix}impressive`, `${prefix}matrix`,
                `${prefix}light`, `${prefix}neon`, `${prefix}devil`, `${prefix}purple`, `${prefix}thunder`,
                `${prefix}leaves`, `${prefix}1917`, `${prefix}arena`, `${prefix}hacker`, `${prefix}sand`,
                `${prefix}blackpink`, `${prefix}glitch`, `${prefix}fire`
            ]
        },
        {
            title: 'ANIME',
            rows: [
                `${prefix}animu`, `${prefix}nom`, `${prefix}poke`, `${prefix}cry`, `${prefix}kiss`,
                `${prefix}pat`, `${prefix}hug`, `${prefix}wink`, `${prefix}facepalm`, `${prefix}animuquote`,
                `${prefix}pies`, `${prefix}china`, `${prefix}indonesia`, `${prefix}japan`, `${prefix}korea`,
                `${prefix}india`, `${prefix}malaysia`, `${prefix}thailand`
            ]
        },
        {
            title: 'ECONOMY',
            rows: [
                `${prefix}economy`, `${prefix}balance`, `${prefix}daily`, `${prefix}weekly`, `${prefix}monthly`,
                `${prefix}work`, `${prefix}beg`, `${prefix}deposit`, `${prefix}withdraw`, `${prefix}leaderboard`,
                `${prefix}profile`, `${prefix}networth`, `${prefix}ecostats`, `${prefix}cooldowns`,
                `${prefix}bankupgrade`
            ]
        }
    ];
}

function buildMenuBody(cfg, extras = {}) {
    const prefix = getPrefix();
    const style = extras.style || getMenuStyle();
    const greeting = extras.userName ? `\nhaloo ${extras.userName}` : `\nhaloo ${cfg.botName}`;
    const groups = extras.groups || commandCatalog(prefix);
    const head = infoBox(cfg, extras);
    if (style === 'compact') {
        return `${greeting}\n${head}\n\n${groups.map((group) => compactBlock(group.title, group.rows)).join('\n')}`;
    }
    return `${greeting}\n${head}\n\n${groups.map((group) => commandBlock(group.title, group.rows)).join('\n\n')}`;
}

function replyBox(title, lines = []) {
    const cfg = getConfig();
    return [
        `╭─〔 *${title || cfg.botName}* 〕`,
        ...lines.map((line) => `│ ${line}`),
        '╰──────────────'
    ].join('\n');
}

function menuButtons(prefix) {
    return [
        { buttonId: `${prefix}menu`, buttonText: { displayText: 'menu' }, type: 1 },
        { buttonId: `${prefix}script`, buttonText: { displayText: 'script' }, type: 1 },
        { buttonId: `${prefix}owner`, buttonText: { displayText: 'owner' }, type: 1 }
    ];
}

function nativeFlowNodes() {
    return [
        {
            tag: 'biz',
            attrs: {},
            content: [
                {
                    tag: 'interactive',
                    attrs: { type: 'native_flow', v: '1' },
                    content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' }, content: undefined }]
                }
            ]
        }
    ];
}

async function sendLocationButtons(sock, chatId, message, { contentText, footerText, buttons, name, address }) {
    const cfg = getConfig();
    let proto;
    let generateWAMessageFromContent;
    try {
        ({ proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys'));
    } catch {
        return false;
    }
    const thumbnail = jpegThumbnail();
    const payloadObject = {
        buttonsMessage: {
            contentText: contentText || `\nhaloo ${cfg.botName}`,
            footerText: footerText,
            headerType: 6,
            buttons: (buttons || menuButtons(getPrefix())).map((btn) => ({
                buttonId: btn.buttonId,
                buttonText: { displayText: btn.buttonText.displayText },
                type: 1
            })),
            locationMessage: {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: name || cfg.botName,
                address: address || todayLabel(),
                jpegThumbnail: thumbnail
            }
        }
    };
    try {
        const extractedPayload = proto.Message.fromObject(payloadObject);
        const extraNodes = nativeFlowNodes();
        const jid = sock.user?.id;
        if (jid && !String(chatId).endsWith('@g.us')) {
            extraNodes.push({ tag: 'bot', attrs: { biz_bot: '1' }, content: undefined });
        }
        const extractedMessage = generateWAMessageFromContent(chatId, extractedPayload, {
            userJid: jid,
            quoted: message
        });
        await sock.relayMessage(chatId, extractedMessage.message, {
            messageId: extractedMessage.key.id,
            additionalNodes: extraNodes
        });
        return true;
    } catch (error) {
        console.error('newmenu location buttons failed:', error.message);
        return false;
    }
}

async function sendStyled(sock, chatId, message, options = {}) {
    const cfg = getConfig();
    const prefix = getPrefix();
    const style = String(options.style || getMenuStyle()).toLowerCase();
    const title = options.title || cfg.botName;
    const lines = options.lines || [];
    const footer = options.footer || commandBlock('MENU', [
        `${prefix}menu`,
        `${prefix}ping`,
        `${prefix}owner`,
        `${prefix}pair`,
        `${prefix}setmenu button`,
        `${prefix}setmenu normal`
    ]);
    const contentText = options.contentText || `\nhaloo ${options.userName || cfg.botName}`;
    const body = options.body || `${contentText}\n${replyBox(title, lines)}`;
    const buttons = options.buttons || menuButtons(prefix);
    const contextInfo = getChannelInfo().contextInfo;
    const image = options.image !== undefined ? options.image : loadMenuImage(cfg);

    const useButtons = ['button', 'newmenu', 'buttons'].includes(style);
    if (useButtons) {
        const sent = await sendLocationButtons(sock, chatId, message, {
            contentText,
            footerText: `${body}\n\n${footer}`,
            buttons,
            name: cfg.botName,
            address: todayLabel()
        });
        if (sent) return true;
        try {
            await sock.sendMessage(chatId, {
                text: `${body}\n\n${footer}`,
                footer: cfg.botName,
                buttons,
                headerType: 1,
                contextInfo
            }, { quoted: message });
            return true;
        } catch {}
    }

    const caption = `${body}\n\n${footer}`;
    try {
        if (image) {
            await sock.sendMessage(chatId, { image, caption, contextInfo }, { quoted: message });
            return true;
        }
    } catch {}
    await sock.sendMessage(chatId, { text: caption, contextInfo }, { quoted: message });
    return true;
}

async function sendMenu(sock, chatId, message, extras = {}) {
    const cfg = getConfig();
    const prefix = getPrefix();
    const style = extras.style || getMenuStyle();
    const body = buildMenuBody(cfg, extras);
    return sendStyled(sock, chatId, message, {
        style,
        title: cfg.botName,
        contentText: `\nhaloo ${extras.userName || cfg.botName}`,
        body,
        footer: `─〔 \`MENU\` 〕\n│  • ${prefix}setmenu button\n│  • ${prefix}setmenu normal\n│  • ${prefix}setprefix .\n╰━━━━━━━━━━━━`,
        buttons: menuButtons(prefix),
        userName: extras.userName,
        image: loadMenuImage(cfg)
    });
}

module.exports = {
    formatUptime,
    infoBox,
    commandBlock,
    replyBox,
    commandCatalog,
    buildMenuBody,
    menuButtons,
    loadMenuImage,
    sendStyled,
    sendMenu,
    todayLabel
};
