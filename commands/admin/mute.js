const isAdmin = require('../../lib/isAdmin');
const { sendStyled } = require('../../lib/menuLayout');

async function muteCommand(sock, chatId, senderId, message, durationInMinutes) {
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isBotAdmin) {
        await sendStyled(sock, chatId, message, {
            title: 'MUTE',
            lines: ['Please make the bot an admin first.']
        });
        return;
    }
    if (!isSenderAdmin) {
        await sendStyled(sock, chatId, message, {
            title: 'MUTE',
            lines: ['Only group admins can use the mute command.']
        });
        return;
    }

    try {
        await sock.groupSettingUpdate(chatId, 'announcement');
        if (durationInMinutes !== undefined && durationInMinutes > 0) {
            await sendStyled(sock, chatId, message, {
                title: 'MUTE',
                lines: [`The group has been muted for ${durationInMinutes} minutes.`]
            });
            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    await sendStyled(sock, chatId, message, {
                        title: 'MUTE',
                        lines: ['The group has been unmuted.']
                    });
                } catch (unmuteError) {
                    console.error('Error unmuting group:', unmuteError);
                }
            }, durationInMinutes * 60 * 1000);
        } else {
            await sendStyled(sock, chatId, message, {
                title: 'MUTE',
                lines: ['The group has been muted.']
            });
        }
    } catch (error) {
        console.error('Error muting/unmuting the group:', error);
        await sendStyled(sock, chatId, message, {
            title: 'MUTE',
            lines: ['An error occurred while muting the group. Please try again.']
        });
    }
}

module.exports = muteCommand;
