const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: "development",
  entry: './src/index.js',
  devtool: "eval",
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '.temp_cache'),
  },
  output: {
    filename: 'darkmode.js',
    path: path.resolve(__dirname, 'build/content'),
  },
};
