const axios = require('axios');
const { sendStyled } = require('../../lib/menuLayout');

let triviaGames = {};

async function startTrivia(sock, chatId, message) {
    if (triviaGames[chatId]) {
        await sendStyled(sock, chatId, message, {
            title: 'TRIVIA',
            lines: ['A trivia game is already in progress.']
        });
        return;
    }

    try {
        const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple', { timeout: 15000 });
        const questionData = response.data.results[0];
        triviaGames[chatId] = {
            question: questionData.question,
            correctAnswer: questionData.correct_answer,
            options: [...questionData.incorrect_answers, questionData.correct_answer].sort()
        };
        await sendStyled(sock, chatId, message, {
            title: 'TRIVIA',
            lines: [
                questionData.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&'),
                ...triviaGames[chatId].options
            ]
        });
    } catch (error) {
        await sendStyled(sock, chatId, message, {
            title: 'TRIVIA',
            lines: ['Error fetching trivia question. Try again later.']
        });
    }
}

async function answerTrivia(sock, chatId, answer, message) {
    if (!triviaGames[chatId]) {
        await sendStyled(sock, chatId, message, {
            title: 'TRIVIA',
            lines: ['No trivia game is in progress.']
        });
        return;
    }
    const game = triviaGames[chatId];
    const correct = String(answer).toLowerCase() === String(game.correctAnswer).toLowerCase();
    await sendStyled(sock, chatId, message, {
        title: 'TRIVIA',
        lines: [correct ? `Correct. The answer is ${game.correctAnswer}` : `Wrong. The correct answer was ${game.correctAnswer}`]
    });
    delete triviaGames[chatId];
}

module.exports = { startTrivia, answerTrivia };
