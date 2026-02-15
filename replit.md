# replit.md

## Overview

GODSZEAL XMD is a multi-device WhatsApp bot built on Node.js using the Baileys library (`@whiskeysockets/baileys`). It provides 100+ commands for group management, media downloading, AI chat, games, sticker creation, and various utility functions. The bot connects to WhatsApp via the multi-device protocol and operates as an automated assistant in both private chats and group conversations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Entry Point & Connection
- **`index.js`** — Main entry point. Establishes the WhatsApp WebSocket connection using `@whiskeysockets/baileys` with multi-file auth state. Handles connection lifecycle (reconnection on disconnect via `@hapi/boom` disconnect reasons), QR code pairing, and event routing. Also handles auto-follow for newsletter channels and auto-join for group invite links.
- **`main.js`** — Core message handler. Receives incoming messages and routes them to appropriate command handlers. Includes a custom temp directory system (redirects `TMPDIR` to `./temp`) with auto-cleanup every 3 hours to prevent disk overflow on hosted panels.

### Configuration
- **`settings.js`** — Bot identity settings: bot name, owner number, owner name, command mode (public/private), Giphy API key, version info, and update URL. This is the primary config file users should modify.
- **`config.js`** — External API endpoints and API keys for various third-party services (xteam, lolhuman, neoxr, etc.). Uses `dotenv` for environment variable support. The `WARN_COUNT` setting controls warning thresholds.
- **Environment Variables** — `SESSION_ID` is required for WhatsApp session authentication. `.env` file support via `dotenv`.

### Command Architecture
- All commands live in the `commands/` directory as individual modules.
- Each command exports an async function that receives `(sock, chatId, message, ...args)`.
- Commands are imported and registered in `main.js`.
- Command prefix is `.` (dot).

### Command Categories
1. **Group Management** — `tagall`, `kick`, `promote`, `demote`, `mute`, `unmute`, `hidetag`, `ban`, `antilink`, `antitag`, `antibadword`, `groupinfo`, `groupmanage`, `delete`, `clear`
2. **AI & Chat** — `ai` (GPT/Gemini), `Godszeal` (custom AI), `chatbot` (conversational AI with memory)
3. **Media** — `sticker`, `attp` (animated text-to-sticker), `emojimix`, `imagine` (AI image generation), `gif`, `img-blur`
4. **Downloaders** — `instagram`, `facebook`, `movie`, `igs` (Instagram story)
5. **Entertainment** — `joke`, `fact`, `meme`, `dare`, `flirt`, `compliment`, `insult`, `eightball`, `hangman`, `lyrics`, `anime`
6. **Utilities** — `owner`, `dev`, `help`, `alive`, `github`, `news`, `character`, `contact`, `api` (API maker)
7. **Bot Settings** — `autotyping`, `autoread`, `autostatus`, `antidelete`, `anticall`, `mention`, `clearsession`, `cleartmp`
8. **Welcome/Goodbye** — `goodbye` (group leave messages via `lib/welcome`)

### Library Layer (`lib/` directory)
- **`lib/isAdmin.js`** — Checks if a user/bot is a group admin
- **`lib/isOwner.js`** — Checks if sender is bot owner or sudo user
- **`lib/isBanned.js`** — Ban list management
- **`lib/index.js`** — Core utilities including `isSudo`, antilink/antitag/goodbye configuration persistence
- **`lib/myfunc.js`** — Shared utility functions: `smsg`, `isUrl`, `getBuffer`, `fetchBuffer`, `getSizeMedia`, `sleep`, `reSize`
- **`lib/exif.js`** — Sticker metadata (EXIF) writing for WebP images/videos
- **`lib/antibadword.js`** — Bad word filter logic
- **`lib/welcome.js`** — Welcome/goodbye message handling
- **`lib/antilink.js`** — Link detection and action logic
- **`lib/messageConfig.js`** — Shared message formatting (channel info context)
- **`lib/lightweight_store.js`** — Lightweight message store for features like delete tracking
- **`lib/uploadImage.js`** — Image upload utility for canvas/overlay APIs

