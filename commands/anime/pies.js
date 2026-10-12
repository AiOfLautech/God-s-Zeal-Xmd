const fetch = require('node-fetch');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

const BASE = 'https://api.shizo.top/pies';
const VALID_COUNTRIES = ['india','malaysia', 'thailand', 'china', 'indonesia', 'japan', 'korea', 'vietnam'];

async function fetchPiesImageBuffer(country) {
	const url = `${BASE}/${country}?apikey=shizo`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const contentType = res.headers.get('content-type') || '';
	if (!contentType.includes('image')) throw new Error('API did not return an image');
	return res.buffer();
}

async function piesCommand(sock, chatId, message, args) {
	const sub = (args && args[0] ? args[0] : '').toLowerCase();
	if (!sub) {
		await sendStyled(sock, chatId, message, {
			title: 'PIES',
			lines: [`Usage ☇ ${getPrefix()}pies <country>`, `Countries ☇ ${VALID_COUNTRIES.join(', ')}`]
		});
		return;
	}
	if (!VALID_COUNTRIES.includes(sub)) {
		await sendStyled(sock, chatId, message, {
			title: 'PIES',
			lines: [`Unsupported country: ${sub}`, `Try one of: ${VALID_COUNTRIES.join(', ')}`]
		});
		return;
	}
	try {
		const imageBuffer = await fetchPiesImageBuffer(sub);
		await sock.sendMessage(
			chatId,
			{ image: imageBuffer, caption: `pies: ${sub}` },
			{ quoted: message }
		);
	} catch (err) {
		console.error('Error in pies command:', err);
		await sendStyled(sock, chatId, message, {
			title: 'PIES',
			lines: ['Failed to fetch image. Please try again.']
		});
	}
}

async function piesAlias(sock, chatId, message, country) {
	try {
		const imageBuffer = await fetchPiesImageBuffer(country);
		await sock.sendMessage(
			chatId,
			{ image: imageBuffer, caption: `pies: ${country}` },
			{ quoted: message }
		);
	} catch (err) {
		console.error(`Error in pies alias (${country}) command:`, err);
		await sendStyled(sock, chatId, message, {
			title: 'PIES',
			lines: ['Failed to fetch image. Please try again.']
		});
	}
}

module.exports = { piesCommand, piesAlias, VALID_COUNTRIES };
