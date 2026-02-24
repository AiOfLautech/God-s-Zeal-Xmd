// 🧹 Fix for ENOSPC / temp overflow in hosted panels
const fs = require('fs');
const path = require('path');

// Redirect temp storage away from system /tmp
const customTemp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive: true });
process.env.TMPDIR = customTemp;
process.env.TEMP = customTemp;
process.env.TMP = customTemp;

// Auto-cleaner every 3 hours
setInterval(() => {
  fs.readdir(customTemp, (err, files) => {
    if (err) return;
    for (const file of files) {
      const filePath = path.join(customTemp, file);
      fs.stat(filePath, (err, stats) => {
        if (!err && Date.now() - stats.mtimeMs > 3 * 60 * 60 * 1000) {
          fs.unlink(filePath, () => {});
        }
      });
    }
  });
  console.log('🧹 Temp folder auto-cleaned');
}, 3 * 60 * 60 * 1000);

const settings = require('./settings');
require('./config.js');
const { isBanned } = require('./lib/isBanned');
const yts = require('yt-search');
const { fetchBuffer } = require('./lib/myfunc');
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { isSudo } = require('./lib/index');
const isOwnerOrSudo = require('./lib/isOwner');
const { autotypingCommand, isAutotypingEnabled, handleAutotypingForMessage, handleAutotypingForCommand, showTypingAfterCommand } = require('./commands/autotyping');
const { autoreadCommand, isAutoreadEnabled, handleAutoread } = require('./commands/autoread');

