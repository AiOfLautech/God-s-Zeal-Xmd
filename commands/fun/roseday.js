async function rosedayCommand(sock, chatId, message) {
    const lines = [
        'Happy Rose Day.',
        'May your day bloom with love, peace, and beautiful moments.',
        'A rose is a reminder that even soft things can be strong and unforgettable.'
    ];

    await sock.sendMessage(chatId, {
        text: `*ROSE DAY*\n\n${lines.join('\n\n')}`
    }, { quoted: message });
}

module.exports = { rosedayCommand };
