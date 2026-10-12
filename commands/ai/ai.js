const axios = require('axios');
const fetch = require('node-fetch');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

async function aiCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const prefix = getPrefix();
        const parts = String(text).trim().split(/\s+/);
        const command = (parts[0] || '').toLowerCase().replace(/^[.\/\\!~#$%\-]+/, '.');
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            await sendStyled(sock, chatId, message, {
                title: 'AI',
                lines: [
                    `Usage ☇ ${prefix}gpt write a basic html code`,
                    `Usage ☇ ${prefix}gemini explain gravity`
                ]
            });
            return;
        }

        try {
            await sock.sendMessage(chatId, {
                react: { text: '🤖', key: message.key }
            }).catch(() => {});

            if (command === '.gpt') {
                const response = await axios.get(`https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(query)}`, { timeout: 20000 });
                if (response.data && (response.data.result || response.data.message || response.data.data)) {
                    const answer = response.data.result || response.data.message || response.data.data;
                    await sendStyled(sock, chatId, message, {
                        title: 'GPT',
                        lines: String(answer).split('\n').slice(0, 40)
                    });
                    return;
                }
                throw new Error('Invalid response from API');
            }

            const apis = [
                `https://vapis.my.id/api/gemini?q=${encodeURIComponent(query)}`,
                `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`,
                `https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(query)}`,
                `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(query)}`
            ];

            for (const api of apis) {
                try {
                    const response = await fetch(api);
                    const data = await response.json();
                    if (data.message || data.data || data.answer || data.result) {
                        const answer = data.message || data.data || data.answer || data.result;
                        await sendStyled(sock, chatId, message, {
                            title: 'GEMINI',
                            lines: String(answer).split('\n').slice(0, 40)
                        });
                        return;
                    }
                } catch {
                    continue;
                }
            }
            throw new Error('All Gemini APIs failed');
        } catch (error) {
            console.error('API Error:', error);
            await sendStyled(sock, chatId, message, {
                title: 'AI',
                lines: ['Failed to get response. Please try again later.']
            });
        }
    } catch (error) {
        console.error('AI Command Error:', error);
        await sendStyled(sock, chatId, message, {
            title: 'AI',
            lines: ['An error occurred. Please try again later.']
        });
    }
}

module.exports = aiCommand;
