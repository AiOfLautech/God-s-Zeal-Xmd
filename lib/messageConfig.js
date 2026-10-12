const { getConfig } = require('./botConfig');

function getChannelInfo() {
    const cfg = getConfig();
    return {
        contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: cfg.newsletterJid || '120363269950668068@newsletter',
                newsletterName: cfg.newsletterName || cfg.botName || 'GODS ZEAL XMD',
                serverMessageId: -1
            }
        }
    };
}

module.exports = {
    get channelInfo() {
        return getChannelInfo();
    },
    getChannelInfo
};