### Data Storage
- **File-based JSON storage** in `./data/` directory for persistent settings:
  - `anticall.json`, `antidelete.json`, `autoread.json`, `autotyping.json`, `autoStatus.json`, `mention.json`, `userGroupData.json`
- **In-memory stores** — `Map` objects for temporary data like hangman games, chat history, message stores for anti-delete
- **Session files** — Stored in `./session/` directory for WhatsApp authentication persistence
- **No database** — All persistence is file-based JSON. No SQL or NoSQL database is used.

### Media Processing
- **FFmpeg** (`fluent-ffmpeg`) — Video/image conversion, sticker creation, animated stickers
- **Sharp** — Image manipulation (blur, resize)
- **node-webpmux** — WebP sticker metadata injection
- **Jimp** — Image processing

### Design Decisions
- **Why Baileys?** — Provides direct WhatsApp Web multi-device protocol access without requiring a separate server or official API access. Chosen over alternatives for its open-source nature and active community.
- **Why file-based storage?** — Simplicity for a bot that doesn't need complex queries. Each feature stores its config independently. The tradeoff is no concurrent write safety, but acceptable for single-instance bots.
- **Why individual command files?** — Modularity. Each command is self-contained, making it easy to add/remove features without touching core logic.
- **Custom temp directory** — Hosted panels often have limited `/tmp` space. The bot redirects temp storage to `./temp` with periodic cleanup to prevent ENOSPC errors.

### Important Runtime Notes
- The bot runs as a single Node.js process (`node index.js`)
- Optimized start available: `node --max-old-space-size=512 --optimize-for-size --gc-interval=100 index.js`
- Session cleanup script: `npm run reset-session`
- Temp cleanup script: `npm run cleanup`

## External Dependencies

### Core Framework
- **@whiskeysockets/baileys** (v7.0.0-rc.9) — WhatsApp Web multi-device protocol implementation
- **@hapi/boom** — HTTP-friendly error objects for connection handling
- **pino** — Logging framework used by Baileys

### Media Processing
- **fluent-ffmpeg** — FFmpeg wrapper for video/audio processing (requires system FFmpeg installed)
- **sharp** — High-performance image processing
- **node-webpmux** — WebP image manipulation for sticker metadata
- **jimp** — JavaScript image manipulation
- **file-type** — File type detection from buffers

### External APIs Used
- **Giphy API** — GIF search (key in settings.js)
- **NewsAPI** — News headlines (key hardcoded in news.js)
- **Various AI APIs** — GPT via `api.dreaded.site`, Gemini via `vapis.my.id`
- **Shizo API** — Memes, dares, flirt messages, image generation
- **Some Random API** — Anime content, canvas overlays
- **Tenor API** — Emoji kitchen for emoji mixing
- **Instagram/Facebook scrapers** — `ruhend-scraper` package for media downloading
- **YouTube** — `yt-search` for search, `ytdl-core` for downloads
- **Lyrics API** — `api.giftedtech.web.id` for song lyrics
- **Useless Facts API** — Random facts
- **icanhazdadjoke** — Dad jokes

### Key NPM Packages
- **axios** / **node-fetch** — HTTP clients
- **cheerio** — HTML parsing/scraping
- **moment-timezone** — Date/time formatting
- **dotenv** — Environment variable loading
- **chalk** — Terminal color output
- **awesome-phonenumber** / **libphonenumber-js** — Phone number parsing
- **node-cache** — In-memory caching
- **qrcode** / **qrcode-terminal** — QR code generation for pairing
- **gtts** — Google Text-to-Speech
- **jsdom** — DOM parsing
- **fs-extra** — Enhanced file system operations

### System Requirements
- **Node.js** — Runtime (version compatible with ES2020+)
- **FFmpeg** — Must be installed on the system for media processing (stickers, video conversion)