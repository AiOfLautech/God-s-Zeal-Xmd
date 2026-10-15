# GODSZEAL XMD

<div align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.demolab.com?font=Orbitron&size=48&pause=500&color=33FF00&center=true&width=900&height=100&lines=GODSZEAL+XMD+v3.2.0;Baileys+v7+Pairing;Styled+Menus+%2B+Isolated+Sessions" alt="Typing SVG"/>
  </a>
  <br/>
  <div style="display:inline-block;padding:12px;border-radius:50%;box-shadow:0 8px 32px 0 #33333380;background:linear-gradient(135deg,#33FF00 45%,#00BFFF 100%);">
    <img src="https://raw.githubusercontent.com/AiOfLautech/God-s-Zeal-Xmd/main/assets/bot_image.jpg" alt="GODSZEAL XMD" height="220" style="border-radius:50%;border:5px solid #00BFFF;" />
  </div>
  <br/><br/>
  <img src="https://img.shields.io/badge/version-3.2.0-33FF00?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Baileys-7.0.0--rc14-00BFFF?style=for-the-badge" />
  <img src="https://img.shields.io/badge/prefix-.-yellow?style=for-the-badge" />
  <img src="https://img.shields.io/github/stars/AiOfLautech/God-s-Zeal-Xmd?style=for-the-badge&color=yellow&label=Stars" />
  <img src="https://img.shields.io/github/forks/AiOfLautech/God-s-Zeal-Xmd?style=for-the-badge&color=blue&label=Forks" />
  <img src="https://img.shields.io/github/last-commit/AiOfLautech/God-s-Zeal-Xmd?style=for-the-badge&color=red&label=Last%20Update" />
  <img src="https://komarev.com/ghpvc/?username=AiOfLautech&color=brightgreen&style=for-the-badge&label=Repo%20Views" />
  <img src="https://img.shields.io/github/downloads/AiOfLautech/God-s-Zeal-Xmd/total?style=for-the-badge&color=orange&label=Downloads" />
</div>

---

## Changelog

<details open>
  <summary><strong>v3.2.0 - Styled menus, pairing, and group stories</strong></summary>
  <br/>

  | Area | What changed |
  |------|----------------|
  | Identity | Live config now lives in `bot.json` and reloads through `lib/botConfig.js` |
  | Pairing | Baileys v7 pairing. Extra users get isolated sessions under `sessions/` |
  | Menu | `.menu` lists every command in one message, including MISC |
  | Buttons | Button / newmenu style uses the location-button layout. `gifted-btns` was removed so a second menu is no longer sent |
  | Image | Valid local `assets/bot_image.jpg` with URL fallback from `bot.json` / `data/menuImage.json` |
  | Replies | Command replies use the shared ASCII `sendStyled` box |
  | Group stories | `.gcstatus` posts group status silently with ⏳ / ✅ / ❌ reacts |
  | Owner | `.setprefix`, `.setmenu`, `.sessions` |
  | Public | `.pair <number>` starts an isolated extra session |

</details>

<details>
  <summary><strong>Command catalog added in v3.2.0</strong></summary>
  <br/>

  | Category | Commands |
  |----------|----------|
  | GENERAL | menu, help, ping, alive, owner, pair, settings, jid, tts, weather, news, lyrics, ss, translate, url, vv, script, git |
  | ADMIN | ban, unban, kick, promote, demote, mute, unmute, tagall, hidetag, warn, antilink, welcome, goodbye, gcstatus, groupinfo, staff |
  | OWNER | setprefix, setmenu, sessions, mode, update, setpp, autostatus, anticall, autoread, autotyping, antidelete, sudo |
  | MEDIA | sticker, take, play, song, video, tiktok, instagram, facebook, remini, removebg, blur, emojimix |
  | AI | gpt, gemini, imagine, flux, dalle, sora |
  | FUN | truth, dare, joke, quote, fact, meme, flirt, ship, character, 8ball |
  | MISC | misc, heart, horny, circle, lgbt, lied, lolice, simpcard, tonikawa, its-so-stupid, namecard, oogway, tweet, ytcomment, jail, triggered |
  | GAMES | tictactoe, hangman, trivia, topmembers |
  | TEXTMAKER | metallic, ice, snow, neon, devil, thunder, glitch, fire, blackpink |
  | ANIME | animu, hug, pat, kiss, pies, china, japan, korea, india |
  | ECONOMY | economy, balance, daily, work, deposit, withdraw, leaderboard, profile |

