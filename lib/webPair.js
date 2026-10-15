const http = require('http');
const chalk = require('chalk');
const { getConfig } = require('./botConfig');
const { pairAndStart, normalizePhone, listSessions } = require('./sessionManager');
const { KEYS: TOGGLE_KEYS, getToggleState, applyToggle } = require('./toggles');

let server = null;
let activePort = 0;

function log(message, color = 'magenta') {
    console.log(chalk[color](`[webpair] ${message}`));
}

function pageHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>GODS ZEAL XMD - Pair</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: radial-gradient(1200px 600px at 20% -10%, #1b1030, #0b0714 60%); color: #e9e6f2; min-height: 100vh; padding: 24px; }
  .wrap { max-width: 720px; margin: 0 auto; }
  header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
  header img { width: 64px; height: 64px; border-radius: 14px; object-fit: cover; border: 2px solid #6d28d9; }
  h1 { font-size: 22px; margin: 0; }
  .muted { color: #a79fc0; font-size: 13px; }
  .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px; margin-bottom: 16px; }
  label { display: block; font-size: 13px; margin-bottom: 6px; color: #c9c2e0; }
  input[type=text] { width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.14); background: #140f22; color: #fff; font-size: 15px; }
  button { cursor: pointer; border: 0; border-radius: 10px; padding: 12px 16px; font-size: 15px; font-weight: 600; background: linear-gradient(135deg,#7c3aed,#db2777); color: #fff; }
  button:disabled { opacity: .5; cursor: not-allowed; }
  .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .toggle { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); font-size: 14px; }
  .switch { width: 46px; height: 26px; border-radius: 999px; background: #3b3550; position: relative; transition: .2s; flex: 0 0 auto; }
  .switch.on { background: #7c3aed; }
  .switch::after { content: ""; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: .2s; }
  .switch.on::after { transform: translateX(20px); }
  .code { font-family: ui-monospace, Menlo, monospace; font-size: 26px; letter-spacing: 3px; color: #6ee7b7; margin: 8px 0; }
  .out { white-space: pre-wrap; font-size: 14px; color: #cfc8e6; }
  a.join { color: #a78bfa; display: inline-block; margin-right: 12px; margin-top: 6px; font-size: 14px; }
  .badge { font-size: 12px; padding: 3px 9px; border-radius: 999px; background: rgba(124,58,237,.25); border: 1px solid rgba(124,58,237,.5); }
  .hidden { display: none; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <img id="logo" alt="bot" />
    <div>
      <h1 id="botname">GODS ZEAL XMD</h1>
      <div class="muted">WhatsApp pairing portal <span class="badge" id="ver"></span></div>
    </div>
  </header>

  <div class="card">
    <label for="number">WhatsApp number (country code, digits only)</label>
    <div class="row">
      <input id="number" type="text" inputmode="numeric" placeholder="234xxxxxxxxxx" />
      <button id="pairBtn">Pair</button>
    </div>
    <div id="gate" class="hidden" style="margin-top:14px">
      <div class="muted">Join the channels/groups below, then tick the box to continue.</div>
      <div id="joins"></div>
      <label class="toggle" style="margin-top:10px">
        <span>I have joined all channels/groups</span>
        <input type="checkbox" id="joined" />
      </label>
    </div>
    <div id="result" class="out" style="margin-top:14px"></div>
  </div>

  <div class="card">
    <div class="row" style="justify-content:space-between;margin-bottom:12px">
      <strong>Toggles</strong>
      <span class="muted">tap to switch on/off</span>
    </div>
    <div class="toggles" id="toggles"></div>
  </div>

  <div class="card">
    <div class="row" style="justify-content:space-between;margin-bottom:10px">
      <strong>Sessions</strong>
      <button id="refresh" style="background:rgba(255,255,255,.08);padding:8px 12px;font-weight:500">Refresh</button>
    </div>
    <div id="sessions" class="out">Loading...</div>
  </div>
</div>
<script>
const labels = { telegram: 'Telegram bot', join: 'Telegram force join', image: 'Send bot image', pair: 'Web pair page', pairjoin: 'Web force join' };
let state = {};

async function api(path, options) {
  const res = await fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, options));
  return res.json();
}

function renderToggles() {
  const box = document.getElementById('toggles');
  box.innerHTML = '';
  for (const key of Object.keys(labels)) {
    const on = !!state.toggles[key];
    const el = document.createElement('div');
    el.className = 'toggle';
    el.innerHTML = '<span>' + labels[key] + '</span><span class="switch ' + (on ? 'on' : '') + '"></span>';
    el.onclick = async () => {
      await api('/api/toggle', { method: 'POST', body: JSON.stringify({ key, value: !on }) });
      await loadState();
    };
    box.appendChild(el);
  }
}

function renderGate() {
  const gate = document.getElementById('gate');
  const joins = document.getElementById('joins');
  const need = state.forceJoin && state.channels.length > 0;
  gate.classList.toggle('hidden', !need);
  joins.innerHTML = '';
  if (!need) return;
  for (const ch of state.channels) {
    if (!ch.url) continue;
    const a = document.createElement('a');
    a.className = 'join';
    a.href = ch.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Join ' + ch.title;
    joins.appendChild(a);
  }
}

function renderSessions() {
  const box = document.getElementById('sessions');
  if (!state.sessions || !state.sessions.length) { box.textContent = 'No sessions yet.'; return; }
  box.textContent = state.sessions.map(s => (s.phone || s.id) + '  -  ' + s.status).join('\\n');
}

async function loadState() {
  state = await api('/api/state');
  document.getElementById('botname').textContent = state.botName || 'GODS ZEAL XMD';
  document.getElementById('ver').textContent = 'v' + (state.version || '');
  document.getElementById('logo').src = state.image || '';
  renderToggles();
  renderGate();
  renderSessions();
}

document.getElementById('pairBtn').onclick = async () => {
  const number = document.getElementById('number').value.trim();
  const out = document.getElementById('result');
  if (!number) { out.textContent = 'Enter a number first.'; return; }
  const joined = document.getElementById('joined').checked;
  out.textContent = 'Starting pairing session...';
  const data = await api('/api/pair', { method: 'POST', body: JSON.stringify({ number, joined }) });
  if (data.needJoin) {
    renderGate();
    out.textContent = 'Please join all channels/groups and tick the box.';
    return;
  }
  if (!data.ok) { out.textContent = data.error || 'Pairing failed.'; return; }
  if (data.code) {
    out.innerHTML = 'Pairing code for ' + data.number + ':<div class="code">' + data.code + '</div>WhatsApp &gt; Linked Devices &gt; Link with phone number';
  } else if (data.alreadyConnected) {
    out.textContent = data.number + ' is already connected (' + data.sessionId + ').';
  } else {
    out.textContent = data.number + ' session started (' + data.sessionId + ').';
  }
  await loadState();
};

document.getElementById('refresh').onclick = async () => { await loadState(); };
loadState();
setInterval(loadState, 15000);
</script>
</body>
</html>`;
}

function sendJson(res, status, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    });
    res.end(body);
}

function sendHtml(res, status, html) {
    res.writeHead(status, {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(html);
}

function readBody(req) {
    return new Promise((resolve) => {
        let raw = '';
        req.on('data', (chunk) => {
            raw += chunk;
            if (raw.length > 1e6) req.destroy();
        });
        req.on('end', () => {
            try {
                resolve(raw ? JSON.parse(raw) : {});
            } catch {
                resolve({});
            }
        });
        req.on('error', () => resolve({}));
    });
}

function imageUrl() {
    const cfg = getConfig();
    return String(cfg.botImageUrl || cfg.menuImage || '').trim();
}

function publicState() {
    const cfg = getConfig();
    const tg = cfg.telegram || {};
    const channels = (tg.channels || []).map((channel) => ({
        id: channel.id,
        title: channel.title,
        type: channel.type,
        url: channel.url || (String(channel.id).startsWith('@') ? `https://t.me/${String(channel.id).slice(1)}` : '')
    }));
    return {
        botName: cfg.botName,
        version: cfg.version,
        image: imageUrl(),
        enabled: Boolean(cfg.webPair?.enabled),
        forceJoin: Boolean(cfg.webPair?.forceJoin),
        channels,
        toggles: getToggleState(),
        sessions: listSessions()
    };
}

async function handlePair(req, res) {
    const body = await readBody(req);
    const number = normalizePhone(body.number);
    const cfg = getConfig();
    if (!number || number.length < 6) {
        return sendJson(res, 400, { ok: false, error: 'Invalid number. Use full international format without + or spaces.' });
    }
    if (cfg.webPair?.forceJoin && (cfg.telegram?.channels || []).length && body.joined !== true) {
        return sendJson(res, 200, { ok: false, needJoin: true });
    }
    try {
        const paired = await pairAndStart(number, {
            requestedBy: 'webpair',
            chatId: `web:${req.socket.remoteAddress || 'unknown'}`
        });
        if (paired.alreadyConnected) {
            return sendJson(res, 200, {
                ok: true,
                number,
                alreadyConnected: true,
                sessionId: paired.session?.id
            });
        }
        if (paired.alreadyRegistered) {
            return sendJson(res, 200, {
                ok: true,
                number,
                alreadyRegistered: true,
                sessionId: paired.sessionId
            });
        }
        return sendJson(res, 200, {
            ok: true,
            number,
            code: paired.code,
            sessionId: paired.sessionId
        });
    } catch (error) {
        log(`pair failed: ${error.message}`, 'red');
        return sendJson(res, 500, { ok: false, error: String(error.message || 'Pairing failed') });
    }
}

async function handleToggle(req, res) {
    const body = await readBody(req);
    const key = String(body.key || '').toLowerCase();
    if (!TOGGLE_KEYS.includes(key)) {
        return sendJson(res, 400, { ok: false, error: 'Unknown toggle key' });
    }
    const value = typeof body.value === 'boolean' ? body.value : undefined;
    const target = applyToggle(key, value);
    return sendJson(res, 200, { ok: true, key, value: target, toggles: getToggleState() });
}

function handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        });
        return res.end();
    }
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/pair')) {
        return sendHtml(res, 200, pageHtml());
    }
    if (req.method === 'GET' && url.pathname === '/api/state') {
        return sendJson(res, 200, publicState());
    }
    if (req.method === 'GET' && url.pathname === '/api/status') {
        return sendJson(res, 200, { ok: true, sessions: listSessions() });
    }
    if (req.method === 'POST' && url.pathname === '/api/pair') {
        return handlePair(req, res).catch((error) => sendJson(res, 500, { ok: false, error: error.message }));
    }
    if (req.method === 'POST' && url.pathname === '/api/toggle') {
        return handleToggle(req, res).catch((error) => sendJson(res, 500, { ok: false, error: error.message }));
    }
    return sendJson(res, 404, { ok: false, error: 'Not found' });
}

function stopWebPair() {
    if (server) {
        try { server.close(); } catch {}
        server = null;
        activePort = 0;
        log('stopped', 'yellow');
    }
}

function startWebPair() {
    const cfg = getConfig();
    const port = Number(cfg.webPair?.port || 3000);
    if (server && activePort === port) return server;

    stopWebPair();
    server = http.createServer((req, res) => {
        try {
            handleRequest(req, res);
        } catch (error) {
            log(`request error: ${error.message}`, 'red');
            sendJson(res, 500, { ok: false, error: 'Server error' });
        }
    });
    server.on('error', (error) => {
        log(`server error: ${error.message}`, 'red');
        server = null;
        activePort = 0;
    });
    server.listen(port, () => {
        activePort = port;
        log(`pair page live on http://localhost:${port}`, 'green');
    });
    return server;
}

function syncWebPair() {
    const cfg = getConfig();
    if (cfg.webPair?.enabled) return startWebPair();
    if (server) stopWebPair();
    return null;
}

module.exports = {
    startWebPair,
    stopWebPair,
    syncWebPair,
    publicState
};
