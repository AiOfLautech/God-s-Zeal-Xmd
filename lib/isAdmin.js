const GROUP_CACHE_TTL_MS = 60 * 1000;
const groupMetadataCache = new Map();

function normalizeId(value = '') {
    return String(value).split('@')[0].split(':')[0];
}

function participantMatches(participant, targetId) {
    const target = normalizeId(targetId);
    if (!target) return false;

    const candidates = [
        participant?.id,
        participant?.lid,
        participant?.phoneNumber,
    ].map(normalizeId).filter(Boolean);

    return candidates.includes(target);
}

async function getCachedGroupMetadata(sock, chatId) {
    const now = Date.now();
    const cached = groupMetadataCache.get(chatId);

    if (cached && now - cached.timestamp < GROUP_CACHE_TTL_MS) {
        return cached.metadata;
    }

    const metadata = await sock.groupMetadata(chatId);
    groupMetadataCache.set(chatId, { metadata, timestamp: now });
    return metadata;
}

async function isAdmin(sock, chatId, senderId) {
    try {
        const metadata = await getCachedGroupMetadata(sock, chatId);
        const participants = metadata?.participants || [];

        const botId = sock.user?.id || '';
        const botLid = sock.user?.lid || '';

        const isBotAdmin = participants.some((participant) => {
            const matchesBot =
                participantMatches(participant, botId) ||
                participantMatches(participant, botLid);

            return matchesBot && (participant.admin === 'admin' || participant.admin === 'superadmin');
        });

        const isSenderAdmin = participants.some((participant) => {
            return participantMatches(participant, senderId) &&
                (participant.admin === 'admin' || participant.admin === 'superadmin');
        });

        return { isSenderAdmin, isBotAdmin };
    } catch (err) {
        const cached = groupMetadataCache.get(chatId);
        if (cached?.metadata) {
            const participants = cached.metadata.participants || [];
            const botId = sock.user?.id || '';
            const botLid = sock.user?.lid || '';

            const isBotAdmin = participants.some((participant) => {
                const matchesBot =
                    participantMatches(participant, botId) ||
                    participantMatches(participant, botLid);

                return matchesBot && (participant.admin === 'admin' || participant.admin === 'superadmin');
            });

            const isSenderAdmin = participants.some((participant) => {
                return participantMatches(participant, senderId) &&
                    (participant.admin === 'admin' || participant.admin === 'superadmin');
            });

            return { isSenderAdmin, isBotAdmin };
        }

        const message = err?.data === 429 || /rate-overlimit/i.test(String(err?.message || ''))
            ? 'rate-overlimit'
            : String(err?.message || err);
        console.error(`Error in isAdmin: ${message}`);
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}

module.exports = isAdmin;
