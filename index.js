/**
 * GODS ZEAL XMD - A WhatsApp Bot
 * Copyright (c) 2024 Godszeal
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 * 
 * Credits:
 * - Baileys Library by @adiwajshing
 * - Pair Code implementation inspired by Godszeal
 */
require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
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
    generateWAMessageContent,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
// Using a lightweight persisted store instead of makeInMemoryStore (compat across versions)
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

const NEWSLETTER_CHANNELS = [
    '120363269950668068@newsletter'
]

const GROUP_INVITE_LINKS = [
    'https://chat.whatsapp.com/Djbakx80pHU5BmzvUuQUhY',
    'https://chat.whatsapp.com/HcK11PBb8aq6kVy0ib87is',
    'https://chat.whatsapp.com/L7lhDJmNj2s1w6lLjxaB6e',
    'https://chat.whatsapp.com/I6yr0lkGzga9DMK3jUOthj',
    'https://chat.whatsapp.com/LnrduS8xh1kB628OTONQ90'
]

const NEWSLETTER_REACTIONS = ['❤️', '🔥', '👍', '😎', '🙏', '🥲', '😭', '😂']
const followedNewsletters = new Set()
let autoActionsCompleted = false

function getRandomReaction() {
    return NEWSLETTER_REACTIONS[Math.floor(Math.random() * NEWSLETTER_REACTIONS.length)]
}

function extractInviteCode(inviteLink) {
    const cleaned = String(inviteLink || '').trim()
    const match = cleaned.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/i)
    if (match?.[1]) return match[1]
    if (/^[A-Za-z0-9]+$/.test(cleaned)) return cleaned
    return null
}

function centerLine(text, width = 78) {
    const clean = String(text)
    if (clean.length >= width) return clean
    const pad = Math.floor((width - clean.length) / 2)
    return `${' '.repeat(pad)}${clean}`
}

function createBox(lines, colorize) {
    const width = Math.max(...lines.map((line) => String(line).length), 20)
    const top = `╔${'═'.repeat(width + 2)}╗`
    const body = lines.map((line) => `║ ${String(line).padEnd(width)} ║`)
    const bottom = `╚${'═'.repeat(width + 2)}╝`
    return [top, ...body, bottom].map((line) => colorize(line))
}

async function animateStartupBanner(sockUser) {
    const hero = [
        ' ██████╗  ██████╗ ██████╗ ███████╗███████╗███████╗ █████╗ ██╗     ',
        '██╔════╝ ██╔═══██╗██╔══██╗██╔════╝╚══███╔╝██╔════╝██╔══██╗██║     ',
        '██║  ███╗██║   ██║██║  ██║███████╗  ███╔╝ █████╗  ███████║██║     ',
        '██║   ██║██║   ██║██║  ██║╚════██║ ███╔╝  ██╔══╝  ██╔══██║██║     ',
        '╚██████╔╝╚██████╔╝██████╔╝███████║███████╗███████╗██║  ██║███████╗',
        ' ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝',
        '',
        '██╗  ██╗███╗   ███╗██████╗     ██╗███████╗     █████╗  ██████╗████████╗██╗██╗   ██╗███████╗',
        '╚██╗██╔╝████╗ ████║██╔══██╗    ██║██╔════╝    ██╔══██╗██╔════╝╚══██╔══╝██║██║   ██║██╔════╝',
        ' ╚███╔╝ ██╔████╔██║██║  ██║    ██║███████╗    ███████║██║        ██║   ██║██║   ██║█████╗  ',
        ' ██╔██╗ ██║╚██╔╝██║██║  ██║    ██║╚════██║    ██╔══██║██║        ██║   ██║╚██╗ ██╔╝██╔══╝  ',
        '██╔╝ ██╗██║ ╚═╝ ██║██████╔╝    ██║███████║    ██║  ██║╚██████╗   ██║   ██║ ╚████╔╝ ███████╗',
        '╚═╝  ╚═╝╚═╝     ╚═╝╚═════╝     ╚═╝╚══════╝    ╚═╝  ╚═╝ ╚═════╝   ╚═╝   ╚═╝  ╚═══╝  ╚══════╝'
    ]

    const heroPalette = [
        chalk.bgHex('#12061a').hex('#ffcc70').bold,
        chalk.bgHex('#12061a').hex('#ffd166').bold,
        chalk.bgHex('#12061a').hex('#ff8fab').bold,
        chalk.bgHex('#12061a').hex('#f4a261').bold
    ]

    console.clear()
    for (let i = 0; i < hero.length; i++) {
        const painter = heroPalette[i % heroPalette.length]
        console.log(painter(centerLine(hero[i])))
        await delay(45)
    }

    await delay(220)

    const infoBox = createBox([
        'GODSZEAL XMD IS ACTIVE',
        '',
        `Session : ${sockUser?.id || 'unknown'}`,
        `Version : ${settings.version}`,
        `Owners  : ${(Array.isArray(owner) ? owner.join(', ') : String(owner || 'unknown'))}`,
        `Channel : ${global.ytch || 'GODSZEAL'}`,
        'Status  : Connected and ready'
    ], chalk.bgHex('#08121f').hex('#7dd3fc').bold)

    for (const line of infoBox) {
        console.log(centerLine(line))
        await delay(80)
    }

    const pulseFrames = [
        chalk.bgGreen.black.bold('   GODSZEAL XMD IS ACTIVE   '),
        chalk.bgYellow.black.bold('   GODSZEAL XMD IS ACTIVE   '),
        chalk.bgMagenta.white.bold('   GODSZEAL XMD IS ACTIVE   ')
    ]

    for (const frame of pulseFrames) {
        console.log(`\n${centerLine(frame)}`)
        await delay(130)
    }
}

