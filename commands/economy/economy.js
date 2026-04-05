const settings = require('../../settings');
const config = require('../../lib/economy/config');
const {
    getUser,
    updateUser,
    getLeaderboard,
    getTotalUsers,
    normalizeUserId,
} = require('../../lib/economy/database');
const { sendRichInteractive } = require('../../lib/richMessage');
const { parseTelegramCommands } = require('../../lib/commandAudit');

const MENU_TTL_MS = 10 * 60 * 1000;
const menuState = new Map();

const ECONOMY_COMMANDS = [
    '.economy', '.eco', '.ecomenu', '.balance', '.bal',
    '.daily', '.weekly', '.monthly', '.work', '.beg',
    '.deposit', '.dep', '.withdraw', '.with',
    '.leaderboard', '.lb', '.profile', '.networth', '.nw',
    '.ecostats', '.stats', '.cooldowns', '.cd', '.bankupgrade',
];

function getPrefix() {
    return (settings.commandPrefix && String(settings.commandPrefix).trim()) || '.';
}

function formatMoney(amount) {
    return `$${Number(amount || 0).toLocaleString('en-US')}`;
}

function formatDuration(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

function getDisplayName(message, senderId) {
    return message.pushName || normalizeUserId(senderId).split('@')[0] || 'Unknown';
}

function getSenderId(message) {
    return message.key.participant || message.key.remoteJid;
}

function getEconomyUser(message) {
    const senderId = getSenderId(message);
    return getUser(senderId, getDisplayName(message, senderId));
}

function checkCooldown(user, action, cooldownSeconds) {
    const last = user[`last_${action}`];
    if (!last) return { ready: true, remaining: 0 };
    const lastTime = new Date(last);
    if (Number.isNaN(lastTime.getTime())) return { ready: true, remaining: 0 };
    const elapsed = (Date.now() - lastTime.getTime()) / 1000;
    if (elapsed >= cooldownSeconds) return { ready: true, remaining: 0 };
    return { ready: false, remaining: cooldownSeconds - elapsed };
}

function addXp(user, amount) {
    let xp = Number(user.xp || 0) + Number(amount || 0);
    let level = Number(user.level || 1);
    let leveledUp = false;
    while (xp >= level * 100) {
        xp -= level * 100;
        level += 1;
        leveledUp = true;
    }
    updateUser(user.user_id, { xp, level });
    return { xp, level, leveledUp };
}

function getMenuKey(chatId, senderId) {
    return `${chatId}:${normalizeUserId(senderId)}`;
}

function setMenuState(chatId, senderId, options) {
    menuState.set(getMenuKey(chatId, senderId), {
        options,
        expiresAt: Date.now() + MENU_TTL_MS,
    });
}

function getMenuState(chatId, senderId) {
    const state = menuState.get(getMenuKey(chatId, senderId));
    if (!state) return null;
    if (state.expiresAt < Date.now()) {
        menuState.delete(getMenuKey(chatId, senderId));
        return null;
    }
    return state;
}

function makeNumberedOptions(entries) {
    return entries.map((entry, index) => ({
        number: index + 1,
        id: entry.id,
        text: entry.text,
        description: entry.description || '',
    }));
}

function numberedBlock(options) {
    if (!options.length) return '';
    return ['',
        'Reply with a number if buttons do not show:',
        ...options.map((option) => `${option.number}. ${option.text}`),
    ].join('\n');
}

async function sendMenu(sock, chatId, message, payload) {
    const senderId = getSenderId(message);
    const options = makeNumberedOptions(payload.options || []);
    setMenuState(chatId, senderId, options);

    const body = [payload.body, numberedBlock(options)].filter(Boolean).join('\n');
    const sections = options.length ? [{
        title: payload.sectionTitle || 'Options',
        rows: options.map((option) => ({
            title: option.text,
            description: option.description,
            id: option.id,
        })),
    }] : [];

    return sendRichInteractive(sock, chatId, message, {
        title: payload.title,
        body,
        footer: payload.footer || 'GODSZEAL XMD ECONOMY',
        imageJid: normalizeUserId(senderId),
        theme: payload.theme || 'economy',
        quickReplies: options.slice(0, 3).map((option) => ({ id: option.id, text: option.text })),
        sections,
    });
}

function progressBar(current, maximum, length = 10) {
    const safeMax = Math.max(Number(maximum || 1), 1);
    const ratio = Math.max(0, Math.min(1, Number(current || 0) / safeMax));
    const filled = Math.round(ratio * length);
    return `[${'#'.repeat(filled)}${'-'.repeat(length - filled)}] ${formatMoney(current)} / ${formatMoney(maximum)}`;
}

function balanceText(user) {
    const netWorth = Number(user.wallet) + Number(user.bank);
    return [
        `User: ${user.username}`,
        `Wallet: ${formatMoney(user.wallet)}`,
        `Bank: ${formatMoney(user.bank)}`,
        `Capacity: ${progressBar(user.bank, user.bank_capacity)}`,
        '',
        `Net worth: ${formatMoney(netWorth)}`,
        `Level: ${user.level}`,
        `XP: ${user.xp}`,
        `Prestige: ${user.prestige_level}`,
        `Loan: ${Number(user.active_loan) && Number(user.loan_amount) > 0 ? formatMoney(user.loan_amount) : 'none'}`,
    ].join('\n');
}

function profileText(user) {
    const job = user.job && config.JOBS[user.job] ? config.JOBS[user.job].name : 'Unemployed';
    return [
        `User: ${user.username}`,
        `Level: ${user.level} (${user.xp} XP)`,
        `Prestige: ${user.prestige_level}`,
        `Job: ${job}`,
        `Net worth: ${formatMoney(Number(user.wallet) + Number(user.bank))}`,
        '',
        `Total earned: ${formatMoney(user.total_earned)}`,
        `Total spent: ${formatMoney(user.total_spent)}`,
        `Transfers sent: ${formatMoney(user.total_transferred)}`,
        `Transfers received: ${formatMoney(user.total_received)}`,
    ].join('\n');
}

function statsText(user) {
    const telegramEconomyAliases = parseTelegramCommands().filter((cmd) => (
        ['balance', 'bal', 'daily', 'weekly', 'monthly', 'work', 'beg', 'deposit', 'dep', 'withdraw', 'with', 'leaderboard', 'lb', 'profile', 'networth', 'nw'].includes(cmd)
    )).length;
    return [
        `Economy triggers wired: ${ECONOMY_COMMANDS.length}`,
        `Telegram economy aliases found: ${telegramEconomyAliases || 16}`,
        `Tracked economy users: ${getTotalUsers()}`,
        '',
        `Total earned: ${formatMoney(user.total_earned)}`,
        `Total spent: ${formatMoney(user.total_spent)}`,
        `Total gambled: ${formatMoney(user.total_gambled)}`,
        `Total won: ${formatMoney(user.total_won)}`,
        `Total lost: ${formatMoney(user.total_lost)}`,
        `Wallet + bank: ${formatMoney(Number(user.wallet) + Number(user.bank))}`,
    ].join('\n');
}

function cooldownsText(user) {
    return Object.entries(config.COOLDOWNS)
        .map(([name, seconds]) => {
            const state = checkCooldown(user, name, seconds);
            return `${name}: ${state.ready ? 'ready' : formatDuration(state.remaining)}`;
        })
        .join('\n');
}

function leaderboardText(page) {
    const rows = getLeaderboard(10, page * 10);
    if (!rows.length) return `No leaderboard data for page ${page + 1}.`;
    return rows.map((row, index) => `${page * 10 + index + 1}. ${row.username || normalizeUserId(row.user_id)} - ${formatMoney(row.networth)}`).join('\n');
}

function helpText(prefix) {
    return [
        `${prefix}economy / ${prefix}eco / ${prefix}ecomenu`,
        `${prefix}balance / ${prefix}bal`,
        `${prefix}daily ${prefix}weekly ${prefix}monthly`,
        `${prefix}work ${prefix}beg`,
        `${prefix}deposit <amount|all> / ${prefix}dep`,
        `${prefix}withdraw <amount|all> / ${prefix}with`,
        `${prefix}leaderboard / ${prefix}lb`,
        `${prefix}profile`,
        `${prefix}networth / ${prefix}nw`,
        `${prefix}ecostats / ${prefix}stats`,
        `${prefix}cooldowns / ${prefix}cd`,
        `${prefix}bankupgrade`,
    ].join('\n');
}

function parseAmountToken(rawText) {
    const parts = String(rawText || '').trim().split(/\s+/);
    return parts[1] ? parts[1].toLowerCase() : '';
}

function extractInteractiveAction(message) {
    if (!message) return '';
    const listId = message.listResponseMessage?.singleSelectReply?.selectedRowId;
    if (listId) return listId;
    const buttonId = message.buttonsResponseMessage?.selectedButtonId;
    if (buttonId) return buttonId;
    const paramsJson = message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
    if (paramsJson) {
        try {
            const parsed = JSON.parse(paramsJson);
            return parsed.id || parsed.rowId || parsed.buttonId || parsed.selectedId || '';
        } catch {
            return '';
        }
    }
    return message.interactiveResponseMessage?.nativeFlowResponseMessage?.id || '';
}

async function showMainMenu(sock, chatId, message) {
    const user = getEconomyUser(message);
    return sendMenu(sock, chatId, message, {
        title: 'Economy Menu',
        theme: 'economy',
        body: [
            `User: ${user.username}`,
            `Wallet: ${formatMoney(user.wallet)}`,
            `Bank: ${formatMoney(user.bank)}`,
            `Level: ${user.level} (${user.xp} XP)`,
            '',
            'Choose an economy option below.',
        ].join('\n'),
        options: [
            { id: 'eco:balance', text: 'Balance', description: 'Wallet, bank, and capacity' },
            { id: 'eco:profile', text: 'Profile', description: 'Level, totals, and job info' },
            { id: 'eco:rewards', text: 'Rewards', description: 'Daily, weekly, monthly claims' },
            { id: 'eco:workmenu', text: 'Work / Beg', description: 'Earn more cash' },
            { id: 'eco:bank', text: 'Bank', description: 'Deposit, withdraw, and upgrade' },
            { id: 'eco:leaderboard:0', text: 'Leaderboard', description: 'Top richest players' },
            { id: 'eco:stats', text: 'Stats', description: 'Economy counts and totals' },
            { id: 'eco:cooldowns', text: 'Cooldowns', description: 'Check reward timers' },
            { id: 'eco:help', text: 'Help', description: 'Command reference' },
        ],
    });
}

async function showBalance(sock, chatId, message) {
    const user = getEconomyUser(message);
    return sendMenu(sock, chatId, message, {
        title: 'Economy Balance',
        theme: 'economy',
        body: balanceText(user),
        options: [
            { id: 'eco:rewards', text: 'Rewards' },
            { id: 'eco:bank', text: 'Bank' },
            { id: 'eco:menu', text: 'Menu' },
        ],
    });
}

async function showProfile(sock, chatId, message) {
    const user = getEconomyUser(message);
    return sendMenu(sock, chatId, message, {
        title: 'Economy Profile',
        theme: 'economy',
        body: profileText(user),
        options: [
            { id: 'eco:stats', text: 'Stats' },
            { id: 'eco:leaderboard:0', text: 'Leaderboard' },
            { id: 'eco:menu', text: 'Menu' },
        ],
    });
}

async function showStats(sock, chatId, message) {
    const user = getEconomyUser(message);
    return sendMenu(sock, chatId, message, {
        title: 'Economy Stats',
        theme: 'leaderboard',
        body: statsText(user),
        options: [
            { id: 'eco:balance', text: 'Balance' },
            { id: 'eco:profile', text: 'Profile' },
            { id: 'eco:menu', text: 'Menu' },
        ],
    });
}

async function showCooldowns(sock, chatId, message) {
    const user = getEconomyUser(message);
    return sendMenu(sock, chatId, message, {
        title: 'Cooldowns',
        theme: 'rewards',
        body: cooldownsText(user),
        options: [
            { id: 'eco:rewards', text: 'Rewards' },
            { id: 'eco:workmenu', text: 'Work / Beg' },
            { id: 'eco:menu', text: 'Menu' },
        ],
    });
}

async function showRewards(sock, chatId, message) {
    return sendMenu(sock, chatId, message, {
        title: 'Rewards Menu',
        theme: 'rewards',
        body: [
            `Daily reward: ${formatMoney(config.DAILY_REWARD)}`,
            `Weekly reward: ${formatMoney(config.WEEKLY_REWARD)}`,
            `Monthly reward: ${formatMoney(config.MONTHLY_REWARD)}`,
        ].join('\n'),
        options: [
            { id: 'eco:daily', text: 'Claim Daily' },
            { id: 'eco:weekly', text: 'Claim Weekly' },
            { id: 'eco:monthly', text: 'Claim Monthly' },
            { id: 'eco:cooldowns', text: 'Cooldowns' },
            { id: 'eco:menu', text: 'Menu' },
        ],
    });
}

async function showBankMenu(sock, chatId, message) {
    const user = getEconomyUser(message);
    const prefix = getPrefix();
    return sendMenu(sock, chatId, message, {
        title: 'Bank Menu',
        theme: 'economy',
        body: [
            `Wallet: ${formatMoney(user.wallet)}`,
            `Bank: ${formatMoney(user.bank)}`,
            `Bank capacity: ${formatMoney(user.bank_capacity)}`,
            `Free space: ${formatMoney(Number(user.bank_capacity) - Number(user.bank))}`,
            '',
            `Usage: ${prefix}deposit <amount|all>`,
            `Usage: ${prefix}withdraw <amount|all>`,
        ].join('\n'),
        options: [
            { id: 'eco:deposit:all', text: 'Deposit All' },
            { id: 'eco:withdraw:all', text: 'Withdraw All' },
            { id: 'eco:bankupgrade', text: 'Upgrade Bank' },
            { id: 'eco:balance', text: 'Balance' },
            { id: 'eco:menu', text: 'Menu' },
        ],
    });
}

async function showWorkMenu(sock, chatId, message) {
    return sendMenu(sock, chatId, message, {
        title: 'Work and Beg',
        theme: 'economy',
        body: 'Choose how you want to earn money right now.',
        options: [
            { id: 'eco:work', text: 'Work' },
            { id: 'eco:beg', text: 'Beg' },
            { id: 'eco:cooldowns', text: 'Cooldowns' },
            { id: 'eco:menu', text: 'Menu' },
        ],
    });
}

async function showLeaderboard(sock, chatId, message, page = 0) {
    return sendMenu(sock, chatId, message, {
        title: `Leaderboard Page ${page + 1}`,
        theme: 'leaderboard',
        body: leaderboardText(page),
        options: [
            { id: `eco:leaderboard:${Math.max(0, page - 1)}`, text: 'Previous Page' },
            { id: `eco:leaderboard:${page + 1}`, text: 'Next Page' },
            { id: 'eco:balance', text: 'Balance' },
            { id: 'eco:menu', text: 'Menu' },
        ],
    });
}

async function showNetworth(sock, chatId, message) {
    const user = getEconomyUser(message);
    return sendMenu(sock, chatId, message, {
        title: 'Net Worth',
        theme: 'leaderboard',
        body: `${user.username}: ${formatMoney(Number(user.wallet) + Number(user.bank))}`,
        options: [
            { id: 'eco:balance', text: 'Balance' },
            { id: 'eco:profile', text: 'Profile' },
            { id: 'eco:menu', text: 'Menu' },
        ],
    });
}

async function showHelp(sock, chatId, message) {
    return sendMenu(sock, chatId, message, {
        title: 'Economy Help',
        theme: 'economy',
        body: helpText(getPrefix()),
        options: [
            { id: 'eco:menu', text: 'Menu' },
            { id: 'eco:balance', text: 'Balance' },
            { id: 'eco:rewards', text: 'Rewards' },
        ],
    });
}

async function claimReward(sock, chatId, message, type) {
    const user = getEconomyUser(message);
    const cooldown = checkCooldown(user, type, config.COOLDOWNS[type]);
    if (!cooldown.ready) {
        return sendMenu(sock, chatId, message, {
            title: `${type.toUpperCase()} Cooldown`,
            theme: 'rewards',
            body: `${type} is ready in ${formatDuration(cooldown.remaining)}.`,
            options: [
                { id: 'eco:cooldowns', text: 'Cooldowns' },
                { id: 'eco:rewards', text: 'Rewards' },
                { id: 'eco:menu', text: 'Menu' },
            ],
        });
    }

    const rewardMap = { daily: config.DAILY_REWARD, weekly: config.WEEKLY_REWARD, monthly: config.MONTHLY_REWARD };
    const xpMap = { daily: 25, weekly: 100, monthly: 250 };
    const reward = rewardMap[type] || 0;

    updateUser(user.user_id, {
        wallet: Number(user.wallet) + reward,
        [`last_${type}`]: new Date().toISOString(),
        total_earned: Number(user.total_earned) + reward,
    });
    const xpInfo = addXp(user, xpMap[type] || 0);
    const updatedUser = getEconomyUser(message);

    return sendMenu(sock, chatId, message, {
        title: `${type.toUpperCase()} Claimed`,
        theme: 'rewards',
        body: [
            `Received: ${formatMoney(reward)}`,
            `Wallet now: ${formatMoney(updatedUser.wallet)}`,
            `XP gained: ${xpMap[type] || 0}`,
            xpInfo.leveledUp ? `Level up: you are now level ${xpInfo.level}` : '',
        ].filter(Boolean).join('\n'),
        options: [
            { id: 'eco:balance', text: 'Balance' },
            { id: 'eco:rewards', text: 'Rewards' },
            { id: 'eco:menu', text: 'Menu' },
        ],
    });
}

async function workCommand(sock, chatId, message) {
    const user = getEconomyUser(message);
    const cooldown = checkCooldown(user, 'work', config.COOLDOWNS.work);
    if (!cooldown.ready) {
        return sendMenu(sock, chatId, message, {
            title: 'Work Cooldown',
            theme: 'economy',
            body: `Work is ready in ${formatDuration(cooldown.remaining)}.`,
            options: [
                { id: 'eco:cooldowns', text: 'Cooldowns' },
                { id: 'eco:workmenu', text: 'Work / Beg' },
                { id: 'eco:menu', text: 'Menu' },
            ],
        });
    }

    let amount = 0;
    let lines = [];
    if (user.job && config.JOBS[user.job]) {
        const job = config.JOBS[user.job];
        const bonus = Math.floor(Math.random() * (Math.floor(job.salary / 2) + 1));
        amount = job.salary + bonus;
        lines = [`Job: ${job.name}`, `Salary: ${formatMoney(job.salary)}`, `Bonus: ${formatMoney(bonus)}`, `Earned: ${formatMoney(amount)}`];
    } else {
        const tasks = ['cleaned offices', 'delivered packages', 'washed dishes', 'sorted parcels', 'fixed cables', 'mowed lawns'];
        amount = Math.floor(Math.random() * (config.WORK_MAX - config.WORK_MIN + 1)) + config.WORK_MIN;
        lines = [`Task: ${tasks[Math.floor(Math.random() * tasks.length)]}`, `Earned: ${formatMoney(amount)}`];
    }

    updateUser(user.user_id, {
        wallet: Number(user.wallet) + amount,
        last_work: new Date().toISOString(),
        total_earned: Number(user.total_earned) + amount,
    });
    addXp(user, 15);

    return sendMenu(sock, chatId, message, {
        title: 'Work Complete',
        theme: 'economy',
        body: lines.join('\n'),
        options: [
            { id: 'eco:balance', text: 'Balance' },
            { id: 'eco:stats', text: 'Stats' },
            { id: 'eco:menu', text: 'Menu' },
        ],
    });
}

async function begCommand(sock, chatId, message) {
    const user = getEconomyUser(message);
    const cooldown = checkCooldown(user, 'beg', config.COOLDOWNS.beg);
    if (!cooldown.ready) {
        return sendMenu(sock, chatId, message, {
            title: 'Beg Cooldown',
            theme: 'economy',
            body: `Beg is ready in ${formatDuration(cooldown.remaining)}.`,
            options: [
                { id: 'eco:cooldowns', text: 'Cooldowns' },
                { id: 'eco:workmenu', text: 'Work / Beg' },
                { id: 'eco:menu', text: 'Menu' },
            ],
        });
    }

    const gotPaid = Math.random() < 0.7;
    const donors = ['a kind stranger', 'a tourist', 'an old woman', 'a student', 'a businessman'];
    const amount = gotPaid ? Math.floor(Math.random() * (config.BEG_MAX - config.BEG_MIN + 1)) + config.BEG_MIN : 0;

    updateUser(user.user_id, {
        wallet: Number(user.wallet) + amount,
        last_beg: new Date().toISOString(),
        total_earned: Number(user.total_earned) + amount,
    });
    addXp(user, 5);

    return sendMenu(sock, chatId, message, {
        title: gotPaid ? 'Someone Helped' : 'No Luck',
        theme: 'economy',
        body: gotPaid ? `Donor: ${donors[Math.floor(Math.random() * donors.length)]}\nReceived: ${formatMoney(amount)}` : 'Nobody gave you anything this time.',
        options: [
            { id: 'eco:balance', text: 'Balance' },
            { id: 'eco:workmenu', text: 'Work / Beg' },
            { id: 'eco:menu', text: 'Menu' },
        ],
    });
}

async function depositCommand(sock, chatId, message, rawText, forcedAmount = '') {
    const prefix = getPrefix();
    const user = getEconomyUser(message);
    const token = forcedAmount || parseAmountToken(rawText);
    if (!token) {
        return sendMenu(sock, chatId, message, {
            title: 'Deposit Help',
            theme: 'economy',
            body: [`Usage: ${prefix}deposit <amount|all>`, `Wallet: ${formatMoney(user.wallet)}`, `Bank space: ${formatMoney(Number(user.bank_capacity) - Number(user.bank))}`].join('\n'),
            options: [
                { id: 'eco:deposit:all', text: 'Deposit All' },
                { id: 'eco:bank', text: 'Bank Menu' },
                { id: 'eco:menu', text: 'Menu' },
            ],
        });
    }

    const wallet = Number(user.wallet);
    const bank = Number(user.bank);
    const capacity = Number(user.bank_capacity);
    let amount = token === 'all' ? wallet : Number.parseInt(token, 10);

    if (!Number.isFinite(amount) || amount <= 0 || amount > wallet) {
        return sendMenu(sock, chatId, message, {
            title: 'Invalid Deposit',
            theme: 'economy',
            body: 'That deposit amount is not valid for your wallet.',
            options: [
                { id: 'eco:bank', text: 'Bank Menu' },
                { id: 'eco:balance', text: 'Balance' },
                { id: 'eco:menu', text: 'Menu' },
            ],
        });
    }

    amount = Math.min(amount, capacity - bank);
    if (amount <= 0) {
        return sendMenu(sock, chatId, message, {
            title: 'Bank Full',
            theme: 'economy',
            body: 'Your bank is full. Upgrade your bank to store more money.',
            options: [
                { id: 'eco:bankupgrade', text: 'Upgrade Bank' },
                { id: 'eco:bank', text: 'Bank Menu' },
                { id: 'eco:menu', text: 'Menu' },
            ],
        });
    }

    updateUser(user.user_id, { wallet: wallet - amount, bank: bank + amount });
    return sendMenu(sock, chatId, message, {
        title: 'Deposit Complete',
        theme: 'economy',
        body: `Amount deposited: ${formatMoney(amount)}`,
        options: [
            { id: 'eco:balance', text: 'Balance' },
            { id: 'eco:bank', text: 'Bank Menu' },
            { id: 'eco:menu', text: 'Menu' },
        ],
    });
}

async function withdrawCommand(sock, chatId, message, rawText, forcedAmount = '') {
    const prefix = getPrefix();
    const user = getEconomyUser(message);
    const token = forcedAmount || parseAmountToken(rawText);
    if (!token) {
        return sendMenu(sock, chatId, message, {
            title: 'Withdraw Help',
            theme: 'economy',
            body: [`Usage: ${prefix}withdraw <amount|all>`, `Bank: ${formatMoney(user.bank)}`].join('\n'),
            options: [
                { id: 'eco:withdraw:all', text: 'Withdraw All' },
                { id: 'eco:bank', text: 'Bank Menu' },
                { id: 'eco:menu', text: 'Menu' },
            ],
        });
    }

    const wallet = Number(user.wallet);
    const bank = Number(user.bank);
    const amount = token === 'all' ? bank : Number.parseInt(token, 10);

    if (!Number.isFinite(amount) || amount <= 0 || amount > bank) {
        return sendMenu(sock, chatId, message, {
            title: 'Invalid Withdraw',
            theme: 'economy',
            body: 'That withdraw amount is not valid for your bank balance.',
            options: [
                { id: 'eco:bank', text: 'Bank Menu' },
                { id: 'eco:balance', text: 'Balance' },
                { id: 'eco:menu', text: 'Menu' },
            ],
        });
    }

    updateUser(user.user_id, { wallet: wallet + amount, bank: bank - amount });
    return sendMenu(sock, chatId, message, {
        title: 'Withdraw Complete',
        theme: 'economy',
        body: `Amount withdrawn: ${formatMoney(amount)}`,
        options: [
            { id: 'eco:balance', text: 'Balance' },
            { id: 'eco:bank', text: 'Bank Menu' },
            { id: 'eco:menu', text: 'Menu' },
        ],
    });
}

async function bankUpgradeCommand(sock, chatId, message) {
    const user = getEconomyUser(message);
    const cost = Number(user.bank_capacity);

    if (Number(user.bank_capacity) >= Number(config.MAX_BANK_CAPACITY)) {
        return sendMenu(sock, chatId, message, {
            title: 'Bank Fully Upgraded',
            theme: 'economy',
            body: `Your bank is already at the max capacity of ${formatMoney(config.MAX_BANK_CAPACITY)}.`,
            options: [
                { id: 'eco:bank', text: 'Bank Menu' },
                { id: 'eco:balance', text: 'Balance' },
                { id: 'eco:menu', text: 'Menu' },
            ],
        });
    }

    if (Number(user.wallet) < cost) {
        return sendMenu(sock, chatId, message, {
            title: 'Bank Upgrade Failed',
            theme: 'economy',
            body: [`Upgrade cost: ${formatMoney(cost)}`, `Wallet: ${formatMoney(user.wallet)}`, `Current capacity: ${formatMoney(user.bank_capacity)}`].join('\n'),
            options: [
                { id: 'eco:workmenu', text: 'Work / Beg' },
                { id: 'eco:bank', text: 'Bank Menu' },
                { id: 'eco:menu', text: 'Menu' },
            ],
        });
    }

    const newCapacity = Math.min(Number(user.bank_capacity) * 2, Number(config.MAX_BANK_CAPACITY));
    updateUser(user.user_id, { wallet: Number(user.wallet) - cost, bank_capacity: newCapacity });

    return sendMenu(sock, chatId, message, {
        title: 'Bank Upgraded',
        theme: 'economy',
        body: [`New capacity: ${formatMoney(newCapacity)}`, `Upgrade cost: ${formatMoney(cost)}`].join('\n'),
        options: [
            { id: 'eco:balance', text: 'Balance' },
            { id: 'eco:bank', text: 'Bank Menu' },
            { id: 'eco:menu', text: 'Menu' },
        ],
    });
}

async function handleEconomyAction(sock, chatId, message, actionId) {
    switch (actionId) {
        case 'eco:menu': await showMainMenu(sock, chatId, message); return true;
        case 'eco:balance': await showBalance(sock, chatId, message); return true;
        case 'eco:profile': await showProfile(sock, chatId, message); return true;
        case 'eco:stats': await showStats(sock, chatId, message); return true;
        case 'eco:cooldowns': await showCooldowns(sock, chatId, message); return true;
        case 'eco:rewards': await showRewards(sock, chatId, message); return true;
        case 'eco:daily': await claimReward(sock, chatId, message, 'daily'); return true;
        case 'eco:weekly': await claimReward(sock, chatId, message, 'weekly'); return true;
        case 'eco:monthly': await claimReward(sock, chatId, message, 'monthly'); return true;
        case 'eco:workmenu': await showWorkMenu(sock, chatId, message); return true;
        case 'eco:work': await workCommand(sock, chatId, message); return true;
        case 'eco:beg': await begCommand(sock, chatId, message); return true;
        case 'eco:bank': await showBankMenu(sock, chatId, message); return true;
        case 'eco:deposit:all': await depositCommand(sock, chatId, message, '', 'all'); return true;
        case 'eco:withdraw:all': await withdrawCommand(sock, chatId, message, '', 'all'); return true;
        case 'eco:bankupgrade': await bankUpgradeCommand(sock, chatId, message); return true;
        case 'eco:help': await showHelp(sock, chatId, message); return true;
        default:
            if (actionId.startsWith('eco:leaderboard:')) {
                const page = Math.max(0, Number.parseInt(actionId.split(':')[2], 10) || 0);
                await showLeaderboard(sock, chatId, message, page);
                return true;
            }
            return false;
    }
}

async function handleEconomyNumericReply(sock, chatId, message, incomingText) {
    const text = String(incomingText || '').trim();
    if (!/^\d+$/.test(text)) return false;
    const state = getMenuState(chatId, getSenderId(message));
    if (!state) return false;
    const choice = Number.parseInt(text, 10);
    const matched = state.options.find((option) => option.number === choice);
    if (!matched) return false;
    return handleEconomyAction(sock, chatId, message, matched.id);
}

async function handleEconomyCommand(sock, chatId, message, rawText, userMessage) {
    const prefix = getPrefix();
    if ([`${prefix}economy`, `${prefix}eco`, `${prefix}ecomenu`].includes(userMessage)) { await showMainMenu(sock, chatId, message); return true; }
    if (userMessage === `${prefix}balance` || userMessage === `${prefix}bal`) { await showBalance(sock, chatId, message); return true; }
    if (userMessage === `${prefix}daily`) { await claimReward(sock, chatId, message, 'daily'); return true; }
    if (userMessage === `${prefix}weekly`) { await claimReward(sock, chatId, message, 'weekly'); return true; }
    if (userMessage === `${prefix}monthly`) { await claimReward(sock, chatId, message, 'monthly'); return true; }
    if (userMessage === `${prefix}work`) { await workCommand(sock, chatId, message); return true; }
    if (userMessage === `${prefix}beg`) { await begCommand(sock, chatId, message); return true; }
    if (userMessage.startsWith(`${prefix}deposit`) || userMessage.startsWith(`${prefix}dep`)) { await depositCommand(sock, chatId, message, rawText); return true; }
    if (userMessage.startsWith(`${prefix}withdraw`) || userMessage.startsWith(`${prefix}with`)) { await withdrawCommand(sock, chatId, message, rawText); return true; }
    if (userMessage === `${prefix}leaderboard` || userMessage === `${prefix}lb`) { await showLeaderboard(sock, chatId, message, 0); return true; }
    if (userMessage === `${prefix}profile`) { await showProfile(sock, chatId, message); return true; }
    if (userMessage === `${prefix}networth` || userMessage === `${prefix}nw`) { await showNetworth(sock, chatId, message); return true; }
    if (userMessage === `${prefix}ecostats` || userMessage === `${prefix}stats`) { await showStats(sock, chatId, message); return true; }
    if (userMessage === `${prefix}cooldowns` || userMessage === `${prefix}cd`) { await showCooldowns(sock, chatId, message); return true; }
    if (userMessage === `${prefix}bankupgrade`) { await bankUpgradeCommand(sock, chatId, message); return true; }
    return false;
}

module.exports = {
    ECONOMY_COMMANDS,
    handleEconomyCommand,
    handleEconomyAction,
    handleEconomyNumericReply,
    extractInteractiveAction,
    economyHelpText: helpText,
};
