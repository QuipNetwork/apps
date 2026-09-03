# @polkadot/apps

A Portal into the Polkadot and Substrate networks. Provides a view and interaction layer from a browser.

This can be accessed as a hosted application via https://polkadot.js.org/apps/ or you can access the IPFS hosted version via https://polkadot.js.org/apps/ipfs (via hash) or https://dotapps.io (via ipns) to explore any of the supported Polkadot and Substrate chains.

If you run one or more IPFS node(s), pinning the UI (which only gets updated on releases) will make it faster for you and others. You can find details about that below in the IPFS chapter below.

**Important** If you are a chain developer and would like to add support for your chain to the UI, all the local configuration (API types, settings, logos) can be customized in [the apps-config package](packages/apps-config#README.md), complete with instructions of what goes where.


## Overview

The repo is split into a number of packages, each representing an application.


## Development

Contributions are welcome!

To start off, this repo (along with others in the [@polkadot](https://github.com/polkadot-js/) family) uses yarn workspaces to organize the code. As such, after cloning dependencies _should_ be installed via `yarn`, not via npm, the latter will result in broken dependencies.

To get started -

1. Clone the repo locally, via `git clone https://github.com/polkadot-js/apps <optional local path>`
2. Ensure that you have a recent LTS version of Node.js, for development purposes [Node >= 16](https://nodejs.org/en/) is recommended.
3. Ensure that you have a recent version of Yarn, for development purposes [Yarn >= 1.22](https://yarnpkg.com/docs/install) is required.
4. Install the dependencies by running `yarn install --frozen-lockfile`
5. Ready! Now you can launch the UI (assuming you have a local Polkadot Node running), via `yarn run start`
6. Access the UI via [http://localhost:3000](http://localhost:3000)

### Quip extrinsic decoding

This fork carries a Yarn patch for `@polkadot/types` so Apps can decode Quip
blocks that contain V5 bare inherents and V4 signed transactions. Quip uses a
custom hybrid transaction signature envelope instead of the standard
`MultiSignature`. The upstream decoder previously inferred signed-ness from
whether the decoded signature object looked empty; that heuristic breaks for a
struct-like custom signature because a default struct can look non-empty even
when the extrinsic wire byte marks the item as bare/unsigned.

The patch makes the decoder trust the explicit `isSigned` flag derived from the
extrinsic version/type byte. This preserves compatibility with valid SDK-format
blocks such as `0x05` bare V5 inherents followed by `0x84` signed V4
transactions.

### Quip branding (QUI-1276)

Minimal only: colour, logo, favicon, page title. No redesign, no layout change.

It goes through the one extension point `apps-config` documents (see
[packages/apps-config/README.md](packages/apps-config/README.md), "Endpoints"):
a chain entry carrying `ui.color` and `ui.logo`. `useEndpoint` matches the
connected URL against that entry's providers, so the branding follows whichever
bootnode the user is on. Nothing in `react-components/src/styles` or
`public/index.html`'s CSS variables is touched — those are undocumented
internals.

| what | where |
|---|---|
| Chain entry | `packages/apps-config/src/endpoints/quip.ts`, its own file and its own picker group, so upstream rebases conflict only in `endpoints/index.ts` |
| Colour | `ui.color: '#09090b'` — zinc-950, `quip-brand@b2ae38b` `tokens/core.css` |
| Coral | `colorLink` in `react-components/src/styles/theme.ts` → `#c93a3f` (`--coral-text`) |
| Logo | `packages/apps-config/src/ui/logos/nodes/quip.svg`, regenerate with `node scripts/quipBrandMark.mjs` then `yarn build:images` |
| Favicons | `packages/apps/public/favicon.{svg,ico}` + `apple-touch-icon.png`, regenerate with `node scripts/quipFavicon.mjs` |
| Title | `Quip Network — Aglais Portal`, in **both** `webpack.config.cjs` and `webpack.serve.cjs` |
| Default endpoint | `QUIP_DEFAULT_URL` in `packages/apps/src/initSettings.ts` |

Both `scripts/quip*.mjs` are regeneration tools, not build steps — their outputs
are committed, so the Flux build needs no rasteriser. `quipBrandMark.mjs` asserts
the source lockup's structure, so a change in `quip-brand` fails loudly instead
of silently emitting a wrong mark.

⚠ **The accent must be zinc-950, not zinc-900.** `getMenuHoverContrast`
(`react-components/src/styles/index.ts`) only returns a white hover overlay below
brightness 16. zinc-900 `#18181b` — the brand's own `--surface-dark`, and the
intuitive pick — measures 24.2 and gets a *black* overlay instead, which on a
near-black bar is a ~1.4%/channel change and reads as no hover at all. zinc-950
measures 9.1. Both are real brand tokens; the darker one is chosen for that
mechanical reason. Verify in the browser: the emitted rule for
`.ui--MenuItem.topLevel:hover a` must be `rgba(255, 255, 255, 0.15)`.

⚠ **Coral cannot be the bar.** Against the near-white text `getContrast` pairs
with it, canonical `#FF6C78` is 2.7:1 and fails AA. Coral appears only as
`colorLink`, which paints links and small glyphs on light surfaces — exactly what
`--coral-text` is for, and an improvement on upstream's `#2e86ab` (4.1:1).
`colorBtnHighlight` in the same file is a dead export with no consumers and is
deliberately left alone.

⚠ **Fonts are deliberately NOT shipped.** ABC Gaisyr / Favorit / Favorit Mono are
licensed from Dinamo and `quip-brand` forbids serving them from a public host.
This portal is public, so no `@font-face` is added and the system fallbacks
stand. Verify with `find packages/apps/build -iname '*Favorit*' -o -iname '*Gaisyr*'`
returning nothing.

⚠ **`yarn build:www` does not typecheck** — `webpack.base.cjs` runs `ts-loader`
with `transpileOnly: true`, so a type error builds and deploys silently. Run
`npx tsc --noEmit -p tsconfig.build.json` separately.

⚠ **Run the endpoint spec with `WS_URL` unset:**
`env -u WS_URL yarn test:one packages/apps-config/src/endpoints/index.spec.ts`.
With `WS_URL` exported, `createCustom` emits an entry sharing a bootnode URL and
"urls are not duplicated" fails by construction. That is a harness artefact — do
not "fix" it by dropping a bootnode from `providers`.

⚠ **`yarn lint` runs `eslint --fix`** and rewrites files, including the vendored
signer under `packages/apps/src/quip-signer-vendor/`. Check `git status` after.

⚠ **Verifying a deploy: compare content, never status codes.** The Flux app is
served by `serve -s`, which returns 200 with `index.html` for any missing path,
so a status check is fail-open. `index.html` is the one unhashed entry point;
byte-compare it against a local build, then hash every referenced asset plus the
unhashed statics (`favicon.*`, `apple-touch-icon.png`, `manifest.json`). SRI
covers most but not all chunks, so do not treat `index.html` equality alone as
proof.

Still upstream-branded and deliberately out of scope: the GitHub/Wiki links in
`packages/apps/src/Menu/index.tsx`, the hardcoded `#3BBEFF` / `#E6007A` tooltip
links in `react-components/src/styles/components.ts`, and the stale
`packages/apps/public/ipfs/index.html` redirect.


## Docker

You can run a docker container via -

```
docker run --rm -it --name polkadot-ui -e WS_URL=ws://someip:9944 -p 80:80 jacogr/polkadot-js-apps:latest
```

To build a docker container containing local changes -

```
docker build -t jacogr/polkadot-js-apps -f docker/Dockerfile .
```

When using these Docker commands, you can access the UI via http://localhost:80 (or just http://localhost)

## IPFS

IPFS allows sharing files in a decentralized manner in a similar fashion the polkadot network exchanges blocks. IPFS works best when many nodes seed the same data. Nodes can seed specific data by **pinning** them.

You can pin with the following command:

```
curl -s https://polkadot.js.org/apps/ipfs/pin.json | jq -jr .IpfsHash | xargs -0 -I CID ipfs pin add --progress CID
```

Here is a script you can save as `/usr/local/bin/polkadotjs-ipfs-pin.sh`:

```
#!/usr/bin/env bash

IPFS='/usr/local/bin/ipfs'
curl -s https://polkadot.js.org/apps/ipfs/pin.json | jq -jr .IpfsHash | xargs -0 -I CID $IPFS pin add --progress CID
```

I suggest to run the script once. The output should be similar to (the CID/Hash will very likely be different though):
```
$ /usr/local/bin/polkadotjs-ipfs-pin.sh
pinned QmNYAbzaE8kRAf68YiN3ZuUxgdwroeav3JhicsHsG5b2oW recursively
```

Now that you know the CID (hash), you can check whether the data is already pinned or not:
```
$ ipfs pin ls | grep QmNYAbzaE8kRAf68YiN3ZuUxgdwroeav3JhicsHsG5b2oW
QmNYAbzaE8kRAf68YiN3ZuUxgdwroeav3JhicsHsG5b2oW recursive
```

Now that we know it works, we can automate that with a cron task. Run `crontab -e`.
If you see only comments, append the following to the file and save:
```
SHELL=/bin/bash
HOME=/
0 * * * * /usr/local/bin/polkadotjs-ipfs-pin.sh >/dev/null 2>&1
```

Now our script will run every hours at minute '0' (8:00, 9:00, etc...). To check, we can unpin temporarily:
```
$ ipfs pin rm QmNYAbzaE8kRAf68YiN3ZuUxgdwroeav3JhicsHsG5b2oW
unpinned QmNYAbzaE8kRAf68YiN3ZuUxgdwroeav3JhicsHsG5b2oW
```

Now asking for the CID confirms that is it not there.
```
$ ipfs pin ls QmNYAbzaE8kRAf68YiN3ZuUxgdwroeav3JhicsHsG5b2oW
Error: path 'QmNYAbzaE8kRAf68YiN3ZuUxgdwroeav3JhicsHsG5b2oW' is not pinned
```

Wait until the your cron task runs and try again:
```
$ ipfs pin ls QmNYAbzaE8kRAf68YiN3ZuUxgdwroeav3JhicsHsG5b2oW
QmNYAbzaE8kRAf68YiN3ZuUxgdwroeav3JhicsHsG5b2oW recursive
```

Tada! This is now automatic and you may forget it.

If you are curious and want to know how many people seed the UI on IPFS, here is the magic command (it may take a while to return the answer as ipfs will search for about 1 minute):
```
ipfs dht findprovs QmTejwB7mJPBHBoqubjzHSgSxfLMcjnZA3LFefqoQc87VJ | wc -l
```

If you are current about the content of what you just pinned, you may use the following command:
```
$ ipfs ls QmTejwB7mJPBHBoqubjzHSgSxfLMcjnZA3LFefqoQc87VJ
QmPJGyqVCcXm238noz7TZDByyGa35qqc8g6sfyXF3KDXZ3 38078   favicon.ico
QmdouVsVE9rMVB84Cy1ehVi1LAGW1fKcqqQxSEjgxJrv7H 668     index.html
QmWHcGf1JCFZCYjZsw52vM5RiJVbcNpX1fo2NyoBKBvtuf -       ipfs/
QmT6NwDsJzMyBs6bMq845nMumeJWbixBfNXA9hdAhAMdSG -       locales/
QmcgiZpwvpT1E1dkSS3zr5je89rZRVocNKPebgWhn3JVTC 2178582 main.ce05dfca.js
QmdnEtuhFDyw5Tjr82bFPzyveFrbkYjJAnUvBvzwT18YGG 337     manifest.json
QmW7gDKHbmtD7sRTqsvyo84bDpyYPZR3w1wQo8pme2q5HC -       next/
Qmd8UnRQiBobm4qb6dhiC1HoQ7SvwZrWJenoN3JPEV3iiF 480594  polkadotjs.3af757ad.js
QmUfXPMfNys8Y8dekuankBx7BHiSAjALCpBDKH6F5DdcNm 628284  react.0cecb00d.css
QmSEgXdQbC1ek9Td1mHy3BRvJpfWHm9zQYegTgAUj1QC4g 924156  react.8f083b49.js
QmfGBgFe2aqf83Wv21m9k5DH2ew89CDj4tydoxJWdK6NNL 1552    runtime.3d77e510.js
QmYPa8jcHH7gfopMALr5XTW4i1QM2xgVBe3NeP11y3tErA -       static/
QmeYBC5EgbccC8NEwXC2rvbd93YiHtTM5xYzqCDohXerDf 859984  vendor.8b793a81.js
```

## Desktop App

The main advantage of using Desktop App is that it by default stores encrypted accounts on the filesystem instead of browser's local storage.
Local storage is susceptible to attacks using XSS (Cross-Site Scripting). There's no such risk when with files stored on disk.

The desktop app uses the [Electron](https://www.electronjs.org/) framework. It provides the same features as web app, the only difference
being different account storage.

The accounts are stored in the following directories:
* Mac: `~/Library/Application Support/polkadot-apps/polkadot-accounts`
* Linux: `~/.config/polkadot-apps/polkadot-accounts` (or `$XDG_CONFIG_HOME/polkadot-apps/polkadot-accounts` if `$XDG_CONFIG_HOME` is defined)
* Windows: `%APPDATA%\polkadot-apps\polkadot-accounts`

For more details on the desktop app, head over to [Electron package README](https://github.com/polkadot-js/apps/blob/master/packages/apps-electron/README.md).
