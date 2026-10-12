const axios = require('axios');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

async function imagineCommand(sock, chatId, message) {
    try {
        const prompt = message.message?.conversation?.trim() ||
                      message.message?.extendedTextMessage?.text?.trim() || '';
        const imagePrompt = prompt.replace(/^[.\/\\!~#$%\-]+\S+\s*/, '').trim();

        if (!imagePrompt) {
            await sendStyled(sock, chatId, message, {
                title: 'IMAGINE',
                lines: [`Usage ☇ ${getPrefix()}imagine a beautiful sunset over mountains`]
            });
            return;
        }

        await sendStyled(sock, chatId, message, {
            title: 'IMAGINE',
            lines: ['Generating your image... Please wait.']
        });

        const enhancedPrompt = enhancePrompt(imagePrompt);
        const response = await axios.get(`https://shizoapi.onrender.com/api/ai/imagine?apikey=shizo&query=${encodeURIComponent(enhancedPrompt)}`, {
            responseType: 'arraybuffer',
            timeout: 60000
        });
        const imageBuffer = Buffer.from(response.data);
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `Generated image for: ${imagePrompt}`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in imagine command:', error);
        await sendStyled(sock, chatId, message, {
            title: 'IMAGINE',
            lines: ['Failed to generate image. Please try again later.']
        });
    }
}

function enhancePrompt(prompt) {
    const qualityEnhancers = [
        'high quality',
        'detailed',
        'masterpiece',
        'best quality',
        'ultra realistic',
        '4k',
        'highly detailed',
        'professional photography',
        'cinematic lighting',
        'sharp focus'
    ];
    const numEnhancers = Math.floor(Math.random() * 2) + 3;
    const selectedEnhancers = qualityEnhancers
        .sort(() => Math.random() - 0.5)
        .slice(0, numEnhancers);
    return `${prompt}, ${selectedEnhancers.join(', ')}`;
}

module.exports = imagineCommand;
