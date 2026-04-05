const fs = require('fs');
const settings = require('../settings');
const { isSudo } = require('./index');

function normalizeId(value = '') {
    return String(value).split('@')[0].split(':')[0];
}

function getOwnerNumbers() {
    const configured = Array.isArray(settings.ownerNumbers) && settings.ownerNumbers.length
        ? settings.ownerNumbers
        : [settings.ownerNumber];

    try {
        const fileOwners = JSON.parse(fs.readFileSync('./data/owner.json', 'utf8'));
        if (Array.isArray(fileOwners) && fileOwners.length) {
            return [...new Set([...configured.map(String), ...fileOwners.map(String)])];
        }
    } catch {}

    return [...new Set(configured.map(String))];
}

async function isOwnerOrSudo(senderId, sock = null) {
    const ownerNumbers = getOwnerNumbers().map(normalizeId);
    const senderClean = normalizeId(senderId);

    if (!senderClean) {
        return false;
    }

    if (ownerNumbers.includes(senderClean)) {
        return true;
    }

    if (senderId.endsWith('@s.whatsapp.net') && ownerNumbers.includes(senderClean)) {
        return true;
    }

    if (senderId.endsWith('@lid') && sock?.user?.lid) {
        const botLid = normalizeId(sock.user.lid);
        if (botLid && senderClean === botLid) {
            return true;
        }
    }

    if (ownerNumbers.some((num) => String(senderId).includes(num))) {
        return true;
    }

    try {
        return await isSudo(senderId);
    } catch (e) {
        console.error(`[isOwner] Error checking sudo: ${e.message || e}`);
        return false;
    }
}

module.exports = isOwnerOrSudo;
