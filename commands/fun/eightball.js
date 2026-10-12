const { sendStyled } = require('../../lib/menuLayout');

const eightBallResponses = [
    'Yes, definitely!',
    'No way!',
    'Ask again later.',
    'It is certain.',
    'Very doubtful.',
    'Without a doubt.',
    'My reply is no.',
    'Signs point to yes.'
];

async function eightBallCommand(sock, chatId, question, message) {
    if (!question) {
        await sendStyled(sock, chatId, message, {
            title: '8BALL',
            lines: ['Please ask a question.']
        });
        return;
    }
    const randomResponse = eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];
    await sendStyled(sock, chatId, message, {
        title: '8BALL',
        lines: [question, randomResponse]
    });
}

module.exports = { eightBallCommand };
