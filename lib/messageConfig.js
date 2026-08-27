const settings = require('../settings');

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: settings.newsletterJid || '120363269950668068@newsletter',
            newsletterName: 'GODS ZEAL XMD',
            serverMessageId: -1
        }
    }
};

module.exports = {
    channelInfo
};