// Command imports
const tagAllCommand = require('./commands/tagall');
const helpCommand = require('./commands/help');
const banCommand = require('./commands/ban');
const { promoteCommand, handlePromotionEvent } = require('./commands/promote');
const { demoteCommand, handleDemotionEvent } = require('./commands/demote');
const muteCommand = require('./commands/mute');
const unmuteCommand = require('./commands/unmute');
const stickerCommand = require('./commands/sticker');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/warn');
const warningsCommand = require('./commands/warnings');
const ttsCommand = require('./commands/tts');
const { tictactoeCommand, handleTicTacToeMove } = require('./commands/tictactoe');
const { incrementMessageCount, topMembers } = require('./commands/topmembers');
const ownerCommand = require('./commands/owner');
const deleteCommand = require('./commands/delete');
const { handleAntilinkCommand, handleLinkDetection } = require('./commands/antilink');
const { handleAntitagCommand, handleTagDetection } = require('./commands/antitag');
const { Antilink } = require('./lib/antilink');
const { handleMentionDetection, mentionToggleCommand, setMentionCommand } = require('./commands/mention');
const memeCommand = require('./commands/meme');
const tagCommand = require('./commands/tag');
const tagNotAdminCommand = require('./commands/tagnotadmin');
const hideTagCommand = require('./commands/hidetag');
const jokeCommand = require('./commands/joke');
const quoteCommand = require('./commands/quote');
const factCommand = require('./commands/fact');
const weatherCommand = require('./commands/weather');
const newsCommand = require('./commands/news');
const kickCommand = require('./commands/kick');
const simageCommand = require('./commands/simage');
const attpCommand = require('./commands/attp');
const { startHangman, guessLetter } = require('./commands/hangman');
const { startTrivia, answerTrivia } = require('./commands/trivia');
const { complimentCommand } = require('./commands/compliment');
const { insultCommand } = require('./commands/insult');
const { eightBallCommand } = require('./commands/eightball');
const { lyricsCommand } = require('./commands/lyrics');
const { dareCommand } = require('./commands/dare');
const { truthCommand } = require('./commands/truth');
const { clearCommand } = require('./commands/clear');
const pingCommand = require('./commands/ping');
const aliveCommand = require('./commands/alive');
const blurCommand = require('./commands/img-blur');
const { welcomeCommand, handleJoinEvent } = require('./commands/welcome');
const { goodbyeCommand, handleLeaveEvent } = require('./commands/goodbye');
const githubCommand = require('./commands/github');
const { handleAntiBadwordCommand, handleBadwordDetection } = require('./lib/antibadword');
const antibadwordCommand = require('./commands/antibadword');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/chatbot');
const takeCommand = require('./commands/take');
const { flirtCommand } = require('./commands/flirt');
const characterCommand = require('./commands/character');
const wastedCommand = require('./commands/wasted');
const shipCommand = require('./commands/ship');
const groupInfoCommand = require('./commands/groupinfo');
const resetlinkCommand = require('./commands/resetlink');
const staffCommand = require('./commands/staff');
const unbanCommand = require('./commands/unban');
const emojimixCommand = require('./commands/emojimix');
const viewOnceCommand = require('./commands/viewonce');
const clearSessionCommand = require('./commands/clearsession');
const { autoStatusCommand, handleStatusUpdate } = require('./commands/autostatus');
const { simpCommand } = require('./commands/simp');
const { stupidCommand } = require('./commands/stupid');
const stickerTelegramCommand = require('./commands/stickertelegram');
const textmakerCommand = require('./commands/textmaker');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./commands/antidelete');
const clearTmpCommand = require('./commands/cleartmp');
const setProfilePicture = require('./commands/setpp');
const { setGroupDescription, setGroupName, setGroupPhoto } = require('./commands/groupmanage');
const instagramCommand = require('./commands/instagram');
const facebookCommand = require('./commands/facebook');
const spotifyCommand = require('./commands/spotify');
const playCommand = require('./commands/play');
const tiktokCommand = require('./commands/tiktok');
const songCommand = require('./commands/song');
const aiCommand = require('./commands/ai');
const urlCommand = require('./commands/url');
const { handleTranslateCommand } = require('./commands/translate');
const { handleSsCommand } = require('./commands/ss');
const { addCommandReaction, handleAreactCommand } = require('./lib/reactions');
const { goodnightCommand } = require('./commands/goodnight');
const { shayariCommand } = require('./commands/shayari');
const { rosedayCommand } = require('./commands/roseday');
const imagineCommand = require('./commands/imagine');
const videoCommand = require('./commands/video');
const sudoCommand = require('./commands/sudo');
const { miscCommand, handleHeart } = require('./commands/misc');
const { animeCommand } = require('./commands/anime');
const { piesCommand, piesAlias } = require('./commands/pies');
const stickercropCommand = require('./commands/stickercrop');
const updateCommand = require('./commands/update');
const removebgCommand = require('./commands/removebg');
const { reminiCommand } = require('./commands/remini');
const { igsCommand } = require('./commands/igs');
const { anticallCommand, readState: readAnticallState } = require('./commands/anticall');
const { pmblockerCommand, readState: readPmBlockerState } = require('./commands/pmblocker');
const settingsCommand = require('./commands/settings');
const soraCommand = require('./commands/sora');
const gcstatusCommand = require('./commands/gcstatus');
const creategcCommand = require('./commands/creategc');
const addCommand = require('./commands/add');
const { photofuniaCommand, listEffectsByCategory, listAllCategories, searchEffects } = require('./commands/photofunia');

// Global settings
global.packname = settings.packname;
global.author = settings.author;
global.channelLink = "https://whatsapp.com/channel/0029VaXKAEoKmCPS6Jz7sw0N";
global.ytch = "GodsZeal";

// Global configurations
const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363269950668068@newsletter',
            newsletterName: 'GODSZEAL XMD',
            serverMessageId: -1
        }
    }
};

