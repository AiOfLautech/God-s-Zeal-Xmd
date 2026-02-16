const settings = {
  packname: process.env.PACKNAME || '𝐆𝐎𝐃𝐒𝐙𝐄𝐀𝐋 𝐗𝐌𝐃',
  author: process.env.AUTHOR || '‎Gods Zeal †',
  botName: process.env.BOT_NAME || "𝐆𝐎𝐃𝐒𝐙𝐄𝐀𝐋 𝐗𝐌𝐃",
  botOwner: process.env.OWNER_NAME || 'Gods Zeal †',
  ownerNumber: process.env.OWNER_NUMBER || '2347049283499',
  giphyApiKey: process.env.GIPHY_API_KEY || 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: process.env.COMMAND_MODE || "public",
  statusReactEmoji: process.env.STATUS_REACT_EMOJI || "✅",
  autoStatusReact: process.env.AUTO_STATUS_REACT === 'true',
  maxStoreMessages: 20, 
  storeWriteInterval: 10000,
  description: "This is a bot for managing group commands and automating tasks.",
  version: "3.0.0",
  updateZipUrl: "https://github.com/AiOfLautech/God-s-Zeal-Xmd/archive/refs/heads/main.zip",
};

module.exports = settings;
