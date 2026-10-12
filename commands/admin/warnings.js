const fs = require('fs');
const path = require('path');
const { sendStyled } = require('../../lib/menuLayout');

const warningsFilePath = path.join(__dirname, '../../data/warnings.json');

function loadWarnings() {
    if (!fs.existsSync(warningsFilePath)) {
        fs.writeFileSync(warningsFilePath, JSON.stringify({}), 'utf8');
    }
    const data = fs.readFileSync(warningsFilePath, 'utf8');
    return JSON.parse(data);
}

async function warningsCommand(sock, chatId, mentionedJidList, message) {
    const warnings = loadWarnings();
    if (!mentionedJidList || mentionedJidList.length === 0) {
        await sendStyled(sock, chatId, message, {
            title: 'WARNINGS',
            lines: ['Mention a user to check warnings.']
        });
        return;
    }
    const userToCheck = mentionedJidList[0];
    const warningCount = warnings[userToCheck] || 0;
    await sendStyled(sock, chatId, message, {
        title: 'WARNINGS',
        lines: [`@${userToCheck.split('@')[0]} has ${warningCount} warning(s).`]
    });
}

module.exports = warningsCommand;
