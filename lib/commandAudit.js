const fs = require('fs');
const path = require('path');

const settings = require('../settings');

const repoRoot = process.cwd();

function uniqueSorted(values) {
    return [...new Set(values.filter(Boolean))].sort();
}

function resolveTelegramHandlersRoot() {
    const configured = String(settings.telegramHandlersDir || 'handlers').trim();
    const candidates = [
        configured ? (path.isAbsolute(configured) ? configured : path.join(repoRoot, configured)) : '',
        path.join(repoRoot, 'commands', 'economy', 'handlers'),
        path.join(repoRoot, 'handlers'),
        path.join(repoRoot, 'telegram_handlers'),
    ].filter(Boolean);

    return candidates.find((candidate) => fs.existsSync(candidate)) || '';
}

function parseMainCommands() {
    const text = fs.readFileSync(path.join(repoRoot, 'main.js'), 'utf8');
    const matches = [];
    const regexes = [
        /userMessage\s*===\s*'([^']+)'/g,
        /userMessage\.startsWith\('([^']+)'\)/g,
        /case\s+userMessage\s*===\s*'([^']+)'/g,
        /case\s+userMessage\.startsWith\('([^']+)'\)/g,
    ];

    for (const regex of regexes) {
        for (const match of text.matchAll(regex)) {
            matches.push(match[1]);
        }
    }

    return uniqueSorted(matches.map((entry) => entry.trim()));
}

function parseHelpCommands() {
    const helpPath = path.join(repoRoot, 'commands', 'general', 'help.js');
    if (!fs.existsSync(helpPath)) return [];

    const text = fs.readFileSync(helpPath, 'utf8');
    const commands = [];
    for (const match of text.matchAll(/\$\{prefix\}([a-z0-9-]+)/gi)) {
        commands.push(`.${match[1].toLowerCase()}`);
    }
    return uniqueSorted(commands);
}

function parseTelegramCommands() {
    const telegramHandlersRoot = resolveTelegramHandlersRoot();
    if (!telegramHandlersRoot) {
        return [];
    }

    const commands = [];
    const files = fs.readdirSync(telegramHandlersRoot).filter((file) => file.endsWith('.py'));
    for (const file of files) {
        const text = fs.readFileSync(path.join(telegramHandlersRoot, file), 'utf8');
        for (const match of text.matchAll(/\("([a-z_]+)",\s*([a-z_]+)\)/g)) {
            commands.push(match[1]);
        }
    }

    return uniqueSorted(commands);
}

function getEconomyRegistry() {
    return uniqueSorted([
        '.economy', '.eco', '.ecomenu',
        '.balance', '.bal',
        '.daily', '.weekly', '.monthly',
        '.work', '.beg',
        '.deposit', '.dep',
        '.withdraw', '.with',
        '.leaderboard', '.lb',
        '.profile',
        '.networth', '.nw',
        '.ecostats', '.stats',
        '.cooldowns', '.cd',
        '.bankupgrade',
    ]);
}

function buildAuditReport() {
    const routed = parseMainCommands();
    const menuListed = parseHelpCommands();
    const telegram = parseTelegramCommands().map((entry) => `.${entry.toLowerCase()}`);
    const economy = getEconomyRegistry();

    const routedSet = new Set(routed);
    const menuSet = new Set(menuListed);

    const listedNotRouted = menuListed.filter((command) => !routedSet.has(command));
    const routedNotListed = routed.filter((command) => !menuSet.has(command));
    const telegramMissing = telegram.filter((command) => !routedSet.has(command));
    const economyMissing = economy.filter((command) => !routedSet.has(command));

    return {
        totals: {
            currentJsCommandFiles: fs.readdirSync(path.join(repoRoot, 'commands'), { recursive: true }).filter((entry) => String(entry).endsWith('.js')).length,
            routedCommands: routed.length,
            listedCommands: menuListed.length,
            telegramCommands: telegram.length,
            economyCommands: economy.length,
        },
        telegramHandlersRoot: resolveTelegramHandlersRoot(),
        routed,
        menuListed,
        telegram,
        economy,
        listedNotRouted,
        routedNotListed,
        telegramMissing,
        economyMissing,
        broken: listedNotRouted,
    };
}

function formatAuditReport(report, mode = 'summary') {
    const lines = [
        'Command Audit',
        '------------------',
        `- Routed WhatsApp commands: ${report.totals.routedCommands}`,
        `- Menu listed commands: ${report.totals.listedCommands}`,
        `- Telegram reference commands: ${report.totals.telegramCommands}`,
        `- Economy commands tracked: ${report.totals.economyCommands}`,
        `- Telegram handler source: ${report.telegramHandlersRoot || 'not found in repo'}`,
    ];

    if (mode === 'missing') {
        lines.push('', 'Listed but not routed');
        lines.push(...(report.listedNotRouted.length ? report.listedNotRouted.map((cmd) => `- ${cmd}`) : ['- none']));
        return lines.join('\n');
    }

    if (mode === 'broken') {
        lines.push('', 'Potentially broken commands');
        lines.push(...(report.broken.length ? report.broken.map((cmd) => `- ${cmd}`) : ['- none']));
        return lines.join('\n');
    }

    if (mode === 'economy') {
        lines.push('', 'Economy coverage');
        lines.push(...report.economy.map((cmd) => `- ${report.economyMissing.includes(cmd) ? 'missing' : 'wired'} ${cmd}`));
        return lines.join('\n');
    }

    lines.push('', `- Listed but not routed: ${report.listedNotRouted.length}`);
    lines.push(`- Routed but not listed: ${report.routedNotListed.length}`);
    lines.push(`- Telegram commands not yet ported: ${report.telegramMissing.length}`);
    lines.push('', 'Use .cmdaudit missing, .cmdaudit broken, or .cmdaudit economy for details.');
    return lines.join('\n');
}

module.exports = {
    buildAuditReport,
    formatAuditReport,
    parseTelegramCommands,
    resolveTelegramHandlersRoot,
};
