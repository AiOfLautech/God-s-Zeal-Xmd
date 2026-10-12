const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../../lib/isOwner');
const { sendStyled } = require('../../lib/menuLayout');

async function clearSessionCommand(sock, chatId, msg) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

        if (!msg.key.fromMe && !isOwner) {
            await sendStyled(sock, chatId, msg, {
                title: 'CLEAR SESSION',
                lines: ['This command can only be used by the owner.']
            });
            return;
        }

        const sessionDir = path.join(process.cwd(), 'session');
        if (!fs.existsSync(sessionDir)) {
            await sendStyled(sock, chatId, msg, {
                title: 'CLEAR SESSION',
                lines: ['Session directory not found.']
            });
            return;
        }

        await sendStyled(sock, chatId, msg, {
            title: 'CLEAR SESSION',
            lines: ['Optimizing session files for better performance.']
        });

        const files = fs.readdirSync(sessionDir);
        let filesCleared = 0;
        let errors = 0;
        let appStateSyncCount = 0;
        let preKeyCount = 0;

        for (const file of files) {
            if (file.startsWith('app-state-sync-')) appStateSyncCount++;
            if (file.startsWith('pre-key-')) preKeyCount++;
        }

        for (const file of files) {
            if (file === 'creds.json') continue;
            try {
                fs.unlinkSync(path.join(sessionDir, file));
                filesCleared++;
            } catch {
                errors++;
            }
        }

        await sendStyled(sock, chatId, msg, {
            title: 'SESSION CLEARED',
            lines: [
                `Files cleared ☇ ${filesCleared}`,
                `App state sync ☇ ${appStateSyncCount}`,
                `Pre-key files ☇ ${preKeyCount}`,
                errors ? `Errors ☇ ${errors}` : 'Status ☇ OK'
            ]
        });
    } catch (error) {
        console.error('Error in clearsession command:', error);
        await sendStyled(sock, chatId, msg, {
            title: 'CLEAR SESSION',
            lines: ['Failed to clear session files.']
        });
    }
}

module.exports = clearSessionCommand;