async function handleMessages(sock, messageUpdate, printLog) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        // Handle autoread functionality
        await handleAutoread(sock, message);

        // Store message for antidelete feature
        if (message.message) {
            storeMessage(sock, message);
        }

        // Handle message revocation
        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const senderIsSudo = await isSudo(senderId);
        const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);

        // Handle button responses
        if (message.message?.buttonsResponseMessage) {
            const buttonId = message.message.buttonsResponseMessage.selectedButtonId;
            if (buttonId === 'channel') {
                await sock.sendMessage(chatId, { text: '📢 *Join our Channel:*\nhttps://whatsapp.com/channel/0029VaXKAEoKmCPS6Jz7sw0N' }, { quoted: message });
                return;
            } else if (buttonId === 'owner') {
                const ownerCommand = require('./commands/owner');
                await ownerCommand(sock, chatId);
                return;
            } else if (buttonId === 'support') {
                await sock.sendMessage(chatId, { text: `🔗 *Support*\n\nhttps://chat.whatsapp.com/L7lhDJmNj2s1w6lLjxaB6e` }, { quoted: message });
                return;
            }
        }

        const userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            message.message?.buttonsResponseMessage?.selectedButtonId?.trim() ||
            ''
        ).toLowerCase().replace(/\.\s+/g, '.').trim();

        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        const isCaptionCommand = rawText.trim().toLowerCase().startsWith('.gcstatus') || 
                                 rawText.trim().toLowerCase().startsWith('.groupstatus') ||
                                 rawText.trim().toLowerCase().startsWith('.gstatus') ||
                                 rawText.trim().toLowerCase().startsWith('.gstat') ||
                                 rawText.trim().toLowerCase().startsWith('.upswgc');

        if (userMessage.startsWith('.') || isCaptionCommand) {
            console.log(`📝 Command used in ${isGroup ? 'group' : 'private'}: ${userMessage || 'caption command'}`);
        }

        let isPublic = true;
        try {
            const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof data.isPublic === 'boolean') isPublic = data.isPublic;
        } catch (error) {}

        const isOwnerOrSudoCheck = message.key.fromMe || senderIsOwnerOrSudo;

        if (isBanned(senderId) && !userMessage.startsWith('.unban')) {
            if (Math.random() < 0.1) {
                await sock.sendMessage(chatId, { text: '❌ You are banned from using the bot. Contact an admin to get unbanned.', ...channelInfo });
            }
            return;
        }

        if (/^[1-9]$/.test(userMessage) || userMessage.toLowerCase() === 'surrender') {
            await handleTicTacToeMove(sock, chatId, senderId, userMessage);
            return;
        }

        if (!message.key.fromMe) incrementMessageCount(chatId, senderId);

        if (isGroup) {
            if (userMessage) await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
            await Antilink(message, sock);
        }

        if (!isGroup && !message.key.fromMe && !senderIsSudo) {
            try {
                const pmState = readPmBlockerState();
                if (pmState.enabled) {
                    await sock.sendMessage(chatId, { text: pmState.message || 'Private messages are blocked. Please contact the owner in groups only.' });
                    await new Promise(r => setTimeout(r, 1500));
                    try { await sock.updateBlockStatus(chatId, 'block'); } catch (e) { }
                    return;
                }
            } catch (e) { }
        }

        if (!userMessage.startsWith('.') && !isCaptionCommand) {
            await handleAutotypingForMessage(sock, chatId, userMessage);
            if (isGroup) {
                await handleTagDetection(sock, chatId, message, senderId);
                await handleMentionDetection(sock, chatId, message);
                if (isPublic || isOwnerOrSudoCheck) {
                    await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                }
            }
            return;
        }

        if (!isPublic && !isOwnerOrSudoCheck) return;

        const adminCommands = ['.mute', '.unmute', '.ban', '.unban', '.promote', '.demote', '.kick', '.tagall', '.tagnotadmin', '.hidetag', '.antilink', '.antitag', '.setgdesc', '.setgname', '.setgpp'];
        const isAdminCommand = adminCommands.some(cmd => userMessage.startsWith(cmd));
        const ownerCommands = ['.mode', '.autostatus', '.antidelete', '.cleartmp', '.setpp', '.clearsession', '.areact', '.autoreact', '.autotyping', '.autoread', '.pmblocker'];
        const isOwnerCommand = ownerCommands.some(cmd => userMessage.startsWith(cmd));

        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            if (!adminStatus.isBotAdmin) {
                await sock.sendMessage(chatId, { text: 'Please make the bot an admin to use admin commands.', ...channelInfo }, { quoted: message });
                return;
            }
            if (userMessage.startsWith('.mute') || userMessage === '.unmute' || userMessage.startsWith('.ban') || userMessage.startsWith('.unban') || userMessage.startsWith('.promote') || userMessage.startsWith('.demote')) {
                if (!adminStatus.isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                    return;
                }
            }
        }

        if (isOwnerCommand && !message.key.fromMe && !senderIsOwnerOrSudo) {
            await sock.sendMessage(chatId, { text: '❌ This command is only available for the owner or sudo!' }, { quoted: message });
            return;
        }

        let commandExecuted = false;

        if (isCaptionCommand) {
            const args = rawText.trim().split(/\s+/).slice(1);
            await gcstatusCommand(sock, chatId, message, args);
            commandExecuted = true;
        }

        if (!commandExecuted) {
            switch (true) {
                case userMessage === ".gcstatus" || userMessage === ".groupstatus" || userMessage === ".gstatus" || userMessage === ".gstat" || userMessage === ".upswgc" || userMessage.startsWith(".gcstatus ") || userMessage.startsWith(".groupstatus ") || userMessage.startsWith(".gstatus ") || userMessage.startsWith(".gstat ") || userMessage.startsWith(".upswgc "):
                    const args = rawText.split(/\s+/).slice(1);
                    await gcstatusCommand(sock, chatId, message, args);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.creategc'):
                    const argsCreate = rawText.split(/\s+/).slice(1);
                    await creategcCommand(sock, chatId, message, argsCreate);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.add'):
                    const argsAdd = rawText.split(/\s+/).slice(1);
                    await addCommand(sock, chatId, message, argsAdd);
                    commandExecuted = true;
                    break;
                case userMessage === '.simage': {
                    const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    if (quotedMessage?.stickerMessage) await simageCommand(sock, quotedMessage, chatId);
                    else await sock.sendMessage(chatId, { text: 'Please reply to a sticker with the .simage command to convert it.', ...channelInfo }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                case userMessage.startsWith('.kick'):
                    await kickCommand(sock, chatId, senderId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.mute'):
                    const muteArg = userMessage.trim().split(/\s+/)[1];
                    const muteDuration = muteArg !== undefined ? parseInt(muteArg, 10) : undefined;
                    if (muteArg !== undefined && (isNaN(muteDuration) || muteDuration <= 0)) await sock.sendMessage(chatId, { text: 'Please provide a valid number of minutes.', ...channelInfo }, { quoted: message });
                    else await muteCommand(sock, chatId, senderId, message, muteDuration);
                    commandExecuted = true;
                    break;
                case userMessage === '.unmute':
                    await unmuteCommand(sock, chatId, senderId);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.ban'):
                    if (!isGroup && !message.key.fromMe && !senderIsSudo) await sock.sendMessage(chatId, { text: 'Only owner/sudo can use .ban in private chat.' }, { quoted: message });
                    else await banCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.unban'):
                    if (!isGroup && !message.key.fromMe && !senderIsSudo) await sock.sendMessage(chatId, { text: 'Only owner/sudo can use .unban in private chat.' }, { quoted: message });
                    else await unbanCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.help' || userMessage === '.menu' || userMessage === '.bot' || userMessage === '.list':
                    await helpCommand(sock, chatId, message, global.channelLink);
                    commandExecuted = true;
                    break;
                case userMessage === '.sticker' || userMessage === '.s':
                    await stickerCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.warn'):
                    await warnCommand(sock, chatId, senderId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.warnings'):
                    await warningsCommand(sock, chatId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || []);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.tts'):
                    await ttsCommand(sock, chatId, userMessage.slice(4).trim(), message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.delete') || userMessage.startsWith('.del'):
                    await deleteCommand(sock, chatId, message, senderId);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.attp'):
                    await attpCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.settings':
                    await settingsCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.mode'):
                    if (!message.key.fromMe && !senderIsSudo) return;
                    let dataMode = JSON.parse(fs.readFileSync('./data/messageCount.json'));
                    const modeAction = userMessage.split(' ')[1]?.toLowerCase();
                    if (!modeAction) {
                        await sock.sendMessage(chatId, { text: `Current mode: *${dataMode.isPublic ? 'public' : 'private'}*`, ...channelInfo }, { quoted: message });
                    } else if (modeAction === 'public' || modeAction === 'private') {
                        dataMode.isPublic = modeAction === 'public';
                        fs.writeFileSync('./data/messageCount.json', JSON.stringify(dataMode, null, 2));
                        await sock.sendMessage(chatId, { text: `✅ Mode: *${modeAction}*`, ...channelInfo }, { quoted: message });
                    }
                    commandExecuted = true;
                    break;
                case userMessage === '.autoread':
                    await autoreadCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.autotyping':
                    await autotypingCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.autostatus':
                    await autoStatusCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.antidelete':
                    await handleAntideleteCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.cleartmp':
                    await clearTmpCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.setpp':
                    await setProfilePicture(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.clearsession':
                    await clearSessionCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.areact' || userMessage === '.autoreact':
                    await handleAreactCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.pmblocker':
                    await pmblockerCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.anticall':
                    await anticallCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.antilink'):
                    await handleAntilinkCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.antitag'):
                    await handleAntitagCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.antibadword'):
                    await handleAntiBadwordCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.mention'):
                    if (userMessage.includes('set')) await setMentionCommand(sock, chatId, message);
                    else await mentionToggleCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.tagall'):
                    await tagAllCommand(sock, chatId, senderId, rawText.split(/\s+/).slice(1).join(' '), message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.tagnotadmin'):
                    await tagNotAdminCommand(sock, chatId, senderId, rawText.split(/\s+/).slice(1).join(' '), message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.tag'):
                    await tagCommand(sock, chatId, rawText.split(/\s+/).slice(1).join(' '), message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.hidetag'):
                    await hideTagCommand(sock, chatId, senderId, rawText.split(/\s+/).slice(1).join(' '), message);
                    commandExecuted = true;
                    break;
                case userMessage === '.owner' || userMessage === '.dev':
                    await ownerCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.alive':
                    await aliveCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.ping':
                    await pingCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.github':
                    await githubCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.news':
                    await newsCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.weather':
                    await weatherCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.joke':
                    await jokeCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.fact':
                    await factCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.quote':
                    await quoteCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.meme':
                    await memeCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.lyrics':
                    await lyricsCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.dare':
                    await dareCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.truth':
                    await truthCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.compliment':
                    await complimentCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.insult':
                    await insultCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.eightball':
                    await eightBallCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.hangman':
                    await startHangman(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.trivia':
                    await startTrivia(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.flirt':
                    await flirtCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.character':
                    await characterCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.wasted':
                    await wastedCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.ship':
                    await shipCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.groupinfo':
                    await groupInfoCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.resetlink':
                    await resetlinkCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.staff':
                    await staffCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.unban':
                    await unbanCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.emojimix':
                    await emojimixCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.viewonce':
                    await viewOnceCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.simp':
                    await simpCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.stupid':
                    await stupidCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.stickertelegram':
                    await stickerTelegramCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.textmaker'):
                    await textmakerCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.instagram':
                    await instagramCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.facebook':
                    await facebookCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.spotify':
                    await spotifyCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.play':
                    await playCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.tiktok':
                    await tiktokCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.song':
                    await songCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.ai'):
                    await aiCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.url':
                    await urlCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.translate'):
                    await handleTranslateCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.ss'):
                    await handleSsCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.goodnight':
                    await goodnightCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.shayari':
                    await shayariCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.roseday':
                    await rosedayCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.imagine'):
                    await imagineCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.video':
                    await videoCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.sudo':
                    await sudoCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.misc':
                    await miscCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.anime':
                    await animeCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.pies':
                    await piesCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.stickercrop':
                    await stickercropCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.removebg'):
                    await removebgCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.remini':
                    await reminiCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.igs':
                    await igsCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.sora':
                    await soraCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage === '.china':
                    await piesAlias(sock, chatId, message, 'china');
                    commandExecuted = true;
                    break;
                case userMessage === '.indonesia':
                    await piesAlias(sock, chatId, message, 'indonesia');
                    commandExecuted = true;
                    break;
                case userMessage === '.japan':
                    await piesAlias(sock, chatId, message, 'japan');
                    commandExecuted = true;
                    break;
                case userMessage === '.korea':
                    await piesAlias(sock, chatId, message, 'korea');
                    commandExecuted = true;
                    break;
                case userMessage === '.hijab':
                    await piesAlias(sock, chatId, message, 'hijab');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.update'):
                    const updateZipArg = rawText.trim().split(/\s+/)[1];
                    await updateCommand(sock, chatId, message, updateZipArg && updateZipArg.startsWith('http') ? updateZipArg : '');
                    commandExecuted = true;
                    break;
                case userMessage === '.clear':
                    await clearCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.promote'):
                    await promoteCommand(sock, chatId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.demote'):
                    await demoteCommand(sock, chatId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.setgdesc'):
                    await setGroupDescription(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.setgname'):
                    await setGroupName(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.setgpp'):
                    await setGroupPhoto(sock, chatId, message);
                    commandExecuted = true;
                    break;
                // PhotoFunia Commands
                case userMessage === '.pflist' || userMessage === '.photofunia':
                    await listAllCategories(sock, chatId);
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.pflist '):
                    const pfCategory = rawText.split(/\s+/).slice(1).join(' ');
                    await listEffectsByCategory(sock, chatId, pfCategory);
                    commandExecuted = true;
                    break;
                case userMessage === '.pfsearch' || userMessage.startsWith('.pfsearch '):
                    const searchKeyword = rawText.split(/\s+/).slice(1).join(' ');
                    if (searchKeyword) {
                        await searchEffects(sock, chatId, searchKeyword);
                    } else {
                        await sock.sendMessage(chatId, { text: '❌ Please provide a keyword to search.\n\nExample: .pfsearch neon' });
                    }
                    commandExecuted = true;
                    break;
                // Dynamic PhotoFunia effects
                case userMessage.startsWith('.love '):
                    const loveText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, loveText, 'love');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.cup '):
                    const cupText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, cupText, 'cup');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.carbon '):
                    const carbonText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, carbonText, 'carbon');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.write '):
                    const writeText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, writeText, 'write');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.luxury '):
                    const luxuryText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, luxuryText, 'luxury');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.blood '):
                    const bloodText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, bloodText, 'blood');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.neon '):
                    const neonText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, neonText, 'neon');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.smoke '):
                    const smokeText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, smokeText, 'smoke');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.ice '):
                    const iceText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, iceText, 'ice');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.fire '):
                    const fireText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, fireText, 'fire');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.thunder '):
                    const thunderText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, thunderText, 'thunder');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.matrix '):
                    const matrixText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, matrixText, 'matrix');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.hacker '):
                    const hackerText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, hackerText, 'hacker');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.glitch '):
                    const glitchText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, glitchText, 'glitch');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.sand '):
                    const sandText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, sandText, 'sand');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.leaves '):
                    const leavesText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, leavesText, 'leaves');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.blackpink '):
                    const blackpinkText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, blackpinkText, 'blackpink');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.purple '):
                    const purpleText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, purpleText, 'purple');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.devil '):
                    const devilText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, devilText, 'devil');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.watercolour '):
                    const watercolourText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, watercolourText, 'watercolour');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.christmas '):
                    const christmasText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, christmasText, 'christmas');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.metallic '):
                    const metallicText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, metallicText, 'metallic');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.snow '):
                    const snowText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, snowText, 'snow');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.impressive '):
                    const impressiveText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, impressiveText, 'impressive');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.light '):
                    const lightText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, lightText, 'light');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.arena '):
                    const arenaText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, arenaText, 'arena');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.1917 '):
                    const text1917 = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, text1917, '1917');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.countryhome '):
                    const countryhomeText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, countryhomeText, 'countryhome');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.melbourne '):
                    const melbourneText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, melbourneText, 'melbourne');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.brussels '):
                    const brusselsText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, brusselsText, 'brussels');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.rijksmuseum '):
                    const rijksmuseumText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, rijksmuseumText, 'rijksmuseum');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.gallery '):
                    const galleryText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, galleryText, 'gallery');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.theframe '):
                    const theframeText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, theframeText, 'theframe');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.oldtvset '):
                    const oldtvsetText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, oldtvsetText, 'oldtvset');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.billboard '):
                    const billboardText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, billboardText, 'billboard');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.timessquare '):
                    const timessquareText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, timessquareText, 'timessquare');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.broadway '):
                    const broadwayText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, broadwayText, 'broadway');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.newyork '):
                    const newyorkText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, newyorkText, 'newyork');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.concrete '):
                    const concreteText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, concreteText, 'concrete');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.vintage '):
                    const vintageText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, vintageText, 'vintage');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.valentine '):
                    const valentineText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, valentineText, 'valentine');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.easter '):
                    const easterText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, easterText, 'easter');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.halloween '):
                    const halloweenText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, halloweenText, 'halloween');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.beach '):
                    const beachText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, beachText, 'beach');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.harley '):
                    const harleyText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, harleyText, 'harley');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.surfing '):
                    const surfingText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, surfingText, 'surfing');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.flowers '):
                    const flowersText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, flowersText, 'flowers');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.balloon '):
                    const balloonText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, balloonText, 'balloon');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.newspaper '):
                    const newspaperText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, newspaperText, 'newspaper');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.morningpaper '):
                    const morningpaperText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, morningpaperText, 'morningpaper');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.calendar '):
                    const calendarText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, calendarText, 'calendar');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.painter '):
                    const painterText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, painterText, 'painter');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.heart '):
                    const heartText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, heartText, 'heart');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.glitter '):
                    const glitterText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, glitterText, 'glitter');
                    commandExecuted = true;
                    break;
                case userMessage.startsWith('.spark '):
                    const sparkText = rawText.split(/\s+/).slice(1).join(' ');
                    await photofuniaCommand(sock, chatId, message, sparkText, 'spark');
                    commandExecuted = true;
                    break;
            }
        }

        if (commandExecuted) {
            await handleAutotypingForCommand(sock, chatId, userMessage);
            await showTypingAfterCommand(sock, chatId);
        }

    } catch (error) {
        console.error('Error in handleMessages:', error);
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;
        if (!id.endsWith('@g.us')) return;
        let isPublicEvent = true;
        try {
            const modeData = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof modeData.isPublic === 'boolean') isPublicEvent = modeData.isPublic;
        } catch (e) {}
        if (action === 'promote') {
            if (!isPublicEvent) return;
            await handlePromotionEvent(sock, id, participants, author);
        } else if (action === 'demote') {
            if (!isPublicEvent) return;
            await handleDemotionEvent(sock, id, participants, author);
        } else if (action === 'add') {
            await handleJoinEvent(sock, id, participants);
        } else if (action === 'remove') {
            await handleLeaveEvent(sock, id, participants);
        }
    } catch (error) {
        console.error('Error in handleGroupParticipantUpdate:', error);
    }
}

module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus: async (sock, status) => {
        try {
            const settings = require('./settings');
            if (settings.autoStatusReact) {
                const emoji = settings.statusReactEmoji || '📢';
                await sock.sendMessage(status.key.remoteJid, { react: { text: emoji, key: status.key } }, { statusJidList: [status.key.participant, sock.user.id] });
            }
        } catch (error) {
            console.error('Error in handleStatusUpdate:', error);
        }
    }
};
