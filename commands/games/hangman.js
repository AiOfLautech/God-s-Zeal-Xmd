const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

const words = ['javascript', 'bot', 'hangman', 'whatsapp', 'nodejs'];
let hangmanGames = {};

async function startHangman(sock, chatId, message) {
    const word = words[Math.floor(Math.random() * words.length)];
    const maskedWord = '_ '.repeat(word.length).trim();
    hangmanGames[chatId] = {
        word,
        maskedWord: maskedWord.split(' '),
        guessedLetters: [],
        wrongGuesses: 0,
        maxWrongGuesses: 6
    };
    await sendStyled(sock, chatId, message, {
        title: 'HANGMAN',
        lines: [`Game started.`, `Word ☇ ${maskedWord}`]
    });
}

async function guessLetter(sock, chatId, letter, message) {
    if (!hangmanGames[chatId]) {
        await sendStyled(sock, chatId, message, {
            title: 'HANGMAN',
            lines: [`No game in progress. Start with ${getPrefix()}hangman`]
        });
        return;
    }

    const game = hangmanGames[chatId];
    const { word, guessedLetters, maskedWord, maxWrongGuesses } = game;

    if (guessedLetters.includes(letter)) {
        await sendStyled(sock, chatId, message, {
            title: 'HANGMAN',
            lines: [`You already guessed "${letter}".`]
        });
        return;
    }

    guessedLetters.push(letter);
    if (word.includes(letter)) {
        for (let i = 0; i < word.length; i++) {
            if (word[i] === letter) maskedWord[i] = letter;
        }
        await sendStyled(sock, chatId, message, {
            title: 'HANGMAN',
            lines: [`Good guess.`, maskedWord.join(' ')]
        });
        if (!maskedWord.includes('_')) {
            await sendStyled(sock, chatId, message, {
                title: 'HANGMAN',
                lines: [`You guessed the word: ${word}`]
            });
            delete hangmanGames[chatId];
        }
    } else {
        game.wrongGuesses += 1;
        if (game.wrongGuesses >= maxWrongGuesses) {
            await sendStyled(sock, chatId, message, {
                title: 'HANGMAN',
                lines: [`Game over. The word was ${word}.`]
            });
            delete hangmanGames[chatId];
        } else {
            await sendStyled(sock, chatId, message, {
                title: 'HANGMAN',
                lines: [
                    `Wrong guess.`,
                    `Wrong ☇ ${game.wrongGuesses}/${maxWrongGuesses}`,
                    maskedWord.join(' ')
                ]
            });
        }
    }
}

module.exports = { startHangman, guessLetter };
