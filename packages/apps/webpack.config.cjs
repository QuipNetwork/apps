// Copyright 2017-2026 @polkadot/apps authors & contributors
// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { merge } = require('webpack-merge');
const { SubresourceIntegrityPlugin } = require('webpack-subresource-integrity');

const baseConfig = require('./webpack.base.cjs');

const context = __dirname;
const hasPublic = fs.existsSync(path.join(context, 'public'));

module.exports = merge(
  baseConfig(context),
  {
    devtool: process.env.BUILD_ANALYZE ? 'source-map' : false,
    output: {
      crossOriginLoading: 'anonymous'
    },
    plugins: [
      new SubresourceIntegrityPlugin(),
      new HtmlWebpackPlugin({
        // Keep in lockstep with webpack.serve.cjs, or `yarn start` shows a
        // different title from production and local checks lie.
        PAGE_TITLE: 'Quip Network — Aglais Portal',
        minify: false,
        template: path.join(context, `${hasPublic ? 'public/' : ''}index.html`)
      })
    ]
  }
);
