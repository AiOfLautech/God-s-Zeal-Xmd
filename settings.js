const { getConfig } = require('./lib/botConfig');

const live = getConfig();

const settings = {
  packname: live.packname,
  author: live.author,
  botName: live.botName,
  botOwner: live.creator,
  ownerNumber: live.creatorNumber,
  ownerNumbers: live.ownerNumbers,
  devNumbers: live.devNumbers,
  commandPrefix: live.commandPrefix,
  newsletterJid: live.newsletterJid,
  newsletterName: live.newsletterName,
  telegramHandlersDir: live.telegramHandlersDir,
  premiumDbPath: live.premiumDbPath,
  channelUrl: live.newsletterUrl,
  youtubeUrl: live.youtubeUrl,
  giphyApiKey: live.giphyApiKey,
  commandMode: live.commandMode,
  maxStoreMessages: live.maxStoreMessages,
  storeWriteInterval: live.storeWriteInterval,
  description: live.description,
  version: live.version,
  updateZipUrl: live.updateZipUrl,
  pairApiBase: live.pairApiBase || process.env.PAIR_API_BASE || '',
  mongoUri: live.mongoUri || process.env.MONGO_URI || '',
  mongoDbName: live.mongoDbName || process.env.MONGO_DB_NAME || 'gods_zeal_xmd',
  mongoEncryptionKey: live.mongoEncryptionKey || process.env.MONGO_ENCRYPTION_KEY || '',
};

const settingsProxy = new Proxy(settings, {
  get(_target, prop) {
    if (prop === '__esModule') return false;
    const current = getConfig();
    const mapped = {
      packname: current.packname,
      author: current.author,
      botName: current.botName,
      botOwner: current.creator,
      ownerNumber: current.creatorNumber,
      ownerNumbers: current.ownerNumbers,
      devNumbers: current.devNumbers,
      commandPrefix: current.commandPrefix,
      newsletterJid: current.newsletterJid,
      newsletterName: current.newsletterName,
      telegramHandlersDir: current.telegramHandlersDir,
      premiumDbPath: current.premiumDbPath,
      channelUrl: current.newsletterUrl,
      youtubeUrl: current.youtubeUrl,
      giphyApiKey: current.giphyApiKey,
      commandMode: current.commandMode,
      maxStoreMessages: current.maxStoreMessages,
      storeWriteInterval: current.storeWriteInterval,
      description: current.description,
      version: current.version,
      updateZipUrl: current.updateZipUrl,
      pairApiBase: current.pairApiBase || process.env.PAIR_API_BASE || '',
      mongoUri: current.mongoUri || process.env.MONGO_URI || '',
      mongoDbName: current.mongoDbName || process.env.MONGO_DB_NAME || 'gods_zeal_xmd',
      mongoEncryptionKey: current.mongoEncryptionKey || process.env.MONGO_ENCRYPTION_KEY || '',
    };
    if (prop in mapped) return mapped[prop];
    return current[prop];
  },
});

module.exports = settingsProxy;
