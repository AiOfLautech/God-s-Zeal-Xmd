const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function githubCommand(sock, chatId, message) {
  try {
    const res = await fetch('https://api.github.com/repos/AiOfLautech/God-s-Zeal-Xmd');
    if (!res.ok) throw new Error('Error fetching repository data');
    const json = await res.json();

    const zipUrl = `https://codeload.github.com/${json.full_name}/zip/refs/heads/${json.default_branch || 'main'}`;

    let txt = `*乂  GOD'S ZEAL XMD  乂*\n\n`;
    txt += `✩  *Repository* : ${json.full_name}\n`;
    txt += `✩  *Stars* : ${json.stargazers_count}\n`;
    txt += `✩  *Forks* : ${json.forks_count}\n`;
    txt += `✩  *Watchers* : ${json.watchers_count}\n`;
    txt += `✩  *Size* : ${(json.size / 1024).toFixed(2)} MB\n`;
    txt += `✩  *Last Updated* : ${moment(json.updated_at).format('DD/MM/YY - HH:mm:ss')}\n`;
    txt += `✩  *Repository URL* : ${json.html_url}\n`;
    txt += `✩  *ZIP URL* : ${zipUrl}\n\n`;
    txt += `💥 *GOD'S ZEAL XMD*`;

    const imgPath = path.join(__dirname, '../../assets/bot_image.jpg');
    const imgBuffer = fs.readFileSync(imgPath);

    await sock.sendMessage(chatId, { image: imgBuffer, caption: txt }, { quoted: message });
    await sock.sendMessage(chatId, {
      document: { url: zipUrl },
      fileName: `${json.name}-${json.default_branch || 'main'}.zip`,
      mimetype: 'application/zip',
      caption: `📦 Latest ZIP for ${json.full_name}`
    }, { quoted: message });
  } catch (error) {
    await sock.sendMessage(chatId, { text: '❌ Error fetching repository information.' }, { quoted: message });
  }
}

module.exports = githubCommand;
