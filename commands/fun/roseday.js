const { sendStyled } = require('../../lib/menuLayout');

async function rosedayCommand(sock, chatId, message) {
    await sendStyled(sock, chatId, message, {
        title: 'ROSE DAY',
        lines: [
            'Happy Rose Day.',
            'May your day bloom with love, peace, and beautiful moments.',
            'A rose is a reminder that even soft things can be strong and unforgettable.'
        ]
    });
}

module.exports = { rosedayCommand };
