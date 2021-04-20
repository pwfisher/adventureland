/* global module */
const Dotenv = require('dotenv-webpack')
const Path = require("path")

module.exports = {
  plugins: [
    new Dotenv()
  ],
  entry: {
    mage: './src/bot/mage.ts',
    merchant: './src/bot/merchant.ts',
    paladin: './src/bot/paladin.ts',
    priest: './src/bot/priest.ts',
    ranger: './src/bot/ranger.ts',
    rogue: './src/bot/rogue.ts',
    warrior: './src/bot/warrior.ts',
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    }],
  },
  optimization: {
    minimize: false
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: Path.resolve(__dirname, 'build'),
    library: 'bots',
    libraryTarget: 'window'
  }
}