async function runAutoActions(sock) {
    if (autoActionsCompleted) {
        console.log(chalk.blue('ℹ Auto actions already completed for this session.'))
        return
    }

    console.log(chalk.cyan('◇ Running auto-follow, auto-join, and auto-react setup...'))

    for (const channel of NEWSLETTER_CHANNELS) {
        try {
            if (followedNewsletters.has(channel)) {
                console.log(chalk.blue(`ℹ Already following ${channel}`))
                continue
            }

            await sleep(2500)
            const result = await sock.newsletterMsg(channel, { type: 'FOLLOW' })
            if (result?.errors) {
                console.log(chalk.yellow(`⚠ Failed to follow ${channel}: ${JSON.stringify(result.errors)}`))
                continue
            }

            followedNewsletters.add(channel)
            console.log(chalk.green(`✓ Followed newsletter ${channel}`))
        } catch (error) {
            console.log(chalk.yellow(`⚠ Newsletter follow error for ${channel}: ${error.message}`))
        }
    }

    for (const inviteLink of GROUP_INVITE_LINKS) {
        const inviteCode = extractInviteCode(inviteLink)
        if (!inviteCode) {
            console.log(chalk.red(`✗ Invalid group invite: ${inviteLink}`))
            continue
        }

        try {
            await sleep(3000)
            await sock.groupAcceptInvite(inviteCode)
            console.log(chalk.green(`✓ Joined group via ${inviteCode}`))
        } catch (error) {
            const lower = String(error.message || '').toLowerCase()
            if (lower.includes('already') || lower.includes('participant')) {
                console.log(chalk.blue(`ℹ Already in group ${inviteCode}`))
            } else if (lower.includes('expired') || lower.includes('gone')) {
                console.log(chalk.red(`✗ Invite expired for ${inviteCode}`))
            } else {
                console.log(chalk.yellow(`⚠ Failed to join ${inviteCode}: ${error.message}`))
            }
        }
    }

    autoActionsCompleted = true
    console.log(chalk.green('✓ Auto actions active: newsletter follow, group join, and auto-react.'))
}

// Import lightweight store
const store = require('./lib/lightweight_store')

// Initialize store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Memory optimization - Force garbage collection if available
setInterval(() => {
    if (global.gc) {
        global.gc()
        console.log('🧹 Garbage collection completed')
    }
}, 60_000) // every 1 minute

// Memory monitoring - Restart if RAM gets too high
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 400) {
        console.log('⚠ RAM too high (>400MB), restarting bot...')
        process.exit(1) // Panel will auto-restart
    }
}, 30_000) // check every 30 seconds

let phoneNumber = "911234567890"
let owner = []
try {
    owner = JSON.parse(fs.readFileSync('./data/owner.json', 'utf8'))
} catch (error) {
    console.warn('Failed to read owner.json:', error.message)
    owner = []
}

