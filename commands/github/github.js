const moment = require('moment-timezone');
const fetch = require('node-fetch');

async function githubCommand(sock, chatId, message) {
  try {
    const res = await fetch('https://api.github.com/repos/AiOfLautech/God-s-Zeal-Xmd');
    if (!res.ok) throw new Error('Error fetching repository data');
    const json = await res.json();

    const zipUrl = `https://codeload.github.com/${json.full_name}/zip/refs/heads/${json.default_branch || 'main'}`;

    const caption = [
      `*乂  GOD'S ZEAL XMD  乂*`,
      '',
      `✩ Repository: ${json.full_name}`,
      `✩ Stars: ${json.stargazers_count}`,
      `✩ Forks: ${json.forks_count}`,
      `✩ Repository URL: ${json.html_url}`,
      `✩ Last Updated: ${moment(json.updated_at).format('DD/MM/YY - HH:mm:ss')}`,
      '',
      '📦 ZIP attached below.'
    ].join('\n');

    await sock.sendMessage(chatId, {
      document: { url: zipUrl },
      fileName: `${json.name}-${json.default_branch || 'main'}.zip`,
      mimetype: 'application/zip',
      caption
    }, { quoted: message });
  } catch (error) {
    await sock.sendMessage(chatId, { text: '❌ Error fetching repository information.' }, { quoted: message });
  }
}

module.exports = githubCommand;
