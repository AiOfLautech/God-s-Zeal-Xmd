const fetch = require('node-fetch');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

async function handleTranslateCommand(sock, chatId, message, match) {
    try {
        await sock.presenceSubscribe(chatId).catch(() => {});
        await sock.sendPresenceUpdate('composing', chatId).catch(() => {});

        let textToTranslate = '';
        let lang = '';
        const prefix = getPrefix();
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMessage) {
            textToTranslate = quotedMessage.conversation ||
                            quotedMessage.extendedTextMessage?.text ||
                            quotedMessage.imageMessage?.caption ||
                            quotedMessage.videoMessage?.caption ||
                            '';
            lang = match.trim();
        } else {
            const args = match.trim().split(' ');
            if (args.length < 2) {
                await sendStyled(sock, chatId, message, {
                    title: 'TRANSLATOR',
                    lines: [
                        `Usage ☇ ${prefix}translate hello fr`,
                        `Reply ☇ ${prefix}trt <lang>`,
                        'Codes ☇ fr es de it pt ru ja ko zh ar hi'
                    ]
                });
                return;
            }
            lang = args.pop();
            textToTranslate = args.join(' ');
        }

        if (!textToTranslate) {
            await sendStyled(sock, chatId, message, {
                title: 'TRANSLATOR',
                lines: ['No text found to translate. Provide text or reply to a message.']
            });
            return;
        }

        let translatedText = null;
        try {
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data[0] && data[0][0] && data[0][0][0]) translatedText = data[0][0][0];
            }
        } catch {}

        if (!translatedText) {
            try {
                const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${lang}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.responseData && data.responseData.translatedText) {
                        translatedText = data.responseData.translatedText;
                    }
                }
            } catch {}
        }

        if (!translatedText) {
            try {
                const response = await fetch(`https://api.dreaded.site/api/translate?text=${encodeURIComponent(textToTranslate)}&lang=${lang}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.translated) translatedText = data.translated;
                }
            } catch {}
        }

        if (!translatedText) throw new Error('All translation APIs failed');

        await sendStyled(sock, chatId, message, {
            title: `TRANSLATE ${String(lang).toUpperCase()}`,
            lines: [translatedText]
        });
    } catch (error) {
        console.error('Error in translate command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'TRANSLATOR',
            lines: ['Failed to translate text. Please try again later.']
        });
    }
}

module.exports = { handleTranslateCommand };
