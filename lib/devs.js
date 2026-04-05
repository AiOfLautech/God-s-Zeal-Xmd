const settings = require('../settings');

function normalizeId(value = '') {
    return String(value || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

function getDevNumbers() {
    const configured = Array.isArray(settings.devNumbers) ? settings.devNumbers : [];
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
