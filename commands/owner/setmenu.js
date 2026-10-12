const { getConfig, updateConfig, getMenuStyle, getPrefix } = require('../../lib/botConfig');
const isOwnerOrSudo = require('../../lib/isOwner');
const { sendStyled } = require('../../lib/menuLayout');

async function setMenuCommand(sock, chatId, message, rawText = '') {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);
    if (!isOwner) {
        await sendStyled(sock, chatId, message, {
            title: 'MENU STYLE',
            lines: ['Only the bot owner can change the menu style.']
        });
        return;
    }

    const cfg = getConfig();
    const styles = Array.isArray(cfg.menuStyles) ? cfg.menuStyles : ['button', 'normal', 'newmenu'];
    const parts = String(rawText || '').trim().split(/\s+/);
    const nextStyle = String(parts[1] || '').trim().toLowerCase();
    const current = getMenuStyle();
    const prefix = getPrefix();

    if (!nextStyle) {
        await sendStyled(sock, chatId, message, {
            title: 'MENU STYLE',
            lines: [
                `Current: ${current}`,
                `Available: ${styles.join(', ')}`,
                `Use ${prefix}setmenu button`,
                `Use ${prefix}setmenu normal`
            ]
        });
        return;
    }

    const aliases = { buttons: 'button', text: 'normal', default: 'button', kayzen: 'newmenu' };
    const mapped = aliases[nextStyle] || nextStyle;
    if (!styles.includes(mapped)) {
        await sendStyled(sock, chatId, message, {
            title: 'UNKNOWN STYLE',
            lines: [`${nextStyle} is not valid`, `Choose: ${styles.join(', ')}`]
        });
        return;
    }

    updateConfig({ menuStyle: mapped });
    await sendStyled(sock, chatId, message, {
        title: 'MENU STYLE UPDATED',
        lines: [
            `Old: ${current}`,
            `New: ${mapped}`,
            'Saved in: bot.json',
            `Type ${prefix}menu to preview`
        ]
    });
}

module.exports = setMenuCommand;
