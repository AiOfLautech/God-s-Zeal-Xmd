const { getConfig, updateConfig } = require('./botConfig');

const KEYS = ['telegram', 'join', 'image', 'pair', 'pairjoin'];

function getToggleState() {
    const cfg = getConfig();
    return {
        telegram: Boolean(cfg.telegram?.enabled),
        join: Boolean(cfg.telegram?.forceJoin),
        image: Boolean(cfg.telegram?.sendImage),
        pair: Boolean(cfg.webPair?.enabled),
        pairjoin: Boolean(cfg.webPair?.forceJoin)
    };
}

function scheduleSync(which) {
    setTimeout(() => {
        try {
            if (which === 'telegram') require('./telegramBot').syncTelegram();
            else if (which === 'webPair') require('./webPair').syncWebPair();
        } catch (error) {
            console.error(`[toggles] sync ${which} failed:`, error.message);
        }
    }, 400);
}

function applyToggle(key, explicit) {
    if (!KEYS.includes(key)) return null;
    const cfg = getConfig();
    const state = getToggleState();
    const target = explicit === undefined ? !state[key] : Boolean(explicit);

    if (key === 'telegram') {
        updateConfig({ telegram: { ...cfg.telegram, enabled: target } });
        scheduleSync('telegram');
    } else if (key === 'join') {
        updateConfig({ telegram: { ...cfg.telegram, forceJoin: target } });
    } else if (key === 'image') {
        updateConfig({ telegram: { ...cfg.telegram, sendImage: target } });
    } else if (key === 'pair') {
        updateConfig({ webPair: { ...cfg.webPair, enabled: target } });
        scheduleSync('webPair');
    } else if (key === 'pairjoin') {
        updateConfig({ webPair: { ...cfg.webPair, forceJoin: target } });
    }

    return target;
}

module.exports = {
    KEYS,
    getToggleState,
    applyToggle
};