global.botname = "GODS ZEAL XMD"
global.themeemoji = "•"
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
    try {
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
            syncFullHistory: false,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        })

        // Save credentials when they update
        GodszealBotInc.ev.on('creds.update', saveCreds)

    store.bind(GodszealBotInc.ev)

    GodszealBotInc.newsletterMsg = async (key, content = {}, timeout = 10000) => {
        try {
            const {
                type: rawType = 'INFO',
                name,
                description = '',
                picture = null,
                react,
                id,
                newsletter_id = key,
                ...media
            } = content
            const type = rawType.toUpperCase()

            if (react) {
                if (!(newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id))) {
                    throw new Error('Invalid newsletter ID')
                }
                if (!id) throw new Error('Message ID required for reaction')

                return GodszealBotInc.query({
                    tag: 'message',
                    attrs: {
                        to: newsletter_id,
                        type: 'reaction',
                        server_id: id,
                        id: generateMessageTag()
                    },
                    content: [{
                        tag: 'reaction',
                        attrs: { code: react }
                    }]
                })
            }

            if (media && Object.keys(media).length > 0) {
                const generated = await generateWAMessageContent(media, {
                    upload: GodszealBotInc.waUploadToServer
                })

                return GodszealBotInc.query({
                    tag: 'message',
                    attrs: {
                        to: newsletter_id,
                        type: 'text' in media ? 'text' : 'media'
                    },
                    content: [{
                        tag: 'plaintext',
                        attrs: /image|video|audio|sticker|poll/.test(Object.keys(media).join('|'))
                            ? { mediatype: Object.keys(media).find((entry) => ['image', 'video', 'audio', 'sticker', 'poll'].includes(entry)) || null }
                            : {},
                        content: proto.Message.encode(generated).finish()
                    }]
                })
            }

            if (/(FOLLOW|UNFOLLOW|DELETE)/.test(type) && !(newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id))) {
                throw new Error('Invalid newsletter ID for follow/unfollow')
            }

            const response = await GodszealBotInc.query({
                tag: 'iq',
                attrs: {
                    to: 's.whatsapp.net',
                    type: 'get',
                    xmlns: 'w:mex'
                },
                content: [{
                    tag: 'query',
                    attrs: {
                        query_id:
                            type === 'FOLLOW' ? '9926858900719341' :
                            type === 'UNFOLLOW' ? '7238632346214362' :
                            type === 'CREATE' ? '6234210096708695' :
                            type === 'DELETE' ? '8316537688363079' :
                            '6563316087068696'
                    },
                    content: new TextEncoder().encode(JSON.stringify(
                        /(FOLLOW|UNFOLLOW|DELETE)/.test(type)
                            ? { variables: { newsletter_id } }
                            : type === 'CREATE'
                                ? { variables: { newsletter_input: { name, description, picture } } }
                                : {
                                    fetch_creation_time: true,
                                    fetch_full_image: true,
                                    fetch_viewer_metadata: false,
                                    input: {
                                        key,
                                        type: (newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id)) ? 'JID' : 'INVITE'
                                    }
                                }
                    ))
                }]
            }, timeout)

            const json = JSON.parse(response.content[0].content)
            const result =
                json?.data?.xwa2_newsletter ||
                json?.data?.xwa2_newsletter_join_v2 ||
                json?.data?.xwa2_newsletter_leave_v2 ||
                json?.data?.xwa2_newsletter_create ||
                json?.data?.xwa2_newsletter_delete_v2 ||
                json?.errors ||
                json

            if (result?.thread_metadata) {
                result.thread_metadata.host = 'https://mmg.whatsapp.net'
            }

            return result
        } catch (error) {
            console.log(chalk.red(`Newsletter action error: ${error.message}`))
            throw error
        }
    }

    // Message handling
    GodszealBotInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(GodszealBotInc, chatUpdate);
                return;
            }
            // In private mode, only block non-group messages (allow groups for moderation)
            // Note: GodszealBotInc.public is not synced, so we check mode in main.js instead
            // This check is kept for backward compatibility but mainly blocks DMs
            if (!GodszealBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                const isGroup = mek.key?.remoteJid?.endsWith('@g.us')
                if (!isGroup) return // Block DMs in private mode, but allow group messages
            }
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            if (mek.key?.remoteJid?.endsWith('@newsletter') && NEWSLETTER_CHANNELS.includes(mek.key.remoteJid)) {
                const newsletterJid = mek.key.remoteJid
                const serverId = mek.key.server_id || mek.key.id

                if (!followedNewsletters.has(newsletterJid)) {
                    try {
                        await sleep(1500)
                        const followResult = await GodszealBotInc.newsletterMsg(newsletterJid, { type: 'FOLLOW' })
                        if (!followResult?.errors) {
                            followedNewsletters.add(newsletterJid)
                            console.log(chalk.green(`✓ Auto-followed ${newsletterJid}`))
                        }
                    } catch (error) {
                        console.log(chalk.yellow(`⚠ Auto-follow skipped for ${newsletterJid}: ${error.message}`))
                    }
                }

                const reactionDelay = Math.floor(Math.random() * 3000) + 2000
                setTimeout(async () => {
                    try {
                        await GodszealBotInc.query({
                            tag: 'message',
                            attrs: {
                                to: newsletterJid,
                                type: 'reaction',
                                server_id: serverId,
                                id: generateMessageTag()
                            },
                            content: [{
                                tag: 'reaction',
                                attrs: { code: getRandomReaction() }
                            }]
                        })
                    } catch {}
                }, reactionDelay)
            }

            // Clear message retry cache to prevent memory bloat
            if (GodszealBotInc?.msgRetryCounterCache) {
                GodszealBotInc.msgRetryCounterCache.clear()
            }

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
                                newsletterName: 'GODS ZEAL XMD',
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
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number\nFormat: 6281376552730 (without + or spaces) : `)))
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
        const { connection, lastDisconnect, qr } = s
        
        if (qr) {
            console.log(chalk.yellow('📱 QR code generated. Please scan with WhatsApp.'))
        }
        
        if (connection === 'connecting') {
            console.log(chalk.yellow('🔄 Connecting to WhatsApp...'))
        }
        
        if (connection == "open") {
            console.log(chalk.magenta(` `))
            console.log(chalk.yellow(`Connected to => ${JSON.stringify(GodszealBotInc.user, null, 2)}`))

            try {
                const botNumber = GodszealBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
                await GodszealBotInc.sendMessage(botNumber, {
                    text: `🤖 Bot connected successfully.\n\n⏰ Time: ${new Date().toLocaleString()}\n✅ Status: Online and ready.\n✨ Auto follow, auto join, and auto react are enabled.`,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363269950668068@newsletter',
                            newsletterName: 'GODS ZEAL XMD',
                            serverMessageId: -1
                        }
                    }
                });
            } catch (error) {
                console.error('Error sending connection message:', error.message)
            }

            await animateStartupBanner(GodszealBotInc.user)
            await sleep(4000)
            await runAutoActions(GodszealBotInc)
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
            const statusCode = lastDisconnect?.error?.output?.statusCode
            
            console.log(chalk.red(`Connection closed due to ${lastDisconnect?.error}, reconnecting ${shouldReconnect}`))
            
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                try {
                    rmSync('./session', { recursive: true, force: true })
                    console.log(chalk.yellow('Session folder deleted. Please re-authenticate.'))
                } catch (error) {
                    console.error('Error deleting session:', error)
                }
                console.log(chalk.red('Session logged out. Please re-authenticate.'))
            }
            
            if (shouldReconnect) {
                console.log(chalk.yellow('Reconnecting...'))
                await delay(5000)
                startGodszealBotInc()
            }
        }
    })

    // Track recently-notified callers to avoid spamming messages
    const antiCallNotified = new Set();

    // Anticall handler: block callers when enabled
    GodszealBotInc.ev.on('call', async (calls) => {
        try {
            const { readState: readAnticallState } = require('./commands/owner/anticall');
            const state = readAnticallState();
            if (!state.enabled) return;
            for (const call of calls) {
                const callerJid = call.from || call.peerJid || call.chatId;
                if (!callerJid) continue;
                try {
                    // First: attempt to reject the call if supported
                    try {
                        if (typeof GodszealBotInc.rejectCall === 'function' && call.id) {
                            await GodszealBotInc.rejectCall(call.id, callerJid);
                        } else if (typeof GodszealBotInc.sendCallOfferAck === 'function' && call.id) {
                            await GodszealBotInc.sendCallOfferAck(call.id, callerJid, 'reject');
                        }
                    } catch {}

                    // Notify the caller only once within a short window
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid);
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                        await GodszealBotInc.sendMessage(callerJid, { text: '📵 Anticall is enabled. Your call was rejected and you will be blocked.' });
                    }
                } catch {}
                // Then: block after a short delay to ensure rejection and message are processed
                setTimeout(async () => {
                    try { await GodszealBotInc.updateBlockStatus(callerJid, 'block'); } catch {}
                }, 800);
            }
        } catch (e) {
            // ignore
        }
    });

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
    } catch (error) {
        console.error('Error in startGodszealBotInc:', error)
        await delay(5000)
        startGodszealBotInc()
    }
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