</details>

<details>
  <summary><strong>Menu styles</strong></summary>
  <br/>

  Owner command: `.setmenu <style>`

  | Style | Result |
  |-------|--------|
  | `button` | Location header + menu / script / owner buttons + full ASCII catalog |
  | `newmenu` | Same location-button payload as `button` |
  | `normal` | Image + ASCII catalog |
  | `box` | Boxed ASCII reply |
  | `classic` | Classic text menu |
  | `compact` | One-line command groups |

  Dynamic menu image: set `menuImage` in `bot.json` or `url` in `data/menuImage.json`. If empty, the bot uses `assets/bot_image.jpg`.

</details>

<details>
  <summary><strong>Pairing and sessions</strong></summary>
  <br/>

  1. Start the bot: `node index.js`
  2. Enter the WhatsApp number when asked, or set `global.phoneNumber` before require
  3. Enter the pairing code on that WhatsApp account
  4. Extra users can run `.pair 234xxxxxxxxxx`
  5. Extra sessions are stored under `sessions/user-<number>/` and restored on restart
  6. Owner can inspect them with `.sessions`

  Primary session stays in `./session`. Extra pair sessions never share that auth folder.

</details>

<details>
  <summary><strong>Telegram bot and web pair page</strong></summary>
  <br/>

  Both integrations are driven by `bot.json` and reload automatically. They are off by default.

  ```json
  "telegram": {
    "enabled": false,
    "token": "",
    "botName": "GODS ZEAL XMD",
    "sendImage": true,
    "forceJoin": false,
    "adminChatIds": [],
    "channels": []
  },
  "webPair": {
    "enabled": false,
    "port": 3000,
    "forceJoin": false,
    "publicUrl": ""
  }
  ```

  1. Create a bot with BotFather, copy the token into `telegram.token`, set `telegram.enabled` to `true`.
  2. Talk to your bot, send `/id`, then add that chat id to `telegram.adminChatIds` (or run `/addadmin <chatId>`).
  3. Admins add channels and groups with `/addchannel` and `/addgroup`. Both accept an `@username`, a numeric id, or a `t.me` link.
  4. Turn the forced join gate on with `/toggle join on`. Users must join every entry before `/pair` works. The bot must be an admin in each channel/group for the check to run.
  5. Set `webPair.enabled` to `true` to serve the pair page at `http://localhost:<port>`.

  Telegram commands:

  | Command | Purpose |
  |---------|---------|
  | `/start` `/help` `/menu` | Welcome card with buttons, sent with the bot image |
  | `/pair <number>` | Start an isolated session, returns the pairing code |
  | `/channels` | List channels and groups with join buttons |
  | `/id` | Show your Telegram chat id |
  | `/status` | Show session status |
  | `/addchannel` `/addgroup` `/removechannel` | Admin: manage the join list |
  | `/admins` `/addadmin` `/deladmin` | Admin: manage Telegram admins |
  | `/toggle` | Admin: flip toggles from inline buttons |

  Toggles shared by Telegram and the web page:

  | Key | Controls |
  |-----|----------|
  | `telegram` | Telegram bot on/off |
  | `join` | Telegram forced join gate |
  | `image` | Send the bot image with messages |
  | `pair` | Web pair page on/off |
  | `pairjoin` | Web forced join gate |

  The web page reads `/api/state`, pairs through `/api/pair`, and flips switches through `/api/toggle`.

</details>

---

## Deploy

<details open>
  <summary><strong>1. Fork or download</strong></summary>
  <p align="center">
    <a href="https://github.com/AiOfLautech/God-s-Zeal-Xmd/fork">
      <img src="https://img.shields.io/badge/-FORK%20REPO-00ccff?style=for-the-badge&logo=github&logoColor=white&labelColor=black" height="40" alt="Fork Badge"/>
    </a>
    <a href="https://github.com/AiOfLautech/God-s-Zeal-Xmd/archive/refs/heads/main.zip">
      <img src="https://img.shields.io/badge/-DOWNLOAD%20ZIP-00ccff?style=for-the-badge&logo=github&logoColor=white&labelColor=black" height="40" alt="Download ZIP"/>
    </a>
  </p>

  1. Fork the repo, or download the ZIP of `main`.
  2. Extract / clone so `index.js`, `package.json`, and `bot.json` stay in the project root.
  3. Upload that folder to your host or panel.
</details>

