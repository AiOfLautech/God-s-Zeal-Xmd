const settings = require('../settings');
const { getConfig } = require('./botConfig');

function normalizeId(value = '') {
    return String(value || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

function getDevNumbers() {
    const cfg = getConfig();
    const configured = Array.isArray(cfg.devNumbers) ? cfg.devNumbers : (Array.isArray(settings.devNumbers) ? settings.devNumbers : []);
    return [...new Set(configured.map(normalizeId).filter(Boolean))];
}

function isDev(senderId = '') {
    const normalized = normalizeId(senderId);
    if (!normalized) return false;
    return getDevNumbers().includes(normalized);
}

module.exports = {
    normalizeId,
    getDevNumbers,
    isDev,
};
