const moment = require('moment-timezone');
const fetch = require('node-fetch');
const { getConfig, getPrefix } = require('../../lib/botConfig');
const { sendStyled } = require('../../lib/menuLayout');

async function githubCommand(sock, chatId, message) {
  const cfg = getConfig();
  const prefix = getPrefix();
  try {
    const repoPath = String(cfg.githubRepo || '').replace('https://github.com/', '') || 'AiOfLautech/God-s-Zeal-Xmd';
    const res = await fetch(`https://api.github.com/repos/${repoPath}`);
    if (!res.ok) throw new Error('Error fetching repository data');
    const json = await res.json();
    const zipUrl = `https://codeload.github.com/${json.full_name}/zip/refs/heads/${json.default_branch || 'main'}`;

    await sendStyled(sock, chatId, message, {
      title: cfg.botName,
      lines: [
        `Repository ☇ *${json.full_name}*`,
        `Stars ☇ *${json.stargazers_count}*`,
        `Forks ☇ *${json.forks_count}*`,
        `URL ☇ ${json.html_url}`,
        `Updated ☇ ${moment(json.updated_at).format('DD/MM/YY - HH:mm:ss')}`
      ],
      buttons: [
        { buttonId: `${prefix}menu`, buttonText: { displayText: 'menu' }, type: 1 },
        { buttonId: `${prefix}owner`, buttonText: { displayText: 'owner' }, type: 1 }
      ]
    });

    await sock.sendMessage(chatId, {
      document: { url: zipUrl },
      fileName: `${json.name}-${json.default_branch || 'main'}.zip`,
      mimetype: 'application/zip',
      caption: `${cfg.botName} source zip`
    }, { quoted: message });
  } catch (error) {
    await sendStyled(sock, chatId, message, {
      title: cfg.botName,
      lines: ['Could not fetch repository information.']
    });
  }
}

module.exports = githubCommand;