<details open>
  <summary><strong>2. Edit bot.json before start</strong></summary>
  <br/>

  Open `bot.json` in the project root. Change values only. Do not rename keys. The bot reloads this file automatically.

  | Key | What to put |
  |-----|-------------|
  | `botName` | Display name of the bot |
  | `packname` / `author` | Sticker pack name and author |
  | `creator` | Owner display name |
  | `creatorNumber` | Owner WhatsApp number, digits only |
  | `ownerNumbers` | Array of owner numbers |
  | `commandPrefix` | Command prefix, default `.` |
  | `menuStyle` | `button`, `normal`, `newmenu`, `box`, `classic`, or `compact` |
  | `botImageUrl` | Direct image URL for the menu photo |
  | `menuImage` | Same as `botImageUrl` (either field works) |
  | `newsletterUrl` | WhatsApp channel link |
  | `telegram` | Telegram link |
  | `youtubeUrl` | YouTube link |

  Bot image URL example:

  ```json
  "menuImage": "https://raw.githubusercontent.com/AiOfLautech/God-s-Zeal-Xmd/main/assets/bot_image.jpg",
  "botImageUrl": "https://raw.githubusercontent.com/AiOfLautech/God-s-Zeal-Xmd/main/assets/bot_image.jpg"
  ```

  Replace those URLs with your own direct jpg / png link. If both are empty, the bot uses `assets/bot_image.jpg`.
</details>

<details>
  <summary><strong>3. Install and pair</strong></summary>
  <br/>

  ```bash
  npm install
  node index.js
  ```

  1. Enter your WhatsApp number when asked (country code, no plus).
  2. Open WhatsApp, Linked Devices, then enter the pairing code.
  3. Do not upload a session ID file. Pairing is enough.
  4. Extra users can later run `.pair 234xxxxxxxxxx` for an isolated session.
</details>

<details>
  <summary><strong>4. Panel hosts</strong></summary>
  <p align="center">
    <a href="https://bot-hosting.net/?aff=1271743046865915927">
      <img src="https://img.shields.io/badge/-BOTHOSTING%20PANEL-D6B7D6?style=for-the-badge&logo=serverless&logoColor=black&labelColor=white" height="40" alt="Bot Hosting Panel"/>
    </a>
    <a href="https://katabump.com">
      <img src="https://img.shields.io/badge/-KATABUMP%20PANEL-00D9FF?style=for-the-badge&logo=cloud&logoColor=white&labelColor=black" height="40" alt="Katabump Panel"/>
    </a>
  </p>
</details>

---

## Setup

```bash
git clone https://github.com/AiOfLautech/God-s-Zeal-Xmd.git
cd God-s-Zeal-Xmd
npm install
node index.js
```

Edit `bot.json` first (name, owners, prefix, `botImageUrl`). The file reloads without restarting for most identity fields.

---

## Features

| Group | Media | AI / Fun | Owner |
|-------|-------|----------|-------|
| Tag, mute, warn, antilink | Sticker, play, tiktok, IG, FB | GPT, Gemini, Imagine, Sora | setprefix, setmenu, sessions |
| Welcome / goodbye | Remini, removebg, blur | Games, textmaker, misc canvas | autostatus, anticall, sudo |
| gcstatus group stories | Pair extra numbers | Economy, anime, pies | Isolated multi-session |

---

## Links

<div align="center">
  <a href="https://t.me/aitoolshub01">
    <img src="https://img.shields.io/badge/-TELEGRAM-0088cc?style=for-the-badge&logo=telegram&logoColor=white" height="35" alt="Telegram"/>
  </a>
  <a href="https://whatsapp.com/channel/0029VaXKAEoKmCPS6Jz7sw0N">
    <img src="https://img.shields.io/badge/-WHATSAPP%20CHANNEL-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" height="35" alt="WhatsApp"/>
  </a>
  <a href="https://youtube.com/@Godszealtech">
    <img src="https://img.shields.io/badge/-YOUTUBE-FF0000?style=for-the-badge&logo=youtube&logoColor=white" height="35" alt="YouTube"/>
  </a>
</div>

---

### Legal

This is an unofficial WhatsApp bot. Automated clients can violate WhatsApp Terms of Service. Use at your own risk. Do not spam or run illegal activity.

MIT (c) Godszeal

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=00ff66&height=90&section=footer" />
  <br/>
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=800&color=33FF00&center=true&vCenter=true&width=600&lines=GODSZEAL+XMD+is+active;Pair+your+number+and+run+.menu" alt="Footer typing"/>
</div>
