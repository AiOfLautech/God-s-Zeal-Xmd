require('./settings')
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

// Panel uploads contain package.json but not node_modules. Install production
// dependencies before loading the bot so fresh deployments do not crash with
// MODULE_NOT_FOUND (for example, @hapi/boom).
const dependencyMarkers = [
  path.join(__dirname, 'node_modules', '@hapi', 'boom', 'package.json'),
  path.join(__dirname, 'node_modules', '@whiskeysockets', 'baileys', 'package.json'),
  path.join(__dirname, 'node_modules', 'dotenv', 'package.json'),
]
if (dependencyMarkers.some((marker) => !fs.existsSync(marker))) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  console.log('[bootstrap] Installing all bot dependencies inside the panel container before startup…')
  try {
    execFileSync(npmCommand, ['--version'], { cwd: __dirname, stdio: 'pipe' })
    execFileSync(npmCommand, [
      'install', '--legacy-peer-deps', '--omit=dev', '--no-progress', '--no-audit', '--no-fund', '--loglevel=warn',
    ], { cwd: __dirname, stdio: 'inherit' })
  } catch (error) {
    console.error('[bootstrap] npm is required in the panel Node.js container and dependency installation failed.')
    throw error
  }
  console.log('[bootstrap] Panel dependency installation completed.')
}

const { Boom } = require('@hapi/boom')
const chalk = require('chalk')
const FileType = require('file-type')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const { 
    default: makeWASocket,
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay,
    getContentType
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// ==================== AUTO-FOLLOW & AUTO-REACT CONFIGURATION ====================

// Newsletter channels to auto-follow
const NEWSLETTER_CHANNELS = [
    "120363269950668068@newsletter"    
];

// Group invite codes to auto-join
const GROUP_INVITE_LINKS = [
    "https://chat.whatsapp.com/FlDBD5PQzxBAjSv5yiwFYn?mode=gi_t",
    "https://chat.whatsapp.com/Jg2Ou2VQ7Ak9TvyXU3i6CF?mode=gi_t"
];

// Emoji to react with on newsletter messages
const NEWSLETTER_REACTIONS = ["❤️", "🔥", "👍", "😎", "🙏", "🥲", "😭", "😂"];

// Track which newsletters we've followed per session
const followedNewsletters = new Set();

// Track if auto-actions have been completed
let autoActionsCompleted = false;

// Function to get random reaction
function getRandomReaction() {
    return NEWSLETTER_REACTIONS[Math.floor(Math.random() * NEWSLETTER_REACTIONS.length)];
}

// ==================== END CONFIGURATION ====================

// Create a store object with required methods
const store = {
    messages: {},
    contacts: {},
    chats: {},
    groupMetadata: async (jid) => {
        return {}
    },
    bind: function(ev) {
        // Handle events
        ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(msg => {
                if (msg.key && msg.key.remoteJid) {
                    this.messages[msg.key.remoteJid] = this.messages[msg.key.remoteJid] || {}
                    this.messages[msg.key.remoteJid][msg.key.id] = msg
                }
            })
        })
        
        ev.on('contacts.update', (contacts) => {
            contacts.forEach(contact => {
                if (contact.id) {
                    this.contacts[contact.id] = contact
                }
            })
        })
        
        ev.on('chats.set', (chats) => {
            this.chats = chats
        })
    },
    loadMessage: async (jid, id) => {
        return this.messages[jid]?.[id] || null
    }
}

let phoneNumber = "2348089336992"
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "𝐆𝐎𝐃𝐒𝐙𝐄𝐀𝐋 𝐗𝐌𝐃"
global.themeemoji = "•"

const DEFAULT_BOT_LOGO = path.join(__dirname, 'assets', 'bot_image.jpg')

/** Apply the bundled logo after WhatsApp authentication completes. */
async function applyDefaultBotLogo(sock) {
    if (!sock?.user?.id) return
    if (!existsSync(DEFAULT_BOT_LOGO)) {
        console.warn(`[profile] Default bot logo not found: ${DEFAULT_BOT_LOGO}`)
        return
    }

    const jid = jidNormalizedUser(sock.user.id)
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            // WhatsApp can reject profile updates immediately after the socket
            // opens; a short delay plus retries makes deployment reliable.
            await delay(attempt === 1 ? 2500 : 5000)
            await sock.updateProfilePicture(jid, { url: DEFAULT_BOT_LOGO })
            console.log(`[profile] Default bot logo applied (attempt ${attempt})`)
            return
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            console.warn(`[profile] Logo update attempt ${attempt}/3 failed: ${message}`)
        }
    }

    console.warn('[profile] Could not apply the default bot logo after 3 attempts')
}

const settings = require('./settings')
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

