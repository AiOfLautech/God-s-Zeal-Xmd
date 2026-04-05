const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const settings = require('../settings');

let giftedButtons = null;
try {
    giftedButtons = require('gifted-btns');
} catch {
    giftedButtons = null;
}

const fallbackLocalImage = path.join(process.cwd(), 'assets', 'bot_image.jpg');

function getForwardedContext() {
    return {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: settings.newsletterJid || '120363269950668068@newsletter',
            newsletterName: 'GODS ZEAL XMD',
            serverMessageId: -1,
        },
    };
}

function getCtaButtons() {
    return [
        {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
                display_text: 'View Channel',
                url: settings.channelUrl || 'https://whatsapp.com/channel/0029Va90zAnIHphOuO8Msp3A',
            }),
        },
        {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
                display_text: 'YouTube',
                url: settings.youtubeUrl || 'https://youtube.com/@Godszealtech',
            }),
        },
    ];
}

function escapeXml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function wrapLines(text = '', lineLength = 32, maxLines = 5) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= lineLength) {
            current = candidate;
        } else {
            if (current) lines.push(current);
            current = word;
        }
        if (lines.length >= maxLines) break;
    }

    if (current && lines.length < maxLines) lines.push(current);
    return lines.length ? lines : ['GODS ZEAL XMD'];
}

async function createThemeImageBuffer({ theme = 'economy', title = '', body = '', footer = '' }) {
    const colors = {
        economy: ['#10201a', '#1f6f54', '#f7e6a2'],
        rewards: ['#27121b', '#9c2f55', '#ffd166'],
        leaderboard: ['#181226', '#5145cd', '#f4f1de'],
        premium: ['#0f172a', '#0ea5e9', '#f8fafc'],
        audit: ['#131313', '#ea580c', '#fafaf9'],
    };
    const [bg, accent, textColor] = colors[theme] || colors.economy;
    const bodyLines = wrapLines(body, 36, 6);
    const footerLines = wrapLines(footer, 40, 2);

    const svg = `
    <svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bg}"/>
          <stop offset="100%" stop-color="${accent}"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="1080" fill="url(#g)"/>
      <circle cx="920" cy="190" r="180" fill="rgba(255,255,255,0.08)"/>
      <circle cx="160" cy="920" r="220" fill="rgba(255,255,255,0.06)"/>
      <rect x="70" y="70" width="940" height="940" rx="42" fill="rgba(0,0,0,0.22)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
      <text x="110" y="170" fill="${textColor}" font-size="38" font-family="Arial" font-weight="700">GODSZEAL XMD</text>
      <text x="110" y="260" fill="#ffffff" font-size="78" font-family="Arial" font-weight="900">${escapeXml(title)}</text>
      ${bodyLines.map((line, index) => `<text x="110" y="${380 + (index * 72)}" fill="#f8fafc" font-size="44" font-family="Arial">${escapeXml(line)}</text>`).join('')}
      ${footerLines.map((line, index) => `<text x="110" y="${870 + (index * 42)}" fill="${textColor}" font-size="28" font-family="Arial">${escapeXml(line)}</text>`).join('')}
    </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
}

async function resolveImageSource(sock, imageJid, theme, title, body, footer) {
    try {
        const generated = await createThemeImageBuffer({ theme, title, body, footer });
        if (generated) return generated;
    } catch {}

    if (sock && imageJid && typeof sock.profilePictureUrl === 'function') {
        try {
            const url = await sock.profilePictureUrl(imageJid, 'image');
            if (url) return { url };
        } catch {}
    }

    if (fs.existsSync(fallbackLocalImage)) {
        return fs.readFileSync(fallbackLocalImage);
    }

    return null;
}

function buildInteractiveButtons({ quickReplies = [], sections = [], includeCtas = true }) {
    const buttons = [];

    for (const reply of quickReplies) {
        buttons.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: reply.text,
                id: reply.id,
            }),
        });
    }

    if (sections.length) {
        buttons.push({
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
                title: 'Open Menu',
                sections,
            }),
        });
    }

    if (includeCtas) {
        buttons.push(...getCtaButtons());
    }

    return buttons;
}

async function sendRichInteractive(sock, chatId, quoted, options) {
    const {
        title = '',
        body = '',
        footer = 'GODS ZEAL XMD',
        imageJid = '',
        theme = 'economy',
        quickReplies = [],
        sections = [],
        includeCtas = true,
        contextInfo = getForwardedContext(),
    } = options;

    const text = title ? `${title}\n\n${body}` : body;
    const image = await resolveImageSource(sock, imageJid, theme, title, body, footer);
    const interactiveButtons = buildInteractiveButtons({ quickReplies, sections, includeCtas });

    if (giftedButtons?.sendInteractiveMessage) {
        try {
            return await giftedButtons.sendInteractiveMessage(sock, chatId, {
                title,
                text: body,
                footer,
                image,
                contextInfo,
                interactiveButtons,
            });
        } catch {}
    }

    if (giftedButtons?.sendButtons && !sections.length) {
        try {
            return await giftedButtons.sendButtons(sock, chatId, {
                title,
                text: body,
                footer,
                image,
                contextInfo,
                buttons: quickReplies.map((entry) => ({ id: entry.id, text: entry.text })),
            });
        } catch {}
    }

    if (image) {
        return sock.sendMessage(chatId, { image, caption: text, contextInfo }, { quoted });
    }

    return sock.sendMessage(chatId, { text, contextInfo }, { quoted });
}

module.exports = {
    getForwardedContext,
    sendRichInteractive,
};
