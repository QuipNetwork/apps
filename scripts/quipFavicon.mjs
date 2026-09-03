// Copyright 2017-2026 @polkadot/apps authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Regenerates the Quip favicon set from the square brand mark.
//
// Reads packages/apps-config/src/ui/logos/nodes/quip.svg (produced by
// scripts/quipBrandMark.mjs) and emits into packages/apps/public/:
//
//   favicon.svg           the mark, copied verbatim
//   favicon.ico           16 + 32 + 48, PNG-in-ICO
//   apple-touch-icon.png  180
//
// This is a REGENERATION TOOL, not a build step. The outputs are committed, so
// the Flux build needs no rasteriser — matching how subscan.quip.network
// vendors its pre-rendered brand PNGs.
//
// There is no ImageMagick, librsvg, Inkscape, PIL, cairosvg or sharp on the
// team's boxes, so rasterising goes through headless Chrome over CDP. Chrome's
// `--screenshot` flag hangs in this environment; driving the DevTools protocol
// directly is the route that works.
//
//   node scripts/quipFavicon.mjs
//   CHROME=/path/to/chrome node scripts/quipFavicon.mjs

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SRC = path.join('packages', 'apps-config', 'src', 'ui', 'logos', 'nodes', 'quip.svg');
const PUBLIC = path.join('packages', 'apps', 'public');
const ICO_SIZES = [16, 32, 48];
const APPLE_SIZE = 180;
const PORT = 9333;

const CANDIDATES = [
  process.env.CHROME,
  path.join(os.homedir(), '.cache/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-linux64/chrome-headless-shell'),
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
].filter(Boolean);

/**
 * @param {string} message
 * @returns {never}
 */
function die (message) {
  console.error(`[quipFavicon] ERROR: ${message}`);
  process.exit(1);
}

const chrome = CANDIDATES.find((c) => fs.existsSync(c));

if (!chrome) {
  die(`no Chrome found. Tried:\n  ${CANDIDATES.join('\n  ')}\nSet CHROME=/path/to/chrome.`);
}

if (!fs.existsSync(SRC)) {
  die(`${SRC} not found — run \`node scripts/quipBrandMark.mjs\` first.`);
}

const svg = fs.readFileSync(SRC, 'utf8');

if (!svg.includes('viewBox="0 0 197.033 197.033"')) {
  die(`${SRC} is not the square mark (expected viewBox "0 0 197.033 197.033")`);
}

/** Render the mark at `size`x`size` on a transparent ground.
 * @param {(method: string, params?: object) => Promise<any>} send
 * @param {number} size
 * @returns {Promise<Buffer>}
 */
async function render (send, size) {
  const html = `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:transparent}
    img{display:block;width:${size}px;height:${size}px}
  </style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">`;

  await send('Emulation.setDeviceMetricsOverride', { deviceScaleFactor: 1, height: size, mobile: false, width: size });
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { a: 0, b: 0, g: 0, r: 0 } });
  await send('Page.navigate', { url: `data:text/html;base64,${Buffer.from(html).toString('base64')}` });

  // data: URLs settle synchronously; give the raster a beat regardless.
  await new Promise((resolve) => setTimeout(resolve, 250));

  const shot = await send('Page.captureScreenshot', { captureBeyondViewport: false, format: 'png' });
  const png = Buffer.from(shot.data, 'base64');

  if (png.length < 100 || png.subarray(1, 4).toString() !== 'PNG') {
    die(`render at ${size}px did not produce a PNG`);
  }

  return png;
}

/** Pack PNGs into a Vista-style PNG-in-ICO container.
 * @param {Buffer[]} pngs
 * @param {number[]} sizes
 * @returns {Buffer}
 */
function buildIco (pngs, sizes) {
  const header = Buffer.alloc(6);

  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + (16 * pngs.length);
  const entries = pngs.map((png, i) => {
    const e = Buffer.alloc(16);

    e.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 0); // width
    e.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;

    return e;
  });

  return Buffer.concat([header, ...entries, ...pngs]);
}

// -- drive chrome ------------------------------------------------------------

const proc = spawn(chrome, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  '--disable-dev-shm-usage',
  `--remote-debugging-port=${PORT}`,
  'about:blank'
], { stdio: 'ignore' });

let ws = null;

process.on('exit', () => {
  try {
    ws?.close();
  } catch {
    // already gone
  }

  proc.kill();
});

/** @returns {Promise<string>} */
async function browserWs () {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);

      return (await res.json()).webSocketDebuggerUrl;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return die('Chrome did not expose a DevTools endpoint within 10s');
}

const endpoint = await browserWs();

ws = new WebSocket(endpoint);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = () => reject(new Error('devtools websocket failed'));
});

let nextId = 0;
const pending = new Map();

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  const entry = pending.get(msg.id);

  if (entry) {
    pending.delete(msg.id);
    msg.error ? entry.reject(new Error(msg.error.message)) : entry.resolve(msg.result);
  }
};

// Held in an object because `send` is defined before we have attached, and
// every later call has to carry the session id.
/** @type {{ id?: string }} */
const session = {};

/** @param {string} method @param {object} [params] */
function send (method, params = {}) {
  const id = ++nextId;

  return new Promise((resolve, reject) => {
    pending.set(id, { reject, resolve });
    ws.send(JSON.stringify(session.id ? { id, method, params, sessionId: session.id } : { id, method, params }));
  });
}

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { flatten: true, targetId });

session.id = sessionId;

await send('Page.enable');

const icoPngs = [];

for (const size of ICO_SIZES) {
  icoPngs.push(await render(send, size));
}

const apple = await render(send, APPLE_SIZE);

fs.writeFileSync(path.join(PUBLIC, 'favicon.svg'), svg);
fs.writeFileSync(path.join(PUBLIC, 'apple-touch-icon.png'), apple);
fs.writeFileSync(path.join(PUBLIC, 'favicon.ico'), buildIco(icoPngs, ICO_SIZES));

console.log(`[quipFavicon] favicon.svg           ${Buffer.byteLength(svg)} bytes`);
console.log(`[quipFavicon] favicon.ico           ${fs.statSync(path.join(PUBLIC, 'favicon.ico')).size} bytes (${ICO_SIZES.join(' + ')})`);
console.log(`[quipFavicon] apple-touch-icon.png  ${apple.length} bytes (${APPLE_SIZE}px)`);

process.exit(0);