// Only create readline interface if we're in an interactive environment
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        // In non-interactive environment, use ownerNumber from settings
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}

         
async function startGodszealBotInc() {
    let { version, isLatest } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache()

    const GodszealBotInc = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
    })

    store.bind(GodszealBotInc.ev)

    // ==================== NEWSLETTER MESSAGE HANDLER ====================
    GodszealBotInc.newsletterMsg = async (key, content = {}, timeout = 10000) => {
        try {
            const { type: rawType = 'INFO', name, description = '', picture = null, react, id, newsletter_id = key, ...media } = content;
            const type = rawType.toUpperCase();
            
            if (react) {
                if (!(newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id))) {
                    throw new Error('Invalid newsletter ID');
                }
                if (!id) throw new Error('Message ID required for reaction');
                
                const hasil = await GodszealBotInc.query({
                    tag: 'message',
                    attrs: {
                        to: newsletter_id,
                        type: 'reaction',
                        'server_id': id,
                        id: generateMessageTag()
                    },
                    content: [{
                        tag: 'reaction',
                        attrs: {
                            code: react
                        }
                    }]
                });
                return hasil;
            } else if (media && typeof media === 'object' && Object.keys(media).length > 0) {
                const msg = await generateWAMessageContent(media, { upload: GodszealBotInc.waUploadToServer });
                const anu = await GodszealBotInc.query({
                    tag: 'message',
                    attrs: { to: newsletter_id, type: 'text' in media ? 'text' : 'media' },
                    content: [{
                        tag: 'plaintext',
                        attrs: /image|video|audio|sticker|poll/.test(Object.keys(media).join('|')) ? { mediatype: Object.keys(media).find(key => ['image', 'video', 'audio', 'sticker','poll'].includes(key)) || null } : {},
                        content: proto.Message.encode(msg).finish()
                    }]
                });
                return anu;
            } else {
                if ((/(FOLLOW|UNFOLLOW|DELETE)/.test(type)) && !(newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id))) {
                    throw new Error('Invalid newsletter ID for follow/unfollow');
                }
                
                const _query = await GodszealBotInc.query({
                    tag: 'iq',
                    attrs: {
                        to: 's.whatsapp.net',
                        type: 'get',
                        xmlns: 'w:mex'
                    },
                    content: [{
                        tag: 'query',
                        attrs: {
                            query_id: type == 'FOLLOW' ? '9926858900719341' : type == 'UNFOLLOW' ? '7238632346214362' : type == 'CREATE' ? '6234210096708695' : type == 'DELETE' ? '8316537688363079' : '6563316087068696'
                        },
                        content: new TextEncoder().encode(JSON.stringify({
                            variables: /(FOLLOW|UNFOLLOW|DELETE)/.test(type) ? { newsletter_id } : type == 'CREATE' ? { newsletter_input: { name, description, picture }} : { fetch_creation_time: true, fetch_full_image: true, fetch_viewer_metadata: false, input: { key, type: (newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id)) ? 'JID' : 'INVITE' }}
                        }))
                    }]
                }, timeout);
                
                const res = JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter || 
                            JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_join_v2 || 
                            JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_leave_v2 || 
                            JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_create || 
                            JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_delete_v2 || 
                            JSON.parse(_query.content[0].content)?.errors || 
                            JSON.parse(_query.content[0].content);
                
                if (res.thread_metadata) {
                    res.thread_metadata.host = 'https://mmg.whatsapp.net';
                }
                return res;
            }
        } catch (error) {
            console.log(chalk.red(`❌ Newsletter msg error: ${error.message}`));
            throw error;
        }
    };
    // ==================== END NEWSLETTER MESSAGE HANDLER ====================

    // Message handling with newsletter auto-react
    GodszealBotInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            
            // Handle status broadcast
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(GodszealBotInc, chatUpdate);
                return;
            }

            // ==================== AUTO-REACT TO NEWSLETTER MESSAGES ====================
            if (mek.key && mek.key.remoteJid && mek.key.remoteJid.endsWith('@newsletter')) {
                const newsletterJid = mek.key.remoteJid;
                const messageId = mek.key.id;
                const serverId = mek.key.server_id || messageId;
                
                if (NEWSLETTER_CHANNELS.includes(newsletterJid)) {
                    // Auto-follow if not already followed
                    if (!followedNewsletters.has(newsletterJid)) {
                        try {
                            await sleep(2000);
                            const followResult = await GodszealBotInc.newsletterMsg(newsletterJid, { type: 'FOLLOW' });
                            
                            if (!followResult.errors) {
                                followedNewsletters.add(newsletterJid);
                                console.log(chalk.green(`✓ Followed newsletter: ${newsletterJid}`));
                            } else {
                                console.log(chalk.yellow(`⚠️ Follow error: ${JSON.stringify(followResult.errors)}`));
                            }
                        } catch (followErr) {
                            console.log(chalk.yellow(`⚠️ Follow exception: ${followErr.message}`));
                        }
                    }
                    
                    // Auto-react with random delay
                    const reactionDelay = Math.floor(Math.random() * 3000) + 2000;
                    setTimeout(async () => {
                        try {
                            const randomReaction = getRandomReaction();
                            await GodszealBotInc.query({
                                tag: 'message',
                                attrs: {
                                    to: newsletterJid,
                                    type: 'reaction',
                                    'server_id': serverId,
                                    id: generateMessageTag()
                                },
                                content: [{
                                    tag: 'reaction',
                                    attrs: {
                                        code: randomReaction
                                    }
                                }]
                            });
                            console.log(chalk.green(`✅ Reacted with ${randomReaction} to ${newsletterJid}`));
                        } catch (err) {
                            // Silently fail
                        }
                    }, reactionDelay);
                    
                    return;
                }
            }
            // ==================== END AUTO-REACT ====================

            if (!GodszealBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
            
            try {
                await handleMessages(GodszealBotInc, chatUpdate, true)
            } catch (err) {
                console.error("Error in handleMessages:", err)
                // Only try to send error message if we have a valid chatId
                if (mek.key && mek.key.remoteJid) {
                    await GodszealBotInc.sendMessage(mek.key.remoteJid, { 
                        text: '❌ An error occurred while processing your message.',
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363269950668068@newsletter',
                                newsletterName: '❦ ════ •⊰❂ AI TOOLS HUB  ❂⊱• ════ ❦',
                                serverMessageId: -1
                            }
                        }
                    }).catch(console.error);
                }
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err)
        }
    })

    // Add these event handlers for better functionality
    GodszealBotInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    GodszealBotInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = GodszealBotInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    GodszealBotInc.getName = (jid, withoutContact = false) => {
        id = GodszealBotInc.decodeJid(jid)
        withoutContact = GodszealBotInc.withoutContact || withoutContact 
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = GodszealBotInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === GodszealBotInc.decodeJid(GodszealBotInc.user.id) ?
            GodszealBotInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    GodszealBotInc.public = true

    GodszealBotInc.serializeM = (m) => smsg(GodszealBotInc, m, store)

    // Handle pairing code
    if (pairingCode && !GodszealBotInc.authState.creds.registered) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        let phoneNumber
        if (!!global.phoneNumber) {
            phoneNumber = global.phoneNumber
        } else {
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number 😍\nFormat: 6281376552730 (without + or spaces) : `)))
        }

        // Clean the phone number - remove any non-digit characters
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

        // Validate the phone number using awesome-phonenumber
        const pn = require('awesome-phonenumber');
        if (!pn('+' + phoneNumber).isValid()) {
            console.log(chalk.red('Invalid phone number. Please enter your full international number (e.g., 15551234567 for US, 447911123456 for UK, etc.) without + or spaces.'));
            process.exit(1);
        }

        setTimeout(async () => {
            try {
                let code = await GodszealBotInc.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
                console.log(chalk.yellow(`\nPlease enter this code in your WhatsApp app:\n1. Open WhatsApp\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter the code shown above`))
            } catch (error) {
                console.error('Error requesting pairing code:', error)
                console.log(chalk.red('Failed to get pairing code. Please check your phone number and try again.'))
            }
        }, 3000)
    }

    // Connection handling
    GodszealBotInc.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect } = s
        if (connection == "open") {
            console.log(chalk.magenta(` `))
            console.log(chalk.yellow(`🌿Connected to => ` + JSON.stringify(GodszealBotInc.user, null, 2)))

            // Do not block the connection flow on the profile update. The
            // helper retries in the background and logs the exact failure.
            void applyDefaultBotLogo(GodszealBotInc)
            
            const botNumber = GodszealBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
            await GodszealBotInc.sendMessage(botNumber, { 
                text: `🤖 Bot Connected Successfully!\n\n⏰ Time: ${new Date().toLocaleString()}\n✅ Status: Online and Ready!
                \n✅Make sure to join below channel`,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363269950668068@newsletter',
                        newsletterName: '❦ ════ •⊰❂ AI TOOLS HUB  ❂⊱• ════ ❦',
                        serverMessageId: -1
                    }
                }
            });

            await delay(1999)
            console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname || '𝐆𝐎𝐃𝐒𝐙𝐄𝐀𝐋 𝐗𝐌𝐃'} ]`)}\n\n`))
            console.log(chalk.cyan(`< ================================================== >`))
            console.log(chalk.magenta(`\n${global.themeemoji || '•'} YT CHANNEL: AiOFLautech`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} GITHUB: AiOfLautech`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} WA NUMBER: ${owner}`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} CREDIT: Godszeal Tech`))
            console.log(chalk.green(`${global.themeemoji || '•'} 🤖 Bot Connected Successfully! ✅`))

            // ==================== AUTO-ACTIONS ON CONNECTION ====================
            // Wait before starting auto-actions
            await sleep(15000);
            
            if (!autoActionsCompleted) {
                try {
                    console.log(chalk.blue('🚀 Starting auto-actions...'));
                    
                    await sleep(5000);
                    
                    // Follow newsletters
                    console.log(chalk.cyan('📰 Following newsletters...'));
                    for (const channel of NEWSLETTER_CHANNELS) {
                        try {
                            if (!followedNewsletters.has(channel)) {
                                await sleep(3000); // Delay before each follow
                                
                                const result = await GodszealBotInc.newsletterMsg(channel, { type: 'FOLLOW' });
                                
                                if (result && !result.errors) {
                                    followedNewsletters.add(channel);
                                    console.log(chalk.green(`✓ Followed: ${channel}`));
                                } else if (result && result.errors) {
                                    console.log(chalk.yellow(`⚠️ Follow failed: ${JSON.stringify(result.errors)}`));
                                } else {
                                    console.log(chalk.yellow(`⚠️ Unexpected response: ${JSON.stringify(result)}`));
                                }
                            } else {
                                console.log(chalk.blue(`ℹ️ Already following: ${channel}`));
                            }
                        } catch (e) {
                            console.log(chalk.yellow(`✗ Newsletter follow error for ${channel}: ${e.message}`));
                        }
                    }
                    
                    await sleep(5000);
                    
                    // Join groups
                    console.log(chalk.cyan('👥 Joining groups...'));
                    for (const inviteLink of GROUP_INVITE_LINKS) {
                        try {
                            await sleep(4000); // Delay before each attempt
                            
                            const inviteCode = inviteLink.split('/').pop().trim();
                            
                            if (!inviteCode) {
                                console.log(chalk.red(`❌ Invalid invite link: ${inviteLink}`));
                                continue;
                            }
                            
                            console.log(chalk.blue(`🔄 Attempting to join: ${inviteCode}`));
                            
                            const result = await GodszealBotInc.groupAcceptInvite(inviteCode);
                            
                            if (result) {
                                console.log(chalk.green(`✓ Successfully joined group: ${inviteCode}`));
                            }
                            
                        } catch (e) {
                            const errorMsg = e.message.toLowerCase();
                            
                            if (errorMsg.includes('already') || errorMsg.includes('participant')) {
                                console.log(chalk.blue(`ℹ️ Already in group: ${inviteLink.split('/').pop()}`));
                            } else if (errorMsg.includes('not-authorized') || errorMsg.includes('forbidden')) {
                                console.log(chalk.yellow(`⚠️ Not authorized to join: ${inviteLink.split('/').pop()}`));
                            } else if (errorMsg.includes('gone') || errorMsg.includes('expired')) {
                                console.log(chalk.red(`❌ Invite link expired: ${inviteLink.split('/').pop()}`));
                            } else if (errorMsg.includes('bad-request')) {
                                console.log(chalk.red(`❌ Invalid invite code: ${inviteLink.split('/').pop()}`));
                            } else {
                                console.log(chalk.yellow(`⚠️ Failed to join ${inviteLink.split('/').pop()}: ${e.message}`));
                            }
                        }
                    }
                    
                    // Mark auto-actions as completed
                    autoActionsCompleted = true;
                    
                    console.log(chalk.green.bold(`🎉 GODSZEAL XMD online!`));
                    console.log(chalk.cyan(`📰 Newsletter auto-react is ACTIVE`));
                    console.log(chalk.green(`✅ All systems operational!`));
                    
                } catch (e) {
                    console.log(chalk.yellow(`⚠️ Auto-actions error: ${e.message}`));
                }
            } else {
                console.log(chalk.blue(`ℹ️ Auto-actions already completed for this session`));
            }
            // ==================== END AUTO-ACTIONS ====================
        }
        if (
            connection === "close" &&
            lastDisconnect &&
            lastDisconnect.error &&
            lastDisconnect.error.output.statusCode != 401
        ) {
            startGodszealBotInc()
        }
    })

    GodszealBotInc.ev.on('creds.update', saveCreds)
    
    GodszealBotInc.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(GodszealBotInc, update);
    });

    GodszealBotInc.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(GodszealBotInc, m);
        }
    });

    GodszealBotInc.ev.on('status.update', async (status) => {
        await handleStatus(GodszealBotInc, status);
    });

    GodszealBotInc.ev.on('messages.reaction', async (status) => {
        await handleStatus(GodszealBotInc, status);
    });

    return GodszealBotInc
}


// Start the bot with error handling
startGodszealBotInc().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})
