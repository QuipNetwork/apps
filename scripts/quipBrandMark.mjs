// Copyright 2017-2026 @polkadot/apps authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Regenerates the Quip square brand mark used as the chain logo and favicon.
//
// The source is quip-brand's `assets/logo-mark.svg` — a 663x198 lockup whose
// FIRST element is a 197.033-square rounded tile and whose SECOND is the one
// white knocked-out butterfly. The remaining 11 black paths are the wordmark.
// Cropping to the leading square gives us the mark on its own.
//
// The artwork is COPIED, never redrawn: the <rect> and the butterfly's `d` are
// emitted byte-for-byte. Only the viewBox changes.
//
// Every structural assumption is asserted, so if quip-brand restructures the
// lockup this fails loudly instead of silently emitting a wrong mark.
//
//   node scripts/quipBrandMark.mjs
//   QUIP_BRAND_DIR=/path/to/quip-brand node scripts/quipBrandMark.mjs
//
// quip-brand is a separate private repo, so this is a regeneration tool rather
// than a build step — the emitted quip.svg is committed. Re-run it when the
// brand moves, then re-run `yarn build:images`.

import fs from 'node:fs';
import path from 'node:path';

const BRAND_DIR = process.env.QUIP_BRAND_DIR || path.join('..', 'quip-brand');
const SRC = path.join(BRAND_DIR, 'assets', 'logo-mark.svg');
const DEST = path.join('packages', 'apps-config', 'src', 'ui', 'logos', 'nodes', 'quip.svg');

// The tile is square and sits at the origin; these are the values we assert on.
const SIDE = '197.033';

/**
 * @param {string} message
 * @returns {never}
 */
function die (message) {
  console.error(`[quipBrandMark] ERROR: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(SRC)) {
  die(`${SRC} not found. Clone quip-brand next to this repo, or set QUIP_BRAND_DIR.`);
}

const src = fs.readFileSync(SRC, 'utf8');

// -- assert the source still looks like the lockup we cropped from ------------

if (!/<svg\b[^>]*viewBox="0 0 663 198"/.test(src)) {
  die('source viewBox is no longer "0 0 663 198" — re-verify the crop against quip-brand');
}

const whiteFills = src.match(/fill="white"/g) || [];

if (whiteFills.length !== 1) {
  die(`expected exactly 1 fill="white" path (the butterfly), found ${whiteFills.length} — the crop is ambiguous now`);
}

const rect = src.match(new RegExp(`<rect\\b[^>]*\\bwidth="${SIDE}"[^>]*>(?:</rect>)?`));

if (!rect) {
  die(`the ${SIDE}-square tile <rect> was not found — re-verify the crop against quip-brand`);
}

const butterfly = src.match(/<path\b[^>]*\bfill="white"[^>]*>(?:<\/path>)?/);

if (!butterfly) {
  die('the white butterfly <path> was not found — re-verify the crop against quip-brand');
}

if (butterfly.index < rect.index) {
  die('element order changed: the butterfly now precedes the tile');
}

// The butterfly must sit inside the tile, or the crop would clip real artwork.
const d = butterfly[0].match(/\bd="([^"]*)"/);

if (!d) {
  die('the butterfly <path> has no `d` attribute');
}

const coords = (d[1].match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
const side = Number(SIDE);

for (const n of coords) {
  if (n < 0 || n > side) {
    die(`butterfly coordinate ${n} falls outside the 0..${SIDE} tile — the crop would clip artwork`);
  }
}

// -- emit --------------------------------------------------------------------

const out = `<svg width="${SIDE}" height="${SIDE}" viewBox="0 0 ${SIDE} ${SIDE}" fill="none" xmlns="http://www.w3.org/2000/svg">
${rect[0]}
${butterfly[0]}
</svg>
`;

// imgConvert.mjs refuses anything larger than this.
const MAX_SIZE = 48 * 1024;
const size = Buffer.byteLength(out);

if (size >= MAX_SIZE) {
  die(`emitted mark is ${size} bytes, over imgConvert's ${MAX_SIZE} limit`);
}

fs.writeFileSync(DEST, out);

console.log(`[quipBrandMark] wrote ${DEST} (${size} bytes) from ${SRC}`);
